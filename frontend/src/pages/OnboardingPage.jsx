import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import samplePlan from '../data/samplePlan'

const STEPS = [
  { key: 'name', title: "What's your name?", subtitle: 'We\'ll personalize your experience' },
  { key: 'body', title: 'Your body stats', subtitle: 'This helps us calculate your needs' },
  { key: 'fitnessLevel', title: 'Fitness level', subtitle: 'Where are you on your journey?' },
  { key: 'dietaryPreferences', title: 'Dietary preferences', subtitle: 'We\'ll tailor your meal plans' },
  { key: 'allergies', title: 'Any food allergies?', subtitle: 'We\'ll keep these out of your plans' },
  { key: 'activityLevel', title: 'Current activity', subtitle: 'How active is your daily life?' },
  { key: 'duration', title: 'Workout duration', subtitle: 'How long can you train per session?' },
]

const FITNESS_OPTIONS = [
  { value: 'beginner', label: 'Beginner', desc: 'New to working out', icon: '🌱' },
  { value: 'amateur', label: 'Amateur', desc: '6-12 months experience', icon: '🔥' },
  { value: 'professional', label: 'Professional', desc: 'Years of consistent training', icon: '🏆' },
]

const DIET_OPTIONS = [
  { value: 'vegan', label: 'Vegan', desc: 'No animal products', icon: '🌿' },
  { value: 'vegetarian', label: 'Vegetarian', desc: 'No meat or fish', icon: '🥗' },
  { value: 'no restrictions', label: 'No Restrictions', desc: 'I eat everything', icon: '🍽️' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'I sit all day', desc: 'Desk job, minimal movement', icon: '🪑' },
  { value: 'lightly active', label: 'Leisurely walks', desc: 'Light walks, casual movement', icon: '🚶' },
  { value: 'very active', label: 'Intense workouts', desc: 'Regular intense physical activity', icon: '🏋️' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { saveProfile, savePlan, defaultProfile } = useUser()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ ...defaultProfile })

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const canProceed = () => {
    switch (STEPS[step].key) {
      case 'name': return form.name.trim().length > 0
      case 'body': return form.weight && form.age && form.height
      case 'fitnessLevel': return !!form.fitnessLevel
      case 'dietaryPreferences': return !!form.dietaryPreferences
      case 'allergies': return true
      case 'activityLevel': return !!form.activityLevel
      case 'duration': return true
      default: return true
    }
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      saveProfile(form)
      savePlan(samplePlan)
      navigate('/app')
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const renderStep = () => {
    const { key } = STEPS[step]

    switch (key) {
      case 'name':
        return (
          <div className="input-group slide-up">
            <label>Your name</label>
            <input
              className="input-field"
              type="text"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              autoFocus
            />
          </div>
        )

      case 'body':
        return (
          <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Weight (kg)</label>
              <input className="input-field" type="number" placeholder="e.g. 70"
                value={form.weight} onChange={(e) => update('weight', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Age</label>
              <input className="input-field" type="number" placeholder="e.g. 25"
                value={form.age} onChange={(e) => update('age', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Height (cm)</label>
              <input className="input-field" type="number" placeholder="e.g. 175"
                value={form.height} onChange={(e) => update('height', e.target.value)} />
            </div>
          </div>
        )

      case 'fitnessLevel':
        return (
          <div className="option-cards slide-up">
            {FITNESS_OPTIONS.map((opt) => (
              <div key={opt.value}
                className={`option-card ${form.fitnessLevel === opt.value ? 'selected' : ''}`}
                onClick={() => update('fitnessLevel', opt.value)}>
                <div className="icon">{opt.icon}</div>
                <div>
                  <div className="label">{opt.label}</div>
                  <div className="desc">{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'dietaryPreferences':
        return (
          <div className="option-cards slide-up">
            {DIET_OPTIONS.map((opt) => (
              <div key={opt.value}
                className={`option-card ${form.dietaryPreferences === opt.value ? 'selected' : ''}`}
                onClick={() => update('dietaryPreferences', opt.value)}>
                <div className="icon">{opt.icon}</div>
                <div>
                  <div className="label">{opt.label}</div>
                  <div className="desc">{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'allergies':
        return (
          <div className="input-group slide-up">
            <label>Allergies (optional)</label>
            <input className="input-field" type="text"
              placeholder="e.g. peanuts, shellfish, gluten..."
              value={form.allergies} onChange={(e) => update('allergies', e.target.value)} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Leave blank if none. Separate multiple items with commas.
            </span>
          </div>
        )

      case 'activityLevel':
        return (
          <div className="option-cards slide-up">
            {ACTIVITY_OPTIONS.map((opt) => (
              <div key={opt.value}
                className={`option-card ${form.activityLevel === opt.value ? 'selected' : ''}`}
                onClick={() => update('activityLevel', opt.value)}>
                <div className="icon">{opt.icon}</div>
                <div>
                  <div className="label">{opt.label}</div>
                  <div className="desc">{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'duration':
        return (
          <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Hours</label>
              <select className="input-field"
                value={form.preferredDurationHrs}
                onChange={(e) => update('preferredDurationHrs', e.target.value)}>
                {[0, 1, 2, 3].map((h) => (
                  <option key={h} value={h}>{h} hr{h !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Minutes</label>
              <select className="input-field"
                value={form.preferredDurationMins}
                onChange={(e) => update('preferredDurationMins', e.target.value)}>
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="page" style={{ padding: '0 24px' }}>
      {/* Progress bar */}
      <div style={{ padding: '16px 0 8px' }}>
        <div style={{
          height: 4, borderRadius: 2, background: 'var(--bg-card)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'var(--green-primary)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Step {step + 1} of {STEPS.length}
          </span>
          {step > 0 && (
            <button onClick={handleBack}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronLeft size={14} /> Back
            </button>
          )}
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32, paddingBottom: 80 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            {STEPS[step].title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {STEPS[step].subtitle}
          </p>
        </div>

        {renderStep()}
      </div>

      {/* Bottom button */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 24px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(transparent, var(--bg-primary) 30%)',
      }}>
        <button className="btn btn-primary" onClick={handleNext} disabled={!canProceed()}>
          {step === STEPS.length - 1 ? (
            <>Get My Plan <Check size={18} /></>
          ) : (
            <>Continue <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  )
}
