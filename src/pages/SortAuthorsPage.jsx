import { useState } from 'react'
import WritingPageLayout, { CopyButton } from '../components/WritingPageLayout'

export default function SortAuthorsPage() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [delimiter, setDelimiter] = useState('auto')

  const handleSort = () => {
    const raw = input.trim()
    if (!raw) {
      setOutput('')
      return
    }

    // 自动检测分隔符
    let sep = ','
    if (delimiter === 'auto') {
      if (raw.includes(';') || raw.includes('；')) {
        sep = /[;；]+/
      } else if (raw.includes('、')) {
        sep = '、'
      } else {
        sep = /[,，]+/
      }
    } else if (delimiter === 'semicolon') {
      sep = /[;；]+/
    } else if (delimiter === 'comma') {
      sep = /[,，]+/
    } else if (delimiter === 'cn-comma') {
      sep = '、'
    } else if (delimiter === 'space') {
      sep = /\s+/
    }

    const names = raw.split(sep).map(s => s.trim()).filter(Boolean)

    // 分离中文名和英文名
    const chineseNames = []
    const englishNames = []
    for (const name of names) {
      if (/[\u4e00-\u9fff]/.test(name)) {
        chineseNames.push(name)
      } else {
        englishNames.push(name)
      }
    }

    // 中文按拼音排序
    chineseNames.sort((a, b) => a.localeCompare(b, 'zh-CN'))

    // 英文保持原序（排在中文后面）
    const sorted = [...chineseNames, ...englishNames]

    setOutput(sorted.join(', '))
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  return (
    <WritingPageLayout
      title="作者拼音排序"
      description="输入中文作者姓名列表，按拼音首字母自动升序排列。英文名保持原序并排在中文名之后。"
    >
      {/* 输入区 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-gray-600">输入作者列表</label>
          <button
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            清空
          </button>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={'张三, 李四, 王五, 赵六\n\n支持逗号、顿号、分号或空格分隔'}
          rows={5}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-y"
        />

        {/* 分隔符选项 + 排序按钮 */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={delimiter}
            onChange={e => setDelimiter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
          >
            <option value="auto">自动检测分隔符</option>
            <option value="comma">逗号（,）</option>
            <option value="semicolon">分号（;）</option>
            <option value="cn-comma">顿号（、）</option>
            <option value="space">空格</option>
          </select>
          <button
            onClick={handleSort}
            className="px-5 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
          >
            排序
          </button>
        </div>
      </div>

      {/* 结果区 */}
      {output && (
        <div className="bg-white border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">排序结果</h3>
            <CopyButton text={output} />
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm text-gray-800 leading-relaxed break-words">
              {output}
            </p>
          </div>
        </div>
      )}

      {/* 示例 */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">示例</h4>
        <div className="space-y-1.5 text-xs text-gray-500">
          <p>输入：<span className="text-gray-700">王五, 李四, 张三, 赵六</span></p>
          <p>输出：<span className="text-gray-700">李四, 王五, 张三, 赵六</span>（按拼音：Li, Wang, Zhang, Zhao）</p>
          <p className="text-gray-400 mt-2">注意：本功能仅对中文名按拼音排序；英文名保持输入顺序排在末尾。</p>
        </div>
      </div>
    </WritingPageLayout>
  )
}
