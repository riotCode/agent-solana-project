use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod token_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
