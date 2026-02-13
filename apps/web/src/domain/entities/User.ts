// domain/entities/User.ts
// User entity - Core domain model

import type { UserRole } from '../value-objects/UserRole';

export interface User {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: UserRole;
    readonly emailVerifiedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
}

export interface UserWithPassword extends User {
    readonly passwordHash: string;
}
