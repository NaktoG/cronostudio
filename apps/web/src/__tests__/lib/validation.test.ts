import { describe, it, expect } from 'vitest';
import { validateInput, LoginSchema, RegisterSchema, CreateChannelSchema } from '@/lib/validation';

describe('Validation Library', () => {
    describe('LoginSchema', () => {
        it('should validate correct login data', () => {
            const data = { email: 'test@example.com', password: 'password123' };
            const result = validateInput(LoginSchema, data);
            expect(result.email).toBe('test@example.com');
            expect(result.password).toBe('password123');
        });

        it('should reject invalid email', () => {
            const data = { email: 'invalid-email', password: 'password123' };
            expect(() => validateInput(LoginSchema, data)).toThrow('Email inválido');
        });

        it('should reject short password', () => {
            const data = { email: 'test@example.com', password: '12345' };
            expect(() => validateInput(LoginSchema, data)).toThrow('Contraseña debe tener al menos 6 caracteres');
        });

        it('should normalize email to lowercase', () => {
            const data = { email: 'TEST@Example.COM', password: 'password123' };
            const result = validateInput(LoginSchema, data);
            expect(result.email).toBe('test@example.com');
        });
    });

    describe('RegisterSchema', () => {
        it('should validate correct registration data', () => {
            const data = {
                email: 'test@example.com',
                password: 'Password123',
                name: 'John Doe'
            };
            const result = validateInput(RegisterSchema, data);
            expect(result.email).toBe('test@example.com');
            expect(result.name).toBe('John Doe');
        });

        it('should require uppercase in password', () => {
            const data = {
                email: 'test@example.com',
                password: 'password123',
                name: 'John Doe'
            };
            expect(() => validateInput(RegisterSchema, data)).toThrow('mayúscula');
        });

        it('should require number in password', () => {
            const data = {
                email: 'test@example.com',
                password: 'Password',
                name: 'John Doe'
            };
            expect(() => validateInput(RegisterSchema, data)).toThrow('número');
        });

        it('should require minimum name length', () => {
            const data = {
                email: 'test@example.com',
                password: 'Password123',
                name: 'J'
            };
            expect(() => validateInput(RegisterSchema, data)).toThrow('2 caracteres');
        });
    });

    describe('CreateChannelSchema', () => {
        it('should validate correct channel data', () => {
            const data = {
                name: 'My Channel',
                youtubeChannelId: 'UCxxxxxxxxxxxxxxxx'
            };
            const result = validateInput(CreateChannelSchema, data);
            expect(result.name).toBe('My Channel');
            expect(result.youtubeChannelId).toBe('UCxxxxxxxxxxxxxxxx');
        });

        it('should reject invalid channel ID format', () => {
            const data = {
                name: 'My Channel',
                youtubeChannelId: 'invalid channel id!'
            };
            expect(() => validateInput(CreateChannelSchema, data)).toThrow('formato inválido');
        });
    });
});
