import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import FileDrop from '../components/FileDrop'
import PdfPageLayout from '../components/PdfPageLayout'
import { useToast } from '../components/Toast'
import { downloadBlob, formatFileSize } from '../utils'
import { readFile, isPdfEncrypted, initPdfJs, renderPage } from '../utils/pdfUtils'
import * as pdfjsLib from 'pdfjs-dist'
import { RotateCw, Trash2, Download, FileText, RefreshCw } from 'lucide-react'

initPdfJs()

export default function PdfRotateDeletePage() {
  const { toast } = useToast()
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pages, setPages] = useState([]) // { index, rotation, deleted, thumbnail }
  const [totalPages, setTotalPages] = useState(0)
  const [resultBlob, setResultBlob] = useState(null)

  const handleFileSelect = async (files) => {
    const f = files[0] || null
    setFile(f)
    setResultBlob(null)
    setPages([])
    setTotalPages(0)

    if (f) {
      if (f.size > 20 * 1024 * 1024 && !confirm('文件较大，预览可能耗时，请耐心等待。是否继续？')) {
        setFile(null)
        return
      }
      setProcessing(true)
      setProgress(0)
      try {
        const buf = await readFile(f)
        const encErr = await isPdfEncrypted(buf)
        if (encErr) { toast(encErr, 'error'); setProcessing(false); return }

        const pdf = await pdfjsLib.getDocument({ data: buf }).promise
        const numPages = pdf.numPages
        setTotalPages(numPages)

        const pageList = []
        for (let i = 0; i < numPages; i++) {
          try {
            const canvas = await renderPage(pdf, i, 0.4)
            const thumb = canvas.toDataURL('image/jpeg', 0.6)
            pageList.push({ index: i, rotation: 0, deleted: false, thumbnail: thumb })
          } catch {
            pageList.push({ index: i, rotation: 0, deleted: false, thumbnail: null })
          }
          setProgress(Math.round(((i + 1) / numPages) * 100))
        }
        setPages(pageList)
      } catch (err) {
        toast('加载失败：' + err.message, 'error')
      }
      setProcessing(false)
    }
  }

  const toggleDelete = (index) => {
    setPages(prev => prev.map((p, i) => i === index ? { ...p, deleted: !p.deleted } : p))
  }

  const rotatePage = (index, deg) => {
    setPages(prev => prev.map((p, i) => i === index ? { ...p, rotation: (p.rotation + deg) % 360 } : p))
  }

  const selectAllDelete = (checked) => {
    setPages(prev => prev.map(p => ({ ...p, deleted: checked })))
  }

  const handleApply = async () => {
    const keptPages = pages.filter(p => !p.deleted)
    if (keptPages.length === 0) {
      toast('不能删除所有页面', 'warning')
      return
    }

    setProcessing(true)
    setProgress(0)
    setResultBlob(null)

    try {
      const buf = await readFile(file)
      const pdf = await PDFDocument.load(buf)

      const keptIndices = keptPages.map(p => p.index)
      const newPdf = await PDFDocument.create()
      const copied = await newPdf.copyPages(pdf, keptIndices)

      for (let i = 0; i < copied.length; i++) {
        const rotation = keptPages[i].rotation
        if (rotation !== 0) {
          copied[i].setRotation({ angle: rotation })
        }
        newPdf.addPage(copied[i])
        setProgress(Math.round(((i + 1) / copied.length) * 100))
      }

      const bytes = await newPdf.save()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      setResultBlob(blob)

      const name = file.name.replace(/\.pdf$/i, '_处理后.pdf')
      downloadBlob(blob, name, 'application/pdf')
      toast(`处理完成！保留 ${keptPages.length} 页`, 'success')
    } catch (err) {
      toast('处理失败：' + err.message, 'error')
    }
    setProcessing(false)
  }

  const deletedCount = pages.filter(p => p.deleted).length
  const rotatedCount = pages.filter(p => p.rotation !== 0).length

  return (
    <PdfPageLayout
      title="PDF 旋转 / 删除页面"
      description="对 PDF 页面进行旋转（90° 倍数）和删除操作。支持缩略图预览，所见即所得。"
      processing={processing}
      processingText="正在处理…"
      progress={progress}
    >
      <FileDrop files={file ? [file] : []} onFilesChange={handleFileSelect} />

      {pages.length > 0 && !processing && (
        <div className="mt-4 space-y-4">
          {/* 页面列表 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                共 {totalPages} 页 · 删除 {deletedCount} 页 · 旋转 {rotatedCount} 页
              </span>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deletedCount === totalPages}
                  onChange={e => selectAllDelete(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                全选删除
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pages.map(p => (
                <div
                  key={p.index}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all ${p.deleted ? 'border-red-400 opacity-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {/* 缩略图 */}
                  <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={`第${p.index + 1}页`}
                        className={`w-full h-full object-contain ${p.rotation !== 0 ? 'rotate-[' + p.rotation + 'deg]' : ''}`}
                        style={{ transform: `rotate(${p.rotation}deg)`, transition: 'transform 0.3s' }}
                      />
                    ) : (
                      <FileText size={24} className="text-gray-300" />
                    )}
                  </div>

                  {/* 页码 */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {p.index + 1}
                  </div>

                  {/* 旋转角度标记 */}
                  {p.rotation !== 0 && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {p.rotation}°
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="p-2 flex items-center justify-between bg-gray-50 border-t">
                    <button
                      onClick={() => rotatePage(p.index, 90)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                    >
                      <RotateCw size={12} /> 旋转
                    </button>
                    <button
                      onClick={() => toggleDelete(p.index)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${p.deleted ? 'bg-red-100 text-red-600' : 'text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 size={12} /> {p.deleted ? '已选' : '删除'}
                    </button>
                  </div>

                  {/* 删除覆盖层 */}
                  {p.deleted && (
                    <div className="absolute inset-0 bg-red-500/20 pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 应用按钮 */}
          <button onClick={handleApply}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm">
            <RefreshCw size={18} /> 应用更改
          </button>
        </div>
      )}

      {resultBlob && !processing && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200 text-center">
          <p className="text-sm text-green-700 font-medium">处理完成，文件已自动下载</p>
          <p className="text-xs text-green-600 mt-1">{file?.name.replace(/\.pdf$/i, '')}_处理后.pdf · {formatFileSize(resultBlob.size)}</p>
        </div>
      )}
    </PdfPageLayout>
  )
}
