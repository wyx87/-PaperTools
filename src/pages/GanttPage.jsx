import { useState, useRef, useCallback, useEffect } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import { Download, Copy, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })

// ---- 工具函数：日期运算 ----
function parseDate(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10)
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000) + 1 // inclusive
}

function addDays(s, n) {
  const d = parseDate(s)
  if (!d) return s
  d.setDate(d.getDate() + n)
  return fmtDate(d)
}

// ---- 示例数据 ----
const EXAMPLE_DATA = [
  { name: '选题与文献调研', start: '2025-06-01', end: '2025-06-10', deps: '' },
  { name: '撰写开题报告', start: '2025-06-11', end: '2025-06-20', deps: '选题与文献调研' },
  { name: '实验设计', start: '2025-06-21', end: '2025-07-05', deps: '撰写开题报告' },
  { name: '数据采集', start: '2025-07-06', end: '2025-07-20', deps: '实验设计' },
  { name: '数据分析', start: '2025-07-21', end: '2025-08-05', deps: '数据采集' },
  { name: '论文初稿', start: '2025-08-06', end: '2025-08-30', deps: '数据分析' },
]

// ---- 生成 Mermaid 甘特图代码 ----
function generateGanttCode(tasks, title = '项目进度') {
  if (!tasks.length) return ''

  const lines = ['gantt', `    title ${title}`, '    dateFormat YYYY-MM-DD']
  const usedIds = new Set()

  // 分配 id（确保唯一且不含特殊字符）
  const getId = (idx) => {
    let id = `t${idx}`
    while (usedIds.has(id)) { idx++; id = `t${idx}` }
    usedIds.add(id)
    return id
  }

  tasks.forEach((task, i) => {
    const id = getId(i)
    const name = task.name || `任务${i + 1}`
    const start = task.start || ''
    const end = task.end || ''
    const deps = (task.deps || '').trim()

    if (!start || !end) return

    const sd = parseDate(start)
    const ed = parseDate(end)
    if (!sd || !ed) return

    const duration = daysBetween(sd, ed)

    if (deps) {
      // 找到依赖任务的 id
      const depIdx = tasks.findIndex(t => t.name === deps)
      if (depIdx >= 0) {
        const depId = `t${depIdx}`
        lines.push(`    ${name} :${id}, after ${depId}, ${duration}d`)
      } else {
        // 依赖名不在列表中，当作普通任务
        lines.push(`    ${name} :${id}, ${start}, ${duration}d`)
      }
    } else {
      lines.push(`    ${name} :${id}, ${start}, ${duration}d`)
    }
  })

  return lines.join('\n')
}

