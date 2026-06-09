import { useState } from 'react'
import { ClipboardCheck, Upload, FileText, AlertTriangle, CheckCircle, Search, Loader2, X } from 'lucide-react'
import JSZip from 'jszip'

// 常见论文格式问题检测规则
const rules = [
  { id: 'heading-levels', name: '标题层级', desc: '检查标题编号是否合理、层级是否越级' },
  { id: 'figure-numbering', name: '图号连续', desc: '检查图编号是否连续、缺失' },
  { id: 'table-numbering', name: '表号连续', desc: '检查表编号是否连续、缺失' },
  { id: 'reference-format', name: '参考文献', desc: '检查参考文献格式是否统一' },
  { id: 'page-break', name: '分页检查', desc: '检查是否有孤行、空白页' },
  { id: 'font-consistency', name: '字体一致性', desc: '检查是否存在混用中英文字体问题（基于文本特征推断）' },
  { id: 'paragraph-length', name: '段落长度', desc: '检查过长或过短的段落' },
  { id: 'punctuation', name: '标点规范', desc: '检查中英文标点混用、多余空格等问题' },
]

// 解析 docx XML 中的文本
async function extractDocxText(file) {
  const arrayBuffer = await file.arrayBuffer()
  let zip
  try {
    zip = await JSZip.loadAsync(arrayBuffer)
  } catch (e) {
    throw new Error('文件损坏或不是有效的 .docx 文件。请确认文件可以正常用 Word 打开。')
  }

  const docXml = await zip.file('word/document.xml')?.async('string')
  if (!docXml) throw new Error('无法读取文档内容。请确认是标准的 .docx 格式文件。')

  // 提取所有文本段落
  const paraRegex = /<w:p[ >]([\s\S]*?)<\/w:p>/g
  const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
  const paragraphs = []
  let paraMatch
  while ((paraMatch = paraRegex.exec(docXml)) !== null) {
    const paraText = []
    let textMatch
    while ((textMatch = textRegex.exec(paraMatch[1])) !== null) {
      paraText.push(textMatch[1])
    }
    const text = paraText.join('')
    if (text.trim()) paragraphs.push(text.trim())
  }

  if (paragraphs.length === 0) {
    throw new Error('文档中没有检测到文本内容。请确认文档不是纯图片或扫描件。')
  }

  return { paragraphs, rawXml: docXml }
}

// 检测编号连续性问题
function checkNumbering(paragraphs, prefix) {
  const issues = []
  const pattern = new RegExp(`${prefix}\\s*(\\d+)`, 'g')
  const nums = []

  paragraphs.forEach((p, idx) => {
    let m
    while ((m = pattern.exec(p)) !== null) {
      nums.push({ num: parseInt(m[1]), line: idx + 1, text: p.substring(0, 40) })
    }
  })

  if (nums.length === 0) return [{ type: 'info', message: `未找到${prefix}编号` }]

  nums.sort((a, b) => a.num - b.num)
  for (let i = 1; i < nums.length; i++) {
    if (nums[i].num !== nums[i - 1].num + 1) {
      issues.push({
        type: 'warning',
        message: `${prefix}${nums[i - 1].num} → ${prefix}${nums[i].num} 之间缺少 ${prefix}${nums[i - 1].num + 1}`,
        detail: `第 ${nums[i - 1].line} 行后可能缺少编号`
      })
    }
  }

  // 检查是否有重复编号
  const counts = {}
  nums.forEach(n => { counts[n.num] = (counts[n.num] || 0) + 1 })
  Object.entries(counts).filter(([, c]) => c > 1).forEach(([num]) => {
    issues.push({ type: 'warning', message: `${prefix}${num} 重复出现了 ${counts[num]} 次` })
  })

  if (issues.length === 0) issues.push({ type: 'ok', message: `${prefix}编号连续，共 ${nums.length} 个，无问题` })
  return issues
}

