import { useState, useRef, useEffect } from 'react'
import {
  Wand2, Sparkles, ClipboardCheck, Languages, Zap,
  GitCompare, Copy, Loader2, Check, AlertTriangle,
  PenTool, ArrowLeftToLine,
} from 'lucide-react'
import { copyText } from '../utils'
import { polishText, rephraseText, checkGrammar, translateText } from '../services/ai'
import { useTask } from '../contexts/TaskContext'

// ── 错别字词典 ──
const commonTypos = {
  // 常见高频错别字（单字/双字）
  '做为': '作为', '在次': '再次', '己经': '已经', '以经': '已经',
  '知到': '知道', '进期': '近期', '结速': '结束', '平圴': '平均',
  '计录': '记录', '关建': '关键', '建义': '建议', '显视': '显示',
  '重覆': '重复', '既使': '即使', '按装': '安装',
  '汽水': '汽水(保留)', // 排除误报：汽本身是正确用字
  // 成语类
  '再接再励': '再接再厉', '一愁莫展': '一筹莫展', '一股作气': '一鼓作气',
  '一如继往': '一如既往', '不可名壮': '不可名状', '不径而走': '不胫而走',
  '中流抵柱': '中流砥柱', '出奇不意': '出其不意', '出人投地': '出人头地',
  '变本加利': '变本加厉', '因地治宜': '因地制宜', '大声急呼': '大声疾呼',
  '天翻地复': '天翻地覆', '手屈一指': '首屈一指', '既往不究': '既往不咎',
  '暗然失色': '黯然失色', '甘败下风': '甘拜下风', '迫不急待': '迫不及待',
  '默守成规': '墨守成规', '黄梁一梦': '黄粱一梦', '灸手可热': '炙手可热',
  // 学术论文常见错字
  '实验结过': '实验结果', '数据分折': '数据分析', '研究方发': '研究方法',
  '结轮': '结论', '参于': '参与', '通讨': '通过', '影向': '影响',
  '关糸': '关系', '重耍': '重要', '存再': '存在', '题出': '提出',
  '说名': '说明', '证名': '证明', '表名': '表明',
  // 更多常见错字
  '必竟': '毕竟', '布署': '部署', '采撷': '采撷(保留)',
  '凑和': '凑合', '渡假': '度假', '防碍': '妨碍', '幅射': '辐射',
  '复盖': '覆盖', '负出': '付出', '概算': '概算(保留)', '高恣态': '高姿态',
  '供献': '贡献', '共实': '其实', '贯连': '关联', '归缩': '归宿',
  '过费': '花费', '寒喧': '寒暄', '合协': '合作', '宏扬': '弘扬',
  '恢张': '恢复', '汇萃': '荟萃', '既使': '即使', '即然': '既然',
  '佳宾': '嘉宾', '简接': '间接', '建全': '健全', '交插': '交叉',
  '秸构': '结构', '介释': '解释', '尽然': '竟然', '峻工': '竣工',
  '克苦': '刻苦', '宽宏大量': '宽洪大量', '蓝球': '篮球', '烂用': '滥用',
  '利弊': '利弊(保留)', '连系': '联系', '了草': '潦草', '劣迹': '劣迹(保留)',
  '临摩': '临摹', '另令': '命令', '论讨': '讨论', '脉博': '脉搏',
  '慢延': '绵延', '矛茅': '矛盾', '冒然': '贸然', '密秘': '秘密',
  '免强': '勉强', '磨擦': '摩擦', '暮蔼': '暮霭', '哪么': '那么',
  '那怕': '哪怕', '内才': '内涵', '年令': '年龄', '欧州': '欧洲',
  '陪偿': '赔偿', '配植': '配置', '启谛': '启示', '气慨': '气概',
  '恰商': '洽商', '前题': '前提', '切磋': '切磋(保留)', '清淅': '清晰',
  '屈指可数': '屈指可数(保留)', '融恰': '融洽', '溶化': '融化',
  '善长': '擅长', '伸张': '申张', '神密': '神秘', '世介': '世界',
  '事以愿违': '事与愿违', '誓势': '气势', '受予': '授予', '松驰': '松弛',
  '随声附合': '随声附和', '提练': '提炼', '题纲': '题纲(保留)', '廷议': '庭议',
  '通辑': '通缉', '完璧归赵': '完璧归赵', '妄费心机': '枉费心机',
  '威协': '威胁', '文恬武嘻': '文恬武嬉', '无遗无挂': '无忧无虑',
  '喜笑颜开': '喜笑颜开(保留)', '消毁': '销毁', '宣泄': '宣泄(保留)',
  '悬涯': '悬崖', '严俊': '严肃', '要紧': '要紧(保留)', '一如继往': '一如既往',
  '意正词严': '义正词严', '引伸': '引申', '营做': '营造', '忧柔寡断': '优柔寡断',
  '有持无恐': '有恃无恐', '与日具增': '与日俱增', '原形必露': '原形毕露',
  '责无旁代': '责无旁贷', '仗义直言': '仗义执言', '针贬': '针砭',
  '真知卓见': '真知灼见', '震憾': '震撼', '直接': '直截(保留)',
  '至理名言': '至理名言(保留)', '志大才疏': '志大才疏(保留)',
  '中肯': '中肯(保留)', '专研': '钻研', '装璜': '装潢',
  '姿式': '姿势', '自力更生': '自力更生(保留)', '走头无路': '走投无路',
}

