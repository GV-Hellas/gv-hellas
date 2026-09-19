<script lang="ts">
    import {env} from '$env/dynamic/public';
    import {t} from '$lib/i18n';
    import {trackAnalyticsEvent} from '$lib/analytics';
    import Turnstile from '$lib/components/Turnstile.svelte';
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import {Button} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import {Textarea} from '$lib/components/ui/textarea/index.js';
    import {toast} from 'svelte-sonner';

    import PlusIcon from '@lucide/svelte/icons/plus';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import MailIcon from '@lucide/svelte/icons/mail';
    import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

    const TURNSTILE_SITE_KEY = '0x4AAAAAAE89AxpjSZqxEP-s';

    let open = $state(false);
    let loading = $state(false);
    let name = $state('');
    let email = $state('');
    let phone = $state('');
    let message = $state('');
    let website = $state('');
    let turnstileToken = $state('');
    let turnstileResetKey = $state(0);
    let captchaError = $state('');

    const turnstileSiteKey = $derived(env.PUBLIC_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_SITE_KEY);

    function resetCaptcha() {
        turnstileToken = '';
        captchaError = '';
        turnstileResetKey += 1;
    }

    function reset() {
        name = '';
        email = '';
        phone = '';
        message = '';
        website = '';
        resetCaptcha();
    }

    async function submit(event: SubmitEvent) {
        event.preventDefault();

        if (loading) return;

        if (!turnstileToken) {
            captchaError = $t('contact.validation.captcha');
            toast.error(captchaError);
            return;
        }

        loading = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    website,
                    turnstileToken,
                    turnstileAction: 'sponsor_inquiry',
                    message: `${$t('home.sponsorInquiryEmailPrefix')}\n\n${message}`.trim()
                })
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.ok) {
                if (result?.code === 'captcha_failed' || result?.code === 'captcha_expired') {
                    captchaError = $t('contact.validation.captchaFailed');
                }
                throw new Error(result?.message || 'Could not send sponsorship inquiry');
            }

            trackAnalyticsEvent(env.PUBLIC_GOOGLE_ANALYTICS_ID, 'generate_lead', {
                lead_source: 'sponsor_inquiry'
            });
            toast.success($t('home.sponsorInquirySuccess'));
            reset();
            open = false;
        } catch {
            toast.error(captchaError || $t('home.sponsorInquiryError'));
            resetCaptcha();
        } finally {
            loading = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <button
        type="button"
        class="group flex min-h-48 flex-col items-center justify-center border-b border-dashed border-slate-300 px-4 py-5 text-center transition hover:border-primary/60 hover:bg-primary/[0.03]"
        onclick={() => (open = true)}
        aria-label={$t('home.becomeSponsor')}
    >
        <span class="flex h-28 items-center justify-center text-slate-300 transition group-hover:text-primary">
            <PlusIcon class="size-14" />
        </span>

        <span class="mt-4 font-bold text-slate-900">
            {$t('home.becomeSponsor')}
        </span>

        <span class="mt-1 max-w-56 text-sm leading-5 text-slate-500">
            {$t('home.becomeSponsorHint')}
        </span>
    </button>

    <Dialog.Content class="max-w-lg rounded-lg">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <MailIcon class="size-5 text-primary" />
                {$t('home.sponsorInquiryTitle')}
            </Dialog.Title>
            <Dialog.Description>
                {$t('home.sponsorInquiryDescription')}
            </Dialog.Description>
        </Dialog.Header>

        <form class="mt-5 grid gap-4" onsubmit={submit}>
            <div class="grid gap-1.5">
                <Label for="sponsor-name">{$t('contact.name')}</Label>
                <Input id="sponsor-name" bind:value={name} required minlength="2" class="rounded-md font-semibold" />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
                <div class="grid gap-1.5">
                    <Label for="sponsor-email">{$t('contact.email')}</Label>
                    <Input id="sponsor-email" type="email" bind:value={email} required class="rounded-md font-semibold" />
                </div>

                <div class="grid gap-1.5">
                    <Label for="sponsor-phone">{$t('contact.phone')}</Label>
                    <Input id="sponsor-phone" type="tel" bind:value={phone} class="rounded-md font-semibold" />
                </div>
            </div>

            <div class="hidden" aria-hidden="true">
                <Label for="sponsor-website">Website</Label>
                <Input id="sponsor-website" bind:value={website} tabindex="-1" autocomplete="off" />
            </div>

            <div class="grid gap-1.5">
                <Label for="sponsor-message">{$t('contact.message')}</Label>
                <Textarea
                    id="sponsor-message"
                    bind:value={message}
                    required
                    minlength="10"
                    rows={5}
                    class="rounded-md font-semibold"
                    placeholder={$t('home.sponsorInquiryPlaceholder')}
                />
            </div>

            <div class="border-t border-slate-200 pt-4">
                <div class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ShieldCheckIcon class="size-4 text-primary" />
                    {$t('contact.securityTitle')}
                </div>

                <Turnstile
                    siteKey={turnstileSiteKey}
                    action="sponsor_inquiry"
                    resetKey={turnstileResetKey}
                    onToken={(token) => {
                        turnstileToken = token;
                        captchaError = '';
                    }}
                    onExpired={() => (captchaError = $t('contact.validation.captchaFailed'))}
                    onError={() => (captchaError = $t('contact.validation.captchaFailed'))}
                />

                {#if captchaError}
                    <p class="mt-2 text-xs font-semibold text-destructive" role="alert">{captchaError}</p>
                {/if}
            </div>

            <Dialog.Footer class="mt-2 gap-2 sm:gap-2">
                <Button type="button" variant="outline" class="rounded-md" onclick={() => (open = false)} disabled={loading}>
                    {$t('common.cancel')}
                </Button>
                <Button type="submit" class="rounded-md" disabled={loading || !turnstileToken}>
                    {#if loading}
                        <Loader2Icon class="mr-2 size-4 animate-spin" />
                        {$t('home.sponsorInquirySending')}
                    {:else}
                        <MailIcon class="mr-2 size-4" />
                        {$t('home.sponsorInquirySend')}
                    {/if}
                </Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
