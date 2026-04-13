/**
 * PPTX Renderer
 *
 * Main renderer for converting HTML elements to PowerPoint presentations.
 */

import PptxGenJS from 'pptxgenjs';
import { ElementPaint, parseStackingContexts, StackingContext } from '../stacking-context';
import { Color } from '../../css/types/color';
import { isTransparent } from '../../css/types/color-utilities';
import { ElementContainer, FLAGS } from '../../dom/element-container';
import { Context } from '../../core/context';
import { Renderer } from '../renderer';
import { contains } from '../../core/bitwise';
import { ImageElementContainer } from '../../dom/replaced-elements/image-element-container';
import {
    InputElementContainer,
    CHECKBOX,
    RADIO,
    INPUT_COLOR,
    PLACEHOLDER_COLOR
} from '../../dom/replaced-elements/input-element-container';
import { SelectElementContainer } from '../../dom/elements/select-element-container';
import { TextareaElementContainer } from '../../dom/elements/textarea-element-container';
import { contentBox } from '../box-sizing';
import { BoundCurves } from '../bound-curves';
import { OBJECT_FIT } from '../../css/property-descriptors/object-fit';
import { LIST_STYLE_TYPE } from '../../css/property-descriptors/list-style-type';
import { DISPLAY } from '../../css/property-descriptors/display';
import { TEXT_ALIGN } from '../../css/property-descriptors/text-align';
import { PptxBackgroundRenderer } from './background-renderer';
import { PptxBorderRenderer } from './border-renderer';
import { PptxTextRenderer } from './text-renderer';
import { colorToPptx, getRotation, getShadow, imageToBase64, pxToInches } from './utils';

export interface PptxRenderOptions {
    scale: number;
    x: number;
    y: number;
    width: number;
    height: number;
    backgroundColor?: Color | null;
    slideLayout?: 'LAYOUT_16x9' | 'LAYOUT_4x3' | 'LAYOUT_16x10' | 'LAYOUT_WIDE' | 'LAYOUT_USER';
    title?: string;
    author?: string;
    company?: string;
    /**
     * External PptxGenJS instance to add slides to (for multi-slide support)
     */
    pptx?: PptxGenJS;
}

export type PptxRenderConfigurations = PptxRenderOptions;

export class PptxRenderer extends Renderer {
    private pptx: PptxGenJS;
    private slide: PptxGenJS.Slide;

    // Specialized renderers
    private backgroundRenderer: PptxBackgroundRenderer;
    private borderRenderer: PptxBorderRenderer;
    private textRenderer: PptxTextRenderer;

    private elementCount: number = 0;

    constructor(context: Context, options: PptxRenderConfigurations) {
        super(context, options as any);

        // Use external PptxGenJS instance if provided, otherwise create new one
        if (options.pptx) {
            this.pptx = options.pptx;
        } else {
            this.pptx = new PptxGenJS();
            this.pptx.layout = options.slideLayout || 'LAYOUT_16x9';

            // Set metadata only for new instance
            if (options.title) this.pptx.title = options.title;
            if (options.author) this.pptx.author = options.author;
            if (options.company) this.pptx.company = options.company;
        }

        // Create slide
        this.slide = this.pptx.addSlide();

        // Initialize specialized renderers
        const rendererDeps = {
            slide: this.slide,
            options: {
                x: options.x,
                y: options.y,
                scale: options.scale
            }
        };

        this.backgroundRenderer = new PptxBackgroundRenderer(rendererDeps);
        this.borderRenderer = new PptxBorderRenderer(rendererDeps);
        this.textRenderer = new PptxTextRenderer(rendererDeps);
    }

    async renderStack(stack: StackingContext): Promise<void> {
        const styles = stack.element.container.styles;
        if (styles.isVisible()) {
            await this.renderStackContent(stack);
        }
    }

    async renderNode(paint: ElementPaint): Promise<void> {
        if (contains(paint.container.flags, FLAGS.DEBUG_RENDER)) {
            debugger;
        }

        const isVisible = paint.container.styles.isVisible();
        if (isVisible) {
            await this.renderNodeBackgroundAndBorders(paint);
            await this.renderNodeContent(paint);
        }
    }

