/**
 * Program Scaffolding Tool
 * Generates Anchor program structure with best practices
 */

import { promises as fs } from 'fs';
import path from 'path';

const BASE_PROGRAM_TEMPLATE = `use anchor_lang::prelude::*;{{IMPORTS}}

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod {{PROGRAM_NAME}} {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized");
        Ok(())
    }
{{FEATURES}}
}

#[derive(Accounts)]
pub struct Initialize {}
{{FEATURE_ACCOUNTS}}`;

const PDA_FEATURE_INSTRUCTION = `
    pub fn initialize_with_pda(ctx: Context<InitializeWithPda>) -> Result<()> {
        ctx.accounts.state.count = 0;
        msg!("PDA account initialized");
        Ok(())
    }
`;

const PDA_FEATURE_ACCOUNTS = `
#[derive(Accounts)]
pub struct InitializeWithPda<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + 8,
        seeds = [b"state", payer.key().as_ref()],
        bump
    )]
    pub state: Account<'info, State>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct State {
    pub count: u64,
}
`;

const CPI_FEATURE_INSTRUCTION = `
    pub fn transfer_with_cpi(ctx: Context<TransferWithCpi>, amount: u64) -> Result<()> {
        use anchor_lang::system_program::{transfer, Transfer};
        let transfer_accounts = Transfer {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), transfer_accounts);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
`;

const CPI_FEATURE_ACCOUNTS = `
#[derive(Accounts)]
pub struct TransferWithCpi<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: This is safe because we're just using it as a target for a transfer
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
`;

const TOKEN_FEATURE_INSTRUCTION = `
    pub fn initialize_token_mint(ctx: Context<InitializeToken>) -> Result<()> {
        msg!("Token mint initialized");
        Ok(())
    }
`;

const TOKEN_FEATURE_ACCOUNTS = `
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

const CARGO_TOML_BASE = `[package]
name = "{{PROGRAM_NAME}}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "{{PROGRAM_NAME_SNAKE}}"

[dependencies]
anchor-lang = "0.30.1"`;

const CARGO_TOML_TOKEN = `
anchor-spl = "0.30.1"`;

const CARGO_TOML_END = `

[dev-dependencies]
`;

export async function scaffoldProgram(args) {
  const { programName, features = [] } = args;
  
  if (!programName) {
    throw new Error('programName is required');
  }
  
  // Sanitize program name - reject paths, invalid characters
  if (programName.includes('/') || programName.includes('\\')) {
    throw new Error('programName cannot contain path separators');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(programName)) {
    throw new Error('programName can only contain letters, numbers, underscores, and hyphens');
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
  let featureInstructions = '';
  let featureAccounts = '';
  let imports = '';
  
  // Build feature-specific code if requested
  if (features.includes('pda')) {
    featureInstructions += '\n' + PDA_FEATURE_INSTRUCTION;
    featureAccounts += '\n' + PDA_FEATURE_ACCOUNTS;
  }
  if (features.includes('cpi')) {
    featureInstructions += '\n' + CPI_FEATURE_INSTRUCTION;
    featureAccounts += '\n' + CPI_FEATURE_ACCOUNTS;
  }
  if (features.includes('token')) {
    featureInstructions += '\n' + TOKEN_FEATURE_INSTRUCTION;
    featureAccounts += '\n' + TOKEN_FEATURE_ACCOUNTS;
    imports += '\nuse anchor_spl::token::{Mint, Token};';
  }
  
  let programCode = BASE_PROGRAM_TEMPLATE
    .replace(/{{PROGRAM_NAME}}/g, snakeName)
    .replace(/{{PROGRAM_NAME_CAMEL}}/g, camelName)
    .replace(/{{IMPORTS}}/g, imports)
    .replace(/{{FEATURES}}/g, featureInstructions)
    .replace(/{{FEATURE_ACCOUNTS}}/g, featureAccounts);
  
  const testCode = TEST_TEMPLATE
    .replace(/{{PROGRAM_NAME}}/g, snakeName)
    .replace(/{{PROGRAM_NAME_CAMEL}}/g, pascalName);
  
  let cargoToml = CARGO_TOML_BASE
    .replace(/{{PROGRAM_NAME}}/g, snakeName)
    .replace(/{{PROGRAM_NAME_SNAKE}}/g, snakeName);
  
  if (features.includes('token')) {
    cargoToml += CARGO_TOML_TOKEN;
  }
  
  cargoToml += CARGO_TOML_END;
  
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
    devDependencies: {
      '@coral-xyz/anchor': '^0.30.1',
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

  // Create tsconfig.json for TypeScript compilation
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'ES2020',
      lib: ['ES2020'],
      moduleResolution: 'node',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: './dist',
      rootDir: './'
    },
    include: ['tests/**/*.ts'],
    exclude: ['node_modules', 'target']
  };

  await fs.writeFile(
    path.join(projectRoot, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );
  
  const featureDescriptions = {
    pda: 'PDA: Use seeds and bump constraints for derived accounts',
    cpi: 'CPI: Cross-program invocation with System Program transfers',
    token: 'Token: SPL token mint initialization (requires anchor-spl dependency)'
  };
  
  const featuresApplied = features.length > 0 
    ? `\nFeatures applied: ${features.join(', ')}\n${features.map(f => `  - ${featureDescriptions[f] || f}`).join('\n')}`
    : '';
  
  return {
    success: true,
    projectPath: projectRoot,
    programName: snakeName,
    files: [
      `programs/${snakeName}/src/lib.rs`,
      `programs/${snakeName}/Cargo.toml`,
      `tests/${snakeName}.ts`,
      'Anchor.toml',
      'package.json',
      'tsconfig.json'
    ],
    nextSteps: [
      `cd ${programName}`,
      'npm install',
      'anchor build',
      'anchor test'
    ],
    featureSummary: featuresApplied,
    note: 'All feature instructions are injected into the program module. Generated code is ready to compile.'
  };
}
