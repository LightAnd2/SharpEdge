const LEAGUE_BRANDS = {
  americanfootball_nfl: { short: 'NFL', label: 'NFL', color: '#2563eb', text: '#dbeafe', image: '/branding/leagues/nfl logo.png' },
  basketball_nba: { short: 'NBA', label: 'NBA', color: '#ea580c', text: '#ffedd5', image: '/branding/leagues/nbalogo.png' },
  baseball_mlb: { short: 'MLB', label: 'MLB', color: '#059669', text: '#d1fae5', image: '/branding/leagues/mlb logo.png' },
  icehockey_nhl: { short: 'NHL', label: 'NHL', color: '#64748b', text: '#e2e8f0', image: '/branding/leagues/nhl logo.png' },
}

const BOOK_BRANDS = {
  betmgm: { short: 'MGM', label: 'BetMGM', color: '#d4a017', image: '/branding/sportsbooks/BETMGM.png' },
  betonlineag: { short: 'BO', label: 'BetOnline', color: '#fb923c', image: '/branding/sportsbooks/betonline.png' },
  betrivers: { short: 'BR', label: 'BetRivers', color: '#516bff', image: '/branding/sportsbooks/betrivers.png' },
  betus: { short: 'BU', label: 'BetUS', color: '#dc2626', image: '/branding/sportsbooks/BetUS.png' },
  bovada: { short: 'BV', label: 'Bovada', color: '#f59e0b', image: '/branding/sportsbooks/bovada.jpg' },
  draftkings: { short: 'DK', label: 'DraftKings', color: '#53c22b', image: '/branding/sportsbooks/draftkings.png' },
  fanduel: { short: 'FD', label: 'FanDuel', color: '#38a7ff', image: '/branding/sportsbooks/fanduel-seeklogo.png' },
  lowvig: { short: 'LV', label: 'LowVig', color: '#10b981', image: '/branding/sportsbooks/lowvig.png' },
  mybookieag: { short: 'MB', label: 'MyBookie', color: '#f43f5e', image: '/branding/sportsbooks/mybookie.png' },
}

const LARGE_BOOK_LOGOS = {
  betrivers: 'brand-chip__image-wrap--book-large',
}

const BOOK_IMAGE_CLASSES = {
  betrivers: 'brand-chip__image--betrivers',
}

function fallbackShort(value = '') {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
}

export function LeagueLogo({ sport, compact = false }) {
  const brand = LEAGUE_BRANDS[sport] || {
    short: fallbackShort(sport),
    label: sport,
    color: '#475569',
    text: '#e2e8f0',
  }

  return (
    <span className={`brand-chip brand-chip--league ${compact ? 'brand-chip--compact' : ''}`} title={brand.label}>
      {brand.image ? (
        <span className="brand-chip__image-wrap">
          <img className="brand-chip__image" src={brand.image} alt={brand.label} />
        </span>
      ) : (
        <span className="brand-chip__badge" style={{ background: brand.color, color: brand.text }}>
          {brand.short}
        </span>
      )}
      {!compact && <span className="brand-chip__label">{brand.label}</span>}
    </span>
  )
}

export function SportsbookLogo({ book, compact = false }) {
  const brand = BOOK_BRANDS[book] || {
    short: fallbackShort(book),
    label: book?.replace(/_/g, ' ') || 'Sportsbook',
    color: '#94a3b8',
  }
  const imageWrapClass = LARGE_BOOK_LOGOS[book] || ''
  const imageClass = BOOK_IMAGE_CLASSES[book] || ''

  return (
    <span className={`brand-chip brand-chip--book ${compact ? 'brand-chip--compact' : ''}`} title={brand.label}>
      {brand.image ? (
        <span className={`brand-chip__image-wrap brand-chip__image-wrap--book ${imageWrapClass}`.trim()}>
          <img className={`brand-chip__image ${imageClass}`.trim()} src={brand.image} alt={brand.label} />
        </span>
      ) : (
        <span className="brand-chip__badge brand-chip__badge--book" style={{ background: brand.color }}>
          {brand.short}
        </span>
      )}
      {!compact && <span className="brand-chip__label">{brand.label}</span>}
    </span>
  )
}
