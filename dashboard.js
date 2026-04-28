// ─── Estado ───────────────────────────────────────────────
let allUndocumented = []
let searchTimeout = null

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSummary()
  loadUndocumented()
  setupSearch()
  setupFilters()
  setupSync()
})

// ─── Summary / Métricas ────────────────────────────────────
async function loadSummary() {
  const res = await fetch('/api/summary')
  if (!res.ok) return showError('Cache não encontrado. Rode <code>npm run sync</code> no terminal.')

  const { summary, byService, generatedAt } = await res.json()

  document.getElementById('m-coverage').textContent = `${summary.coveragePercent}%`
  document.getElementById('m-total').textContent = summary.total
  document.getElementById('m-documented').textContent = summary.documented
  document.getElementById('m-undocumented').textContent = summary.undocumented
  document.getElementById('m-orphaned').textContent = summary.orphaned
  document.getElementById('undoc-count').textContent = summary.undocumented

  // Barra de cobertura (anima após render)
  setTimeout(() => {
    document.getElementById('coverage-fill').style.width = `${summary.coveragePercent}%`
  }, 100)

  // Timestamp
  const ts = new Date(generatedAt).toLocaleString('pt-BR')
  document.getElementById('sync-time').textContent = `atualizado ${ts}`

  // Serviços
  renderServices(byService)
}

function renderServices(byService) {
  const list = document.getElementById('services-list')
  list.innerHTML = ''

  if (!byService?.length) {
    list.innerHTML = '<div class="loading">Nenhum dado disponível.</div>'
    return
  }

  for (const s of byService) {
    const color = s.percent >= 80 ? 'var(--ok)' : s.percent >= 50 ? 'var(--warn)' : 'var(--danger)'
    const row = document.createElement('div')
    row.className = 'service-row'
    row.innerHTML = `
      <span class="service-name">${s.service || '(sem nome)'}</span>
      <div class="service-bar-wrap">
        <div class="service-bar-fill" style="width: 0%; background: ${color}" data-width="${s.percent}"></div>
      </div>
      <span class="service-percent" style="color:${color}">${s.percent}%</span>
      <span class="service-doc">✅ ${s.documented}</span>
      <span class="service-undoc">❌ ${s.undocumented}</span>
    `
    list.appendChild(row)
  }

  // Anima barras
  setTimeout(() => {
    document.querySelectorAll('.service-bar-fill').forEach(el => {
      el.style.width = el.dataset.width + '%'
    })
  }, 150)
}

// ─── Tabela de não documentados ────────────────────────────
async function loadUndocumented() {
  const res = await fetch('/api/undocumented')
  if (!res.ok) return

  const { items } = await res.json()
  allUndocumented = items
  renderUndocTable(items)
}

function renderUndocTable(items) {
  const tbody = document.getElementById('undoc-body')
  tbody.innerHTML = ''

  for (const item of items) {
    const tr = document.createElement('tr')
    const hasPartial = item.partialMatch !== null

    tr.innerHTML = `
      <td>${item.service || '—'}</td>
      <td><code>${item.endpoint || '—'}</code></td>
      <td><span class="tag-method">${item.method || '—'}</span></td>
      <td>
        ${hasPartial
          ? `<span class="partial-match">⚠ match parcial em "${item.partialMatch.key?.split('::')[0]}"</span>`
          : `<span class="no-match">— nenhum</span>`}
      </td>
    `
    tbody.appendChild(tr)
  }
}

// ─── Filtros da tabela ─────────────────────────────────────
function setupFilters() {
  const filterService = document.getElementById('filter-service')
  const filterEndpoint = document.getElementById('filter-endpoint')

  function applyFilters() {
    const svc = filterService.value.toLowerCase()
    const ep = filterEndpoint.value.toLowerCase()
    const filtered = allUndocumented.filter(i =>
      (!svc || i.service.toLowerCase().includes(svc)) &&
      (!ep || i.endpoint.toLowerCase().includes(ep))
    )
    renderUndocTable(filtered)
  }

  filterService.addEventListener('input', applyFilters)
  filterEndpoint.addEventListener('input', applyFilters)
}

// ─── Busca global ──────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById('search-input')
  const results = document.getElementById('search-results')

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout)
    const q = input.value.trim()

    if (q.length < 2) {
      results.classList.add('hidden')
      results.innerHTML = ''
      return
    }

    searchTimeout = setTimeout(() => doSearch(q, results), 300)
  })

  // Fecha ao pressionar Escape
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      results.classList.add('hidden')
      input.value = ''
    }
  })
}

async function doSearch(q, container) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) return

  const { results, total } = await res.json()
  container.innerHTML = ''

  if (!results.length) {
    container.innerHTML = '<div class="search-result-item" style="color:var(--muted)">Nenhum resultado encontrado.</div>'
    container.classList.remove('hidden')
    return
  }

  for (const item of results.slice(0, 15)) {
    const div = document.createElement('div')
    div.className = 'search-result-item'
    const isDoc = item.coverage === 'documented'

    div.innerHTML = `
      <span class="result-badge ${isDoc ? 'doc' : 'undoc'}">${isDoc ? 'doc' : 'sem doc'}</span>
      <span>${item.service}</span>
      <code>${item.endpoint}</code>
      ${item.notionUrl ? `<a class="result-link" href="${item.notionUrl}" target="_blank">→ Notion</a>` : ''}
    `
    container.appendChild(div)
  }

  if (total > 15) {
    const more = document.createElement('div')
    more.className = 'search-result-item'
    more.style.color = 'var(--muted)'
    more.textContent = `+ ${total - 15} resultados adicionais. Refine a busca.`
    container.appendChild(more)
  }

  container.classList.remove('hidden')
}

// ─── Sync ──────────────────────────────────────────────────
function setupSync() {
  const btn = document.getElementById('btn-sync')
  btn.addEventListener('click', async () => {
    btn.classList.add('loading')
    btn.textContent = '↻ Sincronizando…'

    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()

      if (data.ok) {
        await loadSummary()
        await loadUndocumented()
        btn.textContent = '✅ Concluído'
        setTimeout(() => { btn.textContent = '↻ Sincronizar'; btn.classList.remove('loading') }, 2000)
      } else {
        btn.textContent = '❌ Erro'
        setTimeout(() => { btn.textContent = '↻ Sincronizar'; btn.classList.remove('loading') }, 3000)
      }
    } catch {
      btn.textContent = '❌ Falha de rede'
      setTimeout(() => { btn.textContent = '↻ Sincronizar'; btn.classList.remove('loading') }, 3000)
    }
  })
}

function showError(msg) {
  document.querySelector('main').insertAdjacentHTML('afterbegin', `
    <div style="background:#3d1c1c;border:1px solid var(--danger);border-radius:8px;padding:1rem 1.5rem;
    font-family:var(--mono);font-size:0.8rem;color:var(--danger);">⚠ ${msg}</div>
  `)
}
