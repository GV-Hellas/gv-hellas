import {env} from '$env/dynamic/private';
import type {Cookies} from '@sveltejs/kit';

export {listLinks} from '$lib/server/cms/linkStore';
export {listBusinesses} from '$lib/server/cms/businessStore';

export function isAdminAuthenticated(cookies: Cookies): boolean {
    return cookies.get('cms_admin') === '1';
}

export function validateAdminCredentials(username: string, password: string): boolean {
    const envUser = env.CMS_ADMIN_USER || 'admin';
    const envPass = env.CMS_ADMIN_PASSWORD || 'admin123';
    return username === envUser && password === envPass;
}