    /**
     * Render background and borders for a node
     */
    async renderNodeBackgroundAndBorders(paint: ElementPaint): Promise<void> {
        const container = paint.container;
        const curves = paint.curves;

        // Render background using background renderer
        await this.backgroundRenderer.renderBackgrounds(container, curves);

        // Render borders using border renderer
        await this.borderRenderer.renderBorders(container, curves);

        this.elementCount++;
    }

    /**
     * Render content for a node (text, images, etc.)
     */
    async renderNodeContent(paint: ElementPaint): Promise<void> {
        const container = paint.container;
        const curves = paint.curves;

        // Render list items with built-in PPTX bullets
        // For list items, we render text with bullet option, so skip separate text rendering
        const isListItem = contains(container.styles.display, DISPLAY.LIST_ITEM);
        const hasListMarker = paint.listValue && container.styles.listStyleType !== LIST_STYLE_TYPE.NONE;

        if (isListItem && hasListMarker) {
            // Render list item with bullet - this includes the text
            this.textRenderer.renderListMarker(paint);
        } else {
            // Render text nodes using text renderer
            // Text is rendered at its actual position from textBounds
            // Inline children will render their own text at their positions
            const hasText = container.textNodes && container.textNodes.length > 0;

            if (hasText) {
                this.textRenderer.renderTextNodes(container);
            }
        }

        // Render checkbox/radio check marks
        if (container instanceof InputElementContainer) {
            this.renderInputCheckMark(container);
        }

        // Render form element text values (input, textarea, select)
        if (this.isTextInputElement(container)) {
            this.renderFormElementText(
                container as InputElementContainer | TextareaElementContainer | SelectElementContainer
            );
        }

        // Render images
        if (container instanceof ImageElementContainer) {
            await this.renderImage(container, curves);
        }

        // Note: Child elements are rendered through stacking context, not here
        // This prevents duplicate rendering
    }

    /**
     * Render an image element
     */
    private async renderImage(container: ImageElementContainer, _curves: BoundCurves): Promise<void> {
        const intrinsicWidth = container.intrinsicWidth;
        const intrinsicHeight = container.intrinsicHeight;

        if (!intrinsicWidth || !intrinsicHeight || intrinsicWidth <= 0 || intrinsicHeight <= 0) {
            return;
        }

        let image: HTMLImageElement | null = null;
        try {
            image = await this.context.cache.match(container.src);
        } catch (e) {
            this.context.logger.error(`Error loading image ${container.src}`);
            return;
        }

        if (!image || !image.src) {
            return;
        }

        const box = contentBox(container as any);

        let dx: number = box.left;
        let dy: number = box.top;
        let dw: number = box.width;
        let dh: number = box.height;

        const { objectFit } = container.styles;
        const boxRatio = dw / dh;
        const imgRatio = intrinsicWidth / intrinsicHeight;

        // Apply object-fit
        if (objectFit === OBJECT_FIT.CONTAIN) {
            if (imgRatio > boxRatio) {
                dh = dw / imgRatio;
                dy += (box.height - dh) / 2;
            } else {
                dw = dh * imgRatio;
                dx += (box.width - dw) / 2;
            }
        } else if (objectFit === OBJECT_FIT.COVER) {
            // Cover fills the entire box - no adjustment needed for PPTX
        } else if (objectFit === OBJECT_FIT.SCALE_DOWN) {
            const containW = imgRatio > boxRatio ? dw : dh * imgRatio;
            const noneW = intrinsicWidth > dw ? intrinsicWidth : dw;
            if (containW < noneW) {
                if (imgRatio > boxRatio) {
                    dh = dw / imgRatio;
                    dy += (box.height - dh) / 2;
                } else {
                    dw = dh * imgRatio;
                    dx += (box.width - dw) / 2;
                }
            }
        }

        const options = this.options as PptxRenderOptions;
        const scale = options.scale;

        const x = pxToInches((dx - options.x) / scale);
        const y = pxToInches((dy - options.y) / scale);
        const w = pxToInches(dw / scale);
        const h = pxToInches(dh / scale);

        const imgData = imageToBase64(image);
        this.slide.addImage({
            data: imgData,
            x: Math.max(0, x),
            y: Math.max(0, y),
            w: Math.max(0.01, w),
            h: Math.max(0.01, h),
            rotate: getRotation(container),
            shadow: getShadow(container.styles.boxShadow)
        });
    }

