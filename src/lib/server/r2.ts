import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {env} from '$env/dynamic/private';

let r2: S3Client | null = null;

function required(value: string | undefined, name: string) {
    if (!value) {
        throw new Error(`${name} is not set`);
    }

    return value;
}

function getR2Config() {
    return {
        accountId: required(env.CLOUDFLARE_R2_ACCOUNT_ID, 'CLOUDFLARE_R2_ACCOUNT_ID'),
        accessKeyId: required(env.CLOUDFLARE_R2_ACCESS_KEY_ID, 'CLOUDFLARE_R2_ACCESS_KEY_ID'),
        secretAccessKey: required(env.CLOUDFLARE_R2_SECRET_ACCESS_KEY, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
        bucket: required(env.CLOUDFLARE_R2_BUCKET, 'CLOUDFLARE_R2_BUCKET'),
        publicBaseUrl: required(env.CLOUDFLARE_R2_PUBLIC_BASE_URL, 'CLOUDFLARE_R2_PUBLIC_BASE_URL')
    };
}

function getR2Client() {
    const config = getR2Config();

    if (!r2) {
        r2 = new S3Client({
            region: 'auto',
            endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
            forcePathStyle: true,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey
            }
        });
    }

    return {
        client: r2,
        bucket: config.bucket,
        publicBaseUrl: config.publicBaseUrl
    };
}

function encodeObjectPath(key: string) {
    return key
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/');
}

export function publicR2Url(key: string) {
    const {publicBaseUrl} = getR2Config();

    return `${publicBaseUrl.replace(/\/$/, '')}/${encodeObjectPath(key)}`;
}

export async function uploadToR2(input: {
    key: string;
    file: File;
    cacheControl?: string;
}) {
    const {client, bucket, publicBaseUrl} = getR2Client();

    const body = new Uint8Array(await input.file.arrayBuffer());

    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: input.key,
            Body: body,
            ContentType: input.file.type || 'application/octet-stream',
            CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable'
        })
    );

    return {
        url: `${publicBaseUrl.replace(/\/$/, '')}/${encodeObjectPath(input.key)}`,
        key: input.key
    };
}