import { useState, useRef } from 'react'
import { FileText, Upload, Download, Trash2, Eye, Loader2, FileOutput, AlertTriangle } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import JSZip from 'jszip'
import { downloadBlob, formatFileSize } from '../utils'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// 生成 docx 文件的 XML 内容
function generateDocxXml(pages, fileName) {
  const escapeXml = (str) => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  }

  const bodyXml = pages.map((pageText, pageIdx) => {
    // 按双换行分割段落
    const paragraphs = pageText.split(/\n\s*\n|(?<=[。！？\.\!\?])\s+/).filter(p => p.trim())
    const pageHeader = pages.length > 1
      ? `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t xml:space="preserve">第 ${pageIdx + 1} 页</w:t></w:r></w:p>`
      : ''

    const parasXml = paragraphs.map(para => {
      const trimmed = para.trim()
      if (!trimmed) return ''
      // 检测标题
      const isHeading = trimmed.length < 60 && (
        /^第[一二三四五六七八九十\d]+[章节]/.test(trimmed) ||
        /^(Abstract|Introduction|Conclusion|References|Method|Result|Discussion|附录|摘要|引言|结论|参考文献|方法|结果|讨论)/i.test(trimmed)
      )
      const style = isHeading ? '<w:pPr><w:pStyle w:val="Heading3"/></w:pPr>' : '<w:pPr><w:spacing w:after="120"/></w:pPr>'
      return `<w:p>${style}<w:r><w:rPr><w:sz w:val="24"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/></w:rPr><w:t xml:space="preserve">${escapeXml(trimmed)}</w:t></w:r></w:p>`
    }).join('')

    return pageHeader + parasXml
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyXml}</w:body>
</w:document>`
}

async function buildDocx(pages, fileName) {
  const zip = new JSZip()

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`)

  // _rels/.rels
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

  // word/_rels/document.xml.rels
  const wordFolder = zip.folder('word')
  wordFolder.folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)

  // word/document.xml
  wordFolder.file('document.xml', generateDocxXml(pages, fileName))

  // word/styles.xml (minimal)
  wordFolder.file('styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="24"/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
</w:styles>`)

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  return blob
}

export default function PdfToWord() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const dropRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setMessage('')
      setPreviewText('')
      setShowPreview(false)
      setProgress(0)
    } else if (f) {
      setMessage('请选择 PDF 文件')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setMessage('')
      setPreviewText('')
      setShowPreview(false)
      setProgress(0)
    } else {
      setMessage('请拖入 PDF 文件')
    }
  }

  const removeFile = () => {
    setFile(null)
    setMessage('')
    setPreviewText('')
    setShowPreview(false)
    setProgress(0)
  }

  const extractText = async (pdfFile) => {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const totalPages = pdf.numPages
    const pages = []

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items.map(item => item.str).join(' ')
      pages.push(pageText)
      setProgress(Math.round((i / totalPages) * 50))
    }

    return pages
  }

  const handlePreview = async () => {
    if (!file) return
    setProcessing(true)
    setMessage('提取文本中...')
    try {
      const pages = await extractText(file)
      setPreviewText(pages.map((t, i) => pages.length > 1 ? `--- 第 ${i + 1} 页 ---\n\n${t}` : t).join('\n\n'))
      setShowPreview(true)
      setMessage(`成功提取 ${pages.length} 页文本`)
    } catch (err) {
      setMessage('预览失败：' + err.message)
    }
    setProcessing(false)
    setProgress(0)
  }

  const convertToDocx = async () => {
    if (!file) return
    setProcessing(true)
    setMessage('正在转换...')
    setProgress(0)

    try {
      const pages = await extractText(file)
      setProgress(60)

      const blob = await buildDocx(pages, file.name)
      setProgress(100)
      downloadBlob(blob, file.name.replace(/\.pdf$/i, '') + '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      setMessage('转换完成！已下载 Word 文件')
    } catch (err) {
      setMessage('转换失败：' + err.message)
    }
    setProcessing(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">PDF 转 Word</h2>
      <p className="text-gray-500 text-sm mb-6">
        将 PDF 文件转换为可编辑的 Word 文档（.docx），所有处理在浏览器本地完成
      </p>

      {/* Upload area */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`bg-white rounded-xl border-2 border-dashed p-10 text-center mb-4 transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : file ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
        }`}
      >
        {!file ? (
          <>
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 mb-2 font-medium">将 PDF 文件拖到此处，或点击选择</p>
            <p className="text-gray-400 text-sm mb-4">支持任意 PDF 文件，纯本地转换，数据安全</p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
              <Upload size={16} />
              选择 PDF 文件
              <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
            </label>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-red-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button onClick={removeFile} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {processing && progress > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{message}</span>
            <span className="text-sm text-gray-400">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      {file && !processing && (
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Eye size={16} /> 预览文本
          </button>
          <button
            onClick={convertToDocx}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <FileOutput size={16} /> 转换为 Word (.docx)
          </button>
        </div>
      )}

      {/* Processing spinner */}
      {processing && !progress && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          <span className="text-gray-600">{message}</span>
        </div>
      )}

      {/* Text preview */}
      {showPreview && previewText && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">文本预览</span>
            <button onClick={() => setShowPreview(false)} className="text-xs text-gray-400 hover:text-gray-600">收起</button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{previewText}</pre>
          </div>
        </div>
      )}

      {/* Message */}
      {message && !processing && (
        <div className={`mt-4 text-sm text-center p-3 rounded-lg ${
          message.includes('完成') || message.includes('成功') ? 'bg-green-50 text-green-700' :
          message.includes('失败') || message.includes('错误') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
        <p className="text-xs text-gray-500">
          <strong>💡 说明：</strong>
          使用 PDF.js 提取文本内容，保留段落结构，转换为标准 .docx 格式。
          复杂排版（表格、图片、分栏）可能无法完美保留，建议转换后检查格式。
        </p>
      </div>
    </div>
  )
}
