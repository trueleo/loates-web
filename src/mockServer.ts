import { fastify } from 'fastify'
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import {
  Duration,
  Executor,
  Rate,
  type CommonMessage,
  type ErrorMessage,
  type ExecutorStateFields,
  type Metric,
  type NodeInformation,
  type RunState,
  type TestRunInfo
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

const pastRuns: TestRunInfo[] = [
  {
    runId: '01K6MAZVW3HTR53KV3V6KY3QDZ',
    startTime: DateTime.now(),
    endTime: DateTime.now(),
    duration: Duration.fromObject({ seconds: 10 }),
    status: 'completed',
    scenario: [
      {
        name: 'Scenario 1',
        executors: [
          {
            type: 'ConstantArrivalRate',
            duration: Duration.fromObject({ seconds: 10 }),
            maxUsers: 100,
            preAllocateUsers: 50,
            rate: new Rate(50, Duration.fromObject({ seconds: 1 }))
          } as Executor,
          {
            type: 'Constant',
            duration: Duration.fromObject({ seconds: 10 }),
            users: 100
          } as Executor
        ]
      },
      {
        name: 'Scenario 2',
        executors: [
          {
            type: 'Constant',
            duration: Duration.fromObject({ seconds: 10 }),
            users: 100
          } as Executor
        ]
      }
    ]
  },
  {
    runId: '01K6MB235VRM9ZQ2S80XBBCA3K',
    startTime: DateTime.now(),
    endTime: DateTime.now(),
    duration: Duration.fromObject({ seconds: 10 }),
    status: 'stopped',
    scenario: [
      {
        name: 'Scenario 1',
        executors: [
          {
            type: 'PerUser',
            duration: Duration.fromObject({ seconds: 10 }),
            iterations: 100,
            users: 100
          } as Executor
        ]
      }
    ]
  }
]

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
      if (timestamp === undefined) {
        return reply.status(400).send({ error: 'Invalid timestamp' })
      }

      const update = updates[scenario].filter((update) => update.timestamp == timestamp)

      return reply.status(200).send(update)
    }
  })

  app.route({
    method: ['GET'],
    url: '/history',
    handler: async (
      request: FastifyRequest<{ Querystring: { start: string; end: string; timezone: string } }>,
      reply: FastifyReply
    ) => {
      const startDateTime = DateTime.fromSQL(request.query.start, {
        zone: request.query.timezone
      })
      const endDateTime = DateTime.fromSQL(request.query.end, { zone: request.query.timezone })
      if (startDateTime === undefined || endDateTime === undefined) {
        return reply.status(200).send([])
      }
      const update = pastRuns.filter(
        (run) => run.startTime >= startDateTime && run.startTime <= endDateTime
      )

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
