# TradesPro - Electrical Load Calculation Platform

[![Status](https://img.shields.io/badge/status-MVP%20Complete-success)](./MVP状态检查.md)
[![Backend](https://img.shields.io/badge/backend-FastAPI-blue)](./backend)
[![Frontend](https://img.shields.io/badge/frontend-Vue%203-green)](./frontend)

> Professional electrical load calculation platform for engineers and contractors

## 🎯 Overview

TradesPro is a comprehensive electrical load calculation platform that helps electrical engineers and contractors perform accurate CEC (Canadian Electrical Code) compliant load calculations for various building types.

## ✨ Features

### ✅ MVP Features (Completed)

- **User Authentication**: Secure login and registration system
- **Project Management**: Create, view, update, and delete projects
- **Load Calculation**: Single-dwelling (CEC 8-200) calculation engine
- **Real-time Results**: Instant calculation results with detailed breakdown
- **Project History**: Track all calculations per project
- **Multi-language**: Support for English, Chinese, and French

### 🚧 Planned Features

- Calculation signing and audit trail
- PDF report generation
- Multiple building types (apartments, schools, hospitals, etc.)
- Advanced reporting and analytics

## 🏗️ Architecture

```
TradesPro/
├── frontend/          # Vue 3 + Quasar Framework
├── backend/           # FastAPI (Python)
├── services/
│   └── calculation-service/  # Node.js calculation engine
└── docker-compose.yml # Docker orchestration
```

### Technology Stack

- **Frontend**: Vue 3, Quasar Framework, Pinia, TypeScript
- **Backend**: FastAPI (Python), SQLAlchemy, PostgreSQL
- **Calculation Engine**: Node.js, TypeScript
- **Database**: PostgreSQL (Docker)
- **Cache**: Redis (Docker)
- **Containerization**: Docker & Docker Compose

## 🌐 Local Web Server Setup

If you want to run the application on your local machine and access it from the internet (e.g., using Telus dynamic IP), see:

- **[Local Web Server Setup Guide](./LOCAL_WEB_SERVER_SETUP.md)** - Complete guide for setting up local web server
- **[Local Server Quick Start](./LOCAL_SERVER_QUICK_START.md)** - 5-minute quick start (Cloudflare Tunnel recommended)

**Recommended**: Use **Cloudflare Tunnel** - no router configuration needed, automatic HTTPS, and completely free!

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tradespro.git
cd tradespro

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
quasar dev

# Calculation Service
cd services/calculation-service
npm install
npm run dev
```

## 🌐 Service Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Vue.js application |
| Backend API | http://localhost:8000 | FastAPI backend |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Calculation Service | http://localhost:3001 | Node.js calculation engine |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## 📚 Documentation

- [MVP Status Check](./MVP状态检查.md) - Current MVP status and features
- [Housekeeping Checklist](./HOUSEKEEPING_CHECKLIST.md) - Code cleanup status
- [Database Setup](./backend/DOCKER_DATABASE_SETUP.md) - Database configuration
- [API Documentation](./backend/app/routes/) - API endpoint documentation

## 🧪 Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

### Code Quality

- ESLint for frontend
- Black & Flake8 for backend
- TypeScript for type safety

## 📝 API Documentation

Visit http://localhost:8000/docs for interactive API documentation with Swagger UI.

### Key Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/projects` - List user projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project
- `POST /api/v1/calculations` - Execute calculation

## 🔐 Default Credentials (Development)

⚠️ **Change these in production!**

- Email: admin@tradespro.com
- Password: admin123

**⚠️ Change these in production!**
