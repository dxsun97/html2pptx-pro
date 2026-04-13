# About

## Introduction

html2pptx-pro is a library that converts HTML elements to PowerPoint presentations using the [pptxgenjs](https://github.com/gitbrent/PptxGenJS) library. It traverses the DOM, parses CSS styles, and renders the result as PPTX slides -- preserving backgrounds, borders, text styling, lists, and layout structure.

## How it works

The library follows a multi-stage pipeline:

1. **DOM cloning** -- The target element is cloned into an isolated iframe to avoid modifying the original page.
2. **DOM normalization** -- Animations are disabled and transforms are reset to ensure a stable snapshot.
3. **DOM parsing** -- The cloned DOM tree is parsed into an internal `ElementContainer` tree structure.
4. **CSS parsing** -- Computed styles are parsed through 50+ CSS property descriptors.
5. **Stacking context construction** -- Elements are ordered according to the CSS painting order (7 layers).
6. **PPTX rendering** -- The tree is rendered to PowerPoint shapes via pptxgenjs, converting CSS pixels to inches.

## Limitations

html2pptx-pro builds a PPTX representation from DOM and CSS information. Because PowerPoint has different capabilities than a browser, some CSS features cannot be faithfully represented:

- Radial gradients
- URL background images
- `opacity` blending
- CSS `filter` effects
- SVG and Canvas element rendering
- CSS transforms in PPTX output
- `mix-blend-mode`

For a full list of supported CSS properties, see the [features](./features) page.

## Browser compatibility

The library works in modern browsers that support:

- ES2015+ (Promises, async/await)
- `getComputedStyle`
- Canvas API (used internally during processing)

Supported browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
