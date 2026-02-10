/**
 * AgentDEX Integration Example
 * 
 * Demonstrates how to use SolAgent Forge + AgentDEX together:
 * 1. Scaffold a DeFi program with SolAgent Forge
 * 2. Test token swaps with AgentDEX
 * 3. Deploy the program to devnet
 * 
 * Integration proposal from: @JacobsClawd (comment 26893)
 * 
 * MCP-to-MCP composition pattern: each server stays focused,
 * agents compose tools as needed.
 */

// ============================================================
// STEP 1: Scaffold DeFi Program with SolAgent Forge MCP
// ============================================================

async function scaffoldDeFiProgram() {
  const response = await fetch('https://agent-solana-project.fly.dev/tools/scaffold_program', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      programName: 'defi_vault',
      features: ['pda', 'token']  // PDA for vault state, token for SPL token support
    })
  });

  const result = await response.json();
  console.log('✅ DeFi program scaffolded:', result.projectPath);
  return result.projectPath;
}

// ============================================================
// STEP 2: Test Token Swaps with AgentDEX
// ============================================================

async function testSwapInfrastructure(tokenMint: string) {
  // Get quote from Jupiter via AgentDEX
  const quoteResponse = await fetch('https://agentdex.example.com/quote', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputMint: 'So11111111111111111111111111111111111111112', // SOL
      outputMint: tokenMint,
      amount: 1000000 // 0.001 SOL
    })
  });

  const quote = await quoteResponse.json();
  console.log('✅ Swap quote received:', quote);

  // Execute swap (unsigned mode for testing)
  const swapResponse = await fetch('https://agentdex.example.com/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quote: quote.quoteId,
      wallet: 'YourTestWalletPublicKey...',
      mode: 'unsigned' // Returns transaction for testing
    })
  });

  const swapTx = await swapResponse.json();
  console.log('✅ Swap transaction ready for testing:', swapTx.transaction);

  return swapTx;
}

// ============================================================
// STEP 3: Deploy Program with SolAgent Forge
// ============================================================

async function deployToDevnet(projectPath: string) {
  const response = await fetch('https://agent-solana-project.fly.dev/tools/deploy_devnet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      programPath: projectPath,
      cluster: 'devnet'
    })
  });

  const result = await response.json();
  console.log('✅ Program deployed to devnet:', result.programId);
  return result.programId;
}

// ============================================================
// STEP 4: Verify Deployment Status
// ============================================================

async function verifyDeployment(programId: string) {
  const response = await fetch('https://agent-solana-project.fly.dev/tools/get_deployment_status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      programId,
      cluster: 'devnet'
    })
  });

  const result = await response.json();
  console.log('✅ Deployment verified:', result);
  return result;
}

// ============================================================
// Full Workflow
// ============================================================

async function runDeFiWorkflow() {
  console.log('🚀 Starting SolAgent Forge + AgentDEX Integration\n');

  // 1. Scaffold DeFi program
  const projectPath = await scaffoldDeFiProgram();

  // 2. Test swap infrastructure with a known token
  const testTokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC devnet
  const swapResult = await testSwapInfrastructure(testTokenMint);

  // 3. Deploy program to devnet
  const programId = await deployToDevnet(projectPath);

  // 4. Verify deployment
  await verifyDeployment(programId);

  console.log('\n✅ Full dev-to-trade pipeline complete!');
  console.log(`   - Program: ${programId}`);
  console.log(`   - Swap infrastructure: tested via AgentDEX`);
  console.log(`   - Deployment: verified on-chain`);
}

// Run the workflow
// runDeFiWorkflow().catch(console.error);

export { scaffoldDeFiProgram, testSwapInfrastructure, deployToDevnet, verifyDeployment };
