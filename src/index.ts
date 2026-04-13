import { Bounds, parseBounds, parseDocumentSize } from './css/layout/bounds';
import { COLORS, parseColor } from './css/types/color';
import { isTransparent } from './css/types/color-utilities';
import { DocumentCloner } from './dom/document-cloner';
import type { CloneConfigurations, CloneOptions, WindowOptions } from './dom/document-cloner';
import { isBodyElement, isHTMLElement, parseTree } from './dom/node-parser';
import { ElementContainer } from './dom/element-container';
import { PptxRenderer } from './render/pptx/pptx-renderer';
import type { PptxRenderOptions, PptxRenderConfigurations } from './render/pptx/pptx-renderer';
import { Context } from './core/context';
import type { ContextOptions } from './core/context';
import { PptxConfig } from './config';
import type { ConfigOptions } from './config';
import { createDefaultValidator, Validator } from './core/validator';
import type { ValidationResult } from './core/validator';
import { PerformanceMonitor } from './core/performance-monitor';
import PptxGenJS from 'pptxgenjs';

/**
 * Options for html2pptx rendering
 */
export type Options = CloneOptions &
    WindowOptions &
    ContextOptions & {
        backgroundColor?: string | null;
        removeContainer?: boolean;
        cspNonce?: string;
        validator?: Validator;
        skipValidation?: boolean;
        enablePerformanceMonitoring?: boolean;
        /**
         * PPTX slide layout
         * @default 'LAYOUT_16x9'
         */
        slideLayout?: 'LAYOUT_16x9' | 'LAYOUT_4x3' | 'LAYOUT_16x10' | 'LAYOUT_WIDE' | 'LAYOUT_USER';
        /**
         * Title for the presentation
         */
        title?: string;
        /**
         * Author of the presentation
         */
        author?: string;
        /**
         * Company name
         */
        company?: string;
        /**
         * Scale factor for rendering
         * @default 1
         */
        scale?: number;
        /**
         * X offset for rendering
         * @default 0
         */
        x?: number;
        /**
         * Y offset for rendering
         * @default 0
         */
        y?: number;
        /**
         * Width of the output
         */
        width?: number;
        /**
         * Height of the output
         */
        height?: number;
        /**
         * External PptxGenJS instance to add slides to (for multi-slide support)
         * @internal
         */
        pptx?: PptxGenJS;
    };

/**
 * Main html2pptx function - converts HTML element(s) to PowerPoint presentation
 *
 * @param element - Single HTML element or array of HTML elements to convert
 * @param options - PPTX rendering options
 * @returns Promise resolving to PptxGenJS instance
 *
 * @example
 * ```typescript
 * import html2pptx from 'html2pptx-pro';
 *
 * // Single slide
 * const pptx = await html2pptx(document.getElementById('my-element'));
 * await pptx.writeFile({ fileName: 'output.pptx' });
 *
 * // Multiple slides
 * const pptx = await html2pptx([
 *   document.getElementById('slide1'),
 *   document.getElementById('slide2'),
 *   document.getElementById('slide3')
 * ], {
 *   title: 'My Presentation',
 *   author: 'John Doe'
 * });
 *
 * // Get as blob for download
 * const blob = await pptx.write({ outputType: 'blob' });
 * ```
 */
