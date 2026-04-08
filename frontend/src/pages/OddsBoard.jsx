import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getGames } from '../api/client'
import GameCard from '../components/GameCard'
import { LeagueLogo } from '../components/BrandLogo'
import { isVisibleBook } from '../lib/books'

const SPORT_ORDER = ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'icehockey_nhl']
const SPORT_LABELS = {
  americanfootball_nfl: 'NFL',
  basketball_nba: 'NBA',
  baseball_mlb: 'MLB',
  icehockey_nhl: 'NHL',
}
const SPORT_FILTERS = [
  { key: 'all', label: 'All Sports' },
  { key: 'nfl', label: 'NFL' },
  { key: 'nba', label: 'NBA' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nhl', label: 'NHL' },
]
const MARKETS = [
  { key: 'spreads', label: 'Spread' },
  { key: 'h2h', label: 'Moneyline' },
  { key: 'totals', label: 'Totals' },
]
const MAX_BOOKS = 8

const BOOK_ORDER = [
  'betmgm', 'betonlineag', 'fanduel', 'betus',
  'bovada', 'draftkings', 'betrivers', 'lowvig', 'mybookieag',
]

function getTopBooks(games) {
  const counts = {}
  games.forEach(game => {
    Object.keys(game.bookmakers || {}).forEach(book => {
      if (!isVisibleBook(book)) return
      counts[book] = (counts[book] || 0) + 1
    })
  })
  return Object.entries(counts)
    .sort((a, b) => {
      const ai = BOOK_ORDER.indexOf(a[0])
      const bi = BOOK_ORDER.indexOf(b[0])
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return b[1] - a[1]
    })
    .slice(0, MAX_BOOKS)
    .map(([book]) => book)
}

function groupBySport(games) {
  const grouped = {}
  games.forEach(game => {
    if (!grouped[game.sport]) grouped[game.sport] = []
    grouped[game.sport].push(game)
  })
  return SPORT_ORDER.filter(sport => grouped[sport]?.length).map(sport => ({
    sport,
    games: grouped[sport],
  }))
}

function getSportDisplay(sport) {
  if (sport === 'all') return 'All Sports'
  const mapped = Object.values({
    nfl: 'americanfootball_nfl',
    nba: 'basketball_nba',
    mlb: 'baseball_mlb',
    nhl: 'icehockey_nhl',
  }).find(value => value.includes(sport)) || sport
  return SPORT_LABELS[mapped] || sport.toUpperCase()
}

export default function OddsBoard() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const sport = params.get('sport') || 'all'

  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [market, setMarket] = useState('spreads')

  const fetchGames = useCallback(() => {
    getGames(sport)
      .then(data => {
        setGames(data)
        setLastUpdated(new Date())
        setError(null)
      })
      .catch(() => setError('Failed to load odds. Check that the backend is running.'))
      .finally(() => setLoading(false))
  }, [sport])

  useEffect(() => {
    setLoading(true)
    setGames([])
    fetchGames()
    const id = setInterval(fetchGames, 60000)
    return () => clearInterval(id)
  }, [fetchGames])

  const books = getTopBooks(games)
  const grouped = groupBySport(games)
  const showGrouped = sport === 'all'
  const sportLabelDisplay = getSportDisplay(sport)

  return (
    <div className="board-page">
      <div className="board-shell">
        <aside className="board-sidebar">
          <div className="board-sidebar__block">
            <div className="board-sidebar__title">Leagues</div>
            <div className="board-sidebar__items">
              {SPORT_FILTERS.map(item => (
                <button
                  key={item.key}
                  className={`board-sidebar__item ${sport === item.key ? 'board-sidebar__item--active' : ''}`}
                  onClick={() => navigate(item.key === 'all' ? '/' : `/?sport=${item.key}`)}
                >
                  <span className="board-sidebar__item-dot" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="board-sidebar__block">
            <div className="board-sidebar__title">Market</div>
            <div className="board-sidebar__items">
              {MARKETS.map(item => (
                <button
                  key={item.key}
                  className={`board-sidebar__item ${market === item.key ? 'board-sidebar__item--active' : ''}`}
                  onClick={() => setMarket(item.key)}
                >
                  <span className="board-sidebar__item-dot" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="board-main">

          {error && <div className="error-banner">{error}</div>}
          {loading && <div className="loading"><div className="spinner" />fetching lines…</div>}

          {!loading && !error && games.length === 0 && (
            <div className="empty-state">
              <span className="empty-state__title">No upcoming games</span>
              <span className="empty-state__sub">Try another sport or check back once the feed updates.</span>
            </div>
          )}

          {!loading && games.length > 0 && (
            showGrouped ? (
              grouped.map(({ sport: groupedSport, games: sportGames }) => (
                <section key={groupedSport} className="sport-group">
                  <div className="sport-group__header">
                    <LeagueLogo sport={groupedSport} />
                    <div className="sport-group__line" />
                    <span className="sport-group__count">{sportGames.length} games</span>
                  </div>
                  <div className="game-list">
                    {sportGames.map(game => (
                      <GameCard key={game.id} game={game} market={market} books={getTopBooks(sportGames)} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="game-list">
                {games.map(game => (
                  <GameCard key={game.id} game={game} market={market} books={books} />
                ))}
              </div>
            )
          )}
        </section>
      </div>
    </div>
  )
}
