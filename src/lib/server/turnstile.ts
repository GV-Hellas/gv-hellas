import {env} from '$env/dynamic/private';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

type TurnstileResult = {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    action?: string;
    'error-codes'?: string[];
};

export type TurnstileVerification =
    | {ok: true}
    | {
          ok: false;
          status: number;
          code: 'captcha_unconfigured' | 'captcha_unavailable' | 'captcha_expired' | 'captcha_failed';
          reason: string;
      };

export async function verifyTurnstile(input: {
    token: string;
    remoteIp: string;
    expectedHostname: string;
    expectedAction: string;
}): Promise<TurnstileVerification> {
    const secret = (env.TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY)?.trim();

    if (!secret) {
        return {
            ok: false,
            status: 500,
            code: 'captcha_unconfigured',
            reason: 'Missing TURNSTILE_SECRET'
        };
    }

    const formData = new FormData();
    formData.set('secret', secret);
    formData.set('response', input.token);
    formData.set('remoteip', input.remoteIp);
    formData.set('idempotency_key', crypto.randomUUID());

    let verification: TurnstileResult;

    try {
        const response = await fetch(TURNSTILE_VERIFY_URL, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error(`Turnstile Siteverify returned HTTP ${response.status}`);
        }

        verification = (await response.json()) as TurnstileResult;
    } catch (error) {
        console.error('Turnstile validation request failed:', error);

        return {
            ok: false,
            status: 502,
            code: 'captcha_unavailable',
            reason: 'Turnstile Siteverify request failed'
        };
    }

    if (!verification.success) {
        const errorCodes = verification['error-codes'] || [];
        const expired = errorCodes.includes('timeout-or-duplicate');

        console.warn('Turnstile rejected submission:', errorCodes);

        return {
            ok: false,
            status: 403,
            code: expired ? 'captcha_expired' : 'captcha_failed',
            reason: 'Turnstile verification failed'
        };
    }

    const validAction =
        verification.action === input.expectedAction ||
        (secret === TURNSTILE_TEST_SECRET && verification.action === 'test');

    if (!validAction) {
        console.warn('Turnstile action mismatch:', {
            expected: input.expectedAction,
            received: verification.action
        });

        return {
            ok: false,
            status: 403,
            code: 'captcha_failed',
            reason: 'Turnstile action mismatch'
        };
    }

    if (secret !== TURNSTILE_TEST_SECRET && verification.hostname !== input.expectedHostname) {
        console.warn('Turnstile hostname mismatch:', {
            expected: input.expectedHostname,
            received: verification.hostname
        });

        return {
            ok: false,
            status: 403,
            code: 'captcha_failed',
            reason: 'Turnstile hostname mismatch'
        };
    }

    return {ok: true};
}
