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

// Initialize MCP server once
(async () => {
  mcpServer = await createServer();
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
    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        service: 'SolAgent Forge MCP Server',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        tools: 11,
        tests: 101
      }));
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
              error: 'Server initializing',
              details: 'MCP server not ready yet'
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
      res.writeHead(200);
      res.end(JSON.stringify({
        service: 'SolAgent Forge MCP Server',
        version: '0.1.0',
        description: 'Autonomous Solana development assistant with 11 MCP tools',
        endpoints: {
          GET: {
            '/health': 'Health check',
            '/': 'This info'
          },
          POST: {
            '/mcp': 'MCP protocol endpoint (accepts JSON-RPC 2.0 messages)'
          }
        },
        quickstart: {
          health: 'curl http://localhost:3000/health',
          initialize: 'curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d \'{"method": "initialize", "jsonrpc": "2.0", "id": 1}\'',
          listTools: 'curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d \'{"method": "tools/list", "jsonrpc": "2.0", "id": 2}\'',
          scaffold: 'curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d \'{"method": "tools/call", "params": {"name": "scaffold_program", "arguments": {"programName": "my_program", "features": ["pda"]}}, "jsonrpc": "2.0", "id": 3}\''
        },
        tools: [
          'scaffold_program',
          'setup_testing',
          'deploy_devnet',
          'get_deployment_status',
          'fund_keypair',
          'generate_docs',
          'verify_discriminators',
          'get_instruction_signature',
          'verify_onchain_discriminators',
          'analyze_errors',
          'scan_security'
        ],
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
      availableEndpoints: ['GET /', 'GET /health', 'POST /mcp']
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
  console.log(`📍 Info: http://localhost:${PORT}/`);
  console.log(`\n📚 Example commands:`);
  console.log(`  curl http://localhost:${PORT}/health`);
  console.log(`  curl http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
