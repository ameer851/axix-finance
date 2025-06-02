import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Preparing codebase for deployment...\n');

// Remove development-only files
const filesToRemove = [
  'client/index.html', // Remove replit dev banner
  'server/emailService.test.ts',
  'client/src/services/__tests__/notificationService.test.ts',
  'client/src/hooks/__tests__/useNotifications.test.ts'
];

console.log('📁 Removing development files...');
filesToRemove.forEach(file => {
  const filePath = path.join(rootDir, file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${file}:`, error.message);
  }
});

// Create production index.html without replit script
const productionIndexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="CaraxFinance - Professional Investment Platform" />
    <meta name="keywords" content="investment, finance, portfolio, trading" />
    <meta name="author" content="CaraxFinance" />
    <title>CaraxFinance - Investment Platform</title>
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'client/index.html'), productionIndexHtml);
console.log('✅ Created production index.html');

// Clean up console.log statements in production files
const filesToClean = [
  'server/index.ts',
  'server/storage.ts',
  'server/routes.ts',
  'client/src/services/errorService.ts'
];

console.log('\n🧹 Cleaning console.log statements...');
filesToClean.forEach(file => {
  const filePath = path.join(rootDir, file);
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace console.log with conditional logging for production
      content = content.replace(
        /console\.log\(/g,
        'if (process.env.NODE_ENV !== "production") console.log('
      );
      
      // Keep console.error as they are important for debugging
      // Keep console.warn as they are important for monitoring
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning ${file}:`, error.message);
  }
});

// Update package.json for production
console.log('\n📦 Optimizing package.json...');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add production optimization scripts
packageJson.scripts['build:prod'] = 'NODE_ENV=production npm run build';
packageJson.scripts['start:prod'] = 'NODE_ENV=production node dist/index.js';
packageJson.scripts['preview'] = 'vite preview';

// Remove development dependencies that aren't needed in production
const devDepsToRemove = [
  '@replit/vite-plugin-cartographer',
  '@replit/vite-plugin-runtime-error-modal'
];

devDepsToRemove.forEach(dep => {
  if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    delete packageJson.devDependencies[dep];
    console.log(`✅ Removed dev dependency: ${dep}`);
  }
});

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Create .env.production template
console.log('\n🔧 Creating environment templates...');
const envProductionTemplate = `# Production Environment Variables
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/CaraxFinance

# CORS Configuration
CORS_ORIGIN=https://your-production-domain.com

# Session Configuration
SESSION_SECRET=your-super-secure-session-secret-here

# SMTP Configuration (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-email
SMTP_PASSWORD=your-brevo-smtp-key

# Application Configuration
PORT=5000
HOST=0.0.0.0

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
`;

fs.writeFileSync(path.join(rootDir, '.env.production.example'), envProductionTemplate);
console.log('✅ Created .env.production.example');

// Create deployment checklist
const deploymentChecklist = `# Deployment Checklist

## Pre-deployment Steps

### 1. Environment Configuration
- [ ] Set NODE_ENV=production
- [ ] Configure production database URL
- [ ] Set secure session secret
- [ ] Configure SMTP settings (Brevo)
- [ ] Set correct CORS origin
- [ ] Configure rate limiting

### 2. Database Setup
- [ ] Create production database
- [ ] Run migrations: \`npm run db:push\`
- [ ] Create admin user: \`npm run create-admin\`

### 3. Security
- [ ] Enable HTTPS in production
- [ ] Set secure headers
- [ ] Configure firewall rules
- [ ] Set up SSL certificates

### 4. Performance
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up database connection pooling
- [ ] Enable caching

### 5. Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Database performance monitoring

## Build and Deploy

\`\`\`bash
# 1. Install dependencies
npm ci --only=production

# 2. Build the application
npm run build:prod

# 3. Start the application
npm run start:prod
\`\`\`

## Post-deployment Verification

- [ ] Check application loads correctly
- [ ] Test user registration/login
- [ ] Verify email sending works
- [ ] Test admin panel access
- [ ] Check database connectivity
- [ ] Verify all API endpoints
- [ ] Test file uploads/downloads
- [ ] Check responsive design

## Backup and Recovery

- [ ] Set up automated database backups
- [ ] Test backup restoration
- [ ] Document recovery procedures
- [ ] Set up monitoring alerts
`;

fs.writeFileSync(path.join(rootDir, 'DEPLOYMENT_CHECKLIST.md'), deploymentChecklist);
console.log('✅ Created DEPLOYMENT_CHECKLIST.md');

// Update vite.config.ts for production optimization
console.log('\n⚙️ Optimizing Vite configuration...');
const viteConfigPath = path.join(rootDir, 'vite.config.ts');
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

// Remove replit plugins from production config
viteConfig = viteConfig.replace(
  /runtimeErrorOverlay\(\),/g,
  'process.env.NODE_ENV !== "production" && runtimeErrorOverlay(),'
);

viteConfig = viteConfig.replace(
  /if \(process\.env\.NODE_ENV !== "production" && process\.env\.REPL_ID !== undefined\) \{[\s\S]*?\}\s*}/,
  `if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const cartographerModule = await import("@replit/vite-plugin-cartographer");
      plugins.push(cartographerModule.cartographer());
    } catch (error) {
      // Cartographer plugin not available - continue without it
    }
  }`
);

// Add production optimizations
if (!viteConfig.includes('build: {')) {
  viteConfig = viteConfig.replace(
    'root: path.resolve(__dirname, "client"),',
    `root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['wouter'],
            ui: ['@radix-ui/react-toast', '@radix-ui/react-dialog'],
            charts: ['recharts'],
            forms: ['react-hook-form', '@hookform/resolvers'],
            query: ['@tanstack/react-query']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },`
  );
}

fs.writeFileSync(viteConfigPath, viteConfig);
console.log('✅ Optimized vite.config.ts');

// Create Dockerfile for containerized deployment
const dockerfile = `FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the application
RUN npm run build:prod

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 5000

CMD ["node", "dist/index.js"]
`;

fs.writeFileSync(path.join(rootDir, 'Dockerfile.prod'), dockerfile);
console.log('✅ Created Dockerfile.prod');

// Create docker-compose for production
const dockerComposeProduction = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://caraxfinance:password@db:5432/caraxfinance
      - SESSION_SECRET=your-super-secure-session-secret
      - CORS_ORIGIN=https://your-domain.com
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - caraxfinance-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=caraxfinance
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=caraxfinance
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - caraxfinance-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - caraxfinance-network

volumes:
  postgres_data:

networks:
  caraxfinance-network:
    driver: bridge
`;

fs.writeFileSync(path.join(rootDir, 'docker-compose.prod.yml'), dockerComposeProduction);
console.log('✅ Created docker-compose.prod.yml');

// Create nginx configuration
const nginxConfig = `events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_proxied any;
        gzip_comp_level 6;
        gzip_types
            text/plain
            text/css
            text/xml
            text/javascript
            application/json
            application/javascript
            application/xml+rss
            application/atom+xml
            image/svg+xml;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
`;

fs.writeFileSync(path.join(rootDir, 'nginx.conf'), nginxConfig);
console.log('✅ Created nginx.conf');

console.log('\n🎉 Deployment preparation completed!');
console.log('\n📋 Next Steps:');
console.log('1. Review DEPLOYMENT_CHECKLIST.md');
console.log('2. Copy .env.production.example to .env and configure');
console.log('3. Test the build: npm run build:prod');
console.log('4. Deploy using Docker: docker-compose -f docker-compose.prod.yml up -d');
console.log('\n✨ Your codebase is now ready for production deployment!');
