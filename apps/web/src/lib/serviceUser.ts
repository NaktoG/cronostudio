import { config } from '@/lib/config';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function resolveServiceUserId(): Promise<string | null> {
    if (config.serviceUser.id) {
        return config.serviceUser.id;
    }

    if (config.serviceUser.email) {
        const result = await query('SELECT id FROM app_users WHERE email = $1 LIMIT 1', [config.serviceUser.email]);
        if (result.rows.length > 0) {
            return result.rows[0].id as string;
        }

        logger.error('service_user.resolve.not_found', { path: 'app_users' });
        return null;
    }

    return null;
}
