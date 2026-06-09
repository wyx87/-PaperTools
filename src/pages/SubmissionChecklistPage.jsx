import { useState, useEffect, useCallback } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import { ClipboardCheck, Copy, Check, RotateCcw, Plus, Pencil, X, CheckCircle2 } from 'lucide-react'

const STORAGE_KEY_CHECKED = 'paper-toolbox-checklist-checked'
const STORAGE_KEY_ITEMS = 'paper-toolbox-checklist-items'

const DEFAULT_ITEMS = [
  '论文题目、作者、单位、基金信息完整',
  '摘要符合结构式要求（目的、方法、结果、结论）',
  '关键词 3-5 个',
  '引言包含研究背景、问题、相关工作、本文贡献',
  '方法部分可复现（提供关键参数、代码链接）',
  '结果部分有统计分析和图表',
  '讨论部分与已有研究对比，并指出局限性',
  '结论简洁明确',
  '参考文献格式统一，引用与列表一一对应',
  '图表标题独立完整，编号正确',
  '已上传补充材料（数据集、代码、附录）',
  '已填写投稿信和作者声明',
  '图表分辨率 ≥ 300 dpi',
  '语言经过润色，无语法错误',
  '格式符合期刊要求（模板、页边距、行距）',
  '所有作者已确认最终版本',
  '利益冲突声明已包含',
  '伦理审批（如需要）',
  '数据可用性声明',
  '推荐审稿人名单（如有要求）',
]

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return fallback
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignore */ }
}

