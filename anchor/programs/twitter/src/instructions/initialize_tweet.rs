use anchor_lang::prelude::*;
use crate::errors::TwitterError;
use crate::states::*;

pub fn initialize_tweet(
    ctx: Context<InitializeTweet>,
    topic: String,
    content: String,
) -> Result<()> {
    require!(topic.len() <= TOPIC_LENGTH, TwitterError::TopicTooLong);
    require!(content.len() <= CONTENT_LENGTH, TwitterError::ContentTooLong);

    let tweet = &mut ctx.accounts.tweet;
    tweet.tweet_author = *ctx.accounts.tweet_authority.key;
    tweet.topic = topic;
    tweet.content = content;
    tweet.likes = 0;
    tweet.dislikes = 0;
    tweet.bump = ctx.bumps.tweet;
    tweet.timestamp = Clock::get()?.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
#[instruction(topic: String)]
pub struct InitializeTweet<'info> {
    #[account(mut)]
    pub tweet_authority: Signer<'info>,
    #[account(
        init,
        payer = tweet_authority,
        space = 8 + Tweet::INIT_SPACE,
        seeds = [
            topic.as_bytes(),
            TWEET_SEED.as_bytes(),
            tweet_authority.key().as_ref()
        ],
        bump
    )]
    pub tweet: Account<'info, Tweet>,
    pub system_program: Program<'info, System>,
}