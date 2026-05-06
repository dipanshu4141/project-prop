export const JWT_ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  ?? 'change-me-access';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh';

export const JWT_ACCESS_EXPIRES  = '15m';
export const JWT_REFRESH_EXPIRES = '365d';

export const ROLES_KEY          = 'roles';
export const PLATFORM_ROLES_KEY = 'platformRoles';