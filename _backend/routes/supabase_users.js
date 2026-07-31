import { Router } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { ROLES } from '../roles.js'
import supabaseAdmin from '../supabaseAdmin.js'

const router = Router()

router.use(authMiddleware, requireRole(ROLES.SUPER_ADMIN))

const ROLE_MAP = {
  super_admin: 'Super Administrador',
  editor_admin: 'Editor do Site',
  editor_blog: 'Editor do Blog',
  gestor_admin: 'Gestor de Alunos',
}

function mapSupabaseUser(u) {
  return {
    id: u.id,
    email: u.email,
    role: u.user_metadata?.role || 'editor_admin',
    company_id: u.user_metadata?.company_id || 'default',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at || '',
    confirmed_at: u.confirmed_at || '',
  }
}

router.get('/', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' })
    }
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error
    const users = (data?.users || []).map(mapSupabaseUser)
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list Supabase users' })
  }
})

router.post('/', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' })
    }
    const { email, password, role, company_id } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    if (role && !ROLE_MAP[role]) {
      return res.status(400).json({ error: 'Invalid role' })
    }
    const metaCompanyId = company_id || req.user?.company_id || 'default'
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: role || 'editor_admin', company_id: metaCompanyId },
    })
    if (error) throw error
    res.json({ success: true, id: data.user.id })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create Supabase user' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' })
    }
    const { email, role, company_id } = req.body
    const updates = {}
    if (email !== undefined) updates.email = email
    if (role !== undefined || company_id !== undefined) {
      const meta = {}
      if (role !== undefined) {
        if (!ROLE_MAP[role]) return res.status(400).json({ error: 'Invalid role' })
        meta.role = role
      }
      meta.company_id = company_id || req.user?.company_id || 'default'
      updates.user_metadata = meta
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, updates)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update Supabase user' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' })
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete Supabase user' })
  }
})

router.post('/:id/reset-password', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' })
    }
    const { password } = req.body
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' })
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, { password })
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to reset password' })
  }
})

export default router
