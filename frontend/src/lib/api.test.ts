import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { fetchDistricts, fetchDistrict, fetchEnfen } from './api'

/** Mockea `fetch` una vez con la respuesta dada (helper tipado para jest 30). */
function mockFetch(init: { ok: boolean; status?: number; data?: unknown }) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: init.ok,
      status: init.status ?? (init.ok ? 200 : 500),
      json: async () => init.data,
    } as Response)
  ) as typeof fetch
}

describe('api', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('fetchDistricts returns the list on a successful response (happy path)', async () => {
    const mock = [
      { ubigeo_code: '240101', name: 'Tumbes', department: 'Tumbes', count: 159, level: 'high', years: [2017] },
    ]
    mockFetch({ ok: true, data: mock })

    await expect(fetchDistricts()).resolves.toEqual(mock)
  })

  it('fetchDistrict throws when the response is not ok (error case)', async () => {
    mockFetch({ ok: false, status: 404 })

    await expect(fetchDistrict('999999')).rejects.toThrow(
      'GET /api/districts/999999 failed: 404'
    )
  })

  it('fetchEnfen returns null when there is no ENFEN data yet (404)', async () => {
    mockFetch({ ok: false, status: 404 })

    await expect(fetchEnfen()).resolves.toBeNull()
  })

  it('fetchEnfen returns the status on success', async () => {
    const mock = {
      state: 'Alerta de El Niño Costero',
      summary: '',
      bulletin_number: 'N°11-2026',
      date: '2026-06-15',
      source_url: 'https://enfen.imarpe.gob.pe/comunicados/',
    }
    mockFetch({ ok: true, status: 200, data: mock })

    await expect(fetchEnfen()).resolves.toEqual(mock)
  })
})
