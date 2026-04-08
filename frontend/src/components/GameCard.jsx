import { useNavigate } from 'react-router-dom'
import SharpBadge from './SharpBadge'
import { SportsbookLogo } from './BrandLogo'

const TEAM_LOGO_MAP = {
  'anaheim ducks': '/branding/teams/nhl/ducks.png',
  'arizona diamondbacks': '/branding/teams/mlb/diamondbacks.png',
  'boston bruins': '/branding/teams/nhl/bruins.png',
  'atlanta braves': '/branding/teams/mlb/braves.png',
  'atlanta hawks': '/branding/teams/nba/hawks.png',
  'baltimore orioles': '/branding/teams/mlb/orioles.png',
  'buffalo sabres': '/branding/teams/nhl/sabres.png',
  'calgary flames': '/branding/teams/nhl/flames.png',
  'carolina hurricanes': '/branding/teams/nhl/hurricanes.png',
  'boston red sox': '/branding/teams/mlb/red sox.png',
  'boston celtics': '/branding/teams/nba/celtics.png',
  'brooklyn nets': '/branding/teams/nba/nets.png',
  'chicago blackhawks': '/branding/teams/nhl/blackhawks.png',
  'chicago cubs': '/branding/teams/mlb/cubs.png',
  'chicago bulls': '/branding/teams/nba/bulls.png',
  'chicago white sox': '/branding/teams/mlb/white sox.png',
  'cincinnati reds': '/branding/teams/mlb/reds.png',
  'cleveland guardians': '/branding/teams/mlb/guardians.png',
  'cleveland cavaliers': '/branding/teams/nba/cavs.png',
  'columbus blue jackets': '/branding/teams/nhl/blue jackets.png',
  'dallas mavericks': '/branding/teams/nba/mavericks.png',
  'dallas stars': '/branding/teams/nhl/stars.png',
  'denver nuggets': '/branding/teams/nba/nuggets.jpg',
  'detroit tigers': '/branding/teams/mlb/tigers.png',
  'detroit pistons': '/branding/teams/nba/pistons.png',
  'detroit red wings': '/branding/teams/nhl/red wings.png',
  'golden state warriors': '/branding/teams/nba/warriors.png',
  'edmonton oilers': '/branding/teams/nhl/oilers.png',
  'los angeles kings': '/branding/teams/nhl/LA kings.png',
  'minnesota wild': '/branding/teams/nhl/wild.png',
  'montreal canadiens': '/branding/teams/nhl/canadiens.png',
  'houston astros': '/branding/teams/mlb/astros.png',
  'houston rockets': '/branding/teams/nba/rockets.png',
  'indiana pacers': '/branding/teams/nba/pacers.png',
  'kansas city royals': '/branding/teams/mlb/royals.png',
  'los angeles angels': '/branding/teams/mlb/angels.png',
  'los angeles lakers': '/branding/teams/nba/lakers.png',
  'los angeles clippers': '/branding/teams/nba/clippers.png',
  'los angeles dodgers': '/branding/teams/mlb/Dodgers.png',
  'memphis grizzlies': '/branding/teams/nba/grizzlies.png',
  'miami marlins': '/branding/teams/mlb/marlins.png',
  'milwaukee bucks': '/branding/teams/nba/bucks.png',
  'milwaukee brewers': '/branding/teams/mlb/milwaukee-brewers-logo.svg',
  'miami heat': '/branding/teams/nba/heat.png',
  'minnesota twins': '/branding/teams/mlb/twins.png',
  'minnesota timberwolves': '/branding/teams/nba/Timberwolves.png',
  'nashville predators': '/branding/teams/nhl/predators.png',
  'new york rangers': '/branding/teams/nhl/NY Rangers.png',
  'new york mets': '/branding/teams/mlb/mets.png',
  'new york yankees': '/branding/teams/mlb/yankees.png',
  'new orleans pelicans': '/branding/teams/nba/pelicans.png',
  'oakland athletics': '/branding/teams/mlb/athletics.png',
  'athletics': '/branding/teams/mlb/athletics.png',
  'ottawa senators': '/branding/teams/nhl/senators.png',
  'philadelphia flyers': '/branding/teams/nhl/flyers.png',
  'philadelphia phillies': '/branding/teams/mlb/phillies.png',
  'new york knicks': '/branding/teams/nba/knicks.png',
  'oklahoma city thunder': '/branding/teams/nba/thunder.png',
  'orlando magic': '/branding/teams/nba/magic.png',
  'pittsburgh penguins': '/branding/teams/nhl/penguins.png',
  'pittsburgh pirates': '/branding/teams/mlb/pirates.png',
  'philadelphia 76ers': '/branding/teams/nba/76ers.png',
  'phoenix suns': '/branding/teams/nba/suns.png',
  'san diego padres': '/branding/teams/mlb/san-diego-padres-seeklogo.png',
  'san francisco giants': '/branding/teams/mlb/sfGiants.png',
  'portland trail blazers': '/branding/teams/nba/trailblazers.png',
  'seattle kraken': '/branding/teams/nhl/kraken.png',
  'seattle mariners': '/branding/teams/mlb/mariners.png',
  'sacramento kings': '/branding/teams/nba/Sackings.png',
  'san antonio spurs': '/branding/teams/nba/spurs.png',
  'san jose sharks': '/branding/teams/nhl/sharks.png',
  'st. louis blues': '/branding/teams/nhl/blues.png',
  'st louis blues': '/branding/teams/nhl/blues.png',
  'st. louis cardinals': '/branding/teams/mlb/stlCards.png',
  'st louis cardinals': '/branding/teams/mlb/stlCards.png',
  'tampa bay rays': '/branding/teams/mlb/rays.png',
  'texas rangers': '/branding/teams/mlb/rangers.png',
  'toronto blue jays': '/branding/teams/mlb/blue jays.png',
  'toronto maple leafs': '/branding/teams/nhl/maple leafs.png',
  'toronto raptors': '/branding/teams/nba/raptors.png',
  'utah hockey club': '/branding/teams/nhl/mammoth.png',
  'utah mammoth': '/branding/teams/nhl/mammoth.png',
  'utah jazz': '/branding/teams/nba/utah-jazz-logo.png',
  'vancouver canucks': '/branding/teams/nhl/canucks.png',
  'vegas golden knights': '/branding/teams/nhl/golden knights.png',
  'washington wizards': '/branding/teams/nba/wizards.png',
  'washington nationals': '/branding/teams/mlb/nationals.png',
  'washington capitals': '/branding/teams/nhl/capitals.png',
  'winnipeg jets': '/branding/teams/nhl/winnipeg jets.png',
  // NHL — previously missing
  'colorado avalanche': '/branding/teams/nhl/avalanche.png',
  'new jersey devils': '/branding/teams/nhl/devils.png',
  'new york islanders': '/branding/teams/nhl/islanders.png',
  'tampa bay lightning': '/branding/teams/nhl/lightning.png',
  'florida panthers': '/branding/teams/nhl/panthers.png',
  // NFL
  'arizona cardinals': '/branding/teams/nfl/cardinals.png',
  'atlanta falcons': '/branding/teams/nfl/falcons.png',
  'baltimore ravens': '/branding/teams/nfl/ravens.png',
  'buffalo bills': '/branding/teams/nfl/bills.png',
  'carolina panthers': '/branding/teams/nfl/panthers.png',
  'chicago bears': '/branding/teams/nfl/bears.png',
  'cincinnati bengals': '/branding/teams/nfl/bengals.png',
  'cleveland browns': '/branding/teams/nfl/browns.png',
  'dallas cowboys': '/branding/teams/nfl/cowboys.png',
  'denver broncos': '/branding/teams/nfl/broncos.png',
  'detroit lions': '/branding/teams/nfl/lions.png',
  'green bay packers': '/branding/teams/nfl/packers.png',
  'houston texans': '/branding/teams/nfl/texans.png',
  'indianapolis colts': '/branding/teams/nfl/colts.png',
  'jacksonville jaguars': '/branding/teams/nfl/jaguars.png',
  'kansas city chiefs': '/branding/teams/nfl/chiefs.png',
  'las vegas raiders': '/branding/teams/nfl/raiders.png',
  'los angeles chargers': '/branding/teams/nfl/chargers.png',
  'los angeles rams': '/branding/teams/nfl/rams.png',
  'miami dolphins': '/branding/teams/nfl/dolphins.png',
  'minnesota vikings': '/branding/teams/nfl/vikings.png',
  'new england patriots': '/branding/teams/nfl/patriots.png',
  'new orleans saints': '/branding/teams/nfl/saints.png',
  'new york jets': '/branding/teams/nfl/jets.png',
  'philadelphia eagles': '/branding/teams/nfl/eagles.png',
  'pittsburgh steelers': '/branding/teams/nfl/steelers.png',
  'san francisco 49ers': '/branding/teams/nfl/49ers.png',
  'seattle seahawks': '/branding/teams/nfl/seahawks.png',
  'tampa bay buccaneers': '/branding/teams/nfl/buccanears.png',
  'tennessee titans': '/branding/teams/nfl/titans.png',
  'washington commanders': '/branding/teams/nfl/commanders.png',
  // NBA — previously missing
  'charlotte hornets': '/branding/teams/nba/hornets.png',
  'colorado rockies': '/branding/teams/mlb/rockies.png',
}

