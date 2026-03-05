<script>
  import { onDestroy, onMount } from 'svelte';
  import MediaSkeleton from '$lib/components/MediaSkeleton.svelte';

  let { slides = [], interval = 5000 } = $props();

  let index = $state(0);
  let timer;

  onMount(() => {
    if (slides.length < 2) return;
    timer = setInterval(() => {
      index = (index + 1) % slides.length;
    }, interval);
  });

  onDestroy(() => clearInterval(timer));
</script>

<div class="relative h-[22rem] overflow-hidden rounded-3xl shadow-xl md:h-[30rem]">
  {#each slides as slide, i}
    <div class={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}>
      <MediaSkeleton src={slide.image} alt={slide.title} mediaClass="h-full object-cover" containerClass="h-full" />
      <div class="absolute inset-0 bg-gradient-to-tr from-slate-950/70 via-slate-900/40 to-cyan-700/20"></div>
      <div class="absolute inset-0 flex items-end p-6 md:p-10">
        <div class="max-w-2xl text-white">
          <h2 class="text-2xl font-bold leading-tight md:text-5xl">{slide.title}</h2>
          <p class="mt-3 text-sm text-slate-100 md:text-lg">{slide.subtitle}</p>
        </div>
      </div>
    </div>
  {/each}

  {#if slides.length > 1}
    <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
      {#each slides as _, i}
        <button
          type="button"
          class={`h-2.5 w-2.5 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/40'}`}
          onclick={() => (index = i)}
          aria-label={`Go to slide ${i + 1}`}
        ></button>
      {/each}
    </div>
  {/if}
</div>
