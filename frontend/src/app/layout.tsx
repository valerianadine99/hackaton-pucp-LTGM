import type { Metadata } from 'next'
import { Fraunces, Archivo, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})
const sans = Archivo({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vigía — costa norte',
  description: 'Alerta temprana y memoria del Fenómeno El Niño: tu distrito, tu historial, tu plan.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