const WIDE_TEAM_LOGOS = new Set([])

function fmt(price) {
  if (price == null) return null
  return price > 0 ? `+${price}` : `${price}`
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
  if (isToday) return time
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + time
}

function getOdds(game, book, market, side) {
  return game.bookmakers?.[book]?.[market]?.[side] ?? null
}

function isBestOdds(price, allPrices) {
  if (price == null) return false
  const valid = allPrices.filter(value => value != null)
  if (!valid.length) return false
  const toDecimal = value => value > 0 ? value / 100 : 100 / Math.abs(value)
  const maxDec = Math.max(...valid.map(toDecimal))
  return Math.abs(toDecimal(price) - maxDec) < 0.001
}

function getTeamLogo(teamName) {
  return TEAM_LOGO_MAP[teamName?.toLowerCase()] || null
}

function getInitials(teamName) {
  if (!teamName) return '?'
  const words = teamName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase()
}

const INITIALS_COLORS = [
  '#1d4ed8', '#0f766e', '#7c3aed', '#b45309',
  '#be123c', '#0369a1', '#15803d', '#9f1239',
]

function getInitialsColor(teamName) {
  if (!teamName) return INITIALS_COLORS[0]
  let hash = 0
  for (const c of teamName) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length]
}

function TeamLogo({ teamName }) {
  const src = getTeamLogo(teamName)
  const key = teamName?.toLowerCase()
  const isWide = WIDE_TEAM_LOGOS.has(key)

  if (src) {
    return (
      <img
        className={`match-card__team-logo ${isWide ? 'match-card__team-logo--wide' : ''}`}
        src={src}
        alt={teamName}
        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling?.style && (e.currentTarget.nextSibling.style.display = 'flex') }}
      />
    )
  }

  return (
    <span
      className="match-card__team-initials"
      style={{ background: getInitialsColor(teamName) }}
    >
      {getInitials(teamName)}
    </span>
  )
}

