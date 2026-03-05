import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const MEDIA_DIR = path.resolve('static/uploads');
const IMAGE_SIZES = [480, 960, 1440];

async function ensureSharp() {
  try {
    const dynamicImport = new Function('m', 'return import(m)');
    const mod = await dynamicImport('sharp');
    return mod.default;
  } catch {
    return null;
  }
}

function extFromType(contentType = '') {
  if (contentType.includes('jpeg')) return 'jpg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('mp4')) return 'mp4';
  if (contentType.includes('quicktime')) return 'mov';
  return '';
}

function safeExt(name = '', fallback = 'bin') {
  const ext = path.extname(name).replace('.', '').toLowerCase();
  return ext || fallback;
}

export async function processImageUpload(file, keyPrefix = 'media') {
  if (!file || file.size === 0) return null;
  const sharp = await ensureSharp();

  await fs.mkdir(MEDIA_DIR, { recursive: true });
  const contentType = file.type || '';
  const originalExt = extFromType(contentType) || safeExt(file.name, 'bin');
  const hash = crypto.createHash('md5').update(`${keyPrefix}-${Date.now()}-${file.name}`).digest('hex').slice(0, 12);
  const baseName = `${keyPrefix}-${hash}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const originalPath = path.join(MEDIA_DIR, `${baseName}-orig.${originalExt}`);
  await fs.writeFile(originalPath, buffer);

  const jpg = [];
  const webp = [];
  if (sharp) {
    for (const width of IMAGE_SIZES) {
      try {
        const jpgPath = path.join(MEDIA_DIR, `${baseName}-${width}.jpg`);
        const webpPath = path.join(MEDIA_DIR, `${baseName}-${width}.webp`);
        await sharp(buffer, { failOn: 'none' }).resize({ width, withoutEnlargement: true }).jpeg({ quality: 84 }).toFile(jpgPath);
        await sharp(buffer, { failOn: 'none' }).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(webpPath);
        jpg.push({ width, src: `/uploads/${path.basename(jpgPath)}` });
        webp.push({ width, src: `/uploads/${path.basename(webpPath)}` });
      } catch (error) {
        console.warn(`Skipping ${width}px variant for ${file.name}`, error);
      }
    }
  }

  return {
    original: jpg[0]?.src || webp[0]?.src || `/uploads/${path.basename(originalPath)}`,
    jpg,
    webp
  };
}

export async function storeVideoUpload(file, keyPrefix = 'video') {
  if (!file || file.size === 0) return '';
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  const ext = extFromType(file.type || '') || safeExt(file.name, 'mp4');
  const hash = crypto.createHash('md5').update(`${keyPrefix}-${Date.now()}-${file.name}`).digest('hex').slice(0, 12);
  const filename = `${keyPrefix}-${hash}.${ext}`;
  const filepath = path.join(MEDIA_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);
  return `/uploads/${filename}`;
}
