import test from 'node:test';
import assert from 'node:assert';
import { derivePda } from '../mcp-server/tools/derive-pda.js';

test('derivePda', async (t) => {
  await t.test('derives PDA with string seeds', async () => {
    const result = await derivePda({
      programId: '11111111111111111111111111111111',
      seeds: ['metadata', 'test']
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.pda);
    assert.ok(typeof result.bump === 'number');
    assert.ok(result.bump >= 0 && result.bump <= 255);
  });

  await t.test('derives PDA with byte seeds', async () => {
    const result = await derivePda({
      programId: '11111111111111111111111111111111',
      seedBytes: [[1, 2, 3], [255, 254, 253]]
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.pda);
    assert.ok(typeof result.bump === 'number');
  });

  await t.test('derives PDA with mixed seeds', async () => {
    const result = await derivePda({
      programId: '11111111111111111111111111111111',
      seeds: ['prefix'],
      seedBytes: [[42]]
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.pda);
    assert.strictEqual(result.derivation.isOnCurve, false);
  });

  await t.test('fails with invalid program ID', async () => {
    const result = await derivePda({
      programId: 'invalid',
      seeds: ['test']
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Invalid program ID'));
  });

  await t.test('fails with no seeds', async () => {
    const result = await derivePda({
      programId: '11111111111111111111111111111111'
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Must provide at least one seed'));
  });
});
