import { NextResponse } from 'next/server';

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
 * @returns {Array<Channel>} Lista de canales
 *
 * TODO: Conectar a PostgreSQL cuando esté el schema definido
 * TODO: Agregar autenticación de usuario
 */
export async function GET() {
  try {
    // Por ahora retorna mock data
    // Estructura esperada desde BD:
    // SELECT id, name, subscribers, last_video_date FROM channels WHERE user_id = ?

    return NextResponse.json(mockChannels, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching channels:', error);

    return NextResponse.json(
      {
        error: 'Error al obtener canales',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels
 * Crea un nuevo canal configurado
 * Estructura esperada en body:
 * {
 *   name: string,
 *   youtubeChannelId: string,
 *   refreshToken: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validación básica
    if (!body.name || !body.youtubeChannelId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: name, youtubeChannelId',
        },
        { status: 400 }
      );
    }

    // TODO: Guardar en PostgreSQL vía INSERT
    // TODO: Llamar a n8n workflow para validar credenciales
    // TODO: Encriptar y guardar refresh token

    return NextResponse.json(
      {
        message: 'Canal creado (mock)',
        channel: {
          id: `ch_${Date.now()}`,
          ...body,
          subscribers: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating channel:', error);

    return NextResponse.json(
      {
        error: 'Error al crear canal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
