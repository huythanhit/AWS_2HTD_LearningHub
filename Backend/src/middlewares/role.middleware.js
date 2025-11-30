// src/middlewares/role.middleware.js

// Dùng cho route cũ: requireRole('Admin'), requireRole('Admin', 'Teacher')
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roleName) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      return next(err);
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      const err = new Error('Forbidden (insufficient permissions)');
      err.statusCode = 403;
      return next(err);
    }

    return next();
  };
}

// Dùng cho module practice: requireRoles(['Admin','Teacher'])
export function requireRoles(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return requireRole(...roles);
}