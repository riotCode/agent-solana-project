/**
 * Compute Anchor Instruction Discriminator
 * Uses SHA-256 hash of "global:<instruction_name>" and takes first 8 bytes
 */

import crypto from 'crypto';

/**
 * Compute Anchor instruction discriminator
 * @param {Object} args - Arguments
 * @param {string} args.instructionName - Name of the instruction (e.g., "initialize")
 * @param {string} [args.namespace='global'] - Namespace (default: 'global')
 * @returns {Object} Result with discriminator in hex and bytes
 */
export async function computeDiscriminator(args) {
  const { instructionName, namespace = 'global' } = args;

  if (!instructionName) {
    throw new Error('instructionName is required');
  }

  // Anchor discriminator: SHA-256("namespace:instruction_name").slice(0, 8)
  const preimage = `${namespace}:${instructionName}`;
  const hash = crypto.createHash('sha256').update(preimage).digest();
  const discriminator = hash.slice(0, 8);

  return {
    success: true,
    instructionName,
    namespace,
    preimage,
    discriminator: {
      hex: discriminator.toString('hex'),
      bytes: Array.from(discriminator),
      base64: discriminator.toString('base64')
    }
  };
}
