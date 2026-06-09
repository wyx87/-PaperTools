import { useState, useCallback, useRef } from 'react'
import { Upload, FileSpreadsheet, FileText, Table2, AlertTriangle, X, RotateCcw, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'

const MAX_ROWS_WARN = 5000

const colorThemes = [
  { id: 'blue', name: '经典蓝', colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'] },
  { id: 'warm', name: '暖色调', colors: ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#FBBF24', '#F87171', '#FB923C', '#FACC15', '#FDBA74', '#FCA5A5'] },
  { id: 'cool', name: '冷色调', colors: ['#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#22D3EE', '#38BDF8', '#60A5FA', '#818CF8', '#A78BFA'] },
  { id: 'earth', name: '大地色', colors: ['#78716C', '#A16207', '#65A30D', '#0D9488', '#0369A1', '#A8A29E', '#CA8A04', '#84CC16', '#14B8A6', '#0284C7'] },
  { id: 'purple', name: '紫罗兰', colors: ['#8B5CF6', '#EC4899', '#A855F7', '#D946EF', '#F43F5E', '#A78BFA', '#F472B6', '#C084FC', '#E879F9', '#FB7185'] },
  { id: 'academic', name: '学术经典', colors: ['#1E3A5F', '#C0392B', '#2980B9', '#27AE60', '#8E44AD', '#D35400', '#16A085', '#2C3E50', '#E74C3C', '#3498DB'] },
  { id: 'journal', name: '现代期刊', colors: ['#2C3E50', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E', '#E91E63'] },
  { id: 'colorblind', name: '色盲友好', colors: ['#0072B2', '#D55E00', '#009E73', '#F0E442', '#CC79A7', '#56B4E9', '#E69F00', '#000000', '#999999', '#EECC66'] },
  { id: 'contrast', name: '高对比', colors: ['#000000', '#FF0000', '#0000FF', '#008000', '#FFD700', '#FF00FF', '#00FFFF', '#FF8C00', '#800080', '#00FF00'] },
  { id: 'pastel', name: '柔和粉彩', colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D4BAFF', '#FFC9DE', '#C9FFE5', '#FFD4BA', '#C9BAFF'] },
  { id: 'cyberpunk', name: '赛博朋克', colors: ['#FF007F', '#00F0FF', '#FFD700', '#7B2FFF', '#00FF88', '#FF6600', '#00CCFF', '#FF00CC', '#00FFCC', '#CC00FF'] },
  { id: 'nature', name: '自然色', colors: ['#228B22', '#8B4513', '#87CEEB', '#FF6347', '#FFD700', '#6B8E23', '#D2691E', '#4682B4', '#CD853F', '#32CD32'] },
  { id: 'mono', name: '单色渐变', colors: ['#1E3A5F', '#244873', '#2A5587', '#30639B', '#3771AF', '#3D7FC3', '#4A8DD0', '#5E9BD8', '#72A9E0', '#86B7E8'] },
]

export { colorThemes }

/**
 * Resolve the final color array based on settings and series count.
 * Handles: customColors override, uniformColor mode, and theme fallback.
 */
export function resolveColors(settings, seriesCount = 1) {
  const theme = colorThemes.find(t => t.id === settings.themeId) || colorThemes[0]
  const base = settings.customColors || theme.colors
  if (settings.uniformColor) {
    return Array(Math.max(seriesCount, 1)).fill(settings.uniformColorValue || base[0])
  }
  // Cycle if fewer custom colors than series
  return Array.from({ length: seriesCount }, (_, i) => base[i % base.length])
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return null
  const headers = lines[0].split(/[,\t;|]/).map(h => h.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
  if (headers.length === 0) return null
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(/[,\t;|]/).map(v => v.trim().replace(/^["']|["']$/g, ''))
    if (vals.some(v => v !== '')) rows.push(vals)
  }
  return { headers, rows: rows.slice(0, MAX_ROWS_WARN + 100) }
}

function parseExcel(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (data.length < 2) return null
  const headers = data[0].map(String).filter(Boolean)
  if (headers.length === 0) return null
  const rows = data.slice(1).map(r => headers.map((_, i) => String(r[i] ?? ''))).filter(r => r.some(c => c !== ''))
  return { headers, rows: rows.slice(0, MAX_ROWS_WARN + 100) }
}

export { parseCSV, parseExcel, MAX_ROWS_WARN }

export default function ChartDataInput({ onDataChange, sampleHeaders, sampleRows, dataType = 'multi-series', children }) {
  const [mode, setMode] = useState('sample')
  const [csvText, setCsvText] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [xCol, setXCol] = useState(0)
  const [seriesCols, setSeriesCols] = useState([1])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const applyData = useCallback((headers, rows, x, scols) => {
    setParsedData({ headers, rows })
    if (onDataChange) {
      if (dataType === 'pie') {
        // For pie: first col = name, second col = value
        const items = rows.map(r => ({ name: String(r[x] || ''), value: parseFloat(r[scols[0] || 1]) || 0 }))
        onDataChange({ items, headers, rows, xCol: x, seriesCols: scols })
      } else if (dataType === 'scatter') {
        // For scatter: first col = x, second col = y
        const points = rows.map(r => [parseFloat(r[x]), parseFloat(r[scols[0] || 1])]).filter(p => !isNaN(p[0]) && !isNaN(p[1]))
        onDataChange({ points, headers, rows, xCol: x, seriesCols: scols })
      } else {
        // multi-series: first col = categories, rest = series
        const categories = rows.map(r => String(r[x] || ''))
        const series = scols.map((si, idx) => ({
          name: headers[si] || `系列${idx + 1}`,
          data: rows.map(r => parseFloat(r[si]) || 0),
        }))
        onDataChange({ categories, series, headers, rows, xCol: x, seriesCols: scols })
      }
    }
  }, [onDataChange, dataType])

  const handleSample = () => {
    setMode('sample')
    setParsedData(null)
    setError('')
    if (onDataChange) onDataChange(null)
  }

  const handleFile = useCallback((file) => {
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let result
        const name = file.name.toLowerCase()
        if (name.endsWith('.csv') || name.endsWith('.txt')) {
          result = parseCSV(e.target.result)
        } else {
          result = parseExcel(e.target.result)
        }
        if (!result) { setError('无法解析文件，请检查格式'); return }
        setMode('file')
        const x = 0, sc = [1]
        setXCol(x); setSeriesCols(sc)
        setCsvText('')
        applyData(result.headers, result.rows, x, sc)
      } catch (err) {
        setError('文件解析失败：' + err.message)
      }
    }
    if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  }, [applyData])

  const handleCsvApply = () => {
    setError('')
    const result = parseCSV(csvText)
    if (!result) { setError('CSV 格式不正确，至少需要表头+1行数据'); return }
    setMode('csv')
    const x = 0, sc = [1]
    setXCol(x); setSeriesCols(sc)
    applyData(result.headers, result.rows, x, sc)
  }

  const handleXColChange = (newX) => {
    setXCol(newX)
    if (parsedData) {
      const sc = seriesCols.filter(s => s !== newX)
      if (sc.length === 0) sc.push(newX === 0 ? 1 : 0)
      setSeriesCols(sc)
      applyData(parsedData.headers, parsedData.rows, newX, sc)
    }
  }

  const toggleSeriesCol = (colIdx) => {
    let sc
    if (seriesCols.includes(colIdx)) {
      if (seriesCols.length <= 1) return
      sc = seriesCols.filter(s => s !== colIdx)
    } else {
      sc = [...seriesCols, colIdx]
    }
    setSeriesCols(sc)
    if (parsedData) applyData(parsedData.headers, parsedData.rows, xCol, sc)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const previewRows = parsedData ? parsedData.rows.slice(0, 10) : (sampleRows?.slice(0, 10) || [])
  const previewHeaders = parsedData?.headers || sampleHeaders || []

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={handleSample} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${mode === 'sample' ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          示例数据
        </button>
        <button onClick={() => { setMode('upload'); setError('') }} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center gap-1 ${mode === 'upload' ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Upload size={11} />上传文件
        </button>
        <button onClick={() => { setMode('csv'); setError('') }} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center gap-1 ${mode === 'csv' ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <FileText size={11} />粘贴数据
        </button>
      </div>

      {/* Upload area */}
      {mode === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-[#3B82F6] bg-[#3B82F6]/5' : 'border-gray-200 hover:border-[#3B82F6]/50 hover:bg-gray-50'}`}
        >
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]) }} className="hidden" />
          <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 font-medium">拖放文件到此处，或点击选择</p>
          <p className="text-[10px] text-gray-400 mt-1">支持 CSV、Excel (.xlsx/.xls) 格式</p>
        </div>
      )}

      {/* CSV paste */}
      {mode === 'csv' && (
        <div>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={"粘贴 CSV 数据（逗号/制表符分隔）\n第一行为表头，后续为数据行\n\n示例：\n类别,指标1,指标2\n对照组,45,38\n实验组A,62,55"}
            rows={6}
            className="w-full text-xs font-mono p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none resize-y"
          />
          <button onClick={handleCsvApply} className="mt-2 px-4 py-1.5 bg-[#3B82F6] text-white text-xs rounded-lg font-medium hover:bg-[#2563EB]">
            解析数据
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          <X size={14} />{error}
        </div>
      )}

      {/* Data preview + column mapping */}
      {parsedData && mode !== 'sample' && (
        <div className="space-y-3">
          {/* Column mapping */}
          {dataType !== 'pie' && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 font-medium">X轴列：</span>
                <select value={xCol} onChange={e => handleXColChange(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-[#3B82F6] outline-none">
                  {parsedData.headers.map((h, i) => (
                    <option key={i} value={i}>{h}{i === xCol ? ' (当前)' : ''}</option>
                  ))}
                </select>
              </div>
              {dataType !== 'scatter' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-500 font-medium">数据列：</span>
                  {parsedData.headers.map((h, i) => (
                    i !== xCol && (
                      <button key={i} onClick={() => toggleSeriesCol(i)}
                        className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${seriesCols.includes(i) ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                        {h}
                      </button>
                    )
                  ))}
                </div>
              )}
              {dataType === 'pie' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500 font-medium">标签列：{parsedData.headers[xCol]}</span>
                  <span className="text-[10px] text-gray-500 font-medium">数值列：{parsedData.headers[seriesCols[0] || 1]}</span>
                  <button onClick={() => { const ns = xCol === 0 ? 1 : 0; setXCol(ns); toggleSeriesCol(ns === 1 ? 0 : 1) }}
                    className="px-2 py-0.5 text-[10px] rounded bg-white border border-gray-200 text-gray-500 hover:bg-gray-100">交换</button>
                </div>
              )}
            </div>
          )}

          {/* Preview table */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Table2 size={13} className="text-gray-400" />
              <span className="text-[10px] font-medium text-gray-500 uppercase">数据预览 ({parsedData.rows.length} 行 × {parsedData.headers.length} 列)</span>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-48">
              <table className="text-[10px] w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {parsedData.headers.map((h, i) => (
                      <th key={i} className={`px-2 py-1.5 text-left font-medium whitespace-nowrap border-b border-gray-200 ${i === xCol ? 'text-[#3B82F6]' : seriesCols.includes(i) ? 'text-[#10B981]' : 'text-gray-600'}`}>
                        {i === xCol ? '📌 ' : ''}{h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      {parsedData.headers.map((_, ci) => (
                        <td key={ci} className="px-2 py-1 text-gray-600 whitespace-nowrap border-b border-gray-100">{String(row[ci] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.rows.length > 10 && (
              <p className="text-[10px] text-gray-400 mt-1">显示前 10 行，共 {parsedData.rows.length} 行</p>
            )}
          </div>

          {/* Performance warning */}
          {parsedData.rows.length > MAX_ROWS_WARN && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-amber-700">
                <p className="font-medium">数据量较大</p>
                <p className="mt-0.5">共 {parsedData.rows.length} 行数据，渲染可能卡顿。建议将数据精简至 {MAX_ROWS_WARN} 行以内。</p>
              </div>
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  )
}