export default function GanttPage() {
  const [tasks, setTasks] = useState([{ name: '', start: '', end: '', deps: '' }])
  const [title, setTitle] = useState('项目进度')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const containerRef = useRef(null)

  // 任务数据变更 → 重新生成代码
  useEffect(() => {
    const newCode = generateGanttCode(tasks, title)
    setCode(newCode)
  }, [tasks, title])

  // 代码变更 → 重新渲染
  useEffect(() => {
    if (!code) return
    renderDiagram()
  }, [code])

  const renderDiagram = async () => {
    if (!containerRef.current || !code) return
    try {
      const id = `mermaid-gantt-${Date.now()}`
      const { svg } = await mermaid.render(id, code)
      containerRef.current.innerHTML = svg
      setError('')
    } catch (e) {
      setError(e.message)
      containerRef.current.innerHTML = `<div class="text-red-400 text-xs p-4 text-center">渲染错误：${e.message}</div>`
    }
  }

  // ---- 任务操作 ----
  const updateTask = (i, field, value) => {
    setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
    if (!hasStarted) setHasStarted(true)
  }

  const addTask = () => {
    setTasks(prev => [...prev, { name: '', start: '', end: '', deps: '' }])
  }

  const removeTask = (i) => {
    setTasks(prev => prev.filter((_, idx) => idx !== i))
  }

  const loadExample = () => {
    setTasks(EXAMPLE_DATA.map(t => ({ ...t })))
    setTitle('毕业论文进度')
    setHasStarted(true)
  }

  const resetAll = () => {
    setTasks([{ name: '', start: '', end: '', deps: '' }])
    setTitle('项目进度')
    setHasStarted(false)
  }

  // ---- 导出 ----
  const handleExportPng = useCallback(() => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(rect.width, 400) * 2
    canvas.height = Math.max(rect.height, 300) * 2
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const svgData = new XMLSerializer().serializeToString(svg)
    img.onload = () => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = 'gantt.png'
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }, [])

  const handleCopyCode = async () => {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ---- 依赖下拉选项 ----
  const getDepOptions = (currentIdx) => {
    return tasks
      .map((t, i) => ({ idx: i, name: t.name }))
      .filter(t => t.idx !== currentIdx && t.name.trim())
  }

  const hasAnyData = tasks.some(t => t.name.trim() || t.start || t.end)

  return (
    <ChartPageLayout title="甘特图生成器" breadcrumb="甘特图">
      <p className="text-sm text-gray-500 mb-6 -mt-2">
        在左侧表格中填写任务信息，右侧自动生成甘特图。无需手写 Mermaid 代码。
      </p>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ===== 左侧：任务表格 ===== */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1E3A5F]">任务列表</h3>
              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tasks.length} 项</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="项目标题"
                className="w-28 text-[11px] px-2 py-1 border border-gray-200 rounded-md focus:ring-1 focus:ring-[#3B82F6] outline-none text-gray-600"
              />
              <button onClick={loadExample}
                className="px-2.5 py-1 text-[10px] rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-medium transition-colors">
                加载示例
              </button>
              <button onClick={resetAll}
                className="px-2 py-1 text-[10px] rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                清空
              </button>
            </div>
          </div>

          {/* 表格 */}
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 w-[35%]">任务名称</th>
                  <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-500 w-[22%]">开始日期</th>
                  <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-500 w-[22%]">结束日期</th>
                  <th className="text-left px-2 py-2 text-[10px] font-semibold text-gray-500 w-[16%]">依赖</th>
                  <th className="text-center px-1 py-2 text-[10px] font-semibold text-gray-500 w-[5%]"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => {
                  const depOptions = getDepOptions(i)
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <td className="px-3 py-1.5">
                        <input
                          value={task.name}
                          onChange={e => updateTask(i, 'name', e.target.value)}
                          placeholder="输入任务名称"
                          className="w-full text-[11px] px-1.5 py-1 border border-transparent group-hover:border-gray-200 rounded focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none bg-transparent transition-colors"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={task.start}
                          onChange={e => updateTask(i, 'start', e.target.value)}
                          className="w-full text-[11px] px-1 py-1 border border-transparent group-hover:border-gray-200 rounded focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none bg-transparent transition-colors text-gray-600"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={task.end}
                          onChange={e => updateTask(i, 'end', e.target.value)}
                          className="w-full text-[11px] px-1 py-1 border border-transparent group-hover:border-gray-200 rounded focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none bg-transparent transition-colors text-gray-600"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        {depOptions.length > 0 ? (
                          <select
                            value={task.deps}
                            onChange={e => updateTask(i, 'deps', e.target.value)}
                            className="w-full text-[10px] px-1 py-1 border border-transparent group-hover:border-gray-200 rounded focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none bg-transparent transition-colors text-gray-500"
                          >
                            <option value="">无</option>
                            {depOptions.map(opt => (
                              <option key={opt.idx} value={opt.name}>{opt.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] text-gray-300 px-1">无</span>
                        )}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        {tasks.length > 1 && (
                          <button onClick={() => removeTask(i)}
                            className="p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <button onClick={addTask}
              className="w-full py-1.5 text-[11px] rounded-md border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors font-medium flex items-center justify-center gap-1">
              <Plus size={12} />添加任务
            </button>
          </div>
        </div>

        {/* ===== 右侧：实时预览 ===== */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1E3A5F]">实时预览</h3>
            <div className="flex gap-1.5">
              <button onClick={handleExportPng}
                disabled={!hasAnyData}
                className="px-2.5 py-1 text-[11px] rounded-md bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1 transition-colors">
                <Download size={11} />导出 PNG
              </button>
              <button onClick={handleCopyCode}
                disabled={!code}
                className={`px-2.5 py-1 text-[11px] rounded-md font-medium flex items-center gap-1 transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Copy size={11} />{copied ? '已复制' : '复制代码'}
              </button>
            </div>
          </div>

          <div ref={containerRef}
            className="flex items-center justify-center min-h-[380px] bg-gray-50 rounded-lg p-4 overflow-auto">
            {!hasAnyData && (
              <div className="text-center text-gray-300">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-xs">在左侧填写任务信息后，甘特图将在此显示</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md">
              <p className="text-[10px] text-red-500">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== 底部：Mermaid 代码（折叠） ===== */}
      <div className="mt-4 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowCode(!showCode)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            {showCode ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            生成的 Mermaid 代码（高级用户可复制修改）
          </span>
          {code && (
            <span className="text-[10px] text-gray-300">{code.split('\n').length} 行</span>
          )}
        </button>
        {showCode && (
          <div className="px-4 pb-3">
            <pre className="bg-gray-50 rounded-lg p-3 text-[11px] font-mono text-gray-600 overflow-x-auto max-h-48 overflow-y-auto border border-gray-100">
              {code || '（暂无代码）'}
            </pre>
          </div>
        )}
      </div>
    </ChartPageLayout>
  )
}
