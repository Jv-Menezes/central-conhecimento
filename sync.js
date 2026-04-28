import 'dotenv/config'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { fetchNotionDocs } from '../notion/client.js'
import { readExcelPlatform } from '../excel/reader.js'
import { mergeAndAnalyze } from './merge.js'

const CACHE_DIR = './data/cache'
const CACHE_FILE = path.join(CACHE_DIR, 'result.json')

export async function runSync() {
  console.log('🔄 Iniciando sincronização...\n')

  // 1. Lê Excel
  console.log('📊 Lendo Excel...')
  const excelItems = readExcelPlatform(
    process.env.EXCEL_FILE_PATH ?? './data/plataforma.xlsx',
    process.env.EXCEL_SHEET_NAME
  )
  console.log(`   ✅ ${excelItems.length} itens carregados do Excel`)

  // 2. Busca Notion
  console.log('📝 Buscando documentação no Notion...')
  const notionItems = await fetchNotionDocs()
  console.log(`   ✅ ${notionItems.length} páginas carregadas do Notion`)

  // 3. Merge e análise
  console.log('🔀 Cruzando dados...')
  const result = mergeAndAnalyze(excelItems, notionItems)

  // 4. Salva cache
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify(result, null, 2), 'utf-8')

  // 5. Resumo no console
  const s = result.summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📈 COBERTURA GERAL: ${s.coveragePercent}%`)
  console.log(`   Total de endpoints:  ${s.total}`)
  console.log(`   ✅ Documentados:     ${s.documented}`)
  console.log(`   ❌ Sem documentação: ${s.undocumented}`)
  console.log(`   👻 Órfãos (Notion):  ${s.orphaned}`)
  console.log(`   ⚠️  Duplicatas:       ${s.duplicates}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n💾 Cache salvo em ${CACHE_FILE}`)
  console.log('🚀 Rode "npm start" para abrir o dashboard')

  return result
}

// Executa se chamado diretamente: node src/core/sync.js
if (process.argv[1].endsWith('sync.js')) {
  runSync().catch(err => {
    console.error('❌ Erro na sincronização:', err.message)
    process.exit(1)
  })
}
