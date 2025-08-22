use anchor_lang::prelude::*;
use crate::errors::TwitterError;
use crate::states::*;

pub fn add_reaction(ctx: Context<AddReactionContext>, reaction: ReactionType) -> Result<()> {
    let tweet_reaction = &mut ctx.accounts.tweet_reaction;
    tweet_reaction.reaction_author = *ctx.accounts.reaction_author.key;
    tweet_reaction.parent_tweet = ctx.accounts.tweet.key();
    tweet_reaction.reaction = reaction.clone();
    tweet_reaction.bump = ctx.bumps.tweet_reaction;

    let tweet = &mut ctx.accounts.tweet;
    match reaction {
        ReactionType::Like => {
            tweet.likes = tweet.likes.checked_add(1).ok_or(TwitterError::MaxLikesReached)?;
        }
        ReactionType::Dislike => {
            tweet.dislikes = tweet.dislikes.checked_add(1).ok_or(TwitterError::MaxDislikesReached)?;
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct AddReactionContext<'info> {
    #[account(mut)]
    pub reaction_author: Signer<'info>,
    #[account(
        init,
        payer = reaction_author,
        space = 8 + Reaction::INIT_SPACE,
        seeds = [
            TWEET_REACTION_SEED.as_bytes(),
            reaction_author.key().as_ref(),
            tweet.key().as_ref()
        ],
        bump
    )]
    pub tweet_reaction: Account<'info, Reaction>,
    #[account(mut)]
    pub tweet: Account<'info, Tweet>,
    pub system_program: Program<'info, System>,
}