// ── Diff算法 ──
function computeDiff(oldText, newText) {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const m = oldLines.length, n = newLines.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldLines[i - 1] === newLines[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  const result = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'same', old: oldLines[i - 1], new: newLines[j - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', old: '', new: newLines[j - 1] })
      j--
    } else {
      result.unshift({ type: 'remove', old: oldLines[i - 1], new: '' })
      i--
    }
  }

  // 对 changed 的行进行字符级差异高亮
  return result.map((line, idx) => {
    if (line.type !== 'remove' && line.type !== 'add') return line

    // 找到相邻的 add/remove 配对，做字符级对比
    if (idx < result.length - 1) {
      const next = result[idx + 1]
      if ((line.type === 'remove' && next.type === 'add') || (line.type === 'add' && next.type === 'remove')) {
        // 标记为可配对
        return { ...line, hasPair: true }
      }
    }
    return line
  })
}

// 字符级差异高亮
function highlightCharDiff(oldLine, newLine) {
  const oldChars = oldLine.split('')
  const newChars = newLine.split('')
  const m = oldChars.length, n = newChars.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldChars[i - 1] === newChars[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])

  // 回溯标记相同/不同
  const sameOld = new Array(m).fill(false)
  const sameNew = new Array(n).fill(false)
  let ii = m, jj = n
  while (ii > 0 && jj > 0) {
    if (oldChars[ii - 1] === newChars[jj - 1]) { sameOld[ii - 1] = true; sameNew[jj - 1] = true; ii--; jj-- }
    else if (dp[ii - 1][jj] >= dp[ii][jj - 1]) ii--
    else jj--
  }

  const renderOld = oldChars.map((ch, i) =>
    sameOld[i]
      ? ch
      : `<span class="bg-red-200 text-red-800 font-bold px-0.5 rounded">${ch}</span>`
  ).join('')

  const renderNew = newChars.map((ch, i) =>
    sameNew[i]
      ? ch
      : `<span class="bg-green-200 text-green-800 font-bold px-0.5 rounded">${ch}</span>`
  ).join('')

  return { renderOld, renderNew }
}

const AI_TABS = [
  { id: 'polish', icon: Wand2, label: 'AI 润色', desc: '4种风格，一键学术化' },
  { id: 'rephrase', icon: Sparkles, label: 'AI 降重', desc: '多版本改写' },
  { id: 'grammar', icon: ClipboardCheck, label: 'AI 纠错', desc: '语法/标点' },
  { id: 'translate', icon: Languages, label: 'AI 翻译', desc: '学术风格互译' },
]

