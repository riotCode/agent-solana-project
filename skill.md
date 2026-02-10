---
name: solagent-forge
version: 0.2.0
description: MCP server for Solana RPC interaction, PDA derivation, and Anchor scaffolding
author: Riot Agent (@riotweb3)
homepage: https://github.com/riotCode/agent-solana-project
keywords: [solana, rpc, pda, anchor, mcp, blockchain, agents, crypto]
---

# SolAgent Forge

A Model Context Protocol (MCP) server providing AI agents with direct Solana blockchain interaction, Program Derived Address (PDA) cryptography, and Anchor program development tools.

## Features

- **11 MCP Tools** — RPC queries, PDA derivation, scaffolding, deployment, security
- **Production-Ready** — 74/74 tests passing, single dependency (@solana/web3.js)
- **Direct RPC Access** — Query accounts, balances, transactions, program data
- **PDA Derivation** — Essential cryptographic primitive for Solana development
- **HTTP Accessible** — Test tools via REST API without MCP protocol setup
- **npx Executable** — Run directly: `npx @riotagent/solagent-forge`

## Quick Start

### Option 1: npx (Fastest)

```bash
# Run MCP server
npx @riotagent/solagent-forge

# Or configure in MCP client (Claude Desktop, etc.)
{
  "mcpServers": {
    "solagent-forge": {
      "command": "npx",
      "args": ["-y", "@riotagent/solagent-forge"]
    }
  }
}
```

### Option 2: HTTP Server (For REST API)

```bash
# Clone and install
git clone https://github.com/riotCode/agent-solana-project.git
cd agent-solana-project
npm install

# Start HTTP server
node http-server.js

# Health check
curl http://localhost:3000/health
```

## Tools

### Scaffolding & Security

#### 1. scaffold_program
Generate Anchor program structure with PDA/CPI/token templates.

**Parameters:**
- `programName` (string, required): Program name (e.g., "vault")
- `features` (array, optional): Features: ["pda", "cpi", "token"]

**Example:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "scaffold_program",
    "arguments": {
      "programName": "token-vault",
      "features": ["pda", "token"]
    }
  },
  "id": 1
}
```

**HTTP:**
```bash
curl -X POST http://localhost:3000/tools/scaffold_program \
  -H "Content-Type: application/json" \
  -d '{"programName": "vault", "features": ["pda"]}'
```

---

#### 2. scan_security
Detect 7 vulnerability patterns in Rust/TypeScript code.

**Detects:**
- Reentrancy attacks
- Arithmetic overflow/underflow
- Missing authority checks
- Oracle manipulation
- PDA bump not stored
- Unsafe deserialization
- Missing input validation

**Parameters:**
- `code` (string, required): Source code to scan
- `codeType` (string, optional, enum: "rust", "typescript"): Language (default: "rust")
- `severity` (string, optional, enum: "low", "medium", "high", "critical"): Min severity (default: "medium")

**Example:**
```json
{
  "name": "scan_security",
  "arguments": {
    "code": "pub fn transfer(ctx: Context<Transfer>, amount: u64) { ... }",
    "codeType": "rust",
    "severity": "medium"
  }
}
```

**Output:** Array of vulnerabilities with severity, CWE references, fix recommendations.

---

### Deployment & On-Chain Interaction

#### 3. deploy_devnet
Build and deploy Anchor program to Solana devnet.

**Parameters:**
- `programPath` (string, optional): Path to Anchor project (default: ".")
- `cluster` (string, optional, enum: "devnet", "testnet", "mainnet-beta"): Target cluster
- `keypair` (string, optional): Path to keypair file
- `skipBuild` (boolean, optional): Skip `anchor build` step

**Example:**
```json
{
  "name": "deploy_devnet",
  "arguments": {
    "programPath": "./programs/vault",
    "cluster": "devnet"
  }
}
```

---

#### 4. get_deployment_status
Check if a program is deployed on-chain.

**Parameters:**
- `programId` (string, required): Program ID (base58 public key)
- `cluster` (string, optional): Cluster (default: "devnet")

**Example:**
```json
{
  "name": "get_deployment_status",
  "arguments": {
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "cluster": "mainnet-beta"
  }
}
```

**Output:** `{ deployed: true/false, executable: true/false, lamports: number, owner: string }`

---

#### 5. verify_onchain_discriminators
Verify program IDL matches on-chain state.

**Parameters:**
- `programId` (string, required): Program ID
- `cluster` (string, optional): Cluster (default: "devnet")
- `rpcUrl` (string, optional): Custom RPC URL

**Example:**
```json
{
  "name": "verify_onchain_discriminators",
  "arguments": {
    "programId": "YourProgramIDHere",
    "cluster": "devnet"
  }
}
```

---

#### 6. fund_keypair
Airdrop SOL to devnet/testnet keypair for testing.

**Parameters:**
- `publicKey` (string, required): Public key (base58)
- `cluster` (string, optional, enum: "devnet", "testnet"): Cluster
- `amount` (number, optional): SOL amount (default: 2)

**Example:**
```json
{
  "name": "fund_keypair",
  "arguments": {
    "publicKey": "YourPublicKeyHere",
    "cluster": "devnet",
    "amount": 5
  }
}
```

---

### RPC & Blockchain Queries

#### 7. derive_pda
Derive Program Derived Address from seeds.

**Parameters:**
- `programId` (string, required): Program ID (base58)
- `seeds` (array of strings, optional): UTF-8 seed strings
- `seedBytes` (array of byte arrays, optional): Raw byte seeds

**Example:**
```json
{
  "name": "derive_pda",
  "arguments": {
    "programId": "11111111111111111111111111111111",
    "seeds": ["metadata", "my-token"]
  }
}
```

**Output:** `{ pda: "...", bump: 254, derivation: {...} }`

---

#### 8. get_account_info
Fetch raw account data from Solana blockchain.

**Parameters:**
- `publicKey` (string, required): Account public key
- `cluster` (string, optional): Cluster (default: "devnet")
- `rpcUrl` (string, optional): Custom RPC URL
- `encoding` (string, optional, enum: "base64", "base58", "jsonParsed"): Data encoding

**Example:**
```json
{
  "name": "get_account_info",
  "arguments": {
    "publicKey": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "cluster": "mainnet-beta",
    "encoding": "base64"
  }
}
```

**Output:** `{ exists: true, lamports, owner, executable, rentEpoch, dataLength, data }`

---

#### 9. get_balance
Get SOL balance for a public key.

**Parameters:**
- `publicKey` (string, required): Public key (base58)
- `cluster` (string, optional): Cluster (default: "devnet")
- `rpcUrl` (string, optional): Custom RPC URL

**Example:**
```json
{
  "name": "get_balance",
  "arguments": {
    "publicKey": "YourWalletHere",
    "cluster": "devnet"
  }
}
```

**Output:** `{ balance: { lamports: 2000000000, sol: 2.0, formatted: "2.000000000 SOL" } }`

---

#### 10. get_program_accounts
Query all accounts owned by a program.

**Parameters:**
- `programId` (string, required): Program ID (base58)
- `cluster` (string, optional): Cluster (default: "devnet")
- `rpcUrl` (string, optional): Custom RPC URL
- `limit` (number, optional): Max accounts to return (default: 10)
- `filters` (array, optional): Account filters (dataSize, memcmp)

**Example:**
```json
{
  "name": "get_program_accounts",
  "arguments": {
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "cluster": "mainnet-beta",
    "limit": 5
  }
}
```

**Output:** Array of accounts with publicKey, lamports, owner, dataLength.

---

#### 11. parse_transaction
Fetch and parse a Solana transaction.

**Parameters:**
- `signature` (string, required): Transaction signature (base58)
- `cluster` (string, optional): Cluster (default: "devnet")
- `rpcUrl` (string, optional): Custom RPC URL

**Example:**
```json
{
  "name": "parse_transaction",
  "arguments": {
    "signature": "5Z...(88 char signature)",
    "cluster": "mainnet-beta"
  }
}
```

**Output:** Transaction details including slot, fee, status, instructions, log messages, balance changes.

---

## HTTP API

All tools are accessible via HTTP POST at `http://localhost:3000/tools/{toolName}`:

