<script lang="ts">
    import {t} from '$lib/i18n';

    // Svelte 5: Use $state() rune for reactive variables
    let name = $state('');
    let email = $state('');
    let phone = $state('');
    let message = $state('');
    let submitted = $state(false);

    async function handleSubmit(event: Event) {
        event.preventDefault();
        // Placeholder submit handler.
        // In a real deployment you would send the form data to a serverless function.
        submitted = true;
    }
</script>

<h1 class="text-3xl font-bold mb-6">{$t('contact.headline')}</h1>

{#if submitted}
    <p class="p-4 bg-green-100 border border-green-300 rounded" role="alert">
        Vielen Dank! / Σας ευχαριστούμε!
    </p>
{:else}
    <div class="grid md:grid-cols-2 gap-8">
        <form class="space-y-4" onsubmit={handleSubmit}>
            <h2 class="text-xl font-semibold mb-2">{$t('contact.formHeadline')}</h2>

            <div>
                <label for="contact-name" class="block mb-1">{$t('contact.name')}</label>
                <input
                        type="text"
                        id="contact-name"
                        bind:value={name}
                        class="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                        required
                />
            </div>

            <div>
                <label for="contact-email" class="block mb-1">{$t('contact.email')}</label>
                <input
                        type="email"
                        id="contact-email"
                        bind:value={email}
                        class="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                        required
                />
            </div>

            <div>
                <label for="contact-phone" class="block mb-1">{$t('contact.phone')}</label>
                <input
                        type="tel"
                        id="contact-phone"
                        bind:value={phone}
                        class="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                />
            </div>

            <div>
                <label for="contact-message" class="block mb-1">{$t('contact.message')}</label>
                <textarea
                        id="contact-message"
                        bind:value={message}
                        rows="5"
                        class="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                        required
                ></textarea>
            </div>

            <button type="submit" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition">
                {$t('contact.send')}
            </button>
        </form>

        <div>
            <h2 class="text-xl font-semibold mb-2">{$t('contact.address')}</h2>
            <p>4852 Rothrist, Suisse</p>

            <h2 class="text-xl font-semibold mt-4 mb-2">{$t('contact.phoneContact')}</h2>
            <p><a href="tel:+41787296030" class="underline hover:text-primary-dark transition">+41 (0)78 729 60 30</a></p>

            <h2 class="text-xl font-semibold mt-4 mb-2">Email</h2>
            <p><a href="mailto:info@gv-hellas.ch" class="underline hover:text-primary-dark transition">info@gv-hellas.ch</a>
            </p>

            <h2 class="text-xl font-semibold mt-4 mb-2">{$t('contact.followUs')}</h2>
            <ul class="space-y-2">
                <li><a href="https://www.facebook.com" target="_blank" rel="noopener"
                       class="underline hover:text-primary-dark">Facebook</a></li>
                <li><a href="https://www.instagram.com" target="_blank" rel="noopener"
                       class="underline hover:text-primary-dark">Instagram</a></li>
                <li><a href="https://www.tiktok.com" target="_blank" rel="noopener"
                       class="underline hover:text-primary-dark">TikTok</a></li>
            </ul>
        </div>
    </div>
{/if}