function BookCell({ game, book, market, side, allPrices }) {
  const odds = getOdds(game, book, market, side)
  if (!odds) {
    return (
      <div className="match-grid__cell">
        <span className="match-grid__empty">—</span>
      </div>
    )
  }

  const best = isBestOdds(odds.price, allPrices)

  return (
    <div className={`match-grid__cell ${best ? 'match-grid__cell--best' : ''}`}>
      {odds.point != null && market !== 'h2h' && (
        <span className="match-grid__point">{odds.point > 0 ? `+${odds.point}` : odds.point}</span>
      )}
      <span className="match-grid__price">{fmt(odds.price)}</span>
    </div>
  )
}

export default function GameCard({ game, market, books }) {
  const navigate = useNavigate()
  const sides = market === 'h2h' || market === 'spreads' ? ['away', 'home'] : ['over', 'under']
  const labels = market === 'totals' ? ['Over', 'Under'] : [game.away_team, game.home_team]
  const dir = game.line_movement?.direction
  const isStarted = game.commence_time && new Date(game.commence_time) < new Date()

  const awayPrices = books.map(book => getOdds(game, book, market, sides[0])?.price ?? null)
  const homePrices = books.map(book => getOdds(game, book, market, sides[1])?.price ?? null)
  const matchupText = `${game.away_team} @ ${game.home_team}`
  const bookCount = books.filter(book =>
    getOdds(game, book, market, sides[0])?.price != null ||
    getOdds(game, book, market, sides[1])?.price != null
  ).length

  return (
    <article className={`match-card${isStarted ? ' match-card--started' : ''}`} onClick={() => navigate(`/game/${game.id}`)}>
      <div className="match-card__summary">
        <div className="match-card__teams">
          <div className="match-card__matchup">{matchupText}</div>
          <div className="match-card__meta">
            <span className="match-card__time">{formatTime(game.commence_time)}</span>
            {bookCount > 0 && (
              <span className="match-card__book-count">{bookCount} book{bookCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="match-card__signals">
          {isStarted && <span className="live-pill">LIVE</span>}
          {game.is_sharp && <SharpBadge />}
          {dir && dir !== 'none' && (
            <span className={`move-arrow move-arrow--${dir}`}>{dir === 'up' ? 'Market up' : 'Market down'}</span>
          )}
        </div>
      </div>

      <div className="match-grid">
        <div className="match-grid__row match-grid__row--header">
          <div className="match-grid__label match-grid__label--header">Team</div>
          {books.map(book => (
            <div key={book} className="match-grid__book">
              <SportsbookLogo book={book} compact />
            </div>
          ))}
        </div>

        <div className="match-grid__row">
          <div className="match-grid__label">
            <TeamLogo teamName={labels[0]} />
            <span>{labels[0]}</span>
          </div>
          {books.map(book => (
            <BookCell key={book} game={game} book={book} market={market} side={sides[0]} allPrices={awayPrices} />
          ))}
        </div>

        <div className="match-grid__row">
          <div className="match-grid__label">
            <TeamLogo teamName={labels[1]} />
            <span>{labels[1]}</span>
          </div>
          {books.map(book => (
            <BookCell key={book} game={game} book={book} market={market} side={sides[1]} allPrices={homePrices} />
          ))}
        </div>
      </div>
    </article>
  )
}
