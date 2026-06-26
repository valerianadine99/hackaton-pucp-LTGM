import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hackathon Base',
  description: 'VibeCoding Tournament base project',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
