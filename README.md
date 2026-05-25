# DocuMind — AI-Powered Document Intelligence

> Ask questions. Get cited answers. From your own documents.

DocuMind is a production-grade **Retrieval-Augmented Generation (RAG)** application that transforms static document collections into a conversational, queryable knowledge base. Upload PDFs, Word docs, or text files — then ask anything in plain English and receive precise, source-cited answers in real time.

---

## The Problem

Knowledge is buried inside documents. A 300-page legal contract, 30 research papers, or a product manual all demand hours of manual reading to extract a single fact. Common workarounds fall short:

| Situation | Typical Workaround | Why It Fails |
|---|---|---|
| Finding a clause in a 200-page contract | Ctrl+F keyword search | No semantic understanding; misses paraphrases |
| Studying from 10 lecture PDFs | Re-read notes manually | Time-consuming; poor recall |
| Answering FAQs from a product manual | Human support agent reads the doc | Expensive, slow, not scalable |
| Summarising regulatory changes across docs | Legal analyst manually reviews | Days of work; prone to human error |
| Cross-referencing multiple reports | Copy-paste between tabs | No synthesis; context lost |

**DocuMind solves all five** by combining semantic vector search with LLM synthesis, streaming cited answers back to the user in real time.

---

## Why DocuMind — Not Just Another Chat Tool

You might ask: *ChatGPT can read documents too. Why build this?*

The difference is fundamental, not cosmetic.

**General AI assistants are stateless and ungrounded.** When you paste a document into ChatGPT, it reads it once within a single session context window, has no memory of it next session, and — critically — can hallucinate facts that were never in your document at all. There is no mechanism to verify where an answer came from.

DocuMind is architected around the opposite guarantee:

| Capability | Generic AI Chat (ChatGPT, Claude.ai) | DocuMind |
|---|---|---|
| Document memory | Lost after session ends | Persisted in vector DB — queryable forever |
| Context window limit | ~128K tokens — fails on large corpora | Chunks + retrieves only what's relevant, scales to thousands of pages |
| Answer grounding | Model may use outside knowledge | Strictly answers from your documents only |
| Source citations | Occasionally mentions sources | Every fact cited with exact filename and page number |
| Multi-document synthesis | Possible but unstructured | Workspace-scoped retrieval across all uploaded docs simultaneously |
| Data privacy | Your documents sent to a shared cloud UI | Your data stays in your own storage (S3) and your own vector index |
| Workspace organisation | None | Named workspaces — isolate Legal, Research, or Product docs separately |
| Integration | None | REST API — embed into your own product or support portal |

**The core architectural difference is RAG vs. prompt stuffing.** Tools like ChatGPT's file upload work by cramming the document into the prompt context. This breaks on anything longer than ~100 pages, loses precision as the document grows, and disappears the moment the session ends. DocuMind's ingestion pipeline converts every document into a permanent, searchable index of embeddings. Every query retrieves only the most semantically relevant chunks — so a 500-page report answers just as precisely as a 5-page one, and it's still queryable six months later.

**Source transparency is a first-class feature, not an afterthought.** In a legal, academic, or enterprise context, an answer without a verifiable source is a liability. DocuMind enforces citations at the prompt level — the model is instructed it *cannot* answer without citing the exact page it drew from. Users can inspect the raw chunk that produced any part of the answer.

---

## Who It's For

**Students** — Upload all your lecture PDFs into a workspace and ask exam-style questions across them simultaneously.

**Legal Professionals** — Query 250-page contracts for specific clauses and receive exact text with page-level citations.

**Researchers** — Synthesise findings across dozens of papers in a single query, with multi-source attribution.

**Enterprise / Support Teams** — Turn product manuals and release notes into a self-serve FAQ engine for customers.

---

## How It Works

DocuMind is built around two decoupled pipelines:

### 1. Ingestion Pipeline *(runs once per document upload)*

```
File Upload → Validation → Text Extraction → Chunking → Embedding → Vector Store → Ready
```

