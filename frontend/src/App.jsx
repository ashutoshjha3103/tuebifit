import { Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import MainLayout from './components/MainLayout'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUser()
  if (!isAuthenticated) return <Navigate to="/" replace />
  return children
}

function OnboardingGuard({ children }) {
  const { isAuthenticated, hasCompletedOnboarding } = useUser()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (hasCompletedOnboarding) return <Navigate to="/app" replace />
  return children
}

function AppGuard({ children }) {
  const { isAuthenticated, hasCompletedOnboarding } = useUser()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />
  return children
}

function LoginGuard({ children }) {
  const { isAuthenticated, hasCompletedOnboarding } = useUser()
  if (isAuthenticated && hasCompletedOnboarding) return <Navigate to="/app" replace />
  if (isAuthenticated && !hasCompletedOnboarding) return <Navigate to="/onboarding" replace />
  return children
}

function AppRoutes() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<LoginGuard><LoginPage /></LoginGuard>} />
        <Route path="/onboarding" element={<OnboardingGuard><OnboardingPage /></OnboardingGuard>} />
        <Route path="/app" element={<AppGuard><MainLayout /></AppGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  )
}
