<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue';
import {
    SandpackProvider,
    SandpackCodeEditor,
    SandpackPreview
} from 'sandpack-vue3';
import { compressToBase64 } from 'lz-string';
import { useHtml2Pptx } from '../composables/useHtml2Pptx';

const VOID_TAGS = /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i;

const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div class="slide">
    <h1>Hello, Playground!</h1>
    <p class="subtitle">Edit HTML and CSS, then convert to PowerPoint</p>
    <p class="hint">Click the download button to get a .pptx file</p>
  </div>
</body>
</html>`;

const defaultCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.slide {
  width: 960px;
  height: 540px;
  padding: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 20px;
}

.subtitle {
  font-size: 24px;
  margin-bottom: 12px;
}

.hint {
  font-size: 16px;
  opacity: 0.8;
}`;

const files = {
    '/index.html': defaultHtml,
    '/styles.css': defaultCss
};

const sandpackTheme = {
    colors: {
        surface1: 'hsl(210deg 15% 6%)',
        surface2: 'hsl(227deg 11% 34%)',
        surface3: '#2f2f2f',
        disabled: '#4d4d4d',
        base: '#808080',
        clickable: 'hsl(207deg 23% 52%)',
        hover: '#ffffff',
        accent: 'hsl(50deg 100% 50%)',
        error: 'hsl(3deg 69% 30%)',
        errorSurface: 'hsl(3deg 100% 90%)',
        activeBackground: 'hsl(210deg 15% 50% / 0.165)',
        inputBackground: 'hsl(207deg 75% 15%)'
    },
    syntax: {
        plain: 'hsl(0deg 0% 100%)',
        comment: { color: 'hsl(200deg 18% 51%)' },
        keyword: 'hsl(266deg 80% 75%)',
        tag: 'hsl(326deg 100% 61%)',
        punctuation: 'hsl(210deg 20% 77%)',
        definition: 'hsl(205deg 100% 65%)',
        property: 'hsl(326deg 100% 61%)',
        static: 'hsl(0deg 0% 100%)',
        string: 'hsl(50deg 100% 50%)'
    },
    font: {
        body: 'system-ui, -apple-system, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        size: '0.875rem',
        lineHeight: '1.4'
    }
};

interface SandpackApi {
    getFiles: () => Record<string, { code: string }>;
    updateFile: (path: string, code: string) => void;
}

const conversionRef = ref<HTMLElement | null>(null);
const conversionHtml = ref('');
const panelsRef = ref<HTMLElement | null>(null);
const editorFlex = ref(500);
const isDragging = ref(false);
const wrapContent = ref(false);
const activeTab = ref<'result'>('result');
const sandpackApi = shallowRef<SandpackApi | null>(null);

const { isConverting, status, setStatus, convertElements } = useHtml2Pptx();

const statusClass = computed(() => {
    return status.value.type !== 'idle' ? `pg-status ${status.value.type}` : 'pg-status';
});

function onSandpackReady(api: SandpackApi): void {
    sandpackApi.value = api;
}

/* ── Toolbar actions ──────────────────────────── */

function toggleWrap(): void {
    wrapContent.value = !wrapContent.value;
}

function formatHtml(html: string): string {
    const tab = '  ';
    let result = '';
    let indent = 0;
    const tokens = html.replace(/>\s+</g, '>\n<').split(/(<[^>]+>)/);
    for (const token of tokens) {
        const t = token.trim();
        if (!t) continue;
        if (t.startsWith('</')) {
            indent = Math.max(0, indent - 1);
            result += tab.repeat(indent) + t + '\n';
        } else if (t.startsWith('<') && !t.startsWith('<!') && !t.endsWith('/>') && !VOID_TAGS.test(t)) {
            result += tab.repeat(indent) + t + '\n';
            indent++;
        } else {
            result += tab.repeat(indent) + t + '\n';
        }
    }
    return result.trimEnd() + '\n';
}

