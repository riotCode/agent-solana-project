/**
 * Tests for solana_get_program_info tool
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { getProgramInfo } from '../mcp-server/tools/get-program-info.js';

test('getProgramInfo', async (t) => {
  await t.test('requires programId', async () => {
    try {
      await getProgramInfo({});
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.match(err.message, /programId is required/);
    }
  });

  await t.test('rejects invalid programId', async () => {
    const result = await getProgramInfo({ programId: 'invalid' });
    assert.strictEqual(result.success, false);
    assert.match(result.error, /Invalid Solana public key/);
  });

  await t.test('handles non-existent program', async () => {
    // Use a valid public key that's unlikely to be a deployed program
    const result = await getProgramInfo({
      programId: '11111111111111111111111111111112',
      cluster: 'devnet'
    });
    // This test may pass or fail depending on RPC availability, just check structure
    assert.ok(result.programId);
    assert.ok(result.cluster);
  });
});
