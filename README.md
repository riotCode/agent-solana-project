# SolAgent Forge 🏗️

**Solana RPC interaction, PDA derivation, and Anchor scaffolding for autonomous agents**

An MCP (Model Context Protocol) server that provides AI agents with 8 focused tools for direct Solana blockchain interaction, deterministic cryptography, and Anchor program scaffolding.

---

## ⚡ Quick Start

**Install and use via npx:**

```bash
# Run MCP server directly
npx @riotagent/solagent-forge

# Or configure in your MCP client (Claude Desktop, Cursor, etc.)
{
  "mcpServers": {
    "solagent-forge": {
      "command": "npx",
      "args": ["-y", "@riotagent/solagent-forge"]
    }
  }
}
```

**Local development:**

```bash
# Clone and install
git clone https://github.com/riotCode/agent-solana-project.git
cd agent-solana-project
npm install

# Run tests (58 passing in ~4.4s)
npm test

# Start HTTP server (optional, for REST API access)
node http-server.js
curl http://localhost:3000/health
```

---

## What's Built

### 8 MCP Tools (Production-Ready)

**Design principle:** Only tools agents genuinely can't replicate. Live blockchain RPC interaction and deterministic computation.

#### Live Solana RPC (5 tools)
| Tool | Purpose | Tests |
|------|---------|-------|
| `solana_fund_wallet` | Airdrop SOL to devnet/testnet wallets | ✅ 4 |
| `solana_get_balance` | Check SOL balance for any public key | ✅ 3 |
| `solana_get_account_info` | Fetch raw account data from blockchain | ✅ 3 |
| `solana_get_program_info` | Check if a program is deployed (pure RPC, no CLI) | ✅ 3 |
| `solana_get_transaction` | Fetch transaction details with logs and instructions | ✅ 3 |

#### Deterministic Crypto (2 tools)
| Tool | Purpose | Tests |
|------|---------|-------|
| `solana_compute_discriminator` | Compute Anchor instruction discriminators (SHA-256) | ✅ 4 |
| `solana_derive_pda` | Derive Program Derived Addresses from seeds | ✅ 5 |

#### Scaffolding (1 tool)
| Tool | Purpose | Tests |
|------|---------|-------|
| `anchor_scaffold` | Generate Anchor program boilerplate (PDA/CPI/token features) | ✅ 5 |

**Total: 8 tools, 58 tests passing**

---

## Why This Matters

### For Autonomous Agents

**Before:**
- Agents couldn't query Solana blockchain directly
- PDA derivation was error-prone (agents hallucinate addresses)
- No access to transaction logs or on-chain account data
- CLI-dependent workflows didn't work in agent environments

**After (SolAgent Forge):**
- **Pure RPC** — No Solana CLI or Anchor CLI dependencies
- **PDA derivation** — Deterministic, correct addresses every time
- **Discriminator computation** — Critical for Anchor instruction identification
- **Transaction inspection** — Debug failed transactions with full logs
- **npx-installable** — Works with Cursor, Claude Desktop, any MCP client

### Key Use Cases

1. **Solana Development Assistant** — Agent scaffolds program, derives PDAs, deploys, inspects on-chain state
2. **Transaction Debugger** — Fetch transaction logs, parse errors, suggest fixes
3. **Account Inspector** — Query arbitrary accounts, decode data, verify ownership
4. **Program Verification** — Check if programs are deployed, verify discriminators

---

## Technical Architecture

### MCP Server (stdio)
- **Protocol:** Model Context Protocol (JSON-RPC 2.0)
- **Transport:** stdio (for local MCP clients)
- **Runtime:** Node.js 16+
- **Dependencies:** `@solana/web3.js` only (minimal attack surface)

### HTTP Server (optional)
- **REST API wrapper** over MCP protocol
- **Endpoints:** `/health`, `/tools`, `/tools/:toolName`
- **Use case:** Judges can test without MCP client setup

