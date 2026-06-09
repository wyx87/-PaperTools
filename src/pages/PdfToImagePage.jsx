import { useState, useRef } from 'react'
import JSZip from 'jszip'
import FileDrop from '../components/FileDrop'
import PdfPageLayout from '../components/PdfPageLayout'
import { useToast } from '../components/Toast'
import { downloadBlob, formatFileSize } from '../utils'
import { readFile, isPdfEncrypted, initPdfJs } from '../utils/pdfUtils'
import * as pdfjsLib from 'pdfjs-dist'
import { Image, Download, FileText, Package } from 'lucide-react'

initPdfJs()

const DPI_PRESETS = [
  { value: 96, label: '屏幕 (96 DPI)', scale: 1.0 },
  { value: 150, label: '打印 (150 DPI)', scale: 1.5 },
  { value: 200, label: '高清 (200 DPI)', scale: 2.0 },
]

function parseRange(input, max) {
  if (!input.trim()) {
    const arr = []
    for (let i = 1; i <= max; i++) arr.push(i)
    return arr
  }
  const result = new Set()
  for (const part of input.split(',')) {
    const t = part.trim()
    if (!t) continue
    const m = t.match(/^(\d+)\s*[-~]\s*(\d+)$/)
    if (m) {
      const start = Math.max(1, parseInt(m[1]))
      const end = Math.min(max, parseInt(m[2]))
      for (let i = start; i <= end; i++) result.add(i)
    } else {
      const num = parseInt(t)
      if (num >= 1 && num <= max) result.add(num)
    }
  }
  return [...result].sort((a, b) => a - b)
}

export default function PdfToImagePage() {
  const { toast } = useToast()
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [dpi, setDpi] = useState(150)
  const [rangeInput, setRangeInput] = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [resultZip, setResultZip] = useState(null)

  const handleFileSelect = async (files) => {
    setFile(files[0] || null)
    setResultZip(null)
    setTotalPages(0)
    if (files[0]) {
      try {
        const buf = await readFile(files[0])
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise
        setTotalPages(pdf.numPages)
        setRangeInput(`1-${pdf.numPages}`)
      } catch {}
    }
  }

  const handleConvert = async () => {
    if (!file) { toast('请先选择 PDF 文件', 'warning'); return }

    const scale = DPI_PRESETS.find(d => d.value === dpi)?.scale || 1.5
    const pages = parseRange(rangeInput, totalPages)

    if (pages.length === 0) {
      toast('请输入有效的页码范围', 'warning')
      return
    }

    if (file.size > 20 * 1024 * 1024 && !confirm('文件较大，处理可能耗时，请耐心等待。是否继续？')) return

    setProcessing(true)
    setProgress(0)
    setProgressText('正在加载 PDF…')
    setResultZip(null)

    try {
      const buf = await readFile(file)
      const encErr = await isPdfEncrypted(buf)
      if (encErr) { toast(encErr, 'error'); setProcessing(false); return }

      const pdf = await pdfjsLib.getDocument({ data: buf }).promise
      const zip = new JSZip()

      for (let i = 0; i < pages.length; i++) {
        const pageNum = pages[i]
        setProgressText(`正在渲染第 ${pageNum}/${totalPages} 页…`)
        setProgress(Math.round(((i + 1) / pages.length) * 100))

        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('导出失败')), 'image/png')
        })

        zip.file(`page_${String(pageNum).padStart(3, '0')}.png`, blob)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      setResultZip(zipBlob)

      const zipName = file.name.replace(/\.pdf$/i, '_图片.zip')
      downloadBlob(zipBlob, zipName, 'application/zip')
      toast(`转换完成！共 ${pages.length} 张图片`, 'success')
    } catch (err) {
      toast('转换失败：' + err.message, 'error')
    }
    setProcessing(false)
  }

  return (
    <PdfPageLayout
      title="PDF 转图片"
      description="将 PDF 的每一页渲染为高质量 PNG 图片。支持自定义页面范围和多档分辨率。"
      processing={processing}
      processingText={progressText || '正在渲染…'}
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
            <label className="text-xs font-medium text-gray-600 mb-2 block">页面范围（留空 = 全部）</label>
            <input value={rangeInput} onChange={e => setRangeInput(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 font-mono"
              placeholder="例如：1-3,5（留空=全部页面）" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">分辨率（DPI）</label>
            <div className="flex gap-2">
              {DPI_PRESETS.map(d => (
                <button key={d.value} onClick={() => setDpi(d.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dpi === d.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleConvert}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm">
            <Image size={18} /> 转换为图片
          </button>
        </div>
      )}

      {resultZip && !processing && (
        <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Package size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">转换完成，ZIP 包已自动下载</span>
          </div>
          <p className="text-xs text-green-600">
            图片命名：page_001.png ~ page_NNN.png · {formatFileSize(resultZip.size)}
          </p>
        </div>
      )}
    </PdfPageLayout>
  )
}
