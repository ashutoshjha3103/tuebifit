import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { User, Edit3, Save, LogOut, AlertTriangle, Star, Activity, Clock } from 'lucide-react'

const FIELD_CONFIG = [
  { key: 'name', label: 'Name', type: 'text', icon: User },
  { key: 'age', label: 'Age', type: 'number', icon: User },
  { key: 'weight', label: 'Weight (kg)', type: 'number', icon: Activity },
  { key: 'height', label: 'Height (cm)', type: 'number', icon: Activity },
  {
    key: 'fitnessLevel', label: 'Fitness Level', type: 'select', icon: Star,
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'amateur', label: 'Amateur' },
      { value: 'professional', label: 'Professional' },
    ],
  },
  {
    key: 'dietaryPreferences', label: 'Dietary Preferences', type: 'select', icon: User,
    options: [
      { value: 'vegan', label: 'Vegan' },
      { value: 'vegetarian', label: 'Vegetarian' },
      { value: 'no restrictions', label: 'No Restrictions' },
    ],
  },
  { key: 'allergies', label: 'Allergies', type: 'text', icon: AlertTriangle },
  {
    key: 'activityLevel', label: 'Activity Level', type: 'select', icon: Activity,
    options: [
      { value: 'sedentary', label: 'I sit all day' },
      { value: 'lightly active', label: 'Leisurely walks' },
      { value: 'very active', label: 'Intense workouts' },
    ],
  },
  { key: 'preferredDurationHrs', label: 'Session Duration (hrs)', type: 'number', icon: Clock },
  { key: 'preferredDurationMins', label: 'Session Duration (mins)', type: 'number', icon: Clock },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, saveProfile, logout } = useUser()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...user })

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const handleSave = () => {
    saveProfile(form)
    setEditing(false)
  }

  const handleCancel = () => {
    setForm({ ...user })
    setEditing(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) return null

  const bmi = user.weight && user.height
    ? (user.weight / ((user.height / 100) ** 2)).toFixed(1)
    : '—'

  return (
    <div className="page-scroll" style={{ padding: '16px 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={22} color="var(--green-primary)" />
          Profile
        </h2>
        {!editing ? (
          <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}
            style={{ width: 'auto' }}>
            <Edit3 size={14} /> Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={handleCancel}
              style={{ width: 'auto' }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}
              style={{ width: 'auto' }}>
              <Save size={14} /> Save
            </button>
          </div>
        )}
      </div>

      {/* Avatar + name card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, var(--green-primary), var(--green-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#0a1929',
          flexShrink: 0,
        }}>
          {(user.name || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{user.name || 'User'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            BMI: {bmi} · {user.fitnessLevel || 'Unknown level'}
          </div>
        </div>
      </div>

      {/* Info fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FIELD_CONFIG.map((field) => (
          <div key={field.key} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
            <field.icon size={16} color="var(--green-primary)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>
                {field.label}
              </div>
              {editing ? (
                field.type === 'select' ? (
                  <select className="input-field" style={{ padding: '8px 12px', fontSize: 14 }}
                    value={form[field.key] || ''} onChange={(e) => update(field.key, e.target.value)}>
                    <option value="">Select...</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input className="input-field" type={field.type}
                    style={{ padding: '8px 12px', fontSize: 14 }}
                    value={form[field.key] || ''} onChange={(e) => update(field.key, e.target.value)} />
                )
              ) : (
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {user[field.key] || '—'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button className="btn btn-outline" onClick={handleLogout}
        style={{ marginTop: 24, color: 'var(--danger)', borderColor: 'rgba(239,83,80,0.3)' }}>
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  )
}
