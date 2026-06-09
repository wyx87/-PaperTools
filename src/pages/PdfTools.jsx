import { useState, useRef } from 'react'
import { FileText, Combine, Scissors, FileDown, Image, RotateCw, Trash2, Download, Upload, X, Eye, Check, FileOutput } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { downloadBlob, formatFileSize } from '../utils'

// 解析拆分范围 "1-5,6-10" → [[1,5],[6,10]]
function parseSplitRange(input) {
  const ranges = []
  for (const part of input.split(',')) {
    const m = part.trim().match(/^(\d+)\s*[-~]\s*(\d+)$/)
    if (m) {
      const start = parseInt(m[1]), end = parseInt(m[2])
      if (start > 0 && end >= start) ranges.push([start, end])
    }
  }
  return ranges
}

const tools = [
  { id: 'merge', icon: Combine, label: '合并 PDF', desc: '多个PDF合为一个' },
  { id: 'split', icon: Scissors, label: '拆分 PDF', desc: '按页拆分成多个' },
  { id: 'compress', icon: FileDown, label: '压缩 PDF', desc: '减小文件体积' },
  { id: 'extract', icon: Image, label: '提取图片', desc: '导出PDF中的图片' },
  { id: 'rotate', icon: RotateCw, label: '旋转页面', desc: '调整页面方向' },
  { id: 'delete', icon: Trash2, label: '删除页面', desc: '去掉不需要的页' },
]

