use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::states::Tweet;

const TREASURY_PUBKEY: Pubkey = pubkey!("BGwManNyZ2dQpUTRCDBdyMd8BqKF7bS1EJA7fycMmAw6");
const ROYALTY_NUMERATOR: u64 = 8;
const ROYALTY_DENOMINATOR: u64 = 1000;

pub fn handle_tip_tweet(ctx: Context<TipTweet>, amount: u64) -> Result<()> {
    require!(amount > 0, TipError::ZeroAmount);

    let royalty_fee = amount.checked_mul(ROYALTY_NUMERATOR).unwrap().checked_div(ROYALTY_DENOMINATOR).unwrap();
    let author_amount = amount.checked_sub(royalty_fee).unwrap();

    require!(author_amount > 0, TipError::TipTooSmall);

    let transfer_to_author_ix = system_program::Transfer {
        from: ctx.accounts.tipper.to_account_info(),
        to: ctx.accounts.tweet_author.to_account_info(),
    };
    let cpi_author_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        transfer_to_author_ix,
    );
    system_program::transfer(cpi_author_context, author_amount)?;

    let transfer_to_treasury_ix = system_program::Transfer {
        from: ctx.accounts.tipper.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_treasury_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        transfer_to_treasury_ix,
    );
    system_program::transfer(cpi_treasury_context, royalty_fee)?;

    let tweet = &mut ctx.accounts.tweet;
    tweet.total_tips = tweet.total_tips.checked_add(amount).ok_or(TipError::Overflow)?;

    msg!("Tweet tipped with {} lamports. Author received {}, treasury received {}.", amount, author_amount, royalty_fee);
    Ok(())
}

#[derive(Accounts)]
pub struct TipTweet<'info> {
    #[account(mut)]
    pub tipper: Signer<'info>,

    /// CHECK: Ini adalah akun tujuan transfer. Keamanannya dijamin oleh constraint `has_one` pada akun `tweet`.
    #[account(mut)]
    pub tweet_author: AccountInfo<'info>,

    /// CHECK: Ini adalah akun tujuan transfer. Keamanannya dijamin oleh constraint `address`.
    #[account(
        mut,
        address = TREASURY_PUBKEY
    )]
    pub treasury: AccountInfo<'info>,

    #[account(mut, has_one = tweet_author)]
    pub tweet: Account<'info, Tweet>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum TipError {
    #[msg("Tip amount must be greater than zero.")]
    ZeroAmount,
    #[msg("Overflow when adding tip amount.")]
    Overflow,
    #[msg("Tip amount is too small to cover royalty fee.")]
    TipTooSmall,
}