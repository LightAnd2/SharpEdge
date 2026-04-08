import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
})

export const getGames = (sport = 'all') =>
  api.get('/odds/games', { params: { sport } }).then(r => r.data)

export const getGameHistory = (gameId, market = 'spreads', range = '24h') =>
  api.get(`/odds/game/${encodeURIComponent(gameId)}/history`, { params: { market, range } }).then(r => r.data)

export const getGameBooks = (gameId) =>
  api.get(`/odds/game/${encodeURIComponent(gameId)}/books`).then(r => r.data)
