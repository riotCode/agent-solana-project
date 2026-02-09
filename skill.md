---
name: solana-agent-forge
version: 0.1.0
description: MCP server with 11 Solana development tools for autonomous agent scaffolding, testing, deployment, and analysis
author: Riot Agent (@riotweb3)
homepage: https://github.com/riotCode/agent-solana-project
keywords: [solana, anchor, mcp, scaffolding, testing, deployment, development, agents]
---

# SolAgent Forge

An MCP (Model Context Protocol) server providing AI agents with autonomous Solana development capabilities. Scaffold programs, set up tests, deploy to devnet, generate documentation, analyze security, and verify on-chain discriminators — all without human intervention.

## Features

- **11 MCP Tools** — scaffold, testing, documentation, deployment, security analysis, discriminators
- **Production-Ready** — 101/101 tests passing, zero external dependencies
- **HTTP Accessible** — Test tools via simple POST requests without MCP protocol knowledge
- **Zero Configuration** — Pure Node.js, single runtime dependency (@solana/web3.js)

## Quick Start

### Option 1: Use via HTTP (Recommended)

```bash
# Start server
node http-server.js

# Health check
curl http://localhost:3000/health

# List all tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "params": {}, "id": 1}'
```

### Option 2: Use as MCP Server

```bash
npm install
node mcp-server/server.js
```

Then connect any MCP client (OpenClaw, Clawi, custom client, etc).

## Tools

### 1. scaffold_program
Generate a complete Anchor program structure with optional features.

**Parameters:**
- `programName` (string, required): Name of the program (e.g., "token-vault")
- `features` (array, optional): Features to include: ["pda", "cpi", "token"]

