import { fastify } from 'fastify'
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import {
  Duration,
  Executor,
  type CommonMessage,
  type ErrorMessage,
  type ExecutorStateFields,
  type Metric,
  type NodeInformation,
  type RunState
} from './app'
import { DateTime } from 'luxon'

const app = fastify({ logger: true })

const nodes: NodeInformation[] = [
  {
    name: 'Aplha',
    role: 'master',
    ip: '127.0.0.1',
    status: 'running'
  },
  {
    name: 'Beta',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Gamma',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Aplha',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'running'
  },
  {
    name: 'Beta',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Gamma',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Aplha',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'running'
  },
  {
    name: 'Beta',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Gamma',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Aplha',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'running'
  },
  {
    name: 'Beta',
    role: 'worker',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Gamma',
    role: 'master',
    ip: '127.0.0.1',
    status: 'idle'
  }
]

const scenarioInfo: { name: string; startTime: string; running: boolean; executors: Executor[] }[] =
  [
    {
      name: 'Scenario 1',
      startTime: '2023-01-01T00:00:00.000Z',
      running: true,
      executors: [
        {
          type: 'Once'
        },
        {
          type: 'Constant',
          users: 100,
          duration: new Duration(10, 0)
        }
      ]
    },
    {
      name: 'Scenario 2',
      startTime: '2023-01-01T00:00:00.000Z',
      running: false,
      executors: [
        {
          type: 'Constant',
          users: 200,
          duration: new Duration(20, 0)
        },
        {
          type: 'PerUser',
          users: 100,
          iterations: 10
        }
      ]
    }
  ]

let runStatus: RunState = 'startable'
let updatesSent = 0

const updates: Record<string, ((ExecutorStateFields | Metric | ErrorMessage) & CommonMessage)[]> =
  {}

updates['Scenario 1'] = [
  { timestamp: 0, type: 'executor', executorId: 0, ended: false, startTime: DateTime.now() },
  {
    timestamp: 1,
    type: 'executor',
    executorId: 1,
    ended: false,
    startTime: DateTime.now(),
    totalDuration: new Duration(10)
  },
  {
    type: 'counter',
    timestamp: 2,
    executorId: 0,
    time: DateTime.now(),
    value: { tags: ['request_count'], value: 1234 }
  },
  {
    type: 'gauge',
    timestamp: 3,
    executorId: 0,
    time: DateTime.now(),
    value: { tags: ['current_users'], value: 50 }
  },
  {
    type: 'histogram',
    timestamp: 4,
    executorId: 0,
    time: DateTime.now(),
    value: { tags: ['latency_ms'], value: [100, 200, 300, 400] }
  },
  {
    type: 'vus',
    timestamp: 5,
    executorId: 0,
    time: DateTime.now(),
    value: 30
  },
  {
    type: 'rps',
    timestamp: 6,
    executorId: 0,
    time: DateTime.now(),
    value: 15.5
  },
  {
    type: 'throughput',
    timestamp: 7,
    executorId: 0,
    time: DateTime.now(),
    value: { upload: 10240, download: 20480 }
  },
  {
    type: 'success',
    timestamp: 8,
    executorId: 0,
    time: DateTime.now(),
    value: 98
  },
  {
    type: 'error',
    timestamp: 9,
    executorId: 0,
    time: DateTime.now(),
    value: 2
  },
  {
    type: 'responseTime',
    timestamp: 10,
    executorId: 0,
    time: DateTime.now(),
    value: new Duration(0.15)
  },
  { timestamp: 11, type: 'executor', executorId: 0, ended: true, startTime: DateTime.now() }
]

updates['Scenario 2'] = []

// All route definitions moved into a plugin
async function apiRoutes(app: FastifyInstance) {
  app.get('/test_information', async () => {
    return {
      status: runStatus,
      scenarios: scenarioInfo
    }
  })

  app.get('/node_information', async () => {
    return {
      name: 'node1',
      role: 'master',
      ip: '127.0.0.1',
      status: 'running'
    }
  })

  app.get('/nodes', async () => {
    return nodes
  })

  app.post('/nodes', async (request, reply) => {
    const node_info = request.body as {
      name: string
      ip: string
    }

    if (nodes.find((node) => node.name === node_info.name)) {
      return reply.status(409).send({ error: 'Resource already exists' })
    }

    nodes.push({
      name: node_info.name,
      role: 'worker',
      ip: node_info.ip,
      status: 'idle'
    })

    return reply.status(200).send(nodes)
  })

  app.route({
    method: ['GET', 'POST'],
    url: '/updates/:scenario',
    handler: async (
      request: FastifyRequest<{ Params: { scenario: string } }>,
      reply: FastifyReply
    ) => {
      const scenario = request.params.scenario
      const timestamp = Number(request.headers['x-timestamp'])
      console.log(scenario, timestamp)
      if (timestamp === undefined) {
        return reply.status(400).send({ error: 'Invalid timestamp' })
      }

      const update = updates[scenario].filter((update) => update.timestamp == timestamp)
      updatesSent = Math.max(updatesSent, timestamp)

      return reply.status(200).send(update)
    }
  })

  // POST /commands/start
  app.post('/commands/start', async (request) => {
    runStatus = 'running'
    return { result: 'Started', received: request.body }
  })

  // POST /commands/stop
  app.post('/commands/stop', async (request) => {
    runStatus = 'startable'
    return { result: 'Stopped', received: request.body }
  })

  // POST /commands/pause
  app.post('/commands/pause', async (request) => {
    runStatus = 'paused'
    return { result: 'Paused', received: request.body }
  })

  // POST /commands/plan
  app.post('/commands/plan', async (request) => {
    return { result: 'Plan initiated', received: request.body }
  })
}

// Register all routes under /api prefix
app.register(apiRoutes, { prefix: '/api' })

// Start server
app.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  console.log(`Mock server listening at ${address}`)
})
