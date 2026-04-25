import { supabase } from '../supabase'

describe('Supabase Client', () => {
  it('should initialize Supabase client', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
    expect(supabase.storage).toBeDefined()
    expect(supabase.from).toBeDefined()
  })

  it('should have correct URL configuration', () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    expect(supabaseUrl).toBeDefined()
    expect(supabaseUrl).toMatch(/^https?:\/\//)
  })

  it('should have anon key configured', () => {
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    expect(anonKey).toBeDefined()
    expect(anonKey.length).toBeGreaterThan(0)
  })
})
