<script>
  import { t } from '$lib/i18n';
</script>

<footer class="mt-auto border-t border-[#b8c9e3] bg-gradient-to-r from-[#dbe7f6] via-[#c7d8ee] to-[#d6e2f2]">
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
        <li><a href="https://www.facebook.com" class="hover:text-slate-900" target="_blank" rel="noopener">Facebook</a></li>
        <li><a href="https://www.instagram.com" class="hover:text-slate-900" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="https://www.tiktok.com" class="hover:text-slate-900" target="_blank" rel="noopener">TikTok</a></li>
      </ul>
    </div>

    <div class="md:text-right">
      <p class="font-medium text-slate-900">© {new Date().getFullYear()} GV Hellas</p>
      <p class="mt-2 text-xs">Built with SvelteKit 5</p>
    </div>
  </div>
</footer>
