/**
 * PPTX Background Renderer
 *
 * Handles rendering of element backgrounds for PPTX output
 * Supports solid colors, border-radius, and linear gradients
 */

import PptxGenJS from 'pptxgenjs';
import { ElementContainer } from '../../dom/element-container';
import { isTransparent } from '../../css/types/color-utilities';
import { BoundCurves } from '../bound-curves';
import { isLinearGradient } from '../../css/types/image';
import { calculateGradientDirection, processColorStops } from '../../css/types/functions/gradient';
import { asString } from '../../css/types/color-utilities';
import { colorToPptx, computeTransparency, getRotation, getShadow, pxToInches } from './utils';
import { BACKGROUND_CLIP } from '../../css/property-descriptors/background-clip';
import { BORDER_STYLE } from '../../css/property-descriptors/border-style';
import { getAbsoluteValue } from '../../css/types/length-percentage';
import { CLIP_PATH_TYPE, ClipPathValue, ShapeRadius } from '../../css/property-descriptors/clip-path';

export interface PptxBackgroundRendererDeps {
    slide: PptxGenJS.Slide;
    options: {
        x: number;
        y: number;
        scale: number;
    };
}

/**
 * Calculate border radius from CSS styles
 * Returns the maximum radius for a simple rounded rectangle
 */
const getBorderRadius = (container: ElementContainer, boundsWidth: number): number => {
    const styles = container.styles;

    // Get border radius values (each is [horizontal, vertical])
    const corners = [
        styles.borderTopLeftRadius,
        styles.borderTopRightRadius,
        styles.borderBottomRightRadius,
        styles.borderBottomLeftRadius
    ];

    // Resolve each corner's horizontal radius
    const values: number[] = [];
    for (const r of corners) {
        const value = r?.[0];
        if (value) {
            const resolved = getAbsoluteValue(value, boundsWidth);
            if (resolved > 0) values.push(resolved);
        }
    }

    if (values.length === 0) return 0;

    // pptxgenjs only supports a single radius for all corners, use average
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Clamp to half the smaller dimension (matching CSS behavior)
    const maxAllowed = Math.min(boundsWidth, container.bounds.height) / 2;
    return Math.min(avg, maxAllowed);
};

export class PptxBackgroundRenderer {
    private readonly slide: PptxGenJS.Slide;
    private readonly options: { x: number; y: number; scale: number };

    constructor(deps: PptxBackgroundRendererDeps) {
        this.slide = deps.slide;
        this.options = deps.options;
    }

    /**
     * Render all backgrounds for an element
     */
    async renderBackgrounds(container: ElementContainer, _curves: BoundCurves): Promise<void> {
        // Skip background rendering when background-clip: text is set
        // The gradient color will be applied to the text instead
        if (container.styles.backgroundClip.includes(BACKGROUND_CLIP.TEXT)) {
            return;
        }

        const bounds = container.bounds;
        const options = this.options;
        const scale = options.scale;

        // Check if this element has any background to render
        const hasBackgroundColor = !isTransparent(container.styles.backgroundColor);
        const hasBackgroundImage = container.styles.backgroundImage && container.styles.backgroundImage.length > 0;

        // Calculate position
        const x = pxToInches((bounds.left - options.x) / scale);
        const y = pxToInches((bounds.top - options.y) / scale);
        const w = pxToInches(bounds.width / scale);
        const h = pxToInches(bounds.height / scale);

        // Skip invalid shapes
        if (!(w > 0) || !(h > 0)) {
            return;
        }

        // Get border radius
        const borderRadiusPx = getBorderRadius(container, bounds.width);
        const borderRadius = pxToInches(borderRadiusPx / scale);

        // Render rounded border even if there's no background
        if (borderRadius > 0) {
            this.renderRoundedBorder(container, x, y, w, h, borderRadius);
        }

        // Skip rest if no background at all
        if (!hasBackgroundColor && !hasBackgroundImage) {
            return;
        }

        // If clip-path is set, rasterize the background with the clip applied
        const clipPathValue = container.styles.clipPath;
        if (clipPathValue && clipPathValue.type !== CLIP_PATH_TYPE.NONE) {
            await this.renderClippedBackground(container, x, y, w, h);
            return;
        }

        // Check for background images/gradients first (they override background-color)
        const backgroundImages = container.styles.backgroundImage;
        let hasRenderedBackground = false;

        if (backgroundImages && backgroundImages.length > 0) {
            for (const bgImage of backgroundImages) {
                if (isLinearGradient(bgImage)) {
                    await this.renderLinearGradient(
                        x,
                        y,
                        w,
                        h,
                        bgImage,
                        borderRadius,
                        container.styles.opacity,
                        getRotation(container),
                        getShadow(container.styles.boxShadow)
                    );
                    hasRenderedBackground = true;
                }
                // Note: Radial gradients and URL images can be added later
            }
        }

        // Render solid background color if no gradient was rendered
        if (!hasRenderedBackground && !isTransparent(container.styles.backgroundColor)) {
            const bgColor = colorToPptx(container.styles.backgroundColor);

            // Use roundRect if border radius is set, otherwise rect
            const shapeType = borderRadius > 0 ? 'roundRect' : 'rect';
            const transparency = computeTransparency(container.styles.backgroundColor, container.styles.opacity);
            const shapeOptions: any = {
                x: Math.max(0, x),
                y: Math.max(0, y),
                w: Math.max(0.01, w),
                h: Math.max(0.01, h),
                fill: { color: bgColor, transparency: transparency > 0 ? transparency : undefined },
                line: { type: 'none' },
                rotate: getRotation(container),
                shadow: getShadow(container.styles.boxShadow)
            };

            if (borderRadius > 0) {
                shapeOptions.rectRadius = borderRadius;
            }

            this.slide.addShape(shapeType, shapeOptions);
        }
    }

