/**
 * MCP Server Implementation
 * Handles MCP protocol messages and routes to appropriate tools
 */

import { scaffoldProgram } from './tools/scaffold.js';
import { setupTesting } from './tools/testing.js';
import { generateDocs } from './tools/documentation.js';
import { deployDevnet, getDeploymentStatus, fundKeypair } from './tools/deploy.js';
import { verifyDiscriminators, getInstructionSignature } from './tools/verify-discriminator.js';

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
  },
  {
    name: 'deploy_devnet',
    description: 'Deploy Anchor program to Solana devnet',
    inputSchema: {
      type: 'object',
      properties: {
        programPath: {
          type: 'string',
          description: 'Path to Anchor project root'
        },
        cluster: {
          type: 'string',
          enum: ['devnet', 'testnet', 'mainnet-beta'],
          description: 'Solana cluster'
        },
        keypair: {
          type: 'string',
          description: 'Path to keypair file (optional, uses default if not provided)'
        },
        skipBuild: {
          type: 'boolean',
          description: 'Skip anchor build step'
        }
      }
    }
  },
  {
    name: 'get_deployment_status',
    description: 'Check deployment status of a program on-chain',
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'string',
          description: 'Program ID (public key)'
        },
        cluster: {
          type: 'string',
          enum: ['devnet', 'testnet', 'mainnet-beta'],
          description: 'Solana cluster'
        }
      },
      required: ['programId']
    }
  },
  {
    name: 'fund_keypair',
    description: 'Airdrop SOL to a keypair on devnet for testing',
    inputSchema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'Public key to receive SOL'
        },
        cluster: {
          type: 'string',
          enum: ['devnet', 'testnet'],
          description: 'Solana cluster'
        },
        amount: {
          type: 'number',
          description: 'Amount of SOL to airdrop (default: 2)'
        }
      },
      required: ['publicKey']
    }
  },
  {
    name: 'verify_discriminators',
    description: 'Verify IDL discriminators match deployed program on-chain',
    inputSchema: {
      type: 'object',
      properties: {
        idlPath: {
          type: 'string',
          description: 'Path to IDL JSON file (e.g., target/idl/my_program.json)'
        },
        programId: {
          type: 'string',
          description: 'Program ID on Solana (public key)'
        },
        cluster: {
          type: 'string',
          enum: ['devnet', 'testnet', 'mainnet-beta'],
          description: 'Solana cluster'
        },
        rpcUrl: {
          type: 'string',
          description: 'Custom RPC URL (optional)'
        }
      },
      required: ['idlPath', 'programId']
    }
  },
  {
    name: 'get_instruction_signature',
    description: 'Get discriminator and signature for a specific instruction',
    inputSchema: {
      type: 'object',
      properties: {
        idlPath: {
          type: 'string',
          description: 'Path to IDL JSON file'
        },
        instructionName: {
          type: 'string',
          description: 'Instruction name (e.g., "initialize")'
        }
      },
      required: ['idlPath', 'instructionName']
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
              case 'deploy_devnet':
                result = await deployDevnet(args);
                break;
              case 'get_deployment_status':
                result = await getDeploymentStatus(args);
                break;
              case 'fund_keypair':
                result = await fundKeypair(args);
                break;
              case 'verify_discriminators':
                result = await verifyDiscriminators(args);
                break;
              case 'get_instruction_signature':
                result = await getInstructionSignature(args);
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
