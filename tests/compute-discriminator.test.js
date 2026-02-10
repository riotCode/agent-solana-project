/**
 * Tests for solana_compute_discriminator tool
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { computeDiscriminator } from '../mcp-server/tools/compute-discriminator.js';

test('computeDiscriminator', async (t) => {
  await t.test('requires instructionName', async () => {
    try {
      await computeDiscriminator({});
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.match(err.message, /instructionName is required/);
    }
  });

  await t.test('computes discriminator for "initialize"', async () => {
    const result = await computeDiscriminator({ instructionName: 'initialize' });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.instructionName, 'initialize');
    assert.strictEqual(result.namespace, 'global');
    assert.strictEqual(result.preimage, 'global:initialize');
    assert.ok(result.discriminator.hex);
    assert.strictEqual(result.discriminator.bytes.length, 8);
  });

  await t.test('computes different discriminators for different instructions', async () => {
    const initResult = await computeDiscriminator({ instructionName: 'initialize' });
    const transferResult = await computeDiscriminator({ instructionName: 'transfer' });
    assert.notStrictEqual(initResult.discriminator.hex, transferResult.discriminator.hex);
  });

  await t.test('supports custom namespace', async () => {
    const result = await computeDiscriminator({
      instructionName: 'initialize',
      namespace: 'custom'
    });
    assert.strictEqual(result.namespace, 'custom');
    assert.strictEqual(result.preimage, 'custom:initialize');
  });
});
