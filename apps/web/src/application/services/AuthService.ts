// application/services/AuthService.ts
// Centralized authentication service - eliminates code duplication

import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { config } from '@/lib/config';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { SessionRepository } from '@/domain/repositories/SessionRepository';
import { User, CreateUserInput } from '@/domain/entities/User';
import { emitMetric } from '@/lib/observability';
import { USER_ROLE_OWNER } from '@/domain/value-objects/UserRole';

const BCRYPT_ROUNDS = 12;

export interface AuthTokenPayload {
    userId: string;
    email: string;
    role: User['role'];
}

export interface AuthResult {
    user: User;
    token: string;
    refreshToken: string;
}

export class AuthService {
    constructor(
        private userRepository: UserRepository,
        private sessionRepository?: SessionRepository
    ) { }

    /**
     * Register a new user
     */
    async register(input: CreateUserInput): Promise<AuthResult> {
        // Check if email exists
        const exists = await this.userRepository.emailExists(input.email);
        if (exists) {
            this.trackMetric('auth.register.failure', { reason: 'email_exists' });
            throw new AuthError('Email already registered', 'EMAIL_EXISTS');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

        // Create user
        const user = await this.userRepository.create({ ...input, role: input.role ?? USER_ROLE_OWNER }, passwordHash);

        // Generate token
        const token = this.generateAccessToken(user);
        const refreshToken = await this.createRefreshSession(user.id);

        this.trackMetric('auth.register.success');
        return { user, token, refreshToken };
    }

    /**
     * Register without issuing tokens (requires email verification)
     */
    async registerWithoutSession(input: CreateUserInput): Promise<User> {
        const exists = await this.userRepository.emailExists(input.email);
        if (exists) {
            this.trackMetric('auth.register.failure', { reason: 'email_exists' });
            throw new AuthError('Email already registered', 'EMAIL_EXISTS');
        }

        const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
        const user = await this.userRepository.create({ ...input, role: input.role ?? USER_ROLE_OWNER }, passwordHash);
        this.trackMetric('auth.register.success');
        return user;
    }

    async login(email: string, password: string): Promise<AuthResult> {
        // Find user
        const userWithPassword = await this.userRepository.findByEmail(email);
        if (!userWithPassword) {
            this.trackMetric('auth.login.failure', { reason: 'user_not_found' });
            throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
        }

        const requireVerified = process.env.REQUIRE_EMAIL_VERIFIED !== 'false';
        if (requireVerified && !userWithPassword.emailVerifiedAt) {
            this.trackMetric('auth.login.failure', { reason: 'email_not_verified' });
            throw new AuthError('Email not verified', 'EMAIL_NOT_VERIFIED');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, userWithPassword.passwordHash);
        if (!isValid) {
            this.trackMetric('auth.login.failure', { reason: 'invalid_password' });
            throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
        }

        // Generate token
        const user: User = {
            id: userWithPassword.id,
            email: userWithPassword.email,
            name: userWithPassword.name,
            role: userWithPassword.role,
            emailVerifiedAt: userWithPassword.emailVerifiedAt,
            createdAt: userWithPassword.createdAt,
            updatedAt: userWithPassword.updatedAt,
        };
        const token = this.generateAccessToken(user);
        const refreshToken = await this.createRefreshSession(user.id);

        this.trackMetric('auth.login.success');
        return { user, token, refreshToken };
    }

    async refresh(refreshToken: string): Promise<AuthResult> {
        const refreshTokenHash = this.hashToken(refreshToken);
        const sessionRepository = this.requireSessionRepository();
        const session = await sessionRepository.findValidByTokenHash(refreshTokenHash);
        if (!session) {
            this.trackMetric('auth.refresh.failure', { reason: 'session_not_found' });
            throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
        }

        const user = await this.userRepository.findById(session.userId);
        if (!user) {
            this.trackMetric('auth.refresh.failure', { reason: 'user_not_found' });
            throw new AuthError('User not found', 'USER_NOT_FOUND');
        }

        await sessionRepository.revokeById(session.id);
        const newRefreshToken = await this.createRefreshSession(user.id);
        const token = this.generateAccessToken(user);

        this.trackMetric('auth.refresh.success');
        return { user, token, refreshToken: newRefreshToken };
    }

    async logout(refreshToken: string): Promise<void> {
        const refreshTokenHash = this.hashToken(refreshToken);
        const sessionRepository = this.requireSessionRepository();
        await sessionRepository.revokeByTokenHash(refreshTokenHash);
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

    async getProfile(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
        }
        return user;
    }

    async updateProfile(userId: string, input: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
        const updated = await this.userRepository.update(userId, input);
        if (!updated) {
            throw new AuthError('No hay cambios para guardar', 'PROFILE_NO_CHANGES');
        }
        this.trackMetric('auth.profile.update');
        return updated;
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findByIdWithPassword(userId);
        if (!user) {
            throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
        }
        const matches = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!matches) {
            throw new AuthError('La contraseña actual no es correcta', 'INVALID_PASSWORD');
        }
        const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await this.userRepository.updatePassword(userId, newHash);
        this.trackMetric('auth.password.change');
    }

    async deleteAccount(userId: string): Promise<void> {
        const sessionRepository = this.requireSessionRepository();
        await sessionRepository.deleteByUserId(userId);
        await this.userRepository.deleteById(userId);
        this.trackMetric('auth.account.deleted');
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

    private generateAccessToken(user: User): string {
        const expiresIn = config.jwt.expiresIn as SignOptions['expiresIn'];
        return jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            config.jwt.secret,
            { expiresIn }
        );
    }

    private async createRefreshSession(userId: string): Promise<string> {
        const refreshToken = crypto.randomBytes(32).toString('hex');
        const refreshTokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + this.getRefreshTtlMs());
        const sessionRepository = this.requireSessionRepository();
        await sessionRepository.create(userId, refreshTokenHash, expiresAt);
        return refreshToken;
    }

    private requireSessionRepository(): SessionRepository {
        if (!this.sessionRepository) {
            throw new AuthError('Session repository not configured', 'SESSION_REPO_MISSING');
        }
        return this.sessionRepository;
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private getRefreshTtlMs(): number {
        const value = config.jwt.refreshExpiresIn;
        const match = /^([0-9]+)([smhd])$/.exec(value);
        if (!match) return 30 * 24 * 60 * 60 * 1000;
        const amount = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return amount * (multipliers[unit] || 24 * 60 * 60 * 1000);
    }

    private trackMetric(name: string, tags?: Record<string, string>) {
        emitMetric({ name, value: 1, tags });
    }
}

// Custom error class for auth errors
export class AuthError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'AuthError';
    }
}
