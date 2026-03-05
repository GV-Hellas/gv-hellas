import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const WP_BASE = process.env.WP_BASE_URL || 'https://gv-hellas.ch/wp-json/wp/v2';
const MEDIA_DIR = path.resolve('static/uploads');
const SIZES = [480, 960, 1440];

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return res.json();
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed media ${res.status} ${url}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
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
  const buf = await downloadBuffer(sourceUrl);

  await fs.mkdir(MEDIA_DIR, { recursive: true });
  const originalPath = path.join(MEDIA_DIR, `${baseName}-orig.jpg`);
  await sharp(buf).jpeg({ quality: 92 }).toFile(originalPath);

  const jpg = [];
  const webp = [];
  for (const size of SIZES) {
    const jpgPath = path.join(MEDIA_DIR, `${baseName}-${size}.jpg`);
    const webpPath = path.join(MEDIA_DIR, `${baseName}-${size}.webp`);
    await sharp(buf).resize({ width: size, withoutEnlargement: true }).jpeg({ quality: 84 }).toFile(jpgPath);
    await sharp(buf).resize({ width: size, withoutEnlargement: true }).webp({ quality: 82 }).toFile(webpPath);
    jpg.push({ width: size, src: `/uploads/${path.basename(jpgPath)}` });
    webp.push({ width: size, src: `/uploads/${path.basename(webpPath)}` });
  }

  return {
    original: `/uploads/${path.basename(originalPath)}`,
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
      alt: item.alt_text || stripHtml(item?.title?.rendered) || 'GV Hellas',
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
