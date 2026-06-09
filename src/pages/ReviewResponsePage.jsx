import { useState } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import { MessageSquare, Copy, Check, Plus, Trash2, RotateCcw, FileText, Shuffle, Sparkles } from 'lucide-react'
import { generateFullResponse, replyStarters } from '../data/reviewResponsePhrases'

const SAMPLE_ITEMS = [
  {
    comment: '实验样本量偏小（n=30），建议补充更大规模实验或说明样本量计算依据。',
    response: '感谢审稿人的建议。我们已在讨论部分补充了样本量计算说明（基于G*Power 3.1，效应量0.5，α=0.05，power=0.8，所需最小样本量为27，本实验n=30满足统计要求）。同时补充说明该样本量在该研究领域属于常见范围。',
  },
  {
    comment: '图3的分辨率不足，建议提供300dpi以上的高清图片。',
    response: '非常感谢指出此问题。我们已重新绘制图3，将分辨率提升至300dpi，并调整了字体大小以保证可读性。',
  },
  {
    comment: '缺少与[Author et al., 2023]的对比讨论，请补充。',
    response: '谢谢建议。我们已在讨论部分（第4.2节）增加了与[Author et al., 2023]的详细对比，并在表4中汇总了方法性能对比。',
  },
]

export default function ReviewResponsePage() {
  const [items, setItems] = useState([{ comment: '', response: '' }])
  const [generated, setGenerated] = useState('')
  const [editableText, setEditableText] = useState('')
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [lang, setLang] = useState('zh')

  const randomPhrase = (idx) => {
    const starters = lang === 'zh' ? replyStarters.zh : replyStarters.en
    const phrase = starters[Math.floor(Math.random() * starters.length)]
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, response: phrase } : item
    ))
  }

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ))
  }

  const addItem = () => setItems(prev => [...prev, { comment: '', response: '' }])
  const removeItem = (idx) => {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const loadSample = () => setItems([...SAMPLE_ITEMS])
  const reset = () => {
    setItems([{ comment: '', response: '' }])
    setGenerated('')
    setEditableText('')
  }

  const generate = () => {
    const result = generateFullResponse(lang, items)
    setGenerated(result)
    setEditableText(result)
  }

  const regenerate = () => {
    setRegenerating(true)
    setTimeout(() => {
      const result = generateFullResponse(lang, items)
      setGenerated(result)
      setEditableText(result)
      setRegenerating(false)
    }, 150)
  }

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

  const hasContent = items.some(it => it.comment.trim() || it.response.trim())

  return (
    <ChartPageLayout title="审稿回复助手" breadcrumb="审稿回复" categoryLink="/submit" categoryLabel="投稿检查">
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5">
              <MessageSquare size={15} className="text-green-500" />审稿意见与回复
            </h3>
            <div className="flex gap-1.5">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setLang('zh')}
                  className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${lang === 'zh' ? 'bg-white shadow-sm text-[#1E3A5F]' : 'text-gray-500 hover:text-gray-700'}`}>
                  中文
                </button>
                <button onClick={() => setLang('en')}
                  className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${lang === 'en' ? 'bg-white shadow-sm text-[#1E3A5F]' : 'text-gray-500 hover:text-gray-700'}`}>
                  English
                </button>
              </div>
              <button onClick={loadSample}
                className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-green-50 text-green-600 hover:bg-green-100 flex items-center gap-1">
                <FileText size={11} />加载示例
              </button>
              <button onClick={reset}
                className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1">
                <RotateCcw size={11} />重置
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#1E3A5F]">#{idx + 1}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase">意见内容</label>
                  <textarea value={item.comment} onChange={e => updateItem(idx, 'comment', e.target.value)}
                    placeholder="粘贴审稿人的意见..." rows={2}
                    className="w-full mt-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#3B82F6] resize-y" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-gray-500 uppercase">回复内容</label>
                    <button onClick={() => randomPhrase(idx)}
                      className="text-[10px] text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors">
                      <Sparkles size={10} />随机话术
                    </button>
                  </div>
                  <textarea value={item.response} onChange={e => updateItem(idx, 'response', e.target.value)}
                    placeholder="撰写您的回复..." rows={2}
                    className="w-full mt-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#3B82F6] resize-y" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button onClick={addItem}
              className="px-3 py-1.5 text-[12px] rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1">
              <Plus size={13} />添加意见
            </button>
            <button onClick={generate}
              disabled={!hasContent}
              className={`px-4 py-1.5 text-[12px] rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                hasContent ? 'bg-[#10B981] text-white hover:bg-[#059669]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              <MessageSquare size={13} />生成回复信
            </button>
            {generated && (
              <button onClick={regenerate}
                disabled={regenerating}
                className={`px-4 py-1.5 text-[12px] rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                  regenerating
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                }`}>
                <Shuffle size={13} />{regenerating ? '生成中...' : '换一种说法'}
              </button>
            )}
          </div>

          {generated && (
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-[11px] text-blue-600 leading-relaxed">
                💡 回复信已生成。您可以在右侧预览区直接编辑，所有修改会保留。点击「生成回复信」重新生成，点击「换一种说法」随机替换措辞。
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5">
              <FileText size={15} className="text-green-500" />回复信预览
            </h3>
            {generated && (
              <button onClick={copyText}
                className={`px-3 py-1.5 text-[11px] rounded-md font-medium flex items-center gap-1 transition-colors ${
                  copied ? 'bg-green-100 text-green-700' : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                }`}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? '已复制' : '复制全文'}
              </button>
            )}
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
                {hasContent ? '点击"生成回复信"预览' : '请填写审稿意见和回复，或加载示例'}
              </p>
            )}
          </div>
        </div>
      </div>
    </ChartPageLayout>
  )
}
