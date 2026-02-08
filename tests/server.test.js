import test from 'node:test';
import assert from 'node:assert';
import { createServer } from '../mcp-server/server.js';

test('MCP Server integration', async (t) => {
  let server;
  
  await t.before(async () => {
    server = await createServer();
  });

  await t.test('initialize returns correct protocol version', async () => {
    const result = await server.handleMessage({
      method: 'initialize',
      id: 1
    });

    assert.strictEqual(result.jsonrpc, '2.0');
    assert.ok(result.result.protocolVersion);
    assert.strictEqual(result.result.serverInfo.name, 'solagent-forge');
  });

  await t.test('tools/list returns all tools', async () => {
    const result = await server.handleMessage({
      method: 'tools/list',
      id: 2
    });

    assert.strictEqual(result.jsonrpc, '2.0');
    assert.ok(Array.isArray(result.result.tools));
    assert(result.result.tools.length >= 8, 'Should have at least 8 tools');
    
    const toolNames = result.result.tools.map(t => t.name);
    assert(toolNames.includes('scaffold_program'));
    assert(toolNames.includes('setup_testing'));
    assert(toolNames.includes('deploy_devnet'));
    assert(toolNames.includes('verify_discriminators'));
  });

  await t.test('tools/call scaffold_program returns result', async () => {
    const result = await server.handleMessage({
      method: 'tools/call',
      params: {
        name: 'scaffold_program',
        arguments: {
          programName: 'test-integration'
        }
      },
      id: 3
    });

    assert.strictEqual(result.jsonrpc, '2.0');
    assert.ok(result.result.content);
    assert(Array.isArray(result.result.content));
    assert(result.result.content[0].type === 'text');
    
    // Content should be JSON stringified result
    const content = JSON.parse(result.result.content[0].text);
    assert.strictEqual(content.success, true);
    assert.strictEqual(content.programName, 'test_integration');
  });

  await t.test('tools/call with invalid tool returns error', async () => {
    const result = await server.handleMessage({
      method: 'tools/call',
      params: {
        name: 'nonexistent_tool',
        arguments: {}
      },
      id: 4
    });

    assert.strictEqual(result.jsonrpc, '2.0');
    assert.ok(result.error);
    assert(result.error.message.includes('Unknown tool'));
  });

  await t.test('unknown method returns error', async () => {
    const result = await server.handleMessage({
      method: 'unknown_method',
      id: 5
    });

    assert.strictEqual(result.jsonrpc, '2.0');
    assert.ok(result.error);
    assert(result.error.message.includes('Unknown method'));
  });

  await t.test('scaffold_program with features returns enhanced code', async () => {
    const result = await server.handleMessage({
      method: 'tools/call',
      params: {
        name: 'scaffold_program',
        arguments: {
          programName: 'test-with-features',
          features: ['pda', 'token']
        }
      },
      id: 6
    });

    assert.strictEqual(result.jsonrpc, '2.0');
    const content = JSON.parse(result.result.content[0].text);
    assert.strictEqual(content.success, true);
    assert(content.features, 'Should include features in response');
  });

  await t.test('verify_discriminators tool is available', async () => {
    const toolsList = await server.handleMessage({
      method: 'tools/list',
      id: 7
    });

    const verifyTool = toolsList.result.tools.find(t => t.name === 'verify_discriminators');
    assert.ok(verifyTool, 'verify_discriminators tool should exist');
    assert.ok(verifyTool.inputSchema, 'Tool should have inputSchema');
  });
});
