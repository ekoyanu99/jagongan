'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useTwitterProgram } from './twitter-data-access'
import { TwitterCreate } from './twitter-ui'
import { ellipsify } from '@/lib/utils'
import TweetCard from './tweet-card'
import { useEffect, useState, useCallback } from 'react'
import { Twitter } from 'lucide-react'

export default function TwitterFeature() {
  const { publicKey } = useWallet()
  const { programId, getTweets } = useTwitterProgram()
  const [tweets, setTweets] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('for-you')

  const refreshTweets = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await getTweets.refetch()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }, [getTweets])

  useEffect(() => {
    if (getTweets.data) setTweets(getTweets.data)
  }, [getTweets.data])

  return publicKey ? (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black bg-opacity-80 backdrop-blur z-10 border-b border-gray-800">
        <div className="p-4">
          <h1 className="text-xl font-bold">Home</h1>
        </div>

        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('for-you')}
            className={`flex-1 py-4 text-center font-semibold relative ${
              activeTab === 'for-you' ? 'text-white' : 'text-gray-400'
            }`}
          >
            For you
            {activeTab === 'for-you' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-blue-400 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-4 text-center font-semibold relative ${
              activeTab === 'following' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Following
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-blue-400 rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-800">
        <div className="flex space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex-shrink-0"></div>
          <div className="flex-1">
            <TwitterCreate onTweetCreated={refreshTweets} />
          </div>
        </div>
      </div>

      <div className="min-h-screen">
        {getTweets.isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
            <p className="text-gray-400">Loading tweets...</p>
          </div>
        ) : tweets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <Twitter size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tweets yet</h3>
            <p className="text-gray-400 mb-6">Be the first to share your thoughts!</p>
            <TwitterCreate onTweetCreated={refreshTweets} variant="primary" />
          </div>
        ) : (
          <>
            {tweets.map((tweet, i) => (
              <TweetCard
                key={tweet.publicKey.toString()}
                tweet={tweet}
                onReaction={refreshTweets}
                onComment={refreshTweets}
                onTip={refreshTweets}
              />
            ))}

            <div className="p-8 text-center">
              <button
                onClick={refreshTweets}
                disabled={isRefreshing}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                {isRefreshing ? 'Loading...' : 'Load more'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Twitter size={48} className="text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Jagongan</h1>
          <p className="text-gray-400 text-lg">Join the conversation on Solana</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center mb-8">Join Jagongan today</h2>

          <div className="text-center text-gray-400 text-sm">
            By signing up, you agree to the{' '}
            <a href="#" className="text-blue-400 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>

        <div className="text-center mt-12 text-gray-400 text-sm">
          <p>Built on Solana · Decentralized · Community Powered</p>
          <p className="mt-2">Program ID: {ellipsify(programId.toString())}</p>
        </div>
      </div>
    </div>
  )
}
