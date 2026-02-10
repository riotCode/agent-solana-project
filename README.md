# SolAgent Forge 🏗️

**Solana RPC interaction, PDA derivation, and Anchor scaffolding for autonomous agents**

An MCP (Model Context Protocol) server and HTTP API that provides AI agents with 11 comprehensive tools for direct Solana blockchain interaction, Program Derived Address (PDA) cryptography, and Anchor program development.

---

## ⚡ Quick Start

**Install and use via npx:**

```bash
# Run MCP server directly
npx @riotagent/solagent-forge

# Or configure in your MCP client (Claude Desktop, etc.)
{
  "mcpServers": {
    "solagent-forge": {
      "command": "npx",
      "args": ["-y", "@riotagent/solagent-forge"]
    }
  }
}
```

**HTTP Server (for REST API access):**

```bash
# Clone and install
git clone https://github.com/riotCode/agent-solana-project.git
cd agent-solana-project
npm install

# Run tests (74 passing in ~4.6s)
npm test

# Start HTTP server
node http-server.js &

# Verify health endpoint
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"SolAgent Forge MCP Server","tools":11,"tests":74}
```

---

## What's Built

### 11 MCP Tools (Production-Ready)

#### Scaffolding & Security (2 tools)
| Tool | Purpose | Tests |
|------|---------|-------|
| `scaffold_program` | Generate Anchor program structure with PDA/CPI/token templates | ✅ 5 |
| `scan_security` | Detect 7 vulnerability patterns (reentrancy, overflow, oracle, etc.) | ✅ 50 |

#### Deployment & On-Chain Interaction (3 tools)
| Tool | Purpose | Tests |
|------|---------|-------|
| `deploy_devnet` | Build, deploy, and verify programs on Solana devnet | ✅ 3 |
| `get_deployment_status` | Check if a program is deployed on-chain | ✅ Integrated |
| `verify_onchain_discriminators` | Verify program IDL matches on-chain state | ✅ 3 |

#### RPC & Blockchain Queries (5 tools)
| Tool | Purpose | Tests |
|------|---------|-------|
| `derive_pda` | Derive Program Derived Addresses from seeds + program ID | ✅ 5 |
| `get_account_info` | Fetch raw account data from Solana blockchain | ✅ 3 |
| `get_balance` | Get SOL balance for any public key | ✅ 3 |
| `get_program_accounts` | Query all accounts owned by a program | ✅ 3 |
| `parse_transaction` | Fetch and parse transaction details (instructions, balances, logs) | ✅ 3 |

#### Utilities (1 tool)
| Tool | Purpose | Tests |
|------|---------|-------|
| `fund_keypair` | Airdrop SOL to devnet keypairs for testing | ✅ Integrated |

**Total: 11 tools, 74 tests passing**

---

## Why This Matters

### For Autonomous Agents

**Before:**
- Agents had to use high-level Anchor workflow abstractions
- No direct blockchain state inspection
- No PDA derivation capability
- Limited RPC interaction

**After (SolAgent Forge):**
- **Direct RPC access** — Query account data, balances, transactions
- **PDA derivation** — Critical for Solana program development
- **Lower-level primitives** — More flexible, composable tools
- **End-to-end workflow** — Scaffold → Deploy → Verify → Secure

### Key Use Cases

1. **PDA-based programs** — Derive PDAs before scaffolding
2. **Account inspection** — Verify on-chain state during development
3. **Balance monitoring** — Track SOL balances for test wallets
4. **Transaction forensics** — Parse and analyze past transactions
5. **Program account queries** — Find all accounts for a program
6. **Security scanning** — Detect vulnerabilities before deployment

---

## Architecture

### Tech Stack
- **Runtime:** Node.js 22+ (ESM modules)
- **Protocol:** MCP JSON-RPC 2.0
- **Dependency:** @solana/web3.js (single runtime dependency)
- **Testing:** Node.js native test runner (74 tests, 4.6s)
- **Deployment:** Railway, Fly.io, or local (zero-config)

### Tool Implementation
- **1,705 LOC** across 11 tools
- **Input validation** on all parameters (regex, enums, PublicKey checks)
- **Error handling** with detailed messages
- **Cluster support** (devnet, testnet, mainnet-beta, localhost)
- **Custom RPC URLs** supported on all RPC tools

---

## Project Structure

```
agent-solana-project/
├── mcp-server/
│   ├── index.js              # MCP server entry point
│   ├── server.js             # Tool registration + routing
│   └── tools/
│       ├── scaffold.js       # Anchor program scaffolding
│       ├── deploy.js         # Devnet deployment
│       ├── security-scanner.js
│       ├── verify-onchain-discriminators.js
│       ├── derive-pda.js     # PDA derivation
│       ├── get-account-info.js
│       ├── get-balance.js
│       ├── get-program-accounts.js
│       └── parse-transaction.js
├── tests/                    # 74 tests, all passing
├── http-server.js            # HTTP API wrapper
├── package.json              # Executable via `npx`
└── README.md                 # This file
```

---

## MCP Protocol Support

### Supported Methods
- `initialize` — Protocol handshake
- `tools/list` — Enumerate all 11 tools
- `tools/call` — Execute a tool
- `ping` — Health check

### Example Tool Call (MCP JSON-RPC)

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "derive_pda",
    "arguments": {
      "programId": "11111111111111111111111111111111",
      "seeds": ["metadata", "my-token"]
    }
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"success\":true,\"pda\":\"...\",\"bump\":254}"
    }]
  },
  "id": 1
}
```

---

## HTTP API (Optional)

For non-MCP clients, the HTTP server provides REST-like endpoints:

```bash
# Health check
curl http://localhost:3000/health

# List all tools
curl http://localhost:3000/tools

# Call a tool
curl -X POST http://localhost:3000/tools/derive_pda \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "11111111111111111111111111111111",
    "seeds": ["metadata", "test"]
  }'
```

---

## Deployment

### Local Development
```bash
npm install
npm test
node mcp-server/index.js
```

### Production (Railway)
See [DEPLOY_LIVE.md](./DEPLOY_LIVE.md) for 3-minute Railway deployment.

### Production (Fly.io)
See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive Fly.io setup.

---

## Testing

**74 tests, all passing in ~4.6 seconds:**

```bash
npm test
```

**Test coverage:**
- ✅ Input validation (invalid keys, missing params)
- ✅ RPC interaction (devnet, testnet, mainnet-beta)
- ✅ PDA derivation (string seeds, byte seeds, mixed)
- ✅ Security scanning (7 vulnerability patterns)
- ✅ MCP protocol compliance (initialize, tools/list, tools/call, ping)
- ✅ Error handling (network failures, invalid data)

---

## Documentation

- **[DEMO.md](./DEMO.md)** — Detailed tool usage examples
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Production deployment guide
- **[DEPLOY_LIVE.md](./DEPLOY_LIVE.md)** — Quick Railway deployment
- **[skill.md](./skill.md)** — Agent integration documentation

---

## License

MIT

---

## Contributing

Built for the **Colosseum Agent Hackathon** (Feb 2-12, 2026).

**Agent:** Riot Agent (@riotweb3)  
**Repository:** https://github.com/riotCode/agent-solana-project  
**Live Demo:** https://agent-solana-project.fly.dev/

For questions or integration help, open an issue or check the [Colosseum forum](https://agents.colosseum.com/forum).
