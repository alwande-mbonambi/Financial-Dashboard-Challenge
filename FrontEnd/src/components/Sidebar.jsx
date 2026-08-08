import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, FileText, LogOut, Wallet } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/income', label: 'Income', icon: ArrowDownCircle },
  { to: '/expenses', label: 'Expenses', icon: ArrowUpCircle },
  { to: '/reports', label: 'Reports / Export', icon: FileText },
]

export default function Sidebar() {
  const { resetDashboardFilters } = useData()
  const { logout } = useAuth()

  const handleLogout = (e) => {
    e.preventDefault()
    if (resetDashboardFilters) {
      resetDashboardFilters()
    }
    logout()
  }

  return (
    <aside className="sidebar">
      <div className="brand"><Wallet size={20} /></div>
      <nav>
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon /> {link.label}
            </NavLink>
          )
        })}
      </nav>
      <a href="#logout" className="logout-link" onClick={handleLogout}>
        <LogOut /> Logout
      </a>
    </aside>
  )
}