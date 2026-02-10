/**
 * Tests for solana_fund_wallet tool
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { fundWallet } from '../mcp-server/tools/fund-wallet.js';

test('fundWallet validates publicKey', async (t) => {
  await t.test('requires publicKey', async () => {
    try {
      await fundWallet({});
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.match(err.message, /publicKey is required/);
    }
  });

  await t.test('rejects invalid publicKey', async () => {
    const result = await fundWallet({ publicKey: 'invalid' });
    assert.strictEqual(result.success, false);
    assert.match(result.error, /Invalid Solana public key/);
  });

  await t.test('rejects mainnet cluster', async () => {
    const result = await fundWallet({
      publicKey: '11111111111111111111111111111111',
      cluster: 'mainnet-beta'
    });
    assert.strictEqual(result.success, false);
    assert.match(result.error, /only available on devnet and testnet/);
  });

  await t.test('validates amount range', async () => {
    const result = await fundWallet({
      publicKey: '11111111111111111111111111111111',
      amount: 10
    });
    assert.strictEqual(result.success, false);
    assert.match(result.error, /between 0 and 5/);
  });
});
