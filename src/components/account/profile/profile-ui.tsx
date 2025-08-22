import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

export function ProfileHero({ address, totalReceived }: { address: PublicKey; totalReceived: number }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mb-2">
        {address.toBase58().slice(0, 2).toUpperCase()}
      </div>
      <div className="font-mono text-lg mb-1">{address.toBase58()}</div>
      <div className="text-gray-400 text-sm mb-2">
        Total Tips Received:{' '}
        <span className="font-bold text-green-400">{(totalReceived / LAMPORTS_PER_SOL).toFixed(4)} SOL</span>
      </div>
    </div>
  )
}
