import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucket = process.env.CLOUDFLARE_R2_BUCKET;
const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

if (!accountId) throw new Error('CLOUDFLARE_R2_ACCOUNT_ID is not set');
if (!accessKeyId) throw new Error('CLOUDFLARE_R2_ACCESS_KEY_ID is not set');
if (!secretAccessKey) throw new Error('CLOUDFLARE_R2_SECRET_ACCESS_KEY is not set');
if (!bucket) throw new Error('CLOUDFLARE_R2_BUCKET is not set');
if (!publicBaseUrl) throw new Error('CLOUDFLARE_R2_PUBLIC_BASE_URL is not set');

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
});

function encodeObjectPath(key: string) {
    return key
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/');
}

export function publicR2Url(key: string) {
    // @ts-ignore
    return `${publicBaseUrl.replace(/\/$/, '')}/${encodeObjectPath(key)}`;
}

export async function uploadToR2(input: {
    key: string;
    file: File;
    cacheControl?: string;
}) {
    const body = new Uint8Array(await input.file.arrayBuffer());

    await r2.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: input.key,
            Body: body,
            ContentType: input.file.type || 'application/octet-stream',
            CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable'
        })
    );

    return {
        url: publicR2Url(input.key),
        key: input.key
    };
}