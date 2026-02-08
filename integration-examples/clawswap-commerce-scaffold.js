/**
 * ClawSwap Commerce Integration Example
 * 
 * Shows how ClawSwap agents can use SolAgent Forge to autonomously:
 * 1. Scaffold escrow/payment contracts
 * 2. Set up testing environments
 * 3. Deploy to devnet
 * 4. Verify discriminators before mainnet
 * 5. Generate documentation for other agents
 * 
 * Use case: Agents building on ClawSwap need to deploy trustless commerce contracts
 * without manual setup or human intervention.
 */

import { MCPClient } from '../mcp-client.js';

const client = new MCPClient({
  host: 'localhost',
  port: 3000,
  protocol: 'mcp'
});

async function scaffoldCommerceProgram(contractName, features = []) {
  /**
   * Step 1: Generate Anchor project structure
   * Features: ['pda', 'cpi', 'token', 'escrow']
   */
  console.log(`📦 Scaffolding ${contractName} commerce contract...`);
  
  const scaffoldResult = await client.call('scaffold_program', {
    programName: contractName,
    features: ['pda', 'token', ...features]  // Escrow needs PDAs + token accounts
  });
  
  if (!scaffoldResult.success) {
    throw new Error(`Scaffold failed: ${scaffoldResult.error}`);
  }
  
  console.log(`✅ Project structure created at: ${scaffoldResult.data.projectPath}`);
  return scaffoldResult.data.projectPath;
}

async function setupTestEnvironment(projectPath) {
  /**
   * Step 2: Configure testing framework
   * Use LiteSVM for fast, local testing without validators
   */
  console.log(`🧪 Setting up test environment...`);
  
  const testResult = await client.call('setup_testing', {
    framework: 'litesvm'  // Fast, no network latency
  });
  
  if (!testResult.success) {
    throw new Error(`Test setup failed: ${testResult.error}`);
  }
  
  console.log(`✅ Test environment ready. Features:`);
  console.log(`   - Fast local testing (no network)`);
  console.log(`   - Automatic account funding`);
  console.log(`   - Built-in program deployment`);
  
  return testResult.data;
}

async function deployToDevnet(projectPath, keypair) {
  /**
   * Step 3: Build and deploy to Solana devnet
   * Autonomous deployment with error handling
   */
  console.log(`🚀 Deploying to devnet...`);
  
  const deployResult = await client.call('deploy_devnet', {
    programPath: projectPath,
    cluster: 'devnet',
    keypair: keypair  // AgentWallet-managed keypair
  });
  
  if (!deployResult.success) {
    // Try to analyze the deployment error
    const errorAnalysis = await client.call('analyze_errors', {
      error: deployResult.error,
      context: 'anchor_deploy'
    });
    
    console.error(`❌ Deployment failed:`);
    console.error(`   ${errorAnalysis.data.analysis}`);
    console.error(`   Fix: ${errorAnalysis.data.recommendation}`);
    
    return null;
  }
  
  const { programId, txSignature } = deployResult.data;
  console.log(`✅ Deployed to devnet`);
  console.log(`   Program ID: ${programId}`);
  console.log(`   Tx: ${txSignature}`);
  
  return { programId, txSignature };
}

async function verifyDeployment(programId, idlPath) {
  /**
   * Step 4: Verify program on-chain and check discriminators
   * Ensures IDL matches deployed bytecode
   */
  console.log(`🔍 Verifying deployment...`);
  
  const verifyResult = await client.call('verify_onchain_discriminators', {
    programId: programId,
    cluster: 'devnet'
  });
  
  if (!verifyResult.success) {
    console.error(`❌ Verification failed: ${verifyResult.error}`);
    return false;
  }
  
  const { fetched_idl, matches } = verifyResult.data;
  console.log(`✅ Program verified on-chain`);
  console.log(`   IDL match: ${matches ? '✓' : '✗'}`);
  
  return matches;
}

async function generateDocumentation(projectPath, idlPath) {
  /**
   * Step 5: Generate documentation for other agents
   * Produces API reference that any agent can integrate
   */
  console.log(`📚 Generating documentation...`);
  
  const docsResult = await client.call('generate_docs', {
    idlPath: idlPath,
    format: 'typescript'  // SDK-ready format
  });
  
  if (!docsResult.success) {
    console.error(`Docs generation failed: ${docsResult.error}`);
    return null;
  }
  
  console.log(`✅ Documentation generated`);
  console.log(`   - TypeScript SDK types`);
  console.log(`   - Instruction signatures`);
  console.log(`   - Account schemas`);
  console.log(`   - Integration examples`);
  
  return docsResult.data.docsPath;
}

/**
 * Full Workflow: Scaffold → Test → Deploy → Verify → Document
 * Runs completely autonomously for any ClawSwap contract
 */
async function deployCommerceContract(contractName, keypair) {
  try {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`ClawSwap Autonomous Deployment: ${contractName}`);
    console.log(`${'='.repeat(50)}\n`);
    
    // 1. Generate project structure
    const projectPath = await scaffoldCommerceProgram(contractName, ['escrow']);
    
    // 2. Set up testing
    const testConfig = await setupTestEnvironment(projectPath);
    
    // 3. Deploy to devnet
    const deployment = await deployToDevnet(projectPath, keypair);
    if (!deployment) return null;
    
    // 4. Verify on-chain
    const verified = await verifyDeployment(
      deployment.programId,
      `${projectPath}/target/idl/${contractName}.json`
    );
    
    if (!verified) {
      console.error('Deployment verification failed. Check bytecode match.');
      return null;
    }
    
    // 5. Generate docs for ecosystem
    const docsPath = await generateDocumentation(
      projectPath,
      `${projectPath}/target/idl/${contractName}.json`
    );
    
    // Return summary for contract registry
    const result = {
      contractName,
      projectPath,
      programId: deployment.programId,
      txSignature: deployment.txSignature,
      verified: true,
      docsPath,
      deployedAt: new Date().toISOString(),
      cluster: 'devnet',
      readyForMainnet: true
    };
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Contract deployed and ready for use`);
    console.log(`Program ID: ${result.programId}`);
    console.log(`Documentation: ${result.docsPath}`);
    console.log(`${'='.repeat(50)}\n`);
    
    return result;
    
  } catch (error) {
    console.error(`Fatal error during deployment:`, error.message);
    return null;
  }
}

// Example usage for ClawSwap agents
async function main() {
  // Any ClawSwap agent can call this with their contract name
  const result = await deployCommerceContract(
    'clawswap-escrow',
    process.env.AGENT_KEYPAIR  // Managed by AgentWallet
  );
  
  if (result) {
    console.log('\nDeployment summary:', result);
  }
}

export { deployCommerceContract, scaffoldCommerceProgram };
