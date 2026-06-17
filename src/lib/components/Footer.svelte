<script>
    import {t} from '$lib/i18n';
    import {Code, Heart} from '@lucide/svelte';
</script>

<footer class="mt-auto border-t border-[#b8c9e3] bg-linear-to-r from-[#dbe7f6] via-[#c7d8ee] to-[#d6e2f2]">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-slate-700 md:grid-cols-3 lg:px-6">
        <div>
            <h3 class="font-semibold text-slate-900">{$t('contact.address')}</h3>
            <p class="mt-2">4852 Rothrist, Suisse</p>
            <h3 class="mt-4 font-semibold text-slate-900">Email</h3>
            <p class="mt-1"><a href="mailto:info@gv-hellas.ch" class="text-slate-900 hover:underline">info@gv-hellas.ch</a></p>
            <h3 class="mt-4 font-semibold text-slate-900">{$t('contact.phoneContact')}</h3>
            <p class="mt-1"><a href="tel:+41787296030" class="text-slate-900 hover:underline">+41 (0)78 729 60 30</a></p>
        </div>

        <div>
            <h3 class="font-semibold text-slate-900">{$t('contact.followUs')}</h3>
            <ul class="mt-2 space-y-2">
                <li><a href="https://www.facebook.com/p/Griechischer-Verein-Hellas-100089940210614/" class="hover:text-slate-900" target="_blank" rel="noopener">Facebook</a></li>
                <li><a href="https://www.instagram.com/griechischerverein/" class="hover:text-slate-900" target="_blank" rel="noopener">Instagram</a></li>
                <li><a href="https://www.tiktok.com/@gvhellas" class="hover:text-slate-900" target="_blank" rel="noopener">TikTok</a></li>
            </ul>
        </div>

        <div class="md:text-right">
            <p class="font-medium text-slate-900">© {new Date().getFullYear()} Griechischer Verein Hellas</p>
            <div class="flex items-center justify-end gap-1.5 text-sm text-muted-foreground mt-1">
                <Code class="size-4 text-foreground" aria-label="Coded" />

                <span>with</span>

                <Heart
                        class="size-4 fill-current transition-transform hover:scale-110 cursor-default"
                        aria-label="love"
                />

                <span>by</span>

                <a
                        href="https://charisoudis.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                    Thanos Charisoudis
                </a>
            </div>
        </div>
    </div>
</footer>
