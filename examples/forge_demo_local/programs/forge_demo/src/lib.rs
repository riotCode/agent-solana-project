use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod forge_demo {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized");
        Ok(())
    }


    pub fn initialize_with_pda(ctx: Context<InitializeWithPda>) -> Result<()> {
        ctx.accounts.state.count = 0;
        msg!("PDA account initialized");
        Ok(())
    }


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

}

#[derive(Accounts)]
pub struct Initialize {}


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


#[derive(Accounts)]
pub struct TransferWithCpi<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: This is safe because we're just using it as a target for a transfer
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
