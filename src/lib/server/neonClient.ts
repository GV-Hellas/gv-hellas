import {env} from '$env/dynamic/private';
import {neon} from '@neondatabase/serverless';

let client: ReturnType<typeof neon> | null = null;

export function getSql() {
    if (client) return client;

    const databaseUrl = env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    client = neon(databaseUrl);
    return client;
}
