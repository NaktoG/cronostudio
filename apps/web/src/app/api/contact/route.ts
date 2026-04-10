import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { withSecurityHeaders } from '@/middleware/auth';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
  website: z.string().optional(),
});

function renderTemplate(data: z.infer<typeof ContactSchema>) {
  return `Nueva consulta desde CronoStudio\n\nNombre: ${data.name}\nEmail: ${data.email}\n\nMensaje:\n${data.message}`;
}

export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, string> = {};

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries()) as Record<string, string>;
    }

    const data = ContactSchema.parse(payload);
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.redirect(new URL('/contacto?sent=1', request.url));
    }
    const to = process.env.CONTACT_EMAIL || 'support@cronostudio.com';

    const delivered = await sendEmail({
      to,
      subject: `Consulta desde CronoStudio — ${data.name}`,
      text: renderTemplate(data),
      html: renderTemplate(data).replace(/\n/g, '<br/>'),
    });

    if (!delivered) {
      logger.warn('contact.email_disabled', { to, email: data.email });
    }

    if (contentType.includes('text/html') || contentType.includes('application/x-www-form-urlencoded')) {
      return NextResponse.redirect(new URL('/contacto?sent=1', request.url));
    }

    return withSecurityHeaders(NextResponse.json({ ok: true, delivered }));
  } catch (error) {
    logger.error('contact.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'No se pudo enviar el mensaje' }, { status: 400 }));
  }
});
