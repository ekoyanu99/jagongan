'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, User, Twitter, Search, Wallet } from 'lucide-react'
import { ThemeSelect } from '@/components/theme-select'
import { ClusterUiSelect } from './cluster/cluster-ui'
import { WalletButton } from '@/components/solana/solana-provider'

export function AppLayout({
  children,
  links = [],
}: {
  children: React.ReactNode
  links: { label: string; path: string }[]
}) {
  const pathname = usePathname()

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  const Sidebar = () => (
    <aside className="col-span-3 border-r border-neutral-200 dark:border-neutral-800 min-h-screen hidden md:block">
      <div className="fixed w-64 p-4 flex flex-col h-full">
        <div className="p-2 mb-5">
          <Link href="/" className="flex items-center space-x-2">
            <Twitter size={32} className="text-blue-400" />
            <span className="text-2xl font-bold">Jagongan</span>
          </Link>
        </div>
        <nav className="flex-grow space-y-2">
          {links.map(({ label, path }) => (
            <Link
              key={path}
              href={path}
              className={`flex items-center space-x-4 p-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 w-full text-left text-xl transition-colors ${
                isActive(path) ? 'font-bold' : 'font-normal text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {label === 'Home' && <Home size={24} />}
              {label === 'Account' && <Wallet size={24} />}
              {label === 'Profile' && <User size={24} />}
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="space-y-4 mt-auto">
          <div className="flex items-center justify-around p-2 bg-neutral-100 dark:bg-neutral-900 rounded-full">
            <ClusterUiSelect />
            <ThemeSelect />
          </div>
          <div className="dropdown dropdown-top w-full">
            <WalletButton />
          </div>
        </div>
      </div>
    </aside>
  )

  const RightSidebar = () => (
    <aside className="col-span-3 hidden lg:block">
      <div className="fixed w-80 h-screen overflow-y-auto no-scrollbar">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-gray-800 text-white py-3 pl-12 pr-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="bg-gray-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">What&apos;s happening</h2>
            <div className="space-y-4">
              <div className="cursor-pointer hover:bg-gray-700 p-2 rounded-lg">
                <p className="text-sm text-gray-400">Trending in Indonesia</p>
                <p className="font-bold">#Solana</p>
                <p className="text-sm text-gray-400">2.5K posts</p>
              </div>
            </div>
            <button className="text-blue-400 hover:text-blue-300 text-sm mt-4">Show more</button>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">Who to follow</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-bold">Solana</p>
                    <p className="text-gray-400 text-sm">@solana</p>
                  </div>
                </div>
                <button className="bg-white text-black px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-200">
                  Follow
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-bold">Ackee Blockchain</p>
                    <p className="text-gray-400 text-sm">@AckeeBlockchain</p>
                  </div>
                </div>
                <button className="bg-white text-black px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-200">
                  Follow
                </button>
              </div>
            </div>

            <button className="text-blue-400 hover:text-blue-300 text-sm mt-4">Show more</button>
          </div>
          <div className="text-gray-400 text-xs mt-4">
            <div className="flex flex-wrap gap-2">
              <span className="hover:underline cursor-pointer">Terms of Service</span>
              <span className="hover:underline cursor-pointer">Privacy Policy</span>
              <span className="hover:underline cursor-pointer">Cookie Policy</span>
            </div>
            <p className="mt-2">© 2025 Jagongan</p>
          </div>
        </div>
      </div>
    </aside>
  )

  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 md:hidden z-50">
      <div className="flex justify-around items-center py-2">
        {links.map(({ label, path }) => (
          <Link
            key={path}
            href={path}
            className={`p-3 rounded-full ${isActive(path) ? 'bg-neutral-100 dark:bg-neutral-900' : 'text-neutral-500'}`}
          >
            {label === 'Home' && <Home size={24} />}
            {label === 'Account' && <Wallet size={24} />}
            {label === 'Profile' && <User size={24} />}
          </Link>
        ))}
        <div className="p-3">
          <WalletButton />
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-12 gap-0">
          <Sidebar />
          <main className="col-span-12 md:col-span-9 lg:col-span-6 border-r border-neutral-200 dark:border-neutral-800">
            {children}
          </main>
          <RightSidebar />
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