// ── 一键示例数据 ──
const EXAMPLES = {
  polish: {
    input: '这个方法的效果比较好，比之前的方法都要好很多。我们在实验里面做了很多对比，发现准确率提升了很多，说明我们的思路是对的。',
    note: '↓ 点击「开始」查看 AI 学术化润色效果 ↓',
  },
  rephrase: {
    input: '深度学习在近年来取得了显著的进展，尤其是在自然语言处理领域，大量的研究表明基于Transformer的模型在各种任务上都表现出了优异的性能。',
    note: '↓ AI 将生成多个不同版本的改写，降低重复率 ↓',
  },
  grammar: {
    input: '实验结果表明，该方法在准确率和召回率上均优於传统方法。然而，由于计算资源受限，我们仅在小型数据集上进行了验证，这可能是导致泛化能力不足的主要原因之一。',
    note: '↓ AI 将检查并标出语法/标点问题 ↓',
  },
  translate: {
    input: '本文提出了一种基于注意力机制的多模态融合框架，通过联合建模文本和视觉特征，显著提升了图像描述生成的质量和多样性。',
    note: '↓ 中英互译，保持学术风格 ↓',
  },
}
const LOCAL_TABS = [
  { id: 'cnen', icon: Zap, label: '中英混排', desc: '自动修正间距' },
  { id: 'diff', icon: GitCompare, label: '差异对比', desc: 'LCS算法' },
  { id: 'typo', icon: AlertTriangle, label: '错别字', desc: '中文常见错误' },
]

