#!/bin/bash

#############################################
# AquaFlow CRM - Vultr Deployment Script
# Server: 149.28.113.196
# Repository: https://github.com/Phoneboothmumbai/AquaFlow-CRM
#############################################

set -e  # Exit on any error

echo "=========================================="
echo "  AquaFlow CRM Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/Phoneboothmumbai/AquaFlow-CRM.git"
APP_DIR="/opt/aquaflow"
DOMAIN="149.28.113.196"  # Change to your domain if you have one

echo -e "${YELLOW}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
apt install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    nginx \
    certbot \
    python3-certbot-nginx

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo -e "${YELLOW}Step 3: Cloning repository...${NC}"
# Remove existing directory if exists
rm -rf $APP_DIR
git clone $REPO_URL $APP_DIR
cd $APP_DIR

echo -e "${YELLOW}Step 4: Creating Docker configuration files...${NC}"

# Create Backend Dockerfile
cat > $APP_DIR/backend/Dockerfile << 'DOCKERFILE'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8001

# Run the application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
DOCKERFILE

# Create Frontend Dockerfile
cat > $APP_DIR/frontend/Dockerfile << 'DOCKERFILE'
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
ENV REACT_APP_BACKEND_URL=""
RUN yarn build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE

# Create Frontend nginx.conf
cat > $APP_DIR/frontend/nginx.conf << 'NGINXCONF'
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api {
        proxy_pass http://backend:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXCONF

# Create docker-compose.yml
cat > $APP_DIR/docker-compose.yml << 'DOCKERCOMPOSE'
version: '3.8'

services:
  mongo:
    image: mongo:6
    container_name: aquaflow_mongo
    restart: always
    volumes:
      - mongo_data:/data/db
    networks:
      - aquaflow_network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: aquaflow_backend
    restart: always
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongo:27017
      - DB_NAME=aquaflow_prod
      - JWT_SECRET=${JWT_SECRET:-aquaflow-super-secure-jwt-secret-change-in-production}
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - aquaflow_network
    healthcheck:
      test: curl -f http://localhost:8001/api/health || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: aquaflow_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - aquaflow_network

volumes:
  mongo_data:
    driver: local

networks:
  aquaflow_network:
    driver: bridge
DOCKERCOMPOSE

# Create .env file for production
cat > $APP_DIR/.env << 'ENVFILE'
# Production Environment Variables
JWT_SECRET=aquaflow-production-secret-key-change-this-to-random-string
ENVFILE

echo -e "${YELLOW}Step 5: Creating backend .env file...${NC}"
cat > $APP_DIR/backend/.env << 'BACKENDENV'
MONGO_URL=mongodb://mongo:27017
DB_NAME=aquaflow_prod
JWT_SECRET=aquaflow-production-secret-key-change-this-to-random-string
BACKENDENV

echo -e "${YELLOW}Step 6: Adding health check endpoint to backend...${NC}"
# Add health check endpoint if not exists
if ! grep -q "/api/health" $APP_DIR/backend/server.py; then
    # Add health check before the last line
    sed -i '/app.include_router/i\
@api_router.get("/health")\
async def health_check():\
    return {"status": "healthy", "service": "aquaflow-api"}\
' $APP_DIR/backend/server.py
fi

echo -e "${YELLOW}Step 7: Building and starting containers...${NC}"
cd $APP_DIR
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

echo -e "${YELLOW}Step 8: Waiting for services to start...${NC}"
sleep 30

echo -e "${YELLOW}Step 9: Checking service status...${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}=========================================="
echo "  Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo -e "Your AquaFlow CRM is now running at:"
echo -e "  ${GREEN}http://$DOMAIN${NC}"
echo ""
echo -e "API endpoint:"
echo -e "  ${GREEN}http://$DOMAIN/api${NC}"
echo ""
echo -e "Default admin credentials:"
echo -e "  Email: ${YELLOW}admin@graandprix.com${NC}"
echo -e "  Password: ${YELLOW}admin123${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:     cd $APP_DIR && docker-compose logs -f"
echo "  Restart:       cd $APP_DIR && docker-compose restart"
echo "  Stop:          cd $APP_DIR && docker-compose down"
echo "  Update:        cd $APP_DIR && git pull && docker-compose up -d --build"
echo ""
echo -e "${RED}IMPORTANT: Change the JWT_SECRET in $APP_DIR/.env for production!${NC}"