    /**
     * Map CSS border style to pptxgenjs dashType
     */
    private borderStyleToDashType(
        style: BORDER_STYLE
    ): 'solid' | 'dash' | 'dashDot' | 'lgDash' | 'lgDashDot' | 'lgDashDotDot' | 'sysDash' | 'sysDot' {
        switch (style) {
            case BORDER_STYLE.DASHED:
                return 'sysDash';
            case BORDER_STYLE.DOTTED:
                return 'sysDot';
            default:
                return 'solid';
        }
    }

    /**
     * Render border for rounded rectangles
     */
    private renderRoundedBorder(
        container: ElementContainer,
        x: number,
        y: number,
        w: number,
        h: number,
        borderRadius: number
    ): void {
        const styles = container.styles;
        const hasBorder =
            styles.borderTopWidth > 0 ||
            styles.borderRightWidth > 0 ||
            styles.borderBottomWidth > 0 ||
            styles.borderLeftWidth > 0;

        if (!hasBorder) return;

        // Get border properties (use first non-transparent, non-none border)
        const sides = [
            { color: styles.borderTopColor, width: styles.borderTopWidth, style: styles.borderTopStyle },
            { color: styles.borderRightColor, width: styles.borderRightWidth, style: styles.borderRightStyle },
            { color: styles.borderBottomColor, width: styles.borderBottomWidth, style: styles.borderBottomStyle },
            { color: styles.borderLeftColor, width: styles.borderLeftWidth, style: styles.borderLeftStyle }
        ].filter((s) => s.style !== BORDER_STYLE.NONE && !isTransparent(s.color) && s.width > 0);

        if (sides.length === 0) return;

        const side = sides[0];
        const borderColor = colorToPptx(side.color);
        // pptxgenjs line.width is in points (1px = 72/96 pt = 0.75pt)
        const borderWidthPt = (side.width / this.options.scale) * (72 / 96);

        if (borderWidthPt <= 0) return;

        const dashType = this.borderStyleToDashType(side.style);

        // Handle double borders with two concentric rounded rects
        if (side.style === BORDER_STYLE.DOUBLE && side.width >= 3) {
            const lineWidth = Math.max(0.5, borderWidthPt / 3);
            const inset = pxToInches((side.width * 2) / (3 * this.options.scale));
            const lineOpts = { color: borderColor, width: lineWidth, dashType: 'solid' as const };

            this.slide.addShape('roundRect', {
                x: Math.max(0, x),
                y: Math.max(0, y),
                w: Math.max(0.01, w),
                h: Math.max(0.01, h),
                fill: { type: 'none' as const },
                line: lineOpts,
                rectRadius: borderRadius
            });
            this.slide.addShape('roundRect', {
                x: Math.max(0, x + inset),
                y: Math.max(0, y + inset),
                w: Math.max(0.01, w - inset * 2),
                h: Math.max(0.01, h - inset * 2),
                fill: { type: 'none' as const },
                line: lineOpts,
                rectRadius: Math.max(0, borderRadius - inset)
            });
            return;
        }

        // Render as a rounded rect with no fill, just stroke
        this.slide.addShape('roundRect', {
            x: Math.max(0, x),
            y: Math.max(0, y),
            w: Math.max(0.01, w),
            h: Math.max(0.01, h),
            fill: { type: 'none' as const },
            line: { color: borderColor, width: Math.max(0.5, borderWidthPt), dashType },
            rectRadius: borderRadius
        });
    }

