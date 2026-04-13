import { ref, readonly, type Ref, type DeepReadonly } from 'vue';

export interface StatusState {
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
}

export interface ConversionOptions {
    title?: string;
    filename?: string;
    author?: string;
}

interface Html2PptxModule {
    default?: (elements: HTMLElement[], options?: Record<string, unknown>) => Promise<PptxGenJS>;
    html2pptx?: (elements: HTMLElement[], options?: Record<string, unknown>) => Promise<PptxGenJS>;
}

interface PptxGenJS {
    write(options: { outputType: 'blob' }): Promise<Blob>;
}

let html2pptxCache: ((elements: HTMLElement[], options?: Record<string, unknown>) => Promise<PptxGenJS>) | null = null;

export function useHtml2Pptx() {
    const isConverting = ref(false);
    const status = ref<StatusState>({ type: 'idle', message: '' });

    async function getHtml2Pptx(): Promise<
        (elements: HTMLElement[], options?: Record<string, unknown>) => Promise<PptxGenJS>
    > {
        if (html2pptxCache) return html2pptxCache;

        const mod = (await import('html2pptx-pro')) as Html2PptxModule;
        const fn = mod.default || mod.html2pptx;
        if (!fn) throw new Error('html2pptx not found');
        html2pptxCache = fn;
        return html2pptxCache;
    }

    function setStatus(type: StatusState['type'], message: string, autoClear = 0): void {
        status.value = { type, message };
        if (autoClear > 0 && type === 'success') {
            setTimeout(() => {
                status.value = { type: 'idle', message: '' };
            }, autoClear);
        }
    }

    async function convertElements(
        elements: HTMLElement[],
        options: ConversionOptions = {}
    ): Promise<PptxGenJS | null> {
        if (elements.length === 0) {
            setStatus('error', 'No slide elements found.');
            return null;
        }

        isConverting.value = true;
        setStatus('loading', 'Converting to PPTX...');

        try {
            const html2pptx = await getHtml2Pptx();

            const pptx = await html2pptx(elements, {
                title: options.title || 'html2pptx-pro Demo',
                author: options.author || 'Demo',
                slideLayout: 'LAYOUT_16x9'
            });

            setStatus('loading', 'Preparing download...');

            const blob = await pptx.write({ outputType: 'blob' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = options.filename || 'html2pptx-demo.pptx';
            a.click();
            URL.revokeObjectURL(url);

            setStatus('success', 'PPTX downloaded successfully!', 3000);

            return pptx;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setStatus('error', `Error: ${message}`);
            return null;
        } finally {
            isConverting.value = false;
        }
    }

    return {
        isConverting: readonly(isConverting) as DeepReadonly<Ref<boolean>>,
        status: readonly(status) as DeepReadonly<Ref<StatusState>>,
        setStatus,
        convertElements
    };
}
