# Backend Dockerfile for Hatsun RDMS API
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/data/database.sqlite

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Create volume mount point for persistent SQLite database
RUN mkdir -p /data

EXPOSE 5000

CMD ["node", "src/server.js"]
