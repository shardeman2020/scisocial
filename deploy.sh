#!/bin/bash

# ==============================================
# SCISOCIAL DEPLOYMENT SCRIPT
# ==============================================
# This script helps deploy SciSocial to production

set -e  # Exit on error

echo "🚀 SciSocial Deployment Script"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the project root
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Deployment menu
echo "Select deployment option:"
echo "1) Deploy Frontend to Vercel"
echo "2) Deploy Backend to Render (via GitHub)"
echo "3) Build for Self-Hosted Production"
echo "4) Test Production Build Locally"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_info "Deploying Frontend to Vercel..."

        # Check if vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            print_warning "Vercel CLI not found. Installing..."
            npm install -g vercel
        fi

        cd frontend

        # Check if .env.production exists
        if [ ! -f ".env.production" ]; then
            print_warning ".env.production not found. Creating from example..."
            cp .env.production.example .env.production
            print_warning "Please edit frontend/.env.production with your values"
            read -p "Press Enter after editing .env.production..."
        fi

        print_info "Logging into Vercel..."
        vercel login

        print_info "Deploying to production..."
        vercel --prod

        print_success "Frontend deployed to Vercel!"
        print_info "Don't forget to:"
        print_info "  1. Add scisocial.pro domain in Vercel dashboard"
        print_info "  2. Configure environment variables in Vercel"
        ;;

    2)
        print_info "Preparing Backend for Render deployment..."

        # Check if git is initialized
        if [ ! -d ".git" ]; then
            print_info "Initializing git repository..."
            git init
            git add .
            git commit -m "Initial commit for production deployment"
        fi

        # Check if render.yaml exists
        if [ -f "backend/render.yaml" ]; then
            print_success "render.yaml found"
        else
            print_error "backend/render.yaml not found!"
            exit 1
        fi

        # Check if .env.production exists
        if [ ! -f "backend/.env.production" ]; then
            print_warning "backend/.env.production not found. Creating from example..."
            cp backend/.env.production.example backend/.env.production
            print_warning "Please edit backend/.env.production with your values"
        fi

        print_info "Next steps:"
        print_info "  1. Push this repository to GitHub:"
        echo ""
        echo "     git remote add origin https://github.com/YOUR_USERNAME/scisocial.git"
        echo "     git branch -M main"
        echo "     git push -u origin main"
        echo ""
        print_info "  2. Go to render.com → New → Blueprint"
        print_info "  3. Connect your GitHub repository"
        print_info "  4. Render will auto-detect backend/render.yaml"
        print_info "  5. Click 'Apply' to create services"
        print_info "  6. After deployment, open Render Shell and run:"
        echo ""
        echo "     npm run generate:embeddings"
        echo ""
        ;;

    3)
        print_info "Building for self-hosted production..."

        # Backend
        print_info "Building backend..."
        cd backend

        if [ ! -f ".env.production" ]; then
            print_warning "Creating .env.production from example..."
            cp .env.production.example .env.production
            print_warning "⚠️  IMPORTANT: Edit backend/.env.production before deploying!"
        fi

        npm install --production=false
        npm run build
        print_success "Backend built successfully"
        cd ..

        # Frontend
        print_info "Building frontend..."
        cd frontend

        if [ ! -f ".env.production" ]; then
            print_warning "Creating .env.production from example..."
            cp .env.production.example .env.production
            print_warning "⚠️  IMPORTANT: Edit frontend/.env.production before deploying!"
        fi

        npm install
        npm run build
        print_success "Frontend built successfully"
        cd ..

        print_success "Production build complete!"
        print_info ""
        print_info "Next steps for deployment:"
        print_info "  1. Copy project to server: scp -r . user@server:/var/www/scisocial"
        print_info "  2. On server, install PostgreSQL 16 + pgvector"
        print_info "  3. On server, install Redis"
        print_info "  4. On server, install PM2: npm install -g pm2"
        print_info "  5. Start services: pm2 start backend/ecosystem.config.js"
        print_info "  6. Start services: pm2 start frontend/ecosystem.config.js"
        print_info "  7. Setup Nginx (copy nginx.conf to /etc/nginx/sites-available/)"
        print_info "  8. Setup SSL: sudo certbot --nginx -d scisocial.pro"
        ;;

    4)
        print_info "Testing production build locally..."

        # Start Docker services
        print_info "Starting PostgreSQL and Redis..."
        docker-compose up -d

        sleep 3

        # Backend
        print_info "Starting backend in production mode..."
        cd backend

        if [ ! -f ".env" ]; then
            cp .env.example .env
        fi

        npm run build
        NODE_ENV=production npm run start:prod &
        BACKEND_PID=$!
        cd ..

        sleep 3

        # Frontend
        print_info "Starting frontend in production mode..."
        cd frontend

        export NEXT_PUBLIC_API_URL=http://localhost:3001
        npm run build
        npm run start &
        FRONTEND_PID=$!
        cd ..

        print_success "Services started!"
        print_info ""
        print_info "🌐 Frontend: http://localhost:3000"
        print_info "🔌 Backend: http://localhost:3001"
        print_info "❤️  Health check: http://localhost:3001/health"
        print_info ""
        print_info "Press Ctrl+C to stop all services"

        # Wait for user interrupt
        trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" INT
        wait
        ;;

    5)
        print_info "Exiting..."
        exit 0
        ;;

    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_success "Done! 🎉"
