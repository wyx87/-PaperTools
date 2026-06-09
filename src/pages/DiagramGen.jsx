import { useState, useEffect, useRef, useCallback } from 'react'
import { GitBranch, Download, Copy, Check, Sparkles, RotateCcw, ChevronDown, AlertTriangle, PaintBucket } from 'lucide-react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
})

// ── 流程图预设样式 ──
const flowchartStyles = [
  {
    id: 'default', label: '经典矩形', desc: '标准圆角矩形',
    format: (i, label, steps, isLast) => {
      const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      const nodeId = labels[i]
      return `    ${nodeId}["${label}"]`
    },
  },
  {
    id: 'rounded', label: '圆角流程', desc: '大圆角卡片',
    format: (i, label, steps, isLast) => {
      const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      const nodeId = labels[i]
      return `    ${nodeId}(${label})`
    },
  },
  {
    id: 'stadium', label: '体育场形', desc: '胶囊形状',
    format: (i, label, steps, isLast) => {
      const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      const nodeId = labels[i]
      return `    ${nodeId}([${label}])`
    },
  },
  {
    id: 'angled', label: '尖锐矩形', desc: '直角方框',
    format: (i, label, steps, isLast) => {
      const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      const nodeId = labels[i]
      return `    ${nodeId}[${label}]`
    },
  },
  {
    id: 'subroutine', label: '子程序框', desc: '双竖线方框',
    format: (i, label, steps, isLast) => {
      const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      const nodeId = labels[i]
      return `    ${nodeId}[[${label}]]`
    },
  },
  {
    id: 'hexagon', label: '六边形', desc: '六边形节点',
    format: (i, label, steps, isLast) => {
      const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      const nodeId = labels[i]
      return `    ${nodeId}{{${label}}}`
    },
  },
  {
    id: 'mixed', label: '混合样式', desc: '自动判断+菱形',
    format: (i, label, steps, isLast) => {
      const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      const nodeId = labels[i]
      const isDecision = /如果|判断|是否|成功|失败|通过|达标|满足|条件|合格/.test(label)
      if (isDecision) return `    ${nodeId}{${label}}`
      if (i === 0) return `    ${nodeId}([${label}])`
      if (isLast) return `    ${nodeId}[${label}]`
      return `    ${nodeId}["${label}"]`
    },
  },
]

// ── 流程方向 ──
const directions = [
  { id: 'TD', label: '上→下', desc: '从上到下' },
  { id: 'LR', label: '左→右', desc: '从左到右' },
  { id: 'BT', label: '下→上', desc: '从下到上' },
  { id: 'RL', label: '右→左', desc: '从右到左' },
]

// ── 主题 ──
const themes = [
  { id: 'default', label: '默认', desc: '经典白底' },
  { id: 'neutral', label: '中性', desc: '灰白配色' },
  { id: 'dark', label: '深色', desc: '深色背景' },
  { id: 'forest', label: '森林', desc: '绿色系' },
]

