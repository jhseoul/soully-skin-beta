import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  url && key ? createClient(url, key) : null

// Stable per-browser id so every diagnosis a visitor completes — logged in
// or not — can be grouped together later without collecting anything
// identifying up front.
export function getOrCreateAnonymousId() {
  const key = 'soully_anonymous_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

// Only called when a visitor registers a contact + consent on the result
// screen — this is the single write path for diagnosis data under the
// "register to unlock Skin 64" policy. `success` is the caller's signal to
// unlock the detailed 64-type reveal; a thrown/caught error (or a falsy
// `success`) must keep that reveal locked.
export async function saveLead(payload) {
  if (supabase) {
    const { error } = await supabase.from('skin_test_leads').insert(payload)
    if (error) throw error
    return { mode: 'supabase', success: true }
  }

  const current = JSON.parse(localStorage.getItem('soully_skin_leads') || '[]')
  current.push({ ...payload, saved_at: new Date().toISOString() })
  localStorage.setItem('soully_skin_leads', JSON.stringify(current))
  return { mode: 'local', success: true }
}

// Not called anywhere right now. Registering (saveLead above) is the only
// way diagnosis data reaches the database under the current policy — this
// stays here unused/reserved rather than deleted, in case a later, clearly
// opt-in use for skin_diagnoses comes back.
export async function saveDiagnosis(payload) {
  if (supabase) {
    const { data, error } = await supabase
      .from('skin_diagnoses')
      .insert(payload)
      .select('id')
      .single()
    if (error) return { mode: 'supabase', ok: false, error }
    return { mode: 'supabase', ok: true, id: data?.id ?? null }
  }

  const id = crypto.randomUUID()
  const current = JSON.parse(localStorage.getItem('soully_skin_diagnoses') || '[]')
  current.push({ id, ...payload, created_at: new Date().toISOString() })
  localStorage.setItem('soully_skin_diagnoses', JSON.stringify(current))
  return { mode: 'local', ok: true, id }
}
