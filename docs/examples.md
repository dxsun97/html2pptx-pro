# Examples

Interactive slide examples demonstrating html2pptx-pro capabilities. Each section shows a slide preview — click **Generate PPTX** to download it, or use the button below to generate all slides at once.

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { useHtml2Pptx } from './.vitepress/theme/composables/useHtml2Pptx'

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
    setStatus('error', `Slide "${slideId}" not found.`)
    return
  }
  await convertElements([el], { filename: 'html2pptx-demo.pptx' })
}

// Convert all slides
async function onGenerateAll() {
  const elements = SLIDE_IDS.map(getSlideElement).filter(Boolean)
  if (elements.length === 0) {
    setStatus('error', 'No slides found.')
    return
  }
  await convertElements(elements, { filename: 'html2pptx-demo.pptx' })
}

// Convert multi-slide demo
async function onGenerateMulti() {
  const elements = MULTI_SLIDE_IDS.map(getSlideElement).filter(Boolean)
  if (elements.length === 0) {
    setStatus('error', 'No multi-slide elements found.')
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
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
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
      ctx.fillText('Monthly Performance', 50, 25)
    }
  }
})
</script>

<DemoControls @generate-all="onGenerateAll" />

## 1. Hero — Gradient Background

<SlideSection slide-id="slide-hero" description="Linear gradient with flexbox centering." @generate="onGenerate">
<div class="slide bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex flex-col items-center justify-center text-center">
  <h2 class="text-4xl font-extrabold m-0 mb-4">Welcome to html2pptx-pro</h2>
  <p class="text-xl m-0 mb-2">Convert HTML to PowerPoint with ease</p>
  <p class="text-base m-0 text-white/80">Gradients, flexbox centering, and modern styling — all preserved in your slides.</p>
</div>
</SlideSection>

## 2. Typography

<SlideSection slide-id="slide-typography" description="Dark background with multiple font sizes, weights, and colors." @generate="onGenerate">
<div class="slide bg-slate-900 text-white flex flex-col justify-center">
  <h2 class="text-5xl font-extrabold m-0 mb-6 text-slate-50">Bold Title Text</h2>
  <p class="text-2xl text-slate-400 mb-6 m-0">A subtitle with muted color</p>
  <p class="text-xl text-cyan-400 font-bold m-0 mb-4">Highlighted important text</p>
  <p class="text-base text-slate-300 leading-relaxed m-0">Normal paragraph text with regular styling. This demonstrates how different text colors, sizes, and font weights render in PowerPoint output.</p>
</div>
</SlideSection>

## 3. Feature Columns

<SlideSection slide-id="slide-features" description="Flexbox columns with rounded corners." @generate="onGenerate">
<div class="slide bg-slate-100 flex flex-col text-slate-800">
  <h2 class="text-3xl text-slate-800 m-0 mb-5 text-center">Feature Comparison</h2>
  <div class="flex gap-5 mb-5">
    <div class="flex-1 p-5 rounded-lg text-center bg-blue-500 text-white">
      <h3 class="text-xl m-0 mb-2">Feature A</h3>
      <p class="text-sm m-0">High-fidelity rendering of HTML elements into PPTX slides</p>
    </div>
    <div class="flex-1 p-5 rounded-lg text-center bg-emerald-500 text-white">
      <h3 class="text-xl m-0 mb-2">Feature B</h3>
      <p class="text-sm m-0">Full CSS stacking context support with 7-layer painting order</p>
    </div>
    <div class="flex-1 p-5 rounded-lg text-center bg-orange-500 text-white">
      <h3 class="text-xl m-0 mb-2">Feature C</h3>
      <p class="text-sm m-0">Simple API — pass an element, get a PowerPoint file</p>
    </div>
  </div>
</div>
</SlideSection>

## 4. Service Cards

<SlideSection slide-id="slide-cards" description="Card layout with borders." @generate="onGenerate">
<div class="slide bg-slate-950 text-white">
  <h2 class="text-4xl m-0 mb-8 text-center">Our Services</h2>
  <div class="flex gap-5">
    <div class="flex-1 bg-slate-900 rounded-xl p-6 border border-slate-700">
      <div class="text-3xl mb-4">🚀</div>
      <h3 class="text-lg m-0 mb-3 text-slate-50">Fast Performance</h3>
      <p class="text-sm text-slate-400 m-0 leading-normal">Optimized for speed and efficiency.</p>
    </div>
    <div class="flex-1 bg-slate-900 rounded-xl p-6 border border-slate-700">
      <div class="text-3xl mb-4">🎨</div>
      <h3 class="text-lg m-0 mb-3 text-slate-50">Beautiful Design</h3>
      <p class="text-sm text-slate-400 m-0 leading-normal">High fidelity HTML to PPTX output.</p>
    </div>
    <div class="flex-1 bg-slate-900 rounded-xl p-6 border border-slate-700">
      <div class="text-3xl mb-4">⚡</div>
      <h3 class="text-lg m-0 mb-3 text-slate-50">Easy Integration</h3>
      <p class="text-sm text-slate-400 m-0 leading-normal">Simple API for your existing code.</p>
    </div>
  </div>
