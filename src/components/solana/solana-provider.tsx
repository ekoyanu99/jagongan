'use client'

import { WalletError } from '@solana/wallet-adapter-base'
import {
  AnchorWallet,
  ConnectionProvider,
  useConnection,
  useWallet,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ReactNode, useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import '@solana/wallet-adapter-react-ui/styles.css'
import { AnchorProvider } from '@coral-xyz/anchor'

export function WalletButton() {
  const { connected, publicKey, wallet, disconnect } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleDisconnect = () => {
    disconnect()
    setIsOpen(false)
  }

  const baseButtonClass =
    'w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center'

  if (!isMounted) {
    return <div className={baseButtonClass + ' opacity-0'}>Loading...</div>
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {connected ? (
        <>
          <button onClick={handleToggle} className={baseButtonClass}>
            <span className="truncate">
              {publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : 'Connected'}
            </span>
          </button>
          {isOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full z-50">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2 border border-neutral-200 dark:border-neutral-700">
                <div className="p-2 text-sm text-neutral-600 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                  {wallet?.adapter.name}
                </div>
                <div
                  onClick={handleDisconnect}
                  className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-sm cursor-pointer"
                >
                  Disconnect
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <WalletMultiButton className={baseButtonClass + ' !bg-blue-500 hover:!bg-blue-600'} />
      )}
    </div>
  )
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return new AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' })
}
