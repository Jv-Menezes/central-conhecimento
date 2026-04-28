import * as XLSX from 'xlsx'
import { mkdir } from 'fs/promises'

await mkdir('./data', { recursive: true })

const rows = [
  { Serviço: 'pagamentos', Endpoint: '/api/v1/charge', Method: 'POST', Descrição: 'Cria cobrança', Status: 'ativo' },
  { Serviço: 'pagamentos', Endpoint: '/api/v1/charge/:id', Method: 'GET', Descrição: 'Busca cobrança', Status: 'ativo' },
  { Serviço: 'pagamentos', Endpoint: '/api/v1/charge/:id/cancel', Method: 'POST', Descrição: 'Cancela cobrança', Status: 'ativo' },
  { Serviço: 'pagamentos', Endpoint: '/api/v1/refund', Method: 'POST', Descrição: 'Reembolso', Status: 'ativo' },
  { Serviço: 'pagamentos', Endpoint: '/api/v1/webhook', Method: 'POST', Descrição: 'Webhook de eventos', Status: 'ativo' },
  { Serviço: 'usuarios', Endpoint: '/api/v1/users', Method: 'GET', Descrição: 'Lista usuários', Status: 'ativo' },
  { Serviço: 'usuarios', Endpoint: '/api/v1/users', Method: 'POST', Descrição: 'Cria usuário', Status: 'ativo' },
  { Serviço: 'usuarios', Endpoint: '/api/v1/users/:id', Method: 'GET', Descrição: 'Busca usuário', Status: 'ativo' },
  { Serviço: 'usuarios', Endpoint: '/api/v1/users/:id', Method: 'PUT', Descrição: 'Atualiza usuário', Status: 'ativo' },
  { Serviço: 'usuarios', Endpoint: '/api/v1/users/:id', Method: 'DELETE', Descrição: 'Remove usuário', Status: 'ativo' },
  { Serviço: 'usuarios', Endpoint: '/api/v1/auth/login', Method: 'POST', Descrição: 'Login', Status: 'ativo' },
  { Serviço: 'usuarios', Endpoint: '/api/v1/auth/refresh', Method: 'POST', Descrição: 'Refresh token', Status: 'ativo' },
  { Serviço: 'notificacoes', Endpoint: '/api/v1/notifications', Method: 'GET', Descrição: 'Lista notificações', Status: 'ativo' },
  { Serviço: 'notificacoes', Endpoint: '/api/v1/notifications/send', Method: 'POST', Descrição: 'Envia notificação', Status: 'ativo' },
  { Serviço: 'notificacoes', Endpoint: '/api/v1/notifications/:id/read', Method: 'PATCH', Descrição: 'Marca como lida', Status: 'ativo' },
  { Serviço: 'notificacoes', Endpoint: '/api/v1/notifications/preferences', Method: 'GET', Descrição: 'Preferências', Status: 'ativo' },
  { Serviço: 'notificacoes', Endpoint: '/api/v1/notifications/preferences', Method: 'PUT', Descrição: 'Atualiza preferências', Status: 'ativo' },
  { Serviço: 'relatorios', Endpoint: '/api/v1/reports/transactions', Method: 'GET', Descrição: 'Relatório de transações', Status: 'ativo' },
  { Serviço: 'relatorios', Endpoint: '/api/v1/reports/revenue', Method: 'GET', Descrição: 'Relatório de receita', Status: 'ativo' },
  { Serviço: 'relatorios', Endpoint: '/api/v1/reports/export', Method: 'POST', Descrição: 'Exporta relatório', Status: 'ativo' },
  { Serviço: 'relatorios', Endpoint: '/api/v1/reports/schedule', Method: 'POST', Descrição: 'Agenda relatório', Status: 'ativo' },
  { Serviço: 'catalogo', Endpoint: '/api/v1/products', Method: 'GET', Descrição: 'Lista produtos', Status: 'ativo' },
  { Serviço: 'catalogo', Endpoint: '/api/v1/products', Method: 'POST', Descrição: 'Cria produto', Status: 'ativo' },
  { Serviço: 'catalogo', Endpoint: '/api/v1/products/:id', Method: 'GET', Descrição: 'Busca produto', Status: 'ativo' },
  { Serviço: 'catalogo', Endpoint: '/api/v1/products/:id', Method: 'PUT', Descrição: 'Atualiza produto', Status: 'ativo' },
  { Serviço: 'catalogo', Endpoint: '/api/v1/categories', Method: 'GET', Descrição: 'Lista categorias', Status: 'ativo' },
  { Serviço: 'catalogo', Endpoint: '/api/v1/categories', Method: 'POST', Descrição: 'Cria categoria', Status: 'ativo' },
  { Serviço: 'integracoes', Endpoint: '/api/v1/integrations', Method: 'GET', Descrição: 'Lista integrações', Status: 'ativo' },
  { Serviço: 'integracoes', Endpoint: '/api/v1/integrations/:provider/connect', Method: 'POST', Descrição: 'Conecta integração', Status: 'ativo' },
  { Serviço: 'integracoes', Endpoint: '/api/v1/integrations/:provider/disconnect', Method: 'DELETE', Descrição: 'Desconecta', Status: 'ativo' },
]

const wb = XLSX.utils.book_new()
const ws = XLSX.utils.json_to_sheet(rows)

// Largura das colunas
ws['!cols'] = [
  { wch: 18 }, { wch: 45 }, { wch: 10 }, { wch: 30 }, { wch: 10 }
]

XLSX.utils.book_append_sheet(wb, ws, 'Endpoints')
XLSX.writeFile(wb, './data/plataforma.xlsx')

console.log(`✅ plataforma.xlsx gerado com ${rows.length} endpoints`)
