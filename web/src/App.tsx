import { NavLink, Route, Routes } from 'react-router-dom'
import { BatchDetailPage } from './pages/BatchDetailPage.tsx'
import { BatchesPage } from './pages/BatchesPage.tsx'
import { BeneficiariesPage } from './pages/BeneficiariesPage.tsx'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <strong>Dispersión de pagos</strong>
        <nav>
          <NavLink to="/" end>
            Beneficiarios
          </NavLink>
          <NavLink to="/lotes">Lotes</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<BeneficiariesPage />} />
          <Route path="/lotes" element={<BatchesPage />} />
          <Route path="/lotes/:id" element={<BatchDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}