1. **File Upload** — User uploads a PDF, DOCX, or TXT file (up to 50 MB) via the dashboard.
2. **Validation** — Backend validates MIME type, file size, and checks for corruption before processing begins.
3. **Text Extraction** — PyMuPDF extracts PDF text (preserving page numbers), `python-docx` handles Word files. Page numbers are retained for accurate citations.
4. **Chunking** — Text is split into 512-token chunks with a 64-token overlap using `RecursiveCharacterTextSplitter`. The overlap ensures context continuity across chunk boundaries.
5. **Embedding** — Each chunk is embedded using OpenAI's `text-embedding-3-small` model (1536 dimensions), batched in groups of 100.
6. **Vector Upsert** — Embeddings and metadata (`doc_id`, `filename`, `page_number`, `workspace_id`, etc.) are stored in Pinecone (production) or Chroma (local development).
7. **Status Update** — The document record in PostgreSQL is marked `READY`. The frontend polls for status until complete.

---

### 2. Query Pipeline *(runs on every user message)*

```
User Query → [Query Expansion] → Embed → Vector Search → Context Assembly → LLM (Streaming) → Cited Answer
```

1. **Receive Query** — User message arrives via SSE POST, including `workspace_id` and the last 6 turns of conversation history.
2. **Query Expansion** *(optional)* — If the query is vague or under 10 words, GPT-4o-mini rewrites it into a richer search query without adding assumptions.
3. **Embed Query** — The query is embedded using the same `text-embedding-3-small` model for vector-space compatibility.
4. **Vector Search** — The top-4 nearest-neighbour chunks are retrieved from Pinecone/Chroma, filtered strictly by `workspace_id` to enforce data isolation.
5. **Context Assembly** — The top chunks are formatted with source metadata (`filename`, `page_number`) and concatenated into a context block.
6. **Prompt Construction** — A structured system prompt injects the context block, conversation history, and the user question. The LLM is instructed to cite every fact inline using `[filename, p.N]` format.
7. **Streaming LLM Call** — GPT-4o streams its response token-by-token. The model is constrained to answer only from the provided context — never from external knowledge.
8. **SSE Stream to Frontend** — Tokens are forwarded via Server-Sent Events as they arrive. The frontend renders markdown in real time.
9. **Persist** — After the stream completes, the full exchange (user message, assistant response, source chunks) is saved to PostgreSQL.

---

## Tech Stack

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| API Framework | FastAPI (Python 3.12) | Async REST + SSE endpoints, JWT middleware, request validation |
| LLM Orchestration | LangChain 0.2+ (LCEL) | Retrieval chains, prompt templates, streaming callbacks |
| LLM | GPT-4o / GPT-4o-mini | Answer generation / query expansion |
| Embeddings | OpenAI `text-embedding-3-small` | Convert text and queries to 1536-dim dense vectors |
| Vector Store | Pinecone (prod) / Chroma (dev) | Semantic similarity search with metadata filtering |
| Relational DB | PostgreSQL 16 + SQLAlchemy async | Users, workspaces, documents, conversations, messages |
| Migrations | Alembic | Schema versioning |
| Cache | Redis (Upstash) | Rate limit counters, SSE connection registry |
| Object Storage | AWS S3 / Cloudflare R2 | Store original uploaded files for re-processing |
| Validation | Pydantic v2 | Request/response schema validation |
| Logging | structlog | Structured logs with `trace_id`, `user_id`, latency |

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server Components for layouts, Client Components for interactivity |
| Language | TypeScript | End-to-end type safety |
| Styling | Tailwind CSS + shadcn/ui | Utility-first styling, accessible component primitives |
| Server State | React Query | Document polling, conversation history pagination |
| Global State | Zustand | Active workspace, user session, sidebar state |
| SSE Streaming | Custom `useChat` hook | Manages SSE connection, abort controller, message history |

### Infrastructure & DevOps

