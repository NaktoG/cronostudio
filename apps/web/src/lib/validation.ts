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

// Función helper para validar
export function validateInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Validation error: ${errors.join(', ')}`);
  }
  return result.data;
}
