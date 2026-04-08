import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getGameBooks } from '../api/client'
import OddsChart from '../components/OddsChart'
import BookCompareTable from '../components/BookCompareTable'
import { LeagueLogo } from '../components/BrandLogo'
import { filterVisibleBooks } from '../lib/books'

function formatGameTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatRelativeTime(iso) {
  if (!iso) return ''
  const diff = new Date(iso).getTime() - Date.now()
  const hours = Math.round(diff / (1000 * 60 * 60))
  if (Math.abs(hours) < 1) return 'Starting soon'
  return hours > 0 ? `Starts in ${hours}h` : 'In progress or closed'
}

export default function GameDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getGameBooks(id)
      .then(data => setGameData(data))
      .catch(() => setError('Game not found or data unavailable.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div>
      <button className="detail-back" onClick={() => navigate(-1)}>← Back</button>
      <div className="loading"><div className="spinner" />Loading game…</div>
    </div>
  )

  if (error || !gameData) return (
    <div>
      <button className="detail-back" onClick={() => navigate(-1)}>← Back</button>
      <div className="error-banner">{error || 'Game not found'}</div>
    </div>
  )

  const books = filterVisibleBooks(Object.keys(gameData.bookmakers || {}))

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="detail-hero">
        <div className="detail-header">
          <div className="detail-header__sport">
            <LeagueLogo sport={gameData.sport} />
          </div>
          <div className="detail-header__matchup">
            <span>{gameData.away_team}</span>
            <span className="detail-header__vs">@</span>
            <span>{gameData.home_team}</span>
          </div>
          <div className="detail-header__time">{formatGameTime(gameData.commence_time)}</div>
        </div>

        <div className="detail-summary">
          <div className="detail-summary__item">
            <span className="detail-summary__label">Coverage</span>
            <span className="detail-summary__value">{books.length} books</span>
          </div>
          <div className="detail-summary__item">
            <span className="detail-summary__label">Status</span>
            <span className="detail-summary__value">{formatRelativeTime(gameData.commence_time)}</span>
          </div>
          <div className="detail-summary__item">
            <span className="detail-summary__label">Board</span>
            <span className="detail-summary__value">Line comparison</span>
          </div>
        </div>
      </div>

      <OddsChart
        gameId={id}
        homeTeam={gameData.home_team}
        awayTeam={gameData.away_team}
      />

      <BookCompareTable
        gameId={id}
        homeTeam={gameData.home_team}
        awayTeam={gameData.away_team}
      />

    </div>
  )
}
