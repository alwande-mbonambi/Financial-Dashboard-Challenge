import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
      background: 'var(--paper)',
    }}
    >
      <form onSubmit={handleSubmit} className="panel" style={{ width: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
          >
            <Wallet size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Welcome back</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>Log in to your dashboard</p>
          </div>
        </div>

        <div className="divider" />

        {error && (
          <div style={{
            marginBottom: 14,
            padding: '8px 12px',
            borderRadius: 6,
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="field" style={{ marginBottom: 20 }}>
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', justifyContent: 'center' }} 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  )
}