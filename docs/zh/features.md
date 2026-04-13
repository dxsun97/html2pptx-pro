# 功能特性

## PPTX 渲染能力

### 已支持

- **背景**：纯色、线性渐变、圆角矩形
- **边框**：四边独立边框（solid、dashed、dotted、double）
- **文本**：字体、大小、颜色、粗体、斜体、下划线、删除线
- **文本布局**：多行换行、列表项（有序/无序列表含项目符号）
- **图片**：`object-fit`（contain、cover、scale-down）
- **幻灯片**：从元素数组生成多页幻灯片
- **层叠**：完整的 CSS 层叠上下文（7 层绘制顺序）
- **旋转**：CSS `rotate` 属性和 `transform: rotate()`
- **阴影**：外阴影和内阴影（使用第一个阴影，不支持 spread）
- **裁剪路径**：通过 canvas 光栅化支持 `circle()`、`ellipse()`、`polygon()`、`inset()`、`path()`

### 尚未支持

- 径向渐变
- URL 背景图片
- `opacity` 混合
- CSS `filter` 效果
- SVG/Canvas 元素渲染为 PPTX
- 复杂的 CSS transforms（缩放、倾斜、3D）在 PPTX 输出中

## 支持的 CSS 属性

以下 CSS 属性从 DOM 中解析并在 PPTX 渲染过程中使用。并非所有属性都有直接的 PPTX 对应——某些属性仅用于布局计算。

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
- transform（**仅用于布局计算**）
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

## 不支持的 CSS 属性

以下 CSS 属性**目前不**支持：

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