</div>
</SlideSection>

## 5. Statistics Dashboard

<SlideSection slide-id="slide-stats" description="Vertical gradient with large numbers." @generate="onGenerate">
<div class="slide bg-gradient-to-b from-slate-950 to-blue-950 text-white flex flex-col justify-center">
  <h2 class="text-4xl font-bold m-0 mb-2">Amazing Statistics</h2>
  <p class="text-xl text-blue-400 mb-8 m-0">Our platform delivers outstanding results</p>
  <div class="flex gap-10">
    <div class="text-center">
      <div class="text-5xl font-bold text-cyan-400">99%</div>
      <div class="text-sm text-slate-400 mt-2">Satisfaction Rate</div>
    </div>
    <div class="text-center">
      <div class="text-5xl font-bold text-cyan-400">50K+</div>
      <div class="text-sm text-slate-400 mt-2">Active Users</div>
    </div>
    <div class="text-center">
      <div class="text-5xl font-bold text-cyan-400">24/7</div>
      <div class="text-sm text-slate-400 mt-2">Support Available</div>
    </div>
    <div class="text-center">
      <div class="text-5xl font-bold text-cyan-400">100+</div>
      <div class="text-sm text-slate-400 mt-2">Countries</div>
    </div>
  </div>
</div>
</SlideSection>

## 6. Text Decoration

<SlideSection slide-id="slide-text" description="Bold, italic, underline, and strikethrough styles." @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-slate-900">Text Style Examples</h2>
  <div class="mb-4 font-bold">Bold text using font-weight</div>
  <div class="mb-4 italic">Italic text using font-style</div>
  <div class="mb-4 underline">Underlined text using text-decoration</div>
  <div class="mb-4 line-through">Strikethrough text</div>
  <div class="mb-4 font-bold italic underline">Bold, Italic &amp; Underlined Combined</div>
  <p class="text-base leading-loose m-0">Mixed formatting: <strong class="text-red-600">bold red</strong>, <em class="text-green-600">italic green</em>, and <u class="text-purple-600">underline purple</u> in one paragraph.</p>
</div>
</SlideSection>

## 7. Lists

<SlideSection slide-id="slide-lists" description="Unordered and ordered lists." @generate="onGenerate">
<div class="slide bg-yellow-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-yellow-800">List Examples</h2>
  <div class="flex gap-16">
    <div class="flex-1">
      <h3 class="text-lg text-yellow-700 mb-3">Unordered List</h3>
      <ul class="m-0 pl-6">
        <li class="text-sm mb-1.5 text-yellow-950">First item with bullet</li>
        <li class="text-sm mb-1.5 text-yellow-950">Second item in list</li>
        <li class="text-sm mb-1.5 text-yellow-950">Third item here</li>
        <li class="text-sm mb-1.5 text-yellow-950">Fourth and final item</li>
      </ul>
    </div>
    <div class="flex-1">
      <h3 class="text-lg text-yellow-700 mb-3">Ordered List</h3>
      <ol class="m-0 pl-6">
        <li class="text-sm mb-1.5 text-yellow-950">Step one: Initialize</li>
        <li class="text-sm mb-1.5 text-yellow-950">Step two: Configure</li>
        <li class="text-sm mb-1.5 text-yellow-950">Step three: Execute</li>
        <li class="text-sm mb-1.5 text-yellow-950">Step four: Validate</li>
      </ol>
    </div>
  </div>
</div>
</SlideSection>

## 8. Data Table

<SlideSection slide-id="slide-table" description="Table with alternating row backgrounds." @generate="onGenerate">
<div class="slide bg-green-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-green-800">Quarterly Report</h2>
  <table class="w-full border-collapse text-sm">
    <thead>
      <tr>
        <th class="bg-green-500 text-white p-3 text-left font-bold">Product</th>
        <th class="bg-green-500 text-white p-3 text-left font-bold">Q1 Revenue</th>
        <th class="bg-green-500 text-white p-3 text-left font-bold">Q2 Revenue</th>
        <th class="bg-green-500 text-white p-3 text-left font-bold">Growth</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="px-3 py-2.5 border-b border-green-200">Enterprise Suite</td><td class="px-3 py-2.5 border-b border-green-200">$1,200,000</td><td class="px-3 py-2.5 border-b border-green-200">$1,450,000</td><td class="px-3 py-2.5 border-b border-green-200">+20.8%</td></tr>
      <tr><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">Cloud Services</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">$890,000</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">$1,100,000</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">+23.6%</td></tr>
      <tr><td class="px-3 py-2.5 border-b border-green-200">Support Packages</td><td class="px-3 py-2.5 border-b border-green-200">$450,000</td><td class="px-3 py-2.5 border-b border-green-200">$520,000</td><td class="px-3 py-2.5 border-b border-green-200">+15.5%</td></tr>
      <tr><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">Training Programs</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">$180,000</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">$210,000</td><td class="px-3 py-2.5 border-b border-green-200 bg-green-100">+16.7%</td></tr>
    </tbody>
  </table>
