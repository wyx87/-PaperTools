import { useState } from 'react'
import { Send, MessageCircle, ClipboardList, Copy, Check, RefreshCw, Sparkles, Loader2, AlertTriangle, ArrowLeftToLine, Wand2 } from 'lucide-react'
import { copyText } from '../utils'
import { askQuestion, polishText } from '../services/ai'
import { useTask } from '../contexts/TaskContext'

// ── 投稿信模板 ──
const coverLetterTemplates = [
  {
    id: 'standard', label: '标准中文',
    fields: [
      { key: 'editor', label: '编辑姓名', placeholder: '尊敬的编辑：' },
      { key: 'title', label: '论文标题', placeholder: '论文题目...' },
      { key: 'journal', label: '目标期刊', placeholder: '拟投期刊名称...' },
      { key: 'innovation', label: '创新点', placeholder: '本文的主要创新点...' },
      { key: 'contribution', label: '研究贡献', placeholder: '本研究的意义与贡献...' },
      { key: 'declaration', label: '声明', placeholder: '本文未在其他期刊投稿或发表，所有作者均同意投稿。' },
    ],
    generate: (f) => `${f.editor || '尊敬的编辑：'}

我是论文《${f.title || '...'}》的通讯作者，现向贵刊《${f.journal || '...'}》投稿，恳请审阅。

本文的创新点在于：${f.innovation || '...'}

本研究的主要贡献：${f.contribution || '...'}

${f.declaration || '本文未在其他期刊投稿或发表，所有作者均同意投稿。'}

衷心感谢您在百忙之中审阅本文，期待您的宝贵意见。

此致
敬礼`,
  },
  {
    id: 'eng', label: '英文 Cover Letter',
    fields: [
      { key: 'editor_en', label: 'Dear Editor', placeholder: 'Dear Editor,' },
      { key: 'title_en', label: 'Title', placeholder: 'Paper title...' },
      { key: 'journal_en', label: 'Journal', placeholder: 'Target journal...' },
      { key: 'significance_en', label: 'Significance', placeholder: 'Why this work is important...' },
      { key: 'novelty_en', label: 'Novelty', placeholder: 'What is new about this work...' },
    ],
    generate: (f) => `${f.editor_en || 'Dear Editor,'}

We are pleased to submit our manuscript entitled "${f.title_en || '...'}" for consideration for publication in ${f.journal_en || '...'}.

${f.significance_en || 'This work addresses an important problem...'}

The novelty of this work includes: ${f.novelty_en || '...'}

We confirm that this manuscript has not been published elsewhere and is not under consideration by another journal. All authors have approved the manuscript and agree with its submission.

Thank you for your time and consideration.

Sincerely,
[Corresponding Author]`,
  },
]

// ── 审稿回复模板 ──
const reviewResponseTemplate = {
  fields: [
    { key: 'editor', label: '编辑称呼', placeholder: 'Dear Editor / 尊敬的编辑：' },
    { key: 'manuscript', label: '稿件编号', placeholder: 'Manuscript ID / 稿件编号...' },
    { key: 'title', label: '论文标题', placeholder: '论文标题...' },
    { key: 'summary', label: '修改总结', placeholder: '总结本次修改的主要内容：1）...2）...' },
  ],
}

// ── 投稿清单 ──
const CHECKLIST_ITEMS = [
  { id: 'format', label: '格式符合期刊要求', desc: '页边距、字体、行距、图表格式' },
  { id: 'word-count', label: '字数在期刊范围内', desc: '摘要、正文、参考文献字数' },
  { id: 'title-page', label: '标题页信息完整', desc: '标题、作者、单位、通讯作者邮箱' },
  { id: 'abstract', label: '摘要关键词完整', desc: '中英文摘要+3-8个关键词' },
  { id: 'figures', label: '图表清晰度足够', desc: '分辨率≥300dpi，编号连续' },
  { id: 'references', label: '参考文献格式统一', desc: '按期刊要求格式化，无遗漏' },
  { id: 'cover-letter', label: '投稿信已准备', desc: 'Cover Letter / 投稿说明' },
  { id: 'copyright', label: '版权协议/声明', desc: '作者贡献声明、利益冲突声明' },
  { id: 'data', label: '数据/代码可用', desc: '如有要求，数据和代码已准备' },
  { id: 'plagiarism', label: '查重通过', desc: '重复率在期刊接受范围内' },
]

const TABS = [
  { id: 'cover-letter', icon: Send, label: '投稿信' },
  { id: 'review-response', icon: MessageCircle, label: '审稿回复' },
  { id: 'ai-helper', icon: Sparkles, label: 'AI 投稿助手' },
  { id: 'checklist', icon: ClipboardList, label: '投稿清单' },
]

