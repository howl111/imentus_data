use anchor_lang::prelude::*;
use anchor_spl::token::{self,TokenAccount,Mint};
use anchor_lang::solana_program::{system_instruction};
use spl_token::instruction::AuthorityType;
use borsh::{BorshSerialize, BorshDeserialize};
declare_id!("8tDakg4UmLm684GzzPCMFvSR9ooQx52fmbeC47dD4yU7");


#[program]
pub mod solnftstake {
    use super::*;
    pub fn stake(ctx: Context<Stake>, escrow_bump: u8,data_bump: u8,withdrawtimestamp: i64,collection: String) -> ProgramResult {
        let data = &ctx.accounts.eligible;
        let authority = &mut ctx.accounts.escrow_data;
        if data.collections.contains(&collection) {
            authority.timestamp = Clock::get().unwrap().unix_timestamp;
            authority.withdrawtimestamp = withdrawtimestamp;
            if withdrawtimestamp == 0 {
                authority.flexible = true;
            }
            authority.owner = ctx.accounts.owner.key();
            authority.escrow_account = *ctx.accounts.escrow_account.to_account_info().key;
            // let cpi_program = ctx.accounts.token_program.clone();
            // let cpi_accounts = token::SetAuthority{
            //     account_or_mint: ctx.accounts.escrow_account.to_account_info().clone(),
            //     current_authority: ctx.accounts.wallet.to_account_info().clone()
            // };
            let seeds = &[&ctx.accounts.mint.to_account_info().key.to_bytes()[..], &[escrow_bump]];
            let signer = &[&seeds[..]];
            // let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
            // token::set_authority(
            //    cpi_ctx,
            //    AuthorityType::AccountOwner,
            //    Some(*ctx.accounts.eligible.to_account_info().key)
            // ).expect("Not ok");
            let cpi_program2 = ctx.accounts.token_program.clone();
            let cpi_accounts2 = token::Transfer{
                from: ctx.accounts.fromTokenAccount.to_account_info().clone(),
                to: ctx.accounts.escrow_account.to_account_info().clone(),
                authority: ctx.accounts.owner.to_account_info().clone(),
            };
           let cpi_ctx2 = CpiContext::new_with_signer(cpi_program2,cpi_accounts2,signer);
            token::transfer(cpi_ctx2, 1);
            msg!("transfer");
        }   
        Ok(())
    }

    pub fn burn(ctx: Context<Burn>) -> ProgramResult {
        system_instruction::transfer(
            ctx.accounts.escrow_account.to_account_info().key,
            ctx.accounts.system_program.to_account_info().key,
            1
        );
        Ok(())
    }

    pub fn reward(ctx: Context<Reward>,tbump: u8) -> ProgramResult {
        let start = ctx.accounts.data.timestamp;
        let end = Clock::get().unwrap().unix_timestamp;
        let time = start - end;
        // 1 month = 2592000
        // 2 month = 5184000
        if time >= 2592000 && time < 5184000 {
            let cpi_program = ctx.accounts.token_program.clone();
            let cpi_accounts = token::Transfer{
                from: ctx.accounts.rewardTokenAccount.to_account_info().clone(),
                to: ctx.accounts.tokenAccount.to_account_info().clone(),
                authority: ctx.accounts.rewardAuthority.to_account_info().clone(),
            };
            let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
            token::transfer(cpi_ctx, 1);     
        } else if time >= 5184000 {
            let cpi_program = ctx.accounts.token_program.clone();
            let cpi_accounts = token::Transfer{
                from: ctx.accounts.rewardTokenAccount.to_account_info().clone(),
                to: ctx.accounts.tokenAccount.to_account_info().clone(),
                authority: ctx.accounts.rewardAuthority.to_account_info().clone(),
            };
            let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
            token::transfer(cpi_ctx, 10);
        }
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> ProgramResult {
        let eligible = &mut ctx.accounts.eligible;
        let start = ctx.accounts.data.timestamp;
        let withdrawtimestamp = ctx.accounts.data.withdrawtimestamp; 
        let end = Clock::get().unwrap().unix_timestamp;
        let time = start - end;
        if (time >= withdrawtimestamp) {
            let cpi_program = ctx.accounts.token_program.clone();
            let cpi_accounts = token::SetAuthority{
                account_or_mint: ctx.accounts.escrow_account.to_account_info().clone(),
                current_authority: eligible.to_account_info().clone()
            };
            let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);
            token::set_authority(
                cpi_ctx,
                AuthorityType::AccountOwner,
                Some(*ctx.accounts.wallet.to_account_info().key)
            );
            let cpi_program = ctx.accounts.token_program.clone();
            let cpi_accounts2 = token::Transfer{
                from: ctx.accounts.escrow_account.to_account_info().clone(),
                to: ctx.accounts.token_account.to_account_info().clone(),
                authority: ctx.accounts.wallet.to_account_info().clone(),
            };
            let cpi_ctx2 = CpiContext::new(cpi_program,cpi_accounts2);
            token::transfer(cpi_ctx2, 1);
            
        }
        Ok(())
    }

