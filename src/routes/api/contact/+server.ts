import {json, type RequestHandler} from '@sveltejs/kit';
import {env} from '$env/dynamic/private';
import {Resend} from 'resend';
import {z, type ZodIssue} from 'zod';
import {verifyTurnstile} from '$lib/server/turnstile';

const contactSchema = z.object({
    name: z.string().trim().min(2, 'Please enter your name.').max(120, 'Name is too long.'),
    email: z.string().trim().email('Please enter a valid email address.').max(254, 'Email address is too long.'),
    phone: z.string().trim().max(50, 'Phone number is too long.').optional().default(''),
    message: z.string().trim().min(10, 'Please enter a message with at least 10 characters.').max(5000, 'Message is too long.'),
    website: z.string().trim().max(200).optional().default(''),
    turnstileToken: z.string().trim().min(1, 'Security verification is required.').max(2048, 'Invalid security verification token.'),
    turnstileAction: z.enum(['contact_form', 'sponsor_inquiry']).optional().default('contact_form')
});

type ContactPayload = z.infer<typeof contactSchema>;
type RateLimitBucket = {count: number; resetAt: number};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimits = new Map<string, RateLimitBucket>();

function issuePath(issue: ZodIssue) {
    return issue.path.join('.');
}

function mapIssues(issues: ZodIssue[]) {
    return issues.reduce<Record<string, string>>((acc, issue) => {
        const path = issuePath(issue);
        if (!acc[path]) acc[path] = issue.message;
        return acc;
    }, {});
}

function isRateLimited(ip: string) {
    const now = Date.now();
    const current = rateLimits.get(ip);

    if (!current || current.resetAt <= now) {
        rateLimits.set(ip, {count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS});
        return false;
    }

    current.count += 1;
    rateLimits.set(ip, current);
    return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function messageTitle(data: ContactPayload) {
    return data.turnstileAction === 'sponsor_inquiry'
        ? 'New sponsorship inquiry from Griechischer Verein Hellas'
        : 'New contact form message from Griechischer Verein Hellas';
}

function buildTextEmail(data: ContactPayload) {
    return [
        messageTitle(data),
        '',
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone || '-'}`,
        '',
        'Message:',
        data.message
    ].join('\n');
}

function buildHtmlEmail(data: ContactPayload) {
    const name = escapeHtml(data.name);
    const email = escapeHtml(data.email);
    const phone = escapeHtml(data.phone || '-');
    const message = escapeHtml(data.message).replaceAll('\n', '<br>');

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
            <h2>${escapeHtml(messageTitle(data))}</h2>
            <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
                <tr><td><strong>Name</strong></td><td>${name}</td></tr>
                <tr><td><strong>Email</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td><strong>Phone</strong></td><td>${phone}</td></tr>
            </table>
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e5e7eb;" />
            <p><strong>Message</strong></p>
            <p>${message}</p>
        </div>
    `;
}

function getRecipients() {
    return (env.CONTACT_TO_EMAIL || 'info@gv-hellas.ch')
        .split(',')
        .map((email: string) => email.trim())
        .filter(Boolean);
}

export const POST: RequestHandler = async ({request, getClientAddress, url}) => {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return json({ok: false, message: 'Invalid request body.'}, {status: 400});
    }

    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
        return json(
            {
                ok: false,
                message: 'Please check the highlighted fields.',
                fieldErrors: mapIssues(parsed.error.issues)
            },
            {status: 400}
        );
    }

    const data = parsed.data;

    if (data.website) return json({ok: true});

    const ip = getClientAddress();

    if (isRateLimited(ip)) {
        return json({ok: false, message: 'Too many messages. Please try again later.'}, {status: 429});
    }

    const turnstile = await verifyTurnstile({
        token: data.turnstileToken,
        remoteIp: ip,
        expectedHostname: url.hostname,
        expectedAction: data.turnstileAction
    });

    if (!turnstile.ok) {
        if (turnstile.status === 500) console.error(turnstile.reason);

        return json(
            {
                ok: false,
                code: turnstile.code,
                message: 'Security verification failed. Please try again.'
            },
            {status: turnstile.status}
        );
    }

    if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) {
        console.error('Contact email delivery is not configured');
        return json({ok: false, message: 'Email delivery is not configured.'}, {status: 500});
    }

    const recipients = getRecipients();

    if (!recipients.length) {
        console.error('Missing CONTACT_TO_EMAIL');
        return json({ok: false, message: 'Email recipient is not configured.'}, {status: 500});
    }

    const resend = new Resend(env.RESEND_API_KEY);

    try {
        const {error} = await resend.emails.send({
            from: env.CONTACT_FROM_EMAIL,
            to: recipients,
            replyTo: data.email,
            subject: data.turnstileAction === 'sponsor_inquiry'
                ? `Sponsorship inquiry: ${data.name}`
                : `Griechischer Verein Hellas contact form: ${data.name}`,
            text: buildTextEmail(data),
            html: buildHtmlEmail(data)
        });

        if (error) {
            console.error('Resend error:', error);
            return json({ok: false, message: 'The message could not be sent. Please try again later.'}, {status: 502});
        }

        return json({ok: true});
    } catch (error) {
        console.error('Contact email error:', error);
        return json({ok: false, message: 'The message could not be sent. Please try again later.'}, {status: 502});
    }
};
