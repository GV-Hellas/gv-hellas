import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const WP_BASE = process.env.WP_BASE_URL || 'https://gv-hellas.ch/wp-json/wp/v2';
const MEDIA_DIR = path.resolve('static/uploads');
const SIZES = [480, 960, 1440];

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extensionFromContentType(contentType = '') {
  if (contentType.includes('jpeg')) return 'jpg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('avif')) return 'avif';
  if (contentType.includes('heic') || contentType.includes('heif')) return 'heic';
  return '';
}

function extensionFromUrl(url = '') {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase().replace('.', '');
    return ext || '';
  } catch {
    return '';
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return res.json();
}

async function downloadAsset(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed media ${res.status} ${url}`);

  const contentType = res.headers.get('content-type') || '';
  const arr = await res.arrayBuffer();

  return {
    buffer: Buffer.from(arr),
    contentType
  };
}

async function ensureSharp() {
  try {
    const mod = await import('sharp');
    return mod.default;
  } catch {
    throw new Error('sharp is required for image processing. Install with: npm i -D sharp');
  }
}

async function createVariants(sharp, sourceUrl) {
  if (!sourceUrl) return { original: '', jpg: [], webp: [] };

  const hash = crypto.createHash('md5').update(sourceUrl).digest('hex').slice(0, 10);
  const baseName = `img-${hash}`;

  await fs.mkdir(MEDIA_DIR, { recursive: true });

  const { buffer, contentType } = await downloadAsset(sourceUrl);
  const ext = extensionFromContentType(contentType) || extensionFromUrl(sourceUrl) || 'bin';
  const originalRawPath = path.join(MEDIA_DIR, `${baseName}-orig.${ext}`);
  await fs.writeFile(originalRawPath, buffer);

  const fallbackOriginal = `/uploads/${path.basename(originalRawPath)}`;

  // Conversion can fail for unsupported/corrupt media (e.g. some HEIF variants).
  // In that case we still keep the original local file and skip responsive variants.
  let image;
  try {
    image = sharp(buffer, { failOn: 'none' });
    await image.metadata();
  } catch (error) {
    console.warn(`Skipping variant generation for ${sourceUrl}: ${error.message}`);
    return { original: fallbackOriginal, jpg: [], webp: [] };
  }

  const jpg = [];
  const webp = [];

  for (const size of SIZES) {
    try {
      const jpgPath = path.join(MEDIA_DIR, `${baseName}-${size}.jpg`);
      const webpPath = path.join(MEDIA_DIR, `${baseName}-${size}.webp`);

      await sharp(buffer, { failOn: 'none' }).resize({ width: size, withoutEnlargement: true }).jpeg({ quality: 84 }).toFile(jpgPath);
      await sharp(buffer, { failOn: 'none' }).resize({ width: size, withoutEnlargement: true }).webp({ quality: 82 }).toFile(webpPath);

      jpg.push({ width: size, src: `/uploads/${path.basename(jpgPath)}` });
      webp.push({ width: size, src: `/uploads/${path.basename(webpPath)}` });
    } catch (error) {
      console.warn(`Variant ${size}px failed for ${sourceUrl}: ${error.message}`);
    }
  }

  const preferredOriginal = jpg[0]?.src || webp[0]?.src || fallbackOriginal;

  return {
    original: preferredOriginal,
    jpg,
    webp
  };
}

async function run() {
  const sharp = await ensureSharp();

  const [posts, media] = await Promise.all([
    fetchJson(`${WP_BASE}/posts?per_page=100&_embed=1&status=publish`),
    fetchJson(`${WP_BASE}/media?per_page=100&media_type=image`)
  ]);

  const events = [];
  for (const post of posts) {
    const src = post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
    const variants = await createVariants(sharp, src);
    events.push({
      slug: post.slug,
      title: { el: stripHtml(post?.title?.rendered), de: stripHtml(post?.title?.rendered) },
      date: post.date,
      excerpt: { el: stripHtml(post?.excerpt?.rendered), de: stripHtml(post?.excerpt?.rendered) },
      image: variants.original,
      imageVariants: { jpg: variants.jpg, webp: variants.webp },
      content: { el: post?.content?.rendered || '', de: post?.content?.rendered || '' },
      mediaBlocks: []
    });
  }

  const gallery = [];
  for (const item of media.filter((m) => m?.source_url)) {
    const variants = await createVariants(sharp, item.source_url);
    gallery.push({
      id: `g-${item.id}`,
      type: 'image',
      src: variants.original,
      srcVariants: { jpg: variants.jpg, webp: variants.webp },
      alt: item.alt_text || stripHtml(item?.title?.rendered) || 'Griechischer Verein Hellas',
      tags: []
    });
  }

  const current = JSON.parse(await fs.readFile('data/cms.json', 'utf-8'));
  const seeded = { ...current, events, gallery };
  await fs.writeFile('data/cms.json', JSON.stringify(seeded, null, 2), 'utf-8');

  console.log(`Seeded CMS JSON with ${events.length} events and ${gallery.length} gallery items + local image variants.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
