// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

// process.env'nin dolu olduğundan emin oluyoruz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("🚨 HATA: Supabase URL veya Service Key eksik!");
}

export const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!)    