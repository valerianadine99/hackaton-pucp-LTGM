import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vigía — costa norte',
  description: 'Alerta temprana y memoria del Fenómeno El Niño: tu distrito, tu historial, tu plan.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
