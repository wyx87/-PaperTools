import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import FileDrop from '../components/FileDrop'
import PdfPageLayout from '../components/PdfPageLayout'
import { useToast } from '../components/Toast'
import { downloadBlob, formatFileSize } from '../utils'
import { readFile, isPdfEncrypted } from '../utils/pdfUtils'
import { Scissors, Download, FileText, Package } from 'lucide-react'

function parseSplitRange(input) {
  const result = []
  for (const part of input.split(',')) {
    const t = part.trim()
    if (!t) continue
    const m = t.match(/^(\d+)\s*[-~]\s*(\d+)$/)
    if (m) {
      const start = parseInt(m[1]), end = parseInt(m[2])
      if (start > 0 && end >= start) result.push([start, end])
    } else {
      const num = parseInt(t)
      if (num > 0) result.push([num, num])
    }
  }
  return result
}

export default function PdfSplitPage() {
  const { toast } = useToast()
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultFiles, setResultFiles] = useState([]) // { name, blob }
  const [splitMode, setSplitMode] = useState('each') // each | range
  const [rangeInput, setRangeInput] = useState('')
  const [totalPages, setTotalPages] = useState(0)

  const handleFileSelect = async (files) => {
    setFile(files[0] || null)
    setResultFiles([])
    setTotalPages(0)
    // 预览页数
    if (files[0]) {
      try {
        const buf = await readFile(files[0])
        const pdf = await PDFDocument.load(buf)
        setTotalPages(pdf.getPageCount())
        setRangeInput(`1-${pdf.getPageCount()}`)
      } catch {}
    }
  }

  const handleSplit = async () => {
    if (!file) {
      toast('请先选择 PDF 文件', 'warning')
      return
    }
    if (splitMode === 'range') {
      const ranges = parseSplitRange(rangeInput)
      if (ranges.length === 0) {
        toast('请输入有效的页码范围，如：1-3,5,7-9', 'warning')
        return
      }
    }

    if (file.size > 20 * 1024 * 1024 && !confirm('文件较大，处理可能耗时，请耐心等待。是否继续？')) return

    setProcessing(true)
    setProgress(0)
    setResultFiles([])

    try {
      const buf = await readFile(file)
      const encErr = await isPdfEncrypted(buf)
      if (encErr) { toast(encErr, 'error'); setProcessing(false); return }

      const pdf = await PDFDocument.load(buf)
      const total = pdf.getPageCount()

      let ranges = []
      if (splitMode === 'each') {
        for (let i = 0; i < total; i++) ranges.push([i + 1, i + 1])
      } else {
        ranges = parseSplitRange(rangeInput).filter(([s, e]) => s <= total)
      }

      if (ranges.length === 0) {
        toast('没有有效的页码范围', 'warning')
        setProcessing(false)
        return
      }

      const results = []
      const baseName = file.name.replace(/\.pdf$/i, '')

      for (let ri = 0; ri < ranges.length; ri++) {
        const [start, end] = ranges[ri]
        const actualEnd = Math.min(end, total)
        const indices = []
        for (let p = start - 1; p < actualEnd; p++) indices.push(p)

        const newPdf = await PDFDocument.create()
        const pages = await newPdf.copyPages(pdf, indices)
        pages.forEach(p => newPdf.addPage(p))
        const bytes = await newPdf.save()

        let name
        if (splitMode === 'each') {
          name = `${baseName}_第${start}页.pdf`
        } else if (start === actualEnd) {
          name = `${baseName}_第${start}页.pdf`
        } else {
          name = `${baseName}_第${start}-${actualEnd}页.pdf`
        }

        results.push({
          name,
          blob: new Blob([bytes], { type: 'application/pdf' }),
          pages: indices.length,
        })

        setProgress(Math.round(((ri + 1) / ranges.length) * 100))
      }

      setResultFiles(results)

      // 单个结果直接下载，多个打包 ZIP
      if (results.length === 1) {
        downloadBlob(results[0].blob, results[0].name, 'application/pdf')
      } else {
        await downloadZip(results, baseName)
      }

      toast(`拆分完成！共生成 ${results.length} 个文件`, 'success')
    } catch (err) {
      toast('拆分失败：' + err.message, 'error')
    }
    setProcessing(false)
  }

  const downloadZip = async (results, baseName) => {
    const zip = new JSZip()
    for (const r of results) {
      zip.file(r.name, r.blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, `${baseName}_拆分.zip`, 'application/zip')
  }

  return (
    <PdfPageLayout
      title="PDF 拆分"
      description={`将 PDF 按页码范围拆分成多个独立文件。单页拆分或多文件时自动打包 ZIP。`}
      processing={processing}
      processingText="正在拆分 PDF…"
      progress={progress}
    >
      <FileDrop files={file ? [file] : []} onFilesChange={handleFileSelect} />

      {file && totalPages > 0 && !processing && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-red-500" />
            <span className="text-sm font-medium text-gray-700">{file.name}</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{totalPages} 页</span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">拆分方式</label>
            <div className="flex gap-2">
              <button onClick={() => setSplitMode('each')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${splitMode === 'each' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                按单页拆分
              </button>
              <button onClick={() => setSplitMode('range')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${splitMode === 'range' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                自定义范围
              </button>
            </div>
          </div>

          {splitMode === 'range' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">页码范围（示例：1-3,5,7-9）</label>
              <input value={rangeInput} onChange={e => setRangeInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                placeholder="1-3,5,7-9" />
              <p className="text-[11px] text-gray-400 mt-1">单页用数字，连续页用 - 或 ~ 连接，用逗号分隔</p>
            </div>
          )}

          <button onClick={handleSplit}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm">
            <Scissors size={18} />
            {splitMode === 'each' ? `拆分为 ${totalPages} 个单页文件` : '按范围拆分'}
          </button>
        </div>
      )}

      {resultFiles.length > 0 && !processing && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">已生成 {resultFiles.length} 个文件</span>
            <button onClick={() => downloadZip(resultFiles, file.name.replace(/\.pdf$/i, ''))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium">
              <Package size={13} /> 打包 ZIP 下载
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {resultFiles.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={14} className="text-red-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{r.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{r.pages} 页 · {formatFileSize(r.blob.size)}</span>
                </div>
                <button onClick={() => downloadBlob(r.blob, r.name, 'application/pdf')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium flex-shrink-0">
                  <Download size={12} /> 下载
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </PdfPageLayout>
  )
}
