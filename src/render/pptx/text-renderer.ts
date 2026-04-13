/**
 * PPTX Text Renderer
 *
 * Renders each text segment at its exact browser-computed bounds,
 * following the same per-segment approach as the canvas text renderer.
 */

import PptxGenJS from 'pptxgenjs';
import { TextContainer } from '../../dom/text-container';
import { CSSParsedDeclaration } from '../../css';
import { BACKGROUND_CLIP } from '../../css/property-descriptors/background-clip';
import { TEXT_ALIGN } from '../../css/property-descriptors/text-align';
import { FONT_STYLE } from '../../css/property-descriptors/font-style';
import { TEXT_DECORATION_LINE } from '../../css/property-descriptors/text-decoration-line';
import { LIST_STYLE_TYPE } from '../../css/property-descriptors/list-style-type';
import { computeLineHeight } from '../../css/property-descriptors/line-height';
import { getAbsoluteValue } from '../../css/types/length-percentage';
import { contains } from '../../core/bitwise';
import { isLinearGradient } from '../../css/types/image';
import { isTransparent } from '../../css/types/color-utilities';
import { DISPLAY } from '../../css/property-descriptors/display';
import { colorToPptx, computeTransparency, getRotation, getShadow, pxToInches, parseFontFamily } from './utils';
import { ElementContainer, FLAGS } from '../../dom/element-container';
import { contentBox } from '../box-sizing';
import { ElementPaint } from '../stacking-context';

export interface PptxTextRendererDeps {
    slide: PptxGenJS.Slide;
    options: {
        x: number;
        y: number;
        scale: number;
    };
}

export interface TextRenderContext {
    textNodes: TextContainer[];
    styles: CSSParsedDeclaration;
    bounds: { left: number; top: number; width: number; height: number };
}

/**
 * Convert pixels to points (for font size)
 * 1px = 72/96 pt = 0.75pt
 */
const pxToPoints = (px: number): number => {
    return Math.round(px * 0.75 * 100) / 100;
};

export class PptxTextRenderer {
    private readonly slide: PptxGenJS.Slide;
    private readonly options: { x: number; y: number; scale: number };

    constructor(deps: PptxTextRendererDeps) {
        this.slide = deps.slide;
        this.options = deps.options;
    }

    /**
     * Render text nodes from a container
     */
    renderTextNodes(container: ElementContainer): void {
        for (const textContainer of container.textNodes) {
            this.renderText(textContainer, container);
        }
    }

    /**
     * Render a list marker and text for list items.
     *
     * In HTML, the ul/ol marker is centered within the padding-left area.
     * PptxGenJS `indent` = gap between bullet and text (points).
     */
    renderListMarker(paint: ElementPaint): void {
        const container = paint.container;
        const listValue = paint.listValue;
        if (!listValue) return;

        const scale = this.options.scale;
        const styles = container.styles;

        const fontFamily = parseFontFamily(styles.fontFamily?.[0] || 'Arial');
        const fontSizeInPixels = styles.fontSize?.number || 16;
        const fontSizeInPoints = pxToPoints(fontSizeInPixels);
        const color = this.getTextColor(styles);
        if (color === null) return;

        const textBounds = this.computeListTextBounds(container);
        const cBox = contentBox(container);

        const paddingLeftPx = this.getListOwnerPaddingLeft(paint);
        const halfPaddingPx = paddingLeftPx / 2;
        const indentPt = Math.max(4, Math.round(halfPaddingPx * 0.75));

        const x = pxToInches((cBox.left - halfPaddingPx - this.options.x) / scale);
        const y = pxToInches(((textBounds ? textBounds.top : cBox.top) - this.options.y) / scale);
        const w = pxToInches((cBox.width + halfPaddingPx) / scale);
        const h = pxToInches((textBounds ? textBounds.height : cBox.height) / scale);

        if (!(w > 0) || !(h > 0)) return;

        const listStyleType = styles.listStyleType;
        let bulletConfig: PptxGenJS.TextPropsOptions['bullet'];

        if (listStyleType === LIST_STYLE_TYPE.NONE) {
            bulletConfig = false;
        } else if (
            listStyleType === LIST_STYLE_TYPE.DECIMAL ||
            listStyleType === LIST_STYLE_TYPE.DECIMAL_LEADING_ZERO
        ) {
            const numMatch = listValue.match(/^(\d+)/);
            const startNum = numMatch ? parseInt(numMatch[1], 10) : 1;
            bulletConfig = { type: 'number', numberStartAt: startNum, indent: indentPt };
        } else {
            bulletConfig = { indent: indentPt };
        }

        let text = this.getListItemText(container);
        if (!text) return;

        // For CJK decimal and other non-standard list types that PptxGenJS
        // can't render natively, prepend the marker text directly
        if (listStyleType === LIST_STYLE_TYPE.CJK_DECIMAL) {
            bulletConfig = false;
            text = listValue + text;
        }

        const transparency = computeTransparency(styles.color, styles.opacity);

        const textOptions: PptxGenJS.TextPropsOptions = {
            x: Math.max(0, x),
            y: Math.max(0, y),
            w: Math.max(0.1, w),
            h: Math.max(0.1, h),
            fontSize: Math.max(6, fontSizeInPoints),
            fontFace: fontFamily,
            color: color,
            align: this.textAlignToPptx(styles.textAlign),
            valign: 'top',
            bullet: bulletConfig,
            wrap: true,
            margin: [0, 0, 0, 0],
            lineSpacing: this.computeLineSpacing(styles, fontSizeInPixels),
            paraSpaceBefore: 0,
            paraSpaceAfter: 0,
            transparency: transparency > 0 ? transparency : undefined,
            rotate: getRotation(container),
            shadow: getShadow(styles.boxShadow)
        };

        this.slide.addText(text, textOptions);
    }

