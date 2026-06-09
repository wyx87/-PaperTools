import { useState } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import { FileText, Copy, Check, RotateCcw, Globe, Shuffle } from 'lucide-react'
import { generateCoverLetterHybrid, zhPhrases, enPhrases } from '../data/coverLetterPhrases'

const DEFAULT_DECLARATION = '本文未在其他期刊投稿或发表，所有作者均同意向贵刊投稿。'

function countVariants(p) {
  return Object.values(p).reduce((acc, arr) => acc * arr.length, 1)
}

export default function CoverLetterPage() {
  const [form, setForm] = useState({
    title: '',
    journal: '',
    author: '',
    affiliation: '',
    contribution: '',
    declaration: DEFAULT_DECLARATION,
  })
  const [lang, setLang] = useState('zh')
  const [generated, setGenerated] = useState('')
  const [editableText, setEditableText] = useState('')
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const doGenerate = (isRegen = false) => {
    if (!form.title.trim() || !form.journal.trim() || !form.author.trim()) {
      setGenerated('')
      setEditableText('')
      return
    }
    if (isRegen) setRegenerating(true)
    const fn = isRegen ? setTimeout : (cb) => cb()
    const run = () => {
      const result = generateCoverLetterHybrid(lang, {
        title: form.title.trim(),
        journal: form.journal.trim(),
        author: form.author.trim(),
        affiliation: form.affiliation.trim(),
        contribution: form.contribution.trim(),
        declaration: form.declaration.trim(),
      })
      setGenerated(result)
      setEditableText(result)
      if (isRegen) setRegenerating(false)
    }
    if (isRegen) {
      fn(run, 150)
    } else {
      run()
    }
  }

  const generate = () => doGenerate(false)
  const regenerate = () => doGenerate(true)

  const copyText = async () => {
    const text = editableText || generated
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

  const reset = () => {
    setForm({
      title: '', journal: '', author: '', affiliation: '',
      contribution: '', declaration: DEFAULT_DECLARATION,
    })
    setGenerated('')
    setEditableText('')
    setLang('zh')
  }

  const isValid = form.title.trim() && form.journal.trim() && form.author.trim()
  const variantCountZH = countVariants(zhPhrases)
  const variantCountEN = countVariants(enPhrases)

  return (
    <ChartPageLayout title="投稿信生成器" breadcrumb="投稿信生成" categoryLink="/submit" categoryLabel="投稿检查">
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5">
              <FileText size={15} className="text-green-500" />填写投稿信息
            </h3>
            <span className="text-[10px] text-[#9CA3AF] bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              短语组合 + 完整模板 ＞ 200+ 种变体
            </span>
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-600">论文标题 <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={e => update('title', e.target.value)}
              placeholder="请输入论文标题" className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#3B82F6]" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-600">目标期刊名称 <span className="text-red-400">*</span></label>
            <input value={form.journal} onChange={e => update('journal', e.target.value)}
              placeholder="例如：Nature, 软件学报" className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#3B82F6]" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-600">通讯作者姓名 <span className="text-red-400">*</span></label>
            <input value={form.author} onChange={e => update('author', e.target.value)}
              placeholder="通讯作者全名" className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#3B82F6]" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-600">通讯作者单位（可选）</label>
            <input value={form.affiliation} onChange={e => update('affiliation', e.target.value)}
              placeholder="例如：清华大学计算机系" className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#3B82F6]" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-600">创新点 / 研究贡献（可选）</label>
            <textarea value={form.contribution} onChange={e => update('contribution', e.target.value)}
              placeholder="简述本文的创新点或主要贡献..." rows={3}
              className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#3B82F6] resize-y" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-600">声明</label>
            <textarea value={form.declaration} onChange={e => update('declaration', e.target.value)}
              rows={2} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#3B82F6] resize-y" />
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button onClick={generate}
              disabled={!isValid}
              className={`px-4 py-2 text-sm rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                isValid ? 'bg-[#10B981] text-white hover:bg-[#059669]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              <FileText size={14} />生成投稿信
            </button>
            {generated && (
              <button onClick={regenerate}
                disabled={regenerating}
                className={`px-4 py-2 text-sm rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                  regenerating
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                }`}>
                <Shuffle size={14} />{regenerating ? '生成中...' : '换一种写法'}
              </button>
            )}
            <button onClick={reset}
              className="px-3 py-2 text-sm rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1">
              <RotateCcw size={14} />重置
            </button>
          </div>
          {!isValid && (
            <p className="text-[11px] text-amber-500">请填写论文标题、期刊名称和通讯作者姓名</p>
          )}
          {generated && (
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-[11px] text-blue-600 leading-relaxed">
                💡 您可以在右侧预览区直接编辑投稿信内容，所有修改都会被保留。点击「复制全文」复制最终版本。
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5">
              <Globe size={15} className="text-green-500" />投稿信预览
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => { setLang('zh'); generate() }}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors ${lang === 'zh' ? 'bg-white shadow-sm text-[#1E3A5F]' : 'text-gray-500 hover:text-gray-700'}`}>
                  中文
                </button>
                <button onClick={() => { setLang('en'); generate() }}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors ${lang === 'en' ? 'bg-white shadow-sm text-[#1E3A5F]' : 'text-gray-500 hover:text-gray-700'}`}>
                  English
                </button>
              </div>
              {generated && (
                <>
                  <button onClick={copyText}
                    className={`px-3 py-1.5 text-[11px] rounded-md font-medium flex items-center gap-1 transition-colors ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                    }`}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? '已复制' : '复制全文'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 border border-gray-100 rounded-lg bg-gray-50/50 overflow-hidden flex flex-col min-h-[300px]">
            {generated ? (
              <textarea
                value={editableText}
                onChange={e => setEditableText(e.target.value)}
                className="flex-1 w-full p-4 text-sm text-gray-700 font-sans leading-relaxed bg-transparent resize-none outline-none border-none"
                style={{ minHeight: '300px' }}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center pt-20 flex-1">
                {isValid ? '点击"生成投稿信"预览' : '请先填写左侧表单'}
              </p>
            )}
          </div>
        </div>
      </div>
    </ChartPageLayout>
  )
}
