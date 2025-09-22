// Role constants for consistent role management across the application

export const ROLES = {
  // Backend role names (used in database)
  ORGANIZATION_ADMIN: 'OrganizationAdmin',
  NGO_ADMIN: 'NGOAdmin',
  SCHOOL_ADMIN: 'SchoolAdmin',
  PROFESSIONAL: 'Professional',
  TEACHER: 'Teacher',
  PARENT: 'Parent'
};

// Frontend role names (used in UI)
export const FRONTEND_ROLES = {
  ORGANIZATION_ADMIN: 'OrganizationAdmin',
  NGO_MASTER: 'NGO Master',
  ADMIN: 'Admin',
  PROFESSIONAL: 'Professional',
  TEACHER: 'Teacher',
  PARENT: 'Parent'
};

// Role mapping from frontend to backend
export const ROLE_MAPPING = {
  [FRONTEND_ROLES.ORGANIZATION_ADMIN]: ROLES.ORGANIZATION_ADMIN,
  [FRONTEND_ROLES.NGO_MASTER]: ROLES.NGO_ADMIN,
  [FRONTEND_ROLES.ADMIN]: ROLES.SCHOOL_ADMIN,
  [FRONTEND_ROLES.PROFESSIONAL]: ROLES.PROFESSIONAL,
  [FRONTEND_ROLES.TEACHER]: ROLES.TEACHER,
  [FRONTEND_ROLES.PARENT]: ROLES.PARENT
};

// Reverse mapping from backend to frontend
export const REVERSE_ROLE_MAPPING = {
  [ROLES.ORGANIZATION_ADMIN]: FRONTEND_ROLES.ORGANIZATION_ADMIN,
  [ROLES.NGO_ADMIN]: FRONTEND_ROLES.NGO_MASTER,
  [ROLES.SCHOOL_ADMIN]: FRONTEND_ROLES.ADMIN,
  [ROLES.PROFESSIONAL]: FRONTEND_ROLES.PROFESSIONAL,
  [ROLES.TEACHER]: FRONTEND_ROLES.TEACHER,
  [ROLES.PARENT]: FRONTEND_ROLES.PARENT
};

// Role hierarchy for permissions
export const ROLE_HIERARCHY = {
  [ROLES.ORGANIZATION_ADMIN]: 1, // Highest level
  [ROLES.NGO_ADMIN]: 2,
  [ROLES.SCHOOL_ADMIN]: 3,
  [ROLES.PROFESSIONAL]: 4,
  [ROLES.TEACHER]: 5,
  [ROLES.PARENT]: 6 // Lowest level
};

// Helper functions
export const normalizeRole = (role) => {
  return ROLE_MAPPING[role] || role;
};

export const denormalizeRole = (role) => {
  return REVERSE_ROLE_MAPPING[role] || role;
};

export const hasPermission = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel && requiredLevel && userLevel <= requiredLevel;
};

export const isAdminRole = (role) => {
  return [ROLES.ORGANIZATION_ADMIN, ROLES.NGO_ADMIN, ROLES.SCHOOL_ADMIN].includes(role);
};

export const isUserRole = (role) => {
  return [ROLES.PROFESSIONAL, ROLES.TEACHER, ROLES.PARENT].includes(role);
};