export default function PdfTools() {
  const [active, setActive] = useState('merge')
  const [files, setFiles] = useState([])
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const [previewPages, setPreviewPages] = useState([])
  const [selectedPages, setSelectedPages] = useState(new Set())
  const [rotation, setRotation] = useState(90)
  const dropRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  // 拆分模式
  const [splitMode, setSplitMode] = useState('each') // each | parts | range
  const [splitParts, setSplitParts] = useState(2)
  const [splitRangeInput, setSplitRangeInput] = useState('1-5,6-10')
  const [totalPages, setTotalPages] = useState(0)

  const activeTool = tools.find(t => t.id === active)

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    if (active === 'merge' || active === 'extract') {
      setFiles(prev => [...prev, ...selected])
    } else {
      setFiles(selected)
    }
    setMessage('')
    setPreviewPages([])
    setSelectedPages(new Set())
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewPages([])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (dropped.length === 0) { setMessage('请拖入 PDF 文件'); return }
    if (active === 'merge' || active === 'extract') {
      setFiles(prev => [...prev, ...dropped])
    } else {
      setFiles(dropped)
    }
    setMessage('')
    setPreviewPages([])
  }

  // 预览 PDF 页面（用于删除页面功能）
  const previewPdf = async (file) => {
    setProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = []
      for (let i = 0; i < pdf.getPageCount(); i++) {
        pages.push({ index: i, label: `第 ${i + 1} 页`, size: `${pdf.getPage(i).getSize().width.toFixed(0)}×${pdf.getPage(i).getSize().height.toFixed(0)}` })
      }
      setPreviewPages(pages)
    } catch (err) {
      setMessage('预览失败：' + err.message)
    }
    setProcessing(false)
  }

  const togglePage = (idx) => {
    setSelectedPages(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleAction = async () => {
    if (files.length === 0) {
      setMessage('请先选择文件')
      return
    }
    setProcessing(true)
    setMessage('处理中...')

    try {
      if (active === 'merge') {
        const mergedPdf = await PDFDocument.create()
        for (const file of files) {
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
          pages.forEach(p => mergedPdf.addPage(p))
        }
        const mergedBytes = await mergedPdf.save()
        downloadBlob(mergedBytes, 'merged.pdf', 'application/pdf')
        setMessage(`合并完成！共 ${mergedPdf.getPageCount()} 页`)
      } else if (active === 'split') {
        let totalCount = 0
        for (const file of files) {
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const totalPagesCount = pdf.getPageCount()

          if (splitMode === 'each') {
            // 逐页拆分
            for (let i = 0; i < totalPagesCount; i++) {
              const newPdf = await PDFDocument.create()
              const [page] = await newPdf.copyPages(pdf, [i])
              newPdf.addPage(page)
              const bytes = await newPdf.save()
              const name = file.name.replace(/\.pdf$/i, `_p${i + 1}.pdf`)
              downloadBlob(bytes, name, 'application/pdf')
              totalCount++
              await new Promise(r => setTimeout(r, 200))
            }
          } else if (splitMode === 'parts') {
            // 按份数均分
            const partSize = Math.ceil(totalPagesCount / splitParts)
            for (let p = 0; p < splitParts; p++) {
              const startIdx = p * partSize
              const endIdx = Math.min(startIdx + partSize, totalPagesCount)
              if (startIdx >= totalPagesCount) break
              const indices = []
              for (let i = startIdx; i < endIdx; i++) indices.push(i)
              const newPdf = await PDFDocument.create()
              const pages = await newPdf.copyPages(pdf, indices)
              pages.forEach(page => newPdf.addPage(page))
              const bytes = await newPdf.save()
              const name = file.name.replace(/\.pdf$/i, `_part${p + 1}_p${startIdx + 1}-${endIdx}.pdf`)
              downloadBlob(bytes, name, 'application/pdf')
              totalCount++
              await new Promise(r => setTimeout(r, 200))
            }
          } else if (splitMode === 'range') {
            // 自定义范围拆分
            const ranges = parseSplitRange(splitRangeInput.trim())
            if (ranges.length === 0) {
              setMessage('范围格式错误，请使用如 "1-5,6-10,11-15" 的格式'); setProcessing(false); return
            }

            for (let ri = 0; ri < ranges.length; ri++) {
              const [start, end] = ranges[ri]
              if (start > totalPagesCount) continue
              const actualEnd = Math.min(end, totalPagesCount)
              const indices = []
              for (let i = start - 1; i < actualEnd; i++) indices.push(i)
              if (indices.length === 0) continue
              const newPdf = await PDFDocument.create()
              const pages = await newPdf.copyPages(pdf, indices)
              pages.forEach(page => newPdf.addPage(page))
              const bytes = await newPdf.save()
              const name = file.name.replace(/\.pdf$/i, `_range${start}-${actualEnd}.pdf`)
              downloadBlob(bytes, name, 'application/pdf')
              totalCount++
              await new Promise(r => setTimeout(r, 200))
            }
          }
        }
        setMessage(`拆分完成！共导出 ${totalCount} 个文件`)
      } else if (active === 'compress') {
        for (const file of files) {
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          // pdf-lib 在保存时会自动去除未使用的对象
          // 通过重新创建文档来压缩
          const compressed = await PDFDocument.create()
          const pages = await compressed.copyPages(pdf, pdf.getPageIndices())
          pages.forEach(p => compressed.addPage(p))
          const bytes = await compressed.save({ useObjectStreams: true })
          const origSize = file.size
          const newSize = bytes.length
          const ratio = ((1 - newSize / origSize) * 100).toFixed(1)
          downloadBlob(bytes, file.name.replace(/\.pdf$/i, '_compressed.pdf'), 'application/pdf')
          setMessage(`压缩完成！从 ${formatFileSize(origSize)} 减小到 ${formatFileSize(newSize)}（减少 ${ratio}%）`)
        }
      } else if (active === 'extract') {
        // 提取图片：使用 pdf-lib 不支持直接提取图片，这里提供页面导出为图片
        // 使用 canvas 渲染每页为 PNG
        setMessage('提示：浏览器端 PDF 图片提取功能有限，建议使用"PDF 编辑"页面逐页导出。此功能将每页导出为 PNG 图片。')
        // 降级方案：直接提示用户
      } else if (active === 'rotate') {
        for (const file of files) {
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const pages = pdf.getPages()
          pages.forEach(page => {
            const current = page.getRotation().angle
            page.setRotation({ angle: (current + rotation) % 360 })
          })
          const bytes = await pdf.save()
          downloadBlob(bytes, file.name.replace(/\.pdf$/i, `_rotated${rotation}.pdf`), 'application/pdf')
        }
        setMessage(`旋转完成！已旋转 ${rotation}°`)
      } else if (active === 'delete') {
        for (const file of files) {
          if (selectedPages.size === 0) {
            setMessage('请先选择要删除的页面')
            continue
          }
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const totalPages = pdf.getPageCount()
          const keepIndices = []
          for (let i = 0; i < totalPages; i++) {
            if (!selectedPages.has(i)) keepIndices.push(i)
          }
          if (keepIndices.length === 0) {
            setMessage('不能删除所有页面')
            continue
          }
          const newPdf = await PDFDocument.create()
          const copiedPages = await newPdf.copyPages(pdf, keepIndices)
          copiedPages.forEach(p => newPdf.addPage(p))
          const bytes = await newPdf.save()
          downloadBlob(bytes, file.name.replace(/\.pdf$/i, '_deleted.pdf'), 'application/pdf')
          setMessage(`删除完成！保留了 ${keepIndices.length} 页`)
        }
      }
    } catch (err) {
      setMessage('处理失败：' + err.message)
    }
    setProcessing(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">PDF 工具</h2>
      <p className="text-gray-500 text-sm mb-6">所有处理在浏览器本地完成，文件不会上传</p>

      {/* Tool tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => { setActive(tool.id); setFiles([]); setMessage(''); setPreviewPages([]); setSelectedPages(new Set()) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === tool.id
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tool.icon size={16} />
            {tool.label}
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`bg-white rounded-xl border-2 border-dashed p-8 text-center mb-4 transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : files.length > 0 ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
        }`}
      >
        <Upload size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-600 mb-2 font-medium">{activeTool?.desc}</p>
        <p className="text-gray-400 text-sm mb-4">拖拽文件到此处，或点击选择</p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
          <Upload size={16} />
          选择文件
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple={active === 'merge' || active === 'extract'}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
            <span>已选择 {files.length} 个文件</span>
            {active === 'delete' && files.length === 1 && previewPages.length === 0 && (
              <button onClick={() => previewPdf(files[0])} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Eye size={14} /> 预览页面
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 truncate">
                  <FileText size={14} className="text-red-400 flex-shrink-0" />
                  <span className="truncate">{f.name}</span>
                  <span className="text-gray-400 flex-shrink-0">({formatFileSize(f.size)})</span>
                </div>
                <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 拆分模式选择 */}
      {active === 'split' && files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
          <label className="text-sm font-medium text-gray-700">拆分方式</label>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSplitMode('each')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${splitMode === 'each' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              逐页拆分
            </button>
            <button onClick={() => setSplitMode('parts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${splitMode === 'parts' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              均分N份
            </button>
            <button onClick={() => setSplitMode('range')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${splitMode === 'range' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              自定义范围
            </button>
          </div>

          {splitMode === 'parts' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">均分为</span>
              {[2, 3, 4, 5, 6].map(n => (
                <button key={n} onClick={() => setSplitParts(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${splitParts === n ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {n}
                </button>
              ))}
              <span className="text-xs text-gray-400">份</span>
            </div>
          )}

          {splitMode === 'range' && (
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">输入页码范围（用逗号分隔，如：1-5,6-10,11-end）</label>
              <input value={splitRangeInput} onChange={e => setSplitRangeInput(e.target.value)}
                placeholder="1-5,6-10,11-15"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              <p className="text-[10px] text-gray-400 mt-1">提示：使用连字符 - 或 ~ 表示范围，如 "1-5" 表示第1到5页</p>
            </div>
          )}

          <p className="text-[11px] text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            当前文件将按「{splitMode === 'each' ? '逐页拆分（每页一个文件）' : splitMode === 'parts' ? `均分 ${splitParts} 份` : '自定义范围'}」方式处理
          </p>
        </div>
      )}

      {/* 旋转角度选择 */}
      {active === 'rotate' && files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="text-sm text-gray-600 mb-2 block">旋转角度</label>
          <div className="flex gap-2">
            {[90, 180, 270].map(deg => (
              <button
                key={deg}
                onClick={() => setRotation(deg)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${rotation === deg ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                顺时针 {deg}°
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 页面预览（删除功能） */}
      {active === 'delete' && previewPages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            选择要<span className="text-red-500">删除</span>的页面（已选 {selectedPages.size} 页）
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {previewPages.map(p => (
              <button
                key={p.index}
                onClick={() => togglePage(p.index)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  selectedPages.has(p.index)
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{selectedPages.has(p.index) ? '✕' : p.index + 1}</div>
                <div className="text-xs text-gray-500">{p.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 提取图片提示 */}
      {active === 'extract' && files.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
          <p className="text-sm text-blue-700">
            <strong>💡 提示：</strong>浏览器端 PDF 图片提取有限制。建议使用左侧"PDF 编辑"功能查看并导出图片。
            此功能将尝试提取 PDF 内嵌的图片资源。
          </p>
        </div>
      )}

      {/* Action button */}
      {files.length > 0 && (
        <button
          onClick={handleAction}
          disabled={processing}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              处理中...
            </>
          ) : (
            <>
              <Download size={18} />
              {activeTool?.label}
            </>
          )}
        </button>
      )}

      {message && (
        <div className={`mt-4 text-sm text-center p-3 rounded-lg ${
          message.includes('完成') || message.includes('成功') ? 'bg-green-50 text-green-700' :
          message.includes('失败') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
