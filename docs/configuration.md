# Configuration

All options are passed as the second argument to `html2pptx()`:

```typescript
const pptx = await html2pptx(element, options);
```

## Presentation Options

| Option | Default | Description |
| --- | :---: | --- |
| `slideLayout` | `'LAYOUT_16x9'` | Slide layout: `'LAYOUT_16x9'`, `'LAYOUT_4x3'`, `'LAYOUT_16x10'`, `'LAYOUT_WIDE'`, `'LAYOUT_USER'` |
| `title` | - | Presentation title metadata |
| `author` | - | Presentation author metadata |
| `company` | - | Company name metadata |

## Rendering Options

| Option | Default | Description |
| --- | :---: | --- |
| `scale` | auto | Scale factor. When omitted, auto-computes to fit the element to the slide without upscaling |
| `x` | `0` | X offset in pixels |
| `y` | `0` | Y offset in pixels |
| `width` | Element width | Output width in pixels |
| `height` | Element height | Output height in pixels |
| `backgroundColor` | `#ffffff` | Background color. Set `null` for transparent |

## Behavior Options

| Option | Default | Description |
| --- | :---: | --- |
| `logging` | `true` | Enable debug logging |
| `skipValidation` | `false` | Skip input validation (SSRF/XSS checks) |
| `enablePerformanceMonitoring` | `false` | Enable pipeline performance tracking |
| `removeContainer` | `true` | Clean up cloned iframe after rendering |

## Callback Options

| Option | Default | Description |
| --- | :---: | --- |
| `onclone` | - | Callback called after the document is cloned. Receives `(document, element)`. Use to modify content before rendering |
| `ignoreElements` | - | Predicate function to exclude elements from rendering |

### `onclone` example

```typescript
const pptx = await html2pptx(element, {
    onclone: (clonedDoc, clonedElement) => {
        // Hide watermarks in the PPTX output
        const watermark = clonedDoc.querySelector('.watermark');
        if (watermark) watermark.style.display = 'none';
    }
});
```

### `ignoreElements` example

```typescript
const pptx = await html2pptx(element, {
    ignoreElements: (el) => {
        return el.classList.contains('no-export');
    }
});
```

## Image Handling Options

| Option | Default | Description |
| --- | :---: | --- |
| `allowTaint` | `false` | Allow cross-origin images |
| `useCORS` | `false` | Load images using CORS |
| `imageTimeout` | `15000` | Image load timeout in ms. Set `0` to disable |
| `proxy` | - | Proxy URL for loading cross-origin images |

## Advanced Options

| Option | Default | Description |
| --- | :---: | --- |
| `pptx` | - | External `PptxGenJS` instance to add slides to (used internally for multi-slide) |
| `cspNonce` | - | Nonce value for Content-Security-Policy |
| `windowWidth` | `window.innerWidth` | Window width for media query evaluation |
| `windowHeight` | `window.innerHeight` | Window height for media query evaluation |
| `scrollX` | Page scroll X | X scroll position |
| `scrollY` | Page scroll Y | Y scroll position |

## Complete example

```typescript
import html2pptx from 'html2pptx-pro';

const pptx = await html2pptx(document.getElementById('report'), {
    title: 'Quarterly Report',
    author: 'Analytics Team',
    slideLayout: 'LAYOUT_16x9',
    logging: false,
    ignoreElements: (el) => el.classList.contains('screen-only'),
    onclone: (doc, el) => {
        doc.querySelector('.timestamp').textContent = new Date().toLocaleDateString();
    }
});

const blob = await pptx.write({ outputType: 'blob' });
```
