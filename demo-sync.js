/**
 * DEMO SYNC — roda sem credenciais Notion/Excel reais.
 * Gera dados simulados e popula o cache para testar o dashboard.
 *
 * Uso: node scripts/demo-sync.js
 */

import { writeFile, mkdir } from 'fs/promises'
import { mergeAndAnalyze } from '../src/core/merge.js'
import { buildKey } from '../src/notion/client.js'

const CACHE_DIR = './data/cache'
const CACHE_FILE = `${CACHE_DIR}/result.json`

// Simula o Excel (realidade da plataforma)
const excelItems = [
  { id: 'e1',  source: 'excel', service: 'pagamentos',   endpoint: '/api/v1/charge',                      method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e2',  source: 'excel', service: 'pagamentos',   endpoint: '/api/v1/charge/:id',                  method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e3',  source: 'excel', service: 'pagamentos',   endpoint: '/api/v1/charge/:id/cancel',           method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e4',  source: 'excel', service: 'pagamentos',   endpoint: '/api/v1/refund',                      method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e5',  source: 'excel', service: 'pagamentos',   endpoint: '/api/v1/webhook',                     method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e6',  source: 'excel', service: 'usuarios',     endpoint: '/api/v1/users',                       method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e7',  source: 'excel', service: 'usuarios',     endpoint: '/api/v1/users',                       method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e8',  source: 'excel', service: 'usuarios',     endpoint: '/api/v1/users/:id',                   method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e9',  source: 'excel', service: 'usuarios',     endpoint: '/api/v1/users/:id',                   method: 'PUT',    status: 'ativo', description: '', url: null },
  { id: 'e10', source: 'excel', service: 'usuarios',     endpoint: '/api/v1/users/:id',                   method: 'DELETE', status: 'ativo', description: '', url: null },
  { id: 'e11', source: 'excel', service: 'usuarios',     endpoint: '/api/v1/auth/login',                  method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e12', source: 'excel', service: 'usuarios',     endpoint: '/api/v1/auth/refresh',                method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e13', source: 'excel', service: 'notificacoes', endpoint: '/api/v1/notifications',               method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e14', source: 'excel', service: 'notificacoes', endpoint: '/api/v1/notifications/send',          method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e15', source: 'excel', service: 'notificacoes', endpoint: '/api/v1/notifications/:id/read',      method: 'PATCH',  status: 'ativo', description: '', url: null },
  { id: 'e16', source: 'excel', service: 'notificacoes', endpoint: '/api/v1/notifications/preferences',   method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e17', source: 'excel', service: 'notificacoes', endpoint: '/api/v1/notifications/preferences',   method: 'PUT',    status: 'ativo', description: '', url: null },
  { id: 'e18', source: 'excel', service: 'relatorios',   endpoint: '/api/v1/reports/transactions',        method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e19', source: 'excel', service: 'relatorios',   endpoint: '/api/v1/reports/revenue',             method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e20', source: 'excel', service: 'relatorios',   endpoint: '/api/v1/reports/export',              method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e21', source: 'excel', service: 'relatorios',   endpoint: '/api/v1/reports/schedule',            method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e22', source: 'excel', service: 'catalogo',     endpoint: '/api/v1/products',                    method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e23', source: 'excel', service: 'catalogo',     endpoint: '/api/v1/products',                    method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e24', source: 'excel', service: 'catalogo',     endpoint: '/api/v1/products/:id',                method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e25', source: 'excel', service: 'catalogo',     endpoint: '/api/v1/products/:id',                method: 'PUT',    status: 'ativo', description: '', url: null },
  { id: 'e26', source: 'excel', service: 'catalogo',     endpoint: '/api/v1/categories',                  method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e27', source: 'excel', service: 'catalogo',     endpoint: '/api/v1/categories',                  method: 'POST',   status: 'ativo', description: '', url: null },
  { id: 'e28', source: 'excel', service: 'integracoes',  endpoint: '/api/v1/integrations',                method: 'GET',    status: 'ativo', description: '', url: null },
  { id: 'e29', source: 'excel', service: 'integracoes',  endpoint: '/api/v1/integrations/:provider/connect',    method: 'POST', status: 'ativo', description: '', url: null },
  { id: 'e30', source: 'excel', service: 'integracoes',  endpoint: '/api/v1/integrations/:provider/disconnect', method: 'DELETE', status: 'ativo', description: '', url: null },
].map(i => ({ ...i, _key: buildKey(i.service, i.endpoint) }))

// Simula o Notion (só alguns estão documentados)
const notionItems = [
  { id: 'n1', source: 'notion', service: 'pagamentos',   endpoint: '/api/v1/charge',         description: 'Cria uma nova cobrança no sistema',   status: 'Documentado', url: 'https://notion.so/charge' },
  { id: 'n2', source: 'notion', service: 'pagamentos',   endpoint: '/api/v1/charge/:id',     description: 'Retorna detalhes de uma cobrança',     status: 'Documentado', url: 'https://notion.so/charge-id' },
  { id: 'n3', source: 'notion', service: 'pagamentos',   endpoint: '/api/v1/refund',         description: 'Processa reembolso de pagamento',      status: 'Rascunho',    url: 'https://notion.so/refund' },
  { id: 'n4', source: 'notion', service: 'usuarios',     endpoint: '/api/v1/users',          description: 'Lista todos os usuários paginados',    status: 'Documentado', url: 'https://notion.so/users' },
  { id: 'n5', source: 'notion', service: 'usuarios',     endpoint: '/api/v1/auth/login',     description: 'Autenticação com email e senha',       status: 'Documentado', url: 'https://notion.so/login' },
  { id: 'n6', source: 'notion', service: 'usuarios',     endpoint: '/api/v1/auth/refresh',   description: 'Renova o access token',                status: 'Documentado', url: 'https://notion.so/refresh' },
  { id: 'n7', source: 'notion', service: 'relatorios',   endpoint: '/api/v1/reports/revenue', description: 'Relatório financeiro de receita',     status: 'Documentado', url: 'https://notion.so/revenue' },
  { id: 'n8', source: 'notion', service: 'catalogo',     endpoint: '/api/v1/products',       description: 'CRUD de produtos do catálogo',         status: 'Documentado', url: 'https://notion.so/products' },
  // Órfão — existe no Notion mas não no Excel
  { id: 'n9', source: 'notion', service: 'legacy',       endpoint: '/api/v0/old-endpoint',   description: 'Endpoint legado descontinuado',        status: 'Depreciado',  url: 'https://notion.so/legacy' },
].map(i => ({ ...i, _key: buildKey(i.service, i.endpoint) }))

const result = mergeAndAnalyze(excelItems, notionItems)

await mkdir(CACHE_DIR, { recursive: true })
await writeFile(CACHE_FILE, JSON.stringify(result, null, 2), 'utf-8')

const s = result.summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`📈 COBERTURA (DEMO): ${s.coveragePercent}%`)
console.log(`   Total:           ${s.total}`)
console.log(`   ✅ Documentados: ${s.documented}`)
console.log(`   ❌ Sem doc:      ${s.undocumented}`)
console.log(`   👻 Órfãos:       ${s.orphaned}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`\n💾 Cache salvo. Rode: npm start`)