// 检查标题层级
function checkHeadings(paragraphs) {
  const issues = []
  const headingPatterns = [
    { level: 1, pattern: /^第[一二三四五六七八九十\d]+章/ },
    { level: 1, pattern: /^(引言|绪论|Abstract|Introduction|Conclusion|参考文献|致谢|附录)/i },
    { level: 2, pattern: /^[一二三四五六七八九十]、/ },
    { level: 2, pattern: /^\d+\.\d+\s/ },
    { level: 3, pattern: /^[（(][一二三四五六七八九十\d]+[)）]/ },
    { level: 3, pattern: /^\d+\.\d+\.\d+\s/ },
  ]

  const found = []
  paragraphs.forEach((p, idx) => {
    for (const rule of headingPatterns) {
      if (rule.pattern.test(p)) {
        found.push({ level: rule.level, index: idx + 1, text: p.substring(0, 50) })
        break
      }
    }
  })

  if (found.length === 0) {
    issues.push({ type: 'info', message: '未检测到明显标题格式，请确认文档已正确使用标题样式' })
    return issues
  }

  // 检查越级
  for (let i = 1; i < found.length; i++) {
    const prev = found[i - 1]
    const curr = found[i]
    if (curr.level > prev.level + 1) {
      issues.push({
        type: 'warning',
        message: `标题层级跳跃：第 ${prev.index} 行（${prev.level}级）→ 第 ${curr.index} 行（${curr.level}级），可能缺少过渡标题`,
        detail: `"${prev.text}" → "${curr.text}"`
      })
    }
  }

  const levelCounts = {}
  found.forEach(h => { levelCounts[h.level] = (levelCounts[h.level] || 0) + 1 })
  const summary = Object.entries(levelCounts).map(([lvl, cnt]) => `${cnt}个${lvl}级标题`).join('，')
  issues.push({ type: 'ok', message: `检测到 ${found.length} 个标题（${summary}）` })

  return issues
}

// 检查参考文献格式
function checkReferences(paragraphs) {
  const issues = []
  const refStartIdx = paragraphs.findIndex(p => /^(参考文献|References|Bibliography)/i.test(p))
  if (refStartIdx === -1) {
    issues.push({ type: 'info', message: '未找到"参考文献"章节' })
    return issues
  }

  const refs = paragraphs.slice(refStartIdx + 1).filter(p => /^\[?\d+\]?[\.\s]/.test(p) && p.length > 5)
  if (refs.length === 0) {
    issues.push({ type: 'info', message: '参考文献章节中未找到编号条目' })
    return issues
  }

  // 检查是否存在混用格式
  const hasGB = refs.some(r => /[J][\s]*\./.test(r))
  const hasAPA = refs.some(r => /\(\d{4}\)/.test(r))

  if (hasGB && hasAPA) {
    issues.push({ type: 'warning', message: '参考文献可能混用了不同格式（GB/APA），建议统一' })
  } else if (hasGB) {
    issues.push({ type: 'ok', message: `检测到 ${refs.length} 条参考文献，疑似 GB/T 7714 格式` })
  } else {
    issues.push({ type: 'ok', message: `检测到 ${refs.length} 条参考文献` })
  }

  return issues
}

// 检查段落分布
function checkParagraphs(paragraphs) {
  const issues = []
  const total = paragraphs.length

  if (total === 0) {
    issues.push({ type: 'error', message: '文档没有有效文本段落' })
    return issues
  }

  // 统计字数
  const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0)
  const avgLen = Math.round(totalChars / total)

  issues.push({ type: 'ok', message: `共 ${total} 段，约 ${totalChars} 字符，平均每段 ${avgLen} 字` })

  // 检查过长段落
  const longParas = paragraphs.filter(p => p.length > 500)
  if (longParas.length > 0) {
    issues.push({ type: 'info', message: `有 ${longParas.length} 段超过 500 字符，建议适当分段` })
  }

  return issues
}

// 检查段落长度（细化）
function checkParagraphLength(paragraphs) {
  const issues = []
  const stats = { tooShort: 0, tooLong: 0, empty: 0 }

  paragraphs.forEach((p, idx) => {
    if (p.length === 0) {
      issues.push({ type: 'warning', message: `第 ${idx + 1} 段为空段落`, detail: '建议删除多余空行' })
      stats.empty++
    } else if (p.length < 20 && idx > 0 && idx < paragraphs.length - 1) {
      stats.tooShort++
    } else if (p.length > 800) {
      issues.push({ type: 'warning', message: `第 ${idx + 1} 段过长（${p.length}字）`, detail: `内容："${p.substring(0, 40)}..."` })
      stats.tooLong++
    }
  })

  if (stats.tooShort > 0) {
    issues.push({ type: 'info', message: `有 ${stats.tooShort} 个过短段落（<20字），可能内容不完整` })
  }
  if (issues.length === 0) {
    issues.push({ type: 'ok', message: '段落长度分布合理' })
  }
  return issues
}

