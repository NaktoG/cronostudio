// domain/repositories/UserRepository.ts
// Interface for User persistence

import { User, CreateUserInput, UserWithPassword } from '../entities/User';


export interface UserRepository {
    /**
     * Find a user by their unique ID
     */
    findById(id: string): Promise<User | null>;

    /**
     * Find a user by their ID including password hash
     */
    findByIdWithPassword(id: string): Promise<UserWithPassword | null>;

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

    /**
     * Update user password
     */
    updatePassword(id: string, passwordHash: string): Promise<void>;

    /**
     * Mark email as verified
     */
    markEmailVerified(id: string): Promise<void>;

    /**
     * Delete user permanently
     */
    deleteById(id: string): Promise<void>;
}
