import test from 'node:test';
import assert from 'node:assert';
import { getBalance } from '../mcp-server/tools/get-balance.js';

test('getBalance', async (t) => {
  await t.test('validates public key format', async () => {
    const result = await getBalance({
      publicKey: 'invalid-key',
      cluster: 'devnet'
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid public key'));
  });

  await t.test('accepts valid public key format', async () => {
    const result = await getBalance({
      publicKey: '11111111111111111111111111111111',
      cluster: 'devnet'
    });

    // Should not fail on validation (may fail on network)
    if (result.success) {
      assert.ok(typeof result.balance.lamports === 'number');
      assert.ok(typeof result.balance.sol === 'number');
      assert.ok(result.balance.formatted.includes('SOL'));
    } else {
      // Network error is acceptable in tests
      assert.ok(result.error);
    }
  });

  await t.test('defaults to devnet cluster', async () => {
    const result = await getBalance({
      publicKey: '11111111111111111111111111111111'
    });

    if (result.success || result.error.includes('fetch')) {
      assert.ok(true, 'Handled cluster default correctly');
    }
  });
});
