# Procura

Procura is a SaaS platform designed for contractors and procurement teams who need to track, evaluate, and respond to government Request for Proposal (RFP) opportunities. The system continuously monitors RFP sources, matches opportunities against user-defined business capabilities using a relevance scoring engine, and generates structured draft responses that users can refine and export.

## Key Features

| Feature | Description |
|---|---|
| **Automated RFP Ingestion** | Built-in simulated dataset with 7 diverse government opportunities across DHS, DoD, GSA, VA, DOE, Treasury, and NGA |
| **Relevance Scoring Engine** | Multi-factor scoring (0–100) based on keyword match, capability alignment, industry fit, tag relevance, and award potential |
| **Draft Generation** | Template-based and optional AI-powered (OpenAI) proposal draft generation with structured sections |
| **Background Processing** | APScheduler pipeline for periodic ingestion and matching — configurable interval, runs independently of web requests |
| **Health Monitoring** | Comprehensive `/health`, `/health/db`, `/health/scheduler`, and `/health/full` endpoints for UptimeRobot pinging |
| **Graceful Degradation** | Frontend detects backend status and falls back to cached mock data without breaking UX |
| **Fully Static Frontend** | React SPA deployable to GitHub Pages with zero backend dependency for rendering |

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | FastAPI (Python 3.12) |
| **Database** | PostgreSQL 16 with pg_trgm |
| **ORM** | SQLAlchemy 2.0 |
| **Background Jobs** | APScheduler 3.10 |
| **AI Integration** | OpenAI API (optional — system functions without it) |
| **Frontend** | React 18 + Vite |
| **Styling** | TailwindCSS 3.4 |
| **Deployment** | Render (backend), GitHub Pages (frontend) |
| **Containerization** | Docker / docker-compose |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Basic health check |
| GET | `/health/full` | Comprehensive health check (DB + scheduler) |
| POST | `/api/users` | Create user profile |
| GET | `/api/users` | List users |
| GET | `/api/users/{id}` | Get user by ID |
| PUT | `/api/users/{id}` | Update user profile |
| DELETE | `/api/users/{id}` | Delete user |
| GET | `/api/rfps` | List RFP listings (with search, filter) |
| GET | `/api/rfps/{id}` | Get RFP by ID |
| GET | `/api/rfps/stats/summary` | RFP statistics |
| GET | `/api/matches` | List matches for a user |
| GET | `/api/matches/{id}` | Get match by ID |
| PATCH | `/api/matches/{id}/read` | Mark match as read |
| PATCH | `/api/matches/{id}/status` | Update match status |
| POST | `/api/drafts` | Generate a new proposal draft |
| GET | `/api/drafts` | List drafts for a user |
| GET | `/api/drafts/{id}` | Get draft by ID |
| PUT | `/api/drafts/{id}` | Update draft content |
| POST | `/api/responses` | Save a response |
| GET | `/api/responses` | List saved responses |
| GET | `/api/responses/{id}` | Get response by ID |
| PUT | `/api/responses/{id}` | Update response |
| DELETE | `/api/responses/{id}` | Delete response |

## License

MIT
