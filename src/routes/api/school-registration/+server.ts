import {json, type RequestHandler} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';
import {Resend} from 'resend';
import {z} from 'zod';
import {verifyTurnstile} from '$lib/server/turnstile';

const schema = z.object({
    parentName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(50).optional().default(''),
    childName: z.string().trim().min(2).max(120),
    childBirthDate: z.string().trim().min(1).max(20),
    languageLevel: z.string().trim().max(120).optional().default(''),
    message: z.string().trim().max(3000).optional().default(''),
    website: z.string().trim().max(200).optional().default(''),
    turnstileToken: z.string().trim().min(1).max(2048)
});

type Registration = z.infer<typeof schema>;
type RateBucket = {count: number; resetAt: number};

const rateLimits = new Map<string, RateBucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

function rateLimited(ip: string) {
    const now = Date.now();
    const current = rateLimits.get(ip);

    if (!current || current.resetAt <= now) {
        rateLimits.set(ip, {count: 1, resetAt: now + WINDOW_MS});
        return false;
    }

    current.count += 1;
    return current.count > MAX_REQUESTS;
}

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function recipients() {
    return (env.CONTACT_TO_EMAIL || 'info@gv-hellas.ch')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}

function textBody(data: Registration) {
    return [
        'New Greek school registration inquiry',
        '',
        `Parent / guardian: ${data.parentName}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone || '-'}`,
        `Child: ${data.childName}`,
        `Birth date: ${data.childBirthDate}`,
        `Greek language level: ${data.languageLevel || '-'}`,
        '',
        'Additional information:',
        data.message || '-'
    ].join('\n');
}

function htmlBody(data: Registration) {
    const rows = [
        ['Parent / guardian', data.parentName],
        ['Email', data.email],
        ['Phone', data.phone || '-'],
        ['Child', data.childName],
        ['Birth date', data.childBirthDate],
        ['Greek language level', data.languageLevel || '-']
    ];

    return `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
            <h2>New Greek school registration inquiry</h2>
            <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
                ${rows.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join('')}
            </table>
            <hr style="margin:20px 0;border:0;border-top:1px solid #e5e7eb" />
            <p><strong>Additional information</strong></p>
            <p>${escapeHtml(data.message || '-').replaceAll('\n', '<br>')}</p>
        </div>
    `;
}

export const POST: RequestHandler = async ({request, getClientAddress, url}) => {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return json({ok: false, message: 'Invalid request body.'}, {status: 400});
    }

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        return json({ok: false, message: 'Please check the registration form.'}, {status: 400});
    }

    const data = parsed.data;

    if (data.website) return json({ok: true});

    const ip = getClientAddress();

    if (rateLimited(ip)) {
        return json({ok: false, message: 'Too many requests. Please try again later.'}, {status: 429});
    }

    const turnstile = await verifyTurnstile({
        token: data.turnstileToken,
        remoteIp: ip,
        expectedHostname: url.hostname,
        expectedAction: 'school_registration'
    });

    if (!turnstile.ok) {
        if (turnstile.status === 500) console.error(turnstile.reason);
        return json({ok: false, code: turnstile.code, message: 'Security verification failed.'}, {status: turnstile.status});
    }

    if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) {
        console.error('School registration email delivery is not configured');
        return json({ok: false, message: 'Email delivery is not configured.'}, {status: 500});
    }

    const to = recipients();

    if (!to.length) {
        return json({ok: false, message: 'Email recipient is not configured.'}, {status: 500});
    }

    try {
        const resend = new Resend(env.RESEND_API_KEY);
        const {error} = await resend.emails.send({
            from: env.CONTACT_FROM_EMAIL,
            to,
            replyTo: data.email,
            subject: `Greek school registration: ${data.childName}`,
            text: textBody(data),
            html: htmlBody(data)
        });

        if (error) {
            console.error('School registration Resend error:', error);
            return json({ok: false, message: 'The registration could not be sent.'}, {status: 502});
        }

        return json({ok: true});
    } catch (error) {
        console.error('School registration email error:', error);
        return json({ok: false, message: 'The registration could not be sent.'}, {status: 502});
    }
};
