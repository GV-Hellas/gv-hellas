<script>
  import { onMount, onDestroy } from 'svelte';
  import { t } from '../i18n';

  export let slides = [];
  export let interval = 5000;

  let index = 0;
  let timer;

  onMount(() => {
    timer = setInterval(() => {
      index = (index + 1) % slides.length;
    }, interval);
  });
  onDestroy(() => clearInterval(timer));
</script>

<div class="relative w-full overflow-hidden">
  {#each slides as slide, i}
    <div
      class="absolute top-0 left-0 w-full h-96 bg-cover bg-center transition-opacity duration-700"
      style="background-image: url('{slide.image}')"
      class:selected={i === index}
    >
      <div class="bg-black bg-opacity-50 h-full flex flex-col justify-center items-center text-center text-white p-4">
        <h2 class="text-2xl md:text-4xl font-bold mb-2">{slide.title}</h2>
        <p class="text-sm md:text-lg">{slide.subtitle}</p>
      </div>
    </div>
  {/each}

  <style>
    .absolute { position: absolute; }
    .selected { opacity: 1; z-index: 10; }
    .absolute:not(.selected) { opacity: 0; z-index: 1; }
  </style>
</div>