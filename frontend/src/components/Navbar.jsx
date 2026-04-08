import { useLocation, useNavigate } from 'react-router-dom'

const SPORTS = [
  { key: 'all', label: 'All' },
  { key: 'nfl', label: 'NFL' },
  { key: 'nba', label: 'NBA' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nhl', label: 'NHL' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const activeSport = params.get('sport') || 'all'

  const handleSportChange = (sport) => {
    navigate(sport === 'all' ? '/' : `/?sport=${sport}`)
  }

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <a href="/" className="navbar__logo">
          <img className="navbar__logo-image" src="/branding/logo.png" alt="SharpEdge" />
        </a>
      </div>

      <div className="navbar__sports">
        {SPORTS.map(s => (
          <button
            key={s.key}
            className={`sport-tab ${activeSport === s.key ? 'sport-tab--active' : ''}`}
            onClick={() => handleSportChange(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
