import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { UtensilsCrossed, ChevronDown, ChevronUp, Flame, Beef, Wheat, Droplets } from 'lucide-react'

export default function DietPage() {
  const { planData } = useUser()
  const [expandedDay, setExpandedDay] = useState(0)
  const [selectedMeal, setSelectedMeal] = useState(null)

  if (!planData?.nutrition_plan?.meals?.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--text-secondary)', padding: 24, textAlign: 'center' }}>
        <div>
          <UtensilsCrossed size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>No nutrition plan available yet.</p>
        </div>
      </div>
    )
  }

  const { daily_targets, meals, notes } = planData.nutrition_plan
  const toggleDay = (i) => setExpandedDay(expandedDay === i ? -1 : i)

  return (
    <div className="page-scroll" style={{ padding: '16px 16px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <UtensilsCrossed size={22} color="var(--green-primary)" />
          Nutrition Plan
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          {meals.length}-day meal plan · Tap a day to view meals
        </p>
      </div>

      {/* Daily targets */}
      {daily_targets && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-around' }}>
          {[
            { label: 'Calories', value: daily_targets.calories, unit: 'kcal', icon: Flame, color: '#ff7043' },
            { label: 'Protein', value: daily_targets.protein_g, unit: 'g', icon: Beef, color: '#ef5350' },
            { label: 'Carbs', value: daily_targets.carbs_g, unit: 'g', icon: Wheat, color: '#ffa726' },
            { label: 'Fat', value: daily_targets.fat_g, unit: 'g', icon: Droplets, color: '#42a5f5' },
          ].map((t) => (
            <div key={t.label} style={{ textAlign: 'center' }}>
              <t.icon size={16} color={t.color} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 16, fontWeight: 700 }}>{t.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {t.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {meals.map((dayMeal, i) => (
          <div key={dayMeal.day} className="card fade-in" style={{ animationDelay: `${i * 50}ms`, padding: 0, overflow: 'hidden' }}>
            {/* Day header */}
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
                  D{dayMeal.day}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{dayMeal.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {dayMeal.items.length} meal{dayMeal.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {expandedDay === i ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
            </button>

            {/* Meal columns */}
            {expandedDay === i && (
              <div style={{
                borderTop: '1px solid var(--border-color)',
                overflow: 'auto', WebkitOverflowScrolling: 'touch',
              }}>
                <div style={{ display: 'flex', gap: 0, minWidth: 'fit-content' }}>
                  {dayMeal.items.map((meal, j) => (
                    <div key={j} style={{
                      minWidth: 175, maxWidth: 220, flex: '0 0 auto',
                      padding: '12px 14px',
                      borderRight: j < dayMeal.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                      background: selectedMeal === `${i}-${j}` ? 'var(--green-glow)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                      onClick={() => setSelectedMeal(selectedMeal === `${i}-${j}` ? null : `${i}-${j}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
                          {meal.name}
                        </div>
                      </div>
                      <span className="chip chip-green" style={{ marginBottom: 8 }}>{meal.type}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Calories</span>
                          <span style={{ fontWeight: 600 }}>{meal.total_calories}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Protein</span>
                          <span style={{ fontWeight: 600 }}>{meal.total_protein_g}g</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                        {meal.foods.map((food, k) => (
                          <div key={k} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{food.name}</span>
                            <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{food.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
