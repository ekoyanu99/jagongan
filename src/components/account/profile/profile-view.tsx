'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useTwitterProgram } from '../../twitter/twitter-data-access'
import TweetCard from '../../twitter/tweet-card'
import { useMemo } from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { ProfileHero } from './profile-ui'

export function ProfileView() {
  const { publicKey } = useWallet()
  const { getTweets } = useTwitterProgram()

  const myTweets = useMemo(() => {
    if (!getTweets.data || !publicKey) return []
    return getTweets.data.filter((tweet: any) => tweet.account.tweetAuthor?.toBase58?.() === publicKey.toBase58())
  }, [getTweets.data, publicKey])

  const totalReceived = useMemo(() => {
    return myTweets.reduce((acc: number, t: any) => acc + (t.account.totalTips?.toNumber?.() || 0), 0)
  }, [myTweets])

  if (!publicKey) return <div className="p-8 text-center">Connect your wallet to view your profile.</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <ProfileHero address={publicKey} totalReceived={totalReceived} />
      <div className="text-xl font-bold mt-4 mb-2 text-center">My Tweets</div>
      <div>
        {myTweets.length === 0 ? (
          <div className="text-center text-gray-400">You haven&apos;t posted any tweets yet.</div>
        ) : (
          myTweets.map((tweet: any) => (
            <TweetCard
              key={tweet.publicKey.toString()}
              tweet={tweet}
              onReaction={() => {}}
              onComment={() => {}}
              onTip={() => {}}
            />
          ))
        )}
      </div>
    </div>
  )
}
