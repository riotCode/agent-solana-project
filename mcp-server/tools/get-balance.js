/**
 * Get Balance Tool
 * Fetches SOL balance for a public key
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Get SOL balance for a public key
 * @param {Object} args
 * @param {string} args.publicKey - Public key (base58)
 * @param {string} [args.cluster='devnet'] - Solana cluster
 * @param {string} [args.rpcUrl] - Custom RPC URL
 * @returns {Object} Balance information
 */
export async function getBalance(args) {
  const { publicKey, cluster = 'devnet', rpcUrl } = args;

  // Validate public key
  let pubkey;
  try {
    pubkey = new PublicKey(publicKey);
  } catch (err) {
    return {
      success: false,
      error: `Invalid public key: ${err.message}`
    };
  }

  // Get RPC endpoint
  const endpoint = rpcUrl || getClusterUrl(cluster);
  const connection = new Connection(endpoint, 'confirmed');

  try {
    const lamports = await connection.getBalance(pubkey);
    const sol = lamports / LAMPORTS_PER_SOL;

    return {
      success: true,
      publicKey,
      cluster,
      balance: {
        lamports,
        sol,
        formatted: `${sol.toFixed(9)} SOL`
      }
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to fetch balance: ${err.message}`
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