    pub fn claim(ctx: Context<Claim>,bump: u8,mbump:u8) -> ProgramResult {
        let start = ctx.accounts.escrow_data.timestamp;
        let withdrawtimestamp = ctx.accounts.escrow_data.withdrawtimestamp; 
        let end = Clock::get().unwrap().unix_timestamp;
        let time = end - start;
        let escrow = &mut ctx.accounts.escrow_data;
        if  escrow.flexible == true {
            escrow.withdrawtimestamp = 60;
            escrow.flexible = false;
            return Ok(());
        }
        if time >= withdrawtimestamp {
            let seeds = &[b"state12".as_ref(),&[bump]];
            let signer = &[&seeds[..]];
            let cpi_program = ctx.accounts.token_program.clone();
            let cpi_accounts = token::Transfer{
                from: ctx.accounts.escrow_token.to_account_info().clone(),
                to: ctx.accounts.owner_token.to_account_info().clone(),
                authority: ctx.accounts.eligible.to_account_info().clone()
            };
            let cpi_ctx = CpiContext::new_with_signer(cpi_program,cpi_accounts,signer);
            token::transfer(cpi_ctx,1);
            let seeds2 = &[b"mint".as_ref(),&[mbump]];
            let signer2 = &[&seeds2[..]];
            let cpi_program = ctx.accounts.token_program.clone();
            let cpi_accounts3 = token::Transfer{
                from: ctx.accounts.reward_token.to_account_info().clone(),
                to: ctx.accounts.owner_reward.to_account_info().clone(),
                authority: ctx.accounts.eligible.to_account_info().clone(),
            };
            let cpi_ctx3 = CpiContext::new_with_signer(cpi_program,cpi_accounts3,signer);
            token::transfer(cpi_ctx3, 10);
        }
        Ok(())
    }

    pub fn mint_reward(ctx: Context<MintReward>, mint_bump: u8, token_bump: u8,bump:u8) -> ProgramResult {
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_accounts = token::MintTo{
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.eligible.to_account_info()
        };
        let seeds = &[b"state12".as_ref(),&[bump]];
        let signer = &[&seeds[..]];
        let cpi_ctx  = CpiContext::new_with_signer(cpi_program,cpi_accounts,signer);
        token::mint_to(cpi_ctx, 1000000);
        Ok(())
    }

    pub fn set_admin(ctx: Context<SetAdmin>, cbump: u8) -> ProgramResult {
        let data = &mut ctx.accounts.eligible;
        msg!("init data");
        data.admin = *ctx.accounts.wallet.key;
        msg!("set admin");
        Ok(())
    }

    pub fn add_collection(ctx: Context<AddCollection>,collection: String, cbump: u8) -> ProgramResult {
        let data = &mut ctx.accounts.eligible;
        if data.admin == *ctx.accounts.wallet.to_account_info().key {
            let copy = collection.clone();
            data.collections.push(copy);
        }
        Ok(())
    }

}



