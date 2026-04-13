<p align="center">
<img src="docs/public/logo.png" alt="html2pptx-pro" width="200">
</p>
<h1 align="center">
html2pptx-pro
</h1>
<p align="center">
使用 JavaScript 将 HTML 转换为 PowerPoint 演示文稿。
<p>
<br>

[English](README.md) | [文档](https://dxsun97.github.io/html2pptx-pro/zh/)

## 为什么选择 html2pptx-pro？

html2pptx-pro 将 HTML 元素转换为 PowerPoint 演示文稿，通过多阶段渲染管线保留 CSS 样式。它克隆 DOM、解析计算样式、构建 CSS 层叠上下文，并通过 [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) 渲染为 PPTX。

### 主要特性

- **HTML 转 PPTX** — 将任意 HTML 元素（或元素数组）转换为 PowerPoint 幻灯片
- **100+ CSS 属性** — 背景、边框、文本、布局、定位、Flexbox 等
- **线性渐变** — 支持多色阶渐变，可设置角度和方向
- **盒阴影** — 外阴影和内阴影
- **裁剪路径** — 通过 canvas 光栅化支持 `circle()`、`ellipse()`、`polygon()`、`inset()`、`path()`
- **旋转** — CSS `rotate` 属性和 `transform: rotate()`
- **多页幻灯片** — 传入元素数组创建多页演示文稿
- **CSS 层叠上下文** — 完整的 7 层绘制顺序
- **图片** — 支持 `object-fit`（contain、cover、scale-down）
- **文本** — 字体、大小、颜色、粗细、样式、装饰、对齐、行高、列表
- **多种输出格式** — 文件、Blob、base64 data URL、ArrayBuffer
- **安全性** — 内置 SSRF/XSS 输入验证

## 安装

```sh
npm install html2pptx-pro
# 或
pnpm add html2pptx-pro
# 或
yarn add html2pptx-pro
```

## 使用方法

### 基本示例

```typescript
import html2pptx from 'html2pptx-pro';

const element = document.getElementById('my-slide');

const pptx = await html2pptx(element);

await pptx.writeFile({ fileName: 'output.pptx' });
```

### 多页幻灯片

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

### 浏览器下载

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

**参数：**
- `element` — `HTMLElement | HTMLElement[]` — 单个元素或数组（多页幻灯片）
- `options` — 配置选项（均为可选）

**返回值：** `Promise<PptxGenJS>`

### 选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `slideLayout` | string | `'LAYOUT_16x9'` | `'LAYOUT_16x9'`、`'LAYOUT_4x3'`、`'LAYOUT_16x10'`、`'LAYOUT_WIDE'`、`'LAYOUT_USER'` |
| `title` | string | - | 演示文稿标题元数据 |
| `author` | string | - | 演示文稿作者元数据 |
| `company` | string | - | 公司名称元数据 |
| `scale` | number | auto | 缩放比例（省略时自动计算以适应幻灯片而不放大） |
| `x` | number | `0` | X 轴偏移量（像素） |
| `y` | number | `0` | Y 轴偏移量（像素） |
| `width` | number | 元素宽度 | 输出宽度（像素） |
| `height` | number | 元素高度 | 输出高度（像素） |
| `backgroundColor` | string | `#ffffff` | 背景颜色（`null` 为透明） |
| `logging` | boolean | `true` | 启用调试日志 |
| `skipValidation` | boolean | `false` | 跳过输入验证（SSRF/XSS 检查） |
| `enablePerformanceMonitoring` | boolean | `false` | 启用流水线性能监控 |
| `removeContainer` | boolean | `true` | 渲染后清理克隆的 iframe |
| `onclone` | function | - | 文档克隆后的回调：`(document, element) => void` |
| `ignoreElements` | function | - | 排除元素的谓词函数：`(element) => boolean` |
| `allowTaint` | boolean | `false` | 允许跨域图片 |
| `useCORS` | boolean | `false` | 使用 CORS 加载图片 |
| `imageTimeout` | number | `15000` | 图片加载超时时间（毫秒，`0` 禁用） |
| `proxy` | string | - | 加载跨域图片的代理 URL |

### 输出方法

```typescript
const pptx = await html2pptx(element);

await pptx.writeFile({ fileName: 'output.pptx' });           // 保存为文件
const blob = await pptx.write({ outputType: 'blob' });        // Blob
const dataUrl = await pptx.write({ outputType: 'dataUrl' });  // Base64 data URL
const buffer = await pptx.write({ outputType: 'arraybuffer' });// ArrayBuffer
```

## 支持的 CSS 属性

html2pptx-pro 解析并渲染 100+ CSS 属性，主要类别：

- **背景** — `background-color`、`background-image`（`linear-gradient()`）、`background-clip`、`background-origin`、`background-position`、`background-size`
- **边框** — `border-color`、`border-style`（solid、dashed、dotted、double）、`border-width`、`border-radius`
- **盒模型** — `box-shadow`、`box-sizing`、`clip-path`（circle、ellipse、polygon、inset、path）
- **文本** — `font-family`、`font-size`、`font-weight`、`font-style`、`color`、`text-align`、`text-decoration`、`text-transform`、`text-shadow`、`letter-spacing`、`line-break`、`white-space`、`word-break`、`-webkit-text-fill-color`
- **布局** — `display`、`flex`、`float`、`position`、`top`/`right`/`bottom`/`left`、`width`、`height`、`min-*`、`max-*`、`margin`、`padding`、`overflow`、`z-index`
- **列表** — `list-style-type`（disc、circle、square、decimal、cjk-ideographic 等）、`list-style-position`、`list-style-image`
- **视觉** — `opacity`、`visibility`、`object-fit`、`rotate`、`transform`（仅用于布局计算）
- **其他** — `content`、`paint-order`、`image-rendering`、`overflow-wrap`、`word-spacing`

完整列表请参阅[功能特性页面](https://dxsun97.github.io/html2pptx-pro/zh/features)。

## 限制

- 径向渐变
- URL 背景图片
- CSS `filter` 效果
- SVG/Canvas 元素渲染为 PPTX
- 复杂的 CSS transforms（缩放、倾斜、3D）在 PPTX 输出中
- `mix-blend-mode`

详情请参阅[文档](https://dxsun97.github.io/html2pptx-pro/zh/about)。

## 致谢

本项目基于 [html2canvas-pro](https://github.com/yorickshan/html2canvas-pro) 的架构构建。

PowerPoint 生成由 [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) 提供支持。

## 许可证

[MIT](LICENSE)。
