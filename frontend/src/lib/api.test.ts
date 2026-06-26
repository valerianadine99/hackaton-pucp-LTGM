import { fetchDistricts, fetchDistrict, fetchEnfen } from './api'

describe('api', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('fetchDistricts returns the list on a successful response (happy path)', async () => {
    const mock = [
      { ubigeo_code: '240101', name: 'Tumbes', department: 'Tumbes', count: 159, level: 'high', years: [2017] },
    ]
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mock,
    } as Response)

    await expect(fetchDistricts()).resolves.toEqual(mock)
  })

  it('fetchDistrict throws when the response is not ok (error case)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await expect(fetchDistrict('999999')).rejects.toThrow(
      'GET /api/districts/999999 failed: 404'
    )
  })

  it('fetchEnfen returns null when there is no ENFEN data yet (404)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mock,
    } as Response)

    await expect(fetchEnfen()).resolves.toEqual(mock)
  })
})