#[derive(Accounts)]
#[instruction(escrow_bump: u8,data_bump:u8)]
pub struct Stake<'info> {
    #[account(mut,signer)]
    pub wallet: AccountInfo<'info>,
    #[account(mut)]
    pub owner: AccountInfo<'info>,
    #[account(init_if_needed, payer = wallet, seeds=[mint.key().to_bytes().as_ref()], bump = escrow_bump, token::mint = mint, token::authority = eligible)]
    pub escrow_account: Account<'info,TokenAccount>,
    #[account(init_if_needed, payer = wallet, seeds=[b"data".as_ref(),mint.to_account_info().key.as_ref()], bump = data_bump, space = 8+8+8+32+32+1)]
    pub escrow_data: Account<'info,Data>,
    #[account(mut)]
    pub eligible: Account<'info,Eligible>,
    #[account(mut)]
    pub fromTokenAccount: Account<'info, TokenAccount>,
    pub mint: Account<'info,Mint>,
    pub token_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct Burn<'info> {
    pub escrow_account: Account<'info,TokenAccount>,
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(tbump: u8)]
pub struct Reward<'info> {
    #[account(mut)]
    pub wallet: AccountInfo<'info>,
    pub escrow_account: Account<'info,TokenAccount>,
    #[account(init_if_needed, payer = wallet, token::mint = rewardMint, token::authority = wallet)]
    pub tokenAccount: Account<'info,TokenAccount>,
    pub token_program: AccountInfo<'info>,
    pub data: Account<'info,Data>,
    pub rewardMint: Account<'info, Mint>,
    pub rewardTokenAccount: Account<'info,TokenAccount>,
    pub rewardAuthority: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(tbump:u8)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub wallet: AccountInfo<'info>,
    #[account(mut)]
    pub escrow_account: Account<'info,TokenAccount>,
    #[account(init_if_needed, payer = wallet, token::mint = mint,token::authority = wallet)]
    pub token_account: Account<'info,TokenAccount>,
    pub mint: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub eligible: Account<'info,Eligible>,
    pub data: Account<'info,Data>,
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut,signer)]
    pub payer: AccountInfo<'info>,
    #[account(mut)]
    pub escrow_token: AccountInfo<'info>,
    #[account(mut)]
    pub escrow_data: Account<'info, Data>,
    #[account(mut)]
    pub mint: Account<'info,Mint>,
    #[account(mut)]
    pub reward_mint:AccountInfo<'info>,
    #[account(mut)]
    pub reward_token: AccountInfo<'info>,
    #[account(init, payer = payer, token::mint = reward_mint, token::authority = owner)]
    pub owner_reward: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: AccountInfo<'info>,
    #[account(mut, constraint = owner.key() == escrow_data.owner)]
    pub owner_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub eligible: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>
}


#[derive(Accounts)]
#[instruction(mint_bump: u8,token_bump: u8)]
pub struct MintReward<'info> {
    #[account(mut,signer)]
    pub payer: AccountInfo<'info>,
    #[account(mut)]
    pub eligible: Account<'info,Eligible>,
    #[account(init_if_needed,payer = payer, seeds = [b"mint".as_ref()], bump = mint_bump, mint::decimals = 6, mint::authority = eligible)]
    pub mint: Account<'info,Mint>,
    #[account(init_if_needed,payer = payer, seeds = [b"reward".as_ref()], bump = token_bump, token::mint = mint, token::authority = eligible)]
    pub token_account: Account<'info, TokenAccount>,
    pub token_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub associated_token_program: AccountInfo<'info>,
    pub rent: Sysvar<'info,Rent>
}

#[derive(Accounts)]
#[instruction(cbump: u8)]
pub struct SetAdmin<'info> {
    #[account(init_if_needed, payer = wallet, seeds = [b"state12".as_ref()], bump = cbump, space = 10000)]
    pub eligible: Account<'info,Eligible>,
    pub wallet: AccountInfo<'info>,
    pub system_program: Program<'info,System>
}

#[derive(Accounts)]
pub struct AddCollection<'info> {
    pub wallet: AccountInfo<'info>,
    #[account(mut)]
    pub eligible: Account<'info,Eligible>,
}

#[account]
pub struct Data {
    pub timestamp: i64,
    pub withdrawtimestamp: i64,
    pub escrow_account: Pubkey,
    pub owner: Pubkey,
    pub flexible: bool,
}

#[account]
pub struct Eligible {
    pub admin: Pubkey,
    pub collections: Vec<String>,
    pub current: u16,
    pub length: u16,
}