# ⬡ Knowledge Hub

Central de Conhecimento que cruza **Excel** (realidade da plataforma) com **Notion** (documentação existente) para medir cobertura e identificar o que **NÃO** está documentado.

## Stack

- **Fastify** — API e servidor do dashboard
- **@notionhq/client** — integração com Notion API
- **xlsx** — leitura de planilhas Excel
- Frontend puro (HTML/CSS/JS vanilla) sem build step

---

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`:

```
NOTION_TOKEN=secret_xxxx          # Token da integração Notion
NOTION_DATABASE_ID=xxxx           # ID do database do Notion
EXCEL_FILE_PATH=./data/plataforma.xlsx
EXCEL_SHEET_NAME=Endpoints        # Nome da aba (opcional)
PORT=3000
```

**Como obter o NOTION_TOKEN:**
1. Acesse https://www.notion.so/my-integrations
2. Crie uma nova integração
3. Copie o "Internal Integration Token"
4. Compartilhe o database com a integração (botão "Connect to" na página do Notion)

**Como obter o NOTION_DATABASE_ID:**
- Abra o database no Notion no navegador
- A URL será: `notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`
- O ID é os 32 caracteres antes do `?`

### 3. Preparar o Excel

A planilha precisa ter (nomes de coluna flexíveis):

| Serviço | Endpoint | Method | Descrição | Status |
|---------|----------|--------|-----------|--------|
| pagamentos | /api/v1/charge | POST | Cria cobrança | ativo |
| usuarios | /api/v1/users | GET | Lista usuários | ativo |

### 4. Configurar o Notion database

O database do Notion precisa ter propriedades (nomes flexíveis):
- `Serviço` ou `Service` — título/texto
- `Endpoint` ou `Path` — texto
- `Descrição` ou `Description` — texto
- `Status` — select

---

## Uso

### Sincronizar dados (gera o cache)

```bash
npm run sync
```

Output esperado:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 COBERTURA GERAL: 62%
   Total de endpoints:  87
   ✅ Documentados:     54
   ❌ Sem documentação: 33
   👻 Órfãos (Notion):  8
   ⚠️  Duplicatas:       3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Abrir o dashboard

```bash
npm start
# Acesse: http://localhost:3000
```

---

## API Endpoints

| Rota | Descrição |
|------|-----------|
| `GET /api/summary` | Métricas gerais + por serviço |
| `GET /api/undocumented` | Lista sem documentação (filtros: `?service=X&q=Y`) |
| `GET /api/documented` | Lista documentada |
| `GET /api/orphaned` | Docs no Notion sem match no Excel |
| `GET /api/search?q=termo` | Busca global |
| `POST /api/sync` | Dispara re-sync pelo dashboard |

---

## Estrutura do projeto

```
knowledge-hub/
├── src/
│   ├── notion/
│   │   └── client.js       # Busca e normaliza dados do Notion
│   ├── excel/
│   │   └── reader.js       # Lê e normaliza planilha Excel
│   ├── core/
│   │   ├── merge.js        # Cruza as fontes e calcula cobertura
│   │   └── sync.js         # Runner de sincronização (CLI)
│   └── server.js           # Fastify API + serve frontend
├── public/
│   ├── index.html
│   ├── css/dashboard.css
│   └── js/dashboard.js
├── data/
│   ├── plataforma.xlsx     # Seu arquivo Excel aqui
│   └── cache/result.json   # Gerado pelo sync
├── .env.example
└── package.json
```

## Customizações comuns

**Nomes de coluna diferentes no Excel ou Notion:**
→ Edite `src/excel/reader.js` (função `normalizeRow`) e `src/notion/client.js` (função `normalizePage`)

**Mais campos no dashboard:**
→ Adicione ao `merge.js` e renderize no `public/js/dashboard.js`

**Agendar sync automático:**
→ Use cron + `npm run sync` ou adicione `node-cron` ao `server.js`
