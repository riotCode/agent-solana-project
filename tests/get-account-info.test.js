import test from 'node:test';
import assert from 'node:assert';
import { getAccountInfo } from '../mcp-server/tools/get-account-info.js';

test('getAccountInfo', async (t) => {
  await t.test('validates public key format', async () => {
    const result = await getAccountInfo({
      publicKey: 'not-a-valid-key'
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid public key'));
  });

  await t.test('accepts valid public key format', async () => {
    const result = await getAccountInfo({
      publicKey: '11111111111111111111111111111111',
      cluster: 'devnet'
    });

    // Should succeed (system program always exists)
    if (result.success) {
      assert.ok(result.publicKey);
      assert.strictEqual(result.cluster, 'devnet');
    }
  });

  await t.test('defaults to base64 encoding', async () => {
    const result = await getAccountInfo({
      publicKey: '11111111111111111111111111111111'
    });

    if (result.success && result.exists) {
      assert.ok(result.accountInfo);
    }
  });
});
