import { useState } from 'react'
import WritingPageLayout, { CopyButton } from '../components/WritingPageLayout'

// 中文标点 → 英文标点映射
const CN_TO_EN = {
  '\u2018': "'", '\u2019': "'",
  '\u201c': '"', '\u201d': '"',
  '\uff08': '(', '\uff09': ')',
  '\u300a': '<', '\u300b': '>',
  '\u3008': '<', '\u3009': '>',
  '\uff0c': ',',
  '\u3001': ',',
  '\uff0e': '.',
  '\u3002': '.',
  '\uff1a': ':',
  '\uff1b': ';',
  '\uff1f': '?',
  '\uff01': '!',
  '\uff3b': '[',
  '\uff3d': ']',
  '\uff5b': '{',
  '\uff5d': '}',
  '\uff5e': '~',
  '\u2014': '---',
  '\u2013': '--',
  '\u2026': '...',
  '\uff0f': '/',
}

// 英文标点 → 中文标点映射
const EN_TO_CN = {
  ',': '\uff0c',
  '.': '\u3002',
  '(': '\uff08',
  ')': '\uff09',
  ':': '\uff1a',
  ';': '\uff1b',
  '?': '\uff1f',
  '!': '\uff01',
  '<': '\u300a',
  '>': '\u300b',
}

// 全角字母数字 → 半角
const FULL_TO_HALF = {}
for (let i = 0xff01; i <= 0xff5e; i++) {
  FULL_TO_HALF[String.fromCharCode(i)] = String.fromCharCode(i - 0xfee0)
}
FULL_TO_HALF['\u3000'] = ' ' // 全角空格

// 半角字母数字 → 全角
const HALF_TO_FULL = {}
for (let i = 33; i <= 126; i++) {
  HALF_TO_FULL[String.fromCharCode(i)] = String.fromCharCode(i + 0xfee0)
}
HALF_TO_FULL[' '] = '\u3000'

export default function PunctuationPage() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState('')

  // 中文排版优化
  const toChineseStyle = (text) => {
    let result = text
    // 英文标点 → 中文标点（在中文字符旁边）
    // 简化策略：全局替换常见英文标点为中文标点
    for (const [en, cn] of Object.entries(EN_TO_CN)) {
      result = result.split(en).join(cn)
    }

    // 全角字母数字 → 半角
    for (const [full, half] of Object.entries(FULL_TO_HALF)) {
      result = result.split(full).join(half)
    }

    // 整理引号：替换英文单双引号为中文引号（成对处理，简单实现）
    // 先处理双引号
    let quoteOpen = true
    result = result.replace(/"|"/g, () => {
      const ch = quoteOpen ? '\u201c' : '\u201d'
      quoteOpen = !quoteOpen
      return ch
    })

    // 单引号
    let sqOpen = true
    result = result.replace(/'/g, () => {
      const ch = sqOpen ? '\u2018' : '\u2019'
      sqOpen = !sqOpen
      return ch
    })

    return result
  }

  // 英文排版优化
  const toEnglishStyle = (text) => {
    let result = text
    // 中文标点 → 英文标点
    for (const [cn, en] of Object.entries(CN_TO_EN)) {
      result = result.split(cn).join(en)
    }

    // 半角转全角字再转回（清理残余全角）
    // nothing to do here since CN_TO_EN handles it

    // 句号后加空格（简单处理）
    result = result.replace(/\.([A-Za-z])/g, '. $1')

    return result
  }

  const handleConvert = (selectedMode) => {
    if (!input.trim()) return
    setMode(selectedMode)
    const result = selectedMode === 'chinese'
      ? toChineseStyle(input)
      : toEnglishStyle(input)
    setOutput(result)
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setMode('')
  }

  return (
    <WritingPageLayout
      title="中英文标点 / 全半角统一转换"
      description="一键转换文本中的标点符号和字母数字的全/半角形式，适配中文或英文排版需求。"
    >
      {/* 输入区 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">输入文本</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleConvert('chinese')}
              disabled={!input.trim()}
              className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              中文排版优化
            </button>
            <button
              onClick={() => handleConvert('english')}
              disabled={!input.trim()}
              className="px-4 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              英文排版优化
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="在此粘贴或输入待处理文本..."
          className="w-full h-40 p-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-y focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      {/* 转换说明 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-700 mb-1">中文排版优化</h4>
          <p className="text-xs text-blue-600/80 leading-relaxed">
            英文逗号→中文逗号，英文句号→中文句号，英文括号→中文括号。字母数字全角转半角。引号自动配对为中文引号。
          </p>
        </div>
        <div className="bg-green-50/50 border border-green-100 rounded-xl p-4">
          <h4 className="text-sm font-medium text-green-700 mb-1">英文排版优化</h4>
          <p className="text-xs text-green-600/80 leading-relaxed">
            中文标点→英文标点，字母数字保持半角。英文句点后自动加空格。
          </p>
        </div>
      </div>

      {/* 结果区 */}
      {output && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              转换结果
              <span className="ml-2 text-xs text-gray-400 font-normal">
                ({mode === 'chinese' ? '中文排版优化' : '英文排版优化'})
              </span>
            </label>
            <div className="flex gap-2">
              <CopyButton text={output} />
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                清空全部
              </button>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
            {output || '(空)'}
          </div>
        </div>
      )}
    </WritingPageLayout>
  )
}
