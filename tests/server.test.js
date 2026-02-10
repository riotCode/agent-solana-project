/**
 * MCP Server Tests
 * Tests the MCP JSON-RPC protocol implementation
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { createServer } from '../mcp-server/server.js';

test('MCP Server', async (t) => {
  let server;

  t.before(async () => {
    server = await createServer();
  });

  await t.test('initialize method', async () => {
    const response = await server.handleMessage({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {},
      id: 1
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 1);
    assert.ok(response.result);
    assert.strictEqual(response.result.protocolVersion, '2024-11-05');
    assert.ok(response.result.capabilities);
    assert.strictEqual(response.result.serverInfo.name, 'solagent-forge');
  });

  await t.test('tools/list returns 8 tools', async () => {
    const response = await server.handleMessage({
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
      id: 2
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 2);
    assert.ok(response.result);
    assert.ok(Array.isArray(response.result.tools));
    assert.strictEqual(response.result.tools.length, 8);

    // Verify expected tool names
    const toolNames = response.result.tools.map(t => t.name);
    assert.ok(toolNames.includes('anchor_scaffold'));
    assert.ok(toolNames.includes('solana_fund_wallet'));
    assert.ok(toolNames.includes('solana_get_balance'));
    assert.ok(toolNames.includes('solana_get_account_info'));
    assert.ok(toolNames.includes('solana_get_program_info'));
    assert.ok(toolNames.includes('solana_get_transaction'));
    assert.ok(toolNames.includes('solana_compute_discriminator'));
    assert.ok(toolNames.includes('solana_derive_pda'));
  });

  await t.test('tools/call requires name parameter', async () => {
    const response = await server.handleMessage({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {},
      id: 3
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 3);
    assert.ok(response.error);
    assert.match(response.error.message, /requires params.name/);
  });

  await t.test('tools/call rejects unknown tool', async () => {
    const response = await server.handleMessage({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'unknown_tool',
        arguments: {}
      },
      id: 4
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 4);
    assert.ok(response.error);
    assert.match(response.error.message, /Unknown tool/);
  });

  await t.test('tools/call executes solana_compute_discriminator', async () => {
    const response = await server.handleMessage({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'solana_compute_discriminator',
        arguments: {
          instructionName: 'initialize'
        }
      },
      id: 5
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 5);
    assert.ok(response.result);
    assert.ok(response.result.content);
    assert.strictEqual(response.result.content[0].type, 'text');
    
    const result = JSON.parse(response.result.content[0].text);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.instructionName, 'initialize');
  });

  await t.test('ping method returns empty result', async () => {
    const response = await server.handleMessage({
      jsonrpc: '2.0',
      method: 'ping',
      params: {},
      id: 6
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 6);
    assert.deepStrictEqual(response.result, {});
  });

  await t.test('notifications/initialized returns null', async () => {
    const response = await server.handleMessage({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    });

    assert.strictEqual(response, null);
  });

  await t.test('unknown method returns error', async () => {
    const response = await server.handleMessage({
      jsonrpc: '2.0',
      method: 'unknown_method',
      params: {},
      id: 7
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 7);
    assert.ok(response.error);
    assert.match(response.error.message, /Unknown method/);
  });
});
