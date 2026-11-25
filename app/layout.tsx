import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { UserProvider } from '@/contexts/UserContext'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'TerraLoop — Fresh Produce Recovery Marketplace',
  description:
    'AI-powered produce freshness verification connecting neighbourhood grocers with local buyers to eliminate retail food waste.',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%231e4d3b"/><path d="M16 7c-5 2.5-8 7-8 11.5A8 8 0 0 0 16 26a8 8 0 0 0 8-7.5C24 14 21 9.5 16 7zm0 4.5c2.2 2 3.5 4.6 3.5 7.2a3.5 3.5 0 0 1-7 0c0-2.6 1.3-5.2 3.5-7.2z" fill="%23ffffff"/></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            {children}
          </UserProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
