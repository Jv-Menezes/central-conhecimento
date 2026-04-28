/**
 * MERGE ENGINE
 * Cruza os dados do Excel (realidade) com o Notion (documentação).
 * Retorna métricas de cobertura e itens classificados.
 */

/**
 * @param {Array} excelItems  - itens normalizados do Excel
 * @param {Array} notionItems - itens normalizados do Notion
 * @returns {Object} resultado do merge com métricas
 */
export function mergeAndAnalyze(excelItems, notionItems) {
  // Mapa de lookup: key -> item do Notion
  const notionMap = new Map(notionItems.map(item => [item._key, item]))

  const documented = []
  const undocumented = []
  const duplicates = []

  // Detecta duplicatas no Excel
  const seenKeys = new Map()
  for (const item of excelItems) {
    if (seenKeys.has(item._key)) {
      duplicates.push({ ...item, duplicateOf: seenKeys.get(item._key) })
    } else {
      seenKeys.set(item._key, item)
    }
  }

  // Único por key (deduplica Excel)
  const uniqueExcel = [...seenKeys.values()]

  // Classifica cada item do Excel
  for (const excelItem of uniqueExcel) {
    const notionMatch = notionMap.get(excelItem._key)

    if (notionMatch) {
      documented.push({
        ...excelItem,
        notionUrl: notionMatch.url,
        notionDescription: notionMatch.description,
        notionStatus: notionMatch.status,
        coverage: 'documented',
      })
    } else {
      // Tenta match parcial (só pelo serviço, sem endpoint exato)
      const partialMatch = findPartialMatch(excelItem, notionMap)
      undocumented.push({
        ...excelItem,
        coverage: 'undocumented',
        partialMatch: partialMatch ?? null,
      })
    }
  }

  // Itens no Notion que não aparecem no Excel (documentação órfã)
  const excelKeys = new Set(uniqueExcel.map(i => i._key))
  const orphaned = notionItems.filter(i => !excelKeys.has(i._key))

  const total = uniqueExcel.length
  const coveredCount = documented.length
  const coveragePercent = total > 0 ? Math.round((coveredCount / total) * 100) : 0

  // Agrupa por serviço para o dashboard
  const byService = groupByService(documented, undocumented)

  return {
    summary: {
      total,
      documented: coveredCount,
      undocumented: undocumented.length,
      orphaned: orphaned.length,
      duplicates: duplicates.length,
      coveragePercent,
    },
    documented,
    undocumented,
    orphaned,
    duplicates,
    byService,
    generatedAt: new Date().toISOString(),
  }
}

// Tenta match parcial pelo serviço (sem endpoint)
function findPartialMatch(excelItem, notionMap) {
  const serviceKey = excelItem.service.toLowerCase().trim()
  for (const [key, notionItem] of notionMap.entries()) {
    if (key.startsWith(`${serviceKey}::`)) {
      return { key, notionItem }
    }
  }
  return null
}

function groupByService(documented, undocumented) {
  const map = {}

  for (const item of documented) {
    if (!map[item.service]) map[item.service] = { service: item.service, documented: 0, undocumented: 0 }
    map[item.service].documented++
  }

  for (const item of undocumented) {
    if (!map[item.service]) map[item.service] = { service: item.service, documented: 0, undocumented: 0 }
    map[item.service].undocumented++
  }

  return Object.values(map).map(s => ({
    ...s,
    total: s.documented + s.undocumented,
    percent: Math.round((s.documented / (s.documented + s.undocumented)) * 100),
  })).sort((a, b) => a.percent - b.percent) // Piores primeiro
}
