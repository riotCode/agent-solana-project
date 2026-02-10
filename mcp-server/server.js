/**
 * MCP Server Implementation
 * Handles MCP protocol messages and routes to appropriate tools
 * 
 * Tool Set (8 tools):
 * - Live Solana RPC (5): fund_wallet, get_balance, get_account_info, get_program_info, get_transaction
 * - Deterministic Crypto (2): compute_discriminator, derive_pda
 * - Scaffolding (1): anchor_scaffold
 */

import { scaffoldProgram } from './tools/scaffold.js';
import { fundWallet } from './tools/fund-wallet.js';
import { getBalance } from './tools/get-balance.js';
import { getAccountInfo } from './tools/get-account-info.js';
import { getProgramInfo } from './tools/get-program-info.js';
import { parseTransaction } from './tools/parse-transaction.js';
import { computeDiscriminator } from './tools/compute-discriminator.js';
import { derivePda } from './tools/derive-pda.js';

const TOOLS = [
  {
    name: 'anchor_scaffold',
    description: 'Generate Anchor program boilerplate with best practices',
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
          description: 'Features to include: ["pda", "cpi", "token"]'
        }
      },
      required: ['programName']
    }
  },
  {
    name: 'solana_fund_wallet',
    description: 'Airdrop SOL to a wallet on devnet or testnet',
    inputSchema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'Public key to receive SOL (base58)'
        },
        cluster: {
          type: 'string',
          enum: ['devnet', 'testnet'],
          description: 'Solana cluster (default: devnet)'
        },
        amount: {
          type: 'number',
          description: 'Amount of SOL to airdrop (default: 2, max: 5)'
        },
        rpcUrl: {
          type: 'string',
          description: 'Custom RPC URL (optional)'
        }
      },
      required: ['publicKey']
    }
  },
  {
    name: 'solana_get_balance',
    description: 'Get SOL balance for a public key',
    inputSchema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'Public key to check (base58)'
        },
        cluster: {
          type: 'string',
          enum: ['devnet', 'testnet', 'mainnet-beta', 'localhost'],
          description: 'Solana cluster (default: devnet)'
        },
        rpcUrl: {
          type: 'string',
          description: 'Custom RPC URL (optional)'
        }
      },
      required: ['publicKey']
    }
  },
  {
    name: 'solana_get_account_info',
    description: 'Fetch account information from Solana blockchain',
    inputSchema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'Account public key (base58)'
        },
        cluster: {
          type: 'string',
          enum: ['devnet', 'testnet', 'mainnet-beta', 'localhost'],
          description: 'Solana cluster (default: devnet)'
        },
        rpcUrl: {
          type: 'string',
          description: 'Custom RPC URL (optional)'
        },
        encoding: {
          type: 'string',
          enum: ['base64', 'base58', 'jsonParsed'],
          description: 'Data encoding (default: base64)'
        }
      },
      required: ['publicKey']
    }
  },
  {
    name: 'solana_get_program_info',
    description: 'Check if a program is deployed on Solana (pure RPC, no CLI)',
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'string',
          description: 'Program ID (base58 public key)'
        },
        cluster: {
          type: 'string',
          enum: ['devnet', 'testnet', 'mainnet-beta', 'localhost'],
          description: 'Solana cluster (default: devnet)'
        },
        rpcUrl: {
          type: 'string',
          description: 'Custom RPC URL (optional)'
        }
      },
      required: ['programId']
    }
  },
  {
    name: 'solana_get_transaction',
    description: 'Fetch and parse a Solana transaction with logs and instructions',
    inputSchema: {
      type: 'object',
      properties: {
        signature: {
          type: 'string',
          description: 'Transaction signature (base58)'
        },
        cluster: {
          type: 'string',
          enum: ['devnet', 'testnet', 'mainnet-beta', 'localhost'],
          description: 'Solana cluster (default: devnet)'
        },
        rpcUrl: {
          type: 'string',
          description: 'Custom RPC URL (optional)'
        }
      },
      required: ['signature']
    }
  },
  {
    name: 'solana_compute_discriminator',
    description: 'Compute Anchor instruction discriminator using SHA-256',
    inputSchema: {
      type: 'object',
      properties: {
        instructionName: {
          type: 'string',
          description: 'Instruction name (e.g., "initialize", "transfer")'
        },
        namespace: {
          type: 'string',
          description: 'Namespace (default: "global")'
        }
      },
      required: ['instructionName']
    }
  },
  {
    name: 'solana_derive_pda',
    description: 'Derive a Program Derived Address (PDA) from seeds and program ID',
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'string',
          description: 'Program ID (base58 public key)'
        },
        seeds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of seed strings (will be UTF-8 encoded)'
        },
        seedBytes: {
          type: 'array',
          items: {
            type: 'array',
            items: { type: 'number' }
          },
          description: 'Array of raw byte arrays (for non-UTF8 seeds)'
        }
      },
      required: ['programId']
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
            if (!params || !params.name) {
              throw new Error('tools/call requires params.name');
            }
            const { name, arguments: args = {} } = params;
            let result;
            
            switch (name) {
              case 'anchor_scaffold':
                result = await scaffoldProgram(args);
                break;
              case 'solana_fund_wallet':
                result = await fundWallet(args);
                break;
              case 'solana_get_balance':
                result = await getBalance(args);
                break;
              case 'solana_get_account_info':
                result = await getAccountInfo(args);
                break;
              case 'solana_get_program_info':
                result = await getProgramInfo(args);
                break;
              case 'solana_get_transaction':
                result = await parseTransaction(args);
                break;
              case 'solana_compute_discriminator':
                result = await computeDiscriminator(args);
                break;
              case 'solana_derive_pda':
                result = await derivePda(args);
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
          
          case 'ping':
            return {
              jsonrpc: '2.0',
              result: {},
              id
            };
          
          case 'notifications/initialized':
            // MCP client initialization notification - no response needed
            return null;
          
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
