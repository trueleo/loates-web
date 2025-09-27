import { fastify, FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { Executor, type NodeInformation } from './app'
import type { DateTime } from 'luxon'

const app = fastify({ logger: true })

// Dummy data
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

const scenarioInfo: { name: string; startTime: string; executors: Executor[] } = [
  {
    name: 'Scenario 1',
    startTime: '2023-01-01T00:00:00.000Z',
    executors: [
      {
        type: 'Once'
      },
      {
        type: 'Constant',
        users: 100,
        duration: {
          secs: 10,
          nanos: 0
        }
      }
    ]
  }
]

// All route definitions moved into a plugin
async function apiRoutes(app: FastifyInstance) {
  app.get('/test_information', async () => {
    return {
      status: 'startable',
      scenarios: scenarioInfo,
      currentScenario: 0
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

  app.post(
    '/nodes',
    async (
      request: FastifyRequest<{
        Body: {
          name: string
          ip: string
        }
      }>,
      reply: FastifyReply
    ) => {
      const node_info = request.body
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
    }
  )

  app.route({
    method: ['GET', 'POST'],
    url: '/updates',
    handler: async () => {
      return []
    }
  })

  // POST /commands/start
  app.post('/commands/start', async (request, reply) => {
    return { result: 'Started', received: request.body }
  })

  // POST /commands/stop
  app.post('/commands/stop', async (request, reply) => {
    return { result: 'Stopped', received: request.body }
  })

  // POST /commands/plan
  app.post('/commands/plan', async (request, reply) => {
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
