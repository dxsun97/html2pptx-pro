# FAQ

## How do I generate multiple slides?

Pass an array of HTML elements to `html2pptx()`. Each element becomes a separate slide:

```typescript
const slides = document.querySelectorAll('.slide');
const pptx = await html2pptx(Array.from(slides), {
    title: 'My Presentation'
});
```

## What CSS properties are supported in PPTX output?

html2pptx-pro supports backgrounds (solid colors, linear gradients), borders, text styling (font, color, bold, italic, underline, strikethrough), lists, and layout structure. Some CSS features like `opacity`, radial gradients, and CSS transforms do not have PPTX equivalents. See the [features](./features) page for the full list.

## Can I customize the slide layout?

Yes. Use the `slideLayout` option:

```typescript
const pptx = await html2pptx(element, {
    slideLayout: 'LAYOUT_16x9' // or 'LAYOUT_4x3', 'LAYOUT_16x10', 'LAYOUT_WIDE'
});
```

## Does html2pptx-pro work in Node.js?

No. html2pptx-pro requires a real browser DOM — it uses iframes, `getComputedStyle()`, `getBoundingClientRect()`, and other browser-only APIs during conversion. It cannot run in Node.js, even with jsdom.

## Why doesn't CSS property X render correctly?

PowerPoint has different rendering capabilities than a browser. Some CSS properties (like `filter`, `opacity`) don't have direct PPTX equivalents. The library does its best to map CSS to the closest PowerPoint representation, but there will always be differences. See the [features](./features) page for what's currently supported.

## Can I add content to the PPTX after conversion?

Yes. `html2pptx()` returns a `PptxGenJS` instance, so you can use the full [pptxgenjs API](https://gitbrent.github.io/PptxGenJS/) to add more slides, shapes, charts, or other content after conversion:

```typescript
const pptx = await html2pptx(element);

// Add an extra slide manually
const slide = pptx.addSlide();
slide.addText('Extra slide added via pptxgenjs', { x: 1, y: 1, fontSize: 24 });

await pptx.writeFile({ fileName: 'output.pptx' });
```

## How does coordinate conversion work?

Internally, html2pptx-pro works in CSS pixels and converts to inches for PPTX output using `pxToInches()` at 96 DPI. The `scale` option (default `1`) adjusts this conversion. You can also use `x` and `y` options to offset the rendered content on the slide.
