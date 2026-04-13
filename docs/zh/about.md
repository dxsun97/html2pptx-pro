# 关于

## 简介

html2pptx-pro 是一个使用 [pptxgenjs](https://github.com/gitbrent/PptxGenJS) 库将 HTML 元素转换为 PowerPoint 演示文稿的库。它遍历 DOM，解析 CSS 样式，并将结果渲染为 PPTX 幻灯片——保留背景、边框、文本样式、列表和布局结构。

## 工作原理

该库采用多阶段流水线处理：

1. **DOM 克隆** -- 将目标元素克隆到一个隔离的 iframe 中，以避免修改原始页面。
2. **DOM 标准化** -- 禁用动画并重置变换，以确保获得稳定的快照。
3. **DOM 解析** -- 将克隆的 DOM 树解析为内部 `ElementContainer` 树结构。
4. **CSS 解析** -- 通过 50 多个 CSS 属性描述器解析计算后的样式。
5. **层叠上下文构建** -- 按照 CSS 绘制顺序（7 层）对元素进行排序。
6. **PPTX 渲染** -- 通过 pptxgenjs 将树渲染为 PowerPoint 形状，将 CSS 像素转换为英寸。

## 限制

html2pptx-pro 根据 DOM 和 CSS 信息构建 PPTX 表示。由于 PowerPoint 与浏览器具有不同的能力，某些 CSS 特性无法被忠实地呈现：

- 径向渐变
- URL 背景图片
- `opacity` 混合
- CSS `filter` 效果
- SVG 和 Canvas 元素渲染
- PPTX 输出中的 CSS transforms
- `mix-blend-mode`

完整的 CSS 属性支持列表，请参阅[功能特性](./features)页面。

## 浏览器兼容性

该库适用于支持以下特性的现代浏览器：

- ES2015+（Promises、async/await）
- `getComputedStyle`
- Canvas API（处理过程中内部使用）

支持的浏览器：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