    /**
     * Get text content from a list item container
     */
    private getListItemText(container: ElementContainer): string {
        const texts: string[] = [];
        for (const textContainer of container.textNodes) {
            const text = textContainer.text.trim();
            if (text) {
                texts.push(text);
            }
        }
        return texts.join(' ');
    }

    /**
     * Render a single text container as one text box.
     *
     * Block elements: use contentBox for all dimensions (x, y, w, h),
     * compute align/valign. This enables correct text alignment within
     * the CSS layout box.
     *
     * Inline elements (span, strong, em, etc.): use textBounds for
     * position and dimensions to prevent overlap when multiple inline
     * elements share a parent (e.g. <strong>/<em> inside a <p>).
     */
    private renderText(textContainer: TextContainer, container: ElementContainer): void {
        if (!textContainer.textBounds || textContainer.textBounds.length === 0) {
            return;
        }

        const scale = this.options.scale;
        const styles = container.styles;

        const fontFamily = parseFontFamily(styles.fontFamily?.[0] || 'Arial');
        const fontSizeInPixels = styles.fontSize?.number || 16;
        const fontSizeInPoints = pxToPoints(fontSizeInPixels);
        const color = this.getTextColor(styles);
        if (color === null) return;
        const bold = (styles.fontWeight || 400) >= 600;
        const italic = styles.fontStyle === FONT_STYLE.ITALIC;

        const textDecoration = styles.textDecorationLine || [];
        const hasUnderline = textDecoration.includes(TEXT_DECORATION_LINE.UNDERLINE);
        const hasStrikethrough = textDecoration.includes(TEXT_DECORATION_LINE.LINE_THROUGH);

        const allText = textContainer.text.trim();
        if (!allText) return;

        const textBounds = this.computeTextUnionBounds(textContainer);
        if (textBounds.width <= 0 || textBounds.height <= 0) return;

        const cBox = contentBox(container);
        // Use contentBox approach for block elements with a single text node:
        // the text fills the container, so contentBox dimensions and computed
        // align/valign are correct.
        //
        // Use textBounds approach for everything else (inline elements, or
        // block elements with multiple text nodes like <p> with <strong>/<em>
        // inside). Each text fragment needs its exact inline position.
        const isBlock = this.isBlockLevel(styles.display);
        // Only use contentBox when text is the sole content of the container.
        // If the container has child elements (e.g. <label><input> text</label>),
        // the text doesn't fill the full box — use textBounds for correct positioning.
        const useContentBox = isBlock && container.textNodes.length === 1 && container.elements.length === 0;

        let x: number;
        let y: number;
        let w: number;
        let h: number;
        let align: PptxGenJS.TextPropsOptions['align'];
        let valign: PptxGenJS.TextPropsOptions['valign'];
        let needsWrap: boolean;

        if (useContentBox) {
            x = pxToInches((cBox.left - this.options.x) / scale);
            y = pxToInches((cBox.top - this.options.y) / scale);
            w = pxToInches(cBox.width / scale);
            h = pxToInches(cBox.height / scale);
            const cssAlign = this.textAlignToPptx(styles.textAlign);
            align =
                cssAlign !== 'left' ? cssAlign : this.computeHalign(textBounds, cBox, fontSizeInPixels, styles.display);
            valign = this.computeValign(textBounds, cBox, fontSizeInPixels);
            const lineHeightPx = computeLineHeight(styles.lineHeight, fontSizeInPixels);
            // Use content box height to detect single-line text: if the
            // container can't physically fit two lines, text must be single-line.
            // This is more reliable than textBounds height which can be inflated
            // by word segments having different vertical extents.
            needsWrap = cBox.height >= lineHeightPx * 2;
        } else {
            x = pxToInches((textBounds.left - this.options.x) / scale);
            y = pxToInches((textBounds.top - this.options.y) / scale);
            w = pxToInches(textBounds.width / scale);
            h = pxToInches(textBounds.height / scale);
            align = 'left';
            valign = 'top';
            needsWrap = false;
        }

        if (!(w > 0) || !(h > 0)) return;

        const transparency = computeTransparency(styles.color, styles.opacity);

        const textOptions: PptxGenJS.TextPropsOptions = {
            x: Math.max(0, x),
            y: Math.max(0, y),
            w: Math.max(0.01, w),
            h: Math.max(0.01, h),
            fontSize: Math.max(6, fontSizeInPoints),
            fontFace: fontFamily,
            color: color,
            align: align,
            bold: bold,
            italic: italic,
            valign: valign,
            wrap: needsWrap,
            fit: needsWrap ? undefined : 'resize',
            margin: [0, 0, 0, 0],
            lineSpacing: this.computeLineSpacing(styles, fontSizeInPixels),
            paraSpaceBefore: 0,
            paraSpaceAfter: 0,
            underline: hasUnderline ? { style: 'sng' } : undefined,
            strike: hasStrikethrough ? 'sngStrike' : undefined,
            transparency: transparency > 0 ? transparency : undefined,
            rotate: getRotation(container),
            shadow: getShadow(styles.boxShadow)
        };

        this.slide.addText(allText, textOptions);
    }

