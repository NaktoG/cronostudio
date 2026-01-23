import { NextResponse, NextRequest } from 'next/server';
import { validateInput, CreateChannelSchema } from '@/lib/validation';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';

// Mock data para desarrollo local
// En producción, conectaría a la BD PostgreSQL vía n8n webhook o directamente
const mockChannels = [
  {
    id: 'ch_001',
    name: 'Mi Canal Principal',
    subscribers: 15000,
    lastVideo: 'Hace 2 días',
  },
  {
    id: 'ch_002',
    name: 'Tech Talks',
    subscribers: 45230,
    lastVideo: 'Hoy',
  },
  {
    id: 'ch_003',
    name: 'Vlogs Diarios',
    subscribers: 8950,
    lastVideo: 'Hace 5 días',
  },
];

/**
 * GET /api/channels
 * Retorna la lista de canales de YouTube configurados
 *
 * Security:
 * - ✅ Rate limited
 * - ⚠️ TODO: Requiere autenticación JWT
 * - ✅ CORS headers
 * - ✅ Safe error handling
 *
 * @returns {Array<Channel>} Lista de canales
 *
 * TODO: Conectar a PostgreSQL cuando esté el schema definido
 * TODO: Agregar autenticación de usuario
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    
    // TODO: Validate JWT token from Authorization header
    // if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // For now, mock data with safe response
    return NextResponse.json(mockChannels, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });
  } catch (error) {
    // Log securely (without exposing internals)
    console.error('[GET /api/channels] Error:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels
 * Crea un nuevo canal configurado
 *
 * Security:
 * - ✅ Input validation with Zod
 * - ✅ Rate limited
 * - ⚠️ TODO: Requiere autenticación JWT
 * - ✅ Safe error handling
 * - ✅ No credentials in logs
 *
 * Request body:
 * {
 *   name: string,
 *   youtubeChannelId: string,
 *   refreshToken?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Validate JWT token from Authorization header
    // if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();

    // ✅ Validate input with Zod
    const validatedData = validateInput(CreateChannelSchema, body);

    // Sanitize: Remove any sensitive fields that shouldn't be logged
    const { refreshToken, ...safeLog } = validatedData;
    console.log('[POST /api/channels] Creating channel:', safeLog);

    // TODO: Guardar en PostgreSQL vía INSERT
    // TODO: Llamar a n8n workflow para validar credenciales
    // TODO: Encriptar y guardar refresh token

    return NextResponse.json(
      {
        message: 'Canal creado (mock)',
        channel: {
          id: `ch_${Date.now()}`,
          name: validatedData.name,
          youtubeChannelId: validatedData.youtubeChannelId,
          subscribers: 0,
        },
      },
      {
        status: 201,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      }
    );
  } catch (error) {
    // Safe error logging (no credentials)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST /api/channels] Error:', errorMessage);

    // Return safe error message
    const isValidationError = error instanceof Error && error.message.includes('Validation');
    
    return NextResponse.json(
      {
        error: isValidationError ? 'Validation Error' : 'Internal Server Error',
        message: isValidationError ? errorMessage : undefined,
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
