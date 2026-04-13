# 示例

交互式幻灯片示例，展示 html2pptx-pro 的功能。每个部分展示一个幻灯片预览——点击 **生成 PPTX** 下载它，或使用下方按钮一次生成所有幻灯片。

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { useHtml2Pptx } from '../.vitepress/theme/composables/useHtml2Pptx'

const { isConverting, status, convertElements, setStatus } = useHtml2Pptx()

// Provide state to child components
provide('isConverting', isConverting)
provide('status', status)

// Slide IDs for "Generate All"
const SLIDE_IDS = [
  'slide-hero', 'slide-typography', 'slide-features', 'slide-cards', 'slide-stats',
  'slide-text', 'slide-lists', 'slide-table', 'slide-borders', 'slide-nested',
  'slide-images', 'slide-opacity', 'slide-fonts', 'slide-gradients',
  'slide-positioning', 'slide-adv-lists', 'slide-alignment', 'slide-cjk-lists',
  'slide-grad-round', 'slide-grad-opacity', 'slide-visibility', 'slide-clip-text',
  'slide-url-images', 'slide-rotate', 'slide-box-shadow', 'slide-clip-path',
  'slide-canvas', 'slide-form-inputs'
]

const MULTI_SLIDE_IDS = ['slide-multi-1', 'slide-multi-2', 'slide-multi-3']

// Get slide element by ID
function getSlideElement(id: string): HTMLElement | null {
  return document.getElementById(id)
}

// Convert single slide
async function onGenerate(slideId: string) {
  const el = getSlideElement(slideId)
  if (!el) {
    setStatus('error', `幻灯片 "${slideId}" 未找到。`)
    return
  }
  await convertElements([el], { filename: 'html2pptx-demo.pptx' })
}

// Convert all slides
async function onGenerateAll() {
  const elements = SLIDE_IDS.map(getSlideElement).filter(Boolean)
  if (elements.length === 0) {
    setStatus('error', '未找到幻灯片。')
    return
  }
  await convertElements(elements, { filename: 'html2pptx-demo.pptx' })
}

// Convert multi-slide demo
async function onGenerateMulti() {
  const elements = MULTI_SLIDE_IDS.map(getSlideElement).filter(Boolean)
  if (elements.length === 0) {
    setStatus('error', '未找到多页幻灯片元素。')
    return
  }
  await convertElements(elements, {
    title: 'Multi-Slide Demo',
    filename: 'html2pptx-multi-slide-demo.pptx'
  })
}

