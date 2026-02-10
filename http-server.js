/**
 * HTTP Server Wrapper for SolAgent Forge MCP Server
 * 
 * Allows judges and users to test the MCP server via HTTP endpoints
 * without needing to understand MCP protocol details.
 * 
 * Usage:
 *   node http-server.js
 *   curl http://localhost:3000/health
 *   curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" \
 *     -d '{"method": "initialize", "params": {}, "id": 1}'
 */

import http from 'http';
import { createServer } from './mcp-server/server.js';

const PORT = process.env.PORT || 3000;
let mcpServer = null;
const TEST_COUNT = Number.parseInt(process.env.TEST_COUNT || '66', 10);

// Initialize MCP server once
const serverInit = (async () => {
  try {
    mcpServer = await createServer();
    console.log('✅ MCP server initialized');
  } catch (error) {
    console.error('❌ Failed to initialize MCP server:', error);
    process.exit(1);
  }
})();

const httpServer = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Ensure MCP server initialized for any endpoint that needs it
    await serverInit;

    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
      const toolsList = await mcpServer.handleMessage({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 1
      });

      const tools = toolsList?.result?.tools || [];
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        service: 'SolAgent Forge MCP Server',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        tools: tools.length,
        tests: Number.isFinite(TEST_COUNT) ? TEST_COUNT : undefined
      }));
      return;
    }

    // List tools (REST style)
    if (req.method === 'GET' && req.url === '/tools') {
      const toolsList = await mcpServer.handleMessage({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 2
      });

      res.writeHead(200);
      res.end(JSON.stringify({
        tools: toolsList?.result?.tools || []
      }, null, 2));
      return;
    }

    // Call tool (REST style)
    // POST /tools/<toolName> with JSON body = tool arguments
    if (req.method === 'POST' && req.url && req.url.startsWith('/tools/')) {
      const toolName = decodeURIComponent(req.url.slice('/tools/'.length));
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const args = body ? JSON.parse(body) : {};

          const response = await mcpServer.handleMessage({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: toolName,
              arguments: args
            },
            id: 3
          });

          // Return raw tool result for REST consumers
          if (response?.error) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: response.error.message
            }, null, 2));
            return;
          }

          const contentText = response?.result?.content?.[0]?.text;
          const parsed = contentText ? JSON.parse(contentText) : response;
          res.writeHead(200);
          res.end(JSON.stringify(parsed, null, 2));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid request',
            message: error.message
          }, null, 2));
        }
      });
      return;
    }

    // MCP endpoint
    if (req.method === 'POST' && req.url === '/mcp') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const message = JSON.parse(body);
          
          if (!mcpServer) {
            res.writeHead(503);
            res.end(JSON.stringify({
              error: 'Server initialization failed',
              details: 'MCP server failed to initialize'
            }));
            return;
          }

          // Call MCP server with the message
          const response = await mcpServer.handleMessage(message);
          
          res.writeHead(200);
          res.end(JSON.stringify(response, null, 2));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({
            error: 'Invalid request',
            message: error.message
          }));
        }
      });
      return;
    }

    // Info endpoint
    if (req.method === 'GET' && req.url === '/') {
      const toolsList = await mcpServer.handleMessage({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 4
      });
      const toolNames = (toolsList?.result?.tools || []).map(t => t.name);

      res.writeHead(200);
      res.end(JSON.stringify({
        service: 'SolAgent Forge MCP Server',
        version: '0.1.0',
        description: 'Solana RPC interaction, PDA derivation, and Anchor scaffolding via MCP + HTTP',
        endpoints: {
          GET: {
            '/health': 'Health check',
            '/tools': 'List tools (REST)',
            '/': 'This info'
          },
          POST: {
            '/mcp': 'MCP protocol endpoint (accepts JSON-RPC 2.0 messages)',
            '/tools/<toolName>': 'Call a tool (REST) with JSON body = tool arguments'
          }
        },
        quickstart: {
          health: 'curl http://localhost:3000/health',
          initialize: 'curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d \'{"method": "initialize", "jsonrpc": "2.0", "id": 1}\'',
          listTools: 'curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d \'{"method": "tools/list", "jsonrpc": "2.0", "id": 2}\'',
          scaffold: 'curl -X POST http://localhost:3000/tools/scaffold_program -H "Content-Type: application/json" -d \'{"programName": "my_program", "features": ["pda"]}\''
        },
        tools: toolNames,
        github: 'https://github.com/riotCode/agent-solana-project',
        docs: 'https://github.com/riotCode/agent-solana-project#readme'
      }, null, 2));
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not Found',
      path: req.url,
      availableEndpoints: ['GET /', 'GET /health', 'GET /tools', 'POST /mcp', 'POST /tools/<toolName>']
    }));
  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }));
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 SolAgent Forge HTTP Server listening on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 MCP endpoint: http://localhost:${PORT}/mcp (POST)`);
  console.log(`📍 Tools list: http://localhost:${PORT}/tools`);
  console.log(`📍 Tool call: http://localhost:${PORT}/tools/<toolName> (POST)`);
  console.log(`📍 Info: http://localhost:${PORT}/`);
  console.log(`\n📚 Example commands:`);
  console.log(`  curl http://localhost:${PORT}/health`);
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/tools`);
  console.log(`  curl -X POST http://localhost:${PORT}/tools/derive_pda -H "Content-Type: application/json" -d '{"programId":"11111111111111111111111111111111","seeds":["demo"]}'`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
