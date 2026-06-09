import { useState, useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import FileDrop from '../components/FileDrop'
import PdfPageLayout from '../components/PdfPageLayout'
import { useToast } from '../components/Toast'
import { downloadBlob, formatFileSize } from '../utils'
import { readFile, isPdfEncrypted } from '../utils/pdfUtils'
import { ArrowUp, ArrowDown, Loader2, Download } from 'lucide-react'

const MAX_PER_FILE = 100 * 1024 * 1024
const MAX_TOTAL = 200 * 1024 * 1024
const MAX_FILES = 10

export default function PdfMergePage() {
  const { toast } = useToast()
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState(null)
  const [resultName, setResultName] = useState('')

  const moveFile = useCallback((from, to) => {
    setFiles(prev => {
      if (to < 0 || to >= prev.length) return prev
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
  }, [])

  const handleMerge = async () => {
    if (files.length < 2) {
      toast('请至少选择 2 个 PDF 文件', 'warning')
      return
    }
    if (files.length > MAX_FILES) {
      toast(`最多支持 ${MAX_FILES} 个文件`, 'warning')
      return
    }

    const totalSize = files.reduce((s, f) => s + f.size, 0)
    if (totalSize > MAX_TOTAL) {
      toast(`总文件大小超过 ${formatFileSize(MAX_TOTAL)} 限制`, 'error')
      return
    }

    const anyLarge = files.some(f => f.size > 20 * 1024 * 1024)
    if (anyLarge && !confirm('文件较大，处理可能耗时，请耐心等待。是否继续？')) return

    setProcessing(true)
    setProgress(0)
    setResultBlob(null)

    try {
      // 检查加密
      for (const f of files) {
        const buf = await readFile(f)
        const encErr = await isPdfEncrypted(buf)
        if (encErr) { toast(encErr, 'error'); setProcessing(false); return }
      }

      const merged = await PDFDocument.create()
      for (let i = 0; i < files.length; i++) {
        const buf = await readFile(files[i])
        const doc = await PDFDocument.load(buf)
        const pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach(p => merged.addPage(p))
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      const bytes = await merged.save()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      setResultBlob(blob)
      const name = files[0].name.replace(/\.pdf$/i, '') + '_合并版.pdf'
      setResultName(name)
      downloadBlob(blob, name, 'application/pdf')
      toast(`合并完成！共 ${merged.getPageCount()} 页`, 'success')
    } catch (err) {
      toast('合并失败：' + err.message, 'error')
    }
    setProcessing(false)
  }

  return (
    <PdfPageLayout
      title="PDF 合并"
      description={`将多个 PDF 文件合并为一个。支持拖拽调整顺序，最多 ${MAX_FILES} 个文件，总大小不超过 ${formatFileSize(MAX_TOTAL)}。`}
      processing={processing}
      processingText={`正在合并 ${files.length} 个文件…`}
      progress={progress}
    >
      <FileDrop files={files} onFilesChange={setFiles} multiple accept=".pdf,application/pdf" />

      {files.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 mt-3 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b text-xs font-medium text-gray-500 flex items-center justify-between">
            <span>拖拽排序（从上到下 = 合并后的页面顺序）</span>
            <span className="text-gray-400">共 {files.length} 个文件 · {formatFileSize(files.reduce((s, f) => s + f.size, 0))}</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">{f.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveFile(i, i - 1)} disabled={i === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-25"><ArrowUp size={14} /></button>
                  <button onClick={() => moveFile(i, i + 1)} disabled={i === files.length - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-25"><ArrowDown size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length >= 2 && !processing && (
        <button onClick={handleMerge}
          className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm"
        >
          <Download size={18} />合并 {files.length} 个 PDF
        </button>
      )}

      {resultBlob && !processing && (
        <div className="mt-3 p-4 bg-green-50 rounded-xl border border-green-200 text-center">
          <p className="text-sm text-green-700 font-medium mb-2">合并完成，文件已自动下载</p>
          <p className="text-xs text-green-600">{resultName} · {formatFileSize(resultBlob.size)}</p>
        </div>
      )}
    </PdfPageLayout>
  )
}
