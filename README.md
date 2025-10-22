# TradesPro - Electrical Load Calculation Platform

## Architecture

- **Calculation Engine**: TypeScript (Node.js microservice)
- **API Gateway**: FastAPI (Python)
- **Frontend**: Quasar/Vue 3
- **Database**: PostgreSQL
- **Cache**: Redis

## Quick Start

```bash
# Setup development environment
bash scripts/setup-dev.sh

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Project Structure

```
tradespro/
├── services/
│   └── calculation-service/  # Node.js calculation microservice
├── backend/                   # FastAPI main service
├── frontend/                  # Quasar/Vue frontend
├── scripts/                   # DevOps scripts
└── docker-compose.yml        # Docker orchestration
```

## Services

- **FastAPI**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Calculation Service**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Documentation

See `/docs` directory for detailed documentation.

## Default Credentials (Development)

- Email: admin@tradespro.com
- Password: admin123

**⚠️ Change these in production!**
