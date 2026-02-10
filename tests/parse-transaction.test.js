import test from 'node:test';
import assert from 'node:assert';
import { parseTransaction } from '../mcp-server/tools/parse-transaction.js';

test('parseTransaction', async (t) => {
  await t.test('requires signature parameter', async () => {
    const result = await parseTransaction({});

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('signature'));
  });

  await t.test('accepts signature string', async () => {
    const result = await parseTransaction({
      signature: '1' + '1'.repeat(87), // 88 char base58 signature
      cluster: 'devnet'
    });

    // Transaction may not exist, but should validate input correctly
    if (result.success) {
      assert.ok(result.signature);
      if (result.exists) {
        assert.ok(result.transaction);
      } else {
        assert.ok(result.message);
      }
    } else {
      // Network error is acceptable
      assert.ok(result.error);
    }
  });

  await t.test('defaults to devnet cluster', async () => {
    const result = await parseTransaction({
      signature: '1'.repeat(88)
    });

    assert.ok(result);
    // If successful, should include cluster
    if (result.success) {
      assert.strictEqual(result.cluster, 'devnet');
    } else {
      // Network error is acceptable in tests
      assert.ok(result.error);
    }
  });
});