function formatCss(css: string): string {
    return css
        .replace(/\s*\{\s*/g, ' {\n  ')
        .replace(/;\s*/g, ';\n  ')
        .replace(/\s*\}\s*/g, '\n}\n\n')
        .replace(/\n  \n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trimEnd() + '\n';
}

function onFormat(): void {
    if (!sandpackApi.value) return;
    const f = sandpackApi.value.getFiles();
    const html = f['/index.html']?.code;
    const css = f['/styles.css']?.code;
    if (html) sandpackApi.value.updateFile('/index.html', formatHtml(html));
    if (css) sandpackApi.value.updateFile('/styles.css', formatCss(css));
}

function onOpenInSandbox(): void {
    if (!sandpackApi.value) return;
    const f = sandpackApi.value.getFiles();
    const csFiles: Record<string, { content: string; isBinary: boolean }> = {};
    for (const [path, data] of Object.entries(f)) {
        csFiles[path.replace(/^\//, '')] = { content: data.code, isBinary: false };
    }
    csFiles['package.json'] = {
        content: JSON.stringify({ name: 'html2pptx-playground', main: 'index.html' }),
        isBinary: false
    };
    // Match Sandpack's built-in CodeSandbox button: lz-string + environment param
    const compressed = compressToBase64(JSON.stringify({ files: csFiles, template: 'static' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const query = new URLSearchParams({ file: '/index.html' }).toString();
    if (compressed.length <= 1500) {
        const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${compressed}&query=${encodeURIComponent(query)}&environment=static`;
        window.open(url, '_blank');
    } else {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://codesandbox.io/api/v1/sandboxes/define';
        form.target = '_blank';
        for (const [name, value] of Object.entries({
            parameters: compressed,
            query,
            environment: 'static'
        })) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        form.remove();
    }
}

/* ── Resize logic ─────────────────────────────── */

function disablePointerEvents(): void {
    panelsRef.value?.querySelectorAll<HTMLElement>('iframe').forEach((el) => {
        el.style.pointerEvents = 'none';
    });
}

function enablePointerEvents(): void {
    panelsRef.value?.querySelectorAll<HTMLElement>('iframe').forEach((el) => {
        el.style.pointerEvents = '';
    });
}

function onDragStart(e: MouseEvent): void {
    e.preventDefault();
    isDragging.value = true;
    disablePointerEvents();
}

function onDrag(e: MouseEvent): void {
    if (!isDragging.value || !panelsRef.value) return;
    e.preventDefault();
    const { left, width } = panelsRef.value.getBoundingClientRect();
    const pct = ((e.clientX - left) / width) * 1000;
    editorFlex.value = Math.min(750, Math.max(250, pct));
}

function onDragEnd(): void {
    if (!isDragging.value) return;
    isDragging.value = false;
    enablePointerEvents();
}

onMounted(() => {
    document.body.addEventListener('mousemove', onDrag);
    document.body.addEventListener('mouseup', onDragEnd);
});

onBeforeUnmount(() => {
    document.body.removeEventListener('mousemove', onDrag);
    document.body.removeEventListener('mouseup', onDragEnd);
});

/* ── Conversion ───────────────────────────────── */

function onCodeUpdate(code: string): void {
    conversionHtml.value = code;
}

async function onConvert(): Promise<void> {
    if (!conversionRef.value) return;
    await convertElements([conversionRef.value], { filename: 'playground.pptx' });
}
</script>

<template>
    <div class="pg-outer">
        <SandpackProvider
            template="static"
            :files="files"
            :theme="sandpackTheme"
            :options="{ initMode: 'immediate' }"
        >
            <div class="pg-shell">
                <header class="pg-header">
                    <p class="pg-title">Playground</p>
                    <div class="pg-toolbar">
                        <!-- Toggle line wrap -->
                        <button class="pg-toolbar-btn" :class="{ 'pg-toolbar-btn-active': wrapContent }" :title="wrapContent ? 'Disable line wrap' : 'Enable line wrap'" @click="toggleWrap">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pg-icon"><line x1="3" y1="6" x2="21" y2="6" /><path d="M3 12h15a3 3 0 1 1 0 6h-4" /><polyline points="16 16 14 18 16 20" /><line x1="3" y1="18" x2="7" y2="18" /></svg>
                            <span class="sr-only">Toggle line wrap</span>
                        </button>
                        <!-- Format code -->
                        <button class="pg-toolbar-btn" title="Format code" @click="onFormat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pg-icon" style="overflow:visible"><g style="transform:rotate(-45deg);transform-origin:center"><rect x="0" y="8" width="24" height="6" rx="2" fill="hsl(210deg 20% 77%)" /><line x1="18" y1="8" x2="18" y2="14" /></g></svg>
                            <span class="sr-only">Format code</span>
                        </button>
                        <!-- Open in CodeSandbox -->
                        <button class="pg-toolbar-btn" title="Open in CodeSandbox" @click="onOpenInSandbox">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pg-icon"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            <span class="sr-only">Open in CodeSandbox</span>
                        </button>
                        <!-- Download PPTX -->
                        <button class="pg-toolbar-btn pg-download-btn" :disabled="isConverting" :title="isConverting ? 'Converting...' : 'Download PPTX'" @click="onConvert">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pg-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            <span class="pg-btn-label">{{ isConverting ? 'Converting...' : 'Download PPTX' }}</span>
                        </button>
                    </div>
                </header>

                <!-- Panels container -->
                <div class="pg-content">
                    <div ref="panelsRef" class="pg-panels">
                        <!-- Editor pane -->
                        <div class="pg-editor-pane pg-pane" :style="{ '--desktop-flex': editorFlex }">
                            <div class="pg-editor-inner">
                                <SandpackCodeEditor
                                    :show-line-numbers="true"
                                    :show-tabs="true"
                                    :closable-tabs="false"
                                    :wrap-content="wrapContent"
                                    style="height: 100%"
                                />
                            </div>
                        </div>

                        <!-- Resize handle -->
                        <button class="pg-resize-handle" @mousedown="onDragStart">
                            <span class="sr-only">Resize editor</span>
                        </button>

                        <!-- Preview pane -->
                        <div class="pg-preview-pane pg-pane" :style="{ '--desktop-flex': 1000 - editorFlex }">
                            <div class="pg-preview-inner">
                                <!-- Result / Console tabs -->
                                <div class="pg-preview-tabs">
                                    <button
                                        class="pg-tab"
                                        :class="{ 'pg-tab-active': activeTab === 'result' }"
                                        @click="activeTab = 'result'"
                                    >result</button>
                                </div>
                                <!-- Preview body -->
                                <div class="pg-preview-body">
                                    <div class="pg-preview-frame">
                                        <SandpackPreview
                                            :show-open-in-code-sandbox="false"
                                            :show-refresh-button="true"
                                            style="height: 100%"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Transition name="pg-fade">
                <div v-if="status.type !== 'idle'" :class="statusClass">
                    {{ status.message }}
                </div>
            </Transition>

            <PlaygroundBridge @code-update="onCodeUpdate" @ready="onSandpackReady" />
        </SandpackProvider>

        <!-- Hidden element for PPTX conversion -->
        <div
            ref="conversionRef"
            v-html="conversionHtml"
            style="position:absolute;left:-9999px;width:960px;height:540px;overflow:hidden;"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, watch } from 'vue';
import { useSandpack } from 'sandpack-vue3';

const PlaygroundBridge = defineComponent({
    emits: ['code-update', 'ready'],
    setup(_, { emit }) {
        const { sandpack } = useSandpack();

        emit('ready', {
            getFiles: () => sandpack.files,
            updateFile: (path: string, code: string) => sandpack.updateFile(path, code)
        });

        watch(
            () => ({
                html: sandpack?.files?.['/index.html']?.code,
                css: sandpack?.files?.['/styles.css']?.code
            }),
            ({ html, css }) => {
                if (html == null) return;
                let combined = html;
                if (css) {
                    combined = combined.replace(
                        /<link[^>]*href=["']\/styles\.css["'][^>]*\/?>/i,
                        `<style>${css}</style>`
                    );
                }
                emit('code-update', combined);
            },
            { immediate: true, deep: true }
        );

        return () => null;
    }
});

export { PlaygroundBridge };
</script>

<!-- Global overrides for Sandpack internal styles -->
<style>
.pg-outer > .sp-wrapper {
    height: 100%;
}
.pg-shell .sp-layout {
    border: none !important;
    border-radius: 0 !important;
    background: transparent !important;
}
.pg-shell .sp-editor {
    background: transparent !important;
}
.pg-shell .sp-preview {
    background: transparent !important;
}
.pg-shell .sp-code-editor {
    height: 100%;
    overflow: auto;
}
.pg-shell .sp-preview-container {
    height: 100% !important;
}
.pg-shell .sp-preview-iframe {
    height: 100% !important;
}
</style>

<style scoped>
/* ── Utility ───────────────────────────────────── */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* ── Outer ─────────────────────────────────────── */
.pg-outer {
    position: relative;
    margin-top: 24px;
    height: calc(100dvh - 10rem);
    min-height: 400px;
}

/* ── Shell ─────────────────────────────────────── */
.pg-shell {
    --color-primary: #ffd500;
    --color-gray-100: hsl(225deg 25% 92%);
    --color-gray-800: hsl(225deg 20% 30%);
    --pg-surface: hsl(210deg 15% 6%);
    --pg-radius: 6px;

    background: transparent;
    border: none;
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* ── Header ────────────────────────────────────── */
.pg-header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 32px;
    line-height: 2rem;
    padding: 0 16px;
    background: var(--pg-surface);
    border-radius: var(--pg-radius) var(--pg-radius) 0 0;
    border-bottom: 1px solid hsl(210deg 15% 16%);
}

@media (max-width: 35.1875rem) {
    .pg-header {
        border-radius: 0;
    }
}

.pg-title {
    font-size: 0.875rem;
    line-height: inherit;
    font-weight: 600;
    color: hsl(210deg 20% 77%);
    margin: 0;
}

.pg-toolbar {
    display: flex;
    gap: 8px;
    margin-right: -10px;
    color: hsl(210deg 20% 77%);
}

@media (max-width: 35.1875rem) {
    .pg-toolbar {
        display: none;
    }
}

/* ── Toolbar button ────────────────────────────── */
.pg-toolbar-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    color: inherit;
    opacity: 1;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 150ms ease, opacity 150ms ease;
}

.pg-toolbar-btn:hover:not(:disabled) {
    color: #fff;
}

.pg-toolbar-btn-active {
    color: var(--color-primary);
}

.pg-toolbar-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.pg-toolbar-btn:focus-visible {
    outline-color: var(--color-primary);
    outline-offset: -1px;
}

.pg-toolbar-btn svg {
    display: block;
}

.pg-icon {
    width: 16px;
    height: 16px;
    opacity: 0.7;
}

.pg-download-btn {
    width: auto;
    gap: 6px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: 0.8125rem;
    font-weight: 500;
}

.pg-download-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
}

.pg-btn-label {
    white-space: nowrap;
}

/* ── Content ───────────────────────────────────── */
.pg-content {
    max-width: 100%;
    overflow: hidden;
    flex: 1 1;
    min-height: 0;
    container-type: inline-size;
    background: var(--pg-surface);
    border-radius: 0 0 var(--pg-radius) var(--pg-radius);
}

@media (max-width: 48rem) {
    .pg-content {
        border-radius: 0;
        border-left: none;
        border-right: none;
    }
}

/* ── Panels ────────────────────────────────────── */
.pg-panels {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

@container (min-width: 43.75rem) {
    .pg-panels {
        flex-direction: row;
        align-items: stretch;
    }
}

/* ── Editor pane ───────────────────────────────── */
.pg-editor-pane {
    flex: 1 1;
    min-height: 0;
    overflow: hidden;
}

@container (min-width: 43.75rem) {
    .pg-editor-pane {
        margin-right: -8px;
        flex: var(--desktop-flex);
        min-width: 200px;
    }
}

.pg-editor-inner {
    padding-top: 0;
    padding-bottom: 8px;
    height: 100%;
    min-height: 0;
    font-size: 0.875rem;
    overflow: hidden;
}

/* ── Resize handle ─────────────────────────────── */
.pg-resize-handle {
    display: none;
}

@container (min-width: 43.75rem) {
    .pg-resize-handle {
        display: block;
        position: relative;
        z-index: 2;
        pointer-events: auto;
        width: 16px;
        cursor: col-resize;
        padding: 0;
        background: transparent;
        border: none;
        flex-shrink: 0;
    }

    .pg-resize-handle::before,
    .pg-resize-handle::after {
        content: '';
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: auto;
    }

    .pg-resize-handle::before {
        width: 1px;
        height: auto;
        background-color: hsl(210deg 15% 16%);
    }

    .pg-resize-handle::after {
        width: 11px;
        background-color: rgba(43, 51, 59, 0.5);
        opacity: 0;
        transform: scaleX(0);
        transition: opacity 0.5s, transform 0.5s;
    }

    .pg-resize-handle:hover::after {
        opacity: 1;
        transform: scaleX(1);
        transition: opacity 0.25s, transform 0.5s cubic-bezier(0.17, 0.67, 0.44, 1);
    }
}

/* ── Preview pane ──────────────────────────────── */
.pg-preview-pane {
    border-top: 1px solid hsl(210deg 15% 16%);
    flex: 1 1;
    min-height: 0;
    overflow: hidden;
}

@container (min-width: 43.75rem) {
    .pg-preview-pane {
        margin-left: -8px;
        border-top: none;
        flex: var(--desktop-flex);
        min-width: 200px;
    }
}

.pg-preview-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 0;
    font-size: 0.875rem;
}

/* ── Preview tabs ──────────────────────────────── */
.pg-preview-tabs {
    display: flex;
    align-items: center;
    height: 2.5rem;
    border-bottom: 1px solid hsl(210deg 15% 16%);
    padding: 0 16px;
}

.pg-tab {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 8px;
    margin-bottom: -1px;
    border-bottom: 1px solid transparent;
    color: hsl(207deg 23% 52%);
    text-transform: capitalize;
    background: transparent;
    border-top: none;
    border-left: none;
    border-right: none;
    font-size: inherit;
    font-family: inherit;
    cursor: pointer;
    transition: color 150ms ease;
}

.pg-tab:first-of-type {
    margin-left: -8px;
}

.pg-tab:hover {
    color: #fff;
}

.pg-tab:focus-visible {
    outline-color: var(--color-primary);
    outline-offset: -1px;
}

.pg-tab-active {
    color: #fff;
    border-bottom-color: var(--color-primary);
}

/* ── Preview body ──────────────────────────────── */
.pg-preview-body {
    flex: 1 1;
    min-height: 0;
    position: relative;
    padding: 16px;
    isolation: isolate;
}

.pg-preview-frame {
    border-radius: 4px;
    overflow: hidden;
    overflow: clip;
    height: 100%;
}

/* ── Status ────────────────────────────────────── */
.pg-status {
    margin: 12px 0;
    border-radius: 6px;
    font-size: 14px;
    padding: 10px 16px;
    text-align: center;
    font-weight: 500;
}

.pg-status.loading {
    background: #dbeafe;
    color: #1e40af;
}

.pg-status.success {
    background: #dcfce7;
    color: #166534;
}

.pg-status.error {
    background: #fee2e2;
    color: #dc2626;
}

.pg-fade-enter-active,
.pg-fade-leave-active {
    transition: opacity 0.3s ease;
}

.pg-fade-enter-from,
.pg-fade-leave-to {
    opacity: 0;
}
</style>
