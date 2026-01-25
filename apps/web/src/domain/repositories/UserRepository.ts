// domain/repositories/UserRepository.ts
// Interface for User persistence

import { User, CreateUserInput, UserWithPassword } from '../entities/User';

export interface UserRepository {
    /**
     * Find a user by their unique ID
     */
    findById(id: string): Promise<User | null>;

    /**
     * Find a user by their email address
     */
    findByEmail(email: string): Promise<UserWithPassword | null>;

    /**
     * Create a new user
     */
    create(input: CreateUserInput, passwordHash: string): Promise<User>;

    /**
     * Check if an email is already registered
     */
    emailExists(email: string): Promise<boolean>;

    /**
     * Update user profile
     */
    update(id: string, input: Partial<Pick<User, 'name' | 'email'>>): Promise<User | null>;
}
