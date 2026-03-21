import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Activity, Play, ChevronLeft } from 'lucide-react'

const EXERCISES = [
  {
    id: 'squat',
    name: 'Squats',
    description: 'Lower body compound movement',
    video: '/videos/annotated_Squat_-_exercise_demonstration_video.mp4',
    icon: '🏋️',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    states: { rest: 'Standing', active: 'Squatting' },
  },
  {
    id: 'deadlift',
    name: 'Deadlifts',
    description: 'Full body pulling movement',
    video: '/videos/annotated_Deadlift_-_exercise_demonstration_video.mp4',
    icon: '💪',
    muscles: ['Back', 'Glutes', 'Hamstrings'],
    states: { rest: 'Standing', active: 'Lifted' },
  },
  {
    id: 'pullup',
    name: 'Pull-ups',
    description: 'Upper body pulling movement',
    video: '/videos/annotated_Pull-ups_-_exercise_demonstration_video.mp4',
    icon: '🤸',
    muscles: ['Lats', 'Biceps', 'Core'],
    states: { rest: 'Hanging', active: 'Pulling' },
  },
]

export default function RepCountPage() {
  const [selectedExercise, setSelectedExercise] = useState(null)

  return (
    <div className="page-scroll" style={{ padding: '16px 16px 100px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={22} color="var(--green-primary)" />
          Rep Counter
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          AI-powered rep tracking &middot; Select an exercise to watch
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {EXERCISES.map((ex, i) => (
          <div
            key={ex.id}
            className="card fade-in"
            style={{
              animationDelay: `${i * 80}ms`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setSelectedExercise(ex)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--green-primary)'
              e.currentTarget.style.background = 'var(--bg-card-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = ''
              e.currentTarget.style.background = ''
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'var(--green-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, flexShrink: 0,
              }}>
                {ex.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ex.description}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {ex.muscles.map(m => (
                    <span key={m} className="chip chip-green">{m}</span>
                  ))}
                </div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--green-glow-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Play size={16} color="var(--green-primary)" style={{ marginLeft: 2 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20, borderColor: 'var(--green-dark)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Activity size={16} color="var(--green-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-primary)', marginBottom: 4 }}>
              How it works
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Your camera feed is securely processed on-device to detect exercise form,
              count reps automatically, and help you keep track of your sets. No data
              leaves your phone.
            </p>
          </div>
        </div>
      </div>

      {selectedExercise && createPortal(
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'var(--bg-primary)',
          display: 'flex', flexDirection: 'column',
          pointerEvents: 'auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            flexShrink: 0,
          }}>
            <button onClick={() => setSelectedExercise(null)}
              style={{
                background: 'var(--bg-card)', border: 'none', color: 'var(--text-secondary)',
                width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
              <ChevronLeft size={18} />
            </button>
            <h3 style={{
              fontSize: 16, fontWeight: 700, margin: 0,
              flex: 1, minWidth: 0,
            }}>
              {selectedExercise.name}
            </h3>
            <span className="chip chip-green">AI Tracking</span>
          </div>

          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            padding: 16, overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>
            <div style={{
              width: '100%',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              background: '#000',
              position: 'relative',
            }}>
              <video
                key={selectedExercise.id}
                controls
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  display: 'block',
                  maxHeight: '55vh',
                }}
              >
                <source src={selectedExercise.video} type="video/mp4" />
              </video>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
              {selectedExercise.muscles.map(m => (
                <span key={m} className="chip chip-green">{m}</span>
              ))}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                What the overlay shows
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { dot: 'var(--green-primary)', text: 'Pose skeleton tracked on your body' },
                  { dot: '#42a5f5', text: 'Real-time rep count and target progress' },
                  { dot: 'var(--warning)', text: 'Form feedback and encouragement' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: item.dot, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.getElementById('detail-portal')
      )}
    </div>
  )
}
