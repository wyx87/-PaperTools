import { useState, useRef, useCallback, useEffect } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import { Download, ClipboardCopy, RotateCcw } from 'lucide-react'
import mermaid from 'mermaid'

// ════════════════════════════════════════
// 高清常数：2倍像素密度，解决 PNG 模糊
// ════════════════════════════════════════
const SCALE_RATIO = 2

// ════════════════════════════════════════
// 默认示例（多级结构，无 class 绑定）
// ════════════════════════════════════════
const DEFAULT_CODE = `mindmap
  root((论文选题))
    研究背景
      理论基础
      文献综述
    研究意义
      理论意义
      实践意义
    研究方法
      文献研究法
      实验分析法
    预期成果
      学术论文
      系统原型
    进度安排
      第一阶段
      第二阶段
      第三阶段`

// ════════════════════════════════════════
// svg → png dataURL（高清渲染，修复 1/4 截图 bug）
// 根因：Mermaid SVG 带 style="max-width:100%" 导致序列化后内在尺寸偏小
// 修复：克隆 SVG → 用 getBoundingClientRect 取真实尺寸 → 设死 px 宽高 → 再转 PNG
// ════════════════════════════════════════
function svgToPngDataUrl(svgElement) {
  return new Promise((resolve) => {
    // 从 DOM 获取真实渲染尺寸（不受 CSS max-width 影响）
    const rect = svgElement.getBoundingClientRect()
    const w = Math.round(rect.width) || 800
    const h = Math.round(rect.height) || 600

    // 克隆并清洗 SVG：设死 px 宽高，去掉干扰尺寸的 style 属性
    const clone = svgElement.cloneNode(true)
    clone.setAttribute('width', `${w}`)
    clone.setAttribute('height', `${h}`)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.removeAttribute('style')

    const svgData = new XMLSerializer().serializeToString(clone)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      // 2倍高清画布
      canvas.width = w * SCALE_RATIO
      canvas.height = h * SCALE_RATIO
      ctx.scale(SCALE_RATIO, SCALE_RATIO)
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  })
}

