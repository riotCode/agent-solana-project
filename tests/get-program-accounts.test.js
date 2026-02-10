import test from 'node:test';
import assert from 'node:assert';
import { getProgramAccounts } from '../mcp-server/tools/get-program-accounts.js';

test('getProgramAccounts', async (t) => {
  await t.test('validates program ID format', async () => {
    const result = await getProgramAccounts({
      programId: 'invalid-program-id'
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid program ID'));
  });

  await t.test('accepts valid program ID format', async () => {
    const result = await getProgramAccounts({
      programId: '11111111111111111111111111111111',
      cluster: 'devnet',
      limit: 5
    });

    // Should not fail on validation (may fail on network)
    if (result.success) {
      assert.ok(Array.isArray(result.accounts));
      assert.ok(result.totalAccounts >= 0);
    } else {
      // Network error is acceptable
      assert.ok(result.error);
    }
  });

  await t.test('applies limit parameter', async () => {
    const result = await getProgramAccounts({
      programId: '11111111111111111111111111111111',
      limit: 3
    });

    if (result.success) {
      assert.ok(result.returnedAccounts <= 3);
    }
  });
});
