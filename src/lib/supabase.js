// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// export async function fetchUsers() {
//   const { data, error } = await supabase
//     .from('profiles')
//     .select('id, full_name, email, role, created_at')
//     .order('created_at', { ascending: true })

//   if (error) {
//     throw error
//   }

//   return data
// }

export async function fetchUsers() {
  // Get the currently logged-in user
  const {
    data: { user: currentUser },
    error: authError
  } = await supabase.auth.getUser()

  if (authError) {
    throw authError
  }

  if (!currentUser) {
    throw new Error('No authenticated user found')
  }

  // Get the logged-in user's profile and role
  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', currentUser.id)
    .single()

  if (profileError) {
    throw profileError
  }

  // Super Admin and Board Member can see everyone
  if (
    currentProfile.role === 'super_admin' ||
    currentProfile.role === 'board_member'
  ) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return data
  }

  // Employees can see:
  // - All Super Admins
  // - All Board Members
  // - Themselves
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .or(`role.eq.super_admin,role.eq.board_member,id.eq.${currentUser.id}`)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data
}