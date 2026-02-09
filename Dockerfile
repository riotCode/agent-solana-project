# SolAgent Forge — MCP Server HTTP Wrapper
# Pure Node.js, single runtime dependency (@solana/web3.js)

FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (single dep: @solana/web3.js)
RUN npm ci --only=production

# Copy application code
COPY http-server.js ./
COPY mcp-server/ ./mcp-server/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose port (Railway/Fly.io defaults)
EXPOSE 3000

# Start HTTP server
CMD ["node", "http-server.js"]
