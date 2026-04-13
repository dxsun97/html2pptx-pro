/**
 * PPTX Utilities
 *
 * Common utility functions for PPTX rendering
 */

import PptxGenJS from 'pptxgenjs';
import { Color, COLORS } from '../../css/types/color';
import { BoxShadow } from '../../css/property-descriptors/box-shadow';
import { ElementContainer } from '../../dom/element-container';

/**
 * Converts pixels to inches (PPTX uses inches)
 * Standard screen DPI is 96
 */
export const pxToInches = (px: number, dpi: number = 96): number => {
    const result = px / dpi;
    return Math.max(0, result);
};

/**
 * Converts CSS color (packed 32-bit integer) to PPTX color format (hex string without #)
 *
 * Color format: 0xRRGGBBAA where:
 * - RR = red (bits 24-31)
 * - GG = green (bits 16-23)
 * - BB = blue (bits 8-15)
 * - AA = alpha (bits 0-7)
 *
 * pptxgenjs expects: 6-digit hex string like 'FF0000'
 */
export const colorToPptx = (color: Color): string => {
    // Handle transparent or invalid colors
    if (color === COLORS.TRANSPARENT || color === 0 || color === null || color === undefined) {
        return 'FFFFFF'; // Default to white
    }

    // Extract RGB components from packed integer
    const alpha = 0xff & color;
    const blue = 0xff & (color >> 8);
    const green = 0xff & (color >> 16);
    const red = 0xff & (color >> 24);

    // If fully transparent, return white
    if (alpha === 0) {
        return 'FFFFFF';
    }

    // Convert to hex string, pad with zeros if needed
    const toHex = (n: number): string => n.toString(16).padStart(2, '0');

    return `${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase();
};

/**
 * Extract the alpha value (0-255) from a packed CSS color integer.
 * Returns 255 for opaque, 0 for fully transparent.
 */
export const colorAlpha = (color: Color): number => {
    if (color === COLORS.TRANSPARENT || color === 0 || color === null || color === undefined) {
        return 0;
    }
    return 0xff & color;
};

/**
 * Compute the combined transparency (0-100) from color alpha and element opacity.
 * pptxgenjs transparency: 0 = opaque, 100 = fully transparent.
 * Returns 0 when fully opaque, or a positive number when semi-transparent.
 */
export const computeTransparency = (color: Color, elementOpacity: number = 1): number => {
    const alpha = colorAlpha(color);
    // Effective opacity = (alpha / 255) * elementOpacity
    const effective = (alpha / 255) * elementOpacity;
    if (effective >= 1) return 0;
    return Math.round((1 - effective) * 100);
};

/**
 * Rasterize an HTMLImageElement to a base64-encoded PNG data URL.
 * pptxgenjs requires base64 raster data — raw SVG or URL-encoded data URIs are not supported.
 */
export const imageToBase64 = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return img.src;
    }
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
};

/**
 * Extract rotation angle in degrees from container styles.
 * Supports CSS `rotate` property and `transform: rotate()`.
 * Returns undefined if no rotation (pptxgenjs ignores undefined).
 */
export const getRotation = (container: ElementContainer): number | undefined => {
    // CSS rotate property (already in degrees)
    if (container.styles.rotate !== null) {
        return container.styles.rotate;
    }
    // CSS transform: rotate() — stored as matrix [cos, sin, -sin, cos, 0, 0]
    if (container.styles.transform !== null) {
        const [a, b] = container.styles.transform;
        const angle = Math.atan2(b, a) * (180 / Math.PI);
        return Math.abs(angle) < 0.01 ? undefined : angle;
    }
    return undefined;
};

/**
 * Convert CSS box-shadow to pptxgenjs ShadowProps.
 * Uses the first shadow only (pptxgenjs supports a single shadow).
 * CSS offsetX/offsetY are converted to angle + offset in points.
 */
export const getShadow = (boxShadow: BoxShadow): PptxGenJS.ShadowProps | undefined => {
    if (!boxShadow || boxShadow.length === 0) return undefined;

    // Find the first meaningful outer shadow.
    // Skip: inset shadows (PptxGenJS bug #1293), fully transparent shadows,
    // and zero-effect shadows (e.g. Tailwind CSS variable placeholders).
    const shadow = boxShadow.find((s) => {
        if (s.inset) return false;
        if (colorAlpha(s.color) === 0) return false;
        const ox = s.offsetX.number || 0;
        const oy = s.offsetY.number || 0;
        const blur = s.blur.number || 0;
        if (ox === 0 && oy === 0 && blur === 0) return false;
        return true;
    });
    if (!shadow) return undefined;

    const ox = shadow.offsetX.number || 0;
    const oy = shadow.offsetY.number || 0;
    const blurPx = shadow.blur.number || 0;
    const distance = Math.sqrt(ox * ox + oy * oy);

    const angleDeg = Math.round(Math.atan2(oy, ox) * (180 / Math.PI));
    const alpha = colorAlpha(shadow.color);

    return {
        type: 'outer',
        blur: Math.min(100, Math.round(blurPx * 0.75)),
        offset: Math.round(distance * 0.75 * 100) / 100,
        angle: ((angleDeg % 360) + 360) % 360,
        color: colorToPptx(shadow.color),
        opacity: Math.round((alpha / 255) * 100) / 100
    };
};

/**
 * Parse CSS font family to PPTX font face
 */
export const parseFontFamily = (fontFamily: string): string => {
    if (!fontFamily) return 'Arial';

    // Remove quotes and split by comma
    const fonts = fontFamily.split(',').map((f) => f.trim().replace(/['"]/g, ''));

    // Map common fonts to PPTX-compatible names
    const fontMap: Record<string, string> = {
        'Times New Roman': 'Times New Roman',
        Times: 'Times New Roman',
        serif: 'Times New Roman',
        Arial: 'Arial',
        Helvetica: 'Arial',
        sans: 'Arial',
        'sans-serif': 'Arial',
        system: 'Arial',
        '-apple-system': 'Arial',
        BlinkMacSystemFont: 'Arial',
        'Segoe UI': 'Arial',
        Roboto: 'Arial',
        Oxygen: 'Arial',
        Ubuntu: 'Arial',
        Courier: 'Courier New',
        'Courier New': 'Courier New',
        monospace: 'Courier New',
        Georgia: 'Georgia',
        Verdana: 'Verdana',
        Tahoma: 'Tahoma',
        'Trebuchet MS': 'Trebuchet MS',
        Impact: 'Impact',
        'Comic Sans MS': 'Comic Sans MS'
    };

    for (const font of fonts) {
        const lowerFont = font.toLowerCase();
        if (fontMap[font] || fontMap[lowerFont]) {
            return fontMap[font] || fontMap[lowerFont];
        }
    }

    return fonts[0] || 'Arial';
};