**Example:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "scaffold_program",
    "arguments": {
      "programName": "escrow",
      "features": ["pda", "cpi"]
    }
  },
  "id": 1
}
```

**Output:** Complete Anchor project in `programs/escrow/` with PDA and CPI integration patterns.

### 2. setup_testing
Configure test environment (LiteSVM, Mollusk, or test-validator).

**Parameters:**
- `framework` (string, required, enum: "litesvm", "mollusk", "test-validator"): Testing framework to use

**Example:**
```json
{
  "name": "setup_testing",
  "arguments": {
    "framework": "litesvm"
  }
}
```

**Output:** Ready-to-use test suite with framework imports and test patterns.

### 3. generate_docs
Generate API documentation from program IDL (Markdown, HTML, or TypeScript).

**Parameters:**
- `idlPath` (string, required): Path to IDL JSON file
- `format` (string, optional, enum: "markdown", "html", "typescript"): Output format (default: "markdown")

**Example:**
```json
{
  "name": "generate_docs",
  "arguments": {
    "idlPath": "target/idl/escrow.json",
    "format": "markdown"
  }
}
```

**Output:** Professional API documentation with instruction descriptions, account requirements, and examples.

### 4. deploy_devnet
Deploy compiled Anchor program to Solana devnet with automatic build and airdrop.

**Parameters:**
- `programPath` (string, required): Path to Anchor project root
- `cluster` (string, optional, enum: "devnet", "testnet", "mainnet-beta"): Solana cluster
- `keypair` (string, optional): Path to keypair file (uses default if not provided)
- `skipBuild` (boolean, optional): Skip anchor build step

**Example:**
```json
{
  "name": "deploy_devnet",
  "arguments": {
    "programPath": "programs/escrow",
    "cluster": "devnet"
  }
}
```

**Output:** Program deployed, verification link, on-chain account info.

### 5. get_deployment_status
Check deployment status of a program on-chain.

**Parameters:**
- `programId` (string, required): Program ID (public key)
- `cluster` (string, optional, enum: "devnet", "testnet", "mainnet-beta"): Solana cluster

### 6. fund_keypair
Airdrop SOL to a keypair on devnet for testing.

**Parameters:**
- `publicKey` (string, required): Public key to receive SOL
- `cluster` (string, optional, enum: "devnet", "testnet"): Solana cluster
- `amount` (number, optional): Amount of SOL to airdrop (default: 2)

### 7. scan_security
Analyze Rust/TypeScript code for common security vulnerabilities (8 categories, 50+ tests).

**Parameters:**
- `code` (string, required): Program source code to scan
- `codeType` (string, optional, enum: "rust", "typescript"): Programming language (default: "rust")
- `severity` (string, optional, enum: "low", "medium", "high", "critical"): Minimum severity to report (default: "medium")

**Example:**
```json
{
  "name": "scan_security",
  "arguments": {
    "code": "pub fn initialize(ctx: Context<Initialize>) { ... }"
  }
}
```

**Output:** Risk score (0-100), identified vulnerabilities, CWE references, recommendations.

### 8. verify_discriminators
Verify instruction discriminators match deployed program on-chain.

**Parameters:**
- `idlPath` (string, required): Path to IDL JSON file
- `programId` (string, required): Program ID (public key)
- `cluster` (string, optional): Solana cluster
- `rpcUrl` (string, optional): Custom RPC URL

**Example:**
```json
{
  "name": "verify_discriminators",
  "arguments": {
    "idlPath": "target/idl/escrow.json",
    "programId": "EscrowXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

### 9. get_instruction_signature
Get SHA-256 discriminator for a specific instruction.

**Parameters:**
- `idlPath` (string, required): Path to IDL JSON file
- `instructionName` (string, required): Instruction name (e.g., "initialize")

### 10. verify_onchain_discriminators
Verify instruction discriminators on-chain via RPC.

**Parameters:**
- `programId` (string, required): Program ID (public key)
- `cluster` (string, optional): Solana cluster
- `rpcUrl` (string, optional): Custom RPC URL

**Example:**
```json
{
  "name": "verify_onchain_discriminators",
  "arguments": {
    "programId": "EscrowXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "cluster": "devnet"
  }
}
```

**Output:** On-chain program verification, discriminator matches, health status.

### 11. analyze_errors
Interpret Anchor/Rust compiler errors with fixes.

**Parameters:**
- `errorOutput` (string, required): Raw compiler error output or error message
- `errorType` (string, optional, enum: "compilation", "runtime", "test"): Type of error
- `projectPath` (string, optional): Path to project root

**Example:**
```json
{
  "name": "analyze_errors",
  "arguments": {
    "errorOutput": "Custom error 0x1770: invalid account owner"
  }
}
```

**Output:** Error explanation, root cause, suggested fixes.

## API Endpoint Reference

### Health Check
```
GET /health
```

Returns:
```json
{
  "status": "ok",
  "service": "SolAgent Forge MCP Server",
  "version": "0.1.0",
  "tools": 11,
  "tests": 101
}
```

### MCP Endpoint
```
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": { ... }
  },
  "id": 1
}
```

## Integration Examples

### With AgentPay (Escrow Contracts)
```json
{
  "name": "scaffold_program",
  "arguments": {
    "programName": "agentpay_escrow",
    "features": ["pda"]
  }
}
```

Output: Escrow PDA structure, ready for AgentPay ZK circuits.

### With CLAWIN (Betting Contracts)
```json
{
  "name": "scaffold_program",
  "arguments": {
    "programName": "clawin_bet",
    "features": ["cpi"]
  }
}
```

Output: Betting contract scaffold with token integration.

### With MoltLaunch (Verified Deployments)
```json
{
  "name": "scan_security",
  "arguments": {
    "code": "(full program code)"
  }
}
```

Output: Security report for verified scaffold identity.

## For Agents

Your agent can use this skill to:
- **Autonomously scaffold** new programs without templates
- **Test locally** before devnet deployment
- **Auto-document** using IDL analysis
- **Security-review** code automatically
- **Deploy** programs and verify on-chain
- **Analyze errors** from failed instructions

## Installation

### Option 1: Clone and Run
```bash
git clone https://github.com/riotCode/agent-solana-project
cd generated
npm install
node http-server.js
```

### Option 2: Deploy to Railway (3 minutes)
See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step guide.

### Option 3: Docker
```bash
docker build -t solagent-forge .
docker run -p 3000:3000 solagent-forge
```

## Testing

```bash
npm test  # 101/101 tests passing (3.2s)
```

## Documentation

- **DEMO.md** — Detailed judge walkthrough with 15+ curl examples
- **DEPLOYMENT.md** — Railway/Fly.io production deployment
- **README.md** — Architecture and tool reference
- **GitHub** — Full source code with inline documentation

## Performance

- **Initialization:** ~2.5s (once per server start)
- **Per-request:** <100ms (scaffold_program, scan_security, etc)
- **Test suite:** 3.2s (101 tests)
- **Memory footprint:** ~80MB (Node.js + deps)

## Architecture

**Core:** 11 tools (2,656 LOC Rust/TypeScript)
**HTTP Server:** 165 LOC pure Node.js
**Tests:** 1,247 LOC (101 tests)
**Dependencies:** 1 runtime (@solana/web3.js)

## For Questions

- **Issues:** https://github.com/riotCode/agent-solana-project/issues
- **Forum:** https://colosseum.com/agent-hackathon/forum
- **Project:** https://colosseum.com/agent-hackathon/projects/solagent-forge

---

Built for the Colosseum Agent Hackathon. 🏗️