// Resolve URL-based images
onMounted(() => {
  document.querySelectorAll('.url-img').forEach(img => {
    const file = img.getAttribute('data-file')
    if (file) img.setAttribute('src', withBase(`/${file}`))
  })

  // Draw canvas bar chart
  const canvas = document.getElementById('demo-canvas') as HTMLCanvasElement | null
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const w = canvas.width
      const h = canvas.height
      // Background
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, w, h)
      // Grid lines
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      for (let y = 40; y < h - 30; y += 40) {
        ctx.beginPath()
        ctx.moveTo(50, y)
        ctx.lineTo(w - 20, y)
        ctx.stroke()
      }
      // Bars
      const data = [65, 85, 45, 92, 70, 55]
      const labels = ['一月', '二月', '三月', '四月', '五月', '六月']
      const colors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4']
      const barW = 50
      const gap = 25
      const startX = 70
      const baseY = h - 40
      const maxH = h - 80
      data.forEach((val, i) => {
        const barH = (val / 100) * maxH
        const x = startX + i * (barW + gap)
        ctx.fillStyle = colors[i]
        ctx.beginPath()
        const r = 4
        ctx.moveTo(x + r, baseY - barH)
        ctx.lineTo(x + barW - r, baseY - barH)
        ctx.quadraticCurveTo(x + barW, baseY - barH, x + barW, baseY - barH + r)
        ctx.lineTo(x + barW, baseY)
        ctx.lineTo(x, baseY)
        ctx.lineTo(x, baseY - barH + r)
        ctx.quadraticCurveTo(x, baseY - barH, x + r, baseY - barH)
        ctx.fill()
        // Value label
        ctx.fillStyle = '#334155'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${val}%`, x + barW / 2, baseY - barH - 8)
        // X-axis label
        ctx.fillStyle = '#64748b'
        ctx.font = '11px Arial'
        ctx.fillText(labels[i], x + barW / 2, baseY + 16)
      })
      // Title
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('月度绩效', 50, 25)
    }
  }
})
</script>

<DemoControls @generate-all="onGenerateAll" />

## 1. Hero — 渐变背景

<SlideSection slide-id="slide-hero" description="使用 Flexbox 居中的线性渐变。" @generate="onGenerate">
<div class="slide bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex flex-col items-center justify-center text-center">
  <h2 class="text-4xl font-extrabold m-0 mb-4">欢迎使用 html2pptx-pro</h2>
  <p class="text-xl m-0 mb-2">轻松将 HTML 转换为 PowerPoint</p>
  <p class="text-base m-0 text-white/80">渐变、Flexbox 居中和现代样式——全部保留在你的幻灯片中。</p>
</div>
</SlideSection>

## 2. 排版

<SlideSection slide-id="slide-typography" description="深色背景，多种字号、字重和颜色。" @generate="onGenerate">
<div class="slide bg-slate-900 text-white flex flex-col justify-center">
  <h2 class="text-5xl font-extrabold m-0 mb-6 text-slate-50">粗体标题文本</h2>
  <p class="text-2xl text-slate-400 mb-6 m-0">柔和色彩的副标题</p>
  <p class="text-xl text-cyan-400 font-bold m-0 mb-4">高亮重要文本</p>
  <p class="text-base text-slate-300 leading-relaxed m-0">常规段落文本，使用普通样式。这展示了不同的文本颜色、大小和字重在 PowerPoint 输出中的渲染效果。</p>
</div>
</SlideSection>

## 3. 特性列

<SlideSection slide-id="slide-features" description="带圆角的 Flexbox 列布局。" @generate="onGenerate">
<div class="slide bg-slate-100 flex flex-col text-slate-800">
  <h2 class="text-3xl text-slate-800 m-0 mb-5 text-center">功能对比</h2>
  <div class="flex gap-5 mb-5">
    <div class="flex-1 p-5 rounded-lg text-center bg-blue-500 text-white">
      <h3 class="text-xl m-0 mb-2">功能 A</h3>
      <p class="text-sm m-0">将 HTML 元素高保真渲染为 PPTX 幻灯片</p>
    </div>
    <div class="flex-1 p-5 rounded-lg text-center bg-emerald-500 text-white">
      <h3 class="text-xl m-0 mb-2">功能 B</h3>
      <p class="text-sm m-0">完整的 CSS 层叠上下文支持，7 层绘制顺序</p>
    </div>
    <div class="flex-1 p-5 rounded-lg text-center bg-orange-500 text-white">
      <h3 class="text-xl m-0 mb-2">功能 C</h3>
      <p class="text-sm m-0">简单 API——传入元素，获得 PowerPoint 文件</p>
    </div>
  </div>
</div>
</SlideSection>

## 4. 服务卡片

<SlideSection slide-id="slide-cards" description="带边框的卡片布局。" @generate="onGenerate">
<div class="slide bg-slate-950 text-white">
  <h2 class="text-4xl m-0 mb-8 text-center">我们的服务</h2>
  <div class="flex gap-5">
    <div class="flex-1 bg-slate-900 rounded-xl p-6 border border-slate-700">
      <div class="text-3xl mb-4">🚀</div>
      <h3 class="text-lg m-0 mb-3 text-slate-50">高性能</h3>
      <p class="text-sm text-slate-400 m-0 leading-normal">针对速度和效率进行了优化。</p>
    </div>
    <div class="flex-1 bg-slate-900 rounded-xl p-6 border border-slate-700">
      <div class="text-3xl mb-4">🎨</div>
      <h3 class="text-lg m-0 mb-3 text-slate-50">精美设计</h3>
      <p class="text-sm text-slate-400 m-0 leading-normal">高保真的 HTML 到 PPTX 输出。</p>
    </div>
    <div class="flex-1 bg-slate-900 rounded-xl p-6 border border-slate-700">
      <div class="text-3xl mb-4">⚡</div>
      <h3 class="text-lg m-0 mb-3 text-slate-50">易于集成</h3>
      <p class="text-sm text-slate-400 m-0 leading-normal">为你现有代码提供简单的 API。</p>
    </div>
  </div>
</div>
</SlideSection>

## 5. 统计仪表盘

<SlideSection slide-id="slide-stats" description="纵向渐变配合大号数字。" @generate="onGenerate">
<div class="slide bg-gradient-to-b from-slate-950 to-blue-950 text-white flex flex-col justify-center">
  <h2 class="text-4xl font-bold m-0 mb-2">精彩数据</h2>
  <p class="text-xl text-blue-400 mb-8 m-0">我们的平台带来卓越成果</p>
  <div class="flex gap-10">
    <div class="text-center">
      <div class="text-5xl font-bold text-cyan-400">99%</div>
      <div class="text-sm text-slate-400 mt-2">满意度</div>
    </div>
    <div class="text-center">
      <div class="text-5xl font-bold text-cyan-400">50K+</div>
      <div class="text-sm text-slate-400 mt-2">活跃用户</div>
    </div>
    <div class="text-center">
      <div class="text-5xl font-bold text-cyan-400">24/7</div>
      <div class="text-sm text-slate-400 mt-2">全天候支持</div>
    </div>
    <div class="text-center">
      <div class="text-5xl font-bold text-cyan-400">100+</div>
      <div class="text-sm text-slate-400 mt-2">覆盖国家</div>
    </div>
  </div>
</div>
</SlideSection>

## 6. 文本装饰

<SlideSection slide-id="slide-text" description="粗体、斜体、下划线和删除线样式。" @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-slate-900">文本样式示例</h2>
  <div class="mb-4 font-bold">使用 font-weight 的粗体文本</div>
  <div class="mb-4 italic">使用 font-style 的斜体文本</div>
  <div class="mb-4 underline">使用 text-decoration 的下划线文本</div>
  <div class="mb-4 line-through">删除线文本</div>
  <div class="mb-4 font-bold italic underline">粗体、斜体和下划线组合</div>
  <p class="text-base leading-loose m-0">混合格式：<strong class="text-red-600">粗体红色</strong>、<em class="text-green-600">斜体绿色</em>和 <u class="text-purple-600">下划线紫色</u> 在同一段落中。</p>
</div>
</SlideSection>

## 7. 列表

<SlideSection slide-id="slide-lists" description="无序列表和有序列表。" @generate="onGenerate">
<div class="slide bg-yellow-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-yellow-800">列表示例</h2>
  <div class="flex gap-16">
    <div class="flex-1">
      <h3 class="text-lg text-yellow-700 mb-3">无序列表</h3>
      <ul class="m-0 pl-6">
        <li class="text-sm mb-1.5 text-yellow-950">带项目符号的第一项</li>
        <li class="text-sm mb-1.5 text-yellow-950">列表中的第二项</li>
        <li class="text-sm mb-1.5 text-yellow-950">这里是第三项</li>
        <li class="text-sm mb-1.5 text-yellow-950">第四项也是最后一项</li>
      </ul>
    </div>
    <div class="flex-1">
      <h3 class="text-lg text-yellow-700 mb-3">有序列表</h3>
      <ol class="m-0 pl-6">
        <li class="text-sm mb-1.5 text-yellow-950">步骤一：初始化</li>
        <li class="text-sm mb-1.5 text-yellow-950">步骤二：配置</li>
        <li class="text-sm mb-1.5 text-yellow-950">步骤三：执行</li>
        <li class="text-sm mb-1.5 text-yellow-950">步骤四：验证</li>
      </ol>
    </div>
  </div>
</div>
</SlideSection>

## 8. 数据表格

<SlideSection slide-id="slide-table" description="带交替行背景的表格。" @generate="onGenerate">
<div class="slide bg-green-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-green-800">季度报告</h2>
  <table class="w-full border-collapse text-sm">
    <thead>
      <tr>
        <th class="bg-green-500 text-white p-3 text-left font-bold">产品</th>
        <th class="bg-green-500 text-white p-3 text-left font-bold">Q1 营收</th>
        <th class="bg-green-500 text-white p-3 text-left font-bold">Q2 营收</th>
        <th class="bg-green-500 text-white p-3 text-left font-bold">增长率</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="px-3 py-2.5 border-b border-green-200">企业套件</td><td class="px-3 py-2.5 border-b border-green-200">$1,200,000</td><td class="px-3 py-2.5 border-b border-green-200">$1,450,000</td><td class="px-3 py-2.5 border-b border-green-200">+20.8%</td></tr>
      <tr><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">云服务</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">$890,000</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">$1,100,000</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">+23.6%</td></tr>
      <tr><td class="px-3 py-2.5 border-b border-green-200">支持服务</td><td class="px-3 py-2.5 border-b border-green-200">$450,000</td><td class="px-3 py-2.5 border-b border-green-200">$520,000</td><td class="px-3 py-2.5 border-b border-green-200">+15.5%</td></tr>
      <tr><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">培训项目</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">$180,000</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">$210,000</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">+16.7%</td></tr>
    </tbody>
  </table>
</div>
</SlideSection>

## 9. 边框样式

<SlideSection slide-id="slide-borders" description="实线、虚线、点线、双线和混合边框。" @generate="onGenerate">
<div class="slide bg-purple-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-purple-800">边框变化</h2>
  <div class="flex flex-wrap gap-5">
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-solid border-violet-600">实线边框</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-dashed border-violet-600">虚线边框</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-dotted border-violet-600">点线边框</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-double border-violet-600">双线边框</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-solid border-violet-600 rounded-2xl">圆角边框</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5" style="border-top: 4px solid #ef4444; border-right: 4px dashed #22c55e; border-bottom: 4px dotted #3b82f6; border-left: 4px double #eab308;">混合边框</div>
  </div>
</div>
</SlideSection>

## 10. 嵌套元素

<SlideSection slide-id="slide-nested" description="带 rgba 透明度的嵌套容器。" @generate="onGenerate">
<div class="slide bg-gradient-to-br from-blue-900 to-slate-900 text-white">
  <h2 class="text-3xl m-0 mb-4">深层嵌套测试</h2>
  <div class="bg-white/10 p-5 rounded-xl">
    <p>容器层</p>
    <div class="bg-blue-400/30 p-4 rounded-lg mb-2.5">
      <p>第 1 层 - 蓝色</p>
      <div class="bg-green-400/30 p-3 rounded-md mb-2">
        <p>第 2 层 - 绿色</p>
        <div class="bg-yellow-400/30 p-2.5 rounded">
          <p>第 3 层 - 黄色（最深层）</p>
        </div>
      </div>
    </div>
    <div class="flex gap-2.5 mt-2.5">
      <span class="bg-red-400/50 py-1 px-3 rounded-full text-xs">徽章 1</span>
      <span class="bg-red-400/50 py-1 px-3 rounded-full text-xs">徽章 2</span>
      <span class="bg-red-400/50 py-1 px-3 rounded-full text-xs">徽章 3</span>
    </div>
  </div>
</div>
</SlideSection>

## 11. 图片与 Object-Fit

<SlideSection slide-id="slide-images" description="固定尺寸容器中不同 `object-fit` 值的图片。" @generate="onGenerate">
<div class="slide bg-gray-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-slate-900">图片 Object-Fit</h2>
  <div class="flex gap-5">
    <div class="flex-1 text-center">
      <div class="w-[200px] h-[130px] border-2 border-slate-300 rounded-lg overflow-hidden mx-auto mb-2 bg-slate-200">
        <img class="w-full h-full object-contain" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%233b82f6' width='300' height='200'/%3E%3Ccircle cx='150' cy='80' r='50' fill='%2360a5fa'/%3E%3Crect x='50' y='140' width='200' height='40' rx='8' fill='%231d4ed8'/%3E%3Ctext x='150' y='90' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3E300x200%3C/text%3E%3C/svg%3E" alt="contain">
      </div>
      <div class="text-sm text-slate-500 font-bold">contain</div>
    </div>
    <div class="flex-1 text-center">
      <div class="w-[200px] h-[130px] border-2 border-slate-300 rounded-lg overflow-hidden mx-auto mb-2 bg-slate-200">
        <img class="w-full h-full object-cover" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%2322c55e' width='300' height='200'/%3E%3Ccircle cx='150' cy='80' r='50' fill='%234ade80'/%3E%3Crect x='50' y='140' width='200' height='40' rx='8' fill='%23166534'/%3E%3Ctext x='150' y='90' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3E300x200%3C/text%3E%3C/svg%3E" alt="cover">
      </div>
      <div class="text-sm text-slate-500 font-bold">cover</div>
    </div>
    <div class="flex-1 text-center">
      <div class="w-[200px] h-[130px] border-2 border-slate-300 rounded-lg overflow-hidden mx-auto mb-2 bg-slate-200">
        <img class="w-full h-full object-fill" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f97316' width='300' height='200'/%3E%3Ccircle cx='150' cy='80' r='50' fill='%23fb923c'/%3E%3Crect x='50' y='140' width='200' height='40' rx='8' fill='%23c2410c'/%3E%3Ctext x='150' y='90' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3E300x200%3C/text%3E%3C/svg%3E" alt="fill">
      </div>
      <div class="text-sm text-slate-500 font-bold">fill</div>
    </div>
    <div class="flex-1 text-center">
      <div class="w-[200px] h-[130px] border-2 border-slate-300 rounded-lg overflow-hidden mx-auto mb-2 bg-slate-200">
        <img class="w-full h-full object-scale-down" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23a855f7' width='300' height='200'/%3E%3Ccircle cx='150' cy='80' r='50' fill='%23c084fc'/%3E%3Crect x='50' y='140' width='200' height='40' rx='8' fill='%237c3aed'/%3E%3Ctext x='150' y='90' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3E300x200%3C/text%3E%3C/svg%3E" alt="scale-down">
      </div>
      <div class="text-sm text-slate-500 font-bold">scale-down</div>
    </div>
  </div>
</div>
</SlideSection>

## 12. 透明度

<SlideSection slide-id="slide-opacity" description="CSS `opacity` 属性和 `rgba()` 背景色，以及重叠元素。" @generate="onGenerate">
<div class="slide bg-slate-800 text-white">
  <h2 class="text-3xl m-0 mb-5">Opacity 与 RGBA</h2>
  <div class="flex gap-4 mb-5">
    <div class="flex-1 h-[70px] bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold opacity-100">1.0</div>
    <div class="flex-1 h-[70px] bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold opacity-80">0.8</div>
    <div class="flex-1 h-[70px] bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold opacity-60">0.6</div>
    <div class="flex-1 h-[70px] bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold opacity-40">0.4</div>
    <div class="flex-1 h-[70px] bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold opacity-20">0.2</div>
  </div>
  <div class="flex gap-4 mb-5">
    <div class="flex-1 h-[70px] rounded-lg flex items-center justify-center text-[13px] font-bold text-white" style="background: rgba(239, 68, 68, 1.0);">rgba(1.0)</div>
    <div class="flex-1 h-[70px] rounded-lg flex items-center justify-center text-[13px] font-bold text-white" style="background: rgba(239, 68, 68, 0.8);">rgba(0.8)</div>
    <div class="flex-1 h-[70px] rounded-lg flex items-center justify-center text-[13px] font-bold text-white" style="background: rgba(239, 68, 68, 0.6);">rgba(0.6)</div>
    <div class="flex-1 h-[70px] rounded-lg flex items-center justify-center text-[13px] font-bold text-white" style="background: rgba(239, 68, 68, 0.4);">rgba(0.4)</div>
    <div class="flex-1 h-[70px] rounded-lg flex items-center justify-center text-[13px] font-bold text-white" style="background: rgba(239, 68, 68, 0.2);">rgba(0.2)</div>
  </div>
  <div class="relative h-[120px]">
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-0 top-0" style="background: rgba(59, 130, 246, 0.7);">蓝色 0.7</div>
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-[120px] top-[15px]" style="background: rgba(34, 197, 94, 0.7);">绿色 0.7</div>
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-[240px] top-[30px]" style="background: rgba(168, 85, 247, 0.7);">紫色 0.7</div>
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-[360px] top-[15px]" style="background: rgba(249, 115, 22, 0.7);">橙色 0.7</div>
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-[480px] top-0" style="background: rgba(236, 72, 153, 0.7);">粉色 0.7</div>
  </div>
</div>
</SlideSection>

## 13. 字体与排版

<SlideSection slide-id="slide-fonts" description="字体家族、字号比例、字重和行高。" @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">排版展示</h2>
  <div class="mb-3">
    <h3 class="text-sm text-slate-500 m-0 mb-1.5 uppercase tracking-wider">字体家族</h3>
    <div class="flex flex-wrap gap-2.5">
      <span class="px-3.5 py-2 bg-slate-100 rounded-md text-[15px]" style="font-family: 'Times New Roman', serif;">Times New Roman</span>
      <span class="px-3.5 py-2 bg-slate-100 rounded-md text-[15px]" style="font-family: Arial, sans-serif;">Arial</span>
      <span class="px-3.5 py-2 bg-slate-100 rounded-md text-[15px]" style="font-family: 'Courier New', monospace;">Courier New</span>
      <span class="px-3.5 py-2 bg-slate-100 rounded-md text-[15px]" style="font-family: Georgia, serif;">Georgia</span>
      <span class="px-3.5 py-2 bg-slate-100 rounded-md text-[15px]" style="font-family: Verdana, sans-serif;">Verdana</span>
      <span class="px-3.5 py-2 bg-slate-100 rounded-md text-[15px]" style="font-family: Tahoma, sans-serif;">Tahoma</span>
      <span class="px-3.5 py-2 bg-slate-100 rounded-md text-[15px]" style="font-family: Impact, sans-serif;">Impact</span>
    </div>
  </div>
  <div class="mb-3">
    <h3 class="text-sm text-slate-500 m-0 mb-1.5 uppercase tracking-wider">字号比例</h3>
    <div class="flex items-baseline gap-5">
      <span class="text-[10px]">10px</span>
      <span class="text-sm">14px</span>
      <span class="text-lg">18px</span>
      <span class="text-2xl">24px</span>
      <span class="text-3xl">32px</span>
      <span class="text-[42px]">42px</span>
    </div>
  </div>
  <div class="mb-3">
    <h3 class="text-sm text-slate-500 m-0 mb-1.5 uppercase tracking-wider">字重</h3>
    <div class="flex gap-4">
      <span class="text-base font-normal">常规 (400)</span>
      <span class="text-base font-semibold">半粗 (600)</span>
      <span class="text-base font-bold">粗体 (700)</span>
      <span class="text-base font-black">极粗 (900)</span>
    </div>
  </div>
  <div class="mb-3">
    <h3 class="text-sm text-slate-500 m-0 mb-1.5 uppercase tracking-wider">行高</h3>
    <div class="flex gap-4">
      <div class="w-[200px] px-2.5 py-1.5 bg-slate-100 rounded text-xs leading-none">行高: 1.0 — 文本行紧密排列在一起。</div>
      <div class="w-[200px] px-2.5 py-1.5 bg-slate-100 rounded text-xs leading-normal">行高: 1.5 — 正文适合阅读的舒适间距。</div>
      <div class="w-[200px] px-2.5 py-1.5 bg-slate-100 rounded text-xs leading-loose">行高: 2.0 — 双倍行距，有充裕的垂直空间。</div>
    </div>
  </div>
</div>
</SlideSection>

## 14. 渐变变化

<SlideSection slide-id="slide-gradients" description="多方向渐变、多色阶渐变和渐变文字。" @generate="onGenerate">
<div class="slide bg-slate-900 text-white">
  <h2 class="text-3xl m-0 mb-4">渐变画廊</h2>
  <div class="grid grid-cols-3 gap-4">
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(to right, #f97316, #ec4899);">to right</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(to bottom, #3b82f6, #8b5cf6);">to bottom</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(45deg, #22c55e, #06b6d4);">45deg</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(90deg, #ef4444, #f59e0b, #22c55e);">3 色阶 (90deg)</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(180deg, #6366f1, #ec4899, #f97316);">3 色阶 (180deg)</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(270deg, #14b8a6, #3b82f6, #8b5cf6, #ec4899);">4 色阶 (270deg)</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(135deg, #f97316 0%, #f97316 33%, #3b82f6 33%, #3b82f6 66%, #22c55e 66%);">硬边界</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(to right, #0f172a 0%, #3b82f6 30%, #22c55e 70%, #0f172a 100%);">百分比位置</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f97316 100%);">对角 3 色阶</div>
  </div>
  <div class="mt-4 text-center">
    <span class="text-4xl font-black bg-clip-text" style="background: linear-gradient(90deg, #f97316, #ec4899, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">渐变文字效果</span>
  </div>
</div>
</SlideSection>

## 15. 高级定位

<SlideSection slide-id="slide-positioning" description="相对容器内的绝对定位，以及卡片上的徽章覆盖。" @generate="onGenerate">
<div class="slide bg-amber-100 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-amber-800">CSS 定位</h2>
  <div class="flex gap-8">
    <div>
      <p class="text-[13px] text-amber-800 m-0 mb-2">绝对定位在相对容器内：</p>
      <div class="relative w-[350px] h-[220px] bg-amber-200 border-2 border-amber-600 rounded-lg">
        <div class="absolute top-2.5 left-2.5 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-red-500">左上</div>
        <div class="absolute top-2.5 right-2.5 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-blue-500">右上</div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-amber-500 z-[2]">居中</div>
        <div class="absolute bottom-2.5 left-2.5 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-green-500">左下</div>
        <div class="absolute bottom-2.5 right-2.5 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-purple-500">右下</div>
      </div>
    </div>
    <div>
      <p class="text-[13px] text-amber-800 m-0 mb-2">卡片上的徽章覆盖：</p>
      <div class="relative w-[260px] bg-white rounded-xl overflow-hidden shadow-md">
        <div class="w-full h-[130px]" style="background: linear-gradient(135deg, #667eea, #764ba2);"></div>
        <div class="absolute top-2.5 right-2.5 bg-red-500 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold">新品</div>
        <div class="p-4">
          <h4 class="m-0 mb-1.5 text-base">产品卡片</h4>
          <p class="m-0 text-xs text-slate-500">一个带有绝对定位徽章覆盖在右上角的卡片。</p>
        </div>
      </div>
    </div>
  </div>
</div>
</SlideSection>

## 16. 高级列表样式

<SlideSection slide-id="slide-adv-lists" description="各种 list-style-type 值、嵌套列表和间隔项。" @generate="onGenerate">
<div class="slide bg-emerald-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-emerald-800">列表样式变化</h2>
  <div class="flex gap-8">
    <div class="flex-1">
      <h3 class="text-[15px] text-emerald-700 m-0 mb-2">无序样式</h3>
      <ul class="m-0 mb-3 pl-6 list-disc">
        <li class="text-[13px] mb-1 text-slate-800">实心圆样式项 1</li>
        <li class="text-[13px] mb-1 text-slate-800">实心圆样式项 2</li>
      </ul>
      <ul class="m-0 mb-3 pl-6 list-[circle]">
        <li class="text-[13px] mb-1 text-slate-800">空心圆样式项 1</li>
        <li class="text-[13px] mb-1 text-slate-800">空心圆样式项 2</li>
      </ul>
      <ul class="m-0 mb-3 pl-6 list-[square]">
        <li class="text-[13px] mb-1 text-slate-800">方块样式项 1</li>
        <li class="text-[13px] mb-1 text-slate-800">方块样式项 2</li>
      </ul>
    </div>
    <div class="flex-1">
      <h3 class="text-[15px] text-emerald-700 m-0 mb-2">有序样式</h3>
      <ol class="m-0 mb-3 pl-6 list-decimal">
        <li class="text-[13px] mb-1 text-slate-800">十进制项一</li>
        <li class="text-[13px] mb-1 text-slate-800">十进制项二</li>
        <li class="text-[13px] mb-1 text-slate-800">十进制项三</li>
      </ol>
      <ol class="m-0 mb-3 pl-6 list-[decimal-leading-zero]">
        <li class="text-[13px] mb-1 text-slate-800">前导零项</li>
        <li class="text-[13px] mb-1 text-slate-800">前导零项</li>
        <li class="text-[13px] mb-1 text-slate-800">前导零项</li>
      </ol>
    </div>
    <div class="flex-1">
      <h3 class="text-[15px] text-emerald-700 m-0 mb-2">嵌套与间隔</h3>
      <ul class="m-0 pl-6 list-disc">
        <li class="text-[13px] mb-1 text-slate-800">顶层项
          <ul class="mt-1 pl-6 list-[circle]">
            <li class="text-[13px] mb-1 text-slate-800">嵌套第 2 层
              <ul class="mt-1 pl-6 list-[square]">
                <li class="text-[13px] mb-1 text-slate-800">嵌套第 3 层</li>
              </ul>
            </li>
          </ul>
        </li>
        <li class="text-[13px] mb-1 text-slate-800">另一个顶层项</li>
      </ul>
      <ul class="m-0 mt-3 pl-6 list-disc">
        <li class="text-[13px] py-1.5 border-b border-emerald-200 text-slate-800">间隔项 A</li>
        <li class="text-[13px] py-1.5 border-b border-emerald-200 text-slate-800">间隔项 B</li>
        <li class="text-[13px] py-1.5 border-b border-emerald-200 text-slate-800">间隔项 C</li>
      </ul>
    </div>
  </div>
</div>
</SlideSection>

## 17. 文本对齐

<SlideSection slide-id="slide-alignment" description="显式 `text-align` 左对齐、居中和右对齐对比。" @generate="onGenerate">
<div class="slide bg-indigo-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-indigo-800">文本对齐</h2>
  <div class="flex gap-5">
    <div class="flex-1 bg-white p-5 rounded-lg border border-indigo-200">
      <h4 class="text-sm text-indigo-500 m-0 mb-3 uppercase tracking-wider">左对齐</h4>
      <p class="text-sm m-0 mb-2 text-left">此文本在容器中左对齐。</p>
      <p class="text-sm m-0 text-left">第二行也是左对齐。</p>
    </div>
    <div class="flex-1 bg-white p-5 rounded-lg border border-indigo-200">
      <h4 class="text-sm text-indigo-500 m-0 mb-3 uppercase tracking-wider text-center">居中对齐</h4>
      <p class="text-sm m-0 mb-2 text-center">此文本在容器中居中显示。</p>
      <p class="text-sm m-0 text-center">第二行也是居中。</p>
    </div>
    <div class="flex-1 bg-white p-5 rounded-lg border border-indigo-200">
      <h4 class="text-sm text-indigo-500 m-0 mb-3 uppercase tracking-wider text-right">右对齐</h4>
      <p class="text-sm m-0 mb-2 text-right">此文本在容器中右对齐。</p>
      <p class="text-sm m-0 text-right">第二行也是右对齐。</p>
    </div>
  </div>
  <div class="mt-5 bg-white p-4 rounded-lg border border-indigo-200">
    <p class="text-xs m-0 mb-1 text-left text-indigo-600">左对齐：价格列表</p>
    <p class="text-xs m-0 mb-1 text-center text-indigo-600">居中：总金额</p>
    <p class="text-xs m-0 text-right text-indigo-600">右对齐：¥8,523.45</p>
  </div>
</div>
</SlideSection>

## 18. CJK 列表

<SlideSection slide-id="slide-cjk-lists" description="CJK（中日韩）列表编号样式。" @generate="onGenerate">
<div class="slide bg-rose-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-rose-800">CJK 列表样式</h2>
  <div class="flex gap-8">
    <div class="flex-1">
      <h3 class="text-[15px] text-rose-700 m-0 mb-2">cjk-ideographic</h3>
      <ol class="m-0 mb-3 pl-6 list-[cjk-ideographic]">
        <li class="text-[13px] mb-1 text-slate-800">第一项</li>
        <li class="text-[13px] mb-1 text-slate-800">第二项</li>
        <li class="text-[13px] mb-1 text-slate-800">第三项</li>
      </ol>
    </div>
    <div class="flex-1">
      <h3 class="text-[15px] text-rose-700 m-0 mb-2">trad-chinese-informal</h3>
      <ol class="m-0 mb-3 pl-6 list-[trad-chinese-informal]">
        <li class="text-[13px] mb-1 text-slate-800">第一項</li>
        <li class="text-[13px] mb-1 text-slate-800">第二項</li>
        <li class="text-[13px] mb-1 text-slate-800">第三項</li>
      </ol>
    </div>
    <div class="flex-1">
      <h3 class="text-[15px] text-rose-700 m-0 mb-2">japanese-formal</h3>
      <ol class="m-0 mb-3 pl-6 list-[japanese-formal]">
        <li class="text-[13px] mb-1 text-slate-800">第一項</li>
        <li class="text-[13px] mb-1 text-slate-800">第二項</li>
        <li class="text-[13px] mb-1 text-slate-800">第三項</li>
      </ol>
    </div>
    <div class="flex-1">
      <h3 class="text-[15px] text-rose-700 m-0 mb-2">korean-hangul-formal</h3>
      <ol class="m-0 mb-3 pl-6 list-[korean-hangul-formal]">
        <li class="text-[13px] mb-1 text-slate-800">첫 번째</li>
        <li class="text-[13px] mb-1 text-slate-800">두 번째</li>
        <li class="text-[13px] mb-1 text-slate-800">세 번째</li>
      </ol>
    </div>
  </div>
</div>
</SlideSection>

## 19. 圆角渐变

<SlideSection slide-id="slide-grad-round" description="带有各种 border-radius 值的线性渐变。" @generate="onGenerate">
<div class="slide bg-slate-100 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">圆角渐变</h2>
  <div class="flex flex-wrap gap-5">
    <div class="w-40 h-24 rounded-none flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #667eea, #764ba2);">rounded-none</div>
    <div class="w-40 h-24 rounded-lg flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #f97316, #ec4899);">rounded-lg</div>
    <div class="w-40 h-24 rounded-2xl flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #22c55e, #06b6d4);">rounded-2xl</div>
    <div class="w-40 h-24 rounded-3xl flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);">rounded-3xl</div>
    <div class="w-40 h-24 rounded-full flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #ef4444, #f59e0b);">rounded-full</div>
  </div>
  <div class="mt-5 flex gap-5">
    <div class="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-xs font-bold text-center" style="background: linear-gradient(180deg, #0f172a, #3b82f6);">纵向<br/>渐变</div>
    <div class="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-xs font-bold text-center" style="background: linear-gradient(90deg, #22c55e, #16a34a);">横向<br/>渐变</div>
    <div class="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-xs font-bold text-center" style="background: linear-gradient(45deg, #ec4899, #f97316);">对角<br/>渐变</div>
    <div class="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-xs font-bold text-center" style="background: linear-gradient(135deg, #8b5cf6, #06b6d4);">反向<br/>对角</div>
  </div>
</div>
</SlideSection>

## 20. 渐变透明度

<SlideSection slide-id="slide-grad-opacity" description="使用 rgba() 和 transparent 关键字的半透明渐变。" @generate="onGenerate">
<div class="slide bg-slate-800 text-white">
  <h2 class="text-3xl m-0 mb-4">渐变透明度</h2>
  <div class="flex gap-4 mb-5">
    <div class="flex-1 h-24 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(to right, rgba(59, 130, 246, 1), rgba(59, 130, 246, 0));">rgba → 透明</div>
    <div class="flex-1 h-24 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(to right, rgba(239, 68, 68, 0.8), rgba(59, 130, 246, 0.8));">rgba 到 rgba</div>
    <div class="flex-1 h-24 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(to right, transparent, #22c55e);">透明 → 实色</div>
  </div>
  <div class="relative h-32 rounded-xl overflow-hidden" style="background: linear-gradient(135deg, #1e293b, #334155);">
    <div class="absolute top-4 left-4 w-48 h-20 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.6));">半透明</div>
    <div class="absolute top-4 right-4 w-48 h-20 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.7), rgba(249, 115, 22, 0.7));">粉色 → 橙色</div>
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-20 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.5), transparent);">淡入/淡出</div>
  </div>
</div>
</SlideSection>

## 21. 可见性

<SlideSection slide-id="slide-visibility" description="`visibility: hidden` 和 `display: none` 的对比。" @generate="onGenerate">
<div class="slide bg-slate-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">Visibility 与 Display</h2>
  <div class="flex gap-5">
    <div class="flex-1 bg-white p-4 rounded-lg border border-slate-200">
      <h3 class="text-base m-0 mb-3 text-slate-700">正常（可见）</h3>
      <div class="flex gap-2">
        <div class="w-12 h-12 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">A</div>
        <div class="w-12 h-12 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">B</div>
        <div class="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">C</div>
      </div>
    </div>
    <div class="flex-1 bg-white p-4 rounded-lg border border-slate-200">
      <h3 class="text-base m-0 mb-3 text-slate-700">visibility: hidden</h3>
      <div class="flex gap-2">
        <div class="w-12 h-12 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">A</div>
        <div class="w-12 h-12 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold invisible">B</div>
        <div class="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">C</div>
      </div>
      <p class="text-xs text-slate-500 mt-2 m-0">保留空间</p>
    </div>
    <div class="flex-1 bg-white p-4 rounded-lg border border-slate-200">
      <h3 class="text-base m-0 mb-3 text-slate-700">display: none</h3>
      <div class="flex gap-2">
        <div class="w-12 h-12 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">A</div>
        <div class="w-12 h-12 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold hidden">B</div>
        <div class="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">C</div>
      </div>
      <p class="text-xs text-slate-500 mt-2 m-0">移除空间</p>
    </div>
  </div>
</div>
</SlideSection>

## 22. 裁剪文本

<SlideSection slide-id="slide-clip-text" description="使用 `background-clip: text` 实现渐变文字效果。" @generate="onGenerate">
<div class="slide bg-slate-900 text-white">
  <h2 class="text-3xl m-0 mb-5">Background Clip Text</h2>
  <div class="text-center">
    <div class="text-6xl font-black mb-6 bg-clip-text" style="background: linear-gradient(90deg, #f97316, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">渐变文字</div>
    <div class="text-4xl font-bold mb-6 bg-clip-text" style="background: linear-gradient(135deg, #22c55e, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">多色渐变</div>
    <div class="text-3xl font-bold bg-clip-text" style="background: linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">彩虹效果</div>
  </div>
</div>
</SlideSection>

## 23. URL 图片

<SlideSection slide-id="slide-url-images" description="通过 `data-file` 属性从 URL 加载的图片。" @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-slate-900">基于 URL 的图片</h2>
  <div class="flex gap-8 items-center justify-center">
    <div class="text-center">
      <img class="url-img w-32 h-32 object-contain mx-auto mb-3" data-file="sample-icon.svg" alt="图标">
      <p class="text-sm text-slate-500 m-0">图标 (SVG)</p>
    </div>
    <div class="text-center">
      <img class="url-img w-48 h-32 object-cover mx-auto mb-3 rounded-lg" data-file="sample-chart.svg" alt="图表">
      <p class="text-sm text-slate-500 m-0">图表 (SVG)</p>
    </div>
  </div>
  <p class="text-center text-xs text-slate-400 mt-5 m-0">图片通过 `withBase()` 加载，以在 VitePress 中正确解析路径。</p>
</div>
</SlideSection>

## 24. 旋转变换

<SlideSection slide-id="slide-rotate" description="使用 CSS transform rotate 的元素。" @generate="onGenerate">
<div class="slide bg-gradient-to-br from-indigo-100 to-purple-100 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">旋转变换</h2>
  <div class="flex gap-6 items-center justify-center flex-wrap">
    <div class="w-24 h-24 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">无旋转</div>
    <div class="w-24 h-24 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold rotate-12">rotate(12deg)</div>
    <div class="w-24 h-24 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold rotate-45">rotate(45deg)</div>
    <div class="w-24 h-24 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs font-bold -rotate-12">rotate(-12deg)</div>
    <div class="w-24 h-24 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold -rotate-45">rotate(-45deg)</div>
  </div>
  <div class="mt-6 flex gap-4 items-center justify-center">
    <div class="w-20 h-20 bg-cyan-500 rounded flex items-center justify-center text-white text-[10px] font-bold rotate-90">90°</div>
    <div class="w-20 h-20 bg-pink-500 rounded flex items-center justify-center text-white text-[10px] font-bold rotate-180">180°</div>
    <div class="w-20 h-20 bg-teal-500 rounded flex items-center justify-center text-white text-[10px] font-bold -rotate-90">-90°</div>
  </div>
</div>
</SlideSection>

## 25. 盒阴影

<SlideSection slide-id="slide-box-shadow" description="各种 box-shadow 效果。" @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-slate-900">盒阴影</h2>
  <div class="flex flex-wrap gap-6 items-center justify-center">
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-sm">shadow-sm</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow">shadow</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-md">shadow-md</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-lg">shadow-lg</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-xl">shadow-xl</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-2xl">shadow-2xl</div>
  </div>
  <div class="mt-6 flex flex-wrap gap-6 items-center justify-center">
    <div class="w-36 h-24 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-white" style="box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);">蓝色发光</div>
    <div class="w-36 h-24 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-white" style="box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);">红色发光</div>
    <div class="w-36 h-24 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-white" style="box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);">绿色发光</div>
  </div>
</div>
</SlideSection>

## 26. 裁剪路径

<SlideSection slide-id="slide-clip-path" description="使用各种 CSS clip-path 形状裁剪的元素。" @generate="onGenerate">
<div class="slide bg-slate-100 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">裁剪路径</h2>
  <div class="flex flex-wrap gap-5 items-center justify-center">
    <div class="w-28 h-28 bg-blue-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: circle(50%);">圆形</div>
    <div class="w-28 h-28 bg-green-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: ellipse(70% 50% at 50% 50%);">椭圆</div>
    <div class="w-28 h-28 bg-orange-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: polygon(50% 0%, 100% 100%, 0% 100%);">三角形</div>
    <div class="w-28 h-28 bg-purple-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);">六边形</div>
    <div class="w-28 h-28 bg-red-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);">星形</div>
    <div class="w-28 h-28 bg-cyan-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: inset(10px 20px 10px 20px round 10px);">内嵌</div>
  </div>
</div>
</SlideSection>

## 27. Canvas 元素

<SlideSection slide-id="slide-canvas" description="HTML `<canvas>` 元素，使用 2D 绑制的柱状图。" @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">Canvas 绘图</h2>
  <div class="flex gap-6 items-start">
    <div class="flex-[2]">
      <canvas id="demo-canvas" width="500" height="280" class="rounded-lg border border-slate-200" style="width: 500px; height: 280px;"></canvas>
    </div>
    <div class="flex-1">
      <h3 class="text-base m-0 mb-3 text-slate-700">图表图例</h3>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-blue-500"></div><span class="text-xs text-slate-600">一月</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-green-500"></div><span class="text-xs text-slate-600">二月</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-orange-500"></div><span class="text-xs text-slate-600">三月</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-purple-500"></div><span class="text-xs text-slate-600">四月</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-pink-500"></div><span class="text-xs text-slate-600">五月</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-cyan-500"></div><span class="text-xs text-slate-600">六月</span></div>
      </div>
      <p class="text-xs text-slate-400 mt-4 m-0">Canvas 内容在 PPTX 输出中被光栅化为图片。</p>
    </div>
  </div>
</div>
</SlideSection>

## 28. 表单元素

<SlideSection slide-id="slide-form-inputs" description="原生 HTML 表单元素——文本输入框、文本域、下拉选择、复选框、单选按钮和按钮。" @generate="onGenerate">
<div class="slide bg-slate-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">表单元素</h2>
  <div class="flex gap-6">
    <div class="flex-1">
      <h3 class="text-sm text-slate-500 m-0 mb-2 uppercase tracking-wider">文本输入</h3>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">用户名</label>
        <input type="text" value="john_doe" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">邮箱</label>
        <input type="email" value="john@example.com" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">密码</label>
        <input type="password" value="secret123" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">留言</label>
        <textarea class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800 resize-none" rows="2">你好，这是文本域中的示例留言。</textarea>
      </div>
    </div>
    <div class="flex-1">
      <h3 class="text-sm text-slate-500 m-0 mb-2 uppercase tracking-wider">选择控件</h3>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">国家</label>
        <select class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
          <option selected>中国</option>
          <option>美国</option>
          <option>日本</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1.5">偏好设置</label>
        <div class="flex flex-col gap-1.5">
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked class="w-4 h-4"> 邮件通知</label>
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" class="w-4 h-4"> 短信提醒</label>
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked class="w-4 h-4"> 每周摘要</label>
        </div>
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1.5">套餐</label>
        <div class="flex flex-col gap-1.5">
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="plan" class="w-4 h-4"> 免费版</label>
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="plan" checked class="w-4 h-4"> 专业版</label>
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="plan" class="w-4 h-4"> 企业版</label>
        </div>
      </div>
    </div>
    <div class="flex-1">
      <h3 class="text-sm text-slate-500 m-0 mb-2 uppercase tracking-wider">按钮与占位符</h3>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">搜索（占位符）</label>
        <input type="text" placeholder="输入以搜索..." class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">禁用输入</label>
        <input type="text" value="无法编辑" disabled class="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-100 text-slate-400">
      </div>
      <div class="flex gap-2 mt-5">
        <button class="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md border-0">提交</button>
        <button class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md">取消</button>
        <button class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md border-0" disabled>禁用</button>
      </div>
    </div>
  </div>
</div>
</SlideSection>

## 29. 多页幻灯片演示

从元素数组创建多页幻灯片演示文稿——每个元素成为一张独立的幻灯片。

<div class="slide-section">
<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; max-width: 100%;">
  <div style="width: 300px; height: 180px; overflow: hidden;">
    <div id="slide-multi-1" style="transform: scale(0.3125); transform-origin: top left; width:960px;height:540px" class="slide bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col items-center justify-center text-center">
      <h2 class="text-5xl font-extrabold m-0 mb-4">幻灯片 1</h2>
      <p class="text-xl m-0 text-white/80">带渐变背景的介绍页</p>
    </div>
  </div>
  <div style="width: 300px; height: 180px; overflow: hidden;">
    <div id="slide-multi-2" style="transform: scale(0.3125); transform-origin: top left; width:960px;height:540px" class="slide bg-white text-slate-800 flex flex-col justify-center">
      <h2 class="text-4xl font-bold m-0 mb-6 text-slate-900">幻灯片 2：内容</h2>
      <div class="flex gap-5">
        <div class="flex-1 bg-blue-50 p-4 rounded-lg">
          <h3 class="text-lg m-0 mb-2 text-blue-700">要点 A</h3>
          <p class="text-sm m-0 text-slate-600">演示文稿的第一个关键要点。</p>
        </div>
        <div class="flex-1 bg-emerald-50 p-4 rounded-lg">
          <h3 class="text-lg m-0 mb-2 text-emerald-700">要点 B</h3>
          <p class="text-sm m-0 text-slate-600">第二个关键要点及支撑细节。</p>
        </div>
      </div>
    </div>
  </div>
  <div style="width: 300px; height: 180px; overflow: hidden;">
    <div id="slide-multi-3" style="transform: scale(0.3125); transform-origin: top left; width:960px;height:540px" class="slide bg-slate-900 text-white flex flex-col items-center justify-center text-center">
      <h2 class="text-5xl font-extrabold m-0 mb-4">谢谢</h2>
      <p class="text-xl m-0 text-slate-400">深色主题的结束页</p>
    </div>
  </div>
</div>
</div>

<div class="flex justify-center my-4">
  <button class="gen-btn" :disabled="isConverting?.value" @click="onGenerateMulti">生成多页幻灯片 PPTX（3 页）</button>
</div>

<style scoped>
:deep(.VPDoc .container) {
  max-width: 100% !important;
}

:deep(.vp-doc) {
  max-width: 1040px !important;
  margin: 0 auto;
}

.slide-section {
  display: flex;
  justify-content: center;
  margin: 16px 0;
  max-width: 100%;
  overflow: hidden;
}

.slide {
  width: 960px;
  height: 540px;
  padding: 28px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  box-sizing: border-box;
  transform-origin: top left;
}

.gen-btn {
  padding: 8px 20px;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.gen-btn:hover {
  background: var(--vp-c-brand-2);
}

.gen-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
