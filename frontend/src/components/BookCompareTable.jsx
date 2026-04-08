import { useState, useEffect } from 'react'
import { getGameBooks } from '../api/client'
import { SportsbookLogo } from './BrandLogo'
import { filterVisibleBooks } from '../lib/books'

function formatOdds(price) {
  if (price == null) return '—'
  return price > 0 ? `+${price}` : `${price}`
}

function isBest(value, allValues, higherIsBetter = true) {
  const valid = allValues.filter(v => v != null)
  if (!valid.length || value == null) return false
  // For American odds, convert to decimal to compare
  const toDecimal = (p) => p > 0 ? p / 100 : 100 / Math.abs(p)
  if (higherIsBetter) {
    return toDecimal(value) === Math.max(...valid.map(toDecimal))
  }
  return toDecimal(value) === Math.min(...valid.map(toDecimal))
}

function Cell({ price, point, allPrices, showPoint = false }) {
  const best = isBest(price, allPrices)
  return (
    <td className={best ? 'cell-best' : ''}>
      <div className="compare-cell">
        <span className={`compare-cell__price ${best ? 'compare-cell--best' : ''}`} style={best ? { color: 'var(--accent)' } : {}}>
          {formatOdds(price)}
        </span>
        {showPoint && point != null && (
          <span className="compare-cell__point">
            {point > 0 ? `+${point}` : point}
          </span>
        )}
      </div>
    </td>
  )
}

export default function BookCompareTable({ gameId, homeTeam, awayTeam }) {
  const [booksData, setBooksData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getGameBooks(gameId)
      .then(data => setBooksData(data))
      .catch(() => setError('Failed to load book data'))
      .finally(() => setLoading(false))
  }, [gameId])

  if (loading) return (
    <div className="compare-section">
      <div className="compare-section__title">Book Comparison</div>
      <div className="loading" style={{ padding: '24px' }}><div className="spinner" /></div>
    </div>
  )

  if (error) return (
    <div className="compare-section">
      <div className="compare-section__title">Book Comparison</div>
      <div className="error-banner" style={{ margin: 16 }}>{error}</div>
    </div>
  )

  if (!booksData) return null

  const books = filterVisibleBooks(Object.keys(booksData.bookmakers || {})).sort()
  if (!books.length) return null

  // Build row definitions
  const rows = [
    { label: `${awayTeam} Spread`, market: 'spreads', team: awayTeam, showPoint: true },
    { label: `${homeTeam} Spread`, market: 'spreads', team: homeTeam, showPoint: true },
    { label: `${awayTeam} ML`,     market: 'h2h',     team: awayTeam },
    { label: `${homeTeam} ML`,     market: 'h2h',     team: homeTeam },
    { label: 'Over',               market: 'totals',  team: 'Over',  showPoint: true },
    { label: 'Under',              market: 'totals',  team: 'Under', showPoint: true },
  ]

  return (
    <div className="compare-section">
      <div className="compare-section__header">
        <div className="compare-section__title">Book Comparison</div>
        <div className="compare-section__subtitle">Best available numbers across the market</div>
      </div>
      <table className="compare-table">
        <thead>
          <tr>
            <th>Market</th>
            {books.map(bk => (
              <th key={bk}>
                <SportsbookLogo book={bk} compact />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const prices = books.map(bk =>
              booksData.bookmakers[bk]?.[row.market]?.[row.team]?.price ?? null
            )
            return (
              <tr key={row.label}>
                <td>{row.label}</td>
                {books.map((bk, i) => {
                  const entry = booksData.bookmakers[bk]?.[row.market]?.[row.team]
                  return (
                    <Cell
                      key={bk}
                      price={entry?.price ?? null}
                      point={entry?.point ?? null}
                      allPrices={prices}
                      showPoint={row.showPoint}
                    />
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
