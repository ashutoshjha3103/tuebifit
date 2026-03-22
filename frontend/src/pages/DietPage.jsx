import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useUser } from '../context/UserContext'
import {
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Sparkles,
} from 'lucide-react'

/** Map food names to a sample “featured partner” (same slot brands could buy in a real app). */
function getPartnerPlacement(foodName) {
  const raw = (foodName || '').trim()
  if (!raw) return null
  const rules = [
    {
      test: /protein\s*bar|high[\s-]*protein\s*bar|nutrition\s*bar|energy\s*bar|granola\s*bar/i,
      brand: 'MaxProtein',
      category: 'Protein & snack bars',
      detail: 'Limited-time deals on multipacks — see flavors that match your macro goals.',
    },
    {
      test: /smoothie|protein\s*shake|meal\s*replace|shake(?!\s*weight)/i,
      brand: 'BlendWell Co.',
      category: 'Ready-to-blend & shakes',
      detail: 'Smoothie kits and RTD shakes with free delivery on your first order.',
    },
    {
      test: /sports\s*drink|electrolyte|isotonic|energy\s*drink/i,
      brand: 'HydraFlow',
      category: 'Hydration & performance drinks',
      detail: 'Electrolyte packs tuned for training days — redeem in app.',
    },
    {
      test: /pre[\s-]*workout|bcaa|creatine\s*(powder|gummies)?$/i,
      brand: 'LiftLabs Nutrition',
      category: 'Sports supplements',
      detail: 'Third-party tested formulas — subscriber perks inside TueBiFit.',
    },
    {
      test: /greek\s*yogurt|protein\s*yogurt|skyr/i,
      brand: 'PureStrain Dairy',
      category: 'High-protein dairy',
      detail: 'High-protein cups and tubs — coupons when you plan them in meals.',
    },
  ]
  for (const r of rules) {
    if (r.test.test(raw)) {
      return { brand: r.brand, category: r.category, detail: r.detail }
    }
  }
  return null
}

function normalizeMeals(nutritionPlan) {
  const meals = nutritionPlan?.meals || []
  if (!meals.length) return []

  if (meals[0]?.day !== undefined && meals[0]?.items) {
    return meals
  }

  const grouped = [{ day: 1, name: 'Daily Meals', items: meals }]
  return grouped
}

