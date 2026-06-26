import type { Metadata } from 'next'
import { Libre_Franklin } from 'next/font/google'
import './globals.css'

const franklin = Libre_Franklin({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vigía — costa norte',
  description: 'Memoria y alerta del Fenómeno El Niño: tu distrito, tu historial, tu plan.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={franklin.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
