// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import TwitterIDL from './twitter.json'
import type { Twitter } from './twitter'

// Re-export the generated IDL and type
export { Twitter, TwitterIDL }

// The programId is imported from the program IDL.
export const TWITTER_PROGRAM_ID = new PublicKey(TwitterIDL.address)

// This is a helper function to get the Twitter Anchor program.
export function getTwitterProgram(provider: AnchorProvider): Program<Twitter> {
  // Menggunakan IDL yang sudah diimpor untuk membuat instance program
  return new Program(TwitterIDL as Twitter, provider)
}
