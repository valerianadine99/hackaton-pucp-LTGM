export interface Item {
  id: number
  name: string
  description: string
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

export async function fetchItems(): Promise<Item[]> {
  const response = await fetch(`${API_BASE_URL}/api/items`)
  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.status}`)
  }
  return response.json()
}
