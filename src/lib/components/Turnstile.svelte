<script lang="ts">
    import {onMount} from 'svelte';

    let {
        siteKey,
        action = 'contact_form',
        resetKey = 0,
        onToken = () => {},
        onExpired = () => {},
        onError = () => {}
    }: {
        siteKey: string;
        action?: string;
        resetKey?: number;
        onToken?: (token: string) => void;
        onExpired?: () => void;
        onError?: () => void;
    } = $props();

    let container: HTMLDivElement;
    let widgetId: string | null = null;
    let mounted = false;
    let lastResetKey: number | undefined;

    const scriptId = 'gv-hellas-cloudflare-turnstile';
    const scriptSrc = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

    function waitForApi(timeoutMs = 8000) {
        return new Promise<void>((resolve, reject) => {
            const startedAt = Date.now();

            const check = () => {
                if (window.turnstile) {
                    resolve();
                    return;
                }

                if (Date.now() - startedAt >= timeoutMs) {
                    reject(new Error('Cloudflare Turnstile did not become available.'));
                    return;
                }

                window.setTimeout(check, 50);
            };

            check();
        });
    }

    async function loadTurnstile() {
        if (window.turnstile) return;

        let script = document.getElementById(scriptId) as HTMLScriptElement | null;

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = scriptSrc;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        await waitForApi();
    }

    function renderWidget() {
        if (!mounted || !container || !siteKey || widgetId || !window.turnstile) return;

        widgetId = window.turnstile.render(container, {
            sitekey: siteKey,
            action,
            theme: 'auto',
            size: 'flexible',
            appearance: 'always',
            callback: (token) => onToken(token),
            'expired-callback': () => {
                onToken('');
                onExpired();
            },
            'error-callback': () => {
                onToken('');
                onError();
            }
        });
    }

    onMount(() => {
        mounted = true;

        if (siteKey) {
            loadTurnstile()
                .then(renderWidget)
                .catch(() => onError());
        }

        return () => {
            mounted = false;

            if (widgetId && window.turnstile) {
                window.turnstile.remove(widgetId);
            }

            widgetId = null;
        };
    });

    $effect(() => {
        const currentResetKey = resetKey;

        // Establish the initial value without resetting the widget on mount.
        if (lastResetKey === undefined) {
            lastResetKey = currentResetKey;
            return;
        }

        if (currentResetKey === lastResetKey) {
            return;
        }

        lastResetKey = currentResetKey;
        onToken('');

        if (widgetId && window.turnstile) {
            window.turnstile.reset(widgetId);
        }
    });
</script>

<div class="w-full" bind:this={container}></div>
