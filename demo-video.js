#!/usr/bin/env node

/**
 * SolAgent Forge - RPC + PDA + Scaffolding Demo
 * 
 * Demonstrates the current focus of SolAgent Forge:
 * - Solana RPC interaction
 * - PDA derivation
 * - Anchor scaffolding
 * - Security scanning
 * 
 * Note: RPC-dependent steps may fail if devnet/mainnet is unavailable.
 * The demo handles network failures gracefully.
 */

import { scaffoldProgram } from './mcp-server/tools/scaffold.js';
import { scanSecurity } from './mcp-server/tools/security-scanner.js';
import { derivePda } from './mcp-server/tools/derive-pda.js';
import { getAccountInfo } from './mcp-server/tools/get-account-info.js';
import { getBalance } from './mcp-server/tools/get-balance.js';
import { getProgramAccounts } from './mcp-server/tools/get-program-accounts.js';
import { parseTransaction } from './mcp-server/tools/parse-transaction.js';

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
  log('\nSolAgent Forge — RPC + PDA + Scaffolding Demo', 'bright');
  log('Demonstrating agent-ready Solana primitives (network tolerant)\n', 'bright');

  // A stable, well-known program id to demo against
  const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';

  try {
    // ============================================================
    // STEP 1: PDA DERIVATION
    // ============================================================
    section('STEP 1: Derive a PDA');
    log('Deriving a Program Derived Address from seeds + programId...', 'blue');

    const pdaResult = await derivePda({
      programId: SYSTEM_PROGRAM_ID,
      seeds: ['solagent-forge', 'demo']
    });

    if (pdaResult.success) {
      log('✅ PDA derived successfully', 'green');
      log(`   programId: ${pdaResult.programId}`, 'green');
      log(`   pda:      ${pdaResult.pda}`, 'green');
      log(`   bump:     ${pdaResult.bump}`, 'green');
    } else {
      log(`⚠️  PDA derivation failed: ${pdaResult.error}`, 'yellow');
    }

    // ============================================================
    // STEP 2: RPC QUERIES (ACCOUNT INFO + BALANCE)
    // ============================================================
    section('STEP 2: RPC Queries (Account Info + Balance)');
    log('Fetching account info for the System Program...', 'blue');

    const acct = await getAccountInfo({
      publicKey: SYSTEM_PROGRAM_ID,
      cluster: 'devnet'
    });

    if (acct.success) {
      if (acct.exists) {
        log('✅ Account exists on-chain', 'green');
        log(`   owner:       ${acct.accountInfo.owner}`, 'green');
        log(`   executable:  ${acct.accountInfo.executable}`, 'green');
        log(`   dataLength:  ${acct.accountInfo.dataLength}`, 'green');
      } else {
        log('⚠️  Account does not exist on this cluster', 'yellow');
      }
    } else {
      note(`RPC unavailable (account info): ${acct.error}`);
    }

    log('Fetching SOL balance for the System Program address...', 'blue');
    const bal = await getBalance({
      publicKey: SYSTEM_PROGRAM_ID,
      cluster: 'devnet'
    });

    if (bal.success) {
      log('✅ Balance fetched', 'green');
      log(`   ${bal.balance.formatted}`, 'green');
    } else {
      note(`RPC unavailable (balance): ${bal.error}`);
    }

    // ============================================================
    // STEP 3: SCAFFOLD AN ANCHOR PROGRAM
    // ============================================================
    section('STEP 3: Scaffold an Anchor Program');
    log('Generating an Anchor project skeleton (PDA + token templates)...', 'blue');

    const scaffoldResult = await scaffoldProgram({
      programName: 'demo-vault',
      features: ['pda', 'token']
    });

    if (scaffoldResult.success) {
      log('✅ Program scaffolded successfully', 'green');
      log(`   projectPath: ${scaffoldResult.projectPath}`, 'green');
      if (scaffoldResult.filesCreated) {
        log(`   filesCreated: ${scaffoldResult.filesCreated}`, 'green');
      }
    } else {
      log(`⚠️  Scaffold returned info: ${scaffoldResult.details || scaffoldResult.message || scaffoldResult.error}`, 'yellow');
    }

    // ============================================================
    // STEP 4: SECURITY SCANNING
    // ============================================================
    section('STEP 4: Security Scan');
    log('Scanning sample Anchor code for common vulnerabilities...', 'blue');

    const sampleCode = `
#[program]
pub mod demo_vault {
    use super::*;

    pub fn vulnerable_withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // ❌ CPI call before state update - reentrancy risk
        transfer_tokens(&ctx, amount)?;
        ctx.accounts.vault.amount -= amount;
        Ok(())
    }

    pub fn add_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // ❌ Unchecked arithmetic - overflow risk
        ctx.accounts.vault.balance = ctx.accounts.vault.balance + amount;
        Ok(())
    }
}
`;

    const securityResult = await scanSecurity({
      code: sampleCode,
      codeType: 'rust',
      severity: 'medium'
    });

    if (securityResult.success) {
      log('✅ Security scan complete', 'green');
      log(`   vulnerabilityCount: ${securityResult.vulnerabilityCount}`, 'green');
      const top = (securityResult.vulnerabilities || []).slice(0, 3);
      for (const v of top) {
        log(`   - ${v.id} (${v.severity}): ${v.description}`, 'yellow');
      }
    } else {
      log(`⚠️  Security scan failed: ${securityResult.error}`, 'yellow');
    }

    // ============================================================
    // STEP 5: PROGRAM ACCOUNTS QUERY
    // ============================================================
    section('STEP 5: Query Program Accounts');
    log('Querying accounts owned by the System Program (limited)...', 'blue');

    const progAccts = await getProgramAccounts({
      programId: SYSTEM_PROGRAM_ID,
      cluster: 'devnet',
      limit: 3
    });

    if (progAccts.success) {
      log('✅ Program accounts query succeeded', 'green');
      log(`   totalAccounts: ${progAccts.totalAccounts}`, 'green');
      log(`   returnedAccounts: ${progAccts.returnedAccounts}`, 'green');
      for (const a of (progAccts.accounts || [])) {
        log(`   - ${a.publicKey} (lamports=${a.lamports}, dataLength=${a.dataLength})`, 'gray');
      }
    } else {
      note(`RPC unavailable (program accounts): ${progAccts.error}`);
    }

    // ============================================================
    // STEP 6: TRANSACTION PARSING
    // ============================================================
    section('STEP 6: Parse a Transaction');
    log('Attempting to parse a (likely non-existent) signature on devnet...', 'blue');

    const tx = await parseTransaction({
      signature: '1'.repeat(88),
      cluster: 'devnet'
    });

    if (tx.success) {
      if (tx.exists) {
        log('✅ Transaction found and parsed', 'green');
        log(`   slot: ${tx.transaction.slot}`, 'green');
        log(`   status: ${tx.transaction.status}`, 'green');
        log(`   fee: ${tx.transaction.fee}`, 'green');
        log(`   instructions: ${tx.transaction.instructions.length}`, 'green');
      } else {
        log('✅ Transaction not found (expected for demo signature)', 'green');
      }
    } else {
      note(`RPC unavailable (parse transaction): ${tx.error}`);
    }

    // ============================================================
    // DONE
    // ============================================================
    section('DONE');
    log('✅ Demo completed', 'green');
    log('If RPC calls failed, re-run later or set a custom rpcUrl in tool args.', 'gray');
    log('', 'reset');

  } catch (err) {
    log('❌ Demo failed unexpectedly', 'yellow');
    console.error(err);
    process.exit(1);
  }
}

runDemo();
