import { redirect } from '@sveltejs/kit';
import { isAdminAuthenticated } from '$lib/server/cms-store';

export async function load({ url, cookies }) {
  const authenticated = isAdminAuthenticated(cookies);

  if (!authenticated && url.pathname !== '/admin') {
    throw redirect(303, '/admin');
  }

  return { authenticated };
}
