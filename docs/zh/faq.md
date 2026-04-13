# 常见问题

## 如何生成多页幻灯片？

将 HTML 元素数组传递给 `html2pptx()`。每个元素将成为一张独立的幻灯片：

```typescript
const slides = document.querySelectorAll('.slide');
const pptx = await html2pptx(Array.from(slides), {
    title: 'My Presentation'
});
```

## PPTX 输出支持哪些 CSS 属性？

html2pptx-pro 支持背景（纯色、线性渐变）、边框、文本样式（字体、颜色、粗体、斜体、下划线、删除线）、列表和布局结构。某些 CSS 特性如 `opacity`、径向渐变和 CSS transforms 没有 PPTX 等效项。完整列表请参阅[功能特性](./features)页面。

## 可以自定义幻灯片布局吗？

可以。使用 `slideLayout` 选项：

```typescript
const pptx = await html2pptx(element, {
    slideLayout: 'LAYOUT_16x9' // 或 'LAYOUT_4x3'、'LAYOUT_16x10'、'LAYOUT_WIDE'
});
```

## html2pptx-pro 可以在 Node.js 中使用吗？

不可以。html2pptx-pro 需要真实的浏览器 DOM——它在转换过程中使用了 iframes、`getComputedStyle()`、`getBoundingClientRect()` 和其他仅限浏览器的 API。即使使用 jsdom 也无法在 Node.js 中运行。

## 为什么 CSS 属性 X 渲染不正确？

PowerPoint 与浏览器具有不同的渲染能力。某些 CSS 属性（如 `filter`、`opacity`）没有直接的 PPTX 等效项。该库会尽力将 CSS 映射到最接近的 PowerPoint 表示，但始终会存在差异。请参阅[功能特性](./features)页面了解当前支持的内容。

## 转换后可以向 PPTX 添加内容吗？

可以。`html2pptx()` 返回一个 `PptxGenJS` 实例，因此你可以使用完整的 [pptxgenjs API](https://gitbrent.github.io/PptxGenJS/) 在转换后添加更多幻灯片、形状、图表或其他内容：

```typescript
const pptx = await html2pptx(element);

// 手动添加一页额外的幻灯片
const slide = pptx.addSlide();
slide.addText('Extra slide added via pptxgenjs', { x: 1, y: 1, fontSize: 24 });

await pptx.writeFile({ fileName: 'output.pptx' });
```

## 坐标转换是如何工作的？

在内部，html2pptx-pro 使用 CSS 像素，并通过 `pxToInches()` 以 96 DPI 转换为英寸用于 PPTX 输出。`scale` 选项（默认为 `1`）可调整此转换。你还可以使用 `x` 和 `y` 选项来偏移幻灯片上渲染内容的位置。
