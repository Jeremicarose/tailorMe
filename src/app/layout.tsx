import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './provider'
import { redirect } from 'next/navigation'

const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-inter'})


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}