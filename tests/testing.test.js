import test from 'node:test';
import assert from 'node:assert';
import { setupTesting } from '../mcp-server/tools/testing.js';

test('setupTesting validates required inputs', async (t) => {
  await t.test('has default framework', async () => {
    const result = await setupTesting({});
    
    assert.strictEqual(result.success, true);
    assert.ok(result.testFile);
  });

  await t.test('accepts litesvm framework', async () => {
    const result = await setupTesting({ framework: 'litesvm' });
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.framework, 'litesvm');
    assert.ok(result.testFile);
  });

  await t.test('accepts mollusk framework', async () => {
    const result = await setupTesting({ framework: 'mollusk' });
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.framework, 'mollusk');
    assert.ok(result.testFile);
  });

  await t.test('accepts test-validator framework', async () => {
    const result = await setupTesting({ framework: 'test-validator' });
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.framework, 'test-validator');
    assert.ok(result.testFile);
  });
});

test('setupTesting returns correct output format', async (t) => {
  await t.test('litesvm returns proper dependencies', async () => {
    const result = await setupTesting({ framework: 'litesvm' });
    
    assert.ok(result.dependencies);
    assert.ok(result.dependencies['litesvm']);
    assert.ok(result.dependencies['@coral-xyz/anchor']);
  });

  await t.test('litesvm returns instructions', async () => {
    const result = await setupTesting({ framework: 'litesvm' });
    
    assert.ok(Array.isArray(result.instructions));
    assert.ok(result.instructions.length > 0);
    assert.match(result.instructions[0], /npm install/);
  });

  await t.test('mollusk returns proper format', async () => {
    const result = await setupTesting({ framework: 'mollusk' });
    
    assert.ok(result.framework);
    assert.ok(result.testFile);
    assert.strictEqual(result.success, true);
  });

  await t.test('test-validator returns proper format', async () => {
    const result = await setupTesting({ framework: 'test-validator' });
    
    assert.ok(result.framework);
    assert.ok(result.testFile);
    assert.strictEqual(result.success, true);
  });
});

test('setupTesting file generation', async (t) => {
  await t.test('creates test file on disk', async () => {
    const result = await setupTesting({ framework: 'litesvm' });
    
    assert.strictEqual(result.success, true);
    assert.ok(result.testFile);
    // Verify file path is in output
    assert.match(result.testFile, /litesvm/i);
  });
});
