/**
 * Tests for analyze_errors tool
 */

import test from 'node:test';
import assert from 'node:assert';
import { analyzeErrors, ERROR_PATTERNS } from '../mcp-server/tools/error-analysis.js';

test('analyzeErrors validates required inputs', async (t) => {
  // Missing errorOutput
  const result = await analyzeErrors({});
  assert.strictEqual(result.success, false);
  assert(result.error);
});

test('analyzeErrors parses compilation errors correctly', async (t) => {
  const rustError = `error[E0425]: cannot find value \`authority\` in this scope
   --> src/lib.rs:15:10
    |
  15 | let owner = authority.key();
     | ^^^^^^^^^ not found in this scope`;

  const result = await analyzeErrors({ errorOutput: rustError });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.errorCount, 1);
  assert(result.errors[0]);
});

test('analyzeErrors detects PDA seed issues', async (t) => {
  const pdaError = `error: PDA seed mismatch
   --> src/lib.rs:20:5
    |
  20 | let (pda, bump) = Pubkey::find_program_address(
     | ^^^^^^^^ seed derivation failed`;

  const result = await analyzeErrors({ errorOutput: pdaError });
  assert.strictEqual(result.success, true);
  const error = result.errors[0];
  assert.strictEqual(error.category, 'PDA_SEED');
  assert.strictEqual(error.severity, 'high');
  assert(error.fix.includes('findProgramAddressSync'));
});

test('analyzeErrors detects account ownership issues', async (t) => {
  const ownerError = `error: Account must be mutable
   --> src/lib.rs:25:10
    |
  25 | pub data: Account<'info, DataAccount>,
     | ^^^^^^^^ needs mut`;

  const result = await analyzeErrors({ errorOutput: ownerError });
  assert.strictEqual(result.success, true);
  const error = result.errors[0];
  assert.strictEqual(error.category, 'ACCOUNT_OWNERSHIP');
  assert.strictEqual(error.severity, 'critical');
});

test('analyzeErrors detects CPI issues', async (t) => {
  const cpiError = `error: CPI invocation failed
   --> src/lib.rs:30:10
    |
  30 | invoke(&cpi_ctx, ...)?;
     | ^^^^^^ invalid account order`;

  const result = await analyzeErrors({ errorOutput: cpiError });
  assert.strictEqual(result.success, true);
  const error = result.errors[0];
  assert.strictEqual(error.category, 'CPI_ISSUE');
  assert.strictEqual(error.severity, 'high');
});

test('analyzeErrors detects compute unit overflow', async (t) => {
  const computeError = `error: Compute units exceeded
   --> src/lib.rs:40:10
    |
  40 | expensive_operation();
     | ^^^^^^^^^^^^^^^^^^^ exceeds budget`;

  const result = await analyzeErrors({ errorOutput: computeError });
  assert.strictEqual(result.success, true);
  const error = result.errors[0];
  assert.strictEqual(error.category, 'COMPUTE_LIMIT');
  assert.strictEqual(error.severity, 'high');
});

test('analyzeErrors detects type mismatches', async (t) => {
  const typeError = `error[E0308]: mismatched types
   --> src/lib.rs:45:10
    |
  45 | let amount: u32 = ctx.accounts.amount as u64;
     | ^^^^ expected u32, found u64`;

  const result = await analyzeErrors({ errorOutput: typeError });
  assert.strictEqual(result.success, true);
  const error = result.errors[0];
  assert.strictEqual(error.category, 'TYPE_MISMATCH');
  assert.strictEqual(error.severity, 'medium');
});

test('analyzeErrors detects lifetime issues', async (t) => {
  const lifetimeError = `error[E0106]: missing lifetime specifier
   --> src/lib.rs:50:10
    |
  50 | pub account: Account<DataAccount>,
     | ^^^^^^^^ expected lifetime`;

  const result = await analyzeErrors({ errorOutput: lifetimeError });
  assert.strictEqual(result.success, true);
  const error = result.errors[0];
  assert.strictEqual(error.category, 'LIFETIME_ISSUE');
  assert(error.fix.includes("'info"));
});

test('analyzeErrors handles multiple errors', async (t) => {
  const multiError = `error[E0425]: cannot find value \`x\`
   --> src/lib.rs:10:5

error[E0308]: mismatched types
   --> src/lib.rs:15:5

error: Account constraint failed
   --> src/lib.rs:20:5`;

  const result = await analyzeErrors({ errorOutput: multiError });
  assert.strictEqual(result.success, true);
  assert(result.errorCount >= 2);
});

