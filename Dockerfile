# Multi-stage build for Fly.io deployment
FROM node:22-alpine AS deps
WORKDIR /app

# Install dependencies (no lockfile present, so fall back to npm install)
COPY package.json ./
RUN npm ci --include=dev || npm install

FROM node:22-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build server and client
# Pass Vite env for client build via build args
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_FRONTEND_URL
ARG VITE_API_URL
ARG VITE_DISABLE_VISITOR_TRACKING
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
	VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
	VITE_FRONTEND_URL=$VITE_FRONTEND_URL \
	VITE_API_URL=$VITE_API_URL \
	VITE_DISABLE_VISITOR_TRACKING=$VITE_DISABLE_VISITOR_TRACKING

RUN npm run build:server \
 && npm run build:frontend \
 && node -e "const fs=require('fs');const path=require('path');const src=path.join(process.cwd(),'client','dist');const dest=path.join(process.cwd(),'dist','server','public');fs.mkdirSync(dest,{recursive:true});fs.cpSync(src,dest,{recursive:true});console.log('Copied client/dist -> dist/server/public');"

# Prune dev dependencies to slim the runtime image
RUN npm prune --omit=dev || true

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy built artifacts and production deps
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "dist/server/index.cjs"]