| Concern | Tool | Notes |
|---|---|---|
| Containerisation | Docker + Docker Compose | Unified local dev: API, frontend, Postgres, Redis, Chroma |
| Frontend Hosting | Vercel (Edge Network) | Automatic preview deploys per PR |
| Backend Hosting | Railway / AWS ECS | 2 replicas, rolling updates, health check on `GET /health` |
| CI/CD | GitHub Actions | Push to `main` → test → build Docker → push ECR → deploy |
| Error Tracking | Sentry | Release-tagged error reporting |
| Monitoring | Prometheus + Grafana | Latency metrics, query throughput |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Next.js)                   │
│        Auth · Upload · Chat UI · SSE Consumer           │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / SSE
┌──────────────────────────▼──────────────────────────────┐
│                 FastAPI Backend (Python)                 │
│    JWT Auth · Rate Limiting · Ingestion · RAG Chain     │
└────┬──────────────┬───────────────┬──────────┬──────────┘
     │              │               │          │
 ┌───▼───┐   ┌──────▼──────┐  ┌────▼───┐  ┌──▼────┐
 │  PG   │   │  Pinecone   │  │  S3    │  │ Redis │
 │  DB   │   │  (Vectors)  │  │ Files  │  │ Cache │
 └───────┘   └─────────────┘  └────────┘  └───────┘
                    │
         ┌──────────▼──────────┐
         │   OpenAI API        │
         │  Embeddings + LLM   │
         └─────────────────────┘
```

---

## API Reference (v1)

All endpoints are prefixed `/api/v1`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Authenticate and receive tokens |
| `POST` | `/auth/refresh` | Exchange refresh token for new access token |
| `POST` | `/auth/logout` | Revoke refresh token |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/documents/upload` | Upload a file and start ingestion |
| `GET` | `/documents` | List documents in a workspace |
| `GET` | `/documents/{id}/status` | Poll ingestion status |
| `GET` | `/documents/{id}/chunks` | Inspect extracted chunks |
| `DELETE` | `/documents/{id}` | Remove document, vectors, and S3 object |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/conversations` | Create a new conversation |
| `GET` | `/conversations/{id}/messages` | Paginated message history |
| `POST` | `/conversations/{id}/query` | Send a query — returns SSE stream |
| `POST` | `/conversations/{id}/messages/{mid}/feedback` | Submit thumbs up/down |

### SSE Stream Format
Each event from the query endpoint is structured JSON:
```
data: {"type":"token","content":"The vendor"}
data: {"type":"token","content":" shall indemnify..."}
data: {"type":"sources","sources":[{"filename":"contract.pdf","page":14,"text":"..."}]}
data: {"type":"done","message_id":"msg_abc123"}
data: {"type":"error","message":"Rate limit exceeded"}
```

---

## Data Models

### Core Tables (PostgreSQL)

**`users`** — `id`, `email`, `hashed_password`, `name`, `is_active`

**`workspaces`** — `id`, `user_id` → `users`, `name`, `pinecone_namespace`

**`documents`** — `id`, `workspace_id` → `workspaces`, `filename`, `s3_key`, `file_type`, `page_count`, `chunk_count`, `status` (`UPLOADING | PROCESSING | READY | FAILED`)

**`conversations`** — `id`, `workspace_id` → `workspaces`, `title`, `message_count`

**`messages`** — `id`, `conversation_id` → `conversations`, `role` (`user | assistant`), `content`, `sources` (JSONB), `feedback`, `latency_ms`, `model`

### Vector Metadata (Pinecone)
Each stored vector carries:
```json
{
  "doc_id": "uuid",
  "workspace_id": "uuid",
  "filename": "contract_v2.pdf",
  "page_number": 14,
  "chunk_index": 3,
  "chunk_text": "The vendor shall indemnify..."
}
```

---

## Local Development

### Prerequisites
- Docker & Docker Compose
- OpenAI API key
- Pinecone API key (optional — uses Chroma locally)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/documind.git
cd documind

# Configure environment
cp .env.example .env
# Fill in OPENAI_API_KEY, DATABASE_URL, JWT_SECRET_KEY, etc.

# Start all services
docker-compose up
```

