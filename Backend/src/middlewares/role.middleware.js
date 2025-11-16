// src/middlewares/role.middleware.js
// Middleware kiểm tra user có thuộc 1 trong các role cho phép không

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
