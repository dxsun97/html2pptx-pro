/**
 * PPTX Border Renderer
 *
 * Handles rendering of element borders for PPTX output
 */

import PptxGenJS from 'pptxgenjs';
import { Color } from '../../css/types/color';
import { isTransparent } from '../../css/types/color-utilities';
import { ElementContainer } from '../../dom/element-container';
import { BORDER_STYLE } from '../../css/property-descriptors/border-style';
import { colorToPptx, getRotation, getShadow, pxToInches } from './utils';
import { getAbsoluteValue } from '../../css/types/length-percentage';

export interface PptxBorderRendererDeps {
    slide: PptxGenJS.Slide;
    options: {
        x: number;
        y: number;
        scale: number;
    };
}

interface BorderSide {
    style: BORDER_STYLE;
    color: Color;
    width: number;
}

/**
 * Check if element has border-radius
 */
const hasBorderRadius = (container: ElementContainer, boundsWidth: number): boolean => {
    const styles = container.styles;
    const topLeft = styles.borderTopLeftRadius;
    const topRight = styles.borderTopRightRadius;
    const bottomRight = styles.borderBottomRightRadius;
    const bottomLeft = styles.borderBottomLeftRadius;

    const radii = [topLeft, topRight, bottomRight, bottomLeft].filter(Boolean);
    if (radii.length === 0) return false;

    for (const r of radii) {
        const value = r?.[0];
        if (value) {
            const radius = getAbsoluteValue(value, boundsWidth);
            if (radius > 0) return true;
        }
    }
    return false;
};

/**
 * Map CSS border style to pptxgenjs dashType
 */
type DashType = 'solid' | 'dash' | 'dashDot' | 'lgDash' | 'lgDashDot' | 'lgDashDotDot' | 'sysDash' | 'sysDot';

const borderStyleToDashType = (style: BORDER_STYLE): DashType => {
    switch (style) {
        case BORDER_STYLE.DASHED:
            return 'sysDash';
        case BORDER_STYLE.DOTTED:
            return 'sysDot';
        case BORDER_STYLE.SOLID:
        case BORDER_STYLE.DOUBLE:
        default:
            return 'solid';
    }
};

export class PptxBorderRenderer {
    private readonly slide: PptxGenJS.Slide;
    private readonly options: { x: number; y: number; scale: number };

    constructor(deps: PptxBorderRendererDeps) {
        this.slide = deps.slide;
        this.options = deps.options;
    }

    /**
     * Render borders for a container
     */
    async renderBorders(container: ElementContainer, _curves: any): Promise<void> {
        const styles = container.styles;

        // Skip border rendering if element has border-radius
        // Border is already rendered with background in background-renderer
        if (hasBorderRadius(container, container.bounds.width)) {
            return;
        }

        const borders: BorderSide[] = [
            { style: styles.borderTopStyle, color: styles.borderTopColor, width: styles.borderTopWidth },
            { style: styles.borderRightStyle, color: styles.borderRightColor, width: styles.borderRightWidth },
            { style: styles.borderBottomStyle, color: styles.borderBottomColor, width: styles.borderBottomWidth },
            { style: styles.borderLeftStyle, color: styles.borderLeftColor, width: styles.borderLeftWidth }
        ];

        // Check if all visible borders are uniform — use a single rect shape for smooth corners
        const visibleBorders = borders.filter(
            (b) => b.style !== BORDER_STYLE.NONE && !isTransparent(b.color) && b.width > 0
        );

        const rotation = getRotation(container);
        const shadow = getShadow(container.styles.boxShadow);

        if (visibleBorders.length === 4 && this.areUniformBorders(visibleBorders)) {
            await this.renderUniformBorder(visibleBorders[0], container.bounds, rotation, shadow);
            return;
        }

        // Draw in CSS painting order: left, top, right, bottom
        // Later sides draw on top at corners
        const drawOrder = [3, 0, 1, 2];
        for (const i of drawOrder) {
            const border = borders[i];
            if (border.style !== BORDER_STYLE.NONE && !isTransparent(border.color) && border.width > 0) {
                await this.renderBorder(border, container.bounds, i);
            }
        }
    }