export default function SubmitHub() {
  const { submitTask } = useTask()
  const [active, setActive] = useState('cover-letter')
  const [copied, setCopied] = useState(false)

  // ── 投稿信 ──
  const [clTemplate, setClTemplate] = useState('standard')
  const [clFields, setClFields] = useState({})
  const [clResult, setClResult] = useState('')
  const [clPolishing, setClPolishing] = useState(false)
  const [clPolished, setClPolished] = useState(false)

  // ── 审稿回复 ──
  const [rrEditor, setRrEditor] = useState('')
  const [rrManuscript, setRrManuscript] = useState('')
  const [rrTitle, setRrTitle] = useState('')
  const [rrSummary, setRrSummary] = useState('')
  const [rrComments, setRrComments] = useState('')
  const [rrResult, setRrResult] = useState('')

  // ── AI 投稿助手 ──
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // ── 投稿清单 ──
  const [checkedItems, setCheckedItems] = useState(new Set())

  async function doCopy(text) { await copyText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  function genCoverLetter() {
    const tpl = coverLetterTemplates.find(t => t.id === clTemplate)
    if (!tpl) return
    // 设置合理默认值避免空壳输出
    const filled = { ...clFields }
    for (const f of tpl.fields) {
      if (!filled[f.key] || filled[f.key].trim() === '') {
        filled[f.key] = f.key.includes('editor') ? '尊敬的编辑：' :
          f.key.includes('title') ? '论文标题（请填写）' :
          f.key.includes('journal') ? '目标期刊名称（请填写）' :
          f.key.includes('innovation') ? '（请描述本文的创新点和独特贡献）' :
          f.key.includes('contribution') || f.key.includes('significance') ? '（请描述本研究的重要性和学术价值）' :
          f.key.includes('novelty') ? '(Please describe the novelty of this work)' :
          f.key.includes('declaration') ? '本文未在其他期刊投稿或发表，所有作者均同意投稿。' : f.placeholder
      }
    }
    setClResult(tpl.generate(filled))
    setClPolished(false)
  }

  async function polishCoverLetter() {
    if (!clResult) return
    setClPolishing(true)
    try {
      const polished = await polishText(clResult, clTemplate === 'eng' ? '英文润色' : '学术化')
      setClResult(polished)
      setClPolished(true)
    } catch (e) {
      // 如果AI不可用，保持原样
    }
    setClPolishing(false)
  }

  function genReviewResponse() {
    const responses = rrComments.trim().split('\n').filter(r => r.trim()).map((c, i) => {
      const parts = c.split('|')
      const comment = parts[0]?.trim() || c.trim()
      const response = parts[1]?.trim() || '（请填写回复内容）'
      return `**审稿意见 ${i + 1}：** ${comment}\n\n**回复：** ${response}\n`
    }).join('\n')

    setRrResult(`${rrEditor || '尊敬的编辑：'}

感谢您和审稿人对我们稿件《${rrTitle || '...'}》（${rrManuscript || '...'}）的审阅和宝贵意见。我们已逐条回复审稿意见，并对稿件进行了相应修改。

**修改总结：**
${rrSummary || '...'}

---

**逐条回复：**

${responses}

---

再次感谢您的指导，期待您的进一步意见。

此致
敬礼`)
  }

  async function runAiAssist(background = false) {
    if (!aiQuestion.trim()) return
    if (!background) { setAiLoading(true); setAiError(''); setAiAnswer('') }

    const name = `投稿问答 · ${aiQuestion.slice(0, 25)}`
    const asyncFn = () => askQuestion(aiQuestion)

    if (background) {
      submitTask(name, asyncFn)
    } else {
      try { setAiAnswer(await asyncFn()) }
      catch (e) { setAiError(e.message) }
      finally { setAiLoading(false) }
    }
  }

  function toggleCheck(id) {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const progress = CHECKLIST_ITEMS.length > 0 ? Math.round((checkedItems.size / CHECKLIST_ITEMS.length) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center">
          <Send size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">投稿准备</h2>
          <p className="text-sm text-gray-500">投稿信 · 审稿回复 · AI 投稿助手 · 投稿自检清单 · 结果直接复制到 Word</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {TABS.map(t => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              active === t.id ? (t.id === 'ai-helper' ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-gray-100 border-gray-400 text-gray-800')
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            <Icon size={13} />{t.label}
            {t.id === 'ai-helper' && <Sparkles size={10} className="text-teal-400" />}
          </button>
        )})}
      </div>

      {/* ──── 投稿信 ──── */}
      {active === 'cover-letter' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Send size={18} className="text-blue-500" /><span className="font-semibold">投稿信生成器</span></div>
          <div className="flex flex-wrap gap-2 mb-4">
            {coverLetterTemplates.map(t => (
              <button key={t.id} onClick={() => { setClTemplate(t.id); setClFields({}); setClResult('') }}
                className={`px-3 py-1.5 rounded-lg text-xs border ${clTemplate === t.id ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{t.label}</button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {coverLetterTemplates.find(t => t.id === clTemplate)?.fields.map(f => (
              <div key={f.key} className={['editor', 'editor_en'].includes(f.key) ? '' : ''}>
                <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                <textarea value={clFields[f.key] || ''} onChange={e => setClFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none outline-none" rows={f.key.includes('innovation') || f.key.includes('contribution') || f.key.includes('significance') ? 3 : 2} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <button onClick={genCoverLetter} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><RefreshCw size={14} className="inline mr-1" />生成投稿信</button>
          {clResult && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="text-xs text-gray-500">{clPolished ? '✨ AI已润色' : '投稿信预览'}</span>
                <div className="flex items-center gap-2">
                  <button onClick={polishCoverLetter} disabled={clPolishing}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${clPolished ? 'bg-purple-100 text-purple-600' : 'bg-purple-600 text-white hover:bg-purple-700'} disabled:opacity-50`}>
                    {clPolishing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    {clPolished ? '已AI润色' : 'AI润色优化'}
                  </button>
                  <button onClick={() => doCopy(clResult)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">{copied ? '已复制' : '复制全文'}</button>
                </div>
              </div>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{clResult}</pre>
            </div>
          )}
        </div>
      )}

      {/* ──── 审稿回复 ──── */}
      {active === 'review-response' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><MessageCircle size={18} className="text-blue-500" /><span className="font-semibold">审稿回复助手</span></div>
          <p className="text-xs text-gray-400 mb-4">填写基本信息，逐条列出审稿意见和回复。每行一条，用"|"分隔审稿意见和回复（如：意见内容|我的回复）</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input value={rrEditor} onChange={e => setRrEditor(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="编辑称呼..." />
            <input value={rrManuscript} onChange={e => setRrManuscript(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="稿件编号..." />
          </div>
          <input value={rrTitle} onChange={e => setRrTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mb-3" placeholder="论文标题..." />
          <textarea value={rrSummary} onChange={e => setRrSummary(e.target.value)} className="w-full border rounded-lg p-3 text-sm resize-none mb-3" rows={2} placeholder="修改总结..." />
          <textarea value={rrComments} onChange={e => setRrComments(e.target.value)} className="w-full border rounded-lg p-3 text-sm resize-none mb-3" rows={6} placeholder={'审稿意见及回复（每行一条，"|"分隔意见和回复）：\n\n图像分辨率不足，建议重新生成高清图片|已按要求重新生成了300dpi的高清图片\n\n实验对比不够充分，建议增加与SOTA方法的对比|已增加与XX方法的对比实验，详见Table 3'} />
          <button onClick={genReviewResponse} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><RefreshCw size={14} className="inline mr-1" />生成回复信</button>
          {rrResult && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">回复信预览</span><button onClick={() => doCopy(rrResult)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">{copied ? '已复制' : '复制全文'}</button></div>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{rrResult}</pre>
            </div>
          )}
        </div>
      )}

      {/* ──── AI 投稿助手 ──── */}
      {active === 'ai-helper' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Sparkles size={18} className="text-teal-500" /><span className="font-semibold">AI 投稿助手</span><span className="text-xs text-gray-400">投稿相关问题，有问必答</span></div>
          <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">任何投稿相关问题，AI 有问必答</span>
            </div>
          <textarea value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} rows={3}
                className="w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="提问：如何选择合适的投稿期刊？审稿意见冲突怎么办？审稿回复有什么技巧？..." />
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button onClick={() => runAiAssist(false)} disabled={aiLoading || !aiQuestion.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:bg-gray-300">
                  {aiLoading ? <><Loader2 size={14} className="animate-spin" />思考中...</> : <><Sparkles size={14} />问 AI</>}
                </button>
                <button onClick={() => runAiAssist(true)} disabled={aiLoading || !aiQuestion.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                  <ArrowLeftToLine size={14} />放后台
                </button>
              </div>
              {aiError && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{aiError}</div>}
              {aiAnswer && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-[450px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">AI 回答 · 复制后直接粘贴到 Word</span><button onClick={() => doCopy(aiAnswer)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">{copied ? '已复制，粘贴到Word' : '复制'}</button></div>
                  <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{aiAnswer}</pre>
                </div>
              )}
          <div className="mt-4 flex flex-wrap gap-2">
            {['如何选择投稿期刊？', '审稿意见冲突怎么办？', 'Response Letter 怎么写？', '被拒后如何改投？'].map(q => (
              <button key={q} onClick={() => setAiQuestion(q)} className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-200 hover:bg-teal-100">{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* ──── 投稿清单 ──── */}
      {active === 'checklist' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><ClipboardList size={18} className="text-blue-500" /><span className="font-semibold">投稿前自检清单</span></div>
          <div className="mb-4 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-center text-gray-500 mb-4">{checkedItems.size}/{CHECKLIST_ITEMS.length} 项已完成（{progress}%）</p>
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map(item => (
              <button key={item.id} onClick={() => toggleCheck(item.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  checkedItems.has(item.id) ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  checkedItems.has(item.id) ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}>
                  {checkedItems.has(item.id) && <Check size={12} className="text-white" />}
                </div>
                <div>
                  <div className={`text-sm font-medium ${checkedItems.has(item.id) ? 'text-green-800 line-through' : 'text-gray-700'}`}>{item.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
