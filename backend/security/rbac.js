// Role Hierarchy & RBAC Middleware
export const ROLES = {
  USER: "USER",
  VIP: "VIP",
  MODERATOR: "MODERATOR",
  ADMIN: "ADMIN",
};

const ROLE_HIERARCHY = {
  USER: 1,
  VIP: 2,
  MODERATOR: 3,
  ADMIN: 4,
};

export function requireRole(minimumRoleOrRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor (Unauthorized)", code: "UNAUTHORIZED" });
    }

    const userRole = req.user.role || ROLES.USER;

    if (Array.isArray(minimumRoleOrRoles)) {
      if (!minimumRoleOrRoles.includes(userRole)) {
        return res.status(403).json({ error: "Bu işlem için yetkiniz bulunmuyor (Forbidden)", code: "FORBIDDEN" });
      }
      return next();
    }

    const userLevel = ROLE_HIERARCHY[userRole] || 1;
    const requiredLevel = ROLE_HIERARCHY[minimumRoleOrRoles] || 1;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz bulunmuyor (Forbidden)", code: "FORBIDDEN" });
    }

    next();
  };
}

// IDOR (Insecure Direct Object Reference) Protection Helper
export function checkResourceOwnership(resourceOwnerId, requestingUserId, requestingUserRole = "USER") {
  if (!resourceOwnerId || !requestingUserId) return false;
  // Resource owners and Admins/Moderators can manage resources
  if (resourceOwnerId === requestingUserId) return true;
  if (requestingUserRole === ROLES.ADMIN || requestingUserRole === ROLES.MODERATOR) return true;
  return false;
}
