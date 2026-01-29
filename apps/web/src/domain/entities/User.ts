// domain/entities/User.ts
// User entity - Core domain model

export interface User {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly emailVerifiedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
}

export interface UserWithPassword extends User {
    readonly passwordHash: string;
}