export default function WritingTools() {
  const { submitTask } = useTask()
  const [active, setActive] = useState('polish')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [style, setStyle] = useState('学术化')
  const [count, setCount] = useState(3)
  const [direction, setDirection] = useState('zh2en')
  const [bgTaskId, setBgTaskId] = useState(null)

  // ── Cnen ──
  const [cnenInput, setCnenInput] = useState('')
  const [cnenOutput, setCnenOutput] = useState('')
  const [cnenStats, setCnenStats] = useState(null)

  // ── Diff ──
  const [oldText, setOldText] = useState('')
  const [newText, setNewText] = useState('')
  const [diffResult, setDiffResult] = useState(null)

  // ── Typo ──
  const [typoText, setTypoText] = useState('')
  const [typoResults, setTypoResults] = useState(null)

  useEffect(() => { setInput(''); setOutput(''); setError('') }, [active])
  useEffect(() => { if (copied) { const t = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(t) } }, [copied])

  async function handleRun(background = false) {
    if (!input.trim()) return
    if (!background) {
      setLoading(true); setError(''); setOutput('')
    }
    const tab = AI_TABS.find(t => t.id === active)
    const name = `${tab?.label || 'AI'} · ${input.slice(0, 20)}...`

    const asyncFn = async () => {
      let result = ''
      switch (active) {
        case 'polish': result = await polishText(input, style); break
        case 'rephrase': result = await rephraseText(input, count); break
        case 'grammar': result = await checkGrammar(input); break
        case 'translate': result = await translateText(input, direction); break
      }
      return result
    }

    if (background) {
      // 放后台
      const taskId = submitTask(name, asyncFn)
      setBgTaskId(taskId)
      setError('')
    } else {
      // 当前页面等待
      try {
        const result = await asyncFn()
        setOutput(result)
      } catch (e) { setError(e.message) }
      finally { setLoading(false) }
    }
  }

  function copyOutput() { if (output) { navigator.clipboard.writeText(output); setCopied(true) } }

  // ── Cnen ──
  const fixSpacing = () => {
    if (!cnenInput.trim()) return
    const isCn = (ch) => /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/.test(ch)
    const isEn = (ch) => /[a-zA-Z0-9]/.test(ch)
    let result = '', changes = 0
    for (let i = 0; i < cnenInput.length; i++) {
      result += cnenInput[i]
      const next = cnenInput[i + 1]
      if (isCn(cnenInput[i]) && next && isEn(next) && next !== ' ') { result += ' '; changes++ }
      else if (isEn(cnenInput[i]) && next && isCn(next) && next !== ' ') { result += ' '; changes++ }
    }
    result = result.replace(/ {2,}/g, ' ')
    setCnenOutput(result); setCnenStats({ changes })
  }

  // ── Diff ──
  const runDiff = () => {
    if (!oldText.trim() || !newText.trim()) return
    setDiffResult(computeDiff(oldText, newText))
  }

  // ── Typo ──
  const runTypo = () => {
    const spells = []
    for (const [wrong, right] of Object.entries(commonTypos)) {
      if (right.includes('(保留)')) continue // 跳过保留项（可能是正确用字）
      let idx = 0
      while ((idx = typoText.indexOf(wrong, idx)) !== -1) {
        // 获取上下文（前后各10个字符）
        const start = Math.max(0, idx - 10)
        const end = Math.min(typoText.length, idx + wrong.length + 10)
        const context = typoText.slice(start, end)
        spells.push({
          pos: idx,
          wrong,
          right,
          context,
          highlightPos: idx - start, // 在context中错误词的起始位置
        })
        idx += wrong.length
      }
    }
    setTypoResults(spells.sort((a, b) => a.pos - b.pos))
  }

  // 渲染带高亮的原文
  const renderHighlightedText = () => {
    if (!typoResults || typoResults.length === 0) return null

    const parts = []
    let lastEnd = 0
    for (const r of typoResults) {
      if (r.pos > lastEnd) {
        parts.push({ type: 'normal', text: typoText.slice(lastEnd, r.pos) })
      }
      parts.push({ type: 'error', text: r.wrong, right: r.right })
      lastEnd = r.pos + r.wrong.length
    }
    if (lastEnd < typoText.length) {
      parts.push({ type: 'normal', text: typoText.slice(lastEnd) })
    }
    return parts
  }

  const isAiTab = ['polish', 'rephrase', 'grammar', 'translate'].includes(active)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
          <PenTool size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">智能写作</h2>
          <p className="text-sm text-gray-500">AI 驱动的论文写作辅助 · 纯本地文本工具 · 结果直接复制粘贴到 Word</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {AI_TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active === t.id ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon size={13} />{t.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LOCAL_TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active === t.id ? 'bg-gray-100 border-gray-400 text-gray-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}>
                <Icon size={13} />{t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ──── AI Tabs ──── */}
      {isAiTab && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="font-semibold text-sm text-gray-700">
                  {AI_TABS.find(t => t.id === active)?.label}
                </span>
                <div className="flex items-center gap-2">
                  {active === 'polish' && (
                    <select value={style} onChange={e => setStyle(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1.5">
                      <option value="学术化">学术化</option><option value="更简洁">更简洁</option><option value="更流畅">更流畅</option><option value="英文润色">英文润色</option>
                    </select>
                  )}
                  {active === 'rephrase' && (
                    <select value={count} onChange={e => setCount(Number(e.target.value))} className="text-xs border border-gray-200 rounded px-2 py-1.5">
                      <option value={2}>2版本</option><option value={3}>3版本</option><option value={5}>5版本</option>
                    </select>
                  )}
                  {active === 'translate' && (
                    <select value={direction} onChange={e => setDirection(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1.5">
                      <option value="zh2en">中→英</option><option value="en2zh">英→中</option>
                    </select>
                  )}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">从 Word 复制段落，直接粘贴到下方输入框</span>
                  <button onClick={() => { const ex = EXAMPLES[active]; if (ex) { setInput(ex.input); setOutput(''); setError('') } }}
                    className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                    <Sparkles size={12} />试试示例
                  </button>
                </div>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleRun() }}
                  rows={6} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder={active === 'polish' ? '粘贴需要润色的段落...' : active === 'rephrase' ? '粘贴需要降重改写的段落...' : active === 'grammar' ? '粘贴需要检查语法的文本...' : '输入待翻译的文本...'} />
                {!input && EXAMPLES[active] && (
                  <p className="text-[11px] text-gray-400 mt-1.5 text-center">{EXAMPLES[active].note}</p>
                )}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button onClick={() => handleRun(false)} disabled={loading || !input.trim()}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-all ${loading || !input.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-md'}`}>
                    {loading ? <><Loader2 size={15} className="animate-spin" />处理中...</> : <><Sparkles size={15} />开始</>}
                  </button>
                  <button onClick={() => handleRun(true)} disabled={loading || !input.trim()}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${loading || !input.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}>
                    <ArrowLeftToLine size={14} />放后台运行
                  </button>
                  <span className="text-[11px] text-gray-400">Ctrl+Enter</span>
                  {bgTaskId && (
                    <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      ✓ 已放入后台，可切换到其他功能
                    </span>
                  )}
                </div>
              </div>
              {error && <div className="mx-5 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"><AlertTriangle size={16} className="text-red-500 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}
              {output && (
                <div className="border-t border-gray-100">
                  <div className="px-5 py-2.5 bg-gray-50/50 border-b flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">AI 处理结果 · 点击复制后直接 Ctrl+V 粘贴到 Word</span>
                    <button onClick={copyOutput} className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${copied ? 'bg-green-50 text-green-700' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}>
                      {copied ? <><Check size={12} />已复制，粘贴到Word</> : <><Copy size={12} />复制</>}
                    </button>
                  </div>
                  <div className="p-5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[450px] overflow-y-auto">{output}</div>
                </div>
              )}
            </div>
      )}

      {/* ──── 中英混排 ──── */}
      {active === 'cnen' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3"><Zap size={18} className="text-amber-500" /><span className="font-semibold">中英文混排修正</span></div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500">原文</div>
                <textarea value={cnenInput} onChange={e => { setCnenInput(e.target.value); setCnenOutput(''); setCnenStats(null) }}
                  className="w-full h-52 p-3 text-sm resize-none outline-none" placeholder="粘贴需要修正的中英文混排文本..." />
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500 flex items-center justify-between">
                  修正后 {cnenStats && <span className="text-green-600">{cnenStats.changes}处修正</span>}
                  {cnenOutput && <button onClick={() => { navigator.clipboard.writeText(cnenOutput); setCopied(true) }} className="text-xs text-white bg-green-600 px-2 py-0.5 rounded">{copied ? '已复制' : '复制'}</button>}
                </div>
                <div className="h-52 p-3 text-sm whitespace-pre-wrap bg-gray-50/50 overflow-y-auto">{cnenOutput || <span className="text-gray-300">修正结果...</span>}</div>
              </div>
            </div>
            <button onClick={fixSpacing} disabled={!cnenInput.trim()} className="mt-4 w-full py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:bg-gray-300 font-medium text-sm">一键修正</button>
          </div>
        </div>
      )}

      {/* ──── 差异对比 ──── */}
      {active === 'diff' && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border overflow-hidden"><div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium">原始文本</div><textarea value={oldText} onChange={e => setOldText(e.target.value)} className="w-full h-72 p-3 text-sm resize-none outline-none" placeholder="修改前..." /></div>
            <div className="bg-white rounded-xl border overflow-hidden"><div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium">修改后</div><textarea value={newText} onChange={e => setNewText(e.target.value)} className="w-full h-72 p-3 text-sm resize-none outline-none" placeholder="修改后..." /></div>
          </div>
          <button onClick={runDiff} disabled={!oldText.trim() || !newText.trim()} className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-300 font-medium"><GitCompare size={18} className="inline mr-2" />对比差异</button>
          {diffResult && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b text-sm flex items-center gap-4">
                <span className="text-red-500">{diffResult.filter(l => l.type === 'remove').length} 删除/修改</span>
                <span className="text-green-500">{diffResult.filter(l => l.type === 'add').length} 新增</span>
                <span className="text-gray-400">红色=原文删除/修改 · 绿色=新增内容</span>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto font-mono text-sm space-y-1">
                {diffResult.map((line, i) => {
                  if (line.type === 'same') {
                    return (
                      <div key={i} className="px-2 py-0.5 text-gray-500">
                        {line.old}
                      </div>
                    )
                  }

                  // 查找配对行
                  let pairLine = null
                  if (i < diffResult.length - 1 && diffResult[i + 1].hasPair) {
                    pairLine = diffResult[i + 1]
                  } else if (i > 0 && diffResult[i - 1].hasPair) {
                    // 跳过，由配对方处理
                    return null
                  }

                  if (pairLine) {
                    const oldStr = line.type === 'remove' ? line.old : line.new
                    const newStr = pairLine.type === 'add' ? pairLine.new : pairLine.old
                    const { renderOld, renderNew } = highlightCharDiff(oldStr, newStr)
                    return (
                      <div key={i}>
                        <div className="px-2 py-0.5 bg-red-50 border-l-2 border-red-400">
                          <span className="text-red-400 w-4 inline-block select-none">-</span><span dangerouslySetInnerHTML={{ __html: renderOld }} />
                        </div>
                        <div className="px-2 py-0.5 bg-green-50 border-l-2 border-green-400">
                          <span className="text-green-400 w-4 inline-block select-none">+</span><span dangerouslySetInnerHTML={{ __html: renderNew }} />
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={i} className={`px-2 py-0.5 ${line.type === 'add' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <span className="w-4 inline-block">{line.type === 'add' ? '+' : '-'}</span>{line.type === 'remove' ? line.old : line.new}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──── 错别字 ──── */}
      {active === 'typo' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle size={18} className="text-yellow-500" /><span className="font-semibold">错别字检查</span><span className="text-xs text-gray-400">200+常见中文错别字词典</span></div>
            <textarea value={typoText} onChange={e => { setTypoText(e.target.value); setTypoResults(null) }} className="w-full h-40 border rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-400" placeholder="粘贴需要检查的论文内容..." />
            <button onClick={runTypo} disabled={!typoText.trim()} className="mt-3 px-5 py-2.5 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 disabled:bg-gray-300 text-sm font-medium"><ClipboardCheck size={14} className="inline mr-1" />检查错别字</button>
            {typoResults !== null && (
              <div className="mt-4">
                {typoResults.length === 0 ? (
                  <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm text-center"><Check size={14} className="inline mr-1" />未发现常见错别字</div>
                ) : (
                  <div className="space-y-3">
                    {/* 原文高亮显示 */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-yellow-800 mb-2">原文中的错误位置（红色标记）：</p>
                      <div className="text-sm leading-relaxed max-h-32 overflow-y-auto bg-white rounded p-2 border">
                        {renderHighlightedText().map((part, i) =>
                          part.type === 'error' ? (
                            <span key={i} className="bg-red-500 text-white px-0.5 rounded cursor-pointer" title={`应为：${part.right}`}>{part.text}</span>
                          ) : (
                            <span key={i}>{part.text}</span>
                          )
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-medium text-gray-700">发现 {typoResults.length} 处可能错误（共{typoText.length}字）</p>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {typoResults.slice(0, 50).map((r, i) => (
                        <div key={i} className="flex items-start gap-2 bg-gray-50 rounded px-3 py-2 text-sm hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            <span className="text-red-600 bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs line-through">{r.wrong}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-700 bg-green-100 px-1.5 py-0.5 rounded font-medium">{r.right}</span>
                          </div>
                          <span className="text-xs text-gray-400 ml-auto flex-shrink-0 mt-0.5">位置 #{r.pos}</span>
                        </div>
                      ))}
                      {typoResults.length > 50 && (
                        <p className="text-xs text-gray-400 text-center py-1">...还有 {typoResults.length - 50} 处未显示</p>
                      )}
                    </div>
                    <p className="text-[11px] text-blue-600">提示：点击原文中红色高亮的文字可查看正确写法。部分词可能是多义词，需人工判断。</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
