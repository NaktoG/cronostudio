import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';

const userRepository = new PostgresUserRepository();

export async function GET(request: NextRequest) {
  const payload = getAuthUser(request);
  if (!payload) {
    return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
  }

  const user = await userRepository.findById(payload.userId);
  if (!user) {
    return withSecurityHeaders(NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 }));
  }

  return withSecurityHeaders(
    NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  );
}
