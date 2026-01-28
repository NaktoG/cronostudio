// application/services/AuthService.ts
// Centralized authentication service - eliminates code duplication

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '@/lib/config';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { User, CreateUserInput } from '@/domain/entities/User';

const BCRYPT_ROUNDS = 12;

export interface AuthTokenPayload {
    userId: string;
    email: string;
}

export interface AuthResult {
    user: User;
    token: string;
}

export class AuthService {
    constructor(private userRepository: UserRepository) { }

    /**
     * Register a new user
     */
    async register(input: CreateUserInput): Promise<AuthResult> {
        // Check if email exists
        const exists = await this.userRepository.emailExists(input.email);
        if (exists) {
            throw new AuthError('Email already registered', 'EMAIL_EXISTS');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

        // Create user
        const user = await this.userRepository.create(input, passwordHash);

        // Generate token
        const token = this.generateToken(user);

        return { user, token };
    }

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<AuthResult> {
        // Find user
        const userWithPassword = await this.userRepository.findByEmail(email);
        if (!userWithPassword) {
            throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, userWithPassword.passwordHash);
        if (!isValid) {
            throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
        }

        // Generate token
        const user: User = {
            id: userWithPassword.id,
            email: userWithPassword.email,
            name: userWithPassword.name,
            createdAt: userWithPassword.createdAt,
            updatedAt: userWithPassword.updatedAt,
        };
        const token = this.generateToken(user);

        return { user, token };
    }

    /**
     * Verify a JWT token and return the payload
     */
    verifyToken(token: string): AuthTokenPayload {
        try {
            const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthError('Token expired', 'TOKEN_EXPIRED');
            }
            throw new AuthError('Invalid token', 'INVALID_TOKEN');
        }
    }

    /**
     * Extract user ID from Authorization header
     */
    extractUserIdFromHeader(authHeader: string | null): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        try {
            const token = authHeader.slice(7);
            const payload = this.verifyToken(token);
            return payload.userId;
        } catch {
            return null;
        }
    }

    private generateToken(user: User): string {
        return jwt.sign(
            { userId: user.id, email: user.email },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn as any }
        );
    }
}

// Custom error class for auth errors
export class AuthError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'AuthError';
    }
}
