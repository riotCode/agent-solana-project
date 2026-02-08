# SolAgent Forge Integration Examples

This directory contains **working examples** showing how other agents can immediately integrate SolAgent Forge tools into their projects.

## Quick Start

Each example is a complete, copy-paste-able integration showing:
1. How to initialize the MCP client
2. What parameters each tool expects
3. How to handle responses
4. Real-world use cases

### For GUARDIAN (Security)
**File:** `guardian-security-scanning.js`

Use SolAgent Forge's `security_scanner` to automatically analyze Solana programs for vulnerabilities before deployment.

```javascript
import { runSecurityScan } from './guardian-security-scanning.js';

const report = await runSecurityScan(
  '/path/to/idl.json',
  'programIdOnChain'
);

// Gets: vulnerability findings, risk scores, severity levels
// Use for: blocking deployments, threat intelligence, on-chain attestations
```

**Key features:**
- Detects reentrancy, overflow, oracle manipulation
- Returns structured vulnerability data
- Integrates with GUARDIAN's 17-agent swarm
- Can post results to on-chain threat registry

---

### For ClawSwap (Commerce)
**File:** `clawswap-commerce-scaffold.js`

Autonomously scaffold, test, and deploy trustless commerce contracts without human intervention.

```javascript
import { deployCommerceContract } from './clawswap-commerce-scaffold.js';

const contract = await deployCommerceContract(
  'my-escrow-contract',
  agentKeypair
);

// Automatically:
// 1. Scaffolds Anchor project with commerce features
// 2. Sets up LiteSVM testing
// 3. Deploys to devnet
// 4. Verifies on-chain discriminators
// 5. Generates TypeScript documentation
```

**Key features:**
- One-call deployment (scaffold → test → deploy → verify → document)
- Error handling with detailed fix recommendations
- Ready for ClawSwap ecosystem contracts
- Generates documentation for other agents

---

### For Sentinel (Trust)
**File:** `sentinel-fiduciary-validation.js`

Validate agent decisions against user's stated fiduciary duties before execution.

```javascript
import { validateFiduciaryAction, FiduciaryContext } from './sentinel-fiduciary-validation.js';

const userContext = new FiduciaryContext({
  goals: ['maximize_returns'],
  constraints: ['no_leverage', 'max_drawdown:10%'],
  riskTolerance: 'medium'
});

const validation = await validateFiduciaryAction(
  userContext,
  proposedAction
);

// Returns: APPROVED or BLOCKED with detailed reasoning
// Validates: loyalty, care, prudence, transparency, compliance
```

**Key features:**
- Five-duty fiduciary validation framework
- Blocks actions that violate user constraints
- Returns actionable recommendations
- Integrates with SolAgent Forge error analysis for deeper investigation

---

## Integration Pattern

All examples follow the same MCP client pattern:

```javascript
import { MCPClient } from '../mcp-client.js';

const client = new MCPClient({
  host: 'localhost',
  port: 3000,
  protocol: 'mcp'
});

// Call any SolAgent Forge tool
const result = await client.call('tool_name', {
  param1: value1,
  param2: value2
});

if (!result.success) {
  console.error('Tool failed:', result.error);
  return null;
}

// Use result.data for actual output
console.log(result.data);
```

## Available Tools

These examples use these SolAgent Forge tools:

| Tool | Use Case | Example |
|------|----------|---------|
| `scaffold_program` | Generate Anchor projects | ClawSwap commerce contracts |
| `setup_testing` | Configure test framework | Local devnet testing |
| `deploy_devnet` | Deploy to Solana devnet | Contract deployment |
| `verify_onchain_discriminators` | Check on-chain bytecode | Post-deployment verification |
| `generate_docs` | Create documentation | TypeScript SDK generation |
| `scan_security` | Detect vulnerabilities | GUARDIAN threat analysis |
| `analyze_errors` | Understand Solana errors | Failure root cause analysis |

See [../README.md](../README.md) for full tool documentation.

## Running Examples

### 1. Start SolAgent Forge MCP server
```bash
cd /app/generated
npm run server
# Listens on localhost:3000
```

### 2. Run integration examples
```bash
# GUARDIAN security scanning
node integration-examples/guardian-security-scanning.js

# ClawSwap deployment
node integration-examples/clawswap-commerce-scaffold.js

# Sentinel validation
node integration-examples/sentinel-fiduciary-validation.js
```

## Customization

Each example shows how to:
- Adapt tool parameters for your use case
- Handle success/failure cases
- Chain multiple tools together
- Process and report results

Modify parameter values and add your own contract names, program IDs, and user contexts.

## For Project Teams

If you're building on Solana during the hackathon and need:
- **Security validation** → Use GUARDIAN example
- **Contract scaffolding** → Use ClawSwap example
- **Fiduciary validation** → Use Sentinel example

Copy the relevant integration file into your project and adapt the parameters.

## Questions?

See the main [GitHub repository](https://github.com/riotCode/agent-solana-project) for full documentation and additional examples.

---

**SolAgent Forge** — AI infrastructure for autonomous Solana development.
