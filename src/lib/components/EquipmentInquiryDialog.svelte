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

    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import SendIcon from '@lucide/svelte/icons/send';
    import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

    const TURNSTILE_SITE_KEY = '0x4AAAAAAE89AxpjSZqxEP-s';

    let {
        equipmentSlug,
        equipmentTitle,
        buttonClass = ''
    }: {
        equipmentSlug: string;
        equipmentTitle: string;
        buttonClass?: string;
    } = $props();

    let open = $state(false);
    let loading = $state(false);
    let name = $state('');
    let email = $state('');
    let phone = $state('');
    let rentalFrom = $state('');
    let rentalUntil = $state('');
    let message = $state('');
    let website = $state('');
    let turnstileToken = $state('');
    let turnstileResetKey = $state(0);
    let captchaError = $state('');

    const turnstileSiteKey = $derived(
        env.PUBLIC_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_SITE_KEY
    );

    function resetCaptcha() {
        turnstileToken = '';
        captchaError = '';
        turnstileResetKey += 1;
    }

    function resetForm() {
        name = '';
        email = '';
        phone = '';
        rentalFrom = '';
        rentalUntil = '';
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
            const response = await fetch('/api/equipment-inquiry', {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({
                    equipmentSlug,
                    name,
                    email,
                    phone,
                    rentalFrom,
                    rentalUntil,
                    message,
                    website,
                    turnstileToken
                })
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.ok) {
                if (result?.code === 'captcha_failed' || result?.code === 'captcha_expired') {
                    captchaError = $t('contact.validation.captchaFailed');
                }
                throw new Error(result?.message || 'Equipment inquiry failed');
            }

            trackAnalyticsEvent(env.PUBLIC_GOOGLE_ANALYTICS_ID, 'generate_lead', {
                lead_source: 'equipment_rental',
                equipment_slug: equipmentSlug
            });

            toast.success($t('equipment.inquiry.success'), {
                description: equipmentTitle
            });

            resetForm();
            open = false;
        } catch {
            toast.error(captchaError || $t('equipment.inquiry.error'));
            resetCaptcha();
        } finally {
            loading = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <Button type="button" class={buttonClass} onclick={() => (open = true)}>
        {$t('equipment.interested')}
    </Button>

    <Dialog.Content class="max-w-xl rounded-lg">
        <Dialog.Header>
            <Dialog.Title>{$t('equipment.inquiry.title')}</Dialog.Title>
            <Dialog.Description>
                {$t('equipment.inquiry.description')}
                <span class="mt-1 block font-semibold text-slate-800">{equipmentTitle}</span>
            </Dialog.Description>
        </Dialog.Header>

        <form class="mt-5 grid gap-4" onsubmit={submit}>
            <div class="grid gap-4 sm:grid-cols-2">
                <div class="grid gap-1.5 sm:col-span-2">
                    <Label for={`equipment-name-${equipmentSlug}`}>{$t('contact.name')}</Label>
                    <Input
                        id={`equipment-name-${equipmentSlug}`}
                        bind:value={name}
                        required
                        minlength="2"
                        class="rounded-md font-semibold"
                    />
                </div>

                <div class="grid gap-1.5">
                    <Label for={`equipment-email-${equipmentSlug}`}>{$t('contact.email')}</Label>
                    <Input
                        id={`equipment-email-${equipmentSlug}`}
                        type="email"
                        bind:value={email}
                        required
                        class="rounded-md font-semibold"
                    />
                </div>

                <div class="grid gap-1.5">
                    <Label for={`equipment-phone-${equipmentSlug}`}>{$t('contact.phone')}</Label>
                    <Input
                        id={`equipment-phone-${equipmentSlug}`}
                        type="tel"
                        bind:value={phone}
                        class="rounded-md font-semibold"
                    />
                </div>

                <div class="grid gap-1.5">
                    <Label for={`equipment-from-${equipmentSlug}`}>{$t('equipment.inquiry.from')}</Label>
                    <Input
                        id={`equipment-from-${equipmentSlug}`}
                        type="date"
                        bind:value={rentalFrom}
                        class="rounded-md font-semibold"
                    />
                </div>

                <div class="grid gap-1.5">
                    <Label for={`equipment-until-${equipmentSlug}`}>{$t('equipment.inquiry.until')}</Label>
                    <Input
                        id={`equipment-until-${equipmentSlug}`}
                        type="date"
                        bind:value={rentalUntil}
                        min={rentalFrom || undefined}
                        class="rounded-md font-semibold"
                    />
                </div>
            </div>

            <div class="grid gap-1.5">
                <Label for={`equipment-message-${equipmentSlug}`}>{$t('equipment.inquiry.message')}</Label>
                <Textarea
                    id={`equipment-message-${equipmentSlug}`}
                    bind:value={message}
                    rows={5}
                    class="rounded-md font-semibold"
                    placeholder={$t('equipment.inquiry.messagePlaceholder')}
                />
            </div>

            <div class="hidden" aria-hidden="true">
                <Label for={`equipment-website-${equipmentSlug}`}>Website</Label>
                <Input
                    id={`equipment-website-${equipmentSlug}`}
                    bind:value={website}
                    tabindex="-1"
                    autocomplete="off"
                />
            </div>

            <div class="border-t border-slate-200 pt-4">
                <div class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ShieldCheckIcon class="size-4 text-primary" />
                    {$t('contact.securityTitle')}
                </div>

                <Turnstile
                    siteKey={turnstileSiteKey}
                    action="equipment_inquiry"
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
                        {$t('equipment.inquiry.sending')}
                    {:else}
                        <SendIcon class="mr-2 size-4" />
                        {$t('equipment.inquiry.send')}
                    {/if}
                </Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
