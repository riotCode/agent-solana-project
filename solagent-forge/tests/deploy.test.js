import test from 'node:test';
import assert from 'node:assert';
import { deployDevnet, getDeploymentStatus, fundKeypair } from '../mcp-server/tools/deploy.js';

test('deploy_devnet validates required inputs', async (t) => {
  await t.test('requires Anchor.toml', async () => {
    assert.rejects(
      async () => {
        await deployDevnet({ programPath: '/nonexistent/path' });
      },
      /Anchor\.toml not found/
    );
  });
});

test('getDeploymentStatus validates programId', async (t) => {
  await t.test('requires programId', async () => {
    assert.rejects(
      async () => {
        await getDeploymentStatus({});
      },
      /programId is required/
    );
  });
});

test('fundKeypair validates publicKey', async (t) => {
  await t.test('requires publicKey', async () => {
    assert.rejects(
      async () => {
        await fundKeypair({});
      },
      /publicKey is required/
    );
  });
});
