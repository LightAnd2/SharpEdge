import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import OddsBoard from './pages/OddsBoard'
import GameDetail from './pages/GameDetail'

export default function App() {
  return (
    <div className="app">
      <div className="app-backdrop" aria-hidden="true" />
      <Navbar />
      <main className="main-content">
        <div className="page-shell">
          <Routes>
            <Route path="/" element={<OddsBoard />} />
            <Route path="/game/:id" element={<GameDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
