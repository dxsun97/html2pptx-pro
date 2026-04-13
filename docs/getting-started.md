# Getting Started

## Installing

Install `html2pptx-pro` via npm:

```sh
npm install html2pptx-pro
```

## Basic usage

```typescript
import html2pptx from 'html2pptx-pro';

// Convert a single element to a one-slide presentation
const pptx = await html2pptx(document.getElementById('my-slide'));

// Save as file
await pptx.writeFile({ fileName: 'presentation.pptx' });
```

## Multiple slides

Pass an array of elements to create a multi-slide presentation:

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

## Output methods

The `html2pptx()` function returns a `PptxGenJS` instance. You can export it in several formats:

```typescript
const pptx = await html2pptx(element);

// Save to file
await pptx.writeFile({ fileName: 'output.pptx' });

// Get as Blob (browser download)
const blob = await pptx.write({ outputType: 'blob' });

// Get as base64 data URL
const dataUrl = await pptx.write({ outputType: 'dataUrl' });

// Get as ArrayBuffer
const buffer = await pptx.write({ outputType: 'arraybuffer' });
```

### Browser download example

```typescript
const pptx = await html2pptx(element);
const blob = await pptx.write({ outputType: 'blob' });

const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'presentation.pptx';
a.click();
URL.revokeObjectURL(url);
```
