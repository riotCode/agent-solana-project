/**
 * Program Scaffolding Tool
 * Generates Anchor program structure with best practices
 */

import { promises as fs } from 'fs';
import path from 'path';

const BASE_PROGRAM_TEMPLATE = `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

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

const PDA_FEATURE = `
#[derive(Accounts)]
pub struct InitializeWithPda<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        pda,
        space = 8 + 8, // discriminator + data
        bump,
        payer = payer
    )]
    pub state: Account<'info, State>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct State {
    pub count: u64,
}
`;

const CPI_FEATURE = `
use anchor_lang::system_program::{transfer, Transfer};

#[derive(Accounts)]
pub struct InitializeWithCpi<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: This is safe because we're just using it as a target for a transfer
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn cpi_transfer(ctx: Context<InitializeWithCpi>, amount: u64) -> Result<()> {
    let transfer_accounts = Transfer {
        from: ctx.accounts.payer.to_account_info(),
        to: ctx.accounts.recipient.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), transfer_accounts);
    transfer(cpi_ctx, amount)?;
    Ok(())
}
`;

const TOKEN_FEATURE = `
use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = payer.key(),
    )]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn mint_tokens(ctx: Context<InitializeToken>, amount: u64) -> Result<()> {
    // Token minting logic would go here
    msg!("Minting {} tokens", amount);
    Ok(())
}
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
  let programCode = BASE_PROGRAM_TEMPLATE
    .replace(/{{PROGRAM_NAME}}/g, snakeName)
    .replace(/{{PROGRAM_NAME_CAMEL}}/g, camelName);
  
  // Add feature-specific code if requested
  if (features.includes('pda')) {
    programCode += '\n' + PDA_FEATURE;
  }
  if (features.includes('cpi')) {
    programCode += '\n' + CPI_FEATURE;
  }
  if (features.includes('token')) {
    programCode += '\n// NOTE: Add anchor-spl to Cargo.toml dependencies:\n// anchor-spl = "0.30.1"\n' + TOKEN_FEATURE;
  }
  
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
${snakeName} = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

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
