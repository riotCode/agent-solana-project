/**
 * Get Account Info Tool
 * Fetches account data from Solana blockchain
 */

import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Get account information from Solana
 * @param {Object} args
 * @param {string} args.publicKey - Account public key (base58)
 * @param {string} [args.cluster='devnet'] - Solana cluster
 * @param {string} [args.rpcUrl] - Custom RPC URL
 * @param {string} [args.encoding='base64'] - Data encoding (base64, base58, jsonParsed)
 * @returns {Object} Account information
 */
export async function getAccountInfo(args) {
  const { publicKey, cluster = 'devnet', rpcUrl, encoding = 'base64' } = args;

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
    const accountInfo = await connection.getAccountInfo(pubkey, {
      encoding: encoding
    });

    if (!accountInfo) {
      return {
        success: true,
        exists: false,
        publicKey,
        cluster,
        message: 'Account does not exist or has not been initialized'
      };
    }

    return {
      success: true,
      exists: true,
      publicKey,
      cluster,
      accountInfo: {
        lamports: accountInfo.lamports,
        owner: accountInfo.owner.toBase58(),
        executable: accountInfo.executable,
        rentEpoch: accountInfo.rentEpoch,
        dataLength: accountInfo.data.length,
        data: encoding === 'base64' ? accountInfo.data.toString('base64') : accountInfo.data
      }
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to fetch account info: ${err.message}`
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
