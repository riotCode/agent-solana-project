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
#   "tools": 11,
#   "tests": 101
# }
```

✅ **Success criteria:**
- Server responds with `status: ok`
- Shows **11 tools** available
- Shows **101 tests** passing

---

## 2️⃣ Full Workflow Demo (3 minutes)

**What it proves:** All MCP tools work end-to-end: scaffold → test → security scan → deploy.

```bash
cd ../generated

# Run the comprehensive demo (shows all 11 tools)
node demo-video.js

# This runs:
# 1. scaffold_program — generates Anchor project
# 2. setup_testing — configures LiteSVM
# 3. analyze_errors — parses Rust compiler errors
# 4. scan_security — detects vulnerabilities
# 5. generate_docs — creates TypeScript clients
# 6. deploy_devnet — (ready for deployment)
# 7-11. Other tools demonstrated
```

✅ **Success criteria:**
- All 6 demo sections pass ✅
- Scaffold generates working directory structure
- Error analysis identifies issues
- Security scan reports vulnerabilities
- Documentation generation ready

---

## 3️⃣ Test Suite Verification (30 seconds)

**What it proves:** 101 automated tests covering all tools pass.

```bash
cd ../generated

# Run full test suite (2.3 seconds)
npm test

# Expected output:
# # tests 101
# # pass 101
# # fail 0
# # duration_ms ~2300
```

✅ **Success criteria:**
- 101 tests passing
- 0 failures
- All 11 tools verified

---

## 4️⃣ Code Quality Review (1 minute)

**What it proves:** Production-grade code structure and documentation.

```bash
cd ../generated

# View architecture
cat README.md | head -100

# See test coverage
ls -la tests/

# Check code organization
ls -la mcp-server/tools/

# Verify no uncommitted changes
git status

# View recent commits
git log --oneline | head -10
```

✅ **Success criteria:**
- Clean directory structure
- All tools documented
- No uncommitted changes
- Clear commit history

---

## 5️⃣ Individual Tool Demos

### Scaffold Program
```javascript
// Shows how the scaffold tool generates complete Anchor projects
import { scaffoldProgram } from './mcp-server/tools/scaffold.js';

const result = await scaffoldProgram({
  programName: 'my-vault',
  features: ['pda', 'token']
});
// Output: /data/generated/my-vault (ready to build + deploy)
```

### Security Scanner
```javascript
import { scanSecurity } from './mcp-server/tools/security-scanner.js';

const code = `
  pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
    **ctx.accounts.from_token.amount -= amount;
    Ok(())
  }
`;

const report = await scanSecurity({ code });
// Reports: ARITHMETIC_OVERFLOW, MISSING_INPUT_VALIDATION
```

### Error Analysis
```javascript
import { analyzeErrors } from './mcp-server/tools/error-analysis.js';

const error = `error[E0425]: cannot find value 'ctx' in this scope`;

const analysis = await analyzeErrors({ errorOutput: error });
// Returns: type, severity, message, and fix suggestions
```

---

## 📊 Verification Checklist

- [ ] HTTP server responds to /health with 11 tools + 101 tests
- [ ] demo-video.js runs without errors
- [ ] All 101 tests pass in ~2.3s
- [ ] No uncommitted changes in git
- [ ] README documents all tools
- [ ] Program IDs for deployed tools visible in code
- [ ] Tests cover all major code paths

---

## 🏆 What You're Seeing

**SolAgent Forge** is a **production-ready MCP server** that eliminates boilerplate for Solana development:

1. **11 working MCP tools** for scaffolding, testing, deployment, security, and documentation
2. **101 comprehensive tests** verifying all tools work end-to-end
3. **Single runtime dependency** (@solana/web3.js) for minimal attack surface
4. **Clean architecture** with separated concerns (tools, testing, validation)
5. **Real utility** — other Solana agents can use these tools immediately

---

## ❓ Questions & Debugging

**Q: Server won't start?**
A: Make sure port 3000 is free: `lsof -i :3000` and kill if needed

**Q: Tests failing?**
A: Ensure Node.js v22+ installed: `node --version`

**Q: Git showing changes?**
A: Run `git status` to check what changed, then `git diff` to review

---

## 📝 Summary

This demo proves **SolAgent Forge** is:
- ✅ **Functional** — 101 tests passing
- ✅ **Production-ready** — clean code, well-tested
- ✅ **Autonomous-friendly** — MCP protocol standard, easy to integrate
- ✅ **Real utility** — solves actual Solana development pain points

**Built by Riot Agent for the Colosseum Agent Hackathon**
