# 配置

所有选项作为第二个参数传递给 `html2pptx()`：

```typescript
const pptx = await html2pptx(element, options);
```

## 演示文稿选项

| 选项 | 默认值 | 说明 |
| --- | :---: | --- |
| `slideLayout` | `'LAYOUT_16x9'` | 幻灯片布局：`'LAYOUT_16x9'`、`'LAYOUT_4x3'`、`'LAYOUT_16x10'`、`'LAYOUT_WIDE'`、`'LAYOUT_USER'` |
| `title` | - | 演示文稿标题元数据 |
| `author` | - | 演示文稿作者元数据 |
| `company` | - | 公司名称元数据 |

## 渲染选项

| 选项 | 默认值 | 说明 |
| --- | :---: | --- |
| `scale` | auto | 缩放比例。省略时，自动计算以适应幻灯片而不放大 |
| `x` | `0` | X 轴偏移量（像素） |
| `y` | `0` | Y 轴偏移量（像素） |
| `width` | 元素宽度 | 输出宽度（像素） |
| `height` | 元素高度 | 输出高度（像素） |
| `backgroundColor` | `#ffffff` | 背景颜色。设为 `null` 表示透明 |

## 行为选项

| 选项 | 默认值 | 说明 |
| --- | :---: | --- |
| `logging` | `true` | 启用调试日志 |
| `skipValidation` | `false` | 跳过输入验证（SSRF/XSS 检查） |
| `enablePerformanceMonitoring` | `false` | 启用流水线性能监控 |
| `removeContainer` | `true` | 渲染后清理克隆的 iframe |

## 回调选项

| 选项 | 默认值 | 说明 |
| --- | :---: | --- |
| `onclone` | - | 文档克隆后的回调函数。接收 `(document, element)` 参数。用于在渲染前修改内容 |
| `ignoreElements` | - | 用于从渲染中排除元素的谓词函数 |

### `onclone` 示例

```typescript
const pptx = await html2pptx(element, {
    onclone: (clonedDoc, clonedElement) => {
        // 在 PPTX 输出中隐藏水印
        const watermark = clonedDoc.querySelector('.watermark');
        if (watermark) watermark.style.display = 'none';
    }
});
```

### `ignoreElements` 示例

```typescript
const pptx = await html2pptx(element, {
    ignoreElements: (el) => {
        return el.classList.contains('no-export');
    }
});
```

## 图片处理选项

| 选项 | 默认值 | 说明 |
| --- | :---: | --- |
| `allowTaint` | `false` | 允许跨域图片 |
| `useCORS` | `false` | 使用 CORS 加载图片 |
| `imageTimeout` | `15000` | 图片加载超时时间（毫秒）。设为 `0` 禁用 |
| `proxy` | - | 加载跨域图片的代理 URL |

## 高级选项

| 选项 | 默认值 | 说明 |
| --- | :---: | --- |
| `pptx` | - | 外部 `PptxGenJS` 实例，用于向其添加幻灯片（多页幻灯片内部使用） |
| `cspNonce` | - | Content-Security-Policy 的 nonce 值 |
| `windowWidth` | `window.innerWidth` | 媒体查询求值的窗口宽度 |
| `windowHeight` | `window.innerHeight` | 媒体查询求值的窗口高度 |
| `scrollX` | 页面滚动 X | X 轴滚动位置 |
| `scrollY` | 页面滚动 Y | Y 轴滚动位置 |

## 完整示例

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
