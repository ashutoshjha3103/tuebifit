const API_BASE = import.meta.env.VITE_API_URL || ''

export async function generatePlan(profile) {
  const body = {
    name: profile.name,
    age: parseInt(profile.age, 10),
    weight: parseFloat(profile.weight),
    height: parseFloat(profile.height),
    fitness_level: profile.fitnessLevel,
    equipment: profile.equipment || 'none',
    dietary_preferences: profile.dietaryPreferences,
    activity_level: profile.activityLevel,
    allergies: profile.allergies || '',
    preferred_duration_hrs: parseInt(profile.preferredDurationHrs, 10) || 1,
    preferred_duration_mins: parseInt(profile.preferredDurationMins, 10) || 0,
    query: profile.customQuery?.trim() || null,
  }

  const resp = await fetch(`${API_BASE}/api/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.detail || `API error ${resp.status}`)
  }

  return resp.json()
}
