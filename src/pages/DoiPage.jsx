import { useState } from 'react'
import WritingPageLayout, { CopyButton } from '../components/WritingPageLayout'

// ── 预设 DOI 映射表（至少 5 条）──
const doiDatabase = {
  '10.1234/example.1': {
    citation: '作者1, 作者2. 论文标题[J]. 期刊名称, 2020, 10(2): 100-110.',
    meta: { format: 'GB/T 7714', type: '期刊文章' },
  },
  '10.5678/another.2': {
    citation: '张某某. 图书标题[M]. 北京: 科学出版社, 2019.',
    meta: { format: 'GB/T 7714', type: '图书' },
  },
  '10.1016/j.patcog.2021.108123': {
    citation: 'Wang L, Zhang H. Deep learning for image recognition[J]. Pattern Recognition, 2021, 118: 108123.',
    meta: { format: 'GB/T 7714', type: '期刊文章' },
  },
  '10.1007/978-3-319-69626-3_1': {
    citation: 'Li M, Chen Y. Advances in neural language models[C]. Proceedings of NLP Conference, 2019: 1-15.',
    meta: { format: 'GB/T 7714', type: '会议论文' },
  },
  '10.1109/cvpr.2022.00001': {
    citation: 'Zhao Q, Liu R. Vision transformers for object detection[J]. IEEE TPAMI, 2022, 44(6): 3201-3218.',
    meta: { format: 'GB/T 7714', type: '期刊文章' },
  },
}

export default function DoiPage() {
  const [doi, setDoi] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showDemoList, setShowDemoList] = useState(false)

  const handleGenerate = () => {
    const trimmed = doi.trim()
    if (!trimmed) {
      setError('请输入 DOI')
      setResult(null)
      return
    }

    const entry = doiDatabase[trimmed]
    if (entry) {
      setResult(entry)
      setError('')
    } else {
      setResult(null)
      setError(`未找到 DOI "${trimmed}" 的预设引用。此为演示版，仅支持预设样例数据。完整版需接入 Crossref API 实时查询。`)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleGenerate()
  }

  return (
    <WritingPageLayout
      title="DOI 快速引用"
      description="输入 DOI，从预设数据库中查找对应的引用条目。此为演示版，仅支持预设样例。"
    >
      {/* 演示版提示栏 */}
      <div className="mb-6 p-5 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">演示版说明</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              此工具为<b>演示版</b>，仅支持预设样例 DOI（共 {Object.keys(doiDatabase).length} 条）。实际使用需接入 Crossref 等在线 API 实时查询完整数据库。输入预设 DOI 即可查看效果。
            </p>
          </div>
        </div>
      </div>

      {/* 输入区 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          DOI 输入
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={doi}
            onChange={e => { setDoi(e.target.value); setError(''); setResult(null) }}
            onKeyDown={handleKeyDown}
            placeholder="请输入 DOI（例如：10.1007/978-3-319-69626-3_1）"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleGenerate}
            className="px-5 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-sm flex-shrink-0"
          >
            生成引用
          </button>
        </div>
        <p className="mt-2 text-[11px] text-blue-500 cursor-pointer hover:underline" onClick={() => setShowDemoList(!showDemoList)}>
          {showDemoList ? '收起' : '查看'}可用的演示 DOI 列表 →
        </p>
      </div>

      {/* 演示 DOI 列表 */}
      {showDemoList && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <h4 className="text-xs font-semibold text-gray-600 mb-3">演示 DOI 列表（点击填入输入框）</h4>
          <div className="space-y-2">
            {Object.entries(doiDatabase).map(([key, val]) => (
              <button
                key={key}
                onClick={() => { setDoi(key); setError(''); setResult(null) }}
                className="w-full text-left px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors group"
              >
                <code className="text-xs text-amber-700 group-hover:text-amber-800 font-mono">{key}</code>
                <span className="ml-2 text-[11px] text-gray-400">- {val.meta.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-700 leading-relaxed">{error}</p>
        </div>
      )}

      {/* 结果展示 */}
      {result && (
        <div className="bg-white border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">引用结果</h3>
              <span className="text-[11px] text-gray-400">{result.meta.format} · {result.meta.type}</span>
            </div>
            <CopyButton text={result.citation} />
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm text-gray-800 leading-relaxed break-words font-serif">
              {result.citation}
            </p>
          </div>
        </div>
      )}

      {/* 补充说明 */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">关于 DOI 引用</h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          DOI（Digital Object Identifier）是数字对象的唯一标识符。在实际应用中，可通过 Crossref API 根据 DOI
          自动获取完整的文献元数据（作者、标题、期刊、卷期页码等），并生成符合不同格式要求的引用条目。
          本工具为演示版，预设了 {Object.keys(doiDatabase).length} 条样例数据供体验。
        </p>
      </div>
    </WritingPageLayout>
  )
}
