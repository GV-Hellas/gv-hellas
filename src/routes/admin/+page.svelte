<script>
  let { form } = $props();
</script>

<section class="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <h1 class="text-2xl font-bold">CMS Admin Login</h1>
  {#if form?.error}
    <p class="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</p>
  {/if}
  <form method="POST" action="?/login" class="mt-4 space-y-3">
    <input name="username" placeholder="Username" class="w-full rounded border border-slate-300 px-3 py-2" required />
    <input name="password" type="password" placeholder="Password" class="w-full rounded border border-slate-300 px-3 py-2" required />
    <button class="rounded bg-primary px-4 py-2 font-semibold text-white">Login</button>
  </form>
</section>
