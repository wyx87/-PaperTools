import { useState, useMemo } from 'react'
import {
  FileText, Sparkles, BookOpen, Copy, RefreshCw, Check,
  Hash, ListOrdered, PieChart, Table2, Table, Target, Download, Loader2, AlertTriangle,
  ArrowLeftToLine,
} from 'lucide-react'
import { copyHtml, copyText } from '../utils'
import { generateAbstract, generateProposal, optimizeTitle, textToTableData } from '../services/ai'
import { useTask } from '../contexts/TaskContext'

// ── 摘要模板（本地）──
const abstractTemplates = [
  {
    id: 'structured', label: '结构化摘要',
    fields: [
      { key: 'purpose', label: '研究目的', placeholder: '本文旨在...' },
      { key: 'method', label: '研究方法', placeholder: '采用了什么方法...' },
      { key: 'result', label: '主要结果', placeholder: '实验/分析结果...' },
      { key: 'conclusion', label: '结论', placeholder: '研究意义与贡献...' },
    ],
    generate: (f) => `【目的】${f.purpose || ''}\n\n【方法】${f.method || ''}\n\n【结果】${f.result || ''}\n\n【结论】${f.conclusion || ''}`,
  },
  {
    id: 'single', label: '单段式', fields: [{ key: 'content', label: '摘要内容', placeholder: '输入摘要...' }],
    generate: (f) => f.content || '',
  },
  {
    id: 'english', label: '英文摘要',
    fields: [
      { key: 'obj', label: 'Objective', placeholder: 'This paper aims to...' },
      { key: 'mtd', label: 'Methods', placeholder: 'We employed...' },
      { key: 'res', label: 'Results', placeholder: 'The results show...' },
      { key: 'cnc', label: 'Conclusion', placeholder: 'This study contributes...' },
    ],
    generate: (f) => `Objective: ${f.obj || ''}\n\nMethods: ${f.mtd || ''}\n\nResults: ${f.res || ''}\n\nConclusion: ${f.cnc || ''}`,
  },
]

// ── 大纲模板 ──
const outlineTemplates = [
  { id: 'standard', label: '标准理工科', sections: ['引言', '相关工作', '问题定义', '方法', '实验', '结果分析', '讨论', '结论'] },
  { id: 'experiment', label: '实验研究型', sections: ['引言', '理论基础', '材料与方法', '实验过程', '结果与讨论', '结论'] },
  { id: 'survey', label: '综述型', sections: ['引言', '领域概述', '分类体系', '方法比较', '挑战与趋势', '结论'] },
]

// ── 参考文献格式 ──
const refFormats = {
  'GB': { name: 'GB/T 7714', fmt: (a, t, j, y, v, i, p) => `${a}. ${t}[J]. ${j}, ${y}, ${v}(${i}): ${p}.` },
  'APA': { name: 'APA 7th', fmt: (a, t, j, y, v, i, p) => `${a} (${y}). ${t}. ${j}, ${v}(${i}), ${p}.` },
  'MLA': { name: 'MLA 9th', fmt: (a, t, j, y, v, i, p) => `${a}. "${t}." ${j}, vol. ${v}, no. ${i}, ${y}, pp. ${p}.` },
  'Harvard': { name: 'Harvard', fmt: (a, t, j, y, v, i, p) => `${a} (${y}) '${t}', ${j}, ${v}(${i}), pp. ${p}.` },
}

// ── 停用词 ──
const stopWords = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要',
  '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些', '所', '为', '所以',
  '因为', '但是', '然而', '然后', '如果', '虽然', '可以', '使用', '进行', '通过', '根据', '基于', '提出', '研究',
  '本文', '分析', '方法', '结果', '实验', '数据', '模型', '采用', '利用', '包括', '一种', '该', '其', '其中', '具有',
  '主要', '不同', '同时', '分别', '相关', '显著', '表明', '显示', '发现',   '验证', '证明',
])

// ── 一键示例数据 ──
const PAPER_EXAMPLES = {
  abstract: '本文提出了一种基于图神经网络的药物分子性质预测方法。首先构建分子图结构，利用消息传递神经网络学习原子级特征表示；然后在多个基准数据集上进行实验验证，包括Tox21、HIV、ClinTox等数据集；实验结果表明，该方法在AUC-ROC指标上相比现有方法平均提升了3.2个百分点，同时在可解释性分析中成功识别出与毒性相关的关键官能团。本研究为药物发现的早期筛选提供了有效的计算工具。',
  outline: '基于深度学习的遥感图像变化检测研究',
  proposal: '基于大语言模型的学术论文自动审稿系统',
}

