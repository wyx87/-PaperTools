import { useState } from 'react'
import WritingPageLayout, { CopyButton } from '../components/WritingPageLayout'
import { useToast } from '../components/Toast'

export default function CleanerPage() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [changes, setChanges] = useState(null)
  const { toast: addToast } = useToast()

  const clean = () => {
    if (!input.trim()) {
      addToast('请先输入文本内容', 'warning')
      return
    }

    const originalLen = input.length
    const originalLines = input.split(/\r?\n/).length

    let result = input

    // 1. 统一换行符 \r\n | \r → \n
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // 2. 每行首尾空格去除
    result = result.split('\n').map(line => line.trim()).join('\n')

    // 3. 删除中间连续多个空格（保留单个）
    result = result.replace(/[^\S\n]{2,}/g, ' ')

    // 4. 删除连续多个空行（保留最多一个）
    result = result.replace(/\n{3,}/g, '\n\n')

    const newLen = result.length
    const newLines = result.split('\n').length

    setOutput(result)
    setChanges({
      charRemoved: originalLen - newLen,
      linesRemoved: originalLines - newLines,
    })
    addToast('清理完成', 'success')
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setChanges(null)
  }

  return (
    <WritingPageLayout
      title="论文排版清理器"
      description="一键清除文本中的格式冗余：多余空行、多余空格、统一换行符。"
    >
      {/* 清理项说明 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {[
          { title: '删除连续多个空行', desc: '保留最多一个空行（段落间）' },
          { title: '删除段落首尾空格', desc: '每行开头和结尾的空格全部移除' },
          { title: '合并连续空格', desc: '文本中间多个空格合并为一个' },
          { title: '统一换行符', desc: 'Windows/Mac 换行统一换为 \\n' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 bg-white border border-gray-200 rounded-xl p-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div>
              <h4 className="text-sm font-medium text-gray-800">{item.title}</h4>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 输入区 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">输入文本</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="在此粘贴或输入待清理的文本..."
          className="w-full h-40 p-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-y focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">
            当前 {input.length} 字符 / {input ? input.split(/\r?\n/).length : 0} 行
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setInput('')}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              清空
            </button>
            <button
              onClick={clean}
              disabled={!input.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              立即清理
            </button>
          </div>
        </div>
      </div>

      {/* 结果区 */}
      {output && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">清理结果</label>
            <div className="flex gap-2">
              <CopyButton text={output} />
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                全部清空
              </button>
            </div>
          </div>

          {/* 变更统计 */}
          {changes && (
            <div className="flex flex-wrap gap-2 mb-3">
              {changes.charRemoved > 0 && (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-md border border-green-100">
                  移除 {changes.charRemoved} 个多余字符
                </span>
              )}
              {changes.linesRemoved > 0 && (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-md border border-green-100">
                  精简 {changes.linesRemoved} 行
                </span>
              )}
              {changes.charRemoved === 0 && changes.linesRemoved === 0 && (
                <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-md border border-gray-100">
                  文本已整洁，无多余格式
                </span>
              )}
            </div>
          )}

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
            {output}
          </div>

          <p className="mt-2 text-xs text-gray-400">
            清理后 {output.length} 字符 / {output.split('\n').length} 行
          </p>
        </div>
      )}
    </WritingPageLayout>
  )
}
