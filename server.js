import 'dotenv/config'
import Fastify from 'fastify'
import staticPlugin from '@fastify/static'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { runSync } from './core/sync.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.resolve('./data/cache/result.json')

const fastify = Fastify({ logger: false })

// Serve o frontend estático
fastify.register(staticPlugin, {
  root: path.join(__dirname, '../public'),
  prefix: '/',
})

// --- Helpers ---

async function loadCache() {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// --- Rotas da API ---

// Resumo geral (para o dashboard)
fastify.get('/api/summary', async (req, reply) => {
  const data = await loadCache()
  if (!data) return reply.code(503).send({ error: 'Cache não encontrado. Rode npm run sync primeiro.' })
  return { summary: data.summary, byService: data.byService, generatedAt: data.generatedAt }
})

// Lista de itens não documentados (principal insight)
fastify.get('/api/undocumented', async (req, reply) => {
  const data = await loadCache()
  if (!data) return reply.code(503).send({ error: 'Cache não encontrado.' })

  const { service, q } = req.query
  let items = data.undocumented

  if (service) items = items.filter(i => i.service.toLowerCase().includes(service.toLowerCase()))
  if (q) items = items.filter(i =>
    i.endpoint.toLowerCase().includes(q.toLowerCase()) ||
    i.service.toLowerCase().includes(q.toLowerCase())
  )

  return { total: items.length, items }
})

// Busca geral por endpoint/serviço
fastify.get('/api/search', async (req, reply) => {
  const data = await loadCache()
  if (!data) return reply.code(503).send({ error: 'Cache não encontrado.' })

  const { q } = req.query
  if (!q || q.trim().length < 2) return reply.code(400).send({ error: 'Parâmetro "q" obrigatório (mín. 2 chars).' })

  const term = q.toLowerCase()
  const all = [...data.documented, ...data.undocumented]

  const results = all.filter(i =>
    i.endpoint.toLowerCase().includes(term) ||
    i.service.toLowerCase().includes(term) ||
    (i.description ?? '').toLowerCase().includes(term)
  ).slice(0, 50) // Limita a 50 resultados

  return { total: results.length, query: q, results }
})

// Itens documentados
fastify.get('/api/documented', async (req, reply) => {
  const data = await loadCache()
  if (!data) return reply.code(503).send({ error: 'Cache não encontrado.' })
  return { total: data.documented.length, items: data.documented }
})

// Órfãos (Notion sem correspondência no Excel)
fastify.get('/api/orphaned', async (req, reply) => {
  const data = await loadCache()
  if (!data) return reply.code(503).send({ error: 'Cache não encontrado.' })
  return { total: data.orphaned.length, items: data.orphaned }
})

// Trigger de re-sync via API
fastify.post('/api/sync', async (req, reply) => {
  try {
    const result = await runSync()
    return { ok: true, summary: result.summary }
  } catch (err) {
    return reply.code(500).send({ error: err.message })
  }
})

// Start
const port = Number(process.env.PORT ?? 3000)
fastify.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1) }
  console.log(`✅ Knowledge Hub rodando em http://localhost:${port}`)
  console.log(`   Dashboard: http://localhost:${port}`)
  console.log(`   API:       http://localhost:${port}/api/summary`)
})
