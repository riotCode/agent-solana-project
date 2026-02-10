# SolAgent Forge — Deployment Guide

## Quick Start: Local Testing

```bash
# Install deps
npm install

# Start HTTP server
node http-server.js

# Health check
curl http://localhost:3000/health

# Test MCP tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list", "params": {}, "id": 1}'
```

**Response:**
```json
{
  "result": {
    "tools": [
      {"name": "scaffold_program", "description": "Generate Anchor program structure..."},
      {"name": "setup_testing", "description": "Create test environment..."},
      ... (9 more tools)
    ]
  }
}
```

---

## Production Deployment: Railway

Railway is the fastest path to production (≈3 minutes).

### Prerequisites
- GitHub account with repo access (already set up)
- Railway account: https://railway.app (free tier supports this app)

### Deploy Steps

1. **Log in to Railway**
   ```bash
   # Via web: https://railway.app
   # Sign up with GitHub, authorize app
   ```

2. **Connect GitHub Repository**
   - Click "New Project" → "Deploy from GitHub"
   - Select: `riotCode/agent-solana-project`
   - Confirm connection

3. **Configure Environment**
   - Railway auto-detects Dockerfile
   - Sets `PORT=3000` automatically
   - No additional env vars needed

4. **Deploy**
   - Click "Deploy Now"
   - Wait 2-3 minutes for build + start
   - Railway assigns public URL: `https://solagent-forge-prod-xxxx.railway.app`

5. **Verify**
   ```bash
   curl https://solagent-forge-prod-xxxx.railway.app/health
   ```

6. **Test Tools**
   ```bash
   curl -X POST https://solagent-forge-prod-xxxx.railway.app/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc": "2.0", "method": "tools/list", "params": {}, "id": 1}'
   ```

---

## Alternative: Fly.io

Fly.io requires a paid account for persistent deployments, but is very fast.

```bash
# Install CLI
curl -L https://fly.io/install.sh | sh

# Deploy
flyctl launch
flyctl deploy

# Get URL
flyctl open /health
```

---

## HTTP Server Spec

### Endpoints

#### `GET /health`
Health check + service info.

**Response:**
```json
{
  "status": "ok",
  "service": "SolAgent Forge MCP Server",
  "version": "0.1.0",
  "timestamp": "2026-02-09T12:16:12.888Z",
  "tools": 11,
  "tests": 101
}
```

#### `POST /mcp`
MCP JSON-RPC 2.0 endpoint. Pass any MCP method.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {},
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { ... },
    "serverInfo": { ... }
  },
  "id": 1
}
```

---

## Common MCP Methods

### List all tools
```bash
curl -X POST https://your-deployment-url/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "params": {}, "id": 1}' | jq
```

### Scaffold a program
```bash
curl -X POST https://your-deployment-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "scaffold_program",
      "arguments": {
        "programName": "my_program",
        "features": ["pda", "token"]
      }
    },
    "id": 2
  }' | jq
```

### Analyze for security issues
```bash
curl -X POST https://your-deployment-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "scan_security",
      "arguments": {
        "code": "pub fn initialize(ctx: Context<Initialize>) { ... }"
      }
    },
    "id": 3
  }' | jq
```

---

## Docker Build Locally

```bash
# Build image
docker build -t solagent-forge .

# Run container
docker run -p 3000:3000 solagent-forge

# Test
curl http://localhost:3000/health
```

---

## Troubleshooting

**Port 3000 already in use:**
```bash
pkill -f "node http-server"
# Or use different port:
PORT=3001 node http-server.js
```

**MCP server not initializing:**
Check that `mcp-server/server.js` exists and all tools load correctly.

**Tests fail:**
```bash
npm test
# Should see: 101/101 passing
```

---

## Architecture Notes

- **HTTP Server:** 165 LOC, pure Node.js, zero native dependencies
- **MCP Wrapper:** Translates HTTP requests to MCP JSON-RPC 2.0
- **Concurrency:** Thread-safe (Node.js single-threaded event loop)
- **Statefulness:** Each HTTP request gets fresh MCP message context
- **Performance:** ~2.5s for full tool initialization, <100ms per request after

---

## Next Steps for Judges

1. **Deploy to Railway:** Follow steps above (3 minutes)
2. **Test HTTP endpoints:** Use curl examples in DEMO.md
3. **Review code:** GitHub repo with inline comments
4. **Run test suite:** `npm test` (101/101 passing)

For questions, see README.md or check DEMO.md for detailed examples.
