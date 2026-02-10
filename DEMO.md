# SolAgent Forge — Judge Demo Guide

**Quick Start:** Copy-paste these commands to verify our autonomous Solana development tools work.

---

## 1️⃣ HTTP Server Demo (2 minutes)

**What it proves:** MCP server is running and reachable via HTTP.

```bash
cd ../generated

# Start the HTTP server
node http-server.js &

# Wait 2 seconds for startup
sleep 2

# Health check
curl http://localhost:3000/health

# Expected output:
# {
#   "status": "ok",
#   "service": "SolAgent Forge MCP Server",
#   "version": "0.1.0",
#   "tools": 8,
#   "tests": 66
# }
```

✅ **Success criteria:**
- Server responds with `status: ok`
- Shows **8 tools** available
- Shows **66 tests** passing

### (Optional) List tools via REST

```bash
curl http://localhost:3000/tools
```

### (Optional) Call a tool via REST

```bash
# Example: Derive a PDA
curl -X POST http://localhost:3000/tools/solana_derive_pda \
  -H "Content-Type: application/json" \
  -d '{"programId":"11111111111111111111111111111111","seeds":["demo"]}'

# Example: Compute discriminator
curl -X POST http://localhost:3000/tools/solana_compute_discriminator \
  -H "Content-Type: application/json" \
  -d '{"instructionName":"initialize"}'

# Example: Get balance
curl -X POST http://localhost:3000/tools/solana_get_balance \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"11111111111111111111111111111111","cluster":"devnet"}'
```

---

## 2️⃣ Full Workflow Demo (3 minutes)

**What it proves:** Core MCP tools work end-to-end: RPC queries → PDA derivation → scaffolding.

```bash
cd ../generated

# Run the comprehensive demo
node demo-video.js

# This demonstrates:
# 1. solana_derive_pda — derives a PDA from seeds
# 2. solana_compute_discriminator — computes Anchor instruction discriminators
# 3. solana_get_balance — RPC balance query (devnet)
# 4. solana_get_account_info — RPC account data query (devnet)
# 5. solana_get_program_info — Check program deployment status (devnet)
# 6. solana_get_transaction — Parse transaction (devnet)
# 7. solana_fund_wallet — Airdrop SOL (devnet)
# 8. anchor_scaffold — generates an Anchor project skeleton
```

✅ **Success criteria:**
- Demo sections run ✅
- PDA derivation succeeds (offline, deterministic)
- Discriminator computation works (offline, deterministic)
- Scaffold generates working directory structure
- RPC calls succeed or gracefully report network issues

---

## 3️⃣ Test Suite Verification (30 seconds)

**What it proves:** 66 automated tests covering all tools pass.

```bash
cd ../generated

# Run full test suite (~4.4 seconds)
npm test

# Expected output:
# # tests 66
# # pass 66
# # fail 0
# # duration_ms ~4400
```

✅ **Success criteria:**
- 66 tests passing
- 0 failures
- All 8 tools verified

---

## 4️⃣ Code Quality Review (1 minute)

**What it proves:** Production-grade code structure and documentation.

```bash
cd ../generated

# View architecture
head -50 README.md

# See test coverage
ls tests/*.test.js

# Check tool implementations
ls mcp-server/tools/

# Verify no uncommitted changes
git status

# View recent commits
git log --oneline | head -5
```

✅ **Success criteria:**
- Clean directory structure
- All 8 tools documented
- No uncommitted changes
- Clear commit history

---

## 5️⃣ Individual Tool Demos

### Deterministic Crypto (Works Offline ✅)

**PDA Derivation**
```javascript
import { derivePda } from './mcp-server/tools/derive-pda.js';

const result = await derivePda({
  programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  seeds: ['metadata', 'mint_address']
});
// Output: { pda: '...' , bump: 255 }
```

**Discriminator Computation**
```javascript
import { computeDiscriminator } from './mcp-server/tools/compute-discriminator.js';

const result = await computeDiscriminator({
  instructionName: 'initialize'
});
// Output: { hex: '...' , bytes: [8 bytes], base64: '...' }
```

### Scaffolding (Works Offline ✅)

```javascript
import { scaffoldProgram } from './mcp-server/tools/scaffold.js';

const result = await scaffoldProgram({
  programName: 'token-vault',
  features: ['pda', 'token']
});
// Output: Directory structure ready for Anchor build
```

### RPC Tools (Require Network)

**Get Balance**
```javascript
import { getBalance } from './mcp-server/tools/get-balance.js';

const result = await getBalance({
  publicKey: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
  cluster: 'devnet'
});
// Output: { lamports: 5000000, sol: 5.0 }
```

**Get Account Info**
```javascript
import { getAccountInfo } from './mcp-server/tools/get-account-info.js';

const result = await getAccountInfo({
  publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  cluster: 'mainnet-beta'
});
// Output: { owner, lamports, data, executable }
```

---

## 📊 Verification Checklist

- [ ] HTTP server responds to /health with 8 tools + 66 tests
- [ ] demo-video.js runs without errors
- [ ] All 66 tests pass in ~4.4s
- [ ] No uncommitted changes in git
- [ ] README documents all 8 tools
- [ ] Deterministic tools (PDA, discriminator, scaffold) work offline
- [ ] RPC tools work with mocked responses in tests

---

## 🏆 What You're Seeing

**SolAgent Forge** is a **production-ready MCP server** that gives agents direct Solana primitives:

1. **8 focused MCP tools** for RPC interaction, PDA derivation, discriminator computation, and scaffolding
2. **66 comprehensive tests** verifying all tools work end-to-end
3. **Single runtime dependency** (@solana/web3.js) for minimal attack surface
4. **Pure RPC** — No Solana CLI or Anchor CLI dependencies
5. **npx-runnable** — `npx @riotagent/solagent-forge` works locally with any MCP client

---

## ❓ Questions & Debugging

**Q: Server won't start?**
A: Make sure port 3000 is free: `lsof -i :3000` and kill if needed

**Q: Tests failing?**
A: Ensure Node.js v22+ installed: `node --version`

**Q: Git showing changes?**
A: Run `git status` to check what changed, then `git diff` to review

**Q: Demo fails on network?**
A: RPC tools gracefully handle network issues. Deterministic tools (PDA, discriminator, scaffold) work offline.

---

## 📝 Summary

This demo proves **SolAgent Forge** is:
- ✅ **Functional** — 66 tests passing, all 8 tools working
- ✅ **Production-ready** — clean code, well-tested, zero CLI dependencies
- ✅ **Autonomous-friendly** — MCP protocol standard, npx-installable
- ✅ **Focused utility** — Solves core Solana agent pain points (RPC, PDA, discriminators, scaffolding)

**Design Principle:** Only tools agents genuinely can't replicate natively.
- Agents already write code → no code generation tools
- Agents already analyze errors → no error analysis tools
- But agents CAN'T access live blockchains → kept all RPC tools
- Agents HALLUCINATE PDAs & discriminators → added deterministic crypto

**Built by Riot Agent for the Colosseum Agent Hackathon**
