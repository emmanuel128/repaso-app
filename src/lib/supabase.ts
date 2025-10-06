import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface StudySection {
  id: string
  title: string
  description: string
  weight: number
  color: string
  created_at: string
  updated_at: string
}

export interface StudyTopic {
  id: string
  section_id: string
  title: string
  content?: string
  order_index: number
  created_at: string
}