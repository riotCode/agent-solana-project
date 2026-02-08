/**
 * Program Scaffolding Tool
 * Generates Anchor program structure with best practices
 */

import { promises as fs } from 'fs';
import path from 'path';

const PROGRAM_TEMPLATE = `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod {{PROGRAM_NAME}} {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
`;

const TEST_TEMPLATE = `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { {{PROGRAM_NAME_CAMEL}} } from "../target/types/{{PROGRAM_NAME}}";

describe("{{PROGRAM_NAME}}", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.{{PROGRAM_NAME_CAMEL}} as Program<{{PROGRAM_NAME_CAMEL}}>;

  it("Initializes successfully", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Transaction signature:", tx);
  });
});
`;

const CARGO_TOML_TEMPLATE = `[package]
name = "{{PROGRAM_NAME}}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "{{PROGRAM_NAME_SNAKE}}"

[dependencies]
anchor-lang = "0.30.1"
`;

export async function scaffoldProgram(args) {
  const { programName, features = [] } = args;
  
  if (!programName) {
    throw new Error('programName is required');
  }
  
  // Sanitize program name
  const snakeName = programName.toLowerCase().replace(/-/g, '_');
  const camelName = snakeName
    .split('_')
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const pascalName = camelName.charAt(0).toUpperCase() + camelName.slice(1);
  
  const projectRoot = path.join(process.cwd(), programName);
  
  // Create directory structure
  const dirs = [
    projectRoot,
    path.join(projectRoot, 'programs', snakeName, 'src'),
    path.join(projectRoot, 'tests'),
    path.join(projectRoot, 'app')
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
  
  // Generate files
  const programCode = PROGRAM_TEMPLATE
    .replace(/{{PROGRAM_NAME}}/g, snakeName)
    .replace(/{{PROGRAM_NAME_CAMEL}}/g, camelName);
  
  const testCode = TEST_TEMPLATE
    .replace(/{{PROGRAM_NAME}}/g, snakeName)
    .replace(/{{PROGRAM_NAME_CAMEL}}/g, pascalName);
  
  const cargoToml = CARGO_TOML_TEMPLATE
    .replace(/{{PROGRAM_NAME}}/g, snakeName)
    .replace(/{{PROGRAM_NAME_SNAKE}}/g, snakeName);
  
  await fs.writeFile(
    path.join(projectRoot, 'programs', snakeName, 'src', 'lib.rs'),
    programCode
  );
  
  await fs.writeFile(
    path.join(projectRoot, 'tests', `${snakeName}.ts`),
    testCode
  );
  
  await fs.writeFile(
    path.join(projectRoot, 'programs', snakeName, 'Cargo.toml'),
    cargoToml
  );
  
  // Create Anchor.toml
  const anchorToml = `[toolchain]

[features]
resolution = true
skip-lint = false

[programs.devnet]
${snakeName} = "11111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
`;
  
  await fs.writeFile(
    path.join(projectRoot, 'Anchor.toml'),
    anchorToml
  );
  
  // Create package.json for tests
  const packageJson = {
    name: programName,
    version: '0.1.0',
    dependencies: {
      '@coral-xyz/anchor': '^0.30.1',
      '@solana/web3.js': '^1.95.0'
    },
    devDependencies: {
      'ts-mocha': '^10.0.0',
      'typescript': '^5.0.0',
      '@types/mocha': '^10.0.0',
      '@types/node': '^20.0.0'
    }
  };
  
  await fs.writeFile(
    path.join(projectRoot, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  return {
    success: true,
    projectPath: projectRoot,
    programName: snakeName,
    files: [
      `programs/${snakeName}/src/lib.rs`,
      `programs/${snakeName}/Cargo.toml`,
      `tests/${snakeName}.ts`,
      'Anchor.toml',
      'package.json'
    ],
    nextSteps: [
      `cd ${programName}`,
      'npm install',
      'anchor build',
      'anchor test'
    ],
    features: features.length > 0 ? `Requested features: ${features.join(', ')} (add manually)` : null
  };
}
