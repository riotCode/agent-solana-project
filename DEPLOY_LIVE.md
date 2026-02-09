# 🚀 Deploy SolAgent Forge HTTP Server to Production (3 minutes)

Choose **Railway** (faster, recommended) or **Fly.io**.

---

## Option 1: Railway (Recommended - 3 minutes)

### Prerequisites
- GitHub account (repo already connected)
- Railway account: https://railway.app

### Deploy Steps

1. **Go to Railway Dashboard**
   ```
   https://railway.app/dashboard
   ```

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub"
   - Select repo: `riotCode/agent-solana-project`
   - Authorize connection

3. **Railway Auto-Detects Configuration**
   - Detects `Dockerfile` automatically
   - Sets `PORT=3000`
   - No manual config needed

4. **Deploy**
   - Click "Deploy Now"
   - Wait 2-3 minutes for build + start
   - Railway assigns public URL: `https://solagent-forge-prod-XXXX.railway.app`

5. **Test Live Endpoint**
   ```bash
   curl https://solagent-forge-prod-XXXX.railway.app/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "service": "SolAgent Forge MCP Server",
     "version": "0.1.0",
     "tools": 11,
     "tests": 101
   }
   ```

6. **Test a Tool**
   ```bash
   curl -X POST https://solagent-forge-prod-XXXX.railway.app/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc": "2.0", "method": "tools/list", "params": {}, "id": 1}' \
     | head -50
   ```

---

## Option 2: Fly.io

### Prerequisites
- Fly.io account: https://fly.io
- Fly CLI installed: `curl -L https://fly.io/install.sh | sh`

### Deploy Steps

1. **Login to Fly.io**
   ```bash
   flyctl auth login
   ```

2. **Deploy**
   ```bash
   cd ../generated
   flyctl launch
   flyctl deploy
   ```

3. **Get Public URL**
   ```bash
   flyctl open /health
   ```

---

## Post-Deployment: Update Project Description

Once you have the live URL (e.g., `https://solagent-forge-prod-XXXX.railway.app`), update the project description on Colosseum to include the live link so judges can test without cloning.

---

## Verification Checklist

- [ ] `GET /health` returns 200 with correct JSON
- [ ] `POST /mcp` with `tools/list` returns 11 tools
- [ ] All tools listed:
  - [ ] scaffold_program
  - [ ] setup_testing
  - [ ] generate_docs
  - [ ] deploy_devnet
  - [ ] get_deployment_status
  - [ ] fund_keypair
  - [ ] verify_discriminators
  - [ ] get_instruction_signature
  - [ ] verify_onchain_discriminators
  - [ ] analyze_errors
  - [ ] scan_security

---

## Troubleshooting

**Port 3000 already in use (localhost only):**
```bash
pkill -f "node http-server"
```

**Deployment fails on Fly.io:**
- Ensure Dockerfile is in `../generated/` root
- Run: `flyctl logs` for error details

**Railway auto-scaling issues:**
- Check Railway dashboard for metrics
- Increase minimum machines if needed

---

## What Judges See

**Before:** Clone repo, understand MCP protocol, run complex setup  
**After:** Test live HTTP endpoint with curl examples

The live URL is the single highest-impact visibility lever for remaining 3 days.

---

See also: [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed architecture notes.
