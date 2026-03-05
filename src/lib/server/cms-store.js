import fs from 'node:fs/promises';
import path from 'node:path';

const CMS_DATA_PATH = path.resolve('data/cms.json');

const empty = {
  events: [],
  links: [],
  businesses: [],
  gallery: []
};

export async function readCMS() {
  try {
    const raw = await fs.readFile(CMS_DATA_PATH, 'utf-8');
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export async function writeCMS(data) {
  await fs.writeFile(CMS_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function isAdminAuthenticated(cookies) {
  return cookies.get('cms_admin') === '1';
}

export function validateAdminCredentials(username, password) {
  const envUser = process.env.CMS_ADMIN_USER || 'admin';
  const envPass = process.env.CMS_ADMIN_PASSWORD || 'admin123';
  return username === envUser && password === envPass;
}
