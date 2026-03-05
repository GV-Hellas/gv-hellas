import { fail, redirect } from '@sveltejs/kit';
import { isAdminAuthenticated, validateAdminCredentials } from '$lib/server/cms-store';

export async function load({ cookies }) {
  if (isAdminAuthenticated(cookies)) {
    throw redirect(303, '/admin/events');
  }
  return {};
}

export const actions = {
  login: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = String(form.get('username') || '');
    const password = String(form.get('password') || '');

    if (!validateAdminCredentials(username, password)) {
      return fail(400, { error: 'Invalid credentials' });
    }

    cookies.set('cms_admin', '1', { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 60 * 60 * 24 });
    throw redirect(303, '/admin/events');
  },
  logout: async ({ cookies }) => {
    cookies.delete('cms_admin', { path: '/' });
    throw redirect(303, '/admin');
  }
};
