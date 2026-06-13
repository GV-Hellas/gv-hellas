<script lang="ts">
    import type {Lang, LocalizedText} from '$lib/cms/events/types';

    export let label: string;
    export let value: LocalizedText;
    export let lang: Lang;

    let editor: HTMLDivElement;

    $: if (editor && editor.innerHTML !== (value[lang] || '')) {
        editor.innerHTML = value[lang] || '';
    }

    function command(name: string, arg?: string) {
        document.execCommand(name, false, arg);
        sync();
        editor?.focus();
    }

    function addLink() {
        const href = window.prompt('Link URL');
        if (!href) return;
        command('createLink', href);
    }

    function sync() {
        value = {...value, [lang]: editor?.innerHTML || ''};
    }
</script>

<div class="rich">
    <div class="top">{label}</div>

    <div class="toolbar" aria-label="Rich text toolbar">
        <button type="button" on:click={() => command('bold')}><b>B</b></button>
        <button type="button" on:click={() => command('italic')}><i>I</i></button>
        <button type="button" on:click={() => command('underline')}><u>U</u></button>
        <button type="button" on:click={addLink}>Link</button>
    </div>

    <div
            bind:this={editor}
            class="editor"
            contenteditable="true"
            on:input={sync}
            on:blur={sync}
    ></div>
</div>

<style>
    .rich {
        display: grid;
        gap: .4rem;
    }

    .top {
        font-weight: 600;
    }

    .toolbar {
        display: flex;
        gap: .35rem;
    }

    button {
        border: 1px solid #d0d5dd;
        background: white;
        border-radius: .5rem;
        padding: .35rem .55rem;
        cursor: pointer;
    }

    .editor {
        min-height: 5.5rem;
        border: 1px solid #d0d5dd;
        border-radius: .75rem;
        padding: .75rem .9rem;
        background: white;
    }

    .editor:focus {
        outline: 2px solid #bfdbfe;
        border-color: #60a5fa;
    }
</style>