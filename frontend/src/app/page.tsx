'use client'

import { useEffect, useState } from 'react'
import { fetchItems, type Item } from '@/lib/api'

type Status = 'loading' | 'ready' | 'error'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    fetchItems()
      .then((data) => {
        setItems(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem' }}>
      <h1>Hackathon Base</h1>
      <p>Frontend ↔ backend wired over mock data. Replace once the theme drops.</p>

      {status === 'loading' && <p>Loading items…</p>}
      {status === 'error' && (
        <p>Could not reach the API. Is the backend running on port 8000?</p>
      )}
      {status === 'ready' && (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong> — {item.description}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
