// lib/validation.ts
// Input validation utilities with Zod

import { z } from 'zod';

// Schema para crear un canal
export const CreateChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Nombre requerido')
    .max(255, 'Nombre muy largo')
    .trim(),
  youtubeChannelId: z
    .string()
    .min(1, 'Channel ID requerido')
    .max(100, 'Channel ID inválido')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Channel ID con formato inválido'),
  refreshToken: z
    .string()
    .optional()
    .nullable(),
});

export type CreateChannelInput = z.infer<typeof CreateChannelSchema>;

// Schema para query parameters
export const ChannelQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  userId: z.string().uuid().optional(),
});

export type ChannelQueryInput = z.infer<typeof ChannelQuerySchema>;

// ==========================================
// Auth Schemas
// ==========================================

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email muy largo')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Contraseña debe tener al menos 6 caracteres')
    .max(100, 'Contraseña muy larga'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email muy largo')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Contraseña debe tener al menos 8 caracteres')
    .max(100, 'Contraseña muy larga')
    .regex(/[A-Z]/, 'Contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Contraseña debe contener al menos un número'),
  name: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre muy largo')
    .trim(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ==========================================
// Video Schemas
// ==========================================

export const CreateVideoSchema = z.object({
  channelId: z.string().uuid('ID de canal inválido'),
  youtubeVideoId: z
    .string()
    .min(1, 'Video ID requerido')
    .max(50, 'Video ID inválido')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Video ID con formato inválido'),
  title: z
    .string()
    .min(1, 'Título requerido')
    .max(500, 'Título muy largo')
    .trim(),
  description: z.string().optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
});

export type CreateVideoInput = z.infer<typeof CreateVideoSchema>;

export const UpdateVideoSchema = z.object({
  title: z.string().min(1).max(500).trim().optional(),
  description: z.string().optional().nullable(),
  views: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
});

export type UpdateVideoInput = z.infer<typeof UpdateVideoSchema>;

// Función helper para validar
export function validateInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Validation error: ${errors.join(', ')}`);
  }
  return result.data;
}

