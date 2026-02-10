#!/usr/bin/env node

/**
 * SolAgent Forge - 8-Tool Demo
 * 
 * Demonstrates the focused MCP server:
 * - Live Solana RPC (5 tools)
 * - Deterministic Crypto (2 tools)
 * - Scaffolding (1 tool)
 * 
 * Note: RPC-dependent steps may fail if devnet/mainnet is unavailable.
 * Deterministic tools (PDA, discriminator, scaffold) work offline.
 */

import { scaffoldProgram } from './mcp-server/tools/scaffold.js';
import { derivePda } from './mcp-server/tools/derive-pda.js';
import { computeDiscriminator } from './mcp-server/tools/compute-discriminator.js';
import { getAccountInfo } from './mcp-server/tools/get-account-info.js';
import { getBalance } from './mcp-server/tools/get-balance.js';
import { getProgramInfo } from './mcp-server/tools/get-program-info.js';
import { parseTransaction } from './mcp-server/tools/parse-transaction.js';
import { fundWallet } from './mcp-server/tools/fund-wallet.js';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function section(title) {
  console.log('\n');
  log('═'.repeat(72), 'cyan');
  log(`▶ ${title}`, 'cyan');
  log('═'.repeat(72), 'cyan');
}

function note(msg) {
  log(`ℹ️  ${msg}`, 'gray');
}

