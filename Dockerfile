# Stage 1: Build the UI
FROM node:20 AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20

WORKDIR /app

# Install production dependencies (includes native copilot binary for linux)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy server source
COPY src/ ./src/

# Copy bridge script used to forward Work IQ MCP calls to the host relay
COPY scripts/workiq-docker-bridge.js ./scripts/workiq-docker-bridge.js

# Copy built UI from builder stage
COPY --from=builder /app/dist ./dist

# Copy skills (can also be mounted as volume)
COPY skills/ ./skills/

# Make the native copilot binary executable (if present)
RUN find node_modules/@github/copilot-linux-* -name "copilot" -exec chmod +x {} \; 2>/dev/null || true

# The certs and manifest are mounted at runtime via docker-compose
# to allow easy replacement without rebuilding

EXPOSE 52390

CMD ["node", "src/server-prod.js"]