test('analyzeErrors generates summary correctly', async (t) => {
  const errors = `error: Account ownership failed
   --> src/lib.rs:10:5
   
error: PDA seed mismatch
   --> src/lib.rs:15:5`;

  const result = await analyzeErrors({ errorOutput: errors });
  assert.strictEqual(result.success, true);
  assert(result.summary);
  assert(result.summary.totalErrors >= 2);
  assert(result.summary.bySeverity);
});

test('analyzeErrors generates recommendations', async (t) => {
  const pdaError = `error: PDA seed mismatch
   --> src/lib.rs:20:5`;

  const result = await analyzeErrors({ errorOutput: pdaError });
  assert.strictEqual(result.success, true);
  assert(result.recommendations);
  assert(Array.isArray(result.recommendations));
});

test('analyzeErrors accepts errorType parameter', async (t) => {
  const error = `error: Something failed`;

  const resultCompilation = await analyzeErrors({
    errorOutput: error,
    errorType: 'compilation'
  });
  assert.strictEqual(resultCompilation.success, true);

  const resultRuntime = await analyzeErrors({
    errorOutput: error,
    errorType: 'runtime'
  });
  assert.strictEqual(resultRuntime.success, true);

  const resultTest = await analyzeErrors({
    errorOutput: error,
    errorType: 'test'
  });
  assert.strictEqual(resultTest.success, true);
});

test('analyzeErrors provides working examples', async (t) => {
  const pdaError = `error: PDA seed mismatch
   --> src/lib.rs:20:5`;

  const result = await analyzeErrors({ errorOutput: pdaError });
  const error = result.errors[0];
  
  assert(error.example);
  assert(error.example.includes('findProgramAddressSync'));
  assert(error.example.includes('Buffer.from'));
});

test('analyzeErrors provides documentation links', async (t) => {
  const ownerError = `error: Account ownership failed
   --> src/lib.rs:10:5`;

  const result = await analyzeErrors({ errorOutput: ownerError });
  const error = result.errors[0];
  
  assert(error.moreInfo);
  assert(error.moreInfo.includes('http'));
});

test('ERROR_PATTERNS export contains all patterns', async (t) => {
  assert(ERROR_PATTERNS.PDA_SEED);
  assert(ERROR_PATTERNS.ACCOUNT_OWNERSHIP);
  assert(ERROR_PATTERNS.CPI_ISSUE);
  assert(ERROR_PATTERNS.COMPUTE_LIMIT);
  assert(ERROR_PATTERNS.TYPE_MISMATCH);
  assert(ERROR_PATTERNS.LIFETIME_ISSUE);
});

test('analyzeErrors handles constraint violations', async (t) => {
  const constraintError = `error: Constraint failed
   --> src/lib.rs:25:10
    |
  25 | constraint = owner.key() == ctx.accounts.owner.key()
     | ^^^^^^^^^^^^^^ assertion failed`;

  const result = await analyzeErrors({ errorOutput: constraintError });
  assert.strictEqual(result.success, true);
  const error = result.errors[0];
  assert.strictEqual(error.category, 'CONSTRAINT_VIOLATION');
});

test('analyzeErrors handles unknown errors gracefully', async (t) => {
  const unknownError = `error: The build system encountered an unprecedented scenario
   --> src/lib.rs:1:1`;

  const result = await analyzeErrors({ errorOutput: unknownError });
  assert.strictEqual(result.success, true);
  const error = result.errors[0];
  assert.strictEqual(error.category, 'UNKNOWN');
  assert.strictEqual(error.severity, 'low');
});

test('analyzeErrors parses file locations correctly', async (t) => {
  const error = `error[E0425]: cannot find value
   --> src/lib.rs:42:15`;

  const result = await analyzeErrors({ errorOutput: error });
  const parsedError = result.errors[0];
  assert(parsedError.location);
  assert.strictEqual(parsedError.location.file, 'src/lib.rs');
  assert.strictEqual(parsedError.location.line, 42);
  assert.strictEqual(parsedError.location.column, 15);
});

test('analyzeErrors summary includes severity breakdown', async (t) => {
  const errors = `error: Critical issue
   --> src/lib.rs:10:5
   
error: Medium issue
   --> src/lib.rs:15:5`;

  const result = await analyzeErrors({ errorOutput: errors });
  assert(result.summary.bySeverity);
  assert(typeof result.summary.bySeverity.critical === 'number');
  assert(typeof result.summary.bySeverity.high === 'number');
  assert(typeof result.summary.bySeverity.medium === 'number');
  assert(typeof result.summary.bySeverity.low === 'number');
});
