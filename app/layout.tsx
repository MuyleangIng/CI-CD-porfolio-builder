import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ing Muyleang',
  description: 'If you can dream it, you can do it.',
  generator: 'By me and Mr. v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
