import { useState, useCallback } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import { Copy, Plus, Trash2, FileText, Info } from 'lucide-react'

const sampleCsv = `变量	对照组	实验组A	实验组B
准确率(%)	85.2	92.7	89.4
召回率(%)	78.9	88.3	85.1
F1分数	81.9	90.4	87.2
训练时间(h)	12.5	8.3	10.1`

// ===== 常见分隔符（按检测优先级排列） =====
const COMMON_DELIMITERS = [
  { sep: '\t',        label: 'Tab 制表符',    desc: '（常用于 Excel/WPS 复制粘贴）' },
  { sep: '|',         label: '竖线 |',         desc: '（手动输入分隔）' },
  { sep: ',',         label: '英文逗号 ,',     desc: '（CSV 标准格式）' },
  { sep: '，',        label: '中文逗号 ，',    desc: '（中文输入法常用）' },
  { sep: ';',         label: '分号 ;',         desc: '（CSV 备选分隔）' },
  { sep: '；',        label: '中文分号 ；',    desc: '（中文输入法常用）' },
  { sep: ':',         label: '冒号 :',         desc: '' },
  { sep: '：',        label: '中文冒号 ：',    desc: '' },
  { sep: '/',         label: '斜线 /',         desc: '' },
  { sep: '、',        label: '顿号 、',        desc: '' },
  { sep: '\\',        label: '反斜线 \\',       desc: '' },
  { sep: '  ',        label: '连续空格',       desc: '（两个及以上空格）' },
  { sep: ' ',         label: '单空格',          desc: '（每列之间用一个空格隔开）' },
]

// ===== 通用符号扫描：检测文本中所有可能的符号分隔符 =====
function scanAllSymbols(text) {
  const symbolMap = new Map()
  // 提取每行中的所有连续符号序列（非字母、非数字、非空格）
  for (const ch of text) {
    if (/[^\w\s\u4e00-\u9fff]/.test(ch) && ch !== ' ' && ch !== '\t') {
      symbolMap.set(ch, (symbolMap.get(ch) || 0) + 1)
    }
  }
  // 按出现频率降序，过滤只出现1次的偶然符号
  return [...symbolMap.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([ch]) => ({ sep: ch, label: `符号「${ch}」`, desc: '（自动识别）' }))
}

// ===== 检测一个分隔符是否有效（所有行列数一致且 > 1） =====
function testDelimiter(lines, def) {
  if (def.sep === '  ') {
    const counts = lines.map(l => l.trim().split(/\s{2,}/).length)
    return counts[0] > 1 && counts.every(c => c === counts[0])
  }
  if (def.sep === ' ') {
    const counts = lines.map(l => l.trim().split(' ').filter(Boolean).length)
    return counts[0] > 1 && counts.every(c => c === counts[0])
  }
  // 转义正则特殊字符
  const escaped = def.sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped)
  const counts = lines.map(l => l.split(regex).length)
  return counts[0] > 1 && counts.every(c => c === counts[0])
}

// ===== 自动检测分隔符 =====
// 优先级：常见分隔符 → 自动扫描的符号 → 连续空格 → 单空格 → Tab 兜底
function detectDelimiter(text) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return { sep: '\t', label: 'Tab 制表符', desc: '' }

  // 1. 先检查常见分隔符（含空格）
  for (const def of COMMON_DELIMITERS) {
    if (testDelimiter(lines, def)) return def
  }

  // 2. 自动扫描文本中的其他符号
  const autoSymbols = scanAllSymbols(text)
  for (const def of autoSymbols) {
    if (testDelimiter(lines, def)) return def
  }

  return { sep: '\t', label: 'Tab 制表符', desc: '' } // 兜底
}

// ===== 获取分隔符的可读标签 =====
function getDelimiterLabel(detected) {
  if (!detected) return 'Tab 制表符'
  return `${detected.label} ${detected.desc || ''}`.trim()
}

// ===== 解析数据 =====
function parseCsv(csv) {
  const detected = detectDelimiter(csv)
  const sep = detected.sep

  if (sep === '  ') {
    return csv.trim().split('\n').map(line =>
      line.trim().split(/\s{2,}/).map(c => c.trim()).filter(c => c !== '')
    ).filter(row => row.length > 0 && row.some(c => c !== ''))
  }
  if (sep === ' ') {
    return csv.trim().split('\n').map(line =>
      line.trim().split(' ').filter(Boolean).map(c => c.trim())
    ).filter(row => row.length > 0 && row.some(c => c !== ''))
  }

  // 通用分隔符：转义正则特殊字符后分割
  const escaped = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped)
  return csv.trim().split('\n').map(line =>
    line.split(regex).map(c => c.trim())
  ).filter(row => row.length > 0 && row[0] !== '')
}

