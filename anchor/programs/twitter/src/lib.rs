#![allow(unexpected_cfgs)]

use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("47ofz98ZHkDxec7pBjBqPwq2VqhpK4h1BDhLa8h7zZWb");

#[program]
pub mod twitter {

    use super::*;

    pub fn initialize(ctx: Context<InitializeTweet>, topic: String, content: String) -> Result<()> {
        initialize_tweet(ctx, topic, content)
    }
    pub fn like_tweet(ctx: Context<AddReactionContext>) -> Result<()> {
        add_reaction(ctx, states::ReactionType::Like)
    }
    pub fn dislike_tweet(ctx: Context<AddReactionContext>) -> Result<()> {
        add_reaction(ctx, states::ReactionType::Dislike)
    }
    pub fn reaction_remove(ctx: Context<RemoveReactionContext>) -> Result<()> {
        remove_reaction(ctx)
    }
    pub fn comment_tweet(ctx: Context<AddCommentContext>, comment_content: String) -> Result<()> {
        add_comment(ctx, comment_content)
    }
    pub fn comment_remove(ctx: Context<RemoveCommentContext>) -> Result<()> {
        remove_comment(ctx)
    }
    pub fn tip_tweet(ctx: Context<TipTweet>, amount: u64) -> Result<()> {
        tip_tweet::handle_tip_tweet(ctx, amount)
    }
}