export default function MindmapPage() {
  const [bgColor, setBgColor] = useState('#547259')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [fontSize, setFontSize] = useState(15)
  const [spacing, setSpacing] = useState(20)
  const [code, setCode] = useState(DEFAULT_CODE)
  const [copied, setCopied] = useState(false)
  const [copyingSvg, setCopyingSvg] = useState(false)
  const [copyingPng, setCopyingPng] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  // ── 渲染 ──
  const renderDiagram = useCallback(async () => {
    if (!containerRef.current) return
    const trimmed = code.trim()
    if (!trimmed) return
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        themeVariables: {
          primaryColor: bgColor,
          primaryTextColor: textColor,
          primaryBorderColor: bgColor,
          secondaryColor: bgColor,
          secondaryTextColor: textColor,
          tertiaryColor: bgColor,
          tertiaryTextColor: textColor,
          lineColor: '#667769',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: `${fontSize}px`,
        },
        mindmap: { padding: Math.round(spacing / 3), useMaxWidth: true },
      })

      const id = `mm-${Date.now()}`
      const { svg } = await mermaid.render(id, trimmed)
      containerRef.current.innerHTML = svg

      const svgEl = containerRef.current.querySelector('svg')
      if (svgEl) {
        svgEl.style.maxWidth = '100%'
        svgEl.style.height = 'auto'
      }
      setError('')
    } catch (e) {
      const msg = e.message || ''
      const lineMatch = msg.match(/line\s+(\d+)/i)
      let friendly = msg
      if (lineMatch) friendly = `第 ${lineMatch[1]} 行附近语法错误，请检查缩进和括号匹配`
      else if (msg.includes('Parse')) friendly = '语法解析错误，请检查 Mermaid mindmap 代码格式'
      setError(friendly)
      containerRef.current.innerHTML = `<div class="text-red-600 text-xs p-4 bg-red-50 rounded-lg">⚠ ${friendly}</div>`
    }
  }, [code, bgColor, textColor, fontSize, spacing])

  useEffect(() => { renderDiagram() }, [renderDiagram])

  // ── 重置 ──
  const handleReset = useCallback(() => {
    setBgColor('#547259')
    setTextColor('#FFFFFF')
    setFontSize(15)
    setSpacing(20)
    setCode(DEFAULT_CODE)
  }, [])

  // ── 复制 SVG（带白色底板，防止 Word 中文字透明消失）──
  const handleCopySVG = useCallback(async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) { alert('没有可复制的导图'); return }
    setCopyingSvg(true)
    try {
      // 克隆并添加白色背景底板
      const clone = svg.cloneNode(true)
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('width', '100%')
      rect.setAttribute('height', '100%')
      rect.setAttribute('fill', '#ffffff')
      clone.insertBefore(rect, clone.firstChild)

      const svgData = new XMLSerializer().serializeToString(clone)
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setCopyingSvg(false); setCopied(true); setTimeout(() => setCopied(false), 1500)
    } catch (e) { alert('复制失败，请使用「复制 PNG」按钮'); setCopyingSvg(false) }
  }, [])

  // ── 复制 PNG ──
  const handleCopyPNG = useCallback(async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) { alert('没有可复制的导图'); return }
    setCopyingPng(true)
    try {
      const dataUrl = await svgToPngDataUrl(svg)
      const resp = await fetch(dataUrl)
      const blob = await resp.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setCopyingPng(false); setCopied(true); setTimeout(() => setCopied(false), 1500)
    } catch (e) { alert('复制失败，请尝试下载 PNG'); setCopyingPng(false) }
  }, [])

  // ── 下载 PNG ──
  const handleDownloadPng = useCallback(async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    const dataUrl = await svgToPngDataUrl(svg)
    const a = document.createElement('a'); a.href = dataUrl; a.download = 'mindmap.png'; a.click()
  }, [])

  return (
    <ChartPageLayout title="思维导图生成器" breadcrumb="思维导图">
      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── Left: 控制区 ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">

          {/* Mermaid 代码编辑 */}
          <div>
            <label className="text-xs font-semibold text-[#1E3A5F] block mb-1.5">
              ✏️ Mermaid 代码（支持多级）
            </label>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full h-56 text-xs font-mono p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] outline-none resize-y leading-relaxed"
              spellCheck={false}
            />
            <button
              onClick={handleReset}
              className="mt-2 px-3 py-1.5 text-[11px] rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 font-medium flex items-center gap-1"
            >
              <RotateCcw size={11} />重置为示例
            </button>
          </div>

          {/* 节点背景颜色 */}
          <div>
            <label className="text-xs font-semibold text-[#1E3A5F] block mb-1.5">
              🎨 节点背景颜色
            </label>
            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="w-10 h-8 border border-gray-200 rounded cursor-pointer p-0"
              />
              <span className="text-xs font-mono">{bgColor}</span>
            </div>
          </div>

          {/* 文字颜色（按钮切换） */}
          <div>
            <label className="text-xs font-semibold text-[#1E3A5F] block mb-1.5">
              🔤 文字颜色
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTextColor('#000000')}
                className={`px-3 py-1.5 text-[11px] rounded-md font-medium border transition-colors ${
                  textColor === '#000000'
                    ? 'border-[#1E3A5F] bg-[#1E3A5F]/8 text-[#1E3A5F]'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                黑色文字
              </button>
              <button
                onClick={() => setTextColor('#FFFFFF')}
                className={`px-3 py-1.5 text-[11px] rounded-md font-medium border transition-colors ${
                  textColor === '#FFFFFF'
                    ? 'border-[#1E3A5F] bg-[#1E3A5F]/8 text-[#1E3A5F]'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                白色文字
              </button>
            </div>
          </div>

          {/* 字号 + 间距 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="flex-shrink-0">字号</span>
              <input type="range" min="12" max="24" step="1" value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="flex-1 h-1 accent-[#1E3A5F]" />
              <span className="w-7 text-right font-mono text-[#1E3A5F] text-[10px]">{fontSize}px</span>
            </div>
            <div className="flex-1 flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="flex-shrink-0">间距</span>
              <input type="range" min="10" max="50" step="2" value={spacing}
                onChange={e => setSpacing(Number(e.target.value))}
                className="flex-1 h-1 accent-[#1E3A5F]" />
              <span className="w-7 text-right font-mono text-[#1E3A5F] text-[10px]">{spacing}px</span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 复制/下载 — PNG 推荐（粘贴 Word 清晰可见） */}
          <div className="space-y-2">
            <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
              💡 推荐：点击「复制 PNG」粘贴到 Word 中，背景和文字均清晰可见
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopyPNG}
                className={`px-3 py-1.5 text-[11px] rounded-md font-medium flex items-center gap-1 transition-colors ${
                  copyingPng ? 'bg-green-100 text-green-700' : 'bg-[#F59E0B] text-white hover:bg-[#D97706]'
                }`}
              >
                ★ {copyingPng ? '复制中...' : '复制 PNG（推荐）'}
              </button>
              <button
                onClick={handleCopySVG}
                className={`px-3 py-1.5 text-[11px] rounded-md font-medium flex items-center gap-1 transition-colors ${
                  copyingSvg || copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ClipboardCopy size={11} />{copyingSvg ? '复制中...' : copied ? '已复制' : '复制 SVG'}
              </button>
              <button
                onClick={handleDownloadPng}
                className="px-3 py-1.5 text-[11px] rounded-md bg-[#3B82F6] text-white hover:bg-[#2563EB] font-medium flex items-center gap-1"
              >
                <Download size={11} />下载 PNG
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: 预览 ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">🔍 实时预览</h3>
          <div
            ref={containerRef}
            className="flex items-center justify-center min-h-[350px] bg-gray-50 rounded-lg p-4 overflow-auto border border-gray-100"
          />
          {error && (
            <p className="mt-2 text-[11px] text-red-600 flex items-start gap-1">
              <span>⚠</span>{error}
            </p>
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="mt-4 p-3 bg-[#1E3A5F]/5 rounded-lg">
        <p className="text-[11px] text-[#6B7280]">
          所有处理均在浏览器本地完成。使用 Mermaid mindmap 语法编辑，所有节点统一使用同一个背景色和文字色。
        </p>
        <p className="text-[11px] text-[#6B7280] mt-1">
          💡 操作提示：强烈推荐使用「复制 PNG」粘贴到 Word，确保背景和文字均清晰可见。SVG 粘贴后如需编辑，选中图片 → 右键「编辑图片」→「转换为形状」（仅限 Word 2016+）。
        </p>
      </div>
    </ChartPageLayout>
  )
}
