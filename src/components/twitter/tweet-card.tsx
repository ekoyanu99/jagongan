import { useState } from 'react'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTwitterProgram } from './twitter-data-access'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { sha256 } from 'js-sha256'
import { Heart, MessageCircle, Coffee, MoreHorizontal } from 'lucide-react'
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
  const { likeTweet, tipTweet, commentTweet, programId, program } = useTwitterProgram()
  const [commentContent, setCommentContent] = useState('')
  const [tipAmount, setTipAmount] = useState(0.01)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [showTipForm, setShowTipForm] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)

  const tipOptions = [0.001, 0.01, 0.1]

  const getReactionPda = () => {
    if (!provider.wallet?.publicKey) return undefined
    const seed = Buffer.from('TWEET_REACTION_SEED')
    return PublicKey.findProgramAddressSync(
      [seed, provider.wallet.publicKey.toBuffer(), tweet.publicKey.toBuffer()],
      programId,
    )[0]
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

  const totalTipsInSol = (tweet.account.totalTips?.toNumber() / LAMPORTS_PER_SOL).toFixed(4)
  const likes = tweet.account.likes?.toNumber() || 0
  const author = tweet.account.tweetAuthor.toBase58()

  return (
    <article className="border-b border-neutral-800 p-4 transition-colors hover:bg-neutral-900/50 cursor-pointer">
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
              className="flex items-center space-x-2 hover:text-blue-400 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-sm">{comments.length > 0 ? comments.length : ''}</span>
            </button>
            <button
              onClick={handleReaction}
              className="flex items-center space-x-2 hover:text-rose-400 transition-colors"
            >
              <Heart size={18} />
              <span className="text-sm">{likes > 0 ? likes : ''}</span>
            </button>
            <button
              onClick={() => setShowTipForm(!showTipForm)}
              className="flex items-center space-x-2 hover:text-amber-400 transition-colors"
            >
              <Coffee size={18} />
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
                    className="btn btn-xs btn-outline border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black"
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
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn btn-sm bg-amber-500 hover:bg-amber-600 border-0 text-black"
                >
                  {isProcessing ? '...' : 'Kirim'}
                </button>
              </form>
            </div>
          )}

          {showCommentForm && (
            <div className="mt-4">
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tulis balasan..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="input input-bordered input-sm w-full bg-neutral-800 border-neutral-700"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !commentContent.trim()}
                  className="btn btn-sm btn-primary"
                >
                  {isProcessing ? '...' : 'Balas'}
                </button>
              </form>

              <div className="mt-4 space-y-3">
                {isLoadingComments && <span className="loading loading-spinner loading-sm text-neutral-500"></span>}
                {comments.map((comment) => (
                  <div key={comment.publicKey.toBase58()} className="flex space-x-3 text-sm">
                    <div className="w-8 h-8 bg-neutral-800 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="font-semibold text-xs text-neutral-400">
                        {comment.account.commentAuthor.toBase58().substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-white mr-2">
                        {ellipsify(comment.account.commentAuthor.toBase58(), 4)}
                      </span>
                      <span className="text-neutral-400">{comment.account.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
