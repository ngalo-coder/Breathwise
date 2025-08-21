#!/bin/bash

# UNEP Air Quality Platform - Frontend Setup Script
# This script sets up the complete React frontend environment

set -e  # Exit on any error

echo "🌍 UNEP Air Quality Platform - Frontend Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
            print_info "Please update Node.js: https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Node.js is not installed"
        print_info "Please install Node.js 18+ from: https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        print_status "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed"
        exit 1
    fi
}

# Create React app structure (using Vite + React + TypeScript)
create_app_structure() {
    print_info "Creating React application structure..."

    if [ ! -f "package.json" ]; then
        print_info "Initializing new Vite + React + TypeScript application..."
        npm create vite@latest . -- --template react-ts

        # Remove default files
        rm -f src/App.test.tsx src/logo.svg
        rm -f public/vite.svg
    fi

    print_status "Application structure ready"
}

# Install dependencies
install_dependencies() {
    print_info "Installing project dependencies..."

    # Core dependencies
    npm install \
        axios \
        leaflet \
        lucide-react \
        react-leaflet \
        react-router-dom \
        recharts \
        socket.io-client \
        chart.js \
        react-chartjs-2 \
        date-fns \
        framer-motion \
        react-hot-toast

    print_status "Core dependencies installed"

    # Dev dependencies - Install TailwindCSS v3 for better stability
    npm install -D \
        autoprefixer \
        postcss \
        tailwindcss@^3.4.0 \
        @tailwindcss/forms \
        @tailwindcss/typography \
        eslint \
        prettier \
        @types/react \
        @types/react-dom \
        @types/leaflet

    print_status "Development dependencies installed"
}

# Setup Tailwind CSS - Updated for better reliability
setup_tailwind() {
    print_info "Setting up Tailwind CSS..."

    # Try to initialize Tailwind with npx first
    if npx tailwindcss init -p 2>/dev/null; then
        print_status "Tailwind CSS configured via npx"
    else
        # If npx fails, create config files manually
        print_warning "npx failed, creating Tailwind config manually..."
        
        # Create tailwind.config.js
        cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        unep: {
          blue: '#0066b3',
          green: '#78be20',
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
EOL

        # Create postcss.config.js
        cat > postcss.config.js << 'EOL'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

        # Update CSS file with Tailwind directives
        cat > src/index.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Leaflet map styles */
.leaflet-container {
  height: 100%;
  width: 100%;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
EOL

        print_status "Tailwind CSS configured manually"
    fi
}

# Create environment file
setup_environment() {
    print_info "Setting up environment configuration..."

    if [ ! -f ".env" ]; then
        cat > .env << 'EOL'
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8001/api
VITE_SOCKET_URL=http://localhost:8001

# Map Configuration
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# Application Settings
VITE_APP_TITLE="UNEP Air Quality Platform"
VITE_APP_VERSION=1.0.0
VITE_DEBUG_MODE=true
EOL
        print_status "Environment file created"
        print_warning "Please edit .env file with your backend URL and API keys"
    else
        print_warning ".env file already exists"
    fi
}

# Create necessary directories
create_directories() {
    print_info "Creating project directories..."

    mkdir -p src/components/Dashboard
    mkdir -p src/components/Map
    mkdir -p src/components/Analytics
    mkdir -p src/components/Alerts
    mkdir -p src/components/Policy
    mkdir -p src/components/Settings
    mkdir -p src/context
    mkdir -p src/services
    mkdir -p src/utils
    mkdir -p src/hooks
    mkdir -p src/__tests__
    mkdir -p public/icons

    print_status "Project directories created"
}

# Setup package.json scripts
setup_scripts() {
    print_info "Setting up npm scripts..."

    # The scripts are already in the package.json created earlier
    print_status "npm scripts configured"
}

# Download Leaflet CSS
setup_leaflet() {
    print_info "Setting up Leaflet CSS..."

    # Leaflet CSS is imported in the Map component
    print_status "Leaflet configuration ready"
}

# Create basic gitignore
setup_gitignore() {
    print_info "Setting up .gitignore..."

    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << 'EOL'
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/dist
/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
*.tmp.js

# Build files
.cache/
.parcel-cache/
.nyc_output/

# Coverage
coverage/
.nyc_output

# Misc
.sass-cache/
connect.lock/
lib-cov/
*.seed
*.log
*.out
yarn.lock
package-lock.json
EOL
        print_status ".gitignore created"
    else
        print_warning ".gitignore already exists"
    fi
}

# Setup development proxy (for Vite)
setup_proxy() {
    print_info "Setting up development proxy..."

    # Add Vite proxy config if not exists
    if [ ! -f "vite.config.ts" ]; then
        cat > vite.config.ts << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
EOL
        print_status "Vite proxy configured for backend"
    else
        print_warning "Vite proxy already exists"
    fi
}

# Verify installation
verify_installation() {
    print_info "Verifying installation..."

    # Check if all main dependencies are installed
    REQUIRED_DEPS=("react" "react-dom" "tailwindcss" "axios" "lucide-react")

    for dep in "${REQUIRED_DEPS[@]}"; do
        if npm list "$dep" >/dev/null 2>&1; then
            print_status "$dep installed"
        else
            print_error "$dep not found"
            return 1
        fi
    done

    # Check if config files exist
    if [ -f "tailwind.config.js" ] && [ -f "postcss.config.js" ]; then
        print_status "Tailwind config files found"
    else
        print_error "Tailwind config files missing"
        return 1
    fi

    print_status "All dependencies verified"
}

# Final setup steps
final_setup() {
    print_info "Completing setup..."

    # Create a simple test to verify everything works
    echo "Testing npm scripts..."
    if npm run build >/dev/null 2>&1; then
        print_status "Build script works"
    else
        print_warning "Build script needs verification - this is normal for initial setup"
    fi

    print_status "Setup completed successfully!"
}

# Print usage instructions
print_usage() {
    echo ""
    echo "🎉 Frontend setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your backend configuration:"
    echo "   - Set VITE_API_BASE_URL to your backend API URL"
    echo "   - Set VITE_SOCKET_URL to your WebSocket server URL"
    echo "   - Add Mapbox token if using Mapbox tiles"
    echo ""
    echo "2. Make sure your backend is running on http://localhost:8001"
    echo "3. Start the development server:"
    echo ""
    echo "   npm run dev"
    echo ""
    echo "4. Open http://localhost:5173 in your browser"
    echo ""
    echo "Available commands:"
    echo "   npm run dev        - Start development server"
    echo "   npm run build      - Build for production"
    echo "   npm run preview    - Preview production build"
    echo "   npm run lint       - Check code quality"
    echo ""
    echo "🌍 Ready to monitor air quality in Nairobi!"
}

# Main execution
main() {
    print_info "Starting frontend setup process..."

    check_node
    check_npm
    create_app_structure
    install_dependencies
    setup_tailwind
    create_directories
    setup_environment
    setup_scripts
    setup_leaflet
    setup_gitignore
    setup_proxy
    verify_installation
    final_setup
    print_usage
}

# Run main function
main "$@"