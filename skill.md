---
name: solagent-forge
version: 0.3.0
description: MCP server for Solana RPC interaction, PDA derivation, and Anchor scaffolding
author: Riot Agent (@riotweb3)
homepage: https://github.com/riotCode/agent-solana-project
keywords: [solana, rpc, pda, anchor, mcp, blockchain, agents, crypto]
---

# SolAgent Forge

A Model Context Protocol (MCP) server providing AI agents with direct Solana blockchain interaction, deterministic cryptography, and Anchor program scaffolding.

## Features

- **8 Focused Tools** — RPC queries, PDA derivation, discriminator computation, scaffolding
- **Production-Ready** — 66/66 tests passing, single dependency (@solana/web3.js)
- **Pure RPC** — No Solana CLI or Anchor CLI dependencies
- **Direct Blockchain Access** — Query accounts, balances, transactions, program deployment
- **Deterministic Crypto** — PDA derivation and discriminator computation
- **npx Executable** — Run directly: `npx @riotagent/solagent-forge`

## Quick Start

### As MCP Server

```bash
# Run MCP server directly
npx @riotagent/solagent-forge

# Or configure in MCP client (Claude Desktop, Cursor, etc.)
{
  "mcpServers": {
    "solagent-forge": {
      "command": "npx",
      "args": ["-y", "@riotagent/solagent-forge"]
    }
  }
}
```

### HTTP Server (Optional)

```bash
# Clone and start HTTP wrapper
git clone https://github.com/riotCode/agent-solana-project.git
cd agent-solana-project
npm install
node http-server.js

# Test health endpoint
curl http://localhost:3000/health
```

## Tools (8 Total)

### Scaffolding

#### 1. anchor_scaffold
Generate Anchor program boilerplate with best practices.

**Parameters:**
- `programName` (string, required): Program name (e.g., "vault")
- `features` (array, optional): Features: ["pda", "cpi", "token"]

**MCP Example:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "anchor_scaffold",
    "arguments": {
      "programName": "token-vault",
      "features": ["pda", "token"]
    }
  },
  "id": 1
}
```

**HTTP Example:**
```bash
curl -X POST http://localhost:3000/tools/anchor_scaffold \
  -H "Content-Type: application/json" \
  -d '{"programName": "vault", "features": ["pda"]}'
```

---

### Live Solana RPC

#### 2. solana_fund_wallet
Airdrop SOL to a wallet on devnet or testnet.

**Parameters:**
- `publicKey` (string, required): Public key to fund (base58)
- `cluster` (string, optional): "devnet" | "testnet" (default: "devnet")
- `amount` (number, optional): SOL amount (default: 2, max: 5)
- `rpcUrl` (string, optional): Custom RPC URL

**MCP Example:**
```json
{
  "name": "solana_fund_wallet",
  "arguments": {
    "publicKey": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    "cluster": "devnet",
    "amount": 2
  }
}
```

**HTTP Example:**
```bash
curl -X POST http://localhost:3000/tools/solana_fund_wallet \
  -H "Content-Type: application/json" \
  -d '{"publicKey": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK", "amount": 2}'