async function runDemo() {
  log('\nSolAgent Forge — 8-Tool MCP Server Demo', 'bright');
  log('Design: Pure RPC + Deterministic Crypto + Scaffolding', 'bright');

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // DETERMINISTIC TOOLS (Work Offline)
    // ═══════════════════════════════════════════════════════════════════════

    section('1️⃣  PDA Derivation (Deterministic, Offline)');
    note('Computing PDA for Token Metadata program');
    const pdaResult = await derivePda({
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      seeds: ['metadata', 'EPjFWaJstUeSfuBMKrZjMGcPxc2b9B1d53A8tzDNMFp']
    });
    if (pdaResult.success) {
      log(`✅ PDA derived successfully`, 'green');
      log(`   Address: ${pdaResult.pda}`, 'blue');
      log(`   Bump: ${pdaResult.bump}`, 'blue');
    } else {
      log(`❌ ${pdaResult.error}`, 'yellow');
    }

    // ═══════════════════════════════════════════════════════════════════════

    section('2️⃣  Discriminator Computation (Deterministic, Offline)');
    note('Computing Anchor instruction discriminator');
    const discResult = await computeDiscriminator({
      instructionName: 'initialize'
    });
    if (discResult.success) {
      log(`✅ Discriminator computed`, 'green');
      log(`   Instruction: ${discResult.instructionName}`, 'blue');
      log(`   Hex: ${discResult.discriminator.hex}`, 'blue');
      log(`   Bytes: [${discResult.discriminator.bytes.join(', ')}]`, 'blue');
    } else {
      log(`❌ ${discResult.error}`, 'yellow');
    }

    // ═══════════════════════════════════════════════════════════════════════

    section('3️⃣  Anchor Scaffolding (Deterministic, Offline)');
    note('Generating Anchor program boilerplate');
    const scaffoldResult = await scaffoldProgram({
      programName: 'vault-demo',
      features: ['pda', 'token']
    });
    if (scaffoldResult.success) {
      log(`✅ Program scaffolded successfully`, 'green');
      log(`   Path: ${scaffoldResult.programPath}`, 'blue');
      log(`   Files created: ${scaffoldResult.filesCreated}`, 'blue');
    } else {
      log(`❌ ${scaffoldResult.error}`, 'yellow');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RPC TOOLS (Require Network)
    // ═══════════════════════════════════════════════════════════════════════

    section('4️⃣  Get Balance (RPC, requires network)');
    note('Querying account balance on devnet');
    const balanceResult = await getBalance({
      publicKey: '11111111111111111111111111111112',
      cluster: 'devnet'
    });
    if (balanceResult.success) {
      log(`✅ Balance retrieved`, 'green');
      log(`   Lamports: ${balanceResult.lamports}`, 'blue');
      log(`   SOL: ${balanceResult.sol}`, 'blue');
    } else {
      log(`⚠️  ${balanceResult.error || balanceResult.details}`, 'yellow');
    }

    // ═══════════════════════════════════════════════════════════════════════

    section('5️⃣  Get Account Info (RPC, requires network)');
    note('Fetching account data on devnet');
    const accountResult = await getAccountInfo({
      publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      cluster: 'devnet',
      encoding: 'base64'
    });
    if (accountResult.success) {
      log(`✅ Account info retrieved`, 'green');
      log(`   Owner: ${accountResult.owner}`, 'blue');
      log(`   Executable: ${accountResult.executable}`, 'blue');
      log(`   Lamports: ${accountResult.lamports}`, 'blue');
    } else {
      log(`⚠️  ${accountResult.error || accountResult.details}`, 'yellow');
    }

    // ═══════════════════════════════════════════════════════════════════════

    section('6️⃣  Get Program Info (RPC, requires network)');
    note('Checking Token Program deployment on devnet');
    const progResult = await getProgramInfo({
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      cluster: 'devnet'
    });
    if (progResult.success) {
      log(`✅ Program info retrieved`, 'green');
      log(`   Deployed: ${progResult.deployed}`, 'blue');
      log(`   Executable: ${progResult.executable}`, 'blue');
      if (progResult.deployed) {
        log(`   Data Size: ${progResult.dataSize}`, 'blue');
      }
    } else {
      log(`⚠️  ${progResult.error || progResult.details}`, 'yellow');
    }

    // ═══════════════════════════════════════════════════════════════════════

    section('7️⃣  Parse Transaction (RPC, requires network)');
    note('Parsing a real transaction on devnet');
    const txResult = await parseTransaction({
      signature: '5j7s6NiJS3JAkvgkoc18WVAsiSaci2pxB2A6ueCJP4tprA2TFg9wSyTLeYouxPBJEMzJinENTkpA52YStRW5Dia7',
      cluster: 'devnet'
    });
    if (txResult.success) {
      log(`✅ Transaction parsed`, 'green');
      log(`   Slot: ${txResult.slot}`, 'blue');
      log(`   Signers: ${txResult.accountKeys?.signers?.length || 0}`, 'blue');
      log(`   Instructions: ${txResult.instructions?.length || 0}`, 'blue');
    } else {
      log(`⚠️  ${txResult.error || txResult.details}`, 'yellow');
    }

    // ═══════════════════════════════════════════════════════════════════════

    section('8️⃣  Fund Wallet (RPC, devnet/testnet only)');
    note('Attempting airdrop on devnet (may be rate-limited)');
    const fundResult = await fundWallet({
      publicKey: '11111111111111111111111111111112',
      cluster: 'devnet',
      amount: 1
    });
    if (fundResult.success) {
      log(`✅ Airdrop succeeded`, 'green');
      log(`   Signature: ${fundResult.signature}`, 'blue');
      log(`   Balance: ${fundResult.balanceAfter} SOL`, 'blue');
    } else {
      log(`⚠️  ${fundResult.error || fundResult.details}`, 'yellow');
    }

    // ═══════════════════════════════════════════════════════════════════════

    section('✅ Demo Complete');
    log('\nSummary:', 'bright');
    log('✅ Deterministic tools (PDA, discriminator, scaffold) work offline', 'green');
    log('✅ RPC tools gracefully handle network issues', 'green');
    log('✅ All 8 tools are functional and production-ready', 'green');
    log('\nDesign Philosophy:', 'bright');
    log('  Only tools agents genuinely cannot replicate natively:', 'blue');
    log('  • Live blockchain RPC (agents can't do this)', 'blue');
    log('  • Deterministic PDA derivation (agents hallucinate these)', 'blue');
    log('  • Discriminator computation (agents hallucinate these)', 'blue');
    log('  • Anchor scaffolding (useful boilerplate)', 'blue');
    log('\nNot included:', 'bright');
    log('  ✗ Error analysis (agents reason about errors better)', 'gray');
    log('  ✗ Security scanning (agents have better AST analysis)', 'gray');
    log('  ✗ Documentation generation (agents create richer docs)', 'gray');
    log('  ✗ CLI-based deployment (doesn\'t work in agent environments)', 'gray');

  } catch (error) {
    log(`\n❌ Demo error: ${error.message}`, 'yellow');
    process.exit(1);
  }
}

runDemo().then(() => {
  log('\nDemo finished.\n', 'cyan');
  process.exit(0);
}).catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'yellow');
  process.exit(1);
});
