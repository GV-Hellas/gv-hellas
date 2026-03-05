<script>
  import { t } from '../i18n';
</script>

<footer class="bg-primary-dark text-white mt-16">
  <div class="container mx-auto px-4 py-8 grid md:grid-cols-3 gap-6 text-sm">
    <div>
      <h3 class="font-bold mb-2">{$t('contact.address')}</h3>
      <p>4852 Rothrist, Suisse</p>
      <h3 class="font-bold mt-4 mb-2">Email</h3>
      <p><a href="mailto:info@gv-hellas.ch" class="underline">info@gv-hellas.ch</a></p>
      <h3 class="font-bold mt-4 mb-2">{$t('contact.phoneContact')}</h3>
      <p><a href="tel:+41787296030" class="underline">+41 (0)78 729 60 30</a></p>
    </div>
    <div>
      <h3 class="font-bold mb-2">{$t('contact.followUs')}</h3>
      <ul class="space-y-2">
        <li><a href="https://www.facebook.com" class="underline" target="_blank" rel="noopener">Facebook</a></li>
        <li><a href="https://www.instagram.com" class="underline" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="https://www.tiktok.com" class="underline" target="_blank" rel="noopener">TikTok</a></li>
      </ul>
    </div>
    <div class="text-right md:text-left md:col-span-1 flex flex-col justify-between">
      <p>© {new Date().getFullYear()} GV Hellas</p>
      <p class="text-xs mt-2">Designed with ❤️ using SvelteKit</p>
    </div>
  </div>
</footer>