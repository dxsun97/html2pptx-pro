# Features

## PPTX Rendering Capabilities

### Supported

- **Backgrounds**: Solid colors, linear gradients, rounded rectangles
- **Borders**: Four-side independent borders (solid, dashed, dotted, double)
- **Text**: Font family, size, color, bold, italic, underline, strikethrough
- **Text Layout**: Multi-line wrapping, list items (ordered/unordered with bullets)
- **Images**: `object-fit` (contain, cover, scale-down)
- **Slides**: Multiple slides from element array
- **Stacking**: Full CSS stacking context (7-layer painting order)
- **Rotation**: CSS `rotate` property and `transform: rotate()`
- **Box Shadow**: Outer and inner shadows (first shadow used, spread not supported)
- **Clip-Path**: `circle()`, `ellipse()`, `polygon()`, `inset()`, `path()` via canvas rasterization

### Not yet supported

- Radial gradients
- URL background images
- `opacity` blending
- CSS `filter` effects
- SVG/Canvas element rendering to PPTX
- Complex CSS transforms (scale, skew, 3D) in PPTX output

## Supported CSS Properties

The following CSS properties are parsed from the DOM and used during PPTX rendering. Not all properties have a direct PPTX equivalent -- some are used for layout calculation only.

- background
    - background-clip
    - background-color
    - background-image
        - `linear-gradient()`
    - background-origin
    - background-position
    - background-size
- border
    - border-color
    - border-radius
    - border-style
    - border-width
- bottom
- box-shadow
- box-sizing
- clip-path
    - `inset()`
    - `circle()`
    - `ellipse()`
    - `polygon()`
    - `path()`
- content
- color
- display
- flex
- float
- font
    - font-family
    - font-size
    - font-style
    - font-variant
    - font-weight
- height
- image-rendering
- left
- letter-spacing
- line-break
- list-style
    - list-style-image
    - list-style-position
    - list-style-type
- margin
- max-height
- max-width
- min-height
- min-width
- opacity
- overflow
- overflow-wrap
- padding
- paint-order
- position
- right
- text-align
- text-decoration
    - text-decoration-color
    - text-decoration-line
    - text-decoration-style
- text-overflow
- text-shadow
- text-transform
- top
- transform (**layout calculation only**)
- visibility
- white-space
- width
- word-break
- word-spacing
- word-wrap
- z-index
- object-fit
- rotate
- -webkit-text-fill-color

## Unsupported CSS Properties

These CSS properties are **not** currently supported:

- background-blend-mode
- border-image
- box-decoration-break
- filter
- font-variant-ligatures
- mix-blend-mode
- object-position
- repeating-linear-gradient()
- writing-mode
- zoom