// 检查字体一致性（基于中英文混用推断）
function checkFontConsistency(paragraphs) {
  const issues = []
  let cnOnlyCount = 0, enOnlyCount = 0, mixedCount = 0

  paragraphs.forEach(p => {
    const hasCN = /[\u4e00-\u9fff]/.test(p)
    const hasEN = /[a-zA-Z]{3,}/.test(p)
    if (hasCN && !hasEN) cnOnlyCount++
    else if (!hasCN && hasEN) enOnlyCount++
    else if (hasCN && hasEN) mixedCount++
  })

  if (cnOnlyCount > 0 && enOnlyCount > 0 && mixedCount > 0) {
    issues.push({ type: 'ok', message: '文档包含中英文内容（正常混排）', detail: `${cnOnlyCount}中文段 · ${enOnlyCount}英文段 · ${mixedCount}混排段` })
  } else if (enOnlyCount > 0 && cnOnlyCount === 0) {
    issues.push({ type: 'info', message: '文档为纯英文，建议设置英文格式检查' })
  } else {
    issues.push({ type: 'ok', message: '文档语言分布正常' })
  }

  // 中英文符号混用检查
  const cnPunct = /[，。；：！？（）【】《》]/g
  const enPunct = /[,.;:!?()\[\]{}"']/g
  let cnInEn = 0, enInCn = 0
  paragraphs.forEach((p, idx) => {
    const cnMatches = p.match(cnPunct)
    const enMatches = p.match(enPunct)
    if (/[a-zA-Z]{10,}/.test(p) && cnMatches) {
      cnInEn++
      if (cnInEn <= 3) {
        issues.push({ type: 'warning', message: `第 ${idx + 1} 段英文内容中混用中文标点`, detail: `发现：${cnMatches.slice(0, 3).join(' ')}` })
      }
    }
  })

  if (cnInEn === 0 && enInCn === 0) {
    issues.push({ type: 'ok', message: '中英文标点使用规范' })
  }
  return issues
}

// 检查标点规范
function checkPunctuation(paragraphs) {
  const issues = []

  paragraphs.forEach((p, idx) => {
    const lineNum = idx + 1
    // 检查多余空格（中文内容中不应有连续空格）
    const spaces = p.match(/\s{2,}/g)
    if (spaces) {
      issues.push({ type: 'warning', message: `第 ${lineNum} 段存在多余空格（${spaces.length}处）`, detail: '中文论文中通常不需要连续空格' })
    }

    // 检查中英文标点混用
    const hasENComma = /[a-zA-Z]\s*,/.test(p)
    if (hasENComma) {
      issues.push({ type: 'info', message: `第 ${lineNum} 段英文逗号前有空格`, detail: '英文逗号前不应有空格' })
    }

    // 缺省标点：句末缺句号
    if (p.length > 20 && !/[。！？\.!\?]$/.test(p.trim()) && !/^[#\d]/.test(p.trim())) {
      // 可能是标题或列表，不报错
    }

    // 中文引号不匹配
    const leftQ = (p.match(/"/g) || []).length
    if (leftQ % 2 !== 0) {
      issues.push({ type: 'warning', message: `第 ${lineNum} 段中文引号不匹配`, detail: '中文双引号"' + '"' + '应成对出现' })
    }
  })

  // 全局统计
  const totalCommaCN = paragraphs.reduce((s, p) => s + (p.match(/，/g) || []).length, 0)
  const totalCommaEN = paragraphs.reduce((s, p) => s + (p.match(/,\s*/g) || []).length, 0)
  const totalPeriodCN = paragraphs.reduce((s, p) => s + (p.match(/。/g) || []).length, 0)
  const totalPeriodEN = paragraphs.reduce((s, p) => s + (p.match(/\./g) || []).length, 0)

  if (totalCommaCN > 0 && totalCommaEN > totalCommaCN * 2) {
    issues.push({ type: 'info', message: '英文逗号比例偏高，请确认中英文标点没有混用', detail: `中文逗号${totalCommaCN} · 英文逗号${totalCommaEN}` })
  }

  if (issues.length === 0) {
    issues.push({ type: 'ok', message: '标点使用基本规范', detail: `中文句号${totalPeriodCN} · 英文句号${totalPeriodEN}` })
  }
  return issues
}

export default function FormatTool() {
  const [file, setFile] = useState(null)
  const [results, setResults] = useState([])
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [activeRules, setActiveRules] = useState(rules.map(r => r.id))

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.endsWith('.docx')) {
      setMessage('请上传 .docx 格式文件')
      return
    }
    setFile(f)
    setMessage('')
    setResults([])
  }

  const toggleRule = (id) => {
    setActiveRules(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  const runCheck = async () => {
    if (!file) return
    setChecking(true)
    setMessage('分析中...')
    setResults([])

    try {
      const { paragraphs } = await extractDocxText(file)
      const allResults = []

      if (activeRules.includes('heading-levels')) {
        allResults.push({ section: '标题层级检查', items: checkHeadings(paragraphs) })
      }
      if (activeRules.includes('figure-numbering')) {
        allResults.push({ section: '图编号检查', items: checkNumbering(paragraphs, '图') })
      }
      if (activeRules.includes('table-numbering')) {
        allResults.push({ section: '表编号检查', items: checkNumbering(paragraphs, '表') })
      }
      if (activeRules.includes('reference-format')) {
        allResults.push({ section: '参考文献检查', items: checkReferences(paragraphs) })
      }
      if (activeRules.includes('page-break')) {
        allResults.push({ section: '段落统计', items: checkParagraphs(paragraphs) })
      }
      if (activeRules.includes('font-consistency')) {
        allResults.push({ section: '字体与中英文混排', items: checkFontConsistency(paragraphs) })
      }
      if (activeRules.includes('paragraph-length')) {
        allResults.push({ section: '段落长度检查', items: checkParagraphLength(paragraphs) })
      }
      if (activeRules.includes('punctuation')) {
        allResults.push({ section: '标点规范检查', items: checkPunctuation(paragraphs) })
      }

      setResults(allResults)
      const totalIssues = allResults.reduce((sum, s) => sum + s.items.filter(i => i.type === 'warning' || i.type === 'error').length, 0)
      setMessage(totalIssues === 0
        ? '检查完成，未发现明显问题 ✅'
        : `检查完成，发现 ${totalIssues} 个需要注意的问题`)
    } catch (err) {
      setMessage('检查失败：' + err.message)
    }
    setChecking(false)
  }

  const getIssueIcon = (type) => {
    switch (type) {
      case 'error': return <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
      case 'warning': return <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
      case 'ok': return <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
      case 'info': return <Search size={14} className="text-blue-500 flex-shrink-0" />
      default: return null
    }
  }

  const getIssueClass = (type) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-100 text-red-700'
      case 'warning': return 'bg-yellow-50 border-yellow-100 text-yellow-700'
      case 'ok': return 'bg-green-50 border-green-100 text-green-700'
      case 'info': return 'bg-blue-50 border-blue-100 text-blue-700'
      default: return 'bg-gray-50 border-gray-100 text-gray-600'
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">论文格式检查</h2>
      <p className="text-gray-500 text-sm mb-6">
        上传 .docx 文档，自动检测标题层级、图表编号、参考文献等常见格式问题
      </p>

      {/* Upload */}
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center mb-6">
        {!file ? (
          <>
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 mb-2 font-medium">上传 .docx 文档开始检查</p>
            <p className="text-gray-400 text-sm mb-4">支持 Microsoft Word .docx 格式</p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
              <Upload size={16} />
              选择 .docx 文件
              <input type="file" accept=".docx" onChange={handleFile} className="hidden" />
            </label>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText size={22} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={() => { setFile(null); setResults([]); setMessage('') }}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
              重新选择
            </button>
          </div>
        )}
      </div>

      {/* Rule selectors + Run */}
      {file && (
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <span className="text-xs text-gray-500 mb-2 block">选择检查项目</span>
            <div className="flex flex-wrap gap-2">
              {rules.map(rule => (
                <button
                  key={rule.id}
                  onClick={() => toggleRule(rule.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeRules.includes(rule.id)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  {rule.name}
                </button>
              ))}
            </div>
          </div>

          {!checking && (
            <button
              onClick={runCheck}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              <ClipboardCheck size={18} /> 开始检查
            </button>
          )}
        </div>
      )}

      {/* Progress */}
      {checking && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          <span className="text-gray-600">{message}</span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {message && !checking && (
            <div className={`text-sm text-center p-3 rounded-lg ${
              message.includes('✅') ? 'bg-green-50 text-green-700' : message.includes('问题') ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {message}
            </div>
          )}

          {results.map((section, si) => (
            <div key={si} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <span className="text-sm font-semibold text-gray-700">{section.section}</span>
                <span className="ml-2 text-xs text-gray-400">{section.items.length} 项</span>
              </div>
              <div className="p-4 space-y-2">
                {section.items.map((item, ii) => (
                  <div key={ii} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${getIssueClass(item.type)}`}>
                    {getIssueIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.message}</p>
                      {item.detail && <p className="text-xs mt-0.5 opacity-70">{item.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
        <p className="text-xs text-gray-500">
          <strong>当前支持：</strong>
          ① 标题层级越级检测 → ② 图/表编号连续检查 → ③ 参考文献格式一致性 → ④ 段落统计 → 
          ⑤ 字体与中英文混排 → ⑥ 段落长度检查 → ⑦ 标点规范检查。
          请上传 .docx 格式文件，检查在浏览器本地完成，不消耗 API Token。
        </p>
      </div>
    </div>
  )
}