</div>
</SlideSection>

## 9. Border Styles

<SlideSection slide-id="slide-borders" description="Solid, dashed, dotted, double, and mixed borders." @generate="onGenerate">
<div class="slide bg-purple-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-purple-800">Border Variations</h2>
  <div class="flex flex-wrap gap-5">
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-solid border-violet-600">Solid Border</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-dashed border-violet-600">Dashed Border</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-dotted border-violet-600">Dotted Border</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-double border-violet-600">Double Border</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5 border-4 border-solid border-violet-600 rounded-2xl">Rounded Border</div>
    <div class="w-36 h-20 flex items-center justify-center text-xs text-center p-2.5" style="border-top: 4px solid #ef4444; border-right: 4px dashed #22c55e; border-bottom: 4px dotted #3b82f6; border-left: 4px double #eab308;">Mixed Borders</div>
  </div>
</div>
</SlideSection>

## 10. Nested Elements

<SlideSection slide-id="slide-nested" description="Nested containers with rgba opacity." @generate="onGenerate">
<div class="slide bg-gradient-to-br from-blue-900 to-slate-900 text-white">
  <h2 class="text-3xl m-0 mb-4">Deep Nesting Test</h2>
  <div class="bg-white/10 p-5 rounded-xl">
    <p>Container Level</p>
    <div class="bg-blue-400/30 p-4 rounded-lg mb-2.5">
      <p>Level 1 - Blue</p>
      <div class="bg-green-400/30 p-3 rounded-md mb-2">
        <p>Level 2 - Green</p>
        <div class="bg-yellow-400/30 p-2.5 rounded">
          <p>Level 3 - Yellow (deepest)</p>
        </div>
      </div>
    </div>
    <div class="flex gap-2.5 mt-2.5">
      <span class="bg-red-400/50 py-1 px-3 rounded-full text-xs">Badge 1</span>
      <span class="bg-red-400/50 py-1 px-3 rounded-full text-xs">Badge 2</span>
      <span class="bg-red-400/50 py-1 px-3 rounded-full text-xs">Badge 3</span>
    </div>
  </div>
</div>
</SlideSection>

## 11. Images & Object-Fit

<SlideSection slide-id="slide-images" description="Different `object-fit` values on images inside fixed-size containers." @generate="onGenerate">
<div class="slide bg-gray-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-slate-900">Image Object-Fit</h2>
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

## 12. Opacity & Transparency

<SlideSection slide-id="slide-opacity" description="CSS `opacity` property and `rgba()` background colors with overlapping elements." @generate="onGenerate">
<div class="slide bg-slate-800 text-white">
  <h2 class="text-3xl m-0 mb-5">Opacity & RGBA</h2>
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
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-0 top-0" style="background: rgba(59, 130, 246, 0.7);">Blue 0.7</div>
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-[120px] top-[15px]" style="background: rgba(34, 197, 94, 0.7);">Green 0.7</div>
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-[240px] top-[30px]" style="background: rgba(168, 85, 247, 0.7);">Purple 0.7</div>
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-[360px] top-[15px]" style="background: rgba(249, 115, 22, 0.7);">Orange 0.7</div>
    <div class="absolute w-[180px] h-20 rounded-lg flex items-center justify-center text-[13px] font-bold left-[480px] top-0" style="background: rgba(236, 72, 153, 0.7);">Pink 0.7</div>
  </div>
</div>
</SlideSection>

## 13. Font Families & Typography

