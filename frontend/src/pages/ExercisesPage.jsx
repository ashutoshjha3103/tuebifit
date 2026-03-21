import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useUser } from '../context/UserContext'
import { Dumbbell, ChevronDown, ChevronUp, Info, Image, X } from 'lucide-react'

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
                      <div style={{
                        fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.3,
                        wordWrap: 'break-word', overflowWrap: 'break-word',
                      }}>
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
                          <span style={{ fontWeight: 600 }}>{typeof ex.rest === 'number' ? `${ex.rest}s` : ex.rest}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {ex.difficulty && <span className="chip chip-green">{ex.difficulty}</span>}
                        {ex.equipment && <span className="chip chip-blue">{ex.equipment}</span>}
                      </div>
                      {ex.image_urls?.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green-primary)' }}>
                          <Image size={11} /> {ex.image_urls.length} image{ex.image_urls.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Full-page exercise detail — portalled to content area to escape the transform context */}
      {selectedExercise && createPortal(
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'var(--bg-primary)',
          display: 'flex', flexDirection: 'column',
          pointerEvents: 'auto',
        }}>
          {/* Sticky top bar */}
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
              <ChevronDown size={18} />
            </button>
            <h3 style={{
              fontSize: 16, fontWeight: 700, margin: 0,
              flex: 1, minWidth: 0, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {selectedExercise.name}
            </h3>
          </div>

          {/* Scrollable content */}
          <div style={{
            flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            padding: '20px 20px 40px',
            maxWidth: 600, width: '100%', margin: '0 auto',
          }}>
            {/* Tags */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {selectedExercise.difficulty && <span className="chip chip-green">{selectedExercise.difficulty}</span>}
              {selectedExercise.category && <span className="chip chip-blue">{selectedExercise.category}</span>}
              {selectedExercise.equipment && <span className="chip chip-blue">{selectedExercise.equipment}</span>}
            </div>

            {/* Exercise images */}
            {selectedExercise.image_urls?.length > 0 && (
              <div style={{
                display: 'flex', gap: 12, marginBottom: 24,
                overflow: 'auto', WebkitOverflowScrolling: 'touch',
                paddingBottom: 4,
              }}>
                {selectedExercise.image_urls.map((url, idx) => (
                  <div key={idx} style={{
                    flexShrink: 0, width: 180, height: 180,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                  }}>
                    <img
                      src={url}
                      alt={`${selectedExercise.name} step ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML =
                          '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:11px;text-align:center;padding:8px">Image unavailable</div>'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Sets / Reps / Rest */}
            <div className="card" style={{
              display: 'flex', gap: 0, padding: 0, marginBottom: 20, overflow: 'hidden',
            }}>
              {[
                { label: 'Sets', value: selectedExercise.sets },
                { label: 'Reps', value: selectedExercise.reps },
                { label: 'Rest', value: typeof selectedExercise.rest === 'number' ? `${selectedExercise.rest}s` : selectedExercise.rest },
              ].map((item, idx) => (
                <div key={item.label} style={{
                  textAlign: 'center', flex: 1, padding: '16px 8px',
                  borderRight: idx < 2 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-primary)' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            {selectedExercise.instructions && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
                  textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5,
                }}>Instructions</div>
                <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Info size={14} color="var(--green-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7,
                    margin: 0, wordWrap: 'break-word', overflowWrap: 'break-word',
                  }}>
                    {selectedExercise.instructions}
                  </p>
                </div>
              </div>
            )}

            {/* Muscles */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {selectedExercise.primary_muscles?.length > 0 && (
                <div className="card" style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                    Primary Muscles
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedExercise.primary_muscles.map((m) => (
                      <span key={m} className="chip chip-green">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedExercise.secondary_muscles?.length > 0 && (
                <div className="card" style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                    Secondary Muscles
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedExercise.secondary_muscles.map((m) => (
                      <span key={m} className="chip chip-blue">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.getElementById('detail-portal')
      )}

      {/* Notes */}
      {notes?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--green-primary)' }}>Notes</div>
          {notes.map((note, i) => (
            <div key={i} style={{
              fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4,
              wordWrap: 'break-word', overflowWrap: 'break-word',
            }}>
              • {note}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