Services started:
| Service | Port |
|---|---|
| Next.js frontend | `3000` |
| FastAPI backend | `8000` |
| PostgreSQL | `5432` |
| Redis | `6379` |
| Chroma (vector store) | `8001` |

Both frontend (Next.js HMR) and backend (uvicorn `--reload`) support hot reload.

### Key Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Required for embeddings and LLM calls |
| `PINECONE_API_KEY` | Required in production |
| `VECTOR_STORE` | `chroma` (local) or `pinecone` (prod) |
| `DATABASE_URL` | PostgreSQL async connection string |
| `JWT_SECRET_KEY` | 64-char hex — generate with `openssl rand -hex 32` |
| `AWS_S3_BUCKET` | Required in production for file storage |
| `RATE_LIMIT_QUERIES_PER_MIN` | Per-user query rate limit (default: 20) |

---

## Project Structure

```
documind/
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py              # App factory, lifespan, CORS
│   │   ├── config.py            # Pydantic settings from env
│   │   ├── api/v1/
│   │   │   ├── auth.py
│   │   │   ├── workspaces.py
│   │   │   ├── documents.py
│   │   │   └── conversations.py
│   │   ├── services/
│   │   │   ├── ingestion.py     # Orchestrates ingestion pipeline
│   │   │   ├── chunker.py       # LangChain text splitting
│   │   │   ├── embedder.py      # OpenAI embeddings
│   │   │   ├── vector_store.py  # Pinecone / Chroma abstraction
│   │   │   ├── query.py         # RAG chain + SSE streaming
│   │   │   └── storage.py       # S3 / R2 file upload
│   │   └── utils/
│   │       └── file_parser.py   # PDF / DOCX / TXT extraction
│   └── alembic/                 # DB migrations
│
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/          # Login, register pages
        │   └── (app)/           # Protected dashboard, chat, documents
        ├── components/
        │   ├── documents/       # UploadZone, DocumentTable, ChunkViewer
        │   └── chat/            # ChatFeed, MessageBubble, SourcesPanel
        ├── hooks/
        │   ├── useChat.ts       # SSE connection + abort controller
        │   └── useDocuments.ts  # React Query polling
        └── store/
            └── appStore.ts      # Zustand global state
```

---

## Performance Targets

| Metric | Target |
|---|---|
| First token latency (p95) | < 1.5 seconds |
| 100-page PDF ingestion | < 30 seconds |
| Upload success rate | > 99% |
| Concurrent queries supported | 50 simultaneous users |
| Retrieval precision@4 | > 85% relevant chunks |
| User answer accuracy (thumbs-up) | > 80% |

---

## Security

- **Authentication** — JWT access tokens (15 min) + refresh tokens (7 days) in `httpOnly` cookies. CSRF tokens on all mutations.
- **Workspace Isolation** — Every Pinecone query and PostgreSQL query includes a `workspace_id` filter. Users cannot access another user's data.
- **File Safety** — MIME type validation via `python-magic`, 50 MB hard limit.
- **Rate Limiting** — 20 queries/minute and 5 uploads/hour per user, enforced via SlowAPI + Redis.
- **Data Deletion** — `DELETE /documents/{id}` removes the S3 object, all Pinecone vectors, and all PostgreSQL rows atomically.

---

## Roadmap

- **Phase 1 (MVP)** — Full RAG loop: upload → ingest → chat with citations. Single user, one workspace.
- **Phase 2** — Celery worker queue, structured error monitoring (Sentry), multi-workspace support, accessibility audit.
- **Phase 3** — Auto-generated conversation titles, document summaries on upload, answer export (Markdown / PDF), Google OAuth, analytics dashboard.
- **Phase 4 (Enterprise)** — Team workspaces with role-based access, embeddable chat widget, bring-your-own OpenAI key, SAML SSO, SOC 2 readiness.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
