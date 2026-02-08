#!/usr/bin/env node

/**
 * SolAgent Forge MCP Server
 * 
 * Provides agent-accessible tools for Solana development:
 * - scaffold_program: Generate Anchor program structure
 * - setup_testing: Configure test environment
 * - deploy_devnet: Deploy to devnet
 * - generate_docs: Create documentation from IDL
 * - analyze_errors: Interpret Solana errors
 */

import { createServer } from './server.js';

const PORT = process.env.PORT || 3000;

async function main() {
  const server = await createServer();
  
  // MCP protocol uses stdio for communication with agents
  if (process.stdin.isTTY) {
    console.log('SolAgent Forge MCP Server starting...');
    console.log('Waiting for MCP protocol messages on stdin');
    console.log('Press Ctrl+C to exit');
  }
  
  // Handle stdio communication
  process.stdin.setEncoding('utf8');
  let buffer = '';
  
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          const response = await server.handleMessage(message);
          console.log(JSON.stringify(response));
        } catch (error) {
          console.error(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32700,
              message: 'Parse error',
              data: error.message
            },
            id: null
          }));
        }
      }
    }
  });
  
  process.stdin.on('end', () => {
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