const html2pptx = async (
    element: HTMLElement | HTMLElement[],
    options: Partial<Options> = {},
    config?: PptxConfig
): Promise<PptxGenJS> => {
    // Normalize to array
    const elements = Array.isArray(element) ? element : [element];

    if (elements.length === 0) {
        throw new Error('No elements provided');
    }

    // If single element, use the original render function
    if (elements.length === 1) {
        const finalConfig =
            config ||
            PptxConfig.fromElement(elements[0], {
                cspNonce: options.cspNonce,
                cache: options.cache
            });
        return renderElementToPptx(elements[0], options, finalConfig);
    }

    // Multiple elements - create a new PptxGenJS instance
    const pptx = new PptxGenJS();
    pptx.layout = options.slideLayout || 'LAYOUT_16x9';

    // Set metadata
    if (options.title) pptx.title = options.title;
    if (options.author) pptx.author = options.author;
    if (options.company) pptx.company = options.company;

    // Process each element as a separate slide
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el) {
            console.warn(`Skipping null element at index ${i}`);
            continue;
        }

        // Create configuration for this element
        const elementConfig =
            config ||
            PptxConfig.fromElement(el, {
                cspNonce: options.cspNonce,
                cache: options.cache
            });

        // Render this element to the same PptxGenJS instance
        await renderElementToPptx(el, { ...options, pptx }, elementConfig);
    }

    return pptx;
};

export default html2pptx;
export { html2pptx, PptxConfig, Validator, createDefaultValidator, PerformanceMonitor, PptxRenderer };
export type { ConfigOptions, ValidationResult, PptxRenderOptions, PptxRenderConfigurations };

/**
 * Coerce number-like option values
 */
const coerceNumberOptions = (opts: Partial<Options>): void => {
    const numKeys: (keyof Options)[] = [
        'scale',
        'width',
        'height',
        'imageTimeout',
        'x',
        'y',
        'windowWidth',
        'windowHeight',
        'scrollX',
        'scrollY'
    ];
    numKeys.forEach((key) => {
        const v = opts[key];
        if (v !== undefined && v !== null && typeof v !== 'number') {
            const n = Number(v);
            if (!Number.isNaN(n)) {
                (opts as Record<string, unknown>)[key] = n;
            }
        }
    });
};

/**
 * Slide dimensions in inches for each pptxgenjs layout
 */
const SLIDE_DIMENSIONS: Record<string, { width: number; height: number }> = {
    LAYOUT_16x9: { width: 10, height: 5.625 },
    LAYOUT_4x3: { width: 10, height: 7.5 },
    LAYOUT_16x10: { width: 10, height: 6.25 },
    LAYOUT_WIDE: { width: 13.33, height: 7.5 }
};

/**
 * Get slide dimensions for a layout. Returns { width, height } in inches.
 */
const getSlideDimensions = (slideLayout?: string): { width: number; height: number } => {
    return SLIDE_DIMENSIONS[slideLayout || 'LAYOUT_16x9'] || SLIDE_DIMENSIONS['LAYOUT_16x9'];
};

/**
 * Compute scale factor so the element fits within the slide without upscaling.
 * Only scales down when the element is larger than the slide.
 */
const computeAutoScale = (elementWidth: number, elementHeight: number, slideLayout?: string): number => {
    const dims = getSlideDimensions(slideLayout);
    if (!dims || elementWidth <= 0 || elementHeight <= 0) return 1;

    const slideWidthPx = dims.width * 96;
    const slideHeightPx = dims.height * 96;

    const scaleByWidth = elementWidth / slideWidthPx;
    const scaleByHeight = elementHeight / slideHeightPx;

    // Only scale down (>1), never upscale (<1)
    return Math.max(1, Math.max(scaleByWidth, scaleByHeight));
};

/**
 * Compute pixel offsets to center the element on the slide.
 * Returns { dx, dy } in CSS pixels (pre-scale) to subtract from options.x/y.
 */
const computeCenterOffset = (
    elementWidth: number,
    elementHeight: number,
    scale: number,
    slideLayout?: string
): { dx: number; dy: number } => {
    const dims = getSlideDimensions(slideLayout);

    const elementWidthInches = elementWidth / scale / 96;
    const elementHeightInches = elementHeight / scale / 96;

    const dxInches = (dims.width - elementWidthInches) / 2;
    const dyInches = (dims.height - elementHeightInches) / 2;

    // Convert back to CSS pixels (pre-scale coordinate space)
    return {
        dx: dxInches * 96 * scale,
        dy: dyInches * 96 * scale
    };
};

