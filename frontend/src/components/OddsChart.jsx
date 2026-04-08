import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { getGameHistory } from '../api/client'
import { filterVisibleBooks } from '../lib/books'

const RANGES = ['90m', '6h', '24h', 'all']
const MARKETS = [
  { key: 'spreads', label: 'Spread' },
  { key: 'h2h',     label: 'Moneyline' },
  { key: 'totals',  label: 'Total' },
]

// Distinct colors for up to 8 bookmakers
const BOOK_COLORS = [
  '#00E676', '#61DAFB', '#FFB300', '#FF7043',
  '#AB47BC', '#26C6DA', '#D4E157', '#EF5350',
]

function formatLabel(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function CustomTooltip({ active, payload, label, market }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip__time">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="custom-tooltip__entry">
          <div className="custom-tooltip__dot" style={{ background: entry.color }} />
          <span className="custom-tooltip__label">{entry.dataKey}</span>
          <span className="custom-tooltip__value">
            {market === 'h2h'
              ? (entry.value > 0 ? `+${entry.value}` : entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function buildChartData(history, market, homeTeam, awayTeam) {
  if (!history?.length) return { data: [], bookmakers: [] }

  const bookSet = new Set()
  history.forEach(snap => {
    Object.keys(snap.bookmakers || {}).forEach(bk => bookSet.add(bk))
  })
  const bookmakers = filterVisibleBooks([...bookSet])

  const data = history.map(snap => {
    const row = { time: formatLabel(snap.recorded_at) }
    bookmakers.forEach(bk => {
      const bkData = snap.bookmakers?.[bk] || {}
      if (market === 'spreads') {
        // Use home team spread point
        const homeOutcome = bkData[homeTeam]
        row[bk] = homeOutcome?.point ?? null
      } else if (market === 'h2h') {
        // Use home team ML price
        const homeOutcome = bkData[homeTeam]
        row[bk] = homeOutcome?.price ?? null
      } else if (market === 'totals') {
        // Use over total point
        const overOutcome = bkData['Over']
        row[bk] = overOutcome?.point ?? null
      }
    })
    return row
  })

  return { data, bookmakers }
}

export default function OddsChart({ gameId, homeTeam, awayTeam }) {
  const [range, setRange] = useState('24h')
  const [market, setMarket] = useState('spreads')
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getGameHistory(gameId, market, range)
      .then(data => setHistory(data.history || []))
      .catch(() => setError('Failed to load chart data'))
      .finally(() => setLoading(false))
  }, [gameId, market, range])

  const { data, bookmakers } = buildChartData(history, market, homeTeam, awayTeam)

  const yLabel = market === 'spreads' ? 'Spread (pts)' :
                 market === 'h2h'     ? 'Price (American)' : 'Total (pts)'

  return (
    <div className="chart-section">
      <div className="chart-header">
        <div>
          <span className="chart-title">Line Movement</span>
          <p className="chart-subtitle">
            {awayTeam} at {homeTeam}
          </p>
        </div>
        <div className="chart-header__actions">
          <div className="chart-market-tabs">
            {MARKETS.map(m => (
              <button
                key={m.key}
                className={`market-btn ${market === m.key ? 'market-btn--active' : ''}`}
                onClick={() => setMarket(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="chart-controls">
            {RANGES.map(r => (
              <button
                key={r}
                className={`range-btn ${range === r ? 'range-btn--active' : ''}`}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="chart-empty"><div className="spinner" /></div>
      )}

      {error && !loading && (
        <div className="chart-empty" style={{ color: 'var(--danger)' }}>{error}</div>
      )}

      {!loading && !error && data.length < 2 && (
        <div className="chart-empty">Not enough data yet — check back after a few polls.</div>
      )}

      {!loading && !error && data.length >= 2 && (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'var(--sub)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'var(--sub)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: 'var(--sub)', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip market={market} />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              formatter={(val) => <span style={{ color: 'var(--sub)' }}>{val}</span>}
            />
            {bookmakers.map((bk, i) => (
              <Line
                key={bk}
                type="monotone"
                dataKey={bk}
                stroke={BOOK_COLORS[i % BOOK_COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
