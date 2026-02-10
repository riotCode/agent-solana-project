/**
 * Get Program Info via Pure RPC
 * Checks if a program is deployed on Solana using only RPC calls (no CLI)
 */

import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Get program deployment information
 * @param {Object} args - Arguments
 * @param {string} args.programId - Program ID (base58 public key)
 * @param {string} [args.cluster='devnet'] - Solana cluster
 * @param {string} [args.rpcUrl] - Custom RPC URL
 * @returns {Object} Program deployment status
 */
export async function getProgramInfo(args) {
  const {
    programId,
    cluster = 'devnet',
    rpcUrl = null
  } = args;

  if (!programId) {
    throw new Error('programId is required');
  }

  // Validate program ID format
  let pubkey;
  try {
    pubkey = new PublicKey(programId);
  } catch (e) {
    return {
      success: false,
      programId,
      error: 'Invalid Solana public key format',
      details: e.message
    };
  }

  // Determine RPC URL
  const rpc = rpcUrl || getRpcForCluster(cluster);

  try {
    const connection = new Connection(rpc, 'confirmed');

    // Fetch program account info
    const accountInfo = await connection.getAccountInfo(pubkey);

    if (!accountInfo) {
      return {
        success: true,
        programId: pubkey.toBase58(),
        cluster,
        deployed: false,
        message: 'Program account not found on-chain'
      };
    }

    // Check if account is executable (i.e., it's a program)
    if (!accountInfo.executable) {
      return {
        success: true,
        programId: pubkey.toBase58(),
        cluster,
        deployed: false,
        error: 'Account exists but is not executable',
        details: 'This is not a Solana program'
      };
    }

    // Program is deployed
    return {
      success: true,
      programId: pubkey.toBase58(),
      cluster,
      deployed: true,
      executable: accountInfo.executable,
      owner: accountInfo.owner.toBase58(),
      lamports: accountInfo.lamports,
      dataSize: accountInfo.data.length,
      rentEpoch: accountInfo.rentEpoch
    };
  } catch (error) {
    return {
      success: false,
      programId: pubkey.toBase58(),
      cluster,
      error: error.message,
      details: 'Failed to connect to RPC or fetch program data'
    };
  }
}

/**
 * Get default RPC URL for cluster
 */
function getRpcForCluster(cluster) {
  const rpcEndpoints = {
    'mainnet-beta': 'https://api.mainnet-beta.solana.com',
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com',
    'localhost': 'http://localhost:8899'
  };
  
  return rpcEndpoints[cluster] || rpcEndpoints.devnet;
}
