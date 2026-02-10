/**
 * MCP Server Implementation
 * Handles MCP protocol messages and routes to appropriate tools
 */

import { scaffoldProgram } from './tools/scaffold.js';
import { deployDevnet, getDeploymentStatus, fundKeypair } from './tools/deploy.js';
import { verifyOnchainDiscriminators } from './tools/verify-onchain-discriminators.js';
import { scanSecurity } from './tools/security-scanner.js';
import { derivePda } from './tools/derive-pda.js';
import { getAccountInfo } from './tools/get-account-info.js';
import { getBalance } from './tools/get-balance.js';
import { getProgramAccounts } from './tools/get-program-accounts.js';
import { parseTransaction } from './tools/parse-transaction.js';

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
          description: 'Features to include: ["pda", "cpi", "token"]'
        }
      },
      required: ['programName']
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
    name: 'verify_onchain_discriminators',
    description: 'Verify program exists on-chain and fetch its IDL',
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
    name: 'scan_security',
    description: 'Scan Anchor/Rust program code for security vulnerabilities',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Program source code to scan'
        },
        codeType: {
          type: 'string',
          enum: ['rust', 'typescript'],
          description: 'Programming language (default: rust)'
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Minimum severity to report (default: medium)'
        }
      },
      required: ['code']
    }
  },
  {
    name: 'derive_pda',
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
  },
  {
    name: 'get_account_info',
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
    name: 'get_balance',
    description: 'Get SOL balance for a public key',
    inputSchema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'Public key (base58)'
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
    name: 'get_program_accounts',
    description: 'Get all accounts owned by a program',
    inputSchema: {
      type: 'object',
      properties: {
        programId: {
          type: 'string',
          description: 'Program ID (base58)'
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
        limit: {
          type: 'number',
          description: 'Maximum number of accounts to return (default: 10)'
        },
        filters: {
          type: 'array',
          description: 'Account data filters (dataSize or memcmp)'
        }
      },
      required: ['programId']
    }
  },
  {
    name: 'parse_transaction',
    description: 'Fetch and parse a Solana transaction',
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
              case 'scaffold_program':
                result = await scaffoldProgram(args);
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
              case 'verify_onchain_discriminators':
                result = await verifyOnchainDiscriminators(args);
                break;
              case 'scan_security':
                result = await scanSecurity(args);
                break;
              case 'derive_pda':
                result = await derivePda(args);
                break;
              case 'get_account_info':
                result = await getAccountInfo(args);
                break;
              case 'get_balance':
                result = await getBalance(args);
                break;
              case 'get_program_accounts':
                result = await getProgramAccounts(args);
                break;
              case 'parse_transaction':
                result = await parseTransaction(args);
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