<SlideSection slide-id="slide-fonts" description="Font families, type scale, weights, and line heights." @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">Typography Showcase</h2>
  <div class="mb-3">
    <h3 class="text-sm text-slate-500 m-0 mb-1.5 uppercase tracking-wider">Font Families</h3>
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
    <h3 class="text-sm text-slate-500 m-0 mb-1.5 uppercase tracking-wider">Type Scale</h3>
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
    <h3 class="text-sm text-slate-500 m-0 mb-1.5 uppercase tracking-wider">Font Weights</h3>
    <div class="flex gap-4">
      <span class="text-base font-normal">Normal (400)</span>
      <span class="text-base font-semibold">Semi-Bold (600)</span>
      <span class="text-base font-bold">Bold (700)</span>
      <span class="text-base font-black">Black (900)</span>
    </div>
  </div>
  <div class="mb-3">
    <h3 class="text-sm text-slate-500 m-0 mb-1.5 uppercase tracking-wider">Line Heights</h3>
    <div class="flex gap-4">
      <div class="w-[200px] px-2.5 py-1.5 bg-slate-100 rounded text-xs leading-none">Line-height: 1.0 — Text lines are tightly packed together.</div>
      <div class="w-[200px] px-2.5 py-1.5 bg-slate-100 rounded text-xs leading-normal">Line-height: 1.5 — Comfortable reading spacing for body text.</div>
      <div class="w-[200px] px-2.5 py-1.5 bg-slate-100 rounded text-xs leading-loose">Line-height: 2.0 — Double-spaced text with generous vertical room.</div>
    </div>
  </div>
</div>
</SlideSection>

## 14. Gradient Variations

