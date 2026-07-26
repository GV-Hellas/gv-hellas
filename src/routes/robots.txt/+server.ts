import type {RequestHandler} from './$types';

export const GET: RequestHandler = async () => {
    return new Response(
        [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /api',
            '',
            'Sitemap: https://gv-hellas.ch/sitemap.xml',
            ''
        ].join('\n'),
        {
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'public, max-age=3600',
                'vercel-cdn-cache-control': 'public, max-age=86400, stale-while-revalidate=604800'
            }
        }
    );
};
