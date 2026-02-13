// domain/value-objects/UserRole.ts
// User role value object to support RBAC

export const USER_ROLES = ['owner', 'collaborator', 'automation'] as const;

export type UserRole = typeof USER_ROLES[number];

export function isValidUserRole(role: string): role is UserRole {
    return USER_ROLES.includes(role as UserRole);
}
