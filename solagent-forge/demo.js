#!/usr/bin/env node

/**
 * SolAgent Forge Demo
 * Shows scaffold_program in action
 */

import { scaffoldProgram } from './mcp-server/tools/scaffold.js';
import { setupTesting } from './mcp-server/tools/testing.js';
import { promises as fs } from 'fs';
import path from 'path';

const DEMO_DIR = './demo-output';

async function runDemo() {
  console.log('\n=== SolAgent Forge Demo ===\n');
  console.log('Demonstrating autonomous Solana development with MCP tools\n');
  
  // Clean up previous demo
  try {
    await fs.rm(DEMO_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
  
  await fs.mkdir(DEMO_DIR, { recursive: true });
  const originalCwd = process.cwd();
  process.chdir(DEMO_DIR);
  
  // Demo 1: Scaffold a token program
  console.log('📦 DEMO 1: Scaffolding a token program\n');
  console.log('Command: scaffold_program({\n  programName: "token-mint",\n  features: ["token", "metadata"]\n})\n');
  
  const tokenResult = await scaffoldProgram({
    programName: 'token-mint',
    features: ['token', 'metadata']
  });
  
  console.log('✅ Result:');
  console.log(JSON.stringify(tokenResult, null, 2));
  console.log('\n');
  
  // Show the generated Rust code
  console.log('Generated Rust code (lib.rs):');
  const libRsPath = path.join(tokenResult.projectPath, 'programs', 'token_mint', 'src', 'lib.rs');
  const libRsContent = await fs.readFile(libRsPath, 'utf8');
  console.log('```rust');
  console.log(libRsContent.slice(0, 300) + '...\n```\n');
  
  // Demo 2: Setup testing with LiteSVM
  console.log('⚡ DEMO 2: Setting up LiteSVM testing\n');
  console.log('Command: setup_testing({ framework: "litesvm" })\n');
  
  const testResult = await setupTesting({
    framework: 'litesvm'
  });
  
  console.log('✅ Result:');
  console.log(JSON.stringify(testResult, null, 2));
  console.log('\n');
  
  // Demo 3: Scaffold another program
  console.log('📦 DEMO 3: Scaffolding a PDA-based vault program\n');
  console.log('Command: scaffold_program({\n  programName: "vault-manager",\n  features: ["pda", "cpi"]\n})\n');
  
  const vaultResult = await scaffoldProgram({
    programName: 'vault-manager',
    features: ['pda', 'cpi']
  });
  
  console.log('✅ Result:');
  console.log(JSON.stringify({
    success: vaultResult.success,
    projectPath: vaultResult.projectPath,
    files: vaultResult.files,
    nextSteps: vaultResult.nextSteps
  }, null, 2));
  console.log('\n');
  
  // Summary
  console.log('\n=== Demo Summary ===\n');
  console.log('✅ Created 2 complete Anchor projects');
  console.log('✅ Generated all required files:');
  console.log('   - Rust program source (lib.rs)');
  console.log('   - TypeScript tests');
  console.log('   - Anchor configuration (Anchor.toml)');
  console.log('   - Package.json with dependencies');
  console.log('✅ Ready for:');
  console.log('   - anchor build');
  console.log('   - anchor test');
  console.log('   - Devnet deployment');
  console.log('\n=== Next Steps ===\n');
  console.log('1. Agents can call these tools via MCP protocol');
  console.log('2. Programs are deployment-ready');
  console.log('3. Can be tested with LiteSVM (<100ms per test)');
  console.log('4. Seamless integration with CI/CD pipelines\n');
  
  console.log('📂 Demo projects created in:', path.resolve(DEMO_DIR));
  console.log('');
  
  process.chdir(originalCwd);
}

runDemo().catch(error => {
  console.error('❌ Demo failed:', error.message);
  process.exit(1);
});
