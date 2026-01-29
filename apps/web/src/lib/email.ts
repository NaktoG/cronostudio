import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const from = process.env.SMTP_FROM || 'no-reply@cronostudio.local';
  const transport = getTransport();

  if (!transport) {
    logger.warn('email.disabled', { to: message.to, subject: message.subject });
    return false;
  }

  await transport.sendMail({
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
  });

  return true;
}