/**
 * Render HTML element to PPTX presentation
 */
const renderElementToPptx = async (
    element: HTMLElement,
    opts: Partial<Options>,
    config: PptxConfig
): Promise<PptxGenJS> => {
    coerceNumberOptions(opts);

    // Input validation (unless explicitly skipped)
    if (!opts.skipValidation) {
        const validator = opts.validator || createDefaultValidator();

        // Validate element
        const elementValidation = validator.validateElement(element);
        if (!elementValidation.valid) {
            throw new Error(elementValidation.error);
        }
    }

    if (!element || typeof element !== 'object') {
        throw new Error('Invalid element provided as first argument');
    }
    const ownerDocument = element.ownerDocument;

    if (!ownerDocument) {
        throw new Error(`Element is not attached to a Document`);
    }

    const defaultView = ownerDocument.defaultView;

    if (!defaultView) {
        throw new Error(`Document is not attached to a Window`);
    }

    const resourceOptions = {
        allowTaint: opts.allowTaint ?? false,
        imageTimeout: opts.imageTimeout ?? 15000,
        proxy: opts.proxy,
        useCORS: opts.useCORS ?? false,
        customIsSameOrigin: opts.customIsSameOrigin
    };

    const contextOptions = {
        logging: opts.logging ?? true,
        cache: opts.cache ?? config.cache,
        ...resourceOptions
    };

    // Fallbacks for minimal window
    const DEFAULT_WINDOW_WIDTH = 800;
    const DEFAULT_WINDOW_HEIGHT = 600;
    const DEFAULT_SCROLL = 0;
    const win = defaultView as Window & {
        innerWidth?: number;
        innerHeight?: number;
        pageXOffset?: number;
        pageYOffset?: number;
    };
    const windowOptions = {
        windowWidth: opts.windowWidth ?? win.innerWidth ?? DEFAULT_WINDOW_WIDTH,
        windowHeight: opts.windowHeight ?? win.innerHeight ?? DEFAULT_WINDOW_HEIGHT,
        scrollX: opts.scrollX ?? win.pageXOffset ?? DEFAULT_SCROLL,
        scrollY: opts.scrollY ?? win.pageYOffset ?? DEFAULT_SCROLL
    };

    const windowBounds = new Bounds(
        windowOptions.scrollX,
        windowOptions.scrollY,
        windowOptions.windowWidth,
        windowOptions.windowHeight
    );

    const context = new Context(contextOptions, windowBounds, config);

    // Initialize performance monitoring if enabled
    const performanceMonitoring = opts.enablePerformanceMonitoring ?? opts.logging ?? false;
    const perfMonitor = new PerformanceMonitor(context, performanceMonitoring);

    perfMonitor.start('total', {
        width: windowOptions.windowWidth,
        height: windowOptions.windowHeight
    });

    const cloneOptions: CloneConfigurations = {
        allowTaint: opts.allowTaint ?? false,
        onclone: opts.onclone,
        ignoreElements: opts.ignoreElements,
        iframeContainer: opts.iframeContainer,
        inlineImages: true, // Need inline images for PPTX
        copyStyles: true,
        cspNonce: opts.cspNonce ?? config.cspNonce
    };

    context.logger.debug(
        `Starting document clone for PPTX with size ${windowBounds.width}x${
            windowBounds.height
        } scrolled to ${-windowBounds.left},${-windowBounds.top}`
    );

    perfMonitor.start('clone');
    const documentCloner = new DocumentCloner(context, element, cloneOptions);
    const clonedElement = documentCloner.clonedReferenceElement;
    if (!clonedElement) {
        throw new Error('Unable to find element in cloned iframe');
    }

    const container = await documentCloner.toIFrame(ownerDocument, windowBounds);
    perfMonitor.end('clone');

    // Reset transform on the cloned element before measuring bounds.
    // DOMNormalizer runs later (inside parseTree), but parseBounds here needs
    // layout-space dimensions. Without this, getBoundingClientRect() returns
    // the visual (post-transform) size, which is wrong when the source element
    // has CSS transforms applied (e.g. scale for responsive previews).
    if (clonedElement instanceof HTMLElement && clonedElement.style.transform) {
        clonedElement.style.transform = 'translate(0, 0)';
    }

    const { width, height, left, top } =
        isBodyElement(clonedElement) || isHTMLElement(clonedElement)
            ? parseDocumentSize(clonedElement.ownerDocument)
            : parseBounds(context, clonedElement);

    const backgroundColor = parseBackgroundColor(context, clonedElement, opts.backgroundColor);

    // Auto-calculate scale to fit element to slide when not explicitly set
    const scale = opts.scale ?? computeAutoScale(width, height, opts.slideLayout);

    // Center element on the slide
    const center = computeCenterOffset(width, height, scale, opts.slideLayout);

    const renderOptions: PptxRenderConfigurations = {
        backgroundColor,
        scale,
        x: (opts.x ?? 0) + left - center.dx,
        y: (opts.y ?? 0) + top - center.dy,
        width: opts.width ?? Math.ceil(width),
        height: opts.height ?? Math.ceil(height),
        slideLayout: opts.slideLayout,
        title: opts.title,
        author: opts.author,
        company: opts.company,
        pptx: opts.pptx
    };

    let root: ElementContainer | undefined;
    let pptx: PptxGenJS;

    try {
        context.logger.debug(
            `Document cloned, element located at ${left},${top} with size ${width}x${height} for PPTX rendering`
        );

        context.logger.debug(`Starting DOM parsing`);
        perfMonitor.start('parse');
        root = parseTree(context, clonedElement);
        perfMonitor.end('parse');

        context.logger.debug(
            `Starting PPTX renderer for element at ${renderOptions.x},${renderOptions.y} with size ${renderOptions.width}x${renderOptions.height}`
        );

        perfMonitor.start('render');
        const renderer = new PptxRenderer(context, renderOptions);
        pptx = await renderer.render(root);
        perfMonitor.end('render');

        perfMonitor.start('cleanup');
        if (opts.removeContainer ?? true) {
            if (!DocumentCloner.destroy(container)) {
                context.logger.error(`Cannot detach cloned iframe as it is not in the DOM anymore`);
            }
        }
        perfMonitor.end('cleanup');

        perfMonitor.end('total');
        context.logger.debug(`Finished PPTX rendering`);

        // Log performance summary if monitoring is enabled
        if (performanceMonitoring) {
            perfMonitor.logSummary();
        }

        return pptx!;
    } finally {
        // Restore DOM modifications (animations, transforms) in cloned document
        if (root) {
            root.restoreTree();
        }
    }
};

const parseBackgroundColor = (context: Context, element: HTMLElement, backgroundColorOverride?: string | null) => {
    const ownerDocument = element.ownerDocument;
    // http://www.w3.org/TR/css3-background/#special-backgrounds
    const documentBackgroundColor = ownerDocument.documentElement
        ? parseColor(context, getComputedStyle(ownerDocument.documentElement).backgroundColor as string)
        : COLORS.TRANSPARENT;
    const bodyBackgroundColor = ownerDocument.body
        ? parseColor(context, getComputedStyle(ownerDocument.body).backgroundColor as string)
        : COLORS.TRANSPARENT;

    const defaultBackgroundColor =
        typeof backgroundColorOverride === 'string'
            ? parseColor(context, backgroundColorOverride)
            : backgroundColorOverride === null
              ? COLORS.TRANSPARENT
              : 0xffffffff;

    return element === ownerDocument.documentElement
        ? isTransparent(documentBackgroundColor)
            ? isTransparent(bodyBackgroundColor)
                ? defaultBackgroundColor
                : bodyBackgroundColor
            : documentBackgroundColor
        : defaultBackgroundColor;
};