// ── 自然语言 → Mermaid ──
function textToDiagram(text, type, styleId = 'default', direction = 'TD', colors = {}) {
  const steps = text
    .split(/[，,。；;、\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  if (steps.length < 2) {
    return { code: '', error: '请用逗号或句号分隔至少 2 个步骤。例如：文献调研，实验设计，数据采集，写论文' }
  }

  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const style = flowchartStyles.find(s => s.id === styleId) || flowchartStyles[0]

  switch (type) {
    case 'flowchart': {
      const lines = []
      lines.push(`graph ${direction}`)

      // 添加样式类
      const hasDecisions = steps.some(s => /如果|判断|是否|成功|失败|通过|达标|满足|条件|合格/.test(s))
      // 使用用户自定义颜色或默认颜色
      const nf = colors.fill || '#dbeafe'
      const ns = colors.stroke || '#3b82f6'
      const nt = colors.text || '#1e40af'
      const ec = colors.edge || '#6b7280'

      if (hasDecisions || (colors.fill && colors.fill !== '#dbeafe') || (colors.stroke && colors.stroke !== '#3b82f6')) {
        lines.push(`    classDef decision fill:#fff3cd,stroke:#f59e0b,stroke-width:2px,color:#92400e`)
        lines.push(`    classDef process fill:${nf},stroke:${ns},stroke-width:2px,color:${nt}`)
        lines.push(`    classDef endpoint fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#065f46`)
      }

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i].replace(/['"]/g, '')
        const isDecision = /如果|判断|是否|成功|失败|通过|达标|满足|条件|合格/.test(step)
        const nodeId = labels[i]

        if (styleId === 'mixed' || isDecision) {
          if (isDecision) {
            lines.push(`    ${nodeId}{${step}}`)
            if (i < steps.length - 1) {
              const nextId = labels[i + 1]
              const prevId = i > 0 ? labels[i - 1] : labels[0]
              lines.push(`    ${nodeId} -->|是/通过| ${nextId}`)
              lines.push(`    ${nodeId} -->|否/不通过| ${prevId}`)
            }
            if (hasDecisions) lines.push(`    class ${nodeId} decision`)
          } else {
            lines.push(style.format(i, step, steps, i === steps.length - 1))
            if (hasDecisions) {
              if (i === 0 || i === steps.length - 1) lines.push(`    class ${nodeId} endpoint`)
              else lines.push(`    class ${nodeId} process`)
            }
            if (i < steps.length - 1) {
              const nextId = labels[i + 1]
              lines.push(`    ${nodeId} --> ${nextId}`)
            }
          }
        } else {
          lines.push(style.format(i, step, steps, i === steps.length - 1))
          if (hasDecisions) {
            if (i === 0 || i === steps.length - 1) lines.push(`    class ${nodeId} endpoint`)
            else lines.push(`    class ${nodeId} process`)
          }
          if (i < steps.length - 1) {
            const nextId = labels[i + 1]
            lines.push(`    ${nodeId} --> ${nextId}`)
          }
        }
      }
      return { code: lines.join('\n'), error: '' }
    }

    case 'gantt': {
      const lines = []
      lines.push('gantt')
      lines.push('    title 项目时间计划')
      lines.push('    dateFormat  YYYY-MM-DD')
      lines.push('    axisFormat  %m/%d')
      let day = 1
      steps.forEach((step, i) => {
        const duration = Math.max(7, Math.min(60, step.length * 3))
        const startDate = `2025-01-${String(day).padStart(2, '0')}`
        const endDate = `2025-01-${String(Math.min(day + duration, 365)).padStart(2, '0')}`
        lines.push(`    ${step} :${labels[i].toLowerCase()}, ${startDate}, ${duration}d`)
        day += duration
      })
      return { code: lines.join('\n'), error: '' }
    }

    case 'sequence': {
      const lines = []
      lines.push('sequenceDiagram')
      const participants = [...new Set(steps.slice(0, Math.min(steps.length, 6)))]
      participants.forEach((p, i) => {
        lines.push(`    participant ${labels[i]} as ${p}`)
      })
      for (let i = 0; i < participants.length - 1; i++) {
        lines.push(`    ${labels[i]}->>+${labels[i + 1]}: 发送请求`)
        lines.push(`    ${labels[i + 1]}-->>-${labels[i]}: 返回响应`)
      }
      return { code: lines.join('\n'), error: '' }
    }

    case 'mindmap': {
      const lines = []
      lines.push('mindmap')
      lines.push(`  root((${steps[0] || '主题'}))`)
      const children = steps.slice(1)
      children.forEach((child, i) => {
        const indent = i < 4 ? '    ' : '      '
        lines.push(`${indent}${child}`)
      })
      return { code: lines.join('\n'), error: '' }
    }

    case 'architecture': {
      const lines = []
      lines.push('graph TB')
      const groupSize = Math.ceil(steps.length / Math.ceil(steps.length / 3))
      const groups = []
      for (let i = 0; i < steps.length; i += groupSize) {
        groups.push(steps.slice(i, i + groupSize))
      }
      groups.forEach((group, gi) => {
        lines.push(`    subgraph 层级${gi + 1}`)
        group.forEach((step, si) => {
          const id = labels[gi * groupSize + si]
          lines.push(`        ${id}[${step}]`)
        })
        lines.push(`    end`)
        if (gi < groups.length - 1) {
          const fromId = labels[gi * groupSize + group.length - 1]
          const toId = labels[(gi + 1) * groupSize]
          lines.push(`    ${fromId} --> ${toId}`)
        }
      })
      return { code: lines.join('\n'), error: '' }
    }

    case 'pie': {
      const nums = [], names = []
      steps.forEach((step, i) => {
        const match = step.match(/(\d+)/)
        const val = match ? parseInt(match[1]) : (10 + i * 8)
        names.push(step.replace(/\d+/g, '').trim() || step)
        nums.push(val)
      })
      const total = nums.reduce((a, b) => a + b, 0)
      const lines = ['pie title 数据分布']
      names.forEach((name, i) => {
        const pct = Math.round((nums[i] / total) * 100)
        lines.push(`    "${name}" : ${pct}`)
      })
      return { code: lines.join('\n'), error: '' }
    }

    default:
      return { code: '', error: '不支持的图表类型' }
  }
}

const diagramTypes = [
  { id: 'flowchart', label: '流程图', icon: '🔄', hint: '用逗号分隔步骤', example: '开始实验，准备试剂，进行反应，产物合格，结果分析，撰写报告' },
  { id: 'gantt', label: '甘特图', icon: '📅', hint: '用逗号分隔任务', example: '选题，文献综述，实验阶段1，实验阶段2，数据分析，论文撰写，投稿修改' },
  { id: 'sequence', label: '时序图', icon: '🔁', hint: '用逗号分隔参与方', example: '用户，Web前端，API网关，业务服务，数据库' },
  { id: 'mindmap', label: '思维导图', icon: '🧠', hint: '第一个是中心主题', example: '论文选题，深度学习，NLP方向，CV方向，文献综述，实验对比，结论' },
  { id: 'architecture', label: '架构图', icon: '🏗️', hint: '用逗号分隔模块', example: '数据采集层，数据清洗层，特征工程，模型训练层，推理服务层，结果展示层' },
  { id: 'pie', label: '饼图', icon: '🥧', hint: '可附带数字', example: '方法A 42，方法B 28，方法C 18，方法D 12' },
]

export default function DiagramGen() {
  const [diagramType, setDiagramType] = useState('flowchart')
  const [userInput, setUserInput] = useState('')
  const [mermaidCode, setMermaidCode] = useState('')
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [flowStyle, setFlowStyle] = useState('default')
  const [direction, setDirection] = useState('TD')
  const [theme, setTheme] = useState('default')
  const [nodeColors, setNodeColors] = useState({ fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af' })
  const [edgeColor, setEdgeColor] = useState('#6b7280')
  const [showColorPanel, setShowColorPanel] = useState(false)
  const containerRef = useRef(null)

  // 更新 Mermaid 主题
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'loose',
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    })
    if (mermaidCode) {
      // 触发重新渲染
      setMermaidCode(prev => prev)
      renderWithDelay()
    }
  }, [theme])

  const generate = useCallback((text, type, style, dir) => {
    if (!text.trim()) { setError('请输入文字描述'); setSvg(''); return }
    const s = style || flowStyle
    const d = dir || direction
    const colors = { fill: nodeColors.fill, stroke: nodeColors.stroke, text: nodeColors.text, edge: edgeColor }
    const result = textToDiagram(text, type, s, d, colors)
    if (result.error) {
      setError(result.error); setSvg(''); setMermaidCode('')
    } else {
      setMermaidCode(result.code); setError('')
      renderWithDelay(result.code)
    }
  }, [flowStyle, direction, theme, nodeColors, edgeColor])

  const renderWithDelay = (code) => {
    if (!code) return
    setTimeout(async () => {
      try {
        const id = 'mermaid-' + Date.now()
        const { svg: result } = await mermaid.render(id, code || mermaidCode)
        setSvg(result); setError('')
      } catch (e) {
        const fixed = (code || mermaidCode)
          .replace(/；/g, ';').replace(/：/g, ':').replace(/（/g, '(').replace(/）/g, ')')
        if (fixed !== (code || mermaidCode)) {
          try {
            const id2 = 'mermaid-' + Date.now()
            const { svg: result2 } = await mermaid.render(id2, fixed)
            setSvg(result2); setError('已自动修复部分语法并重新渲染')
            setMermaidCode(fixed)
            return
          } catch {}
        }
        setError('生成失败：' + (e.message || '语法错误'))
      }
    }, 200)
  }

  useEffect(() => {
    if (!mermaidCode.trim()) { setSvg(''); return }
    renderWithDelay()
  }, [mermaidCode])

  const currentType = diagramTypes.find(t => t.id === diagramType)

  const copyMermaidCode = () => {
    navigator.clipboard.writeText(mermaidCode)
    setCopied('code'); setTimeout(() => setCopied(''), 2000)
  }

  const copyForNotion = () => {
    navigator.clipboard.writeText('```mermaid\n' + mermaidCode + '\n```')
    setCopied('notion'); setTimeout(() => setCopied(''), 2000)
  }

  const downloadPNG = () => {
    if (!svg || !containerRef.current) return
    const svgEl = containerRef.current.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      ctx.scale(2, 2)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${diagramType}.png`
        a.click()
      })
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const downloadSVG = () => {
    if (!svg) return
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${diagramType}.svg`
    a.click()
  }

  // 复制为图片到剪贴板（可直接粘贴到Word）
  const copyAsImage = () => {
    if (!svg || !containerRef.current) return
    const svgEl = containerRef.current.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const img = new Image()
    img.onload = async () => {
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      const ctx = canvas.getContext('2d')
      ctx.scale(2, 2)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          setCopied('image')
          setTimeout(() => setCopied(''), 2000)
        } catch {
          // Fallback: download
          downloadPNG()
        }
      }, 'image/png')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">文字转图表</h2>
      <p className="text-gray-500 text-sm mb-6">
        用自然语言描述想法，自动生成多种风格的流程图/甘特图/思维导图等
        <span className="text-blue-500 ml-2">支持7种节点样式 · 4个方向 · 4套主题</span>
      </p>

      {/* 图表类型选择 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {diagramTypes.map(dt => (
          <button
            key={dt.id}
            onClick={() => setDiagramType(dt.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${diagramType === dt.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <span>{dt.icon}</span> {dt.label}
          </button>
        ))}
      </div>

      {/* 流程图专属设置 */}
      {diagramType === 'flowchart' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-2 block font-medium">节点样式</label>
            <div className="flex flex-wrap gap-2">
              {flowchartStyles.map(st => (
                <button
                  key={st.id}
                  onClick={() => {
                    setFlowStyle(st.id)
                    if (userInput.trim()) generate(userInput, 'flowchart', st.id, direction)
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${flowStyle === st.id ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                  title={st.desc}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-6 flex-wrap">
            <div>
              <label className="text-xs text-gray-500 mb-2 block font-medium">流程方向</label>
              <div className="flex gap-2">
                {directions.map(d => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDirection(d.id)
                      if (userInput.trim()) generate(userInput, 'flowchart', flowStyle, d.id)
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${direction === d.id ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    title={d.desc}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block font-medium">主题配色</label>
              <div className="flex gap-2">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${theme === t.id ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    title={t.desc}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <button
                onClick={() => setShowColorPanel(!showColorPanel)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${showColorPanel ? 'bg-purple-50 border-purple-400 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                <PaintBucket size={12} /> 自定义颜色
              </button>
            </div>
          </div>

          {/* 颜色自定义面板 */}
          {showColorPanel && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">节点填充色</label>
                <input type="color" value={nodeColors.fill} onChange={e => setNodeColors(prev => ({ ...prev, fill: e.target.value }))} className="w-full h-8 rounded cursor-pointer border border-gray-200" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">节点边框色</label>
                <input type="color" value={nodeColors.stroke} onChange={e => setNodeColors(prev => ({ ...prev, stroke: e.target.value }))} className="w-full h-8 rounded cursor-pointer border border-gray-200" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">节点文字色</label>
                <input type="color" value={nodeColors.text} onChange={e => setNodeColors(prev => ({ ...prev, text: e.target.value }))} className="w-full h-8 rounded cursor-pointer border border-gray-200" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">连接线颜色</label>
                <input type="color" value={edgeColor} onChange={e => setEdgeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border border-gray-200" />
              </div>
              <button
                onClick={() => { setNodeColors({ fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af' }); setEdgeColor('#6b7280'); }}
                className="col-span-4 text-[11px] text-gray-400 hover:text-gray-600 text-center"
              >
                重置为默认颜色
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* 左侧：输入区 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">输入你的文字描述</span>
              <button onClick={() => setUserInput('')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <RotateCcw size={12} /> 清空
              </button>
            </div>
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder={`输入你的描述...\n\n${currentType?.hint}\n\n例如：${currentType?.example}`}
              className="w-full h-[200px] p-4 text-sm resize-none focus:outline-none bg-gray-50/50"
              spellCheck={false}
            />
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">{currentType?.hint}</p>
            </div>
          </div>

          <button
            onClick={() => generate(userInput, diagramType, flowStyle, direction)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Sparkles size={18} /> 生成{currentType?.label}
          </button>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-2">试试示例：</p>
            <div className="flex flex-wrap gap-1.5">
              {currentType?.example && (
                <button
                  onClick={() => generate(currentType.example, diagramType, flowStyle, direction)}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors text-left"
                >
                  {currentType.example}
                </button>
              )}
            </div>
          </div>

          {mermaidCode && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowEditor(!showEditor)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50"
              >
                <span>查看/修改 Mermaid 代码</span>
                <ChevronDown size={16} className={`transition-transform ${showEditor ? 'rotate-180' : ''}`} />
              </button>
              {showEditor && (
                <textarea
                  value={mermaidCode}
                  onChange={e => setMermaidCode(e.target.value)}
                  className="w-full h-[150px] p-3 text-xs font-mono resize-none focus:outline-none bg-gray-50/50 border-t border-gray-100"
                  spellCheck={false}
                />
              )}
            </div>
          )}
        </div>

        {/* 右侧：预览区 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-1">
            <span className="text-sm font-medium text-gray-700">预览</span>
            {svg && (
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={copyMermaidCode} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                  <Copy size={12} /> {copied === 'code' ? '已复制' : '代码'}
                </button>
                <button onClick={copyForNotion} className="flex items-center gap-1 px-2 py-1 text-xs text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded">
                  {copied === 'notion' ? '已复制' : 'Notion'}
                </button>
                <button onClick={copyAsImage} className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded font-medium">
                  <Copy size={12} /> {copied === 'image' ? '✓ 已复制' : '复制到Word'}
                </button>
                <button onClick={downloadSVG} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">SVG</button>
                <button onClick={downloadPNG} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                  <Download size={12} /> PNG
                </button>
              </div>
            )}
          </div>
          <div className="h-[460px] overflow-auto p-6 flex items-center justify-center bg-white" ref={containerRef}>
            {error ? (
              <div className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg max-w-md text-center">{error}</div>
            ) : svg ? (
              <div dangerouslySetInnerHTML={{ __html: svg }} className="max-w-full" />
            ) : (
              <div className="text-gray-300 text-center">
                <Sparkles size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">输入文字，选择样式，点击生成</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
        <p className="text-xs text-gray-500">
          <strong>怎么用：</strong>
          ① 选图表类型 → ② 选节点样式/方向/主题（流程图专属）→ ③ 输入文字 → ④ 点生成 → ⑤ 点"复制到Word"可直接粘贴到 Word 文档
        </p>
      </div>
    </div>
  )
}