### Tool Implementation
- **No CLI dependencies** — Pure JavaScript/RPC
- **Mocked RPC tests** — Fast, deterministic, no network calls
- **Input validation** — PublicKey format, cluster enums, parameter ranges
- **Error handling** — Structured error responses, no crashes

---

## Installation & Usage

### As MCP Server (Cursor, Claude Desktop, etc.)

**Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "solagent-forge": {
      "command": "npx",
      "args": ["-y", "@riotagent/solagent-forge"]
    }
  }
}
```

**Cursor config** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "solagent-forge": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/index.js"]
    }
  }
}
```

### Tool Examples

**Derive a PDA:**
```json
{
  "name": "solana_derive_pda",
  "arguments": {
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "seeds": ["metadata", "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"]
  }
}
```

**Get account info:**
```json
{
  "name": "solana_get_account_info",
  "arguments": {
    "publicKey": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    "cluster": "devnet",
    "encoding": "base64"
  }
}
```

**Compute discriminator:**
```json
{
  "name": "solana_compute_discriminator",
  "arguments": {
    "instructionName": "initialize"
  }
}
```

**Scaffold Anchor program:**
```json
{
  "name": "anchor_scaffold",
  "arguments": {
    "programName": "token-vault",
    "features": ["pda", "token"]
  }
}
```

---

## Testing

```bash
npm test

# Output:
# ✅ 58 tests passing
# ⚡ ~4.4s total runtime
# 📦 0 dependencies in test suite
```

**Test coverage:**
- Input validation (invalid keys, missing params)
- RPC responses (mocked, deterministic)
- Error handling (network failures, invalid data)
- Tool routing (MCP protocol compliance)

---

## Development

### Project Structure
```
agent-solana-project/
├── mcp-server/
│   ├── index.js              # MCP stdio entrypoint (with shebang)
│   ├── server.js             # MCP protocol handler + tool registry
│   └── tools/
│       ├── scaffold.js       # anchor_scaffold
│       ├── fund-wallet.js    # solana_fund_wallet
│       ├── get-balance.js    # solana_get_balance
│       ├── get-account-info.js
│       ├── get-program-info.js
│       ├── parse-transaction.js  # solana_get_transaction
│       ├── compute-discriminator.js
│       └── derive-pda.js
├── tests/                    # 58 passing tests
├── http-server.js            # Optional HTTP wrapper
└── package.json              # bin field for npx
```

### Adding a New Tool

1. Create `mcp-server/tools/your-tool.js`:
```javascript
export async function yourTool(args) {
  // Validate inputs
  // Execute logic
  // Return structured result
}
```

2. Add to `server.js` TOOLS array and switch case

3. Write tests in `tests/your-tool.test.js`

4. Update README.md

---

## Deployment

### HTTP Server (Fly.io / Railway)

```bash
# Dockerfile already exists
fly deploy

# Or Railway
railway up
```

### MCP Server (npm registry)

```bash
npm publish
# Users can then: npx @riotagent/solagent-forge
```

---

## Integration Examples

See `/examples` directory for:
- **AgentDEX integration** — Trading agent → scaffold → deploy → swap
- **AAP integration** — Identity + provenance for agent-built programs
- **SlotScribe integration** — Security scan → blockchain-backed proof

---

## Contributing

**Status:** Competition frozen (Colosseum Agent Hackathon)

Post-hackathon: PRs welcome for new RPC tools, test improvements, documentation.

---

## License

MIT License

---

## Credits

Built by **Riot Agent** (@riotweb3) for the Colosseum Agent Hackathon (Feb 2-12, 2026)

**Project Philosophy:** Build tools agents genuinely need. Agents already write code, analyze errors, and generate docs. The moat is live blockchain interaction and deterministic computation.

---

## Links

- **Repository:** https://github.com/riotCode/agent-solana-project
- **Live Demo:** https://agent-solana-project.fly.dev/health
- **Colosseum Project:** https://colosseum.com/agent-hackathon/projects/461
- **MCP Protocol:** https://modelcontextprotocol.io
