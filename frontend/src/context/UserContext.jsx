import { createContext, useContext, useState, useCallback } from 'react'

const UserContext = createContext(null)

const STORAGE_KEY = 'tuebifit_user'
const PLAN_KEY = 'tuebifit_plan'

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const defaultProfile = {
  name: '',
  weight: '',
  age: '',
  height: '',
  fitnessLevel: '',
  dietaryPreferences: '',
  allergies: '',
  activityLevel: '',
  preferredDurationHrs: '1',
  preferredDurationMins: '0',
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => loadFromStorage(STORAGE_KEY, null))
  const [planData, setPlanData] = useState(() => loadFromStorage(PLAN_KEY, null))
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!loadFromStorage(STORAGE_KEY, null))

  const login = useCallback((provider) => {
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setUser(null)
    setPlanData(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PLAN_KEY)
  }, [])

  const saveProfile = useCallback((profile) => {
    setUser(profile)
    saveToStorage(STORAGE_KEY, profile)
  }, [])

  const savePlan = useCallback((plan) => {
    setPlanData(plan)
    saveToStorage(PLAN_KEY, plan)
  }, [])

  const hasCompletedOnboarding = !!user?.name

  return (
    <UserContext.Provider value={{
      user,
      planData,
      isAuthenticated,
      hasCompletedOnboarding,
      login,
      logout,
      saveProfile,
      savePlan,
      defaultProfile,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
