import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

/**
 * Busca todos os itens do database do Notion e normaliza para o formato padrão.
 * Cada item retornado tem: { id, service, endpoint, description, status, url }
 */
export async function fetchNotionDocs() {
  const databaseId = process.env.NOTION_DATABASE_ID
  const results = []
  let cursor = undefined

  // Pagination — Notion retorna no máximo 100 itens por vez
  while (true) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    })

    for (const page of response.results) {
      results.push(normalizePage(page))
    }

    if (!response.has_more) break
    cursor = response.next_cursor
  }

  return results
}

/**
 * Normaliza uma page do Notion para o schema interno.
 * Adapte os nomes das propriedades conforme seu database.
 */
function normalizePage(page) {
  const props = page.properties

  return {
    id: page.id,
    source: 'notion',

    // Adapte o nome das propriedades ao seu database do Notion
    service: getTextValue(props['Serviço'] ?? props['Service'] ?? props['Nome']),
    endpoint: getTextValue(props['Endpoint'] ?? props['Path']),
    description: getTextValue(props['Descrição'] ?? props['Description']),
    status: getSelectValue(props['Status']),

    // URL direto para a page no Notion
    url: page.url,

    // Normalização: lowercase para matching sem case-sensitivity
    _key: buildKey(
      getTextValue(props['Serviço'] ?? props['Service'] ?? props['Nome']),
      getTextValue(props['Endpoint'] ?? props['Path'])
    ),
  }
}

// --- Helpers de extração de valores do Notion ---

function getTextValue(prop) {
  if (!prop) return ''
  if (prop.type === 'title') return prop.title.map(t => t.plain_text).join('').trim()
  if (prop.type === 'rich_text') return prop.rich_text.map(t => t.plain_text).join('').trim()
  if (prop.type === 'url') return prop.url ?? ''
  return ''
}

function getSelectValue(prop) {
  if (!prop) return ''
  if (prop.type === 'select') return prop.select?.name ?? ''
  if (prop.type === 'status') return prop.status?.name ?? ''
  return ''
}

export function buildKey(service, endpoint) {
  return `${(service ?? '').toLowerCase().trim()}::${(endpoint ?? '').toLowerCase().trim()}`
}