export default function SubmissionChecklistPage() {
  const [items, setItems] = useState(() => loadFromStorage(STORAGE_KEY_ITEMS, DEFAULT_ITEMS))
  const [checked, setChecked] = useState(() => loadFromStorage(STORAGE_KEY_CHECKED, {}))
  const [generated, setGenerated] = useState('')
  const [editableReport, setEditableReport] = useState('')
  const [copied, setCopied] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [editText, setEditText] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [newItemText, setNewItemText] = useState('')

  // Persist to localStorage
  useEffect(() => { saveToStorage(STORAGE_KEY_ITEMS, items) }, [items])
  useEffect(() => { saveToStorage(STORAGE_KEY_CHECKED, checked) }, [checked])

  const toggleItem = useCallback((idx) => {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }))
  }, [])

  const checkAll = () => {
    const all = {}
    items.forEach((_, i) => { all[i] = true })
    setChecked(all)
  }

  const clearAll = () => setChecked({})

  const reset = () => {
    setItems([...DEFAULT_ITEMS])
    setChecked({})
    setGenerated('')
    setEditableReport('')
  }

  // Edit item
  const startEdit = (idx) => {
    setEditingIdx(idx)
    setEditText(items[idx])
  }
  const saveEdit = () => {
    if (editText.trim()) {
      setItems(prev => prev.map((item, i) => i === editingIdx ? editText.trim() : item))
    }
    setEditingIdx(null)
    setEditText('')
  }
  const cancelEdit = () => {
    setEditingIdx(null)
    setEditText('')
  }

  // Add new item
  const addItem = () => {
    if (newItemText.trim()) {
      setItems(prev => [...prev, newItemText.trim()])
      setNewItemText('')
      setShowAddInput(false)
    }
  }

  // Delete item
  const deleteItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
    setChecked(prev => {
      const next = {}
      Object.keys(prev).forEach(k => {
        const ki = parseInt(k)
        if (ki < idx) next[k] = prev[k]
        else if (ki > idx) next[ki - 1] = prev[k]
      })
      return next
    })
  }

  // Generate report
  const generate = () => {
    const done = items.filter((_, i) => checked[i])
    const pending = items.filter((_, i) => !checked[i])

    let report = '===== 投稿自检报告 =====\n'
    report += `生成日期：${new Date().toLocaleDateString('zh-CN')}\n\n`

    report += `✅ 已完成（${done.length} / ${items.length}）\n`
    report += '─'.repeat(40) + '\n'
    if (done.length === 0) {
      report += '(暂无)\n'
    } else {
      done.forEach((item, i) => {
        report += `${i + 1}. ${item}\n`
      })
    }

    report += `\n⬜ 待完成（${pending.length} / ${items.length}）\n`
    report += '─'.repeat(40) + '\n'
    if (pending.length === 0) {
      report += '🎉 所有项目已完成！\n'
    } else {
      pending.forEach((item, i) => {
        report += `${i + 1}. ${item}\n`
      })
    }

    report += `\n完成率：${Math.round((done.length / items.length) * 100)}%`
    setGenerated(report)
    setEditableReport(report)
  }

  const copyText = async () => {
    const text = editableReport || generated
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text; document.body.appendChild(ta)
      ta.select(); document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const doneCount = Object.values(checked).filter(Boolean).length
  const percent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <ChartPageLayout title="投稿自检清单" breadcrumb="自检清单" categoryLink="/submit" categoryLabel="投稿检查">
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Checklist */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5">
                <ClipboardCheck size={15} className="text-green-500" />
                投稿前检查
              </h3>
              <span className="text-[11px] text-gray-400">({doneCount}/{items.length})</span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={checkAll}
                className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-green-50 text-green-600 hover:bg-green-100">
                全选
              </button>
              <button onClick={clearAll}
                className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-gray-100 text-gray-500 hover:bg-gray-200">
                清空
              </button>
              <button onClick={reset}
                className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1">
                <RotateCcw size={11} />重置
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${percent}%`,
                background: percent === 100
                  ? 'linear-gradient(90deg, #10B981, #34D399)'
                  : percent >= 50
                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                    : 'linear-gradient(90deg, #EF4444, #F87171)',
              }}
            />
          </div>

          <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-colors group ${
                  checked[idx] ? 'bg-green-50 border border-green-100' : 'bg-gray-50/50 border border-gray-100 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!checked[idx]}
                  onChange={() => toggleItem(idx)}
                  className="w-4 h-4 mt-0.5 rounded accent-[#10B981] flex-shrink-0 cursor-pointer"
                />
                {editingIdx === idx ? (
                  <div className="flex-1 flex gap-1.5">
                    <input
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                      className="flex-1 text-[13px] border border-[#3B82F6] rounded-md px-2 py-1 outline-none"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 rounded p-0.5"><CheckCircle2 size={14} /></button>
                    <button onClick={cancelEdit} className="text-gray-400 hover:bg-gray-100 rounded p-0.5"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span
                      onDoubleClick={() => startEdit(idx)}
                      className={`flex-1 text-[13px] leading-relaxed cursor-default select-none ${
                        checked[idx] ? 'text-green-700 line-through' : 'text-gray-700'
                      }`}
                      title="双击编辑"
                    >
                      {item}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => startEdit(idx)}
                        className="text-gray-300 hover:text-[#3B82F6] transition-colors" title="编辑">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deleteItem(idx)}
                        className="text-gray-300 hover:text-red-400 transition-colors" title="删除">
                        <X size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new item */}
          {showAddInput ? (
            <div className="flex gap-1.5">
              <input
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setShowAddInput(false) }}
                placeholder="输入新检查项..."
                className="flex-1 text-[13px] border border-[#3B82F6] rounded-lg px-3 py-1.5 outline-none"
                autoFocus
              />
              <button onClick={addItem}
                className="px-3 py-1.5 text-[12px] rounded-lg font-medium bg-[#10B981] text-white hover:bg-[#059669]">
                添加
              </button>
              <button onClick={() => setShowAddInput(false)}
                className="px-3 py-1.5 text-[12px] rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                取消
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAddInput(true)}
              className="w-full px-3 py-2 text-[12px] rounded-lg font-medium border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#3B82F6] hover:text-[#3B82F6] flex items-center justify-center gap-1.5 transition-colors">
              <Plus size={13} />添加新项
            </button>
          )}

          <button onClick={generate}
            className="w-full px-4 py-2.5 text-sm rounded-lg font-medium bg-[#10B981] text-white hover:bg-[#059669] flex items-center justify-center gap-1.5 transition-colors">
            <ClipboardCheck size={15} />生成自查报告
          </button>

          <p className="text-[10px] text-gray-400 text-center">
            双击清单项编辑 · 鼠标悬停显示编辑/删除按钮 · 数据自动保存
          </p>
        </div>

        {/* Report */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5">
              <ClipboardCheck size={15} className="text-green-500" />自查报告
            </h3>
            {generated && (
              <button onClick={copyText}
                className={`px-3 py-1.5 text-[11px] rounded-md font-medium flex items-center gap-1 transition-colors ${
                  copied ? 'bg-green-100 text-green-700' : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                }`}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? '已复制' : '复制报告'}
              </button>
            )}
          </div>
          <div className="flex-1 border border-gray-100 rounded-lg bg-gray-50/50 overflow-hidden flex flex-col min-h-[300px]">
            {generated ? (
              <textarea
                value={editableReport}
                onChange={e => setEditableReport(e.target.value)}
                className="flex-1 w-full p-4 text-sm text-gray-700 font-sans leading-relaxed bg-transparent resize-none outline-none border-none"
                style={{ minHeight: '300px' }}
              />
            ) : (
              <div className="text-sm text-gray-400 text-center pt-20 space-y-2 flex-1">
                <p>勾选清单项目后</p>
                <p>点击「生成自查报告」查看结果</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ChartPageLayout>
  )
}