function csvToString(rows) {
  return rows.map(r => r.join('\t')).join('\n')
}

export default function TablePage() {
  const [csvText, setCsvText] = useState(sampleCsv)
  const [rows, setRows] = useState(() => parseCsv(sampleCsv))
  const [detectedSep, setDetectedSep] = useState(() => detectDelimiter(sampleCsv))
  const [copied, setCopied] = useState(false)
  const [exportingDocx, setExportingDocx] = useState(false)

  const applyCsv = useCallback(() => {
    setDetectedSep(detectDelimiter(csvText))
    setRows(parseCsv(csvText))
  }, [csvText])

  const updateCell = useCallback((r, c, val) => {
    setRows(prev => {
      const n = prev.map(row => [...row])
      if (!n[r]) return prev
      n[r][c] = val
      setCsvText(csvToString(n))
      return n
    })
  }, [])

  const addRow = useCallback(() => {
    setRows(prev => {
      const cols = prev[0]?.length || 3
      const n = [...prev, Array(cols).fill('')]
      setCsvText(csvToString(n))
      return n
    })
  }, [])

  const addCol = useCallback(() => {
    setRows(prev => {
      const n = prev.map(row => [...row, ''])
      setCsvText(csvToString(n))
      return n
    })
  }, [])

  const delRow = useCallback((idx) => {
    setRows(prev => {
      if (prev.length <= 1) return prev
      const n = prev.filter((_, i) => i !== idx)
      setCsvText(csvToString(n))
      return n
    })
  }, [])

  const copyTable = useCallback(async () => {
    // 三线表：顶线+表头下线+底线，使用 cell 级边框确保 Word 粘贴可见
    const thBorder = 'border-top:2pt solid #000;border-bottom:0.75pt solid #000;'
    const tdBorder = 'border-bottom:0.5pt solid #ddd;'
    const footBorder = 'border-bottom:2pt solid #000;'

    // 将 rows 转为 Tab 分隔的纯文本（确保 Word/Excel 粘贴时正确分列）
    const tabSeparatedRows = rows.map(r => r.join('\t')).join('\n')

    const tableHtml = `
      <table style="border-collapse:collapse;width:100%;font-family:SimSun,serif;font-size:10.5pt;">
        <thead>
          <tr>
            ${rows[0]?.map(c => `<th style="padding:6px 12px;text-align:center;font-weight:bold;${thBorder}">${c}</th>`).join('') || ''}
          </tr>
        </thead>
        <tbody>
          ${rows.slice(1).map((row, ri) => `
            <tr>
              ${row.map(c => `<td style="padding:6px 12px;text-align:center;${ri === rows.length - 2 ? footBorder : tdBorder}">${c}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>`

    try {
      const blob = new Blob([tableHtml], { type: 'text/html' })
      const item = new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([tabSeparatedRows], { type: 'text/plain' }) })
      await navigator.clipboard.write([item])
    } catch {
      // 兜底：用 tab 分隔的文本写入剪贴板
      await navigator.clipboard.writeText(tabSeparatedRows)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [rows])

  const handleExportDocx = useCallback(async () => {
    setExportingDocx(true)
    try {
      const headers = rows[0] || []
      const dataRows = rows.slice(1)
      const { exportTableDocx, downloadDocx } = await import('../utils/clientDocxExport')
      const blob = await exportTableDocx(headers, dataRows, '三线表')
      downloadDocx(blob, '三线表.docx')
    } catch (e) { alert('导出失败：' + (e.message || '请重试')) }
    setExportingDocx(false)
  }, [rows])

  const colCount = rows[0]?.length || 0

  return (
    <ChartPageLayout title="三线表生成器" breadcrumb="三线表">
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1E3A5F]">数据输入</h3>
            <div className="flex gap-1.5">
              <button onClick={addCol} className="px-2 py-1 text-[10px] bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center gap-0.5">
                <Plus size={10} />列
              </button>
              <button onClick={addRow} className="px-2 py-1 text-[10px] bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center gap-0.5">
                <Plus size={10} />行
              </button>
            </div>
          </div>
          <div className="mb-2 p-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-[#1E40AF]">💡 分隔符提示：</span>
            <span className="text-[10px] text-[#3B82F6]">推荐用 <strong>英文逗号 ,</strong> 或 <strong>Tab</strong> 隔开不同列（最稳定）。也支持 竖线| / 中文逗号，/ 分号; 自动识别。</span>
          </div>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={`每行一列，不同列用 逗号, 隔开。\n第一行自动作为表头。\n\n示例（逗号分隔）：\n姓名,年龄,专业\n张三,25,计算机\n李四,23,数学\n\n也支持：Tab / 竖线 | / 中文逗号 ，/ 分号 ; （自动识别）`}
            rows={8}
            className="w-full text-xs font-mono p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none resize-y mb-2"
          />
          <div className="flex items-center gap-2 mb-2">
            <button onClick={applyCsv} className="px-3 py-1.5 bg-[#3B82F6] text-white text-xs rounded-lg font-medium hover:bg-[#2563EB]">
              应用数据
            </button>
            <span className="text-[10px] text-gray-400">
              当前分隔符：<span className="font-semibold text-[#1E3A5F]">{getDelimiterLabel(detectedSep)}</span>
            </span>
          </div>
          {/* 使用说明 */}
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-1.5">
              <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800 leading-relaxed">
                <p className="font-semibold mb-1">使用方法</p>
                <ol className="list-decimal pl-3.5 space-y-0.5">
                  <li>在文本框中输入表格数据，<b>不同列之间用逗号 , 隔开</b>（推荐），<b>第一行自动作为表头</b>。</li>
                  <li>也支持 Tab 制表符、竖线 |、中文逗号 ，、空格 等分隔符——<b>输入后点击「应用数据」会自动识别</b>。</li>
                  <li>每行数据换一行（按回车），列数自动匹配。</li>
                  <li>点击「复制到Word」→ 打开Word → Ctrl+V 粘贴，即可获得标准三线表格式。</li>
                </ol>
                <p className="mt-1.5 text-amber-600">
                  💡 推荐从 Excel/WPS 中复制数据后直接粘贴到此处（自动使用 Tab 分隔）。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1E3A5F]">表格预览（三线表）</h3>
            <div className="flex gap-1.5">
              <button onClick={copyTable}
                className={`px-2.5 py-1 text-[11px] rounded-md font-medium flex items-center gap-1 ${copied ? 'bg-green-100 text-green-700' : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'}`}>
                <Copy size={11} />{copied ? '已复制' : '复制到Word'}
              </button>
              <button onClick={handleExportDocx}
                className={`px-2.5 py-1 text-[11px] rounded-md font-medium flex items-center gap-1 ${exportingDocx ? 'bg-green-100 text-green-700' : 'bg-[#10B981] text-white hover:bg-[#059669]'}`}>
                <FileText size={11} />{exportingDocx ? '导出中...' : '下载Word'}
              </button>
            </div>
          </div>

          {/* Editable table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr style={{ borderTop: '2pt solid #000', borderBottom: '0.75pt solid #000' }}>
                  {rows[0]?.map((cell, c) => (
                    <th key={c} className="px-2 py-1.5 text-center font-semibold text-[#1E3A5F]">
                      <input value={cell} onChange={e => updateCell(0, c, e.target.value)}
                        className="w-full text-center bg-transparent border-none outline-none text-xs" />
                    </th>
                  ))}
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, r) => (
                  <tr key={r} className="border-b border-gray-100">
                    {row.map((cell, c) => (
                      <td key={c} className="px-2 py-1.5 text-center text-[#6B7280]">
                        <input value={cell} onChange={e => updateCell(r + 1, c, e.target.value)}
                          className="w-full text-center bg-transparent border-none outline-none text-xs" />
                      </td>
                    ))}
                    <td className="text-center">
                      <button onClick={() => delRow(r + 1)} className="text-gray-300 hover:text-red-500">
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderBottom: '2pt solid #000' }}>
                  <td colSpan={colCount + 1} className="h-0" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#1E3A5F]/5 rounded-lg space-y-1.5">
        <p className="text-xs text-[#6B7280]">
          <span className="font-semibold text-[#1E3A5F]">三线表规范：</span>
          顶线 2pt 粗线，表头线 0.75pt 细线，底线 2pt 粗线。
          点击「复制到Word」后直接粘贴即可保持格式（宋体 10.5pt，符合中文论文标准）。
        </p>
        <p className="text-[10px] text-gray-400">
          💡 粘贴技巧：在 Word 中右键 →「粘贴选项」→「保留源格式」可确保三线表边框完整显示。
        </p>
      </div>
    </ChartPageLayout>
  )
}