<SlideSection slide-id="slide-gradients" description="Multiple gradient directions, multi-stop gradients, and gradient text." @generate="onGenerate">
<div class="slide bg-slate-900 text-white">
  <h2 class="text-3xl m-0 mb-4">Gradient Gallery</h2>
  <div class="grid grid-cols-3 gap-4">
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(to right, #f97316, #ec4899);">to right</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(to bottom, #3b82f6, #8b5cf6);">to bottom</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(45deg, #22c55e, #06b6d4);">45deg</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(90deg, #ef4444, #f59e0b, #22c55e);">3-stop (90deg)</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(180deg, #6366f1, #ec4899, #f97316);">3-stop (180deg)</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(270deg, #14b8a6, #3b82f6, #8b5cf6, #ec4899);">4-stop (270deg)</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(135deg, #f97316 0%, #f97316 33%, #3b82f6 33%, #3b82f6 66%, #22c55e 66%);">Hard stops</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(to right, #0f172a 0%, #3b82f6 30%, #22c55e 70%, #0f172a 100%);">% stops</div>
    <div class="h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f97316 100%);">Diagonal 3-stop</div>
  </div>
  <div class="mt-4 text-center">
    <span class="text-4xl font-black bg-clip-text" style="background: linear-gradient(90deg, #f97316, #ec4899, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Gradient Text Effect</span>
  </div>
</div>
</SlideSection>

## 15. Advanced Positioning

<SlideSection slide-id="slide-positioning" description="Absolute positioning inside relative containers, and a badge overlay on a card." @generate="onGenerate">
<div class="slide bg-amber-100 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-amber-800">CSS Positioning</h2>
  <div class="flex gap-8">
    <div>
      <p class="text-[13px] text-amber-800 m-0 mb-2">Absolute inside Relative:</p>
      <div class="relative w-[350px] h-[220px] bg-amber-200 border-2 border-amber-600 rounded-lg">
        <div class="absolute top-2.5 left-2.5 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-red-500">top-left</div>
        <div class="absolute top-2.5 right-2.5 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-blue-500">top-right</div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-amber-500 z-[2]">center</div>
        <div class="absolute bottom-2.5 left-2.5 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-green-500">bottom-left</div>
        <div class="absolute bottom-2.5 right-2.5 px-4 py-2.5 rounded-md text-xs font-bold text-white bg-purple-500">bottom-right</div>
      </div>
    </div>
    <div>
      <p class="text-[13px] text-amber-800 m-0 mb-2">Badge Overlay on Card:</p>
      <div class="relative w-[260px] bg-white rounded-xl overflow-hidden shadow-md">
        <div class="w-full h-[130px]" style="background: linear-gradient(135deg, #667eea, #764ba2);"></div>
        <div class="absolute top-2.5 right-2.5 bg-red-500 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold">NEW</div>
        <div class="p-4">
          <h4 class="m-0 mb-1.5 text-base">Product Card</h4>
          <p class="m-0 text-xs text-slate-500">A card with an absolutely positioned badge overlay in the top-right corner.</p>
        </div>
      </div>
    </div>
  </div>
</div>
</SlideSection>

## 16. Advanced List Styles

<SlideSection slide-id="slide-adv-lists" description="Various list-style-type values, nested lists, and spaced items." @generate="onGenerate">
<div class="slide bg-emerald-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-emerald-800">List Style Variations</h2>
  <div class="flex gap-8">
    <div class="flex-1">
      <h3 class="text-[15px] text-emerald-700 m-0 mb-2">Unordered Styles</h3>
      <ul class="m-0 mb-3 pl-6 list-disc">
        <li class="text-[13px] mb-1 text-slate-800">Disc style item 1</li>
        <li class="text-[13px] mb-1 text-slate-800">Disc style item 2</li>
      </ul>
      <ul class="m-0 mb-3 pl-6 list-[circle]">
        <li class="text-[13px] mb-1 text-slate-800">Circle style item 1</li>
        <li class="text-[13px] mb-1 text-slate-800">Circle style item 2</li>
      </ul>
      <ul class="m-0 mb-3 pl-6 list-[square]">
        <li class="text-[13px] mb-1 text-slate-800">Square style item 1</li>
        <li class="text-[13px] mb-1 text-slate-800">Square style item 2</li>
      </ul>
    </div>
    <div class="flex-1">
      <h3 class="text-[15px] text-emerald-700 m-0 mb-2">Ordered Styles</h3>
      <ol class="m-0 mb-3 pl-6 list-decimal">
        <li class="text-[13px] mb-1 text-slate-800">Decimal item one</li>
        <li class="text-[13px] mb-1 text-slate-800">Decimal item two</li>
        <li class="text-[13px] mb-1 text-slate-800">Decimal item three</li>
      </ol>
      <ol class="m-0 mb-3 pl-6 list-[decimal-leading-zero]">
        <li class="text-[13px] mb-1 text-slate-800">Leading-zero item</li>
        <li class="text-[13px] mb-1 text-slate-800">Leading-zero item</li>
        <li class="text-[13px] mb-1 text-slate-800">Leading-zero item</li>
      </ol>
    </div>
    <div class="flex-1">
      <h3 class="text-[15px] text-emerald-700 m-0 mb-2">Nested & Spaced</h3>
      <ul class="m-0 pl-6 list-disc">
        <li class="text-[13px] mb-1 text-slate-800">Top-level item
          <ul class="mt-1 pl-6 list-[circle]">
            <li class="text-[13px] mb-1 text-slate-800">Nested level 2
              <ul class="mt-1 pl-6 list-[square]">
                <li class="text-[13px] mb-1 text-slate-800">Nested level 3</li>
              </ul>
            </li>
          </ul>
        </li>
        <li class="text-[13px] mb-1 text-slate-800">Another top-level</li>
      </ul>
      <ul class="m-0 mt-3 pl-6 list-disc">
        <li class="text-[13px] py-1.5 border-b border-emerald-200 text-slate-800">Spaced item A</li>
        <li class="text-[13px] py-1.5 border-b border-emerald-200 text-slate-800">Spaced item B</li>
        <li class="text-[13px] py-1.5 border-b border-emerald-200 text-slate-800">Spaced item C</li>
      </ul>
    </div>
  </div>
</div>
</SlideSection>

## 17. Text Alignment

<SlideSection slide-id="slide-alignment" description="Explicit `text-align` left, center, and right comparison." @generate="onGenerate">
<div class="slide bg-indigo-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-indigo-800">Text Alignment</h2>
  <div class="flex gap-5">
    <div class="flex-1 bg-white p-5 rounded-lg border border-indigo-200">
      <h4 class="text-sm text-indigo-500 m-0 mb-3 uppercase tracking-wider">Left Aligned</h4>
      <p class="text-sm m-0 mb-2 text-left">This text is aligned to the left side of its container.</p>
      <p class="text-sm m-0 text-left">Second line also left aligned.</p>
    </div>
    <div class="flex-1 bg-white p-5 rounded-lg border border-indigo-200">
      <h4 class="text-sm text-indigo-500 m-0 mb-3 uppercase tracking-wider text-center">Center Aligned</h4>
      <p class="text-sm m-0 mb-2 text-center">This text is centered within its container.</p>
      <p class="text-sm m-0 text-center">Second line also centered.</p>
    </div>
    <div class="flex-1 bg-white p-5 rounded-lg border border-indigo-200">
      <h4 class="text-sm text-indigo-500 m-0 mb-3 uppercase tracking-wider text-right">Right Aligned</h4>
      <p class="text-sm m-0 mb-2 text-right">This text is aligned to the right side.</p>
      <p class="text-sm m-0 text-right">Second line also right aligned.</p>
    </div>
  </div>
  <div class="mt-5 bg-white p-4 rounded-lg border border-indigo-200">
    <p class="text-xs m-0 mb-1 text-left text-indigo-600">Left: Price list</p>
    <p class="text-xs m-0 mb-1 text-center text-indigo-600">Center: Total amount</p>
    <p class="text-xs m-0 text-right text-indigo-600">Right: $1,234.56</p>
  </div>
</div>
</SlideSection>

## 18. CJK Lists

<SlideSection slide-id="slide-cjk-lists" description="CJK (Chinese, Japanese, Korean) list numbering styles." @generate="onGenerate">
<div class="slide bg-rose-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-rose-800">CJK List Styles</h2>
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

## 19. Rounded Gradients

<SlideSection slide-id="slide-grad-round" description="Linear gradients with various border-radius values." @generate="onGenerate">
<div class="slide bg-slate-100 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">Rounded Gradients</h2>
  <div class="flex flex-wrap gap-5">
    <div class="w-40 h-24 rounded-none flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #667eea, #764ba2);">rounded-none</div>
    <div class="w-40 h-24 rounded-lg flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #f97316, #ec4899);">rounded-lg</div>
    <div class="w-40 h-24 rounded-2xl flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #22c55e, #06b6d4);">rounded-2xl</div>
    <div class="w-40 h-24 rounded-3xl flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);">rounded-3xl</div>
    <div class="w-40 h-24 rounded-full flex items-center justify-center text-white text-sm font-bold" style="background: linear-gradient(135deg, #ef4444, #f59e0b);">rounded-full</div>
  </div>
  <div class="mt-5 flex gap-5">
    <div class="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-xs font-bold text-center" style="background: linear-gradient(180deg, #0f172a, #3b82f6);">Vertical<br/>Gradient</div>
    <div class="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-xs font-bold text-center" style="background: linear-gradient(90deg, #22c55e, #16a34a);">Horizontal<br/>Gradient</div>
    <div class="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-xs font-bold text-center" style="background: linear-gradient(45deg, #ec4899, #f97316);">Diagonal<br/>Gradient</div>
    <div class="w-32 h-32 rounded-2xl flex items-center justify-center text-white text-xs font-bold text-center" style="background: linear-gradient(135deg, #8b5cf6, #06b6d4);">Diagonal<br/>Opposite</div>
  </div>
</div>
</SlideSection>

## 20. Gradient Opacity

<SlideSection slide-id="slide-grad-opacity" description="Semi-transparent gradients using rgba() and transparent keyword." @generate="onGenerate">
<div class="slide bg-slate-800 text-white">
  <h2 class="text-3xl m-0 mb-4">Gradient Opacity</h2>
  <div class="flex gap-4 mb-5">
    <div class="flex-1 h-24 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(to right, rgba(59, 130, 246, 1), rgba(59, 130, 246, 0));">rgba → transparent</div>
    <div class="flex-1 h-24 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(to right, rgba(239, 68, 68, 0.8), rgba(59, 130, 246, 0.8));">rgba to rgba</div>
    <div class="flex-1 h-24 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(to right, transparent, #22c55e);">transparent → solid</div>
  </div>
  <div class="relative h-32 rounded-xl overflow-hidden" style="background: linear-gradient(135deg, #1e293b, #334155);">
    <div class="absolute top-4 left-4 w-48 h-20 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.6));">Semi-transparent</div>
    <div class="absolute top-4 right-4 w-48 h-20 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.7), rgba(249, 115, 22, 0.7));">Pink → Orange</div>
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-20 rounded-lg flex items-center justify-center text-xs font-bold" style="background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.5), transparent);">Fade in/out</div>
  </div>
