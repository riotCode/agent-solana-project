/**
 * Devnet Deployment Tool
 * Deploys Anchor programs to Solana devnet
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export async function deployDevnet(args) {
  const { 
    programPath = '.',
    cluster = 'devnet',
    keypair = null,
    gasLimit = null,
    skipBuild = false
  } = args;
  
  const cwd = path.resolve(programPath);
  
  // Verify Anchor.toml exists
  const anchorTomlPath = path.join(cwd, 'Anchor.toml');
  let anchorTomlExists = false;
  try {
    await fs.access(anchorTomlPath);
    anchorTomlExists = true;
  } catch (e) {
    // ignore
  }
  
  if (!anchorTomlExists) {
    throw new Error(`Anchor.toml not found in ${cwd}. Is this an Anchor project?`);
  }
  
  const result = {
    success: false,
    programPath: cwd,
    cluster,
    steps: [],
    output: {},
    errors: []
  };
  
  try {
    // Step 1: Build (optional)
    if (!skipBuild) {
      result.steps.push('Building Anchor program...');
      try {
        const buildOutput = execSync('anchor build', { 
          cwd, 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        result.output.build = buildOutput;
        result.steps.push('✅ Build successful');
      } catch (e) {
        result.errors.push(`Build failed: ${e.message}`);
        result.steps.push('❌ Build failed');
        return result;
      }
    }
    
    // Step 2: Get program ID
    result.steps.push('Extracting program ID...');
    const anchorToml = await fs.readFile(anchorTomlPath, 'utf8');
    const programIdMatch = anchorToml.match(/\[programs\.devnet\]\s*\n([a-zA-Z0-9]+)\s*=/);
    
    if (!programIdMatch) {
      result.errors.push('Could not find program ID in Anchor.toml [programs.devnet] section');
      return result;
    }
    
    const programName = programIdMatch[1].trim();
    result.programName = programName;
    result.steps.push(`✅ Program: ${programName}`);
    
    // Step 3: Deploy
    result.steps.push(`Deploying to ${cluster}...`);
    
    let deployCmd = `anchor deploy --provider.cluster ${cluster}`;
    if (keypair) {
      deployCmd += ` --provider.wallet ${keypair}`;
    }
    
    try {
      const deployOutput = execSync(deployCmd, { 
        cwd, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      result.output.deploy = deployOutput;
      result.steps.push('✅ Deployment successful');
      
      // Extract program ID from output
      const programIdRegex = /Program Id: ([a-zA-Z0-9]+)/;
      const idMatch = deployOutput.match(programIdRegex);
      
      if (idMatch) {
        result.deployedProgramId = idMatch[1];
        result.steps.push(`Program ID: ${idMatch[1]}`);
      }
      
    } catch (e) {
      result.errors.push(`Deployment failed: ${e.message}`);
      result.steps.push('❌ Deployment failed');
      return result;
    }
    
    // Step 4: Verification
    result.steps.push('Verifying deployment...');
    
    try {
      if (result.deployedProgramId) {
        // Use solana CLI to verify
        const verifyCmd = `solana program show ${result.deployedProgramId} -u ${cluster}`;
        const verifyOutput = execSync(verifyCmd, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        result.output.verify = verifyOutput;
        result.steps.push('✅ Program verified on devnet');
        result.verified = true;
      }
    } catch (e) {
      result.steps.push('⚠️  Could not verify (solana CLI may not be available)');
    }
    
    result.success = true;
    result.steps.push('🎉 Deployment complete!');
    
  } catch (error) {
    result.errors.push(error.message);
    result.steps.push(`❌ Unexpected error: ${error.message}`);
  }
  
  return result;
}

/**
 * Get deployment status of a program
 */
export async function getDeploymentStatus(args) {
  const { programId, cluster = 'devnet' } = args;
  
  if (!programId) {
    throw new Error('programId is required');
  }
  
  try {
    const output = execSync(`solana program show ${programId} -u ${cluster}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse output
    const addressMatch = output.match(/Program Id: ([a-zA-Z0-9]+)/);
    const executableMatch = output.match(/Executable: (yes|no)/);
    const lamportsMatch = output.match(/Lamports: (\d+)/);
    
    return {
      success: true,
      programId,
      cluster,
      executable: executableMatch ? executableMatch[1] === 'yes' : null,
      lamports: lamportsMatch ? parseInt(lamportsMatch[1]) : null,
      status: executableMatch && executableMatch[1] === 'yes' ? 'deployed' : 'not_executable',
      fullOutput: output
    };
  } catch (error) {
    return {
      success: false,
      programId,
      cluster,
      error: error.message,
      status: 'unknown'
    };
  }
}

/**
 * Fund a keypair on devnet
 * Uses RPC-based faucet request (preferred) with fallback to solana CLI
 */
export async function fundKeypair(args) {
  const { publicKey, cluster = 'devnet', amount = 2 } = args;
  
  if (!publicKey) {
    throw new Error('publicKey is required');
  }
  
  // Validate public key format (base58, ~44 chars)
  if (!/^[1-9A-HJ-NP-Z]{44}$/.test(publicKey)) {
    return {
      success: false,
      publicKey,
      error: 'Invalid Solana public key format',
      message: `'${publicKey}' does not match valid base58 public key format (should be ~44 characters)`
    };
  }
  
  // Try RPC-based funding first (more agent-friendly, no CLI dependency)
  if (cluster === 'devnet') {
    try {
      const rpcUrl = 'https://api.devnet.solana.com';
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'requestAirdrop',
          params: [publicKey, amount * 1_000_000_000]
        })
      });
      
      const data = await response.json();
      
      if (data.result) {
        return {
          success: true,
          publicKey,
          cluster,
          amountAirdropped: amount,
          signature: data.result,
          message: `Successfully airdropped ${amount} SOL to ${publicKey}`
        };
      } else if (data.error) {
        // Fall through to CLI method below
        console.log(`RPC airdrop failed (${data.error.message}), trying CLI...`);
      }
    } catch (e) {
      console.log('RPC airdrop failed, trying CLI method...');
    }
  }
  
  // Fallback: Use solana CLI
  try {
    const output = execSync(`solana airdrop ${amount} ${publicKey} -u ${cluster}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const signatureMatch = output.match(/(\w{87,88})/);
    
    return {
      success: true,
      publicKey,
      cluster,
      amountAirdropped: amount,
      signature: signatureMatch ? signatureMatch[1] : null,
      message: `Successfully airdropped ${amount} SOL to ${publicKey} via solana CLI`
    };
  } catch (error) {
    return {
      success: false,
      publicKey,
      error: error.message,
      message: `Airdrop failed: ${error.message}. Install Solana CLI or use AgentWallet for on-chain funding.`
    };
  }
}
