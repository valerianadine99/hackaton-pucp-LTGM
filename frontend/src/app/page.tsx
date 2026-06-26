'use client'

import { useEffect, useState } from 'react'
import { fetchItems, type Item } from '@/lib/api'
import { Button } from '@/components/ui/button'

type Status = 'loading' | 'ready' | 'error'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [status, setStatus] = useState<Status>('loading')

  function load() {
    setStatus('loading')
    fetchItems()
      .then((data) => {
        setItems(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Hackathon Base</h1>
      <p className="mt-2 text-muted-foreground">
        Frontend ↔ backend wired over mock data. Now styled with Tailwind + shadcn/ui.
      </p>

      <div className="mt-6 flex gap-3">
        <Button onClick={load}>Reload items</Button>
        <Button variant="outline" onClick={() => setStatus('error')}>
          Simulate error
        </Button>
      </div>

      {status === 'loading' && (
        <p className="mt-6 text-muted-foreground">Loading items…</p>
      )}
      {status === 'error' && (
        <p className="mt-6 text-destructive">
          Could not reach the API. Is the backend running on port 8000?
        </p>
      )}
      {status === 'ready' && (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
            >
              <strong className="font-medium">{item.name}</strong>
              <span className="text-muted-foreground"> — {item.description}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
