import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import { ClipboardCopy, Download, Trash2, BookOpen } from 'lucide-react'
import mermaid from 'mermaid'

// ==================== 初始化 Mermaid ====================
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'base',
  themeVariables: {
    primaryColor: '#EBF5FF',
    primaryTextColor: '#1E3A5F',
    primaryBorderColor: '#93C5FD',
    lineColor: '#93C5FD',
    secondaryColor: '#DBEAFE',
    tertiaryColor: '#F0F9FF',
    fontSize: '15px',
    fontFamily: '"Inter",system-ui,sans-serif',
  },
})

// ==================== 示例文本 ====================
const EXAMPLE_TEXT = `研究背景
  国内外研究现状
    方法A
    方法B
  研究意义
研究方法
  数据采集
  数据分析
  实验设计`

// ==================== 流向定义 ====================
const DIRECTIONS = [
  { id: 'TD', name: '竖向（上→下）', icon: '⬇', preview: 'vertical' },
  { id: 'LR', name: '横向（左→右）', icon: '➡', preview: 'horizontal' },
]

// ==================== 样式定义（4 种论文级专业风格） ====================
const STYLES = [
  { id: 'minimal',       name: '极简灰',  emoji: '⬜', shape: 'rect',    primary: '#F9FAFB', text: '#374151', border: '#9CA3AF', line: '#D1D5DB' },
  { id: 'academic-blue', name: '学术蓝',  emoji: '📘', shape: 'rect',    primary: '#EEF2F7', text: '#1E3A5F', border: '#5B7FA5', line: '#8FA8C8' },
  { id: 'print-bw',      name: '经典黑白', emoji: '📄', shape: 'rect',    primary: '#FFFFFF', text: '#1F2937', border: '#4B5563', line: '#9CA3AF' },
  { id: 'dark',          name: '深色风',  emoji: '🌑', shape: 'rect',    primary: '#1E293B', text: '#E2E8F0', border: '#475569', line: '#64748B' },
]

// ==================== 辅助函数 ====================
function esc(s) {
  return (s || '未填写').replace(/"/g, '#quot;')
}

function svgToPngDataUrl(svgElement) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const rect = svgElement.getBoundingClientRect()
    canvas.width = Math.max(rect.width, 600) * 2
    canvas.height = Math.max(rect.height, 300) * 2
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const img = new Image()
    const svgData = new XMLSerializer().serializeToString(svgElement)
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  })
}

function getShapeBrackets(shape) {
  switch (shape) {
    case 'rect':    return ['["', '"]']
    case 'rounded': return ['("', '")']
    case 'circle':  return ['(("', '"))']
    case 'diamond': return ['{"', '"}']
    case 'hexagon': return ['{{"', '"}}']
    default:        return ['["', '"]']
  }
}

// ==================== 解析缩进文本 ====================
function parseIndentText(text) {
  const lines = text.split('\n')
  const rawLines = []
  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (trimmed === '') continue
    const leadingSpaces = trimmed.match(/^(\s*)/)[1].length
    if (leadingSpaces % 2 !== 0) {
      return { error: `缩进格式错误：第 ${rawLines.length + 1} 行空格数 (${leadingSpaces}) 不是 2 的倍数。` }
    }
    const level = leadingSpaces / 2
    const content = trimmed.trim()
    if (!content) continue
    rawLines.push({ level, content })
  }
  if (rawLines.length === 0) return { nodes: [], edges: [] }

  const nodes = []
  const edges = []
  const stack = []

  // 检查是否所有节点都在同一层级（纯平铺）
  const allSameLevel = rawLines.every(r => r.level === rawLines[0].level)

  for (let i = 0; i < rawLines.length; i++) {
    const { level, content } = rawLines[i]
    // 缩进跳级检查（仅在有缩进层级时生效，纯平铺跳过）
    if (!allSameLevel && i > 0 && level > 0 && level > rawLines[i - 1].level + 1) {
      return { error: `缩进跳级错误：第 ${i + 1} 行 "${content}" 缩进 (${level}级) 超过上一行 (${rawLines[i - 1].level}级) 超过 1 级。` }
    }
    const id = `n${i}`
    nodes.push({ id, text: content, level })

    // 纯平铺模式：直接跳过 stack 逻辑，后面统一串联
    if (allSameLevel) continue

    // 有层级的模式：正常父子关系
    while (stack.length > 0 && stack[stack.length - 1].level >= level) stack.pop()
    if (stack.length > 0) {
      const parent = stack[stack.length - 1]
      edges.push({ parentId: parent.id, childId: id })
    }
    stack.push({ level, id })
  }

  // 平铺节点：按输入顺序串联成线性流程图 A --> B --> C
  if (allSameLevel && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ parentId: nodes[i].id, childId: nodes[i + 1].id })
    }
  }

  return { nodes, edges }
}

