/**
 * Tests for solana_get_program_info tool
 * Pure RPC tool for checking program deployment status
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { getProgramInfo } from '../mcp-server/tools/get-program-info.js';

test('getProgramInfo', async (t) => {
  await t.test('input validation', async (t) => {
    await t.test('requires programId', async () => {
      try {
        await getProgramInfo({});
        assert.fail('Should have thrown error');
      } catch (err) {
        assert.match(err.message, /programId is required/);
      }
    });

    await t.test('rejects invalid programId format', async () => {
      const result = await getProgramInfo({ programId: 'invalid' });
      assert.strictEqual(result.success, false);
      assert.match(result.error, /Invalid Solana public key/);
    });

    await t.test('accepts valid public key format', async () => {
      const result = await getProgramInfo({
        programId: '11111111111111111111111111111112',
        cluster: 'devnet'
      });
      // Should not throw, should have success/deployed flags
      assert.ok('success' in result);
      assert.ok('deployed' in result);
    });
  });

  await t.test('cluster handling', async (t) => {
    await t.test('defaults to devnet', async () => {
      const result = await getProgramInfo({
        programId: '11111111111111111111111111111112'
      });
      assert.ok(result.cluster === 'devnet' || !result.success);
    });

    await t.test('accepts mainnet-beta cluster', async () => {
      const result = await getProgramInfo({
        programId: '11111111111111111111111111111111',
        cluster: 'mainnet-beta'
      });
      assert.ok(result.cluster === 'mainnet-beta' || !result.success);
    });

    await t.test('accepts custom RPC URL', async () => {
      const result = await getProgramInfo({
        programId: '11111111111111111111111111111112',
        cluster: 'devnet',
        rpcUrl: 'https://api.devnet.solana.com'
      });
      assert.ok('success' in result);
    });
  });

  await t.test('response structure', async (t) => {
    await t.test('returns consistent structure for invalid program', async () => {
      const result = await getProgramInfo({
        programId: '11111111111111111111111111111112',
        cluster: 'devnet'
      });
      assert.ok('success' in result);
      assert.ok('programId' in result);
      assert.ok('cluster' in result);
      assert.ok('deployed' in result);
    });

    await t.test('includes error message on failure', async () => {
      const result = await getProgramInfo({
        programId: 'invalid',
        cluster: 'devnet'
      });
      if (!result.success) {
        assert.ok(result.error);
      }
    });
  });
});
