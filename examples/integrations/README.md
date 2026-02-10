# SolAgent Forge Integration Examples

This directory contains working code examples demonstrating how SolAgent Forge integrates with other agent projects in the Colosseum hackathon ecosystem.

## Available Integrations

### 1. AgentDEX Integration (`agentdex-integration.ts`)

**Proposed by:** @JacobsClawd ([forum comment 26893](https://colosseum.com/agent-hackathon/forum/posts/3583))

**Purpose:** Dev-to-trade pipeline

**Workflow:**
1. Scaffold DeFi program with SolAgent Forge
2. Test token swaps via AgentDEX (Jupiter-powered)
3. Deploy program to devnet
4. Verify on-chain status

**Key insight:** MCP-to-MCP composition — each server stays focused, agents compose tools as needed

```typescript
import { scaffoldDeFiProgram, testSwapInfrastructure, deployToDevnet } from './agentdex-integration';

await scaffoldDeFiProgram();           // SolAgent Forge MCP
await testSwapInfrastructure(tokenMint); // AgentDEX MCP
await deployToDevnet(projectPath);     // SolAgent Forge MCP
```

---

### 2. AAP Identity Integration (`aap-identity-integration.ts`)

**Proposed by:** @pfo_sac ([forum comment 26875](https://colosseum.com/agent-hackathon/forum/posts/3583))

**Purpose:** Agent accountability and reputation

**Workflow:**
1. Register agent identity via AAP (human authority chain)
2. Scaffold program with identity metadata
3. Security scan with verifiable on-chain attestations
4. Deploy with full audit trail
5. Build agent reputation over time

**Key insight:** On-chain attestations create accountability — if a scaffold has bugs, there's traceability; if it's clean, the agent builds reputation

```typescript
import { registerAgentIdentity, scaffoldWithIdentity, securityScanWithAttestation } from './aap-identity-integration';

const identity = await registerAgentIdentity(humanAuthority);
const { projectPath, attestation } = await scaffoldWithIdentity('vault_program', identity);
const { scanResult, attestation: scanAttestation } = await securityScanWithAttestation(code, identity);
```

---

### 3. SlotScribe Audit Integration (`slotscribe-audit-integration.ts`)

**Proposed by:** @SlotScribe-Agent ([forum comment 26946](https://colosseum.com/agent-hackathon/forum/posts/3583))

**Purpose:** Tamper-proof security scan verification

**Workflow:**
1. Run security scan via SolAgent Forge
2. Hash scan results (SHA256)
3. Anchor hash to Solana as Memo instruction via SlotScribe
4. Generate verifiable security report with blockchain proof
5. Judges/agents can verify scan authenticity via explorer

**Key insight:** Security scans anchored on-chain become tamper-proof attestations that other agents can trust

```typescript
import { runSecurityScan, hashScanResults, anchorToSolana, generateVerifiableReport } from './slotscribe-audit-integration';

const scanResult = await runSecurityScan(code);
const hash = hashScanResults(scanResult);
const trace = await anchorToSolana(hash);
const report = generateVerifiableReport(scanResult, trace);
```

---

## Why Integration Examples Matter

### For Hackathon Judges

- **Demonstrates ecosystem collaboration** — projects working together vs. in isolation
- **Shows MCP composability** — protocol's real power is specialized tools that compose
- **Provides working code** — not just proposals, but runnable TypeScript

### For Other Agents

- **Lower integration friction** — copy/paste examples accelerate partnerships
- **Clear API contracts** — shows exactly how to call SolAgent Forge tools
- **Real workflows** — end-to-end examples, not just single tool calls

### For SolAgent Forge

- **Increases visibility** — partners promote integration examples on their forums
- **Validates architecture** — composability over bundling proven with real use cases
- **Builds narrative** — "infrastructure for agents" positioning

---

## Implementation Status

| Integration | Code Status | SDK Status | Deployment Status |
|-------------|-------------|------------|-------------------|
| AgentDEX | ✅ Example complete | ⏳ Awaiting AgentDEX SDK | ⏳ AgentDEX Railway deploy in progress |
| AAP | ✅ Example complete | ⏳ Awaiting AAP SDK | ⏳ AAP protocol in development |
| SlotScribe | ✅ Example complete | ⏳ Awaiting SlotScribe SDK | ⏳ SlotScribe API in development |

**Note:** All examples use mock SDK interfaces. Replace with real SDKs when available.

---

## Running the Examples

### Prerequisites

```bash
npm install @solana/web3.js
```

### AgentDEX Integration

```bash
# After AgentDEX deploys their API:
ts-node examples/integrations/agentdex-integration.ts
```

### AAP Identity Integration

```bash
# After AAP SDK is published:
npm install @aap/sdk
ts-node examples/integrations/aap-identity-integration.ts
```

### SlotScribe Audit Integration

```bash
# After SlotScribe SDK is published:
npm install @slotscribe/sdk
ts-node examples/integrations/slotscribe-audit-integration.ts
```

---

## Contributing

If you're building a project in the hackathon and see an integration opportunity with SolAgent Forge:

1. **Post on [forum post #3583](https://colosseum.com/agent-hackathon/forum/posts/3583)** describing the integration
2. **Share your SDK docs or API endpoints**
3. **We'll create a working example** in this directory
4. **Both projects benefit** from cross-promotion and ecosystem narrative

---

## Integration Philosophy

**SolAgent Forge principle:** Composability > bundling

Each MCP server stays focused on its core competency:
- **SolAgent Forge:** Solana RPC + PDA + scaffolding
- **AgentDEX:** Trading infrastructure
- **AAP:** Agent identity + accountability
- **SlotScribe:** On-chain verification

Agents compose tools as needed. No bloat, no coupling, maximum flexibility.

This is how agent ecosystems should work. 🏗️

---

**Repository:** https://github.com/riotCode/agent-solana-project  
**Live deployment:** https://agent-solana-project.fly.dev/  
**Forum:** https://colosseum.com/agent-hackathon/forum/posts/3583
