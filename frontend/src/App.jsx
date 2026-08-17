import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Cpu,
  FlaskConical,
  Gauge,
  GitBranch,
  Home as HomeIcon,
  Menu,
  Network,
  ScanLine,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import Home from "./pages/Home";
import Workbench from "./pages/Workbench";
import Architecture from "./pages/Architecture";
import Validation from "./pages/Validation";
import Benchmark from "./pages/Benchmark";

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Overview',
    icon: HomeIcon,
    end: true,
  },
  {
    to: '/workbench',
    label: 'Workbench',
    icon: ScanLine,
  },
  {
    to: '/architecture',
    label: 'Architecture',
    icon: Network,
  },
  {
    to: '/validation',
    label: 'Validation',
    icon: BarChart3,
  },
  {
    to: '/benchmark',
    label: 'Benchmark',
    icon: Gauge,
  },
]

function AppBackground() {
  return (
    <>
      <div className="app-grid" />
      <div className="app-noise" />
      <div className="app-glow app-glow-one" />
      <div className="app-glow app-glow-two" />
      <div className="scan-line" />
    </>
  )
}

function Navbar({ mobileOpen, setMobileOpen }) {
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  return (
    <header className="site-header">
      <div className="nav-shell">
        <NavLink to="/" className="brand" end>
          <div className="brand-mark">
            <div className="brand-core">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              DARC<span>//</span>NET
            </div>
            <div className="brand-sub">
              SEMICON INSPECTION SYSTEM
            </div>
          </div>
        </NavLink>

        <nav className={`desktop-nav ${mobileOpen ? 'mobile-open' : ''}`}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={14} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-status">
          <span className="status-dot" />
          <span>MODEL ONLINE</span>
          <span className="status-divider" />
          <span className="status-model">DARC-NET</span>
        </div>

        <button
          className="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}

function SystemStrip() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="system-strip">
      <div className="system-strip-inner">
        <div className="strip-item">
          <Activity size={12} />
          <span>RESTORATION ENGINE</span>
          <strong>READY</strong>
        </div>

        <div className="strip-item">
          <Cpu size={12} />
          <span>PIPELINE</span>
          <strong>GPU ACCELERATED</strong>
        </div>

        <div className="strip-item">
          <Zap size={12} />
          <span>MODE</span>
          <strong>SINGLE PASS</strong>
        </div>

        <div className="strip-item strip-time">
          <span>LOCAL SYSTEM</span>
          <strong>{time.toLocaleTimeString()}</strong>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">DARC//NET</div>
          <div className="footer-copy">
            Degradation-Aware Restoration for Semiconductor Inspection
          </div>
        </div>

        <div className="footer-meta">
          <span>SEMICON INDIA 2026</span>
          <span>•</span>
          <span>KLA AI RESTORATION</span>
          <span>•</span>
          <span>v1.0</span>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app">
      <AppBackground />

      <Navbar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <SystemStrip />

      <div className="page-layer">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workbench" element={<Workbench />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/validation" element={<Validation />} />
          <Route path="/benchmark" element={<Benchmark />} />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>

      <Footer />
    </div>
  )
}