#!/bin/bash
# TradesPro Development Environment Setup Script
# Usage: bash scripts/setup-dev.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TradesPro Development Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================
# Check Prerequisites
# ============================================
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker from https://docker.com"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker Compose installed"

# Check Node.js (optional, for local development)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js ${NODE_VERSION} installed"
else
    echo -e "${YELLOW}⚠${NC} Node.js not found (optional for local development)"
fi

# Check Python (optional, for local development)
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓${NC} ${PYTHON_VERSION} installed"
else
    echo -e "${YELLOW}⚠${NC} Python3 not found (optional for local development)"
fi

echo ""

# ============================================
# Create .env file if not exists
# ============================================
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    
    # Generate random secrets
    SECRET_KEY=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Update .env with generated secrets
    sed -i.bak "s/SECRET_KEY=.*/SECRET_KEY=${SECRET_KEY}/" .env
    sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
    rm .env.bak
    
    echo -e "${GREEN}✓${NC} .env file created with secure random keys"
    echo -e "${YELLOW}⚠  Please review and update .env with your configuration${NC}"
else
    echo -e "${GREEN}✓${NC} .env file already exists"
fi

echo ""

# ============================================
# Create necessary directories
# ============================================
echo -e "${YELLOW}Creating directories...${NC}"

mkdir -p services/calculation-service/data/tables/2024
mkdir -p services/calculation-service/data/tables/2021
mkdir -p services/calculation-service/data/tables/2027
mkdir -p backend/uploads
mkdir -p logs
mkdir -p nginx/ssl

echo -e "${GREEN}✓${NC} Directories created"
echo ""

# ============================================
# Check if tables exist
# ============================================
echo -e "${YELLOW}Checking CEC table files...${NC}"

TABLE_DIR="services/calculation-service/data/tables/2024"
TABLES=("table2.json" "table4.json" "table5A.json" "table5C.json")
TABLES_MISSING=false

for table in "${TABLES[@]}"; do
    if [ ! -f "$TABLE_DIR/$table" ]; then
        echo -e "${RED}✗${NC} Missing: $table"
        TABLES_MISSING=true
    else
        echo -e "${GREEN}✓${NC} Found: $table"
    fi
done

if [ "$TABLES_MISSING" = true ]; then
    echo -e "${YELLOW}⚠  Some table files are missing${NC}"
    echo -e "${YELLOW}   Please copy table JSON files to: $TABLE_DIR${NC}"
fi

echo ""

# ============================================
# Install Node.js dependencies (if Node is available)
# ============================================
if command -v npm &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    cd services/calculation-service
    npm install
    cd ../..
    echo -e "${GREEN}✓${NC} Node.js dependencies installed"
    echo ""
fi

# ============================================
# Install Python dependencies (if Python is available)
# ============================================
if command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Setting up Python virtual environment...${NC}"
    cd backend
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo -e "${GREEN}✓${NC} Virtual environment created"
    fi
    
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    deactivate
    
    cd ..
    echo -e "${GREEN}✓${NC} Python dependencies installed"
    echo ""
fi

# ============================================
# Build Docker images
# ============================================
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

echo -e "${GREEN}✓${NC} Docker images built"
echo ""

# ============================================
# Start services
# ============================================
echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

echo -e "${GREEN}✓${NC} Services started"
echo ""

# ============================================
# Wait for services to be ready
# ============================================
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo "Checking service health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U tradespro_user > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL is ready"
else
    echo -e "${RED}✗${NC} PostgreSQL is not ready"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis is ready"
else
    echo -e "${RED}✗${NC} Redis is not ready"
fi

# Check Calculation Service
if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Calculation Service is ready"
else
    echo -e "${YELLOW}⚠${NC} Calculation Service is not ready yet"
fi

# Check FastAPI
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} FastAPI is ready"
else
    echo -e "${YELLOW}⚠${NC} FastAPI is not ready yet"
fi

echo ""

# ============================================
# Run database migrations
# ============================================
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose exec -T api alembic upgrade head || echo -e "${YELLOW}⚠  Migrations not run (alembic may not be configured yet)${NC}"

echo ""

# ============================================
# Summary
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Development Environment Ready!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Services:"
echo -e "  • FastAPI:           ${GREEN}http://localhost:8000${NC}"
echo -e "  • API Docs:          ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  • Calculation Service: ${GREEN}http://localhost:3001${NC}"
echo -e "  • PostgreSQL:        ${GREEN}localhost:5432${NC}"
echo -e "  • Redis:             ${GREEN}localhost:6379${NC}"
echo ""
echo "Useful commands:"
echo -e "  • View logs:         ${BLUE}docker-compose logs -f${NC}"
echo -e "  • Stop services:     ${BLUE}docker-compose down${NC}"
echo -e "  • Restart services:  ${BLUE}docker-compose restart${NC}"
echo -e "  • Run tests:         ${BLUE}bash scripts/test-all.sh${NC}"
echo ""
echo "Default admin login:"
echo -e "  • Email:    ${BLUE}admin@tradespro.com${NC}"
echo -e "  • Password: ${BLUE}admin123${NC}"
echo ""
echo -e "${YELLOW}⚠  Remember to change default passwords in production!${NC}"
echo ""