import { fetchItems } from './api'

describe('fetchItems', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns items on a successful response (happy path)', async () => {
    const mockItems = [{ id: 1, name: 'Test', description: 'desc' }]
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockItems,
    } as Response)

    await expect(fetchItems()).resolves.toEqual(mockItems)
  })

  it('throws when the response is not ok (error case)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await expect(fetchItems()).rejects.toThrow('Failed to fetch items: 500')
  })
})
