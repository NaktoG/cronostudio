// middleware/rateLimit.ts
// Rate limiting middleware

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

// Simple in-memory store for development
// In production, use Redis
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 * Limit requests per IP per time window
 */
export function rateLimit(config: RateLimitConfig) {
  return (handler: Function) => {
    return async (request: NextRequest, ...args: any[]) => {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';

      const now = Date.now();
      const record = requestCounts.get(ip);

      if (record && now < record.resetTime) {
        // Window still active
        if (record.count >= config.maxRequests) {
          return NextResponse.json(
            {
              error: 'Too Many Requests',
              message: 'Rate limit exceeded. Try again later.',
            },
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
              },
            }
          );
        }
        record.count++;
      } else {
        // New window
        requestCounts.set(ip, {
          count: 1,
          resetTime: now + config.windowMs,
        });
      }

      const response = await handler(request, ...args);
      return response;
    };
  };
}

// Presets
export const API_RATE_LIMIT = { maxRequests: 100, windowMs: 15 * 60 * 1000 }; // 100 per 15 min
export const LOGIN_RATE_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 }; // 5 per 15 min
export const FILE_UPLOAD_RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 }; // 10 per hour