    /**
     * Check if a container is a text-bearing form element (not checkbox/radio).
     */
    private isTextInputElement(
        container: ElementContainer
    ): container is InputElementContainer | TextareaElementContainer | SelectElementContainer {
        if (container instanceof TextareaElementContainer) return true;
        if (container instanceof SelectElementContainer) return true;
        if (container instanceof InputElementContainer && container.type !== RADIO && container.type !== CHECKBOX) {
            return true;
        }
        return false;
    }

    /**
     * Render checkbox checkmark or radio filled circle.
     */
    private renderInputCheckMark(container: InputElementContainer): void {
        if (!container.checked) return;

        const options = this.options as PptxRenderOptions;
        const scale = options.scale;
        const size = Math.min(container.bounds.width, container.bounds.height);
        const cx = container.bounds.left + size / 2;
        const cy = container.bounds.top + size / 2;

        if (container.type === CHECKBOX) {
            // Render a checkmark as a text character, positioned to match the canvas renderer's
            // path-based checkmark (centered around ~40% from left, ~55% from top of the box)
            const markSize = size * 0.65;
            const markX = container.bounds.left + (size - markSize) / 2;
            const markY = container.bounds.top + (size - markSize) / 2;
            const x = pxToInches((markX - options.x) / scale);
            const y = pxToInches((markY - options.y) / scale);
            const w = pxToInches(markSize / scale);
            const h = pxToInches(markSize / scale);
            const fontSize = Math.max(6, Math.round(markSize * 0.75));

            this.slide.addText('\u2713', {
                x: Math.max(0, x),
                y: Math.max(0, y),
                w: Math.max(0.01, w),
                h: Math.max(0.01, h),
                fontSize,
                fontFace: 'Arial',
                color: colorToPptx(INPUT_COLOR),
                align: 'left',
                valign: 'top',
                bold: true,
                margin: [0, 0, 0, 0]
            });
        } else if (container.type === RADIO) {
            // Render a filled circle as a shape
            const radius = size / 4;
            const x = pxToInches((cx - radius - options.x) / scale);
            const y = pxToInches((cy - radius - options.y) / scale);
            const d = pxToInches((radius * 2) / scale);

            this.slide.addShape('ellipse' as any, {
                x: Math.max(0, x),
                y: Math.max(0, y),
                w: Math.max(0.01, d),
                h: Math.max(0.01, d),
                fill: { color: colorToPptx(INPUT_COLOR) }
            });
        }
    }

    /**
     * Render the text value of a form element (input, textarea, select).
     */
    private renderFormElementText(
        container: InputElementContainer | TextareaElementContainer | SelectElementContainer
    ): void {
        if (!container.value || container.value.length === 0) return;

        const options = this.options as PptxRenderOptions;
        const scale = options.scale;
        const styles = container.styles;

        const box = contentBox(container);
        if (box.width <= 0 || box.height <= 0) return;

        const fontFamily = styles.fontFamily?.[0] || 'Arial';
        const fontSizeInPixels = styles.fontSize?.number || 16;
        const fontSizeInPoints = Math.max(6, Math.round(fontSizeInPixels * 0.75 * 100) / 100);

        // Use placeholder color when showing placeholder text
        const isPlaceholder = container instanceof InputElementContainer && container.isPlaceholder;
        const color = isPlaceholder ? colorToPptx(PLACEHOLDER_COLOR) : colorToPptx(styles.color);

        // Single-line elements (input, select) get vertical centering; textarea does not
        const isSingleLine = container instanceof InputElementContainer || container instanceof SelectElementContainer;
        let yOffset = 0;
        if (isSingleLine) {
            yOffset = (box.height - fontSizeInPixels) / 2;
        }

        const x = pxToInches((box.left - options.x) / scale);
        const y = pxToInches((box.top + yOffset - options.y) / scale);
        const w = pxToInches(box.width / scale);
        const h = pxToInches((box.height - yOffset) / scale);

        let align: PptxGenJS.TextPropsOptions['align'] = 'left';
        switch (styles.textAlign) {
            case TEXT_ALIGN.CENTER:
                align = 'center';
                break;
            case TEXT_ALIGN.RIGHT:
                align = 'right';
                break;
        }

        this.slide.addText(container.value, {
            x: Math.max(0, x),
            y: Math.max(0, y),
            w: Math.max(0.01, w),
            h: Math.max(0.01, h),
            fontSize: fontSizeInPoints,
            fontFace: fontFamily,
            color,
            align,
            valign: isSingleLine ? 'middle' : 'top',
            wrap: !isSingleLine,
            margin: [0, 0, 0, 0],
            rotate: getRotation(container),
            shadow: getShadow(styles.boxShadow)
        });
    }