export default function DietPage() {
  const { planData } = useUser()
  const [expandedDay, setExpandedDay] = useState(0)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [foodModal, setFoodModal] = useState(null)

  const closeFoodModal = useCallback(() => setFoodModal(null), [])

  const normalizedMeals = useMemo(
    () => normalizeMeals(planData?.nutrition_plan),
    [planData?.nutrition_plan]
  )

  if (!normalizedMeals.length) {
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

  const computedTotals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0, dayCount = 0
    for (const day of normalizedMeals) {
      dayCount++
      for (const meal of day.items) {
        for (const food of (meal.foods || [])) {
          calories += Number(food.calories) || 0
          protein += Number(food.protein_g) || 0
          carbs += Number(food.carbs_g) || 0
          fat += Number(food.fat_g) || 0
        }
      }
    }
    const avg = (v) => dayCount > 0 ? Math.round(v / dayCount) : 0
    return {
      calories: avg(calories),
      protein_g: avg(protein),
      carbs_g: avg(carbs),
      fat_g: avg(fat),
    }
  }, [normalizedMeals])

  const notes = planData?.nutrition_plan?.notes
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
          {normalizedMeals.length > 1
            ? `${normalizedMeals.length}-day meal plan`
            : `${normalizedMeals[0]?.items?.length || 0} meals`
          }
          {' · '}
          Tap a <strong style={{ color: 'var(--green-primary)' }}>food</strong> for nutrition details &amp; featured partners
        </p>
      </div>

      {/* Daily averages (computed from actual meal data) */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-around' }}>
        {[
          { label: 'Calories', value: computedTotals.calories, icon: Flame, color: '#ff7043' },
          { label: 'Protein', value: `${computedTotals.protein_g}g`, icon: Beef, color: '#ef5350' },
          { label: 'Carbs', value: `${computedTotals.carbs_g}g`, icon: Wheat, color: '#ffa726' },
          { label: 'Fat', value: `${computedTotals.fat_g}g`, icon: Droplets, color: '#42a5f5' },
        ].map((t) => (
          <div key={t.label} style={{ textAlign: 'center' }}>
            <t.icon size={16} color={t.color} style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 16, fontWeight: 700 }}>{t.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {t.label}/day
            </div>
          </div>
        ))}
      </div>

      {/* Day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {normalizedMeals.map((dayMeal, i) => (
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
                      <div style={{ marginBottom: 8 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600, lineHeight: 1.3,
                          wordWrap: 'break-word', overflowWrap: 'break-word',
                        }}>
                          {meal.name}
                        </div>
                      </div>
                      {meal.type && <span className="chip chip-green" style={{ marginBottom: 8 }}>{meal.type}</span>}
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
                          <button
                            key={k}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFoodModal(food)
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              fontSize: 11,
                              color: 'var(--text-secondary)',
                              marginBottom: 6,
                              lineHeight: 1.4,
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 8,
                              padding: '8px 10px',
                              cursor: 'pointer',
                              transition: 'border-color 0.15s, background 0.15s',
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div style={{
                              display: 'flex', justifyContent: 'space-between', gap: 6,
                              alignItems: 'flex-start',
                            }}>
                              <span style={{
                                flex: 1, minWidth: 0,
                                wordWrap: 'break-word', overflowWrap: 'break-word',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                              }}>
                                {food.name}
                              </span>
                              <span style={{
                                color: 'var(--text-muted)', flexShrink: 0,
                                whiteSpace: 'nowrap', fontSize: 10,
                              }}>
                                {food.amount}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                              {food.calories} cal · {food.protein_g}g P · {food.carbs_g}g C · {food.fat_g}g F
                            </div>
                            {getPartnerPlacement(food.name) && (
                              <div style={{
                                fontSize: 9,
                                color: 'var(--green-primary)',
                                marginTop: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}>
                                <Sparkles size={10} />
                                May include partner offer
                              </div>
                            )}
                          </button>
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
            <div key={i} style={{
              fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4,
              wordWrap: 'break-word', overflowWrap: 'break-word',
            }}>
              • {note}
            </div>
          ))}
        </div>
      )}

      {/* Full-page food detail — portalled like Workouts exercise view (escapes swipe transform) */}
      {foodModal && typeof document !== 'undefined' && document.getElementById('detail-portal') &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-detail-title"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'var(--bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'auto',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={closeFoodModal}
                aria-label="Back to nutrition plan"
                style={{
                  background: 'var(--bg-card)',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ChevronDown size={18} />
              </button>
              <h3
                id="food-detail-title"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {foodModal.name}
              </h3>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '20px 20px 40px',
              maxWidth: 600,
              width: '100%',
              margin: '0 auto',
            }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Serving{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{foodModal.amount || '—'}</strong>
              </p>

              <div className="card" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 0,
                padding: 0,
                marginBottom: 20,
                overflow: 'hidden',
              }}>
                {[
                  ['Calories', `${foodModal.calories ?? '—'}`, 'kcal'],
                  ['Protein', `${foodModal.protein_g ?? '—'}`, 'g'],
                  ['Carbs', `${foodModal.carbs_g ?? '—'}`, 'g'],
                  ['Fat', `${foodModal.fat_g ?? '—'}`, 'g'],
                ].map(([lab, val, unit], idx) => (
                  <div
                    key={lab}
                    style={{
                      textAlign: 'center',
                      padding: '16px 10px',
                      borderRight: idx % 2 === 0 ? '1px solid var(--border-color)' : 'none',
                      borderBottom: idx < 2 ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-primary)' }}>
                      {val}
                      <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 2 }}>{unit}</span>
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginTop: 6,
                      letterSpacing: 0.5,
                    }}>{lab}</div>
                  </div>
                ))}
              </div>

              {(() => {
                const partner = getPartnerPlacement(foodModal.name)
                if (!partner) {
                  return (
                    <div className="card" style={{ padding: 14 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                        We don’t have a partner offer for this item yet, but we’re always on the lookout for brands
                        that fit how you eat — so we can bring you the best recommendations.
                      </p>
                    </div>
                  )
                }
                return (
                  <div style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--green-primary)',
                    background: 'linear-gradient(135deg, var(--green-glow) 0%, var(--bg-card) 100%)',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      background: 'var(--green-glow-strong)',
                      borderBottom: '1px solid var(--border-color)',
                    }}>
                      <Sparkles size={18} color="var(--green-primary)" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-primary)', letterSpacing: 0.3 }}>
                        Featured partner
                      </span>
                    </div>
                    <div style={{ padding: 16 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {partner.category}
                      </p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                        {partner.brand}
                      </p>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 16 }}>
                        {partner.detail}
                      </p>
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: 10,
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, var(--green-primary), var(--green-dark))',
                          color: '#0a1929',
                        }}
                        onClick={(e) => e.preventDefault()}
                      >
                        See offer
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>,
          document.getElementById('detail-portal')
        )}
    </div>
  )
}
