// infrastructure/repositories/PostgresUserRepository.ts
// Implementation of UserRepository using PostgreSQL

import { query } from '@/lib/db';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { User, CreateUserInput, UserWithPassword } from '@/domain/entities/User';

export class PostgresUserRepository implements UserRepository {

    async findById(id: string): Promise<User | null> {
        const result = await query(
            'SELECT id, email, name, role, email_verified_at, created_at, updated_at FROM app_users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) return null;
        return this.toDomain(result.rows[0]);
    }

    async findByIdWithPassword(id: string): Promise<UserWithPassword | null> {
        const result = await query(
            'SELECT id, email, name, role, password_hash, email_verified_at, created_at, updated_at FROM app_users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) return null;
        return this.toDomainWithPassword(result.rows[0]);
    }

    async findByEmail(email: string): Promise<UserWithPassword | null> {
        const result = await query(
            'SELECT id, email, name, role, password_hash, email_verified_at, created_at, updated_at FROM app_users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) return null;
        return this.toDomainWithPassword(result.rows[0]);
    }

    async create(input: CreateUserInput, passwordHash: string): Promise<User> {
        const result = await query(
            `INSERT INTO app_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, email_verified_at, created_at, updated_at`,
            [input.email.toLowerCase(), passwordHash, input.name, input.role ?? 'owner']
        );

        return this.toDomain(result.rows[0]);
    }

    async emailExists(email: string): Promise<boolean> {
        const result = await query(
            'SELECT 1 FROM app_users WHERE email = $1',
            [email.toLowerCase()]
        );
        return result.rows.length > 0;
    }

    async update(id: string, input: Partial<Pick<User, 'name' | 'email'>>): Promise<User | null> {
        const updates: string[] = [];
        const params: string[] = [];
        let paramIndex = 1;

        if (input.name) {
            updates.push(`name = $${paramIndex++}`);
            params.push(input.name);
        }
        if (input.email) {
            updates.push(`email = $${paramIndex++}`);
            params.push(input.email.toLowerCase());
        }

        if (updates.length === 0) return null;

        params.push(id);

        const result = await query(
            `UPDATE app_users SET ${updates.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIndex} 
       RETURNING id, email, name, role, email_verified_at, created_at, updated_at`,
            params
        );

        if (result.rows.length === 0) return null;
        return this.toDomain(result.rows[0]);
    }

    async updatePassword(id: string, passwordHash: string): Promise<void> {
        await query('UPDATE app_users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, id]);
    }

    async deleteById(id: string): Promise<void> {
        await query('DELETE FROM app_users WHERE id = $1', [id]);
    }

    private toDomain(row: Record<string, unknown>): User {
        return {
            id: row.id as string,
            email: row.email as string,
            name: row.name as string,
            role: row.role as User['role'],
            emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at as string) : null,
            createdAt: new Date(row.created_at as string),
            updatedAt: new Date(row.updated_at as string),
        };
    }

    private toDomainWithPassword(row: Record<string, unknown>): UserWithPassword {
        return {
            ...this.toDomain(row),
            passwordHash: row.password_hash as string,
        };
    }
}
