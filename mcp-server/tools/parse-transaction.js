/**
 * Parse Transaction Tool
 * Fetches and parses a Solana transaction
 */

import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Parse a Solana transaction
 * @param {Object} args
 * @param {string} args.signature - Transaction signature (base58)
 * @param {string} [args.cluster='devnet'] - Solana cluster
 * @param {string} [args.rpcUrl] - Custom RPC URL
 * @returns {Object} Parsed transaction data
 */
export async function parseTransaction(args) {
  const { signature, cluster = 'devnet', rpcUrl } = args;

  if (!signature || typeof signature !== 'string') {
    return {
      success: false,
      error: 'Transaction signature is required'
    };
  }

  // Get RPC endpoint
  const endpoint = rpcUrl || getClusterUrl(cluster);
  const connection = new Connection(endpoint, 'confirmed');

  try {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      return {
        success: true,
        exists: false,
        signature,
        cluster: cluster || 'devnet',
        message: 'Transaction not found'
      };
    }

    // Parse transaction data
    const meta = tx.meta;
    const message = tx.transaction.message;

    return {
      success: true,
      exists: true,
      signature,
      cluster,
      transaction: {
        slot: tx.slot,
        blockTime: tx.blockTime,
        fee: meta?.fee,
        status: meta?.err ? 'failed' : 'success',
        error: meta?.err || null,
        computeUnitsConsumed: meta?.computeUnitsConsumed,
        logMessages: meta?.logMessages?.slice(0, 20) || [],
        accounts: message.accountKeys.map(key => ({
          pubkey: typeof key === 'string' ? key : key.pubkey.toBase58(),
          signer: typeof key === 'string' ? false : key.signer,
          writable: typeof key === 'string' ? false : key.writable
        })),
        instructions: message.instructions.map((ix, idx) => {
          if ('parsed' in ix) {
            return {
              type: 'parsed',
              program: ix.program,
              programId: ix.programId?.toBase58() || 'unknown',
              parsed: ix.parsed
            };
          }
          return {
            type: 'raw',
            programIdIndex: ix.programIdIndex,
            accounts: ix.accounts,
            data: ix.data
          };
        }),
        recentBlockhash: message.recentBlockhash,
        preBalances: meta?.preBalances,
        postBalances: meta?.postBalances,
        balanceChanges: meta?.preBalances?.map((pre, idx) => {
          const post = meta.postBalances[idx];
          return {
            account: message.accountKeys[idx]?.pubkey?.toBase58() || 'unknown',
            change: post - pre,
            pre,
            post
          };
        })
      }
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse transaction: ${err.message}`
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
