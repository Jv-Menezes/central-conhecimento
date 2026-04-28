import * as XLSX from 'xlsx'
import { buildKey } from '../notion/client.js'

/**
 * Lê a planilha Excel e retorna os itens normalizados.
 * O Excel representa a REALIDADE da plataforma (source of truth de endpoints/serviços).
 *
 * Colunas esperadas (case-insensitive):
 *   - service / serviço
 *   - endpoint / path
 *   - description / descrição (opcional)
 *   - method / método (opcional, ex: GET, POST)
 *   - status (opcional)
 */
export function readExcelPlatform(filePath, sheetName) {
  const workbook = XLSX.readFile(filePath)

  const sheet = sheetName
    ? workbook.Sheets[sheetName]
    : workbook.Sheets[workbook.SheetNames[0]]

  if (!sheet) {
    throw new Error(`Aba "${sheetName}" não encontrada. Abas disponíveis: ${workbook.SheetNames.join(', ')}`)
  }

  // Converte para array de objetos usando a primeira linha como cabeçalho
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  return rows.map((row, index) => normalizeRow(row, index))
}

function normalizeRow(row, index) {
  // Normaliza chaves do objeto: lowercase e sem espaços extras
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), String(v).trim()])
  )

  const service = normalized['serviço'] ?? normalized['service'] ?? normalized['nome'] ?? ''
  const endpoint = normalized['endpoint'] ?? normalized['path'] ?? ''
  const description = normalized['descrição'] ?? normalized['description'] ?? ''
  const method = normalized['method'] ?? normalized['método'] ?? ''
  const status = normalized['status'] ?? 'ativo'

  return {
    id: `excel-${index}`,
    source: 'excel',
    service,
    endpoint,
    description,
    method: method.toUpperCase(),
    status,
    url: null,
    _key: buildKey(service, endpoint),
  }
}