    /**
     * Check if a CSS display value is block-level.
     */
    private isBlockLevel(display: number): boolean {
        return !!(display & DISPLAY.BLOCK || display & DISPLAY.FLEX || display & DISPLAY.LIST_ITEM);
    }

    /**
     * Compute vertical alignment by comparing where the text sits
     * relative to the container's content box.
     */
    private computeValign(
        textBounds: { top: number; height: number },
        cBox: { top: number; height: number },
        fontSizeInPixels: number
    ): 'top' | 'middle' | 'bottom' {
        const spaceAbove = textBounds.top - cBox.top;
        const spaceBelow = cBox.top + cBox.height - (textBounds.top + textBounds.height);
        const tolerance = fontSizeInPixels * 0.5;

        if (spaceAbove > tolerance && Math.abs(spaceAbove - spaceBelow) < tolerance) {
            return 'middle';
        }
        if (spaceAbove > spaceBelow + tolerance) {
            return 'bottom';
        }
        return 'top';
    }

    /**
     * Compute horizontal alignment by comparing where the text sits
     * relative to the container's content box.
     * This handles cases where centering is done by flexbox (justify-content)
     * rather than CSS text-align.
     */
    private computeHalign(
        textBounds: { left: number; width: number },
        cBox: { left: number; width: number },
        fontSizeInPixels: number,
        display?: number
    ): 'left' | 'center' | 'right' {
        const spaceLeft = textBounds.left - cBox.left;
        const spaceRight = cBox.left + cBox.width - (textBounds.left + textBounds.width);
        const tolerance = fontSizeInPixels * 0.5;

        if (spaceLeft > tolerance && Math.abs(spaceLeft - spaceRight) < tolerance) {
            return 'center';
        }
        if (spaceLeft > spaceRight + tolerance) {
            return 'right';
        }
        // For flex containers whose text fills (nearly) the full width,
        // the spatial check above can't distinguish left from center.
        // Only apply center when the text is roughly centered (both sides
        // have non-trivial space) but neither exceeded the tolerance above.
        if (display !== undefined && !!(display & DISPLAY.FLEX || display & DISPLAY.INLINE_FLEX)) {
            if (spaceLeft > 0 && spaceRight > 0 && Math.abs(spaceLeft - spaceRight) < fontSizeInPixels) {
                return 'center';
            }
        }
        return 'left';
    }