</div>
</SlideSection>

## 21. Visibility

<SlideSection slide-id="slide-visibility" description="Elements with `visibility: hidden` and `display: none` comparison." @generate="onGenerate">
<div class="slide bg-slate-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">Visibility vs Display</h2>
  <div class="flex gap-5">
    <div class="flex-1 bg-white p-4 rounded-lg border border-slate-200">
      <h3 class="text-base m-0 mb-3 text-slate-700">Normal (visible)</h3>
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
      <p class="text-xs text-slate-500 mt-2 m-0">Space is preserved</p>
    </div>
    <div class="flex-1 bg-white p-4 rounded-lg border border-slate-200">
      <h3 class="text-base m-0 mb-3 text-slate-700">display: none</h3>
      <div class="flex gap-2">
        <div class="w-12 h-12 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">A</div>
        <div class="w-12 h-12 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold hidden">B</div>
        <div class="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">C</div>
      </div>
      <p class="text-xs text-slate-500 mt-2 m-0">Space is removed</p>
    </div>
  </div>
</div>
</SlideSection>

## 22. Clip Text

<SlideSection slide-id="slide-clip-text" description="Text with `background-clip: text` for gradient text effects." @generate="onGenerate">
<div class="slide bg-slate-900 text-white">
  <h2 class="text-3xl m-0 mb-5">Background Clip Text</h2>
  <div class="text-center">
    <div class="text-6xl font-black mb-6 bg-clip-text" style="background: linear-gradient(90deg, #f97316, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Gradient Text</div>
    <div class="text-4xl font-bold mb-6 bg-clip-text" style="background: linear-gradient(135deg, #22c55e, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Multi-Color Gradient</div>
    <div class="text-3xl font-bold bg-clip-text" style="background: linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Rainbow Effect</div>
  </div>
