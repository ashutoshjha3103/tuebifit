import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { Dumbbell } from 'lucide-react'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useUser()

  const handleLogin = (provider) => {
    login(provider)
    navigate('/onboarding')
  }

  return (
    <div className="page" style={{ justifyContent: 'center', padding: '40px 24px' }}>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48 }}>
        {/* Logo & Branding */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, var(--green-primary), var(--green-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px var(--green-glow-strong)',
          }}>
            <Dumbbell size={40} color="#0a1929" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
            Tue<span style={{ color: 'var(--green-primary)' }}>Bi</span>Fit
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>
            Your AI-powered fitness & nutrition companion
          </p>
        </div>

        {/* Feature highlights */}
        <div style={{ display: 'flex', gap: 16, width: '100%' }}>
          {[
            { label: 'Workouts', icon: '💪' },
            { label: 'Nutrition', icon: '🥗' },
            { label: 'Tracking', icon: '📊' },
          ].map((f) => (
            <div key={f.label} style={{
              flex: 1, textAlign: 'center', padding: '16px 8px',
              background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{f.label}</div>
            </div>
          ))}
        </div>

        {/* Auth buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-social" onClick={() => handleLogin('google')}>
            <GoogleIcon />
            Continue with Google
          </button>
          <button className="btn btn-social" onClick={() => handleLogin('apple')}>
            <AppleIcon />
            Continue with Apple
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          By continuing, you agree to our Terms of Service
          <br />and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