    /**
     * Render stacking context content following CSS painting order
     */
    async renderStackContent(stack: StackingContext): Promise<void> {
        if (contains(stack.element.container.flags, FLAGS.DEBUG_RENDER)) {
            debugger;
        }

        // 1. Background and borders
        await this.renderNodeBackgroundAndBorders(stack.element);

        // 2. Negative z-index children
        for (const child of stack.negativeZIndex) {
            await this.renderStack(child);
        }

        // 3. Content
        await this.renderNodeContent(stack.element);

        // Block level elements
        for (const child of stack.nonInlineLevel) {
            await this.renderNode(child);
        }

        // 4. Non-positioned floats
        for (const child of stack.nonPositionedFloats) {
            await this.renderStack(child);
        }

        // 5. Non-positioned inline level
        for (const child of stack.nonPositionedInlineLevel) {
            await this.renderStack(child);
        }

        for (const child of stack.inlineLevel) {
            await this.renderNode(child);
        }

        // 6. Zero/auto z-index or transformed or opacity
        for (const child of stack.zeroOrAutoZIndexOrTransformedOrOpacity) {
            await this.renderStack(child);
        }

        // 7. Positive z-index children
        for (const child of stack.positiveZIndex) {
            await this.renderStack(child);
        }
    }

    /**
     * Main render method
     */
    async render(element: ElementContainer): Promise<PptxGenJS> {
        const options = this.options as PptxRenderOptions;

        // Set slide background - use element's background color if available, otherwise white
        if (!isTransparent(element.styles.backgroundColor)) {
            this.slide.background = { color: colorToPptx(element.styles.backgroundColor) };
        } else if (options.backgroundColor && !isTransparent(options.backgroundColor)) {
            this.slide.background = { color: colorToPptx(options.backgroundColor) };
        } else {
            // Default to white background
            this.slide.background = { color: 'FFFFFF' };
        }

        this.context.logger.debug(
            `PPTX render starting: x=${options.x}, y=${options.y}, ` +
                `width=${options.width}, height=${options.height}, scale=${options.scale}`
        );

        // Parse stacking contexts and render
        const stack = parseStackingContexts(element);

        await this.renderStack(stack);

        this.context.logger.debug(`PPTX render complete. Elements rendered: ${this.elementCount}`);

        return this.pptx;
    }

    /**
     * Get the PPTX instance
     */
    getPptx(): PptxGenJS {
        return this.pptx;
    }

    /**
     * Save to file (Node.js)
     */
    async save(filename: string = 'presentation.pptx'): Promise<void> {
        await this.pptx.writeFile({ fileName: filename });
    }

    /**
     * Get as Blob (browser)
     */
    async getBlob(): Promise<Blob> {
        return this.pptx.write({ outputType: 'blob' }) as Promise<Blob>;
    }

    /**
     * Get as base64
     */
    async getBase64(): Promise<string> {
        return this.pptx.write({ outputType: 'base64' }) as Promise<string>;
    }

    /**
     * Get as ArrayBuffer
     */
    async getArrayBuffer(): Promise<ArrayBuffer> {
        return this.pptx.write({ outputType: 'arraybuffer' }) as Promise<ArrayBuffer>;
    }
}
