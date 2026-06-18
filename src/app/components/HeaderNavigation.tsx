'use client'

import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import {
  Menu, X, User, LogOut, Home, Map, Calendar,
  Settings, ChevronDown, Scissors
} from 'lucide-react'

export default function HeaderNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const getNavItems = () => {
    const commonItems = [
      { name: 'Home', href: '/', icon: <Home className="h-5 w-5" /> }
    ]

    const roleBasedItems = session?.user?.role === UserRole.TAILOR
      ? [
          { name: 'Dashboard', href: '/dashboard', icon: <Home className="h-5 w-5" /> },
          { name: 'Profile', href: '/dashboard/profile', icon: <User className="h-5 w-5" /> },
          { name: 'Appointments', href: '/dashboard/appointments', icon: <Calendar className="h-5 w-5" /> }
        ]
      : [
          { name: 'Dashboard', href: '/dashboard', icon: <Home className="h-5 w-5" /> },
          { name: 'Find Tailors', href: '/dashboard/map', icon: <Map className="h-5 w-5" /> },
          { name: 'My Orders', href: '/dashboard/order', icon: <Scissors className="h-5 w-5" /> }
        ]

    return session ? [...commonItems, ...roleBasedItems] : commonItems
  }

  const navItems = getNavItems()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Scissors className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">TailorLink</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-1 py-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="h-8 w-8 object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <span>{session.user.name || 'User'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl z-10">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden py-4 px-4 bg-gray-50 border-t border-gray-200">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 py-2 px-3 rounded-lg ${
                  pathname === item.href
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}

            {session ? (
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="h-8 w-8 object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center space-x-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span>Profile Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 py-2 px-3 rounded-lg text-red-600 hover:bg-gray-100 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 mt-2 border-t border-gray-200 flex flex-col space-y-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center py-2 text-gray-700 hover:text-orange-600 border border-gray-300 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
