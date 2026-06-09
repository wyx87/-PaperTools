import { useState, useCallback, useRef } from 'react'
import WritingPageLayout, { TxtUploader } from '../components/WritingPageLayout'
import { useToast } from '../components/Toast'

const statColors = {
  '总字符数': 'bg-blue-50 text-blue-700 border-blue-200',
  '中文字符': 'bg-red-50 text-red-700 border-red-200',
  '英文字母': 'bg-green-50 text-green-700 border-green-200',
  '数字': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  '标点符号': 'bg-purple-50 text-purple-700 border-purple-200',
  '行数': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  '段落数': 'bg-teal-50 text-teal-700 border-teal-200',
}

export default function WordCountPage() {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const { toast: addToast } = useToast()

  const handleFileLoaded = useCallback((content, name) => {
    setText(content)
    setFileName(name)
    addToast(`已加载：${name}`, 'success')
  }, [addToast])

  const computeStats = useCallback((txt) => {
    if (!txt) {
      return {
        '总字符数': 0, '中文字符': 0, '英文字母': 0, '数字': 0,
        '标点符号': 0, '行数': 0, '段落数': 0,
      }
    }

    // 中文字符 (CJK)
    const chineseMatch = txt.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g)
    const chinese = chineseMatch ? chineseMatch.length : 0

    // 英文字母
    const englishMatch = txt.match(/[a-zA-Z]/g)
    const english = englishMatch ? englishMatch.length : 0

    // 数字
    const digitMatch = txt.match(/[0-9]/g)
    const digits = digitMatch ? digitMatch.length : 0

    // 中文标点
    const cnPunct = txt.match(/[\u3000-\u303f\uff00-\uffef]/g)
    const cnPunctCount = cnPunct ? cnPunct.length : 0

    // 英文标点
    const enPunct = txt.match(/[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]/g)
    const enPunctCount = enPunct ? enPunct.length : 0

    // 行数
    const lines = txt.split(/\r?\n/)
    const lineCount = lines.length

    // 段落数（连续非空行）
    let paragraphCount = 0
    let inParagraph = false
    for (const line of lines) {
      if (line.trim()) {
        if (!inParagraph) {
          paragraphCount++
          inParagraph = true
        }
      } else {
        inParagraph = false
      }
    }

    return {
      '总字符数': txt.length,
      '中文字符': chinese,
      '英文字母': english,
      '数字': digits,
      '标点符号': cnPunctCount + enPunctCount,
      '行数': lineCount,
      '段落数': paragraphCount,
    }
  }, [])

  const stats = computeStats(text)

  return (
    <WritingPageLayout
      title="字数统计增强版"
      description="粘贴文本或上传 .txt 文件，实时统计多个维度。所有处理在浏览器本地完成。"
    >
      {/* 操作区 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            输入文本 {fileName && <span className="text-gray-400 font-normal">- {fileName}</span>}
          </label>
          <TxtUploader onFileLoaded={handleFileLoaded} />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此粘贴或拖入文本内容..."
          className="w-full h-48 p-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-y focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">输入即实时统计</p>
          {text && (
            <button
              onClick={() => { setText(''); setFileName(''); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* 统计结果 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(stats).map(([key, value]) => (
          <div
            key={key}
            className={`rounded-2xl border p-4 text-center ${statColors[key] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
          >
            <div className="text-3xl font-bold mb-1">{value.toLocaleString()}</div>
            <div className="text-xs font-medium opacity-75">{key}</div>
          </div>
        ))}
      </div>

      {/* 补充统计 */}
      {text && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">补充信息</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              ['中文字符占比', stats['总字符数'] > 0 ? `${((stats['中文字符'] / stats['总字符数']) * 100).toFixed(1)}%` : '0%'],
              ['英文字母占比', stats['总字符数'] > 0 ? `${((stats['英文字母'] / stats['总字符数']) * 100).toFixed(1)}%` : '0%'],
              ['数字占比', stats['总字符数'] > 0 ? `${((stats['数字'] / stats['总字符数']) * 100).toFixed(1)}%` : '0%'],
              ['标点占比', stats['总字符数'] > 0 ? `${((stats['标点符号'] / stats['总字符数']) * 100).toFixed(1)}%` : '0%'],
              ['平均段长度', stats['段落数'] > 0 ? `${Math.round(stats['总字符数'] / stats['段落数'])} 字/段` : '0 字/段'],
              ['平均行长度', stats['行数'] > 0 ? `${Math.round(stats['总字符数'] / stats['行数'])} 字/行` : '0 字/行'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-800 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WritingPageLayout>
  )
}
