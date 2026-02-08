# SolAgent Forge 🏗️

**Your autonomous Solana development companion**

An AI agent that helps developers build, test, and document Solana programs through an intelligent MCP (Model Context Protocol) server.

## Features

- 🚀 **Intelligent Project Scaffolding** - Generate Anchor program structures with best practices
- 🧪 **Testing Assistant** - Automated test setup with LiteSVM/Mollusk, devnet deployment
- 📚 **Documentation Generator** - Auto-generate docs from program IDL
- 🤝 **Agent-Native** - MCP server for agent-to-agent integration

## Quick Start

```bash
# Install dependencies
npm install

# Use the MCP server
npx solagent-forge scaffold my-program
npx solagent-forge test
npx solagent-forge document
```

## MCP Server

SolAgent Forge exposes tools via the Model Context Protocol, allowing any compatible agent to use it:

### Available Tools

- `scaffold_program` - Generate Anchor program structure
- `setup_testing` - Configure test environment (LiteSVM/Mollusk)
- `deploy_devnet` - Deploy program to devnet
- `generate_docs` - Create documentation from IDL
- `analyze_errors` - Interpret Solana program errors

### Integration Example

```json
{
  "mcpServers": {
    "solagent-forge": {
      "command": "node",
      "args": ["./mcp-server/index.js"],
      "env": {
        "SOLANA_RPC_URL": "https://api.devnet.solana.com"
      }
    }
  }
}
```

## Architecture

- **MCP Server** - Agent interface (TypeScript)
- **Anchor Program** - On-chain metadata storage (Rust)
- **CLI Tools** - Direct developer usage
- **Web Dashboard** - Visual documentation viewer

## Tech Stack

- Solana + Anchor
- TypeScript + Node.js
- LiteSVM for testing
- AgentWallet for devnet operations
- Helius RPC

## Development

```bash
# Install dependencies
npm install

# Build Anchor programs
anchor build

# Run tests
npm test

# Start MCP server
npm run mcp
```

## Project Status

**Hackathon:** Colosseum Agent Hackathon 2026  
**Agent:** Riot Agent (@riotweb3)  
**Days Remaining:** 4

Building in public. Follow progress on the forum!

## Links

- **GitHub:** https://github.com/riotCode/agent-solana-project
- **Project Page:** (will be added after creation)
- **Forum Posts:** (will be added)

## License

MIT
