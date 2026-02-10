/**
 * PDA Derivation Tool
 * Derives Program Derived Addresses (PDAs) from seeds and program ID
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Derive a PDA (Program Derived Address) from seeds and program ID
 * @param {Object} args
 * @param {string} args.programId - Program ID (base58 encoded public key)
 * @param {string[]} args.seeds - Array of seed strings (will be converted to bytes)
 * @param {number[]} [args.seedBytes] - Optional array of raw seed byte arrays
 * @returns {Object} PDA address and bump seed
 */
export async function derivePda(args) {
  const { programId, seeds = [], seedBytes = [] } = args;

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

  // Convert seeds to Buffer array
  const seedBuffers = [];
  
  // Add string seeds
  for (const seed of seeds) {
    seedBuffers.push(Buffer.from(seed, 'utf-8'));
  }

  // Add byte seeds
  for (const bytes of seedBytes) {
    if (!Array.isArray(bytes)) {
      return {
        success: false,
        error: 'seedBytes must be an array of byte arrays'
      };
    }
    seedBuffers.push(Buffer.from(bytes));
  }

  if (seedBuffers.length === 0) {
    return {
      success: false,
      error: 'Must provide at least one seed (seeds or seedBytes)'
    };
  }

  // Derive PDA
  try {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      seedBuffers,
      programKey
    );

    return {
      success: true,
      pda: pda.toBase58(),
      bump,
      programId,
      seeds: seeds.length > 0 ? seeds : undefined,
      seedBytes: seedBytes.length > 0 ? seedBytes : undefined,
      derivation: {
        address: pda.toBase58(),
        bump,
        isOnCurve: false // PDAs are always off-curve
      }
    };
  } catch (err) {
    return {
      success: false,
      error: `PDA derivation failed: ${err.message}`
    };
  }
}
