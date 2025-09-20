import fastify from 'fastify'
import { NodeInformation } from './app'

const app = fastify({ logger: true })

// Dummy data
const nodes = [
  {
    name: 'Aplha',
    role: 'master',
    ip: '127.0.0.1',
    status: 'running'
  },
  {
    name: 'Beta',
    role: 'master',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Gamma',
    role: 'master',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Aplha',
    role: 'master',
    ip: '127.0.0.1',
    status: 'running'
  },
  {
    name: 'Beta',
    role: 'master',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Gamma',
    role: 'master',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Aplha',
    role: 'master',
    ip: '127.0.0.1',
    status: 'running'
  },
  {
    name: 'Beta',
    role: 'master',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Gamma',
    role: 'master',
    ip: '127.0.0.1',
    status: 'idle'
  },
  {
    name: 'Aplha',
    role: 'master',
    ip: '127.0.0.1',
    status: 'running'
  },
  {
    name: 'Beta',
    role: 'master',
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

const updates = [{ id: 'update1', detail: 'Sample update' }]

// All route definitions moved into a plugin
async function apiRoutes(app) {
  // GET /node_information
  app.get('/node_information', async () => {
    return {
      name: 'node1',
      role: 'master',
      ip: '127.0.0.1',
      status: 'running'
    }
  })

  // GET /nodes
  app.get('/nodes', async () => {
    return nodes
  })

  // GET or POST /updates
  app.route({
    method: ['GET', 'POST'],
    url: '/updates',
    handler: async () => {
      return updates
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
