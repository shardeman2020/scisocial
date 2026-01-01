# Scientific Social Media Platform

A Twitter/Instagram-style social platform anchored to peer-reviewed scientific citations.

## Mission
Invite truth and researched facts into discourse; counter misinformation with citation-backed posts.

## Tech Stack

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis
- **ORM**: TypeORM
- **APIs**: Crossref, PubMed, arXiv, Semantic Scholar

### Frontend
- **Web**: Next.js + React + TypeScript
- **Mobile**: React Native (Phase 2)

## Quick Start

### Prerequisites
- Node.js v22+
- Docker & Docker Compose

### Setup

1. **Start infrastructure**:
```bash
docker-compose up -d
```

2. **Install backend dependencies**:
```bash
cd backend
npm install
```

3. **Install frontend dependencies**:
```bash
cd frontend
npm install
```

4. **Run backend** (port 3001):
```bash
cd backend
npm run start:dev
```

5. **Run frontend** (port 3000):
```bash
cd frontend
npm run dev
```

### Environment Variables

Create `backend/.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=sci_social

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key-change-in-production
```

## Features (MVP)

- ✅ Citation-anchored posts (DOI/URL required)
- ✅ Automated metadata ingestion (Crossref)
- ✅ Threaded comments
- ✅ Impact signals (journal IF, likes, source links)
- ✅ User profiles with expertise tags
- ✅ Personalized topic feeds
- ✅ Media support (images, videos)

## Development

- Backend API: http://localhost:3001
- Frontend: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Phase 1 Roadmap

- [x] Project setup
- [x] Semantic search with pgvector
- [x] Hybrid search (semantic + keyword)
- [x] Weekly digest system
- [x] AI summaries with Anthropic Claude
- [ ] Citation post creation with DOI
- [ ] Crossref metadata integration
- [ ] User authentication (JWT + Google OAuth)
- [ ] Threaded comments
- [ ] Feed generation
- [ ] Daily ingestion pipelines

## Production Deployment

### Quick Deploy

Use the interactive deployment script:

```bash
./deploy.sh
```

Options:
1. Deploy Frontend to Vercel
2. Deploy Backend to Render (via GitHub)
3. Build for Self-Hosted Production
4. Test Production Build Locally

### Deployment Options

#### Option 1: Vercel (Frontend) + Render (Backend) - Recommended

**Frontend to Vercel:**
```bash
cd frontend
npm install -g vercel
vercel --prod
```

Configure in Vercel dashboard:
- Add domain: `scisocial.pro`
- Set environment variables from `frontend/.env.production.example`

**Backend to Render:**
1. Push repository to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/) → New → Blueprint
3. Connect your repository
4. Render will detect `backend/render.yaml` and create all services
5. After deployment, run in Render Shell:
   ```bash
   npm run generate:embeddings
   ```

#### Option 2: Self-Hosted (Full Control)

See [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for complete instructions including:
- Nginx configuration
- SSL setup with Let's Encrypt
- PM2 process management
- PostgreSQL 16 + pgvector setup
- Redis configuration
- Domain configuration for `scisocial.pro`

### Configuration Files

- **Frontend:**
  - `vercel.json` - Vercel deployment config
  - `netlify.toml` - Netlify deployment config (alternative)
  - `ecosystem.config.js` - PM2 config for self-hosted
  - `.env.production.example` - Production environment template

- **Backend:**
  - `render.yaml` - Render deployment config
  - `ecosystem.config.js` - PM2 config for self-hosted
  - `.env.production.example` - Production environment template

- **Infrastructure:**
  - `nginx.conf` - Production Nginx configuration
  - `docker-compose.yml` - Local development infrastructure

### Health Checks

- Frontend: `https://scisocial.pro`
- Backend API: `https://api.scisocial.pro/health`
- Health endpoint returns:
  ```json
  {
    "status": "ok",
    "timestamp": "2025-12-27T...",
    "uptime": 12345,
    "environment": "production"
  }
  ```

### Domain Strategy

**Primary Domain:** `scisocial.pro`

Subdomains:
- `api.scisocial.pro` - Backend API
- `admin.scisocial.pro` - Admin dashboard
- `cdn.scisocial.pro` - Static assets

All other domains redirect to primary:
- `scisocial.biz` → `scisocial.pro`
- `scisocial.shop` → `scisocial.pro`
- `scisocial.store` → `scisocial.pro`
- `scisocial.us` → `scisocial.pro`
- `scisocials.com` → `scisocial.pro`

### Post-Deployment

After deploying, generate embeddings for semantic search:

```bash
# Via Render Shell or SSH
npm run generate:embeddings

# Test semantic search
curl "https://api.scisocial.pro/semantic-search?q=neuroscience"
```

For detailed deployment instructions, see [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).
