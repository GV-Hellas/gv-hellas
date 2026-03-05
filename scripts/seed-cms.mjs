import fs from 'node:fs/promises';

const WP_BASE = process.env.WP_BASE_URL || 'https://gv-hellas.ch/wp-json/wp/v2';

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return res.json();
}

async function run() {
  const [posts, media] = await Promise.all([
    fetchJson(`${WP_BASE}/posts?per_page=100&_embed=1&status=publish`),
    fetchJson(`${WP_BASE}/media?per_page=100&media_type=image`)
  ]);

  const events = posts.map((post) => ({
    slug: post.slug,
    title: { el: stripHtml(post?.title?.rendered), de: stripHtml(post?.title?.rendered) },
    date: post.date,
    excerpt: { el: stripHtml(post?.excerpt?.rendered), de: stripHtml(post?.excerpt?.rendered) },
    image: post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
    content: { el: post?.content?.rendered || '', de: post?.content?.rendered || '' }
  }));

  const gallery = media
    .filter((m) => m?.source_url)
    .map((item) => ({
      id: `g-${item.id}`,
      type: 'image',
      src: item.source_url,
      alt: item.alt_text || stripHtml(item?.title?.rendered) || 'GV Hellas'
    }));

  const current = JSON.parse(await fs.readFile('data/cms.json', 'utf-8'));
  const seeded = { ...current, events, gallery };

  await fs.writeFile('data/cms.json', JSON.stringify(seeded, null, 2), 'utf-8');
  console.log(`Seeded CMS with ${events.length} events and ${gallery.length} gallery items.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
