export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  EDITOR_ADMIN: 'editor_admin',
  EDITOR_BLOG: 'editor_blog',
  GESTOR_ADMIN: 'gestor_admin',
}

export const ROLE_NAMES = {
  super_admin: 'Super Administrador',
  editor_admin: 'Editor do Site',
  editor_blog: 'Editor do Blog',
  gestor_admin: 'Gestor de Alunos',
}

export const ROLE_WEIGHT = {
  super_admin: 4,
  gestor_admin: 3,
  editor_admin: 2,
  editor_blog: 1,
}

export function canManageRole(managerRole, targetRole) {
  const mw = ROLE_WEIGHT[managerRole] || 0
  const tw = ROLE_WEIGHT[targetRole] || 0
  return mw >= tw
}

export function canCreateRole(managerRole, targetRole) {
  const mw = ROLE_WEIGHT[managerRole] || 0
  const tw = ROLE_WEIGHT[targetRole] || 0
  return mw > tw
}
