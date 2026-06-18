import './globals.css'
import { Providers } from './provider'
import MainLayout from '@/components/MainLayout'

export const metadata = {
  title: 'TailorLink - Expert Tailoring Services',
  description: 'Connect with skilled tailors, book appointments, and get custom tailoring services.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          <MainLayout>
          {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  )
}
