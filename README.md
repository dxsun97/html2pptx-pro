<p align="center">
<img src="docs/public/logo.png" alt="html2pptx-pro" width="200">
</p>
<h1 align="center">
html2pptx-pro
</h1>
<p align="center">
Convert HTML to PowerPoint presentations with JavaScript.
<p>
<br>

[中文](README.zh-CN.md) | [Documentation](https://dxsun97.github.io/html2pptx-pro/)

## Why html2pptx-pro?

html2pptx-pro converts HTML elements to PowerPoint presentations, preserving CSS styling through a multi-stage rendering pipeline. It clones the DOM, parses computed styles, builds CSS stacking contexts, and renders to PPTX via [pptxgenjs](https://gitbrent.github.io/PptxGenJS/).

### Key Features

- **HTML to PPTX** — Convert any HTML element (or array of elements) to PowerPoint slides
- **100+ CSS Properties** — Backgrounds, borders, text, layout, positioning, flexbox, and more
- **Linear Gradients** — Multi-stop gradients with angle and direction support
- **Box Shadow** — Outer and inner shadows
- **Clip-Path** — `circle()`, `ellipse()`, `polygon()`, `inset()`, `path()` via canvas rasterization
- **Rotation** — CSS `rotate` property and `transform: rotate()`
- **Multi-Slide** — Pass an element array to create multi-slide presentations
- **CSS Stacking Context** — Full 7-layer painting order
- **Images** — `object-fit` support (contain, cover, scale-down)
- **Text** — Font family, size, color, weight, style, decoration, alignment, line-height, lists
- **Multiple Output Formats** — File, Blob, base64 data URL, ArrayBuffer
- **Security** — Built-in SSRF/XSS input validation

## Installation

```sh
npm install html2pptx-pro
# or
pnpm add html2pptx-pro
# or
yarn add html2pptx-pro
```

## Usage

### Basic Example

```typescript
import html2pptx from 'html2pptx-pro';

const element = document.getElementById('my-slide');

const pptx = await html2pptx(element);

await pptx.writeFile({ fileName: 'output.pptx' });
```

### Multiple Slides

```typescript
import html2pptx from 'html2pptx-pro';

const slides = [
    document.getElementById('slide1'),
    document.getElementById('slide2'),
    document.getElementById('slide3')
];

const pptx = await html2pptx(slides, {
    title: 'My Presentation',
    author: 'Jane Doe',
    slideLayout: 'LAYOUT_16x9'
});

await pptx.writeFile({ fileName: 'multi-slide.pptx' });
```

### Browser Download

```typescript
const pptx = await html2pptx(element);
const blob = await pptx.write({ outputType: 'blob' });

const url = URL.createObjectURL(blob as Blob);
const a = document.createElement('a');
a.href = url;
a.download = 'presentation.pptx';
a.click();
URL.revokeObjectURL(url);
```

## API

### `html2pptx(element, options?)`

**Parameters:**
- `element` — `HTMLElement | HTMLElement[]` — Single element or array for multi-slide
- `options` — Configuration options (all optional)

**Returns:** `Promise<PptxGenJS>`

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `slideLayout` | string | `'LAYOUT_16x9'` | `'LAYOUT_16x9'`, `'LAYOUT_4x3'`, `'LAYOUT_16x10'`, `'LAYOUT_WIDE'`, `'LAYOUT_USER'` |
| `title` | string | - | Presentation title metadata |
| `author` | string | - | Presentation author metadata |
| `company` | string | - | Company name metadata |
| `scale` | number | auto | Scale factor (auto-fits to slide without upscaling when omitted) |
| `x` | number | `0` | X offset in pixels |
| `y` | number | `0` | Y offset in pixels |
| `width` | number | element width | Output width in pixels |
| `height` | number | element height | Output height in pixels |
| `backgroundColor` | string | `#ffffff` | Background color (`null` for transparent) |
| `logging` | boolean | `true` | Enable debug logging |
| `skipValidation` | boolean | `false` | Skip input validation (SSRF/XSS checks) |
| `enablePerformanceMonitoring` | boolean | `false` | Enable pipeline performance tracking |
| `removeContainer` | boolean | `true` | Clean up cloned iframe after rendering |
| `onclone` | function | - | Callback after document clone: `(document, element) => void` |
| `ignoreElements` | function | - | Predicate to exclude elements: `(element) => boolean` |
| `allowTaint` | boolean | `false` | Allow cross-origin images |
| `useCORS` | boolean | `false` | Load images using CORS |
| `imageTimeout` | number | `15000` | Image load timeout in ms (`0` to disable) |
| `proxy` | string | - | Proxy URL for cross-origin images |

### Output Methods

```typescript
const pptx = await html2pptx(element);

await pptx.writeFile({ fileName: 'output.pptx' });           // Save to file
const blob = await pptx.write({ outputType: 'blob' });        // Blob
const dataUrl = await pptx.write({ outputType: 'dataUrl' });  // Base64 data URL
const buffer = await pptx.write({ outputType: 'arraybuffer' });// ArrayBuffer
```

## Supported CSS Properties

html2pptx-pro parses and renders 100+ CSS properties. Key categories:

- **Background** — `background-color`, `background-image` (`linear-gradient()`), `background-clip`, `background-origin`, `background-position`, `background-size`
- **Border** — `border-color`, `border-style` (solid, dashed, dotted, double), `border-width`, `border-radius`
- **Box** — `box-shadow`, `box-sizing`, `clip-path` (circle, ellipse, polygon, inset, path)
- **Text** — `font-family`, `font-size`, `font-weight`, `font-style`, `color`, `text-align`, `text-decoration`, `text-transform`, `text-shadow`, `letter-spacing`, `line-break`, `white-space`, `word-break`, `-webkit-text-fill-color`
- **Layout** — `display`, `flex`, `float`, `position`, `top`/`right`/`bottom`/`left`, `width`, `height`, `min-*`, `max-*`, `margin`, `padding`, `overflow`, `z-index`
- **List** — `list-style-type` (disc, circle, square, decimal, cjk-ideographic, etc.), `list-style-position`, `list-style-image`
- **Visual** — `opacity`, `visibility`, `object-fit`, `rotate`, `transform` (layout calculation)
- **Other** — `content`, `paint-order`, `image-rendering`, `overflow-wrap`, `word-spacing`

For the full list, see the [features page](https://dxsun97.github.io/html2pptx-pro/features).

## Limitations

- Radial gradients
- URL background images
- CSS `filter` effects
- SVG/Canvas element rendering to PPTX
- Complex CSS transforms (scale, skew, 3D) in PPTX output
- `mix-blend-mode`

For details, see the [documentation](https://dxsun97.github.io/html2pptx-pro/about).

## Credits

This project is based on the architecture of [html2canvas-pro](https://github.com/yorickshan/html2canvas-pro).

PowerPoint generation is powered by [pptxgenjs](https://gitbrent.github.io/PptxGenJS/).

## License

[MIT](LICENSE).