    /**
     * Render a linear gradient background
     * Since pptxgenjs doesn't support gradient fills natively,
     * we render the gradient as an image using canvas
     */
    private async renderLinearGradient(
        x: number,
        y: number,
        w: number,
        h: number,
        gradient: any,
        borderRadius: number = 0,
        opacity: number = 1,
        rotate?: number,
        shadow?: PptxGenJS.ShadowProps
    ): Promise<void> {
        const stops = gradient.stops || [];
        if (stops.length < 2) {
            // Not enough stops for a gradient, fall back to solid color
            if (stops.length === 1) {
                const color = colorToPptx(stops[0].color);
                const shapeType = borderRadius > 0 ? 'roundRect' : 'rect';
                const shapeOptions: any = {
                    x: Math.max(0, x),
                    y: Math.max(0, y),
                    w: Math.max(0.01, w),
                    h: Math.max(0.01, h),
                    fill: { color },
                    line: { type: 'none' },
                    rotate,
                    shadow
                };
                if (borderRadius > 0) {
                    shapeOptions.rectRadius = borderRadius;
                }
                this.slide.addShape(shapeType, shapeOptions);
            }
            return;
        }

        // Create a canvas to render the gradient as an image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        // Use a reasonable size for the gradient image
        const imgWidth = Math.max(100, Math.round(w * 96)); // 96 DPI
        const imgHeight = Math.max(100, Math.round(h * 96));
        const scaledRadius = borderRadius * 96; // Scale radius to canvas size

        canvas.width = imgWidth;
        canvas.height = imgHeight;

        // Use the same gradient direction and stop processing as the canvas renderer
        const [lineLength, x0, x1, y0, y1] = calculateGradientDirection(gradient.angle, imgWidth, imgHeight);

        const canvasGradient = ctx.createLinearGradient(x0, y0, x1, y1);

        // Process color stops using the same algorithm as the canvas renderer
        processColorStops(stops, lineLength || 1).forEach((colorStop) =>
            canvasGradient.addColorStop(colorStop.stop, asString(colorStop.color))
        );

        // Apply opacity
        if (opacity < 1) {
            ctx.globalAlpha = opacity;
        }

        // Draw with rounded corners if border radius is set
        if (scaledRadius > 0) {
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(0, 0, imgWidth, imgHeight, scaledRadius);
            } else {
                // Fallback for browsers without roundRect support
                const r = Math.min(scaledRadius, imgWidth / 2, imgHeight / 2);
                ctx.moveTo(r, 0);
                ctx.arcTo(imgWidth, 0, imgWidth, imgHeight, r);
                ctx.arcTo(imgWidth, imgHeight, 0, imgHeight, r);
                ctx.arcTo(0, imgHeight, 0, 0, r);
                ctx.arcTo(0, 0, imgWidth, 0, r);
                ctx.closePath();
            }
            ctx.fillStyle = canvasGradient;
            ctx.fill();
        } else {
            ctx.fillStyle = canvasGradient;
            ctx.fillRect(0, 0, imgWidth, imgHeight);
        }

        // Convert to base64 data URL
        const dataUrl = canvas.toDataURL('image/png');

