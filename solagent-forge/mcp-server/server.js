/**
 * MCP Server Implementation
 * Handles MCP protocol messages and routes to appropriate tools
 */

import { scaffoldProgram } from './tools/scaffold.js';
import { setupTesting } from './tools/testing.js';
import { generateDocs } from './tools/documentation.js';

const TOOLS = [
  {
    name: 'scaffold_program',
    description: 'Generate Anchor program structure with best practices',
    inputSchema: {
      type: 'object',
      properties: {
        programName: {
          type: 'string',
          description: 'Name of the program (e.g., "token-vault")'
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Features to include: ["pda", "cpi", "token", "nft"]'
        }
      },
      required: ['programName']
    }
  },
  {
    name: 'setup_testing',
    description: 'Configure test environment with LiteSVM or Mollusk',
    inputSchema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          enum: ['litesvm', 'mollusk', 'test-validator'],
          description: 'Testing framework to use'
        }
      },
      required: ['framework']
    }
  },
  {
    name: 'generate_docs',
    description: 'Generate documentation from program IDL',
    inputSchema: {
      type: 'object',
      properties: {
        idlPath: {
          type: 'string',
          description: 'Path to IDL JSON file'
        },
        format: {
          type: 'string',
          enum: ['markdown', 'html', 'typescript'],
          description: 'Output format'
        }
      },
      required: ['idlPath']
    }
  }
];

export async function createServer() {
  return {
    async handleMessage(message) {
      const { method, params, id } = message;
      
      try {
        switch (method) {
          case 'initialize':
            return {
              jsonrpc: '2.0',
              result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                  tools: {}
                },
                serverInfo: {
                  name: 'solagent-forge',
                  version: '0.1.0'
                }
              },
              id
            };
          
          case 'tools/list':
            return {
              jsonrpc: '2.0',
              result: { tools: TOOLS },
              id
            };
          
          case 'tools/call':
            const { name, arguments: args } = params;
            let result;
            
            switch (name) {
              case 'scaffold_program':
                result = await scaffoldProgram(args);
                break;
              case 'setup_testing':
                result = await setupTesting(args);
                break;
              case 'generate_docs':
                result = await generateDocs(args);
                break;
              default:
                throw new Error(`Unknown tool: ${name}`);
            }
            
            return {
              jsonrpc: '2.0',
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                  }
                ]
              },
              id
            };
          
          default:
            throw new Error(`Unknown method: ${method}`);
        }
      } catch (error) {
        return {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error.message
          },
          id
        };
      }
    }
  };
}
