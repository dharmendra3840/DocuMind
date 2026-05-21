# DocuMind — AI-Powered RAG Document Assistant

Upload PDFs, DOCX, and TXT files. Chat with them using Gemini AI with cited, streaming answers.

## Quick Start

### 1. Add your credentials to `.env`

```
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=pcsk_...   # optional for local dev (uses Chroma by default)
AWS_ACCESS_KEY_ID=...        # optional for local dev (uses local disk by default)
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=documind-uploads
```

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:8000
- API Docs → http://localhost:8000/docs

### 3. Run locally (without Docker)

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, React Query |
| Backend | FastAPI, Python 3.12, SQLAlchemy async, Alembic |
| AI / Embeddings | Google Gemini (gemini-1.5-pro, embedding-001) |
| Vector Store | Chroma (local dev) / Pinecone (production) |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Storage | Local disk (dev) / AWS S3 (production) |

## Architecture

```
User → Next.js → FastAPI → Google Gemini AI
                         ↓            ↕ embeddings
                    PostgreSQL    Pinecone/Chroma
                    Redis         AWS S3
```

## Production Deployment

1. Set `VECTOR_STORE=pinecone` and fill Pinecone credentials
2. Set `STORAGE_BACKEND=s3` and fill AWS credentials
3. Deploy backend to Railway or AWS ECS using the Dockerfile
4. Deploy frontend to Vercel with `NEXT_PUBLIC_API_URL` pointing to backend

## Environment Variables

See `.env.example` for all available configuration options.