```bash
# Derive PDA
curl -X POST http://localhost:3000/tools/derive_pda \
  -H "Content-Type: application/json" \
  -d '{"programId": "11111111111111111111111111111111", "seeds": ["test"]}'

# Get balance
curl -X POST http://localhost:3000/tools/get_balance \
  -H "Content-Type: application/json" \
  -d '{"publicKey": "YourKeyHere", "cluster": "devnet"}'

# Get account info
curl -X POST http://localhost:3000/tools/get_account_info \
  -H "Content-Type: application/json" \
  -d '{"publicKey": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}'
```

**Health check:**
```bash
curl http://localhost:3000/health
# {"status":"ok","service":"SolAgent Forge MCP Server","tools":11,"tests":74}
```

---

## Testing

```bash
# Run all 74 tests
npm test

# Expected output:
# tests 74
# pass 74
# fail 0
# duration_ms ~4600
```

---

## Use Cases

### For Autonomous Agents

1. **PDA-based programs** — Derive PDAs before scaffolding program structure
2. **Account inspection** — Verify on-chain state during development
3. **Balance monitoring** — Track SOL balances for test wallets
4. **Transaction forensics** — Parse and analyze past transactions
5. **Program account queries** — Find all accounts owned by a program
6. **Security scanning** — Detect vulnerabilities before deployment

### Agent Workflow Example

```javascript
// 1. Derive PDA for program metadata
const pda = await call('derive_pda', {
  programId: 'MyProgramID',
  seeds: ['metadata', 'config']
});

// 2. Scaffold program with PDA template
const scaffold = await call('scaffold_program', {
  programName: 'metadata-registry',
  features: ['pda']
});

// 3. Deploy to devnet
const deploy = await call('deploy_devnet', {
  programPath: './programs/metadata-registry',
  cluster: 'devnet'
});

// 4. Verify deployment
const status = await call('get_deployment_status', {
  programId: deploy.programId,
  cluster: 'devnet'
});

// 5. Scan for security issues
const security = await call('scan_security', {
  code: readFile('./programs/metadata-registry/src/lib.rs'),
  codeType: 'rust'
});

// 6. Get program accounts
const accounts = await call('get_program_accounts', {
  programId: deploy.programId,
  cluster: 'devnet',
  limit: 10
});
```

---

## Architecture

- **Runtime:** Node.js 22+ (ESM modules)
- **Protocol:** MCP JSON-RPC 2.0
- **Dependency:** @solana/web3.js (single runtime dependency)
- **Tests:** 74 tests, ~4.6s runtime
- **LOC:** 1,705 lines (tool implementations)

---

## Deployment

### Local Development
```bash
npm install
npm test
node mcp-server/index.js
```

### Production
- **Railway:** See [DEPLOY_LIVE.md](./DEPLOY_LIVE.md)
- **Fly.io:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Custom:** Dockerized, zero external services required

---

## License

MIT

---

## Links

- **Repository:** https://github.com/riotCode/agent-solana-project
- **Live Demo:** https://agent-solana-project.fly.dev/
- **Forum:** https://agents.colosseum.com/forum
- **Hackathon:** Colosseum Agent Hackathon (Feb 2-12, 2026)
