import { useState, useRef } from 'react'
import { useSwipeable } from 'react-swipeable'
import { Dumbbell, UtensilsCrossed, User } from 'lucide-react'
import ExercisesPage from '../pages/ExercisesPage'
import DietPage from '../pages/DietPage'
import ProfilePage from '../pages/ProfilePage'

const TABS = [
  { key: 'exercises', label: 'Workouts', icon: Dumbbell },
  { key: 'diet', label: 'Nutrition', icon: UtensilsCrossed },
  { key: 'profile', label: 'Profile', icon: User },
]

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const containerRef = useRef(null)

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (Math.abs(e.deltaX) > 10) {
        setSwiping(true)
        const maxOffset = 100
        const clamped = Math.max(-maxOffset, Math.min(maxOffset, e.deltaX))
        setSwipeOffset(clamped)
      }
    },
    onSwipedLeft: () => {
      setSwiping(false)
      setSwipeOffset(0)
      if (activeTab < TABS.length - 1) setActiveTab(activeTab + 1)
    },
    onSwipedRight: () => {
      setSwiping(false)
      setSwipeOffset(0)
      if (activeTab > 0) setActiveTab(activeTab - 1)
    },
    onSwiped: () => {
      setSwiping(false)
      setSwipeOffset(0)
    },
    trackMouse: false,
    trackTouch: true,
    delta: 30,
    preventScrollOnSwipe: false,
  })

  const pages = [<ExercisesPage key="ex" />, <DietPage key="diet" />, <ProfilePage key="prof" />]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 20px',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>
          Tue<span style={{ color: 'var(--green-primary)' }}>Bi</span>Fit
        </h1>
      </div>

      {/* Swipeable content area */}
      <div
        {...handlers}
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{
          display: 'flex',
          width: `${TABS.length * 100}%`,
          height: '100%',
          transform: `translateX(calc(-${activeTab * (100 / TABS.length)}% + ${swiping ? swipeOffset * 0.3 : 0}px))`,
          transition: swiping ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {pages.map((page, i) => (
            <div key={i} style={{
              width: `${100 / TABS.length}%`,
              height: '100%',
              overflow: 'auto',
              flexShrink: 0,
            }}>
              {page}
            </div>
          ))}
        </div>
        {/* Portal target for detail overlays — sits inside the content area but outside the transform */}
        <div id="detail-portal" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      </div>

      {/* Page dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6,
        padding: '8px 0 4px',
        background: 'var(--bg-secondary)',
      }}>
        {TABS.map((_, i) => (
          <div key={i} style={{
            width: activeTab === i ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background: activeTab === i ? 'var(--green-primary)' : 'var(--border-color)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Bottom navigation */}
      <nav style={{
        display: 'flex',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}>
        {TABS.map((tab, i) => {
          const isActive = activeTab === i
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(i)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
                padding: '10px 0 6px',
                background: 'none', border: 'none',
                color: isActive ? 'var(--green-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                position: 'relative',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: -1, left: '30%', right: '30%',
                  height: 2, borderRadius: 1,
                  background: 'var(--green-primary)',
                }} />
              )}
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