    /**
     * Compute the union bounding box of all text segments in a TextContainer.
     */
    private computeTextUnionBounds(textContainer: TextContainer): {
        left: number;
        top: number;
        width: number;
        height: number;
    } {
        let minLeft = Infinity;
        let minTop = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        for (const tb of textContainer.textBounds) {
            const b = tb.bounds;
            if (b.width === 0 && b.height === 0) continue;
            minLeft = Math.min(minLeft, b.left);
            minTop = Math.min(minTop, b.top);
            maxRight = Math.max(maxRight, b.left + b.width);
            maxBottom = Math.max(maxBottom, b.top + b.height);
        }

        if (minLeft === Infinity) {
            return { left: 0, top: 0, width: 0, height: 0 };
        }

        return {
            left: minLeft,
            top: minTop,
            width: maxRight - minLeft,
            height: maxBottom - minTop
        };
    }

    /**
     * Compute the union bounding box of all text nodes in a list item container.
     * Returns null if no valid text bounds are found.
     */
    private computeListTextBounds(container: ElementContainer): {
        left: number;
        top: number;
        width: number;
        height: number;
    } | null {
        let minLeft = Infinity;
        let minTop = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        for (const textContainer of container.textNodes) {
            for (const tb of textContainer.textBounds) {
                const b = tb.bounds;
                if (b.width === 0 && b.height === 0) continue;
                minLeft = Math.min(minLeft, b.left);
                minTop = Math.min(minTop, b.top);
                maxRight = Math.max(maxRight, b.left + b.width);
                maxBottom = Math.max(maxBottom, b.top + b.height);
            }
        }

        if (minTop === Infinity) return null;

        return {
            left: minLeft,
            top: minTop,
            width: maxRight - minLeft,
            height: maxBottom - minTop
        };
    }

    /**
     * Compute line spacing in points from CSS line-height.
     */
    private computeLineSpacing(styles: CSSParsedDeclaration, fontSizeInPixels: number): number {
        const lineHeightPx = computeLineHeight(styles.lineHeight, fontSizeInPixels);
        return pxToPoints(lineHeightPx);
    }

    /**
     * Map CSS text alignment to PPTX alignment
     */
    private textAlignToPptx(align: TEXT_ALIGN): 'left' | 'center' | 'right' {
        switch (align) {
            case TEXT_ALIGN.CENTER:
                return 'center';
            case TEXT_ALIGN.RIGHT:
                return 'right';
            case TEXT_ALIGN.LEFT:
            default:
                return 'left';
        }
    }

    /**
     * Get text color considering background-clip: text.
     * When background-clip is text and a linear gradient is present,
     * use the first gradient stop color as the text color.
     * When webkitTextFillColor is transparent and no gradient, return null to skip text.
     */
    private getTextColor(styles: CSSParsedDeclaration): string | null {
        const hasClipText = styles.backgroundClip.includes(BACKGROUND_CLIP.TEXT);

        if (hasClipText) {
            const backgroundImages = styles.backgroundImage;
            if (backgroundImages && backgroundImages.length > 0) {
                for (const bgImage of backgroundImages) {
                    if (isLinearGradient(bgImage)) {
                        const stops = bgImage.stops || [];
                        if (stops.length > 0) {
                            return colorToPptx(stops[0].color);
                        }
                    }
                }
            }

            if (isTransparent(styles.webkitTextFillColor)) {
                return null;
            }
        }

        return colorToPptx(styles.color);
    }

    /**
     * Walk up the paint tree to find the list owner (ul/ol) and return its padding-left.
     * Falls back to browser default of 40px if no list owner is found.
     */
    private getListOwnerPaddingLeft(paint: ElementPaint): number {
        let current = paint.parent;
        while (current) {
            if (contains(current.container.flags, FLAGS.IS_LIST_OWNER)) {
                return getAbsoluteValue(current.container.styles.paddingLeft, current.container.bounds.width);
            }
            current = current.parent;
        }
        return 40;
    }
}
