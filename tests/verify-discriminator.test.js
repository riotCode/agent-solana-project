import test from 'node:test';
import assert from 'node:assert';
import { verifyDiscriminators, getInstructionSignature } from '../mcp-server/tools/verify-discriminator.js';
import { promises as fs } from 'fs';
import path from 'path';

test('verifyDiscriminators validates required inputs', async (t) => {
  await t.test('requires idlPath', async () => {
    assert.rejects(
      async () => {
        await verifyDiscriminators({ programId: '11111111111111111111111111111111' });
      },
      /idlPath is required/
    );
  });

  await t.test('requires programId', async () => {
    assert.rejects(
      async () => {
        await verifyDiscriminators({ idlPath: 'test.json' });
      },
      /programId is required/
    );
  });
});

test('getInstructionSignature validates required inputs', async (t) => {
  await t.test('requires idlPath', async () => {
    assert.rejects(
      async () => {
        await getInstructionSignature({ instructionName: 'initialize' });
      },
      /idlPath is required/
    );
  });

  await t.test('requires instructionName', async () => {
    assert.rejects(
      async () => {
        await getInstructionSignature({ idlPath: 'test.json' });
      },
      /instructionName is required/
    );
  });
});

test('getInstructionSignature generates discriminator', async (t) => {
  // Create a test IDL
  const testIdl = {
    name: 'test_program',
    instructions: [
      {
        name: 'initialize',
        accounts: [
          { name: 'payer', isMut: true, isSigner: true }
        ],
        args: [
          { name: 'amount', type: 'u64' }
        ],
        docs: ['Initialize the program']
      }
    ]
  };

  const testIdlPath = path.join(process.cwd(), 'test-idl-verify.json');
  
  await fs.writeFile(testIdlPath, JSON.stringify(testIdl, null, 2));

  try {
    const result = await getInstructionSignature({
      idlPath: testIdlPath,
      instructionName: 'initialize'
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.instruction, 'initialize');
    assert.ok(result.discriminator);
    assert.strictEqual(result.discriminator.length, 16); // 8 bytes = 16 hex chars
    assert.strictEqual(result.signature.accounts, 1);
    assert.strictEqual(result.signature.args, 1);
  } finally {
    await fs.unlink(testIdlPath);
  }
});

test('getInstructionSignature handles missing instruction', async (t) => {
  const testIdl = {
    name: 'test_program',
    instructions: [
      { name: 'initialize', accounts: [], args: [] }
    ]
  };

  const testIdlPath = path.join(process.cwd(), 'test-idl-missing.json');
  
  await fs.writeFile(testIdlPath, JSON.stringify(testIdl, null, 2));

  try {
    const result = await getInstructionSignature({
      idlPath: testIdlPath,
      instructionName: 'nonexistent'
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  } finally {
    await fs.unlink(testIdlPath);
  }
});
