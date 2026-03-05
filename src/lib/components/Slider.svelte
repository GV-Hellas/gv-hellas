<script>
  import { onDestroy, onMount } from 'svelte';

  let { slides = [], interval = 5000 } = $props();

  let index = $state(0);
  let timer;

  onMount(() => {
    if (slides.length < 2) {
      return;
    }

    timer = setInterval(() => {
      index = (index + 1) % slides.length;
    }, interval);
  });

  onDestroy(() => {
    clearInterval(timer);
  });
</script>

<div class="relative h-[22rem] overflow-hidden rounded-3xl shadow-xl md:h-[30rem]">
  {#each slides as slide, i}
    <div
      class={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
      style={`background-image: linear-gradient(120deg, rgba(2, 6, 23, 0.75), rgba(2, 6, 23, 0.2)), url('${slide.image}')`}
      aria-hidden={i !== index}
    >
      <div class="flex h-full items-end p-6 md:p-10">
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
