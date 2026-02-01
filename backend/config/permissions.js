/**
 * Role-based permissions configuration
 */

export const PERMISSIONS = {
  // Question permissions
  'question:create': ['admin', 'instructor', 'exam_manager'],
  'question:read': ['admin', 'instructor', 'exam_manager'],
  'question:update': ['admin', 'exam_manager'],
  'question:delete': ['admin', 'exam_manager'],
  'question:approve': ['admin', 'exam_manager'],
  'question:reject': ['admin', 'exam_manager'],

  // Exam permissions
  'exam:create': ['admin', 'instructor'],
  'exam:read': ['admin', 'instructor', 'exam_manager'],
  'exam:update': ['admin', 'instructor'],
  'exam:delete': ['admin'],
  'exam:publish': ['admin', 'instructor'],
  'exam:assign': ['admin', 'instructor'],

  // User management
  'user:create': ['admin'],
  'user:read': ['admin'],
  'user:update': ['admin'],
  'user:delete': ['admin'],

  // Result permissions
  'result:read_all': ['admin', 'instructor'],
  'result:read_own': ['student'],
  'result:grade': ['admin', 'instructor'],

  // Dashboard
  'dashboard:admin': ['admin'],
  'dashboard:instructor': ['instructor'],
  'dashboard:exam_manager': ['exam_manager'],
  'dashboard:student': ['student']
};

export function hasPermission(role, permission) {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(role);
}

export function getRolePermissions(role) {
  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}

export default { PERMISSIONS, hasPermission, getRolePermissions };
