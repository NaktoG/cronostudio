import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { requireRoles } from '@/middleware/rbac';
import { API_RATE_LIMIT, rateLimit } from '@/middleware/rateLimit';

export const dynamic = 'force-dynamic';

const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionKey: z.string().max(120).optional(),
});

function getGatewayUrl(): string {
  return config.assistant.gatewayUrl.replace(/\/$/, '');
}

function buildSessionKey(userId: string, provided?: string): string {
  const suffix = provided && provided.trim().length > 0 ? provided.trim() : 'default';
  return `cronostudio:${userId}:${suffix}`;
}

export const POST = requireRoles(['owner', 'collaborator'])(
  rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
      if (!config.assistant.enabled) {
        return withSecurityHeaders(
          NextResponse.json({ error: 'assistant_disabled' }, { status: 503 })
        );
      }

      if (!config.assistant.gatewayToken) {
        logger.error('assistant.chat.missing_gateway_token');
        return withSecurityHeaders(
          NextResponse.json({ error: 'assistant_not_configured' }, { status: 503 })
        );
      }

      const authUser = await getAuthUser(request);
      if (!authUser) {
        return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
      }

      const parsed = ChatSchema.safeParse(await request.json());
      if (!parsed.success) {
        return withSecurityHeaders(
          NextResponse.json({ error: 'invalid_request', details: parsed.error.flatten() }, { status: 400 })
        );
      }

      const { message, sessionKey } = parsed.data;
      const gatewayResponse = await fetch(`${getGatewayUrl()}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.assistant.gatewayToken}`,
          'x-openclaw-message-channel': 'webchat',
        },
        body: JSON.stringify({
          model: 'openclaw/default',
          user: buildSessionKey(authUser.userId, sessionKey),
          messages: [{ role: 'user', content: message }],
          stream: false,
        }),
      });

      if (!gatewayResponse.ok) {
        const raw = await gatewayResponse.text();
        logger.warn('assistant.chat.gateway_error', {
          status: gatewayResponse.status,
          body: raw.slice(0, 500),
          userId: authUser.userId,
        });
        return withSecurityHeaders(
          NextResponse.json({ error: 'assistant_gateway_error' }, { status: 502 })
        );
      }

      const payload = await gatewayResponse.json() as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const reply = payload.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        return withSecurityHeaders(
          NextResponse.json({ error: 'assistant_empty_response' }, { status: 502 })
        );
      }

      return withSecurityHeaders(
        NextResponse.json({
          reply,
          sessionKey: sessionKey || 'default',
        })
      );
    } catch (error) {
      logger.error('assistant.chat.unhandled_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return withSecurityHeaders(NextResponse.json({ error: 'assistant_unavailable' }, { status: 500 }));
    }
  })
);