    /**
     * Check if all borders have the same style, color, and width
     */
    private areUniformBorders(borders: BorderSide[]): boolean {
        const first = borders[0];
        return borders.every((b) => b.style === first.style && b.color === first.color && b.width === first.width);
    }

    /**
     * Render uniform borders as a single rectangle shape for smooth corners
     */
    private async renderUniformBorder(
        border: BorderSide,
        bounds: any,
        rotation?: number,
        shadow?: PptxGenJS.ShadowProps
    ): Promise<void> {
        const options = this.options;
        const scale = options.scale;
        const color = colorToPptx(border.color);
        const width = (border.width / scale) * (72 / 96);

        const x = pxToInches((bounds.left - options.x) / scale);
        const y = pxToInches((bounds.top - options.y) / scale);
        const w = pxToInches(bounds.width / scale);
        const h = pxToInches(bounds.height / scale);

        if (border.style === BORDER_STYLE.DOUBLE && border.width >= 3) {
            // CSS double border: outer line + gap + inner line, each 1/3 of total width
            const lineWidth = Math.max(0.5, width / 3);
            // pptxgenjs draws lines centered on the shape edge, so the outer rect
            // edge is at the center of the outer line. The inner rect edge should be
            // offset inward by the full border width minus half a line on each side.
            const inset = pxToInches((border.width * 2) / (3 * scale));
            const lineOpts = { color, width: lineWidth, dashType: 'solid' as DashType };
            this.slide.addShape('rect', {
                x,
                y,
                w,
                h,
                fill: { type: 'none' as const },
                line: lineOpts,
                rotate: rotation,
                shadow
            });
            this.slide.addShape('rect', {
                x: x + inset,
                y: y + inset,
                w: Math.max(0, w - inset * 2),
                h: Math.max(0, h - inset * 2),
                fill: { type: 'none' as const },
                line: lineOpts,
                rotate: rotation
            });
            return;
        }

        const dashType = borderStyleToDashType(border.style);
        const lineOpts = { color, width: Math.max(0.5, width), dashType };
        this.slide.addShape('rect', {
            x,
            y,
            w,
            h,
            fill: { type: 'none' as const },
            line: lineOpts,
            rotate: rotation,
            shadow
        });
    }

    /**
     * Render a single border side
     */
    private async renderBorder(border: BorderSide, bounds: any, side: number): Promise<void> {
        const options = this.options;
        const scale = options.scale;
        const color = colorToPptx(border.color);
        const width = (border.width / scale) * (72 / 96);

        const x = pxToInches((bounds.left - options.x) / scale);
        const y = pxToInches((bounds.top - options.y) / scale);
        const w = pxToInches(bounds.width / scale);
        const h = pxToInches(bounds.height / scale);

        // Handle double borders: two parallel lines per side
        // Fall back to solid if width < 3px (matching CSS spec)
        if (border.style === BORDER_STYLE.DOUBLE && border.width >= 3) {
            const lineWidth = Math.max(0.5, width / 3);
            const offset = pxToInches((border.width * 2) / (3 * scale));
            const lineOpts = { color, width: lineWidth, dashType: 'solid' as DashType };

            this.addBorderLine(side, x, y, w, h, lineOpts, 0);
            this.addBorderLine(side, x, y, w, h, lineOpts, offset);
            return;
        }

        const dashType = borderStyleToDashType(border.style);
        const lineOpts = { color, width: Math.max(0.5, width), dashType };
        this.addBorderLine(side, x, y, w, h, lineOpts, 0);
    }

    /**
     * Add a border line shape for a given side with optional inward offset
     */
    private addBorderLine(
        side: number,
        x: number,
        y: number,
        w: number,
        h: number,
        lineOpts: { color: string; width: number; dashType: DashType },
        offset: number
    ): void {
        switch (side) {
            case 0: // Top
                this.slide.addShape('line', { x, y: y + offset, w, h: 0, line: lineOpts });
                break;
            case 1: // Right
                this.slide.addShape('line', { x: x + w - offset, y, w: 0, h, line: lineOpts });
                break;
            case 2: // Bottom
                this.slide.addShape('line', { x, y: y + h - offset, w, h: 0, line: lineOpts });
                break;
            case 3: // Left
                this.slide.addShape('line', { x: x + offset, y, w: 0, h, line: lineOpts });
                break;
        }
    }
}
