/**
 * Fund Wallet Tool - Airdrop SOL to a wallet on devnet/testnet
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Airdrop SOL to a public key (devnet/testnet only)
 * @param {Object} args - Arguments
 * @param {string} args.publicKey - Public key to receive SOL
 * @param {string} [args.cluster='devnet'] - Solana cluster (devnet or testnet)
 * @param {number} [args.amount=2] - Amount of SOL to airdrop
 * @param {string} [args.rpcUrl] - Custom RPC URL
 * @returns {Object} Airdrop result
 */
export async function fundWallet(args) {
  const {
    publicKey,
    cluster = 'devnet',
    amount = 2,
    rpcUrl = null
  } = args;

  if (!publicKey) {
    throw new Error('publicKey is required');
  }

  // Validate cluster (airdrop only works on devnet/testnet)
  if (!['devnet', 'testnet'].includes(cluster)) {
    return {
      success: false,
      error: 'Airdrop only available on devnet and testnet',
      publicKey,
      cluster
    };
  }

  // Validate public key format
  let pubkey;
  try {
    pubkey = new PublicKey(publicKey);
  } catch (e) {
    return {
      success: false,
      error: 'Invalid Solana public key format',
      publicKey,
      details: e.message
    };
  }

  // Validate amount
  if (amount <= 0 || amount > 5) {
    return {
      success: false,
      error: 'Amount must be between 0 and 5 SOL',
      publicKey: pubkey.toBase58(),
      requestedAmount: amount
    };
  }

  // Determine RPC URL
  const rpc = rpcUrl || getRpcForCluster(cluster);

  try {
    const connection = new Connection(rpc, 'confirmed');

    // Request airdrop
    const signature = await connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    );

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    // Get updated balance
    const balance = await connection.getBalance(pubkey);

    return {
      success: true,
      publicKey: pubkey.toBase58(),
      cluster,
      amount,
      signature,
      balanceAfter: balance / LAMPORTS_PER_SOL,
      message: `Successfully airdropped ${amount} SOL`
    };
  } catch (error) {
    return {
      success: false,
      publicKey: pubkey.toBase58(),
      cluster,
      amount,
      error: error.message,
      details: 'Airdrop failed. The faucet may be rate-limited or unavailable.'
    };
  }
}

/**
 * Get default RPC URL for cluster
 */
function getRpcForCluster(cluster) {
  const rpcEndpoints = {
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com'
  };
  
  return rpcEndpoints[cluster] || rpcEndpoints.devnet;
}
