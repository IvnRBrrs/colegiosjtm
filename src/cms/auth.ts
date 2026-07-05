export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  EDITOR_ADMIN: 'editor_admin',
  EDITOR_BLOG: 'editor_blog',
  GESTOR_ADMIN: 'gestor_admin',
}

export const ROLE_NAMES: Record<string, string> = {
  super_admin: 'Super Administrador',
  editor_admin: 'Editor do Site',
  editor_blog: 'Editor do Blog',
  gestor_admin: 'Gestor de Alunos',
}

export function getRoleFromToken(): string | null {
  const token = localStorage.getItem('cms_token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.role) return payload.role
    console.warn('[auth] Token sem role (token antigo). Assumindo super_admin. Faça logout e login novamente para obter um token atualizado.')
    return ROLES.SUPER_ADMIN
  } catch {
    return null
  }
}

export function getUsernameFromToken(): string | null {
  const token = localStorage.getItem('cms_token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.username || null
  } catch {
    return null
  }
}

export function hasRole(...allowed: string[]): boolean {
  const role = getRoleFromToken()
  if (!role) return false
  return allowed.includes(role)
}
