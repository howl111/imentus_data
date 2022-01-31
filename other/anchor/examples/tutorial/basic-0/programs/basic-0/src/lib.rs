use anchor_lang::prelude::*;

declare_id!("kzPFbqUAztaLdWRFwPrHBvr41uVeUtSrLNCstiCyAM8");

#[program]
mod basic_0 {
    use super::*;
    pub fn initialize(_ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
