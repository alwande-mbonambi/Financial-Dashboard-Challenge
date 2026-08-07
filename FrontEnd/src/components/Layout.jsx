import Sidebar from './Sidebar.jsx'
import ToastContainer from './Toast.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { Moon, Sun } from 'lucide-react'

export default function Layout({ children, title, actions }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h1 className="page-title">{title}</h1>
          <div className="topbar-actions">
            {actions}
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </div>
        {children}
      </main>
      <ToastContainer />
    </div>
  )
}