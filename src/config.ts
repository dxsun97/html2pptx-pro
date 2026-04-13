import { Cache } from './core/cache-storage';

/**
 * Configuration options for html2pptx
 */
export interface ConfigOptions {
    /**
     * Window object to use for DOM operations
     */
    window?: Window;

    /**
     * CSP nonce for inline styles
     * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
     */
    cspNonce?: string;

    /**
     * Cache instance to reuse across multiple calls
     * Useful for avoiding redundant image loads
     */
    cache?: Cache;
}

/**
 * html2pptx Configuration
 *
 * Manages configuration state for rendering.
 */
export class PptxConfig {
    readonly window: Window;
    readonly cspNonce?: string;
    readonly cache?: Cache;

    constructor(options: ConfigOptions = {}) {
        // Try to get window from options first, then fall back to global window
        this.window = options.window || (typeof window !== 'undefined' ? window : (null as any));

        if (!this.window) {
            throw new Error('Window object is required but not available');
        }

        this.cspNonce = options.cspNonce;
        this.cache = options.cache;
    }

    /**
     * Create configuration from an element
     * Extracts window from element's owner document
     */
    static fromElement(element: HTMLElement, options: Partial<ConfigOptions> = {}): PptxConfig {
        const ownerDocument = element.ownerDocument;

        if (!ownerDocument) {
            throw new Error('Element is not attached to a document');
        }

        const defaultView = ownerDocument.defaultView;

        if (!defaultView) {
            throw new Error('Document is not attached to a window');
        }

        return new PptxConfig({
            window: defaultView,
            ...options
        });
    }

    /**
     * Clone configuration with override options
     */
    clone(options: Partial<ConfigOptions> = {}): PptxConfig {
        return new PptxConfig({
            window: options.window || this.window,
            cspNonce: options.cspNonce ?? this.cspNonce,
            cache: options.cache ?? this.cache
        });
    }
}