function extractKeywords(text) {
  if (!text.trim()) return []
  const cleaned = text.replace(/[，。；：！？、""''（）《》【】\n\r\d]/g, ' ')
  const words = cleaned.split(/\s+/).filter(w => w.length >= 2)
  const freq = {}
  words.forEach(w => { if (!stopWords.has(w) && w.length >= 2) freq[w] = (freq[w] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w, c]) => ({ word: w, count: c }))
}

const TABS = [
  { id: 'abstract', icon: FileText, label: '摘要助手', ai: true },
  { id: 'outline', icon: ListOrdered, label: '论文大纲', ai: true },
  { id: 'proposal', icon: Target, label: '开题辅助', ai: true },
  { id: 'reference', icon: BookOpen, label: '参考文献', ai: false },
  { id: 'text-to-table', icon: Table, label: '文字转表格', ai: true },
  { id: 'table', icon: Table2, label: '三线表', ai: false },
  { id: 'text-to-three', icon: Table2, label: '文字转三线表', ai: true },
  { id: 'keywords', icon: Hash, label: '关键词', ai: false },
  { id: 'stats', icon: PieChart, label: '字数统计', ai: false },
]

export default function PaperHub() {
  const { submitTask } = useTask()
  const [active, setActive] = useState('abstract')
  const [copied, setCopied] = useState(false)

  // ── AI Abstract ──
  const [aiAbstractInput, setAiAbstractInput] = useState('')
  const [aiAbstractStyle, setAiAbstractStyle] = useState('结构化')
  const [aiAbstractLoading, setAiAbstractLoading] = useState(false)
  const [aiAbstractResult, setAiAbstractResult] = useState('')
  const [aiAbstractError, setAiAbstractError] = useState('')

  // ── Local Abstract ──
  const [localTemplate, setLocalTemplate] = useState('structured')
  const [localFields, setLocalFields] = useState({})
  const [localResult, setLocalResult] = useState('')

  // ── AI Outline ──
  const [outlineTitle, setOutlineTitle] = useState('')
  const [outlineType, setOutlineType] = useState('standard')
  const [aiOutlineLoading, setAiOutlineLoading] = useState(false)
  const [aiOutlineResult, setAiOutlineResult] = useState('')
  const [aiOutlineError, setAiOutlineError] = useState('')
  const [localOutlineResult, setLocalOutlineResult] = useState(null)

  // ── AI Proposal ──
  const [proposalTopic, setProposalTopic] = useState('')
  const [proposalLoading, setProposalLoading] = useState(false)
  const [proposalResult, setProposalResult] = useState('')
  const [proposalError, setProposalError] = useState('')

  // ── Reference ──
  const [refFormat, setRefFormat] = useState('GB')
  const [refAuthors, setRefAuthors] = useState('张三, 李四')
  const [refTitle, setRefTitle] = useState('基于深度学习的数据分析方法研究')
  const [refJournal, setRefJournal] = useState('计算机学报')
  const [refYear, setRefYear] = useState('2024')
  const [refVolume, setRefVolume] = useState('47')
  const [refIssue, setRefIssue] = useState('3')
  const [refPages, setRefPages] = useState('512-528')
  const [refResult, setRefResult] = useState('')

  // ── Table ──
  const [tableData, setTableData] = useState('项目,方法A,方法B,方法C\n准确率,92.3%,88.7%,95.1%\n召回率,89.5%,85.2%,93.4%')
  const [tableHtml, setTableHtml] = useState('')

  // ── AI 文字转表格 ──
  const [textTableInput, setTextTableInput] = useState('')
  const [textTableLoading, setTextTableLoading] = useState(false)
  const [textTableResult, setTextTableResult] = useState('')
  const [textTableHtml, setTextTableHtml] = useState('')
  const [textTableError, setTextTableError] = useState('')

  // ── AI 文字转三线表 ──
  const [threeLineInput, setThreeLineInput] = useState('')
  const [threeLineLoading, setThreeLineLoading] = useState(false)
  const [threeLineResult, setThreeLineResult] = useState('')
  const [threeLineHtml, setThreeLineHtml] = useState('')
  const [threeLineError, setThreeLineError] = useState('')

  // ── CSV → Table HTML 工具 ──
  function csvToTableHtml(csv, threeLine = false) {
    const rows = csv.trim().split('\n').filter(r => r.trim())
    if (!rows.length) return ''
    const parseRow = (r) => {
      const cells = []; let cur = ''; let inQuote = false
      for (let i = 0; i < r.length; i++) {
        if (r[i] === '"') { inQuote = !inQuote }
        else if (r[i] === ',' && !inQuote) { cells.push(cur.trim()); cur = '' }
        else { cur += r[i] }
      }
      cells.push(cur.trim())
      return cells
    }
    const head = parseRow(rows[0])
    const data = rows.slice(1).map(parseRow)
    const maxLen = Math.max(head.length, ...data.map(r => r.length))

    const tdStyle = threeLine
      ? 'padding:6px 8px;text-align:center;font-size:9pt;font-family:SimSun,serif'
      : 'padding:6px 8px;text-align:center;font-size:9pt;font-family:SimSun,serif;border:0.5pt solid #999'

    const thStyle = threeLine
      ? 'border-top:1.5pt solid #000;border-bottom:0.75pt solid #000;padding:6px 8px;text-align:center;font-size:9pt;font-weight:bold;font-family:SimSun,serif'
      : 'border:0.5pt solid #555;background:#f3f4f6;padding:6px 8px;text-align:center;font-size:9pt;font-weight:bold;font-family:SimSun,serif'

    const thHtml = head.map(x => `<th style="${thStyle}">${x}</th>`).join('')
    const bodyHtml = data.map(row => {
      const cells = []
      for (let i = 0; i < maxLen; i++) cells.push(row[i] || '')
      return `<tr>${cells.map(c => `<td style="${tdStyle}">${c}</td>`).join('')}</tr>`
    }).join('')

    const footHtml = threeLine
      ? `<tfoot><tr>${head.map(() => '<td style="border-bottom:1.5pt solid #000;padding:0"></td>').join('')}</tr></tfoot>`
      : ''

    return `<table style="border-collapse:collapse;width:100%;font-family:SimSun,serif;font-size:9pt"><thead><tr>${thHtml}</tr></thead><tbody>${bodyHtml}</tbody>${footHtml}</table>`
  }

  // ── Keywords ──
  const [keywordText, setKeywordText] = useState('')
  const keywords = useMemo(() => extractKeywords(keywordText), [keywordText])

  // ── Stats ──
  const [statsText, setStatsText] = useState('')
  const textStats = useMemo(() => {
    const t = statsText
    const cn = (t.match(/[\u4e00-\u9fff]/g) || []).length
    const en = (t.match(/[a-zA-Z]+/g) || []).length
    const paras = t.split(/\n+/).filter(p => p.trim()).length
    const sens = t.split(/[。！？.!?\n]+/).filter(s => s.trim()).length
    const sections = []
    const secReg = /(?:^|\n)(第[一二三四五六七八九十\d]+章|[\d]+[\.\s、]|[（(][一二三四五六七八九十\d]+[)）])\s*(.+)/g
    let m, lastIdx = 0, lastTitle = '正文'
    while ((m = secReg.exec(t)) !== null) {
      if (m.index > lastIdx && lastTitle) {
        const sc = (t.substring(lastIdx, m.index).match(/[\u4e00-\u9fff]/g) || []).length
        if (sc > 10) sections.push({ title: lastTitle, chars: sc })
      }
      lastTitle = (m[1] + ' ' + (m[2] || '')).trim(); lastIdx = m.index
    }
    const lc = (t.substring(lastIdx).match(/[\u4e00-\u9fff]/g) || []).length
    if (lc > 10) sections.push({ title: lastTitle, chars: lc })
    return { cn, en, paras, sens, sections, pages: Math.ceil(cn / 800), chars: t.length }
  }, [statsText])

  // ── AI 操作 ──
  async function runAiAbstract(background = false) {
    if (!aiAbstractInput.trim()) return
    if (!background) { setAiAbstractLoading(true); setAiAbstractError(''); setAiAbstractResult('') }

    const name = `AI摘要 · ${aiAbstractInput.slice(0, 20)}...`
    const asyncFn = () => generateAbstract(aiAbstractInput, aiAbstractStyle)

    if (background) {
      submitTask(name, asyncFn)
    } else {
      try { setAiAbstractResult(await asyncFn()) }
      catch (e) { setAiAbstractError(e.message) }
      finally { setAiAbstractLoading(false) }
    }
  }

  async function runAiOutline(background = false) {
    if (!outlineTitle.trim()) return
    if (!background) { setAiOutlineLoading(true); setAiOutlineError(''); setAiOutlineResult('') }

    const name = `AI大纲 · ${outlineTitle.slice(0, 20)}`
    const asyncFn = () => generateProposal(outlineTitle)

    if (background) {
      submitTask(name, asyncFn)
    } else {
      try { setAiOutlineResult(await asyncFn()) }
      catch (e) { setAiOutlineError(e.message) }
      finally { setAiOutlineLoading(false) }
    }
  }

  async function runProposal(background = false) {
    if (!proposalTopic.trim()) return
    if (!background) { setProposalLoading(true); setProposalError(''); setProposalResult('') }

    const name = `开题辅助 · ${proposalTopic.slice(0, 20)}`
    const asyncFn = () => generateProposal(proposalTopic)

    if (background) {
      submitTask(name, asyncFn)
    } else {
      try { setProposalResult(await asyncFn()) }
      catch (e) { setProposalError(e.message) }
      finally { setProposalLoading(false) }
    }
  }

  // ── 文字转表格 ──
  async function runTextToTable(background = false) {
    if (!textTableInput.trim()) return
    if (!background) { setTextTableLoading(true); setTextTableError(''); setTextTableResult(''); setTextTableHtml('') }

    const name = `文字转表格 · ${textTableInput.slice(0, 20)}...`
    const asyncFn = async () => {
      const csv = await textToTableData(textTableInput)
      const html = csvToTableHtml(csv, false)
      return { csv, html }
    }

    if (background) {
      submitTask(name, asyncFn)
    } else {
      try {
        const { csv, html } = await asyncFn()
        setTextTableResult(csv); setTextTableHtml(html)
      } catch (e) { setTextTableError(e.message) }
      finally { setTextTableLoading(false) }
    }
  }

  // ── 文字转三线表 ──
  async function runTextToThreeLine(background = false) {
    if (!threeLineInput.trim()) return
    if (!background) { setThreeLineLoading(true); setThreeLineError(''); setThreeLineResult(''); setThreeLineHtml('') }

    const name = `文字转三线表 · ${threeLineInput.slice(0, 20)}...`
    const asyncFn = async () => {
      const csv = await textToTableData(threeLineInput)
      const html = csvToTableHtml(csv, true)
      return { csv, html }
    }

    if (background) {
      submitTask(name, asyncFn)
    } else {
      try {
        const { csv, html } = await asyncFn()
        setThreeLineResult(csv); setThreeLineHtml(html)
      } catch (e) { setThreeLineError(e.message) }
      finally { setThreeLineLoading(false) }
    }
  }

  // ── 本地操作 ──
  function genLocalAbstract() { setLocalResult(abstractTemplates.find(t => t.id === localTemplate)?.generate(localFields) || '') }
  function genLocalOutline() {
    const tpl = outlineTemplates.find(t => t.id === outlineType)
    if (tpl) setLocalOutlineResult({ title: outlineTitle || '论文题目', sections: tpl.sections, type: tpl.label })
  }
  function genRef() {
    const fmt = refFormats[refFormat]
    if (fmt) setRefResult(fmt.fmt(refAuthors, refTitle, refJournal, refYear, refVolume, refIssue, refPages))
  }
  function genTable() {
    const rows = tableData.trim().split('\n').filter(r => r.trim())
    if (!rows.length) { setTableHtml(''); return }
    const h = rows[0].split(',').map(c => c.trim())
    const d = rows.slice(1).map(r => r.split(',').map(c => c.trim()))
    setTableHtml(`<table style="border-collapse:collapse;width:100%;font-family:SimSun,serif;font-size:10pt"><thead><tr>${
      h.map(x => `<th style="border-top:1.5pt solid #000;border-bottom:0.75pt solid #000;padding:6px 8px;text-align:center">${x}</th>`).join('')
    }</tr></thead><tbody>${d.map(row => `<tr>${
      row.map(c => `<td style="padding:6px 8px;text-align:center;border-bottom:0.5pt solid #ddd">${c}</td>`).join('')
    }</tr>`).join('')}</tbody><tfoot><tr>${
      h.map(() => '<td style="border-bottom:1.5pt solid #000;padding:0"></td>').join('')
    }</tr></tfoot></table>`)
  }
  async function copyTable() {
    if (!tableHtml) return
    await copyHtml(tableHtml); setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  async function doCopy(text) { await copyText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
          <BookOpen size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">论文工具</h2>
          <p className="text-sm text-gray-500">摘要 · 大纲 · 开题 · 文字转表格 · 三线表 · 文字转三线表 · 关键词 · 字数统计 · 结果一键复制到 Word</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {TABS.map(t => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              active === t.id ? (t.ai ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-gray-100 border-gray-400 text-gray-800')
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <Icon size={13} />{t.label}
            {t.ai && <Sparkles size={10} className="text-violet-400" />}
          </button>
        )})}
      </div>

      {/* ──── AI 摘要 ──── */}
      {active === 'abstract' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-violet-500" /><span className="font-semibold text-sm">AI 智能摘要</span></div>
            <div className="flex gap-2 mb-3">
                  <select value={aiAbstractStyle} onChange={e => setAiAbstractStyle(e.target.value)} className="text-xs border rounded-lg px-2 py-1.5">
                    <option value="结构化">结构化摘要</option><option value="单段式">单段式摘要</option><option value="英文摘要">英文摘要</option>
                  </select>
                </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">粘贴论文正文，AI 自动生成摘要</span>
              <button onClick={() => { setAiAbstractInput(PAPER_EXAMPLES.abstract); setAiAbstractResult(''); setAiAbstractError('') }}
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                <Sparkles size={12} />试试示例
              </button>
            </div>
                <textarea value={aiAbstractInput} onChange={e => setAiAbstractInput(e.target.value)} rows={5}
                  className="w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-violet-400" placeholder="粘贴论文正文内容，AI 自动生成摘要..." />
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button onClick={() => runAiAbstract(false)} disabled={aiAbstractLoading || !aiAbstractInput.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:bg-gray-300">
                    {aiAbstractLoading ? <><Loader2 size={14} className="animate-spin" />生成中...</> : <><Sparkles size={14} />AI 生成摘要</>}
                  </button>
                  <button onClick={() => runAiAbstract(true)} disabled={aiAbstractLoading || !aiAbstractInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                    <ArrowLeftToLine size={14} />放后台
                  </button>
                </div>
                {aiAbstractError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{aiAbstractError}</div>}
                {aiAbstractResult && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">{aiAbstractResult.length} 字符 · 复制后直接 Ctrl+V 粘贴到 Word</span><button onClick={() => doCopy(aiAbstractResult)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">{copied ? '已复制' : '📋 复制到Word'}</button></div>
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{aiAbstractResult}</pre>
                  </div>
                )}
          </div>

          {/* 本地摘要模板 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-blue-500" /><span className="font-semibold text-sm">手动填写摘要</span></div>
            <div className="flex flex-wrap gap-2 mb-3">
              {abstractTemplates.map(t => (
                <button key={t.id} onClick={() => { setLocalTemplate(t.id); setLocalFields({}); setLocalResult('') }}
                  className={`px-3 py-1.5 rounded-lg text-xs border ${localTemplate === t.id ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{t.label}</button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {abstractTemplates.find(t => t.id === localTemplate)?.fields.map(f => (
                <div key={f.key} className={f.key === 'content' ? 'sm:col-span-2' : ''}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <textarea value={localFields[f.key] || ''} onChange={e => setLocalFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full border rounded-lg p-2.5 text-sm resize-none outline-none" rows={f.key === 'content' ? 4 : 2} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <button onClick={genLocalAbstract} className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">生成摘要</button>
            {localResult && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">{localResult.replace(/\s/g, '').length} 字符</span><button onClick={() => doCopy(localResult)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">{copied ? '已复制' : '复制'}</button></div>
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{localResult}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── 大纲 ──── */}
      {active === 'outline' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-violet-500" /><span className="font-semibold text-sm">AI 智能大纲</span></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">输入论文题目，AI 生成详细大纲</span>
              <button onClick={() => { setOutlineTitle(PAPER_EXAMPLES.outline); setAiOutlineResult(''); setAiOutlineError('') }}
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                <Sparkles size={12} />试试示例
              </button>
            </div>
            <input value={outlineTitle} onChange={e => setOutlineTitle(e.target.value)} placeholder="输入论文题目，AI 生成详细大纲..."
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 mb-3" />
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => runAiOutline(false)} disabled={aiOutlineLoading || !outlineTitle.trim()}
                className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:bg-gray-300 flex items-center gap-1.5">
                {aiOutlineLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}生成
              </button>
              <button onClick={() => runAiOutline(true)} disabled={aiOutlineLoading || !outlineTitle.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                <ArrowLeftToLine size={14} />放后台
              </button>
            </div>
                {aiOutlineError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{aiOutlineError}</div>}
                {aiOutlineResult && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">AI 生成大纲 · 复制后直接粘贴到 Word</span><button onClick={() => doCopy(aiOutlineResult)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">{copied ? '已复制' : '📋 复制到Word'}</button></div>
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{aiOutlineResult}</pre>
                  </div>
                )}
          </div>
          {/* 本地大纲模板 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3"><ListOrdered size={16} className="text-blue-500" /><span className="font-semibold text-sm">模板大纲</span></div>
            <div className="flex gap-4 mb-3">
              <select value={outlineType} onChange={e => setOutlineType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                {outlineTemplates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <button onClick={genLocalOutline} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">生成大纲</button>
            </div>
            {localOutlineResult && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-center mb-3">{localOutlineResult.title}</h3>
                <ol className="space-y-1.5">
                  {localOutlineResult.sections.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                      <span className="pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── 开题辅助 ──── */}
      {active === 'proposal' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-violet-500" /><span className="font-semibold text-sm">AI 开题辅助</span></div>
          <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">输入研究方向或题目，AI 生成开题要点</span>
              <button onClick={() => { setProposalTopic(PAPER_EXAMPLES.proposal); setProposalResult(''); setProposalError('') }}
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                <Sparkles size={12} />试试示例
              </button>
            </div>
          <textarea value={proposalTopic} onChange={e => setProposalTopic(e.target.value)} rows={3}
                className="w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-violet-400" placeholder="输入研究方向，如「基于图神经网络的药物分子性质预测」..." />
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button onClick={() => runProposal(false)} disabled={proposalLoading || !proposalTopic.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:bg-gray-300">
                  {proposalLoading ? <><Loader2 size={14} className="animate-spin" />生成中...</> : <><Sparkles size={14} />AI 生成开题要点</>}
                </button>
                <button onClick={() => runProposal(true)} disabled={proposalLoading || !proposalTopic.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                  <ArrowLeftToLine size={14} />放后台
                </button>
              </div>
              {proposalError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{proposalError}</div>}
              {proposalResult && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">开题报告要点 · 复制后直接粘贴到 Word</span><button onClick={() => doCopy(proposalResult)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">{copied ? '已复制' : '📋 复制到Word'}</button></div>
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{proposalResult}</pre>
                </div>
              )}
        </div>
      )}

      {/* ──── 参考文献 ──── */}
      {active === 'reference' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><BookOpen size={18} className="text-blue-500" /><span className="font-semibold">参考文献格式化</span></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div><label className="text-xs text-gray-500 mb-1 block">格式</label><select value={refFormat} onChange={e => setRefFormat(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">{Object.entries(refFormats).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">作者</label><input value={refAuthors} onChange={e => setRefAuthors(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">标题</label><input value={refTitle} onChange={e => setRefTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">期刊</label><input value={refJournal} onChange={e => setRefJournal(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">年份</label><input value={refYear} onChange={e => setRefYear(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">卷(期):页码</label><div className="flex gap-1"><input value={refVolume} onChange={e => setRefVolume(e.target.value)} className="flex-1 border rounded-lg px-2 py-2 text-sm" placeholder="卷" /><input value={refIssue} onChange={e => setRefIssue(e.target.value)} className="w-14 border rounded-lg px-2 py-2 text-sm" placeholder="期" /><input value={refPages} onChange={e => setRefPages(e.target.value)} className="flex-1 border rounded-lg px-2 py-2 text-sm" placeholder="页码" /></div></div>
          </div>
          <button onClick={genRef} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">生成引用</button>
          {refResult && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 flex items-start justify-between gap-3">
              <p className="text-sm font-mono leading-relaxed">{refResult}</p>
              <button onClick={() => doCopy(refResult)} className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded-lg text-xs hover:bg-gray-100 flex-shrink-0"><Copy size={12} />{copied ? '已复制' : '复制'}</button>
            </div>
          )}
        </div>
      )}

      {/* ──── 三线表 ──── */}
      {active === 'table' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3"><Table2 size={18} className="text-blue-500" /><span className="font-semibold">三线表生成器</span></div>
          <p className="text-xs text-gray-400 mb-3">逗号分隔列，第一行表头。生成后「复制到Word」直接粘贴。</p>
          <textarea value={tableData} onChange={e => setTableData(e.target.value)} className="w-full h-32 border rounded-lg p-3 text-sm font-mono resize-none mb-3" />
          <button onClick={genTable} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><RefreshCw size={14} className="inline mr-1" />生成三线表</button>
          {tableHtml && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 flex items-center justify-between">
                预览<span> </span>
                <button onClick={copyTable} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium">{copied ? <Check size={11} /> : <Copy size={11} />}{copied ? '已复制' : '复制到Word'}</button>
              </div>
              <div className="p-6 overflow-x-auto" dangerouslySetInnerHTML={{ __html: tableHtml }} />
            </div>
          )}
        </div>
      )}

      {/* ──── AI 文字转表格 ──── */}
      {active === 'text-to-table' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-violet-500" /><span className="font-semibold text-sm">AI 文字转表格</span></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">输入描述性文字，AI 自动生成结构化表格。复制后直接 Ctrl+V 粘贴到 Word</span>
              <button onClick={() => { setTextTableInput('在三个数据集上，ResNet-50 准确率为 76.2%，F1 得分为 0.81；ViT-Base 准确率为 82.5%，F1 得分为 0.87；我们的方法准确率为 89.1%，F1 得分为 0.93。三种方法的参数量分别为 25M、86M 和 42M，推理速度分别为 15ms、32ms 和 12ms。'); setTextTableResult(''); setTextTableHtml(''); setTextTableError('') }}
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                <Sparkles size={12} />试试示例
              </button>
            </div>
            <textarea value={textTableInput} onChange={e => setTextTableInput(e.target.value)} rows={4}
              className="w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-violet-400" placeholder="输入文字描述，AI 自动提取数据生成表格，如「方法A准确率92%、F1=0.87，方法B准确率88%、F1=0.85...」" />
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button onClick={() => runTextToTable(false)} disabled={textTableLoading || !textTableInput.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:bg-gray-300">
                {textTableLoading ? <><Loader2 size={14} className="animate-spin" />生成中...</> : <><Sparkles size={14} />AI 生成表格</>}
              </button>
              <button onClick={() => runTextToTable(true)} disabled={textTableLoading || !textTableInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                <ArrowLeftToLine size={14} />放后台
              </button>
            </div>
            {textTableError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{textTableError}</div>}
            {textTableHtml && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 flex items-center justify-between">
                  <span>表格预览 · {textTableResult.split('\n').filter(l => l.trim()).length - 1} 行数据</span>
                  <button onClick={() => { copyHtml(textTableHtml); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium">
                    {copied ? <Check size={11} /> : <Copy size={11} />}{copied ? '已复制' : '复制到Word'}
                  </button>
                </div>
                <div className="p-6 overflow-x-auto" dangerouslySetInnerHTML={{ __html: textTableHtml }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── AI 文字转三线表 ──── */}
      {active === 'text-to-three' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-violet-500" /><span className="font-semibold text-sm">AI 文字转三线表</span></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">输入描述性文字，AI 自动生成学术三线表（顶线粗、栏目线细、底线粗）。复制后 Ctrl+V 直接粘贴到 Word</span>
              <button onClick={() => { setThreeLineInput('使用三种不同的预训练模型在CIFAR-10上进行对比实验：ResNet-50测试精度94.2%，参数量25.6M；DenseNet-121测试精度95.1%，参数量7.9M；EfficientNet-B3测试精度95.7%，参数量12.2M。训练耗时分别为2.3h、3.1h、1.8h。'); setThreeLineResult(''); setThreeLineHtml(''); setThreeLineError('') }}
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                <Sparkles size={12} />试试示例
              </button>
            </div>
            <textarea value={threeLineInput} onChange={e => setThreeLineInput(e.target.value)} rows={4}
              className="w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-violet-400" placeholder="输入文字描述，AI 自动提取数据生成学术三线表..." />
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button onClick={() => runTextToThreeLine(false)} disabled={threeLineLoading || !threeLineInput.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:bg-gray-300">
                {threeLineLoading ? <><Loader2 size={14} className="animate-spin" />生成中...</> : <><Sparkles size={14} />AI 生成三线表</>}
              </button>
              <button onClick={() => runTextToThreeLine(true)} disabled={threeLineLoading || !threeLineInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                <ArrowLeftToLine size={14} />放后台
              </button>
            </div>
            {threeLineError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{threeLineError}</div>}
            {threeLineHtml && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500 flex items-center justify-between">
                  <span>三线表预览 · {threeLineResult.split('\n').filter(l => l.trim()).length - 1} 行数据 · 学术三线表标准格式</span>
                  <button onClick={() => { copyHtml(threeLineHtml); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium">
                    {copied ? <Check size={11} /> : <Copy size={11} />}{copied ? '已复制' : '复制到Word'}
                  </button>
                </div>
                <div className="p-6 overflow-x-auto" dangerouslySetInnerHTML={{ __html: threeLineHtml }} />
              </div>
            )}
          </div>
          {/* 三线表说明 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">学术三线表规范</h4>
            <div className="grid sm:grid-cols-3 gap-3 text-xs text-gray-600">
              <div>
                <strong className="text-gray-700">顶线（反线）</strong>
                <p className="text-gray-500 mt-0.5">1.5pt 粗线，表格顶部</p>
              </div>
              <div>
                <strong className="text-gray-700">栏目线</strong>
                <p className="text-gray-500 mt-0.5">0.75pt 细线，表头下方</p>
              </div>
              <div>
                <strong className="text-gray-700">底线（反线）</strong>
                <p className="text-gray-500 mt-0.5">1.5pt 粗线，表格底部</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">生成的三线表符合 GB/T 7713 学术论文表格规范，可直接粘贴到 Word 中使用。</p>
          </div>
        </div>
      )}

      {/* ──── 关键词 ──── */}
      {active === 'keywords' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3"><Hash size={18} className="text-blue-500" /><span className="font-semibold">关键词提取</span></div>
          <textarea value={keywordText} onChange={e => setKeywordText(e.target.value)} className="w-full h-44 border rounded-lg p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-400" placeholder="粘贴论文摘要或正文，自动分析高频词..." />
          {keywords.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{keywords.length} 个关键词</span>
                <button onClick={() => doCopy(keywords.map(k => k.word).join('；'))} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">{copied ? '已复制' : '复制关键词'}</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: `rgba(59,130,246,${Math.max(0.1, 1 - i * 0.1)})`, color: i < 3 ? '#fff' : '#1e40af' }}>{kw.word}<span className="ml-1.5 text-xs opacity-70">{kw.count}</span></span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──── 字数统计 ──── */}
      {active === 'stats' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3"><PieChart size={18} className="text-blue-500" /><span className="font-semibold">论文字数统计</span></div>
          <textarea value={statsText} onChange={e => setStatsText(e.target.value)} className="w-full h-56 border rounded-lg p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-400" placeholder="粘贴论文全文..." />
          {statsText && (
            <>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[{ v: textStats.cn, l: '中文字数', c: 'blue' }, { v: textStats.en, l: '英文单词', c: 'green' }, { v: textStats.paras, l: '段落数', c: 'purple' }, { v: textStats.sens, l: '句子数', c: 'orange' }, { v: `~${textStats.pages}`, l: '预估页数', c: 'rose' }]
                  .map((item, i) => (
                    <div key={i} className={`bg-${item.c}-50 rounded-lg p-3 text-center`}>
                      <div className={`text-xl font-bold text-${item.c}-700`}>{typeof item.v === 'number' ? item.v.toLocaleString() : item.v}</div>
                      <div className={`text-[11px] text-${item.c}-500`}>{item.l}</div>
                    </div>
                  ))}
              </div>
              {textStats.sections.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-gray-600 mb-2">章节分布</div>
                  <div className="space-y-1.5">
                    {textStats.sections.map((s, i) => (
                      <div key={i} className="flex items-center gap-3"><span className="text-xs text-gray-500 w-40 truncate">{s.title}</span><div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (s.chars / Math.max(...textStats.sections.map(x => x.chars))) * 100)}%` }} /></div><span className="text-xs text-gray-600 w-14 text-right">{s.chars.toLocaleString()}字</span></div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