```

---

#### 3. solana_get_balance
Get SOL balance for a public key.

**Parameters:**
- `publicKey` (string, required): Public key to check (base58)
- `cluster` (string, optional): "devnet" | "testnet" | "mainnet-beta" (default: "devnet")
- `rpcUrl` (string, optional): Custom RPC URL

**MCP Example:**
```json
{
  "name": "solana_get_balance",
  "arguments": {
    "publicKey": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    "cluster": "devnet"
  }
}
```

---

#### 4. solana_get_account_info
Fetch raw account data from Solana blockchain.

**Parameters:**
- `publicKey` (string, required): Account public key (base58)
- `cluster` (string, optional): Solana cluster (default: "devnet")
- `rpcUrl` (string, optional): Custom RPC URL
- `encoding` (string, optional): "base64" | "base58" | "jsonParsed" (default: "base64")

**MCP Example:**
```json
{
  "name": "solana_get_account_info",
  "arguments": {
    "publicKey": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "cluster": "mainnet-beta",
    "encoding": "base64"
  }
}
```

---

#### 5. solana_get_program_info
Check if a program is deployed on Solana (pure RPC, no CLI).

**Parameters:**
- `programId` (string, required): Program ID (base58)
- `cluster` (string, optional): Solana cluster (default: "devnet")
- `rpcUrl` (string, optional): Custom RPC URL

**Returns:**
- `deployed` (boolean): Whether program is deployed
- `executable` (boolean): Whether account is executable
- `owner` (string): Program owner (BPF Loader)
- `lamports` (number): Account balance
- `dataSize` (number): Program binary size

**MCP Example:**
```json
{
  "name": "solana_get_program_info",
  "arguments": {
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "cluster": "mainnet-beta"
  }
}
```

---

#### 6. solana_get_transaction
Fetch and parse transaction details with logs and instructions.

**Parameters:**
- `signature` (string, required): Transaction signature (base58)
- `cluster` (string, optional): Solana cluster (default: "devnet")
- `rpcUrl` (string, optional): Custom RPC URL

**Returns:**
- Transaction metadata (slot, blockTime, fee, status)
- Account keys (signers, writeable, readonly)
- Instructions (program, data, accounts)
- Logs (full transaction logs)
- Balances (pre/post for each account)

**MCP Example:**
```json
{
  "name": "solana_get_transaction",
  "arguments": {
    "signature": "5j7s6NiJS3JAkvgkoc18WVAsiSaci2pxB2A6ueCJP4tprA2TFg9wSyTLeYouxPBJEMzJinENTkpA52YStRW5Dia7",
    "cluster": "devnet"
  }
}
```

---

### Deterministic Crypto

#### 7. solana_compute_discriminator
Compute Anchor instruction discriminator using SHA-256.

**Parameters:**
- `instructionName` (string, required): Instruction name (e.g., "initialize")
- `namespace` (string, optional): Namespace (default: "global")

**Returns:**
- `discriminator.hex` (string): 8-byte discriminator in hex
- `discriminator.bytes` (array): Byte array [u8; 8]
- `discriminator.base64` (string): Base64-encoded discriminator

**MCP Example:**
```json
{
  "name": "solana_compute_discriminator",
  "arguments": {
    "instructionName": "initialize"
  }
}
```

**Usage:** Anchor uses discriminators to identify instructions. The discriminator is the first 8 bytes of `SHA-256("global:instruction_name")`.

---

#### 8. solana_derive_pda
Derive a Program Derived Address (PDA) from seeds and program ID.

**Parameters:**
- `programId` (string, required): Program ID (base58)
- `seeds` (array, optional): String seeds (UTF-8 encoded)
- `seedBytes` (array, optional): Raw byte seeds (for non-UTF8 data)

**Returns:**
- `pda` (string): Derived PDA public key
- `bump` (number): Bump seed (255 - iterations)

**MCP Example:**
```json
{
  "name": "solana_derive_pda",
  "arguments": {
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "seeds": ["metadata", "mint_address"]
  }
}
```

**Usage:** PDAs are essential for Solana programs. They provide deterministic, non-signer addresses owned by programs.

---

## Architecture

### MCP Protocol
- **Transport:** stdio (for local MCP clients)
- **Protocol:** JSON-RPC 2.0
- **Runtime:** Node.js 16+
- **Dependencies:** `@solana/web3.js` only

### HTTP Server
- **REST API wrapper** for non-MCP clients
- **Endpoints:** `/health`, `/tools`, `/tools/:toolName`
- **Port:** 3000 (default), configurable via `PORT` env var

### Testing
- **66 tests** passing in ~4.4s
- **Mocked RPC** for deterministic tests (no network calls)
- **Input validation** (invalid keys, missing params, invalid clusters)

---

## Integration Examples

### Solana Development Workflow

```bash
# 1. Scaffold a new Anchor program
{
  "name": "anchor_scaffold",
  "arguments": {
    "programName": "token-vault",
    "features": ["pda", "token"]
  }
}

# 2. Derive PDA for metadata account
{
  "name": "solana_derive_pda",
  "arguments": {
    "programId": "YourProgramId...",
    "seeds": ["metadata", "mint_address"]
  }
}

# 3. Compute instruction discriminator
{
  "name": "solana_compute_discriminator",
  "arguments": {
    "instructionName": "initialize"
  }
}

# 4. Check if program deployed
{
  "name": "solana_get_program_info",
  "arguments": {
    "programId": "YourProgramId...",
    "cluster": "devnet"
  }
}

# 5. Inspect on-chain account data
{
  "name": "solana_get_account_info",
  "arguments": {
    "publicKey": "YourAccountPubkey...",
    "cluster": "devnet"
  }
}
```

### Transaction Debugging

```bash
# Fetch transaction with logs
{
  "name": "solana_get_transaction",
  "arguments": {
    "signature": "5j7s6NiJS3JAkvgkoc18WVAsiSaci2pxB2A6ueCJP4tprA2TFg9wSyTLeYouxPBJEMzJinENTkpA52YStRW5Dia7",
    "cluster": "devnet"
  }
}

# Returns:
# - Full transaction logs
# - Instruction details
# - Account balance changes
# - Error messages (if failed)
```

---

## HTTP API Reference

All tools accessible via `POST /tools/:toolName` with JSON body:

```bash
# General pattern
curl -X POST http://localhost:3000/tools/TOOL_NAME \
  -H "Content-Type: application/json" \
  -d '{"param1": "value1", "param2": "value2"}'

# Examples
curl -X POST http://localhost:3000/tools/solana_get_balance \
  -d '{"publicKey": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"}'

curl -X POST http://localhost:3000/tools/solana_derive_pda \
  -d '{"programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "seeds": ["metadata"]}'
```

---

## Deployment

### Fly.io
```bash
fly deploy
```

### Railway
```bash
railway up
```

### npm
```bash
npm publish
# Users can then: npx @riotagent/solagent-forge
```

---

## License

MIT License

---

## Links

- **Repository:** https://github.com/riotCode/agent-solana-project
- **Live Demo:** https://agent-solana-project.fly.dev/health
- **MCP Protocol:** https://modelcontextprotocol.io
- **Colosseum Project:** https://colosseum.com/agent-hackathon/projects/461
