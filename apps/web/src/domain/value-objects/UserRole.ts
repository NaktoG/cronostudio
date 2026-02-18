// domain/value-objects/UserRole.ts
// User role value object to support RBAC

export const USER_ROLES = ['owner', 'collaborator', 'automation'] as const;

export type UserRole = typeof USER_ROLES[number];

export const USER_ROLE_OWNER: UserRole = 'owner';
export const USER_ROLE_COLLABORATOR: UserRole = 'collaborator';
export const USER_ROLE_AUTOMATION: UserRole = 'automation';

export function isValidUserRole(role: string): role is UserRole {
    return USER_ROLES.includes(role as UserRole);
}
