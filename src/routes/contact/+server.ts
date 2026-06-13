import {json, type RequestHandler} from '@sveltejs/kit';
// @ts-ignore
import {env} from '$env/dynamic/private';
import {Resend} from 'resend';
import {z, type ZodIssue} from 'zod';

const contactSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Please enter your name.')
        .max(120, 'Name is too long.'),

    email: z
        .string()
        .trim()
        .email('Please enter a valid email address.')
        .max(254, 'Email address is too long.'),

    phone: z
        .string()
        .trim()
        .max(50, 'Phone number is too long.')
        .optional()
        .default(''),

    message: z
        .string()
        .trim()
        .min(10, 'Please enter a message with at least 10 characters.')
        .max(5000, 'Message is too long.'),

    // Honeypot field. Real users should never fill this.
    website: z
        .string()
        .trim()
        .max(200)
        .optional()
        .default('')
});

type ContactPayload = z.infer<typeof contactSchema>;

type RateLimitBucket = {
    count: number;
    resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const rateLimits = new Map<string, RateLimitBucket>();

function issuePath(issue: ZodIssue) {
    return issue.path.join('.');
}

function mapIssues(issues: ZodIssue[]) {
    return issues.reduce<Record<string, string>>((acc, issue) => {
        const path = issuePath(issue);

        if (!acc[path]) {
            acc[path] = issue.message;
        }

        return acc;
    }, {});
}

function isRateLimited(ip: string) {
    const now = Date.now();
    const current = rateLimits.get(ip);

    if (!current || current.resetAt <= now) {
        rateLimits.set(ip, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS
        });

        return false;
    }

    current.count += 1;

    if (current.count > RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    rateLimits.set(ip, current);

    return false;
}

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function buildTextEmail(data: ContactPayload) {
    return [
        'New contact form message from GV Hellas',
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
            <h2>New contact form message from GV Hellas</h2>

            <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                    <td><strong>Name</strong></td>
                    <td>${name}</td>
                </tr>
                <tr>
                    <td><strong>Email</strong></td>
                    <td><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                    <td><strong>Phone</strong></td>
                    <td>${phone}</td>
                </tr>
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

export const POST: RequestHandler = async ({request, getClientAddress}) => {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return json(
            {
                ok: false,
                message: 'Invalid request body.'
            },
            {status: 400}
        );
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

    // Honeypot: if filled, pretend success but do not send.
    if (data.website) {
        return json({ok: true});
    }

    const ip = getClientAddress();

    if (isRateLimited(ip)) {
        return json(
            {
                ok: false,
                message: 'Too many messages. Please try again later.'
            },
            {status: 429}
        );
    }

    if (!env.RESEND_API_KEY) {
        console.error('Missing RESEND_API_KEY');

        return json(
            {
                ok: false,
                message: 'Email delivery is not configured.'
            },
            {status: 500}
        );
    }

    if (!env.CONTACT_FROM_EMAIL) {
        console.error('Missing CONTACT_FROM_EMAIL');

        return json(
            {
                ok: false,
                message: 'Email sender is not configured.'
            },
            {status: 500}
        );
    }

    const recipients = getRecipients();

    if (!recipients.length) {
        console.error('Missing CONTACT_TO_EMAIL');

        return json(
            {
                ok: false,
                message: 'Email recipient is not configured.'
            },
            {status: 500}
        );
    }

    const resend = new Resend(env.RESEND_API_KEY);

    try {
        const {error} = await resend.emails.send({
            from: env.CONTACT_FROM_EMAIL,
            to: recipients,
            replyTo: data.email,
            subject: `GV Hellas contact form: ${data.name}`,
            text: buildTextEmail(data),
            html: buildHtmlEmail(data)
        });

        if (error) {
            console.error('Resend error:', error);

            return json(
                {
                    ok: false,
                    message: 'The message could not be sent. Please try again later.'
                },
                {status: 502}
            );
        }

        return json({ok: true});
    } catch (error) {
        console.error('Contact email error:', error);

        return json(
            {
                ok: false,
                message: 'The message could not be sent. Please try again later.'
            },
            {status: 502}
        );
    }
};