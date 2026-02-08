/**
 * Testing Setup Tool
 * Configures test environment with LiteSVM, Mollusk, or test-validator
 */

import { promises as fs } from 'fs';
import path from 'path';

const LITESVM_TEST_TEMPLATE = `import { LiteSVM } from "litesvm";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

describe("{{PROGRAM_NAME}} with LiteSVM", () => {
  let svm: LiteSVM;
  let provider: anchor.AnchorProvider;
  let program: Program;

  before(async () => {
    // Initialize LiteSVM for fast in-memory testing (<100ms per test)
    svm = new LiteSVM();
    
    // Configure Anchor provider with LiteSVM's internal RPC
    const connection = svm.connection;
    const wallet = anchor.Wallet.local();
    provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);
    
    // Load your program here:
    // const program = anchor.workspace.{{PROGRAM_NAME}};
  });

  it("Runs tests quickly with LiteSVM", async () => {
    // Your test code here
    // LiteSVM tests complete in milliseconds with no validator needed
  });
});
`;

const MOLLUSK_TEST_TEMPLATE = `// Mollusk tests run in Rust using the mollusk crate
// Add to programs/{{PROGRAM_NAME}}/Cargo.toml:
//
// [dev-dependencies]
// mollusk-svm = "0.1.0"

#[cfg(test)]
mod tests {
    use super::*;
    use mollusk_svm::Mollusk;
    
    #[test]
    fn test_initialize() {
        let mut mollusk = Mollusk::new(&id(), "{{PROGRAM_NAME}}");
        
        // Your test code here
    }
}
`;

export async function setupTesting(args) {
  const { framework = 'litesvm' } = args;
  
  const cwd = process.cwd();
  const testDir = path.join(cwd, 'tests');
  
  // Ensure tests directory exists
  await fs.mkdir(testDir, { recursive: true });
  
  let template, filename, dependencies, instructions;
  
  switch (framework) {
    case 'litesvm':
      template = LITESVM_TEST_TEMPLATE;
      filename = 'litesvm.test.ts';
      dependencies = {
        '@lightprotocol/litesvm': '^0.1.0'
      };
      instructions = [
        'npm install --save-dev @lightprotocol/litesvm',
        'npm test'
      ];
      break;
    
    case 'mollusk':
      template = MOLLUSK_TEST_TEMPLATE;
      filename = 'mollusk.test.rs';
      dependencies = {
        'mollusk-svm': '^0.1.0'
      };
      instructions = [
        'Add mollusk-svm to Cargo.toml [dev-dependencies]',
        'cargo test'
      ];
      break;
    
    case 'test-validator':
      template = '// Use standard Anchor test setup with solana-test-validator';
      filename = 'validator.test.ts';
      dependencies = {};
      instructions = [
        'solana-test-validator',
        'anchor test'
      ];
      break;
    
    default:
      throw new Error(`Unknown framework: ${framework}`);
  }
  
  const programName = path.basename(cwd);
  const testCode = template.replace(/{{PROGRAM_NAME}}/g, programName);
  
  const testPath = path.join(testDir, filename);
  await fs.writeFile(testPath, testCode);
  
  return {
    success: true,
    framework,
    testFile: `tests/${filename}`,
    dependencies,
    instructions,
    nextSteps: instructions,
    benefits: {
      litesvm: 'Fast in-memory testing, no validator needed, <100ms per test',
      mollusk: 'Rust-native testing, no JS overhead, precise control',
      'test-validator': 'Full validator behavior, slower but most realistic'
    }[framework]
  };
}
