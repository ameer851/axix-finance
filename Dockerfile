FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
FROM base AS dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Build application
FROM dependencies AS build
COPY . .
RUN npm run build

# Production image
FROM base AS deploy
ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy necessary files
COPY migrations ./migrations
COPY drizzle.config.ts ./drizzle.config.ts

# Expose port
EXPOSE 4000

# Set user for security
USER node

# Command to run
CMD ["node", "dist/index.js"]