</div>
</SlideSection>

## 23. URL Images

<SlideSection slide-id="slide-url-images" description="Images loaded from URL via `data-file` attribute." @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-slate-900">URL-Based Images</h2>
  <div class="flex gap-8 items-center justify-center">
    <div class="text-center">
      <img class="url-img w-32 h-32 object-contain mx-auto mb-3" data-file="sample-icon.svg" alt="Icon">
      <p class="text-sm text-slate-500 m-0">Icon (SVG)</p>
    </div>
    <div class="text-center">
      <img class="url-img w-48 h-32 object-cover mx-auto mb-3 rounded-lg" data-file="sample-chart.svg" alt="Chart">
      <p class="text-sm text-slate-500 m-0">Chart (SVG)</p>
    </div>
  </div>
  <p class="text-center text-xs text-slate-400 mt-5 m-0">Images are loaded via `withBase()` for correct path resolution in VitePress.</p>
</div>
</SlideSection>

## 24. Rotate Transform

<SlideSection slide-id="slide-rotate" description="Elements with CSS transform rotate." @generate="onGenerate">
<div class="slide bg-gradient-to-br from-indigo-100 to-purple-100 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">Rotate Transform</h2>
  <div class="flex gap-6 items-center justify-center flex-wrap">
    <div class="w-24 h-24 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">No Rotate</div>
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

## 25. Box Shadow

<SlideSection slide-id="slide-box-shadow" description="Various box-shadow effects." @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-5 text-slate-900">Box Shadow</h2>
  <div class="flex flex-wrap gap-6 items-center justify-center">
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-sm">shadow-sm</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow">shadow</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-md">shadow-md</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-lg">shadow-lg</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-xl">shadow-xl</div>
    <div class="w-36 h-24 bg-white rounded-lg flex items-center justify-center text-xs text-slate-600 shadow-2xl">shadow-2xl</div>
  </div>
  <div class="mt-6 flex flex-wrap gap-6 items-center justify-center">
    <div class="w-36 h-24 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-white" style="box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);">Glow Blue</div>
    <div class="w-36 h-24 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-white" style="box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);">Glow Red</div>
    <div class="w-36 h-24 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-white" style="box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);">Glow Green</div>
  </div>
</div>
</SlideSection>

## 26. Clip Path

<SlideSection slide-id="slide-clip-path" description="Elements clipped with various CSS clip-path shapes." @generate="onGenerate">
<div class="slide bg-slate-100 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">Clip Path</h2>
  <div class="flex flex-wrap gap-5 items-center justify-center">
    <div class="w-28 h-28 bg-blue-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: circle(50%);">circle</div>
    <div class="w-28 h-28 bg-green-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: ellipse(70% 50% at 50% 50%);">ellipse</div>
    <div class="w-28 h-28 bg-orange-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: polygon(50% 0%, 100% 100%, 0% 100%);">triangle</div>
    <div class="w-28 h-28 bg-purple-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);">hexagon</div>
    <div class="w-28 h-28 bg-red-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);">star</div>
    <div class="w-28 h-28 bg-cyan-500 flex items-center justify-center text-white text-xs font-bold" style="clip-path: inset(10px 20px 10px 20px round 10px);">inset</div>
  </div>
</div>
</SlideSection>

## 27. Canvas Element

<SlideSection slide-id="slide-canvas" description="HTML `<canvas>` with programmatic 2D drawing — bar chart with labels." @generate="onGenerate">
<div class="slide bg-white text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">Canvas Drawing</h2>
  <div class="flex gap-6 items-start">
    <div class="flex-[2]">
      <canvas id="demo-canvas" width="500" height="280" class="rounded-lg border border-slate-200" style="width: 500px; height: 280px;"></canvas>
    </div>
    <div class="flex-1">
      <h3 class="text-base m-0 mb-3 text-slate-700">Chart Legend</h3>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-blue-500"></div><span class="text-xs text-slate-600">January</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-green-500"></div><span class="text-xs text-slate-600">February</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-orange-500"></div><span class="text-xs text-slate-600">March</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-purple-500"></div><span class="text-xs text-slate-600">April</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-pink-500"></div><span class="text-xs text-slate-600">May</span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-sm bg-cyan-500"></div><span class="text-xs text-slate-600">June</span></div>
      </div>
      <p class="text-xs text-slate-400 mt-4 m-0">Canvas content is rasterized as an image in the PPTX output.</p>
    </div>
  </div>
