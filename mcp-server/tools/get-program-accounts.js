/**
 * Get Program Accounts Tool
 * Fetches all accounts owned by a program
 */

import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Get all accounts owned by a program
 * @param {Object} args
 * @param {string} args.programId - Program ID (base58)
 * @param {string} [args.cluster='devnet'] - Solana cluster
 * @param {string} [args.rpcUrl] - Custom RPC URL
 * @param {number} [args.limit=10] - Maximum number of accounts to return
 * @param {Object[]} [args.filters] - Account data filters
 * @returns {Object} Program accounts
 */
export async function getProgramAccounts(args) {
  const { programId, cluster = 'devnet', rpcUrl, limit = 10, filters = [] } = args;

  // Validate program ID
  let programKey;
  try {
    programKey = new PublicKey(programId);
  } catch (err) {
    return {
      success: false,
      error: `Invalid program ID: ${err.message}`
    };
  }

  // Get RPC endpoint
  const endpoint = rpcUrl || getClusterUrl(cluster);
  const connection = new Connection(endpoint, 'confirmed');

  try {
    // Build filters for getProgramAccounts
    const config = {
      encoding: 'base64'
    };

    if (filters.length > 0) {
      config.filters = filters.map(f => {
        if (f.dataSize) {
          return { dataSize: f.dataSize };
        }
        if (f.memcmp) {
          return {
            memcmp: {
              offset: f.memcmp.offset,
              bytes: f.memcmp.bytes
            }
          };
        }
        return null;
      }).filter(Boolean);
    }

    const accounts = await connection.getProgramAccounts(programKey, config);

    // Limit results
    const limitedAccounts = accounts.slice(0, limit);

    return {
      success: true,
      programId,
      cluster,
      totalAccounts: accounts.length,
      returnedAccounts: limitedAccounts.length,
      accounts: limitedAccounts.map(({ pubkey, account }) => ({
        publicKey: pubkey.toBase58(),
        lamports: account.lamports,
        owner: account.owner.toBase58(),
        executable: account.executable,
        rentEpoch: account.rentEpoch,
        dataLength: account.data.length,
        data: account.data.toString('base64').substring(0, 100) + '...' // Truncate for readability
      }))
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to fetch program accounts: ${err.message}`
    };
  }
}

/**
 * Get cluster RPC URL
 */
function getClusterUrl(cluster) {
  const urls = {
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com',
    'mainnet-beta': 'https://api.mainnet-beta.solana.com',
    'localhost': 'http://127.0.0.1:8899'
  };
  return urls[cluster] || urls.devnet;
}
