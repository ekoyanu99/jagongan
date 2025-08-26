import { useState, useEffect } from 'react'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTwitterProgram } from './twitter-data-access'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { sha256 } from 'js-sha256'
import { Heart, MessageCircle, Coffee, MoreHorizontal, Trash2, X } from 'lucide-react'
import { BN } from '@coral-xyz/anchor'
import { ellipsify } from '@/lib/utils'

interface Tweet {
  publicKey: PublicKey
  account: {
    tweetAuthor: PublicKey
    topic: string
    content: string
    timestamp: BN
    likes: BN
    dislikes: BN
    totalTips: BN
  }
}

interface Comment {
  publicKey: PublicKey
  account: {
    commentAuthor: PublicKey
    parentTweet: PublicKey
    content: string
  }
}

export default function TweetCard({
  tweet,
  onReaction,
  onComment,
  onTip,
}: {
  tweet: Tweet
  onReaction?: () => void
  onComment?: () => void
  onTip?: () => void
}) {
  const provider = useAnchorProvider()
  const { likeTweet, tipTweet, commentTweet, removeComment, removeReaction, programId, program } = useTwitterProgram()
  const [commentContent, setCommentContent] = useState('')
  const [tipAmount, setTipAmount] = useState(0.01)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [showTipForm, setShowTipForm] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [showRemoveReactionConfirm, setShowRemoveReactionConfirm] = useState(false)
  const [commentToRemove, setCommentToRemove] = useState<PublicKey | null>(null)

  const tipOptions = [0.001, 0.01, 0.1]

  const getReactionPda = () => {
    if (!provider.wallet?.publicKey) return undefined
    const seed = Buffer.from('TWEET_REACTION_SEED')
    return PublicKey.findProgramAddressSync(
      [seed, provider.wallet.publicKey.toBuffer(), tweet.publicKey.toBuffer()],
      programId,
    )[0]
  }

  const handleRemoveReaction = () => {
    const reactionPda = getReactionPda()
    if (!reactionPda) return
    handleAction(removeReaction.mutateAsync({ tweet, reactionPda }), () => {
      onReaction?.()
      setShowRemoveReactionConfirm(false)
    })
  }

  const getCommentPda = (content: string) => {
    if (!provider.wallet?.publicKey) return undefined
    const seed = Buffer.from('COMMENT_SEED')
    const hash = Buffer.from(sha256.array(content))
    return PublicKey.findProgramAddressSync(
      [seed, provider.wallet.publicKey.toBuffer(), hash, tweet.publicKey.toBuffer()],
      programId,
    )[0]
  }

  const handleAction = async (action: Promise<unknown>, cb?: () => void) => {
    setIsProcessing(true)
    try {
      await action
      if (cb) cb()
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTip = (e: React.FormEvent) => {
    e.preventDefault()
    if (tipAmount > 0) {
      const amountInLamports = new BN(Math.floor(tipAmount * LAMPORTS_PER_SOL))
      handleAction(tipTweet.mutateAsync({ tweet, amount: amountInLamports }), onTip)
      setShowTipForm(false)
    }
  }

  const handleQuickTip = (amount: number) => {
    const amountInLamports = new BN(Math.floor(amount * LAMPORTS_PER_SOL))
    handleAction(tipTweet.mutateAsync({ tweet, amount: amountInLamports }), onTip)
    setShowTipForm(false)
  }

  const handleReaction = () => {
    const reactionPda = getReactionPda()
    handleAction(likeTweet.mutateAsync({ tweet: { ...tweet, reactionPda } }), onReaction)
  }

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (commentContent.trim()) {
      const commentPda = getCommentPda(commentContent)
      handleAction(commentTweet.mutateAsync({ tweet: { ...tweet, commentPda }, commentContent }), onComment)
      setCommentContent('')
      setShowCommentForm(false)
    }
  }

  const toggleAndFetchComments = async () => {
    const newShowState = !showCommentForm
    setShowCommentForm(newShowState)

    if (newShowState && comments.length === 0) {
      setIsLoadingComments(true)
      try {
        const allComments = await program.account.comment.all()
        const filtered = allComments.filter(
          (c: Comment) => c.account.parentTweet?.toBase58() === tweet.publicKey.toBase58(),
        )
        setComments(filtered)
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      } finally {
        setIsLoadingComments(false)
      }
    }
  }

  const handleRemoveComment = async (commentPda: PublicKey) => {
    await handleAction(removeComment.mutateAsync({ commentPda }), async () => {
      setComments((prev) => prev.filter((c) => !c.publicKey.equals(commentPda)))
      setCommentToRemove(null)
    })
  }

  const totalTipsInSol = (tweet.account.totalTips?.toNumber() / LAMPORTS_PER_SOL).toFixed(4)
  const likes = tweet.account.likes?.toNumber() || 0
  const author = tweet.account.tweetAuthor.toBase58()
  const isAuthor = provider.wallet?.publicKey?.equals(tweet.account.tweetAuthor)
  const [hasReacted, setHasReacted] = useState(false)
  const reactionPda = getReactionPda()
  useEffect(() => {
    let ignore = false
    async function checkReaction() {
      if (!reactionPda || !program) {
        setHasReacted(false)
        return
      }
      try {
        await program.account.reaction.fetch(reactionPda)
        if (!ignore) setHasReacted(true)
      } catch {
        if (!ignore) setHasReacted(false)
      }
    }
    checkReaction()
    return () => {
      ignore = true
    }
  }, [reactionPda, program])

  return (
    <article className="border-b border-neutral-800 p-4 transition-colors hover:bg-neutral-900/50">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="font-bold text-white text-lg">{author.substring(0, 2).toUpperCase()}</span>
          </div>
        </div>

        <div className="flex-1">
          <header className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-white">{ellipsify(author)}</span>
              <span className="text-sm text-neutral-500">@{tweet.account.topic}</span>
            </div>
            <button className="text-neutral-500 hover:text-blue-400">
              <MoreHorizontal size={18} />
            </button>
          </header>

          <p className="text-neutral-200 mt-1 whitespace-pre-wrap">{tweet.account.content}</p>

          <footer className="flex justify-between items-center mt-4 text-neutral-500 max-w-sm">
            <button
              onClick={toggleAndFetchComments}
              className="flex items-center space-x-2 hover:text-blue-400 transition-colors group"
            >
              <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm">{comments.length > 0 ? comments.length : ''}</span>
            </button>

            <div className="flex items-center space-x-2 group relative">
              <button
                onClick={hasReacted ? () => setShowRemoveReactionConfirm(true) : handleReaction}
                className="flex items-center hover:text-rose-400 transition-colors"
                disabled={isProcessing}
              >
                <Heart
                  size={18}
                  className={`group-hover:scale-110 transition-transform ${hasReacted ? 'fill-rose-400 text-rose-400' : ''}`}
                />
                <span className="text-sm ml-1">{likes > 0 ? likes : ''}</span>
              </button>

              {showRemoveReactionConfirm && (
                <div className="absolute bottom-full left-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg p-3 shadow-lg z-10 min-w-[180px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Remove like?</span>
                    <button
                      onClick={() => setShowRemoveReactionConfirm(false)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRemoveReactionConfirm(false)}
                      className="flex-1 py-1 px-2 text-sm bg-neutral-700 hover:bg-neutral-600 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRemoveReaction}
                      disabled={isProcessing}
                      className="flex-1 py-1 px-2 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded flex items-center justify-center gap-1"
                    >
                      {isProcessing ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <Trash2 size={12} />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowTipForm(!showTipForm)}
              className="flex items-center space-x-2 hover:text-amber-400 transition-colors group"
            >
              <Coffee size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm">{parseFloat(totalTipsInSol) > 0 ? `${totalTipsInSol} SOL` : ''}</span>
            </button>
          </footer>

          {showTipForm && (
            <div className="mt-4 bg-neutral-900 p-3 rounded-lg">
              <div className="flex justify-center gap-2 mb-3">
                {tipOptions.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickTip(amount)}
                    disabled={isProcessing}
                    className="btn btn-xs btn-outline border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors"
                  >
                    {amount} SOL
                  </button>
                ))}
              </div>
              <form onSubmit={handleTip} className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                  className="input input-bordered input-sm w-full bg-neutral-800 border-neutral-700"
                  placeholder="Amount in SOL"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn btn-sm bg-amber-500 hover:bg-amber-600 border-0 text-black transition-colors"
                >
                  {isProcessing ? '...' : 'Send'}
                </button>
              </form>
            </div>
          )}

          {showCommentForm && (
            <div className="mt-4">
              <form onSubmit={handleComment} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="input input-bordered input-sm w-full bg-neutral-800 border-neutral-700"
                  maxLength={280}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !commentContent.trim()}
                  className="btn btn-sm btn-primary transition-colors"
                >
                  {isProcessing ? '...' : 'Reply'}
                </button>
              </form>

              <div className="mt-4 space-y-3">
                {isLoadingComments && (
                  <div className="flex justify-center py-2">
                    <span className="loading loading-spinner loading-sm text-neutral-500"></span>
                  </div>
                )}
                {comments.map((comment) => {
                  const isOwnComment = provider.wallet?.publicKey?.equals(comment.account.commentAuthor)
                  return (
                    <div key={comment.publicKey.toBase58()} className="flex space-x-3 text-sm items-start group">
                      <div className="w-8 h-8 bg-neutral-800 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
                        <span className="font-semibold text-xs text-neutral-400">
                          {comment.account.commentAuthor.toBase58().substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 bg-neutral-800 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-white mr-2">
                            {ellipsify(comment.account.commentAuthor.toBase58(), 4)}
                          </span>
                          {isOwnComment && (
                            <button
                              className="text-neutral-400 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                              onClick={() => setCommentToRemove(comment.publicKey)}
                              disabled={isProcessing}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-neutral-300">{comment.account.content}</p>
                      </div>

                      {commentToRemove?.equals(comment.publicKey) && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-neutral-800 rounded-lg p-4 max-w-sm mx-4">
                            <h3 className="font-medium mb-3">Delete comment?</h3>
                            <p className="text-neutral-400 text-sm mb-4">This action cannot be undone.</p>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setCommentToRemove(null)}
                                className="px-3 py-1 text-sm bg-neutral-700 hover:bg-neutral-600 rounded"
                                disabled={isProcessing}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleRemoveComment(comment.publicKey)}
                                disabled={isProcessing}
                                className="px-3 py-1 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded flex items-center gap-2"
                              >
                                {isProcessing ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  <Trash2 size={14} />
                                )}
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