// ==================== 生成 Mermaid 代码（带样式） ====================
function generateMermaidCode(nodes, edges, style, direction) {
  if (nodes.length === 0) return ''
  const lines = []

  // 每种样式覆盖主题变量
  lines.push(`%%{init: {"theme": "base", "themeVariables": {"primaryColor": "${style.primary}", "primaryTextColor": "${style.text}", "primaryBorderColor": "${style.border}", "lineColor": "${style.line}"}}}%%`)
  lines.push(`graph ${direction}`)

  const [open, close] = getShapeBrackets(style.shape)

  for (const edge of edges) {
    const pNode = nodes.find(n => n.id === edge.parentId)
    const cNode = nodes.find(n => n.id === edge.childId)
    if (pNode && cNode) {
      lines.push(`  ${edge.parentId}${open}${esc(pNode.text)}${close} --> ${edge.childId}${open}${esc(cNode.text)}${close}`)
    }
  }

  const connectedIds = new Set()
  edges.forEach(e => { connectedIds.add(e.parentId); connectedIds.add(e.childId) })
  for (const node of nodes) {
    if (!connectedIds.has(node.id)) {
      lines.push(`  ${node.id}${open}${esc(node.text)}${close}`)
    }
  }
  return lines.join('\n')
}

// ==================== 组件 ====================
export default function FlowchartPage() {
  const [text, setText] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('minimal')
  const [direction, setDirection] = useState('TD')
  const previewRef = useRef(null)
  const renderIdRef = useRef(0)
  const [copied, setCopied] = useState(false)
  const [copyingSvg, setCopyingSvg] = useState(false)
  const [copyingPng, setCopyingPng] = useState(false)

  const parsed = useMemo(() => parseIndentText(text), [text])
  const style = useMemo(() => STYLES.find(s => s.id === selectedStyle) || STYLES[0], [selectedStyle])

  const mermaidCode = useMemo(() => {
    if (parsed.error || !parsed.nodes) return ''
    return generateMermaidCode(parsed.nodes, parsed.edges, style, direction)
  }, [parsed, style, direction])

  // ============ 渲染 Mermaid ============
  useEffect(() => {
    if (!previewRef.current) return
    const container = previewRef.current
    const rid = ++renderIdRef.current

    if (!mermaidCode || parsed.error) {
      container.innerHTML = ''
      return
    }

    const doRender = async () => {
      try {
        const { svg } = await mermaid.render(`fc-${rid}`, mermaidCode)
        if (rid === renderIdRef.current) {
          container.innerHTML = svg
        }
      } catch (e) {
        if (rid === renderIdRef.current) {
          container.innerHTML = `<div class="flex items-center justify-center h-full text-sm text-amber-600">⚠ 渲染失败：${(e.message || '').slice(0, 80)}</div>`
        }
      }
    }
    doRender()
  }, [mermaidCode, parsed.error])

  // ============ 导出 ============
  const handleDownloadPNG = useCallback(async () => {
    const svgEl = previewRef.current?.querySelector('svg')
    if (!svgEl) return
    const dataUrl = await svgToPngDataUrl(svgEl)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'flowchart.png'
    a.click()
  }, [])

  const handleCopySVG = useCallback(async () => {
    const svgEl = previewRef.current?.querySelector('svg')
    if (!svgEl) { alert('未找到可复制的流程图'); return }
    setCopyingSvg(true)
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl)
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setCopyingSvg(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      alert('复制失败，请右键手动复制')
      setCopyingSvg(false)
    }
  }, [])

  const handleCopyPNG = useCallback(async () => {
    const svgEl = previewRef.current?.querySelector('svg')
    if (!svgEl) { alert('未找到可复制的流程图'); return }
    setCopyingPng(true)
    try {
      const dataUrl = await svgToPngDataUrl(svgEl)
      const resp = await fetch(dataUrl)
      const blob = await resp.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setCopyingPng(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      alert('复制失败，请下载 PNG 或右键手动复制')
      setCopyingPng(false)
    }
  }, [])

  const handleExample = () => setText(EXAMPLE_TEXT)
  const handleClear = () => setText('')
  const hasContent = text.trim().length > 0
  const hasError = !!parsed.error
  const hasPreview = !hasError && parsed.nodes && parsed.nodes.length > 0

  return (
    <ChartPageLayout title="流程图生成器" breadcrumb="流程图">
      {/* 说明 */}
      <div className="mb-4 p-3 bg-gradient-to-r from-[#EBF5FF] to-[#F0F9FF] border border-[#BFDBFE] rounded-xl">
        <p className="text-xs text-[#64748B]">
          使用空格缩进表示层级（每 2 个空格为一级），选择下方样式切换视觉效果，点击「加载示例」快速体验。
        </p>
      </div>

      {/* ===== 方向选择器 ===== */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-[#1E3A5F] mb-2 block">流程图方向</label>
        <div className="flex flex-wrap gap-2">
          {DIRECTIONS.map(d => (
            <button
              key={d.id}
              onClick={() => setDirection(d.id)}
              className={`px-3 py-2 rounded-lg border-2 transition-all text-center min-w-[100px] ${
                direction === d.id
                  ? 'border-[#3B82F6] bg-[#EBF5FF] shadow-sm'
                  : 'border-gray-150 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* 迷你方向预览 */}
              <div className="flex items-center justify-center gap-0.5 mb-1">
                {d.preview === 'vertical' ? (
                  <div className="flex flex-col items-center gap-px">
                    <div className="w-3 h-1.5 rounded-[1px]" style={{ background: '#93C5FD' }} />
                    <div className="w-px h-2" style={{ background: '#93C5FD' }} />
                    <div className="w-3 h-1.5 rounded-[1px]" style={{ background: '#93C5FD' }} />
                    <div className="w-px h-2" style={{ background: '#93C5FD' }} />
                    <div className="w-3 h-1.5 rounded-[1px]" style={{ background: '#93C5FD' }} />
                  </div>
                ) : (
                  <div className="flex items-center gap-px">
                    <div className="w-1.5 h-3 rounded-[1px]" style={{ background: '#93C5FD' }} />
                    <div className="w-2 h-px" style={{ background: '#93C5FD' }} />
                    <div className="w-1.5 h-3 rounded-[1px]" style={{ background: '#93C5FD' }} />
                    <div className="w-2 h-px" style={{ background: '#93C5FD' }} />
                    <div className="w-1.5 h-3 rounded-[1px]" style={{ background: '#93C5FD' }} />
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${direction === d.id ? 'text-[#1E40AF]' : 'text-gray-600'}`}>
                {d.icon} {d.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 样式选择器 ===== */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-[#1E3A5F] mb-2 block">流程图样式</label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStyle(s.id)}
              className={`px-3 py-2 rounded-lg border-2 transition-all text-center min-w-[72px] ${
                selectedStyle === s.id
                  ? 'border-[#3B82F6] bg-[#EBF5FF] shadow-sm'
                  : 'border-gray-150 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* 迷你预览：3 个色块 + 连线 */}
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <div className="w-3.5 h-2 rounded-[2px]" style={{ background: s.border }} />
                <div className="w-2.5 h-px" style={{ background: s.line }} />
                <div className="w-3.5 h-2 rounded-[2px]" style={{ background: s.border }} />
                <div className="w-2.5 h-px" style={{ background: s.line }} />
                <div className="w-3.5 h-2 rounded-[2px]" style={{ background: s.border }} />
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${selectedStyle === s.id ? 'text-[#1E40AF]' : 'text-gray-600'}`}>
                {s.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 主体：左侧输入 + 右侧预览 ===== */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 左侧：文本框 */}
        <div className="lg:w-[45%] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#1E3A5F]">大纲输入</label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExample}
                className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-[#1E3A5F] text-white hover:bg-[#152E4A] flex items-center gap-1 transition-colors"
              >
                <BookOpen size={11} />
                加载示例
              </button>
              <button
                onClick={handleClear}
                disabled={!hasContent}
                className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={11} />
                清空
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full h-[500px] text-sm font-mono p-4 border border-gray-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-[#93C5FD] focus:border-[#93C5FD] leading-relaxed bg-white"
            placeholder={`研究背景\n  国内外研究现状\n    方法A\n    方法B\n  研究意义\n研究方法\n  数据采集\n  数据分析\n  实验设计`}
            spellCheck={false}
          />
          {hasError && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700 flex items-start gap-1.5">
              <span className="flex-shrink-0">⚠</span>
              <span>{parsed.error}</span>
            </div>
          )}
        </div>

        {/* 右侧：预览 + 导出按钮 */}
        <div className="lg:w-[55%] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#1E3A5F]">
              实时预览
              <span className="ml-2 text-[10px] font-normal text-gray-400">{STYLES.find(s => s.id === selectedStyle)?.emoji} {STYLES.find(s => s.id === selectedStyle)?.name}</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopySVG}
                disabled={!hasPreview}
                className={`px-2.5 py-1 text-[11px] rounded-md font-medium flex items-center gap-1 transition-colors ${
                  copyingSvg || copied ? 'bg-green-100 text-green-700' : 'bg-[#1E3A5F] text-white hover:bg-[#152E4A] disabled:opacity-40'
                }`}
              >
                <ClipboardCopy size={11} />
                {copyingSvg ? '复制中…' : copied ? '已复制' : '复制 SVG'}
              </button>
              <button
                onClick={handleCopyPNG}
                disabled={!hasPreview}
                className={`px-2.5 py-1 text-[11px] rounded-md font-medium flex items-center gap-1 transition-colors ${
                  copyingPng ? 'bg-green-100 text-green-700' : 'bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:opacity-40'
                }`}
              >
                <ClipboardCopy size={11} />
                {copyingPng ? '复制中…' : '复制 PNG'}
              </button>
              <button
                onClick={handleDownloadPNG}
                disabled={!hasPreview}
                className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                <Download size={11} />
                下载 PNG
              </button>
            </div>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden min-h-[500px] flex items-center justify-center">
            {hasError ? (
              <div className="text-center p-6">
                <p className="text-sm text-gray-400">⚠ 请修正左侧的缩进错误</p>
              </div>
            ) : !hasContent ? (
              <div className="text-center p-6">
                <p className="text-sm text-gray-400">在左侧输入大纲文本，流程图将在此实时生成</p>
              </div>
            ) : !hasPreview ? (
              <div className="text-center p-6">
                <div className="w-6 h-6 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">正在生成…</p>
              </div>
            ) : (
              <div ref={previewRef} className="w-full h-full flex items-center justify-center p-4 overflow-auto" />
            )}
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="mt-4 p-3.5 bg-[#1E3A5F]/5 rounded-lg">
        <p className="text-[11px] text-[#6B7280]">
          💡 操作提示：左侧用空格缩进组织大纲，选择样式切换视觉效果。复制 SVG 后粘贴到 Word 中可右键「转换为形状」编辑。
        </p>
        <p className="text-[11px] text-[#6B7280] mt-1">
          🔒 所有处理均在浏览器本地完成，数据不会上传到任何服务器。
        </p>
      </div>
    </ChartPageLayout>
  )
}