        // Add as background image
        this.slide.addImage({
            data: dataUrl,
            x: Math.max(0, x),
            y: Math.max(0, y),
            w: Math.max(0.01, w),
            h: Math.max(0.01, h),
            rotate,
            shadow
        });
    }

    /**
     * Render background with clip-path applied via canvas rasterization.
     * Handles all clip-path shape types: inset, circle, ellipse, polygon, path.
     */
    private async renderClippedBackground(
        container: ElementContainer,
        x: number,
        y: number,
        w: number,
        h: number
    ): Promise<void> {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imgWidth = Math.max(100, Math.round(w * 96));
        const imgHeight = Math.max(100, Math.round(h * 96));
        canvas.width = imgWidth;
        canvas.height = imgHeight;

        // Apply clip-path
        this.applyClipPath(ctx, container.styles.clipPath, imgWidth, imgHeight);

        // Apply opacity
        if (container.styles.opacity < 1) {
            ctx.globalAlpha = container.styles.opacity;
        }

        // Draw background: gradient takes priority over solid color
        const backgroundImages = container.styles.backgroundImage;
        let hasRenderedGradient = false;

        if (backgroundImages && backgroundImages.length > 0) {
            for (const bgImage of backgroundImages) {
                if (isLinearGradient(bgImage)) {
                    const [lineLength, x0, x1, y0, y1] = calculateGradientDirection(bgImage.angle, imgWidth, imgHeight);
                    const canvasGradient = ctx.createLinearGradient(x0, y0, x1, y1);
                    processColorStops(bgImage.stops || [], lineLength || 1).forEach((colorStop) =>
                        canvasGradient.addColorStop(colorStop.stop, asString(colorStop.color))
                    );
                    ctx.fillStyle = canvasGradient;
                    ctx.fill();
                    hasRenderedGradient = true;
                }
            }
        }

        if (!hasRenderedGradient && !isTransparent(container.styles.backgroundColor)) {
            ctx.fillStyle = asString(container.styles.backgroundColor);
            ctx.fill();
        }

        const dataUrl = canvas.toDataURL('image/png');

        this.slide.addImage({
            data: dataUrl,
            x: Math.max(0, x),
            y: Math.max(0, y),
            w: Math.max(0.01, w),
            h: Math.max(0.01, h),
            rotate: getRotation(container),
            shadow: getShadow(container.styles.boxShadow)
        });
    }

    /**
     * Apply a clip-path shape to a canvas context.
     * All coordinates are in element-local space (0,0 = top-left).
     */
    private applyClipPath(
        ctx: CanvasRenderingContext2D,
        clipPathValue: ClipPathValue,
        width: number,
        height: number
    ): void {
        ctx.beginPath();

        switch (clipPathValue.type) {
            case CLIP_PATH_TYPE.INSET: {
                const left = getAbsoluteValue(clipPathValue.left, width);
                const top = getAbsoluteValue(clipPathValue.top, height);
                const w = Math.max(0, width - left - getAbsoluteValue(clipPathValue.right, width));
                const h = Math.max(0, height - top - getAbsoluteValue(clipPathValue.bottom, height));
                if (clipPathValue.round) {
                    // Resolve each corner radius relative to the smaller inset dimension
                    const refDim = Math.min(w, h);
                    const radii = clipPathValue.round.map((r) => Math.max(0, getAbsoluteValue(r, refDim)));
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(left, top, w, h, radii);
                    } else {
                        // Fallback: use the average radius as a single value
                        const avg = radii.reduce((s, v) => s + v, 0) / radii.length;
                        const r = Math.min(avg, w / 2, h / 2);
                        ctx.moveTo(left + r, top);
                        ctx.arcTo(left + w, top, left + w, top + h, r);
                        ctx.arcTo(left + w, top + h, left, top + h, r);
                        ctx.arcTo(left, top + h, left, top, r);
                        ctx.arcTo(left, top, left + w, top, r);
                        ctx.closePath();
                    }
                } else {
                    ctx.rect(left, top, w, h);
                }
                break;
            }

            case CLIP_PATH_TYPE.CIRCLE: {
                const cx = getAbsoluteValue(clipPathValue.cx, width);
                const cy = getAbsoluteValue(clipPathValue.cy, height);
                let r: number;
                if (clipPathValue.radius === 'closest-side') {
                    r = Math.min(cx, cy, width - cx, height - cy);
                } else if (clipPathValue.radius === 'farthest-side') {
                    r = Math.max(cx, cy, width - cx, height - cy);
                } else {
                    r = getAbsoluteValue(clipPathValue.radius, Math.sqrt(width * width + height * height) / Math.SQRT2);
                }
                ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2);
                break;
            }

            case CLIP_PATH_TYPE.ELLIPSE: {
                const cx = getAbsoluteValue(clipPathValue.cx, width);
                const cy = getAbsoluteValue(clipPathValue.cy, height);
                const rx = this.resolveAxisRadius(clipPathValue.rx, cx, 0, width, width);
                const ry = this.resolveAxisRadius(clipPathValue.ry, cy, 0, height, height);
                ctx.ellipse(cx, cy, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2);
                break;
            }

            case CLIP_PATH_TYPE.POLYGON: {
                const points = clipPathValue.points;
                if (points.length > 0) {
                    const [px0, py0] = points[0];
                    ctx.moveTo(getAbsoluteValue(px0, width), getAbsoluteValue(py0, height));
                    for (let i = 1; i < points.length; i++) {
                        const [px, py] = points[i];
                        ctx.lineTo(getAbsoluteValue(px, width), getAbsoluteValue(py, height));
                    }
                    ctx.closePath();
                }
                break;
            }

            case CLIP_PATH_TYPE.PATH: {
                try {
                    ctx.clip(new Path2D(clipPathValue.d));
                } catch (_e) {
                    // Path2D not supported — skip clip
                }
                return; // Path2D.clip already applied, skip the ctx.clip() below
            }
        }

        ctx.clip();
    }

    /**
     * Resolve an ellipse axis radius: keyword or length-percentage.
     */
    private resolveAxisRadius(r: ShapeRadius, center: number, start: number, end: number, dimRef: number): number {
        if (r === 'closest-side') return Math.min(center - start, end - center);
        if (r === 'farthest-side') return Math.max(center - start, end - center);
        return getAbsoluteValue(r, dimRef);
    }
}
