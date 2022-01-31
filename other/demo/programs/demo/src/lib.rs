use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo, Transfer};

pub mod errors;
pub mod state;
pub mod utils;

use errors::ErrorCode;
use state::*;

declare_id!("5EuBaKR3uorectXe12JtxtNF6EeLGaUG2PiC6SGzEPeT");

#[program]
pub mod demo {
    use super::*;
    /// Deposit tokens into a reserve
    pub fn deposit(ctx: Context<Deposit>, bump: u8, amount: Amount) -> ProgramResult {
        handler(ctx, bump, amount)
    }
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Deposit<'info> {
    /// The relevant market this deposit is for
    #[account(has_one = market_authority)]
    pub market: Loader<'info, Market>,

    /// The market's authority account
    pub market_authority: AccountInfo<'info>,

    /// The reserve being deposited into
    #[account(mut,
              has_one = market,
              has_one = vault,
              has_one = deposit_note_mint)]
    pub reserve: Loader<'info, Reserve>,

    /// The reserve's vault where the deposited tokens will be transferred to
    #[account(mut)]
    pub vault: AccountInfo<'info>,

    /// The mint for the deposit notes
    #[account(mut)]
    pub deposit_note_mint: AccountInfo<'info>,

    /// The user/authority that owns the deposit
    #[account(signer)]
    pub depositor: AccountInfo<'info>,

    /// The account that will store the deposit notes
    #[account(mut,
              seeds = [
                  b"deposits".as_ref(),
                  reserve.key().as_ref(),
                  depositor.key.as_ref()
              ],
              bump = bump)]
    pub deposit_account: AccountInfo<'info>,

    /// The token account with the tokens to be deposited
    #[account(mut)]
    pub deposit_source: AccountInfo<'info>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
}

impl<'info> Deposit<'info> {
    fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.clone(),
            Transfer {
                from: self.deposit_source.to_account_info(),
                to: self.vault.to_account_info(),
                authority: self.depositor.clone(),
            },
        )
    }

    fn note_mint_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        CpiContext::new(
            self.token_program.clone(),
            MintTo {
                to: self.deposit_account.to_account_info(),
                mint: self.deposit_note_mint.to_account_info(),
                authority: self.market_authority.clone(),
            },
        )
    }
}

/// Deposit tokens into a reserve
pub fn handler(ctx: Context<Deposit>, _bump: u8, amount: Amount) -> ProgramResult {
    let market = ctx.accounts.market.load()?;
    let mut reserve = ctx.accounts.reserve.load_mut()?;
    let clock = Clock::get()?;
    let reserve_info = market.reserves().get_cached(reserve.index, clock.slot);

    market.verify_ability_deposit_withdraw()?;

    // Calculate the number of new notes that need to be minted to represent
    // the current value being deposited
    let token_amount = amount.as_tokens(reserve_info, Rounding::Up);
    let note_amount = amount.as_deposit_notes(reserve_info, Rounding::Down)?;

    reserve.deposit(token_amount, note_amount);

    // Now that we have the note value, we can transfer this deposit
    // to the vault and mint the new notes
    token::transfer(ctx.accounts.transfer_context(), token_amount)?;

    token::mint_to(
        ctx.accounts
            .note_mint_context()
            .with_signer(&[&market.authority_seeds()]),
        note_amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize {}

/// Specifies the units of some amount of value
#[derive(AnchorDeserialize, AnchorSerialize, Eq, PartialEq, Debug, Clone, Copy)]
pub enum AmountUnits {
    Tokens,
    DepositNotes,
    LoanNotes,
}

/// Represent an amount of some value (like tokens, or notes)
#[derive(AnchorDeserialize, AnchorSerialize, Eq, PartialEq, Debug, Clone, Copy)]
pub struct Amount {
    pub units: AmountUnits,
    pub value: u64,
}

/// Specifies rounding integers up or down
pub enum Rounding {
    Up,
    Down,
}

impl Amount {
    /// Get the amount represented in tokens
    pub fn as_tokens(&self, reserve_info: &CachedReserveInfo, rounding: Rounding) -> u64 {
        match self.units {
            AmountUnits::Tokens => self.value,
            AmountUnits::DepositNotes => reserve_info.deposit_notes_to_tokens(self.value, rounding),
            AmountUnits::LoanNotes => reserve_info.loan_notes_to_tokens(self.value, rounding),
        }
    }

    /// Get the amount represented in deposit notes
    pub fn as_deposit_notes(
        &self,
        reserve_info: &CachedReserveInfo,
        rounding: Rounding,
    ) -> Result<u64, ErrorCode> {
        match self.units {
            AmountUnits::Tokens => Ok(reserve_info.deposit_notes_from_tokens(self.value, rounding)),
            AmountUnits::DepositNotes => Ok(self.value),
            AmountUnits::LoanNotes => Err(ErrorCode::InvalidAmountUnits),
        }
    }

    /// Get the amount represented in loan notes
    pub fn as_loan_notes(
        &self,
        reserve_info: &CachedReserveInfo,
        rounding: Rounding,
    ) -> Result<u64, ErrorCode> {
        match self.units {
            AmountUnits::Tokens => Ok(reserve_info.loan_notes_from_tokens(self.value, rounding)),
            AmountUnits::LoanNotes => Ok(self.value),
            AmountUnits::DepositNotes => Err(ErrorCode::InvalidAmountUnits),
        }
    }

    pub fn from_tokens(value: u64) -> Amount {
        Amount {
            units: AmountUnits::Tokens,
            value,
        }
    }

    pub fn from_deposit_notes(value: u64) -> Amount {
        Amount {
            units: AmountUnits::DepositNotes,
            value,
        }
    }

    pub fn from_loan_notes(value: u64) -> Amount {
        Amount {
            units: AmountUnits::LoanNotes,
            value,
        }
    }
}
