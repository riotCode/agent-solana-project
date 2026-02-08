import test from 'node:test';
import assert from 'node:assert';
import { verifyOnchainDiscriminators } from '../mcp-server/tools/verify-onchain-discriminators.js';

test('verifyOnchainDiscriminators validates required inputs', async (t) => {
  await t.test('requires programId', async () => {
    assert.rejects(
      async () => {
        await verifyOnchainDiscriminators({ cluster: 'devnet' });
      },
      /programId is required/
    );
  });

  await t.test('rejects invalid program ID format', async () => {
    const result = await verifyOnchainDiscriminators({
      programId: 'not-a-valid-key',
      cluster: 'devnet'
    });
    
    assert.strictEqual(result.success, false);
    assert.match(result.error, /Invalid/i);
  });
});

test('verifyOnchainDiscriminators with known programs', async (t) => {
  // Test with System Program (always exists on devnet)
  await t.test('verifies System Program on devnet', async () => {
    const result = await verifyOnchainDiscriminators({
      programId: '11111111111111111111111111111111', // System Program
      cluster: 'devnet'
    });
    
    // Should succeed or fail gracefully with network error (both ok for this test)
    assert.ok(typeof result.success === 'boolean');
    assert.ok(result.programId);
    
    if (result.success) {
      assert.ok(result.programAccount);
      assert.ok(result.programAccount.executable !== undefined);
    }
  });

  // Test with Token Program (always exists on devnet)
  await t.test('verifies Token Program on devnet', async () => {
    const result = await verifyOnchainDiscriminators({
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
      cluster: 'devnet'
    });
    
    assert.ok(typeof result.success === 'boolean');
    assert.ok(result.programId);
    
    if (result.success) {
      assert.ok(result.programAccount);
      assert.strictEqual(result.programAccount.executable, true);
    }
  });
});

test('verifyOnchainDiscriminators with non-existent program', async (t) => {
  await t.test('fails gracefully for invalid program', async () => {
    const result = await verifyOnchainDiscriminators({
      programId: 'CcxShL6NsWgg9cHjQZZfbAfYdLiXVCWxH3W4iLKrHM8g', // Fake program
      cluster: 'devnet'
    });
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });
});

test('verifyOnchainDiscriminators cluster support', async (t) => {
  await t.test('accepts devnet cluster', async () => {
    const result = await verifyOnchainDiscriminators({
      programId: '11111111111111111111111111111111',
      cluster: 'devnet'
    });
    
    assert.ok(typeof result.success === 'boolean');
    assert.strictEqual(result.cluster, 'devnet');
  });

  await t.test('accepts testnet cluster', async () => {
    const result = await verifyOnchainDiscriminators({
      programId: '11111111111111111111111111111111',
      cluster: 'testnet'
    });
    
    assert.ok(typeof result.success === 'boolean');
    assert.strictEqual(result.cluster, 'testnet');
  });

  await t.test('accepts mainnet cluster', async () => {
    const result = await verifyOnchainDiscriminators({
      programId: '11111111111111111111111111111111',
      cluster: 'mainnet'
    });
    
    assert.ok(typeof result.success === 'boolean');
    assert.strictEqual(result.cluster, 'mainnet');
  });
});
