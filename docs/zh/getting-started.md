# 快速开始

## 安装

通过 npm 安装 `html2pptx-pro`：

```sh
npm install html2pptx-pro
```

## 基本用法

```typescript
import html2pptx from 'html2pptx-pro';

// 将单个元素转换为单页幻灯片演示文稿
const pptx = await html2pptx(document.getElementById('my-slide'));

// 保存为文件
await pptx.writeFile({ fileName: 'presentation.pptx' });
```

## 多页幻灯片

传入元素数组以创建多页幻灯片演示文稿：

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

## 输出方法

`html2pptx()` 函数返回一个 `PptxGenJS` 实例。你可以以多种格式导出：

```typescript
const pptx = await html2pptx(element);

// 保存为文件
await pptx.writeFile({ fileName: 'output.pptx' });

// 获取 Blob（浏览器下载）
const blob = await pptx.write({ outputType: 'blob' });

// 获取 base64 data URL
const dataUrl = await pptx.write({ outputType: 'dataUrl' });

// 获取 ArrayBuffer
const buffer = await pptx.write({ outputType: 'arraybuffer' });
```

### 浏览器下载示例

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
