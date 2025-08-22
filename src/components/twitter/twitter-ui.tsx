'use client'

import { useTwitterProgram } from './twitter-data-access'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { sha256 } from 'js-sha256'

function getReactionPda(programId: PublicKey, user: PublicKey, tweet: PublicKey) {
  const seed = Buffer.from('TWEET_REACTION_SEED')
  return PublicKey.findProgramAddressSync([seed, user.toBuffer(), tweet.toBuffer()], programId)[0]
}

function getCommentPda(programId: PublicKey, user: PublicKey, content: string, tweet: PublicKey) {
  const seed = Buffer.from('COMMENT_SEED')
  const hash = Buffer.from(sha256.array(content))
  return PublicKey.findProgramAddressSync([seed, user.toBuffer(), hash, tweet.toBuffer()], programId)[0]
}

export function TwitterCreate() {
  const { sendTweet } = useTwitterProgram()
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        await sendTweet.mutateAsync({ topic, content })
      }}
      className="space-y-2"
    >
      <input
        className="input input-bordered w-full"
        placeholder="Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        required
      />
      <textarea
        className="textarea textarea-bordered w-full"
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <Button type="submit" disabled={sendTweet.isPending}>
        Send Tweet{sendTweet.isPending && '...'}
      </Button>
    </form>
  )
}

export function TwitterProgram() {
  const { getTweets, tipTweet, likeTweet, dislikeTweet, commentTweet, program, programId } = useTwitterProgram()
  const [tipAmount, setTipAmount] = useState<{ [key: string]: number }>({})
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({})
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({})
  const [commentsMap, setCommentsMap] = useState<{ [key: string]: any[] }>({})
  const wallet = program?.provider?.wallet

  if (getTweets.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getTweets.data) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>No tweets found.</span>
      </div>
    )
  }

  const fetchComments = async (tweet: any) => {
    if (!program) return
    const allComments = await program.account.comment.all()
    const filtered = allComments.filter(
      (c: any) => c.account.parentTweet?.toBase58?.() === tweet.publicKey.toBase58?.(),
    )
    setCommentsMap((prev) => ({ ...prev, [tweet.publicKey.toString()]: filtered }))
  }

  return (
    <div className={'space-y-6'}>
      {getTweets.data.map((tweet: any, i: number) => {
        const tweetKey = tweet.publicKey.toString()
        const totalTips = tweet.account.totalTips?.toNumber?.() || 0
        const likes = tweet.account.likes?.toNumber?.() || 0
        const dislikes = tweet.account.dislikes?.toNumber?.() || 0
        const comments = commentsMap[tweetKey] || []
        const userPubkey = wallet?.publicKey
        const reactionPda = userPubkey ? getReactionPda(programId, userPubkey, tweet.publicKey) : undefined
        const commentPda = (content: string) =>
          userPubkey ? getCommentPda(programId, userPubkey, content, tweet.publicKey) : undefined

        return (
          <div key={i} className="card bg-base-100 shadow-md p-4">
            <div className="font-bold">
              {tweet.account.author?.toBase58?.() ?? tweet.account.tweetAuthor?.toBase58?.()}
            </div>
            <div className="text-xs text-gray-500">{tweet.account.timestamp?.toString?.()}</div>
            <div className="mt-2 font-semibold">{tweet.account.topic}</div>
            <div>{tweet.account.content}</div>
            <div className="flex gap-4 mt-2">
              <Button size="sm" onClick={() => likeTweet.mutate({ tweet: { ...tweet, reactionPda } })}>
                👍 {likes}
              </Button>
              <Button size="sm" onClick={() => dislikeTweet.mutate({ tweet: { ...tweet, reactionPda } })}>
                👎 {dislikes}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setShowComments((prev) => ({ ...prev, [tweetKey]: !prev[tweetKey] }))
                  if (!commentsMap[tweetKey]) await fetchComments(tweet)
                }}
              >
                💬 Komentar
              </Button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const amount = tipAmount[tweetKey] || 0.01
                if (amount > 0) {
                  await tipTweet.mutateAsync({ tweet, amount: amount * 1e9 })
                  setTipAmount((prev) => ({ ...prev, [tweetKey]: 0.01 }))
                }
              }}
              className="flex gap-2 mt-2"
            >
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={tipAmount[tweetKey] ?? 0.01}
                onChange={(e) => setTipAmount((prev) => ({ ...prev, [tweetKey]: parseFloat(e.target.value) }))}
                className="input input-bordered input-sm w-24"
                required
              />
              <Button type="submit" disabled={tipTweet.isPending}>
                Kasih Kopi ☕
              </Button>
            </form>
            <div className="text-xs mt-1">Total Saweran: {(totalTips / 1e9).toFixed(4)} SOL</div>
            {showComments[tweetKey] && (
              <div className="mt-4 border-t pt-2">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const content = commentInput[tweetKey] || ''
                    if (content.length > 0 && userPubkey) {
                      await commentTweet.mutateAsync({
                        tweet: { ...tweet, commentPda: commentPda(content) },
                        commentContent: content,
                      })
                      setCommentInput((prev) => ({ ...prev, [tweetKey]: '' }))
                      await fetchComments(tweet)
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    className="input input-bordered input-sm flex-1"
                    placeholder="Tulis komentar..."
                    value={commentInput[tweetKey] ?? ''}
                    onChange={(e) => setCommentInput((prev) => ({ ...prev, [tweetKey]: e.target.value }))}
                    required
                  />
                  <Button type="submit" size="sm" disabled={commentTweet.isPending}>
                    Kirim
                  </Button>
                </form>
                <div className="mt-2 space-y-1">
                  {Array.isArray(comments) && comments.length > 0 ? (
                    comments.map((c: any, idx: number) => (
                      <div key={idx} className="bg-base-200 rounded px-2 py-1 text-sm">
                        <span className="font-semibold mr-2">{c.account.commentAuthor?.toBase58?.()}</span>
                        {c.account.content}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">Belum ada komentar.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
