'use client'

import { usePathname } from 'next/navigation'
import HeaderNav from './HeaderNavigation'

interface MainLayoutProps {
    children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
    const pathname = usePathname()

    // Check if we should show the header navigation
    // Dont show on login and signup pages
    const showHeader = !['/login', '/signup'].includes(pathname)

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {showHeader && <HeaderNav />}
            <main className="flex-grow">{children}</main>
        </div>
    )
}