</div>
</SlideSection>

## 28. Form Inputs

<SlideSection slide-id="slide-form-inputs" description="Native HTML form elements — text inputs, textarea, select, checkboxes, radios, and buttons." @generate="onGenerate">
<div class="slide bg-slate-50 text-slate-800">
  <h2 class="text-3xl m-0 mb-4 text-slate-900">Form Elements</h2>
  <div class="flex gap-6">
    <div class="flex-1">
      <h3 class="text-sm text-slate-500 m-0 mb-2 uppercase tracking-wider">Text Inputs</h3>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">Username</label>
        <input type="text" value="john_doe" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">Email</label>
        <input type="email" value="john@example.com" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">Password</label>
        <input type="password" value="secret123" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">Message</label>
        <textarea class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800 resize-none" rows="2">Hello, this is a sample message in a textarea element.</textarea>
      </div>
    </div>
    <div class="flex-1">
      <h3 class="text-sm text-slate-500 m-0 mb-2 uppercase tracking-wider">Selection Controls</h3>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">Country</label>
        <select class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
          <option selected>United States</option>
          <option>Japan</option>
          <option>Germany</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1.5">Preferences</label>
        <div class="flex flex-col gap-1.5">
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked class="w-4 h-4"> Email notifications</label>
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" class="w-4 h-4"> SMS alerts</label>
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked class="w-4 h-4"> Weekly digest</label>
        </div>
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1.5">Plan</label>
        <div class="flex flex-col gap-1.5">
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="plan" class="w-4 h-4"> Free</label>
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="plan" checked class="w-4 h-4"> Pro</label>
          <label class="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="plan" class="w-4 h-4"> Enterprise</label>
        </div>
      </div>
    </div>
    <div class="flex-1">
      <h3 class="text-sm text-slate-500 m-0 mb-2 uppercase tracking-wider">Buttons &amp; Placeholder</h3>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">Search (placeholder)</label>
        <input type="text" placeholder="Type to search..." class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800">
      </div>
      <div class="mb-3">
        <label class="block text-xs text-slate-600 mb-1">Disabled Input</label>
        <input type="text" value="Cannot edit" disabled class="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-100 text-slate-400">
      </div>
      <div class="flex gap-2 mt-5">
        <button class="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md border-0">Submit</button>
        <button class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md">Cancel</button>
        <button class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md border-0" disabled>Disabled</button>
      </div>
    </div>
  </div>
</div>
</SlideSection>

## 29. Multi-Slide Demo

Creating a multi-slide presentation from an array of elements — each element becomes its own slide.

<div class="slide-section">
<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; max-width: 100%;">
  <div style="width: 300px; height: 180px; overflow: hidden;">
    <div id="slide-multi-1" style="transform: scale(0.3125); transform-origin: top left; width:960px;height:540px" class="slide bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col items-center justify-center text-center">
      <h2 class="text-5xl font-extrabold m-0 mb-4">Slide 1</h2>
      <p class="text-xl m-0 text-white/80">Introduction slide with gradient background</p>
    </div>
  </div>
  <div style="width: 300px; height: 180px; overflow: hidden;">
    <div id="slide-multi-2" style="transform: scale(0.3125); transform-origin: top left; width:960px;height:540px" class="slide bg-white text-slate-800 flex flex-col justify-center">
      <h2 class="text-4xl font-bold m-0 mb-6 text-slate-900">Slide 2: Content</h2>
      <div class="flex gap-5">
        <div class="flex-1 bg-blue-50 p-4 rounded-lg">
          <h3 class="text-lg m-0 mb-2 text-blue-700">Point A</h3>
          <p class="text-sm m-0 text-slate-600">First key point of the presentation.</p>
        </div>
        <div class="flex-1 bg-emerald-50 p-4 rounded-lg">
          <h3 class="text-lg m-0 mb-2 text-emerald-700">Point B</h3>
          <p class="text-sm m-0 text-slate-600">Second key point with supporting details.</p>
        </div>
      </div>
    </div>
  </div>
  <div style="width: 300px; height: 180px; overflow: hidden;">
    <div id="slide-multi-3" style="transform: scale(0.3125); transform-origin: top left; width:960px;height:540px" class="slide bg-slate-900 text-white flex flex-col items-center justify-center text-center">
      <h2 class="text-5xl font-extrabold m-0 mb-4">Thank You</h2>
      <p class="text-xl m-0 text-slate-400">Closing slide with dark theme</p>
    </div>
  </div>
</div>
</div>

<div class="flex justify-center my-4">
  <button class="gen-btn" :disabled="isConverting?.value" @click="onGenerateMulti">Generate Multi-Slide PPTX (3 slides)</button>
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