import { useState, useCallback, useRef } from 'react'
import JSZip from 'jszip'
import FileDrop from '../components/FileDrop'
import { useToast } from '../components/Toast'
import { downloadBlob, formatFileSize } from '../utils'
import {
  readFile, isPdfEncrypted, initPdfJs, detectPdfContent,
  extractPageTextWithLayout, renderPage, canvasToBlob
} from '../utils/pdfUtils'
import * as pdfjsLib from 'pdfjs-dist'
import {
  FileText, Scan, Image, Loader2, AlertTriangle,
  CheckCircle, Info, Shield, Download, FileOutput, Zap
} from 'lucide-react'

initPdfJs()

// ===================== 并行批处理工具 =====================
/** 将数组分片并行处理，每批最多 concurrent 个并发，控制内存 */
async function batchMap(items, concurrent, fn, onProgress) {
  const results = new Array(items.length)
  let idx = 0
  let done = 0
  async function worker() {
    while (idx < items.length) {
      const i = idx++
      results[i] = await fn(items[i], i)
      done++
      if (onProgress) onProgress(done)
    }
  }
  const workers = Array.from({ length: Math.min(concurrent, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// ===================== 转换模式定义 =====================
const MODES = {
  BASE: 'base',     // 基础文字提取
  OCR: 'ocr',       // OCR 扫描件识别
  IMAGE: 'image',   // 图片型 Word（版式保留）
}

const MODE_OPTIONS = [
  {
    id: MODES.BASE,
    icon: FileText,
    label: '基础模式',
    desc: '文字提取，可编辑',
    detail: '智能提取 PDF 文字，自动合并段落、识别标题。适用于文字型 PDF。',
    color: 'blue',
  },
  {
    id: MODES.OCR,
    icon: Scan,
    label: 'OCR 识别',
    desc: '扫描件识别，可编辑',
    detail: '使用 Tesseract.js 识别扫描件/图片中的文字，支持中英文混合。适合扫描版论文。',
    color: 'purple',
  },
  {
    id: MODES.IMAGE,
    icon: Image,
    label: '图片模式',
    desc: '版式保留，不可编辑',
    detail: '每页渲染为高清图片嵌入 Word，100% 保留原始排版。适合复杂排版或多图表文档。',
    color: 'amber',
  },
]

// ===================== DOCX 生成：文字模式 =====================
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function mergeShortLines(paras) {
  if (paras.length < 2) return paras
  const result = []
  let buffer = ''
  for (let i = 0; i < paras.length; i++) {
    const p = paras[i].trim()
    if (!p) continue
    if (p.length < 40 && !/[。！？.!?」"）\)]$/.test(p) && !/^[（(]*[A-Z\d一二三四五六七八九十第]/.test(p)) {
      buffer += p
    } else {
      if (buffer) { result.push(buffer + p); buffer = '' }
      else result.push(p)
    }
  }
  if (buffer) result.push(buffer)
  return result
}

function buildTextDocxXml(pagesText) {
  const bodyXml = pagesText.map((text, idx) => {
    const rawParas = text.split(/\n{2,}/).filter(p => p.trim())
    const paras = mergeShortLines(rawParas)

    const pageHeader = pagesText.length > 1
      ? `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve">第 ${idx + 1} 页</w:t></w:r></w:p>`
      : ''

    const parasXml = paras.map(p => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      const isHeading = trimmed.length < 80 && /^第[一二三四五六七八九十\d]+[章节]/.test(trimmed)
      const tabs = trimmed.includes('\t')
      const style = isHeading
        ? '<w:pPr><w:pStyle w:val="Heading3"/></w:pPr>'
        : '<w:pPr><w:spacing w:after="100"/></w:pPr>'
      if (tabs) {
        // 表格行：用制表位分隔
        const parts = trimmed.split('\t')
        return `<w:p>${style}${parts.map(part =>
          `<w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/></w:rPr><w:t xml:space="preserve">${escapeXml(part)}</w:t></w:r><w:r><w:tab/></w:r>`
        ).join('').replace(/<w:r><w:tab\/><\/w:r>$/, '')}</w:p>`
      }
      return `<w:p>${style}<w:r><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/></w:rPr><w:t xml:space="preserve">${escapeXml(trimmed)}</w:t></w:r></w:p>`
    }).join('')

    return pageHeader + parasXml
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyXml}</w:body>
</w:document>`
}

async function buildTextDocx(pagesText) {
  const zip = new JSZip()

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`)

  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

  const w = zip.folder('word')
  w.folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)

  w.file('document.xml', buildTextDocxXml(pagesText))
  w.file('styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
  </w:style>
</w:styles>`)

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

// ===================== DOCX 生成：图片模式（多页） =====================
async function buildImageDocx(pageDataUrls, fileName, scale) {
  const zip = new JSZip()
  const numPages = pageDataUrls.length

  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>`

  let relsXml = ''
  const mediaFolder = zip.folder('word').folder('media')

  for (let i = 0; i < numPages; i++) {
    const base64 = pageDataUrls[i].replace(/^data:image\/png;base64,/, '')
    const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    mediaFolder.file(`image${i + 1}.png`, imageBytes)
    contentTypesXml += `\n  <Default Extension="png" ContentType="image/png"/>`
    relsXml += `\n  <Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i + 1}.png"/>`
  }

  contentTypesXml += `\n  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n</Types>`

  // 构建 document.xml — 每页一张图片，页间加分页符
  const pageWidth = 11906 // A4 twips
  const pageHeight = 16838
  const margin = 720 // 0.5 inch

  let bodyXml = ''
  for (let i = 0; i < numPages; i++) {
    // 图片尺寸：按比例适配页面宽度
    const imgWidth = pageWidth - margin * 2
    const imgHeight = Math.round(imgWidth * 1.414) // 默认 A4 比例

    const pageBreak = i > 0 ? '<w:r><w:br w:type="page"/></w:r>' : ''
    const pageLabel = numPages > 1
      ? `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">第 ${i + 1} 页</w:t></w:r></w:p>`
      : ''

    bodyXml += `${pageBreak}${pageLabel}
    <w:p>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="${imgWidth}" cy="${imgHeight}"/>
            <wp:docPr id="${i + 1}" name="page${i + 1}.png"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="page${i + 1}.png"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rIdImg${i + 1}"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="${imgWidth}" cy="${imgHeight}"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="${pageWidth}" w:h="${pageHeight}"/>
      <w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>`

  zip.file('[Content_Types].xml', contentTypesXml)

  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

  const w = zip.folder('word')
  w.folder('_rels').file('document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relsXml}
</Relationships>`)

  w.file('document.xml', documentXml)

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

// ===================== 主组件 =====================
export default function PdfToWordPage() {
  const { toast } = useToast()
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [mode, setMode] = useState(MODES.BASE)
  const [detection, setDetection] = useState(null) // { hasText, totalPages }
  const [previewText, setPreviewText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [resultBlob, setResultBlob] = useState(null)
  const [resultType, setResultType] = useState('') // 'text' | 'ocr' | 'image'
  const abortRef = useRef(false)

  // ========== 文件上传 & 自动检测 ==========
  const handleFileSelect = useCallback(async (files) => {
    const f = files[0] || null
    setFile(f)
    setPreviewText('')
    setShowPreview(false)
    setResultBlob(null)
    setResultType('')
    setDetection(null)

    if (!f) return

    try {
      const buf = await readFile(f)
      const encErr = await isPdfEncrypted(buf)
      if (encErr) { toast(encErr, 'error'); setFile(null); return }

      const pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise
      const det = await detectPdfContent(pdf)
      setDetection(det)
      pdf.destroy()

      // 自动推荐模式
      if (!det.hasText) {
        setMode(MODES.OCR)
        toast('检测到扫描件 PDF，已自动推荐「OCR 识别」模式', 'info')
      } else {
        setMode(MODES.BASE)
      }
    } catch (err) {
      toast('PDF 解析失败：' + (err.message || '未知错误'), 'error')
      setFile(null)
    }
  }, [toast])

  // ========== 大文件提示 ==========
  const fileWarnings = file ? (() => {
    const warnings = []
    if (file.size > 50 * 1024 * 1024) warnings.push('文件超过 50MB，转换可能耗时较长')
    if (detection && detection.totalPages > 100) warnings.push('文件超过 100 页，建议分批转换')
    return warnings
  })() : []

  // ========== 基础模式：文字提取（4 页并行） ==========
  const runBaseMode = async (pdf, totalPages, fileName) => {
    // 预加载所有页对象
    setProgressText('正在加载 PDF 结构…')
    setProgress(2)
    const pagePromises = Array.from({ length: totalPages }, (_, i) =>
      pdf.getPage(i + 1)
    )
    const pagesObj = await Promise.all(pagePromises)

    // 4 页并行提取文字
    const pages = await batchMap(
      pagesObj,
      4, // 并行数
      async (page, i) => {
        if (abortRef.current) throw new Error('abort')
        const text = await extractPageTextWithLayout(page)
        const done = i + 1
        setProgressText(`正在提取第 ${done}/${totalPages} 页文本…`)
        setProgress(Math.round((done / totalPages) * 90))
        return text
      },
      (done) => {
        setProgressText(`正在提取第 ${done}/${totalPages} 页文本…`)
        setProgress(Math.round((done / totalPages) * 90))
      }
    )

    if (abortRef.current) return

    setProgressText('正在生成 Word 文档…')
    setProgress(95)

    setPreviewText(pages.map((t, i) =>
      totalPages > 1 ? `--- 第 ${i + 1} 页 ---\n\n${t}` : t
    ).join('\n\n'))
    setShowPreview(true)

    const blob = await buildTextDocx(pages)
    const name = fileName.replace(/\.pdf$/i, '_文字版.docx')
    setResultBlob(blob)
    setResultType('text')
    downloadBlob(blob, name, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    toast('文字提取完成！Word 文件已下载', 'success')
  }

  // ========== OCR 模式：双 Worker 并行识别（渲染倍率降至 1.5x） ==========
  const runOcrMode = async (pdf, totalPages, fileName) => {
    const Tesseract = (await import('tesseract.js')).default

    setProgressText('正在初始化 OCR 引擎…')
    setProgress(5)

    // 同时创建 2 个 Worker 实例（并行处理两页）
    const workerCount = Math.min(2, totalPages)
    const workers = await Promise.all(
      Array.from({ length: workerCount }, async () => {
        const w = await Tesseract.createWorker('chi_sim+eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text' && m.progress) {
              const pct = Math.round(m.progress * 100)
              // 不在这里更新 UI，避免跨 Worker 的进度混乱
            }
          },
        })
        await w.setParameters({ tessedit_pageseg_mode: '6' })
        return w
      })
    )

    // 先预渲染所有页面（并行渲染 + 降低倍率）
    setProgressText('正在渲染页面…')
    const SCALE = 1.5 // ← 从 2.5 降到 1.5，大幅提速
    const canvasPages = await batchMap(
      Array.from({ length: totalPages }, (_, i) => i),
      Math.min(4, totalPages),
      async (pageIdx) => {
        if (abortRef.current) throw new Error('abort')
        const canvas = await renderPage(pdf, pageIdx, SCALE)
        return { canvas, pageIdx }
      },
      (done) => {
        setProgressText(`正在渲染第 ${done}/${totalPages} 页…`)
        setProgress(Math.round(5 + (done / totalPages) * 20))
      }
    )

    if (abortRef.current) { workers.forEach(w => w.terminate()); return }

    // 双 Worker 并行 OCR 识别
    const ocrResults = new Array(totalPages)
    let ocrDone = 0
    let queueIdx = 0

    async function ocrWorker(worker) {
      while (queueIdx < canvasPages.length) {
        if (abortRef.current) break
        const idx = queueIdx++
        const { canvas } = canvasPages[idx]
        const dataUrl = canvas.toDataURL('image/png')
        const { data: { text } } = await worker.recognize(dataUrl)
        ocrResults[idx] = text || `[第 ${idx + 1} 页：未能识别文字]`
        ocrDone++
        setProgressText(`正在 OCR 识别第 ${ocrDone}/${totalPages} 页…`)
        setProgress(Math.round(25 + (ocrDone / totalPages) * 70))
      }
    }

    await Promise.all(workers.map(w => ocrWorker(w)))
    workers.forEach(w => w.terminate())

    if (abortRef.current) return

    setProgressText('正在生成 Word 文档…')
    setProgress(95)

    setPreviewText(ocrResults.map((t, i) =>
      totalPages > 1 ? `--- 第 ${i + 1} 页（OCR 识别）---\n\n${t}` : t
    ).join('\n\n'))
    setShowPreview(true)

    const blob = await buildTextDocx(ocrResults)
    const name = fileName.replace(/\.pdf$/i, '_OCR版.docx')
    setResultBlob(blob)
    setResultType('ocr')
    downloadBlob(blob, name, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    toast('OCR 识别完成！Word 文件已下载', 'success')
  }

  // ========== 图片模式：4 页并行渲染（倍率降至 1.5x） ==========
  const runImageMode = async (pdf, totalPages, fileName) => {
    const SCALE = 1.5 // ← 从 2.0 降到 1.5

    const pageDataUrls = await batchMap(
      Array.from({ length: totalPages }, (_, i) => i),
      4, // 4 页并行渲染
      async (pageIdx) => {
        if (abortRef.current) throw new Error('abort')
        const canvas = await renderPage(pdf, pageIdx, SCALE)
        return canvas.toDataURL('image/png')
      },
      (done) => {
        setProgressText(`正在渲染第 ${done}/${totalPages} 页为高清图片…`)
        setProgress(Math.round((done / totalPages) * 85))
      }
    )

    if (abortRef.current) return

    setProgressText('正在嵌入图片到 Word…')
    setProgress(92)

    const blob = await buildImageDocx(pageDataUrls, fileName, SCALE)
    const name = fileName.replace(/\.pdf$/i, '_图片版.docx')
    setResultBlob(blob)
    setResultType('image')
    downloadBlob(blob, name, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    toast('图片版 Word 已生成！（文字不可编辑，100% 保留原版式）', 'success')
  }

  // ========== 开始转换 ==========
  const handleConvert = async () => {
    if (!file) return
    abortRef.current = false
    setProcessing(true)
    setProgress(0)
    setProgressText('正在准备…')
    setShowPreview(false)
    setResultBlob(null)
    setResultType('')

    try {
      const buf = await readFile(file)
      const encErr = await isPdfEncrypted(buf)
      if (encErr) { toast(encErr, 'error'); setProcessing(false); return }

      if (mode === MODES.OCR && file.size > 30 * 1024 * 1024) {
        if (!confirm('文件较大，OCR 识别每页需渲染 + 识别，可能耗时 5-15 分钟。是否继续？')) {
          setProcessing(false); return
        }
      } else if (file.size > 50 * 1024 * 1024) {
        if (!confirm('文件超过 50MB，转换可能耗时较长，建议耐心等待。是否继续？')) {
          setProcessing(false); return
        }
      }
      if (detection && detection.totalPages > 100 && mode !== MODES.IMAGE) {
        if (!confirm(`文件共 ${detection.totalPages} 页，处理大文件可能耗时数分钟。建议使用「图片模式」以获更快速度。是否继续？`)) {
          setProcessing(false); return
        }
      }

      const pdf = await pdfjsLib.getDocument({ data: buf }).promise
      const totalPages = pdf.numPages

      if (mode === MODES.BASE) {
        await runBaseMode(pdf, totalPages, file.name)
      } else if (mode === MODES.OCR) {
        await runOcrMode(pdf, totalPages, file.name)
      } else if (mode === MODES.IMAGE) {
        await runImageMode(pdf, totalPages, file.name)
      }

      pdf.destroy()
    } catch (err) {
      if (err.message?.includes('encrypt') || err.message?.includes('password')) {
        toast('该 PDF 已加密，请先解密后再操作', 'error')
      } else if (!abortRef.current) {
        toast('转换失败：' + (err.message || '未知错误'), 'error')
      }
    }
    setProcessing(false)
    setProgress(100)
  }

  // ========== 重新下载 ==========
  const handleRedownload = () => {
    if (!resultBlob || !file) return
    const suffixMap = { text: '_文字版.docx', ocr: '_OCR版.docx', image: '_图片版.docx' }
    const suffix = suffixMap[resultType] || '_转换版.docx'
    const name = file.name.replace(/\.pdf$/i, suffix)
    downloadBlob(resultBlob, name, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  }

  const modeInfo = MODE_OPTIONS.find(m => m.id === mode)

  return (
    <div className="max-w-3xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">PDF 智能转换</h1>
        <p className="text-sm text-gray-500">
          💡 本工具优先保护隐私，纯本地运行。版式复杂文档推荐使用「图片模式」，或前往专业在线服务以获得最佳编辑效果。
        </p>
      </div>

      {/* 上传区 */}
      <FileDrop
        files={file ? [file] : []}
        onFilesChange={handleFileSelect}
        hint="支持论文、报告、扫描件等 PDF。上传后将自动检测文档类型并推荐最佳模式。"
      />

      {/* 大文件警告 */}
      {fileWarnings.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            {fileWarnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-800">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* 模式选择 + 转换按钮 */}
      {file && !processing && detection && (
        <div className="mt-4 space-y-4">
          {/* 检测结果 */}
          <div className={`p-3 rounded-xl flex items-start gap-2 ${
            detection.hasText
              ? 'bg-green-50 border border-green-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            {detection.hasText ? (
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-medium text-gray-800">
                {detection.hasText
                  ? `✅ 检测到可提取文本（共 ${detection.totalPages} 页）— 推荐「基础模式」`
                  : `⚠️ 前 ${detection.samplePages} 页无可提取文字（共 ${detection.totalPages} 页）— 推荐「OCR 识别」或「图片模式」`
                }
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {detection.hasText
                  ? '可直接提取文字内容生成可编辑的 Word 文档。'
                  : '该 PDF 可能为扫描件，文字提取效果不佳，建议切换模式。'
                }
              </p>
            </div>
          </div>

          {/* 模式选择器 */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">选择转换模式</label>
            <div className="grid grid-cols-3 gap-2">
              {MODE_OPTIONS.map(opt => {
                const Icon = opt.icon
                const isActive = mode === opt.id
                const colorMap = {
                  blue: isActive ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-gray-300',
                  purple: isActive ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-200 bg-white hover:border-gray-300',
                  amber: isActive ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-gray-200 bg-white hover:border-gray-300',
                }
                const iconColorMap = {
                  blue: isActive ? 'text-blue-600' : 'text-gray-400',
                  purple: isActive ? 'text-purple-600' : 'text-gray-400',
                  amber: isActive ? 'text-amber-600' : 'text-gray-400',
                }
                return (
                  <button
                    key={opt.id}
                    onClick={() => setMode(opt.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${colorMap[opt.color]}`}
                  >
                    <Icon size={20} className={iconColorMap[opt.color]} />
                    <p className={`text-xs font-semibold mt-1.5 ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{opt.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 模式说明 */}
          {modeInfo && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">{modeInfo.detail}</p>
              </div>
            </div>
          )}

          {/* 转换按钮 */}
          <button
            onClick={handleConvert}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-sm text-sm"
          >
            <FileOutput size={18} />
            开始转换为 Word (.docx)
          </button>
        </div>
      )}

      {/* 处理中：进度条 */}
      {processing && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-700 font-medium text-sm">{progressText}</p>
          <div className="mt-3 max-w-xs mx-auto">
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{Math.round(progress)}%</p>
          </div>
        </div>
      )}

      {/* 文本预览 */}
      {showPreview && previewText && !processing && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {resultType === 'ocr' ? 'OCR 识别预览' : '文字提取预览'}
            </span>
            <button
              onClick={() => setShowPreview(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              收起 ▲
            </button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{previewText}</pre>
          </div>
        </div>
      )}

      {/* 结果区：重新下载 */}
      {resultBlob && !processing && (
        <div className={`mt-4 p-4 rounded-xl border ${
          resultType === 'image'
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
            : resultType === 'ocr'
              ? 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200'
              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <CheckCircle size={16} className="text-green-600" />
                转换完成
                {resultType === 'image' && <span className="text-[10px] font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">图片型 Word</span>}
                {resultType === 'ocr' && <span className="text-[10px] font-normal text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">OCR 识别</span>}
                {resultType === 'text' && <span className="text-[10px] font-normal text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">文字提取</span>}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {resultType === 'image'
                  ? '图片已嵌入 Word 文档，100% 保留原始排版。文字不可直接编辑。'
                  : 'Word 文件已自动下载。建议在 Word 中检查并微调格式。'}
              </p>
            </div>
            <button
              onClick={handleRedownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download size={14} />
              重新下载
            </button>
          </div>
        </div>
      )}

      {/* 隐私声明 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
          <Shield size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-700">隐私保护：</strong>
              所有处理均在浏览器本地完成，文件不会上传到任何服务器。OCR 语言包首次使用时会从 CDN 下载（约 15MB），之后缓存本地。
            </p>
            <p className="text-xs text-gray-400 mt-1">
              如需最佳编辑效果，推荐使用 <a href="https://www.ilovepdf.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ilovepdf.com</a> 或 <a href="https://smallpdf.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">smallpdf.com</a> 等专业在线服务。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
