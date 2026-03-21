import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { Dumbbell, ChevronDown, ChevronUp, Info } from 'lucide-react'

export default function ExercisesPage() {
  const { planData } = useUser()
  const [expandedDay, setExpandedDay] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState(null)

  if (!planData?.workout_plan?.days?.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--text-secondary)', padding: 24, textAlign: 'center' }}>
        <div>
          <Dumbbell size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>No workout plan available yet.</p>
        </div>
      </div>
    )
  }

  const { days, notes } = planData.workout_plan
  const toggleDay = (i) => setExpandedDay(expandedDay === i ? -1 : i)

  return (
    <div className="page-scroll" style={{ padding: '16px 16px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Dumbbell size={22} color="var(--green-primary)" />
          Workout Plan
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          {days.length}-day program · Tap a day to view exercises
        </p>
      </div>

      {/* Day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {days.map((day, i) => (
          <div key={day.day} className="card fade-in" style={{ animationDelay: `${i * 50}ms`, padding: 0, overflow: 'hidden' }}>
            {/* Day header (row) */}
            <button
              onClick={() => toggleDay(i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: 'none', border: 'none', color: 'var(--text-primary)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: expandedDay === i ? 'var(--green-glow-strong)' : 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                  color: expandedDay === i ? 'var(--green-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}>
                  D{day.day}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{day.focus}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {expandedDay === i ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
            </button>

            {/* Exercise columns (expanded) */}
            {expandedDay === i && (
              <div style={{
                borderTop: '1px solid var(--border-color)',
                overflow: 'auto', WebkitOverflowScrolling: 'touch',
              }}>
                <div style={{
                  display: 'flex', gap: 0, minWidth: 'fit-content',
                }}>
                  {day.exercises.map((ex, j) => (
                    <div key={ex.id || j} style={{
                      minWidth: 160, maxWidth: 200, flex: '0 0 auto',
                      padding: '12px 14px',
                      borderRight: j < day.exercises.length - 1 ? '1px solid var(--border-color)' : 'none',
                      background: selectedExercise?.id === ex.id ? 'var(--green-glow)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                      onClick={() => setSelectedExercise(selectedExercise?.id === ex.id ? null : ex)}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>
                        {ex.name}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Sets</span>
                          <span style={{ fontWeight: 600 }}>{ex.sets}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Reps</span>
                          <span style={{ fontWeight: 600 }}>{ex.reps}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Rest</span>
                          <span style={{ fontWeight: 600 }}>{ex.rest}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span className="chip chip-green">{ex.difficulty}</span>
                        {ex.equipment && <span className="chip chip-blue">{ex.equipment}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Exercise detail modal */}
      {selectedExercise && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)',
          borderRadius: '16px 16px 0 0', padding: '20px 24px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          maxHeight: '45vh', overflow: 'auto',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)', zIndex: 50,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{selectedExercise.name}</h3>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span className="chip chip-green">{selectedExercise.difficulty}</span>
                <span className="chip chip-blue">{selectedExercise.category}</span>
              </div>
            </div>
            <button onClick={() => setSelectedExercise(null)}
              style={{ background: 'var(--bg-card)', border: 'none', color: 'var(--text-secondary)',
                width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18 }}>
              ✕
            </button>
          </div>
          {selectedExercise.instructions && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
              <Info size={14} color="var(--green-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedExercise.instructions}
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {selectedExercise.primary_muscles?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Primary</div>
                <div style={{ fontSize: 13 }}>{selectedExercise.primary_muscles.join(', ')}</div>
              </div>
            )}
            {selectedExercise.secondary_muscles?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Secondary</div>
                <div style={{ fontSize: 13 }}>{selectedExercise.secondary_muscles.join(', ')}</div>
              </div>
            )}
            {selectedExercise.equipment && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Equipment</div>
                <div style={{ fontSize: 13 }}>{selectedExercise.equipment}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {notes?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--green-primary)' }}>Notes</div>
          {notes.map((note, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4 }}>
              • {note}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
