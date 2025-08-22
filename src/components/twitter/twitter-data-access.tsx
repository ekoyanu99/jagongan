'use client'

import { getTwitterProgram, TWITTER_PROGRAM_ID } from '@project/anchor'
import { SystemProgram } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'

export function useTwitterProgram() {
  const { connection } = useConnection()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const program = useMemo(() => getTwitterProgram(provider), [provider])
  const programId = TWITTER_PROGRAM_ID

  // Fetch all tweets
  const getTweets = useQuery({
    queryKey: ['get-tweets'],
    queryFn: async () => {
      const tweets = await program.account.tweet.all()

      return tweets.sort((a, b) => {
        const timeA = a.account.timestamp?.toNumber() || 0
        const timeB = b.account.timestamp?.toNumber() || 0
        return timeB - timeA
      })
    },
  })

  // Send a tweet (initialize)
  const sendTweet = useMutation({
    mutationKey: ['twitter', 'sendTweet'],
    mutationFn: async ({ topic, content }: { topic: string; content: string }) => {
      return program.methods.initialize(topic, content).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
    },
    onError: () => {
      toast.error('Failed to send tweet')
    },
  })

  // tipTweete
  const tipTweet = useMutation({
    mutationKey: ['twitter', 'tipTweet'],
    mutationFn: async ({ tweet, amount }: { tweet: any; amount: number }) => {
      return program.methods
        .tipTweet(amount)
        .accounts({
          tipper: provider.wallet.publicKey,
          tweetAuthor: tweet.account.author ?? tweet.account.tweetAuthor,
          tweet: tweet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
    },
    onError: () => {
      toast.error('Failed to tip')
    },
  })

  // Like tweet
  const likeTweet = useMutation({
    mutationKey: ['twitter', 'likeTweet'],
    mutationFn: async ({ tweet }: { tweet: any }) => {
      return program.methods
        .likeTweet()
        .accounts({
          reactionAuthor: provider.wallet.publicKey,
          tweetReaction: tweet.reactionPda,
          tweet: tweet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => transactionToast(signature),
    onError: () => toast.error('Failed to like'),
  })

  // Dislike tweet
  const dislikeTweet = useMutation({
    mutationKey: ['twitter', 'dislikeTweet'],
    mutationFn: async ({ tweet }: { tweet: any }) => {
      return program.methods
        .dislikeTweet()
        .accounts({
          reactionAuthor: provider.wallet.publicKey,
          tweetReaction: tweet.reactionPda,
          tweet: tweet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => transactionToast(signature),
    onError: () => toast.error('Failed to dislike'),
  })

  // Comment tweet
  const commentTweet = useMutation({
    mutationKey: ['twitter', 'commentTweet'],
    mutationFn: async ({ tweet, commentContent }: { tweet: any; commentContent: string }) => {
      return program.methods
        .commentTweet(commentContent)
        .accounts({
          commentAuthor: provider.wallet.publicKey,
          comment: tweet.commentPda,
          tweet: tweet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => transactionToast(signature),
    onError: () => toast.error('Failed to comment'),
  })

  return {
    program,
    programId,
    getTweets,
    sendTweet,
    tipTweet,
    likeTweet,
    dislikeTweet,
    commentTweet,
  }
}
