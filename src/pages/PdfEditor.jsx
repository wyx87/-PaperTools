import { useState, useRef, useEffect } from 'react'
import { Upload, Download, FileText, Trash2, ChevronLeft, ChevronRight, RotateCw, Type, Square, Pencil, Eraser, Undo2, Redo2, Save, X, Plus, Minus } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { downloadBlob, formatFileSize, readFileAsArrayBuffer } from '../utils'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// 绘制工具
const tools = [
  { id: 'text', icon: Type, label: '添加文字', desc: '点击页面添加文字' },
  { id: 'rect', icon: Square, label: '矩形框', desc: '拖拽绘制矩形标注' },
  { id: 'draw', icon: Pencil, label: '自由绘制', desc: '自由涂鸦标注' },
  { id: 'eraser', icon: Eraser, label: '橡皮擦', desc: '擦除标注' },
]

const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#000000', '#ffffff']
const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36]

export default function PdfEditor() {
  const [file, setFile] = useState(null)
  const [pages, setPages] = useState([]) // 每页的图片 dataURL
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  // 编辑状态
  const [activeTool, setActiveTool] = useState('text')
  const [annotations, setAnnotations] = useState([]) // 所有标注
  const [currentAnnotation, setCurrentAnnotation] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#ef4444')
  const [fontSize, setFontSize] = useState(18)
  const [textInput, setTextInput] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [textPos, setTextPos] = useState({ x: 0, y: 0 })
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])

  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [pdfData, setPdfData] = useState(null)
  const [scale, setScale] = useState(1.2)

  // 加载 PDF 并渲染每一页
  const loadPdf = async (pdfFile) => {
    setLoading(true)
    setMessage('加载 PDF 中...')
    setProgress(0)

    try {
      const arrayBuffer = await readFileAsArrayBuffer(pdfFile)
      setPdfData(arrayBuffer)

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise
      const numPages = pdf.numPages
      setTotalPages(numPages)
      setCurrentPage(0)

      const renderedPages = []
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })

        if (i === 1) {
          setPageSize({ width: viewport.width, height: viewport.height })
        }

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')

        await page.render({ canvasContext: ctx, viewport }).promise
        renderedPages.push(canvas.toDataURL('image/png'))
        setProgress(Math.round((i / numPages) * 80))
      }

      setPages(renderedPages)
      setAnnotations([])
      setUndoStack([])
      setRedoStack([])
      setMessage(`已加载 ${numPages} 页`)
    } catch (err) {
      setMessage('加载失败：' + err.message)
    }
    setLoading(false)
    setProgress(0)
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      loadPdf(f)
    } else if (f) {
      setMessage('请选择 PDF 文件')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      loadPdf(f)
    }
  }

  // 绘制标注到 Canvas
  useEffect(() => {
    if (!canvasRef.current || pages.length === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      // 绘制所有标注
      annotations.forEach(ann => {
        if (ann.page !== currentPage) return
        ctx.save()
        ctx.strokeStyle = ann.color || '#ef4444'
        ctx.fillStyle = ann.color || '#ef4444'
        ctx.lineWidth = 2

        if (ann.type === 'text') {
          ctx.font = `${ann.fontSize || 18}px sans-serif`
          ctx.fillText(ann.text, ann.x, ann.y)
        } else if (ann.type === 'rect') {
          ctx.strokeRect(ann.x, ann.y, ann.w, ann.h)
        } else if (ann.type === 'draw' && ann.points) {
          ctx.beginPath()
          ann.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          })
          ctx.stroke()
        }

        ctx.restore()
      })

      // 绘制当前正在进行的标注
      if (isDrawing && currentAnnotation) {
        ctx.save()
        ctx.strokeStyle = currentAnnotation.color || selectedColor
        ctx.lineWidth = 2
        if (currentAnnotation.type === 'rect' && currentAnnotation.startX !== undefined) {
          ctx.strokeRect(currentAnnotation.startX, currentAnnotation.startY, currentAnnotation.x - currentAnnotation.startX, currentAnnotation.y - currentAnnotation.startY)
        } else if (currentAnnotation.type === 'draw' && currentAnnotation.points) {
          ctx.beginPath()
          currentAnnotation.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          })
          ctx.stroke()
        }
        ctx.restore()
      }
    }
    img.src = pages[currentPage]
  }, [pages, currentPage, annotations, isDrawing, currentAnnotation])

  // Canvas 鼠标事件
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handleMouseDown = (e) => {
    if (activeTool === 'eraser') return
    const pos = getCanvasPos(e)

    if (activeTool === 'text') {
      setTextPos(pos)
      setTextInput('')
      setShowTextInput(true)
      return
    }

    if (activeTool === 'rect') {
      pushUndo()
      setCurrentAnnotation({ type: 'rect', page: currentPage, color: selectedColor, startX: pos.x, startY: pos.y, x: pos.x, y: pos.y })
      setIsDrawing(true)
    }

    if (activeTool === 'draw') {
      pushUndo()
      setCurrentAnnotation({ type: 'draw', page: currentPage, color: selectedColor, points: [pos] })
      setIsDrawing(true)
    }
  }

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentAnnotation) return
    const pos = getCanvasPos(e)

    if (currentAnnotation.type === 'rect') {
      setCurrentAnnotation({ ...currentAnnotation, x: pos.x, y: pos.y })
    } else if (currentAnnotation.type === 'draw') {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...currentAnnotation.points, pos]
      })
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return
    setIsDrawing(false)

    if (currentAnnotation.type === 'rect') {
      const { startX, startY, x, y } = currentAnnotation
      const ann = {
        ...currentAnnotation,
        x: Math.min(startX, x),
        y: Math.min(startY, y),
        w: Math.abs(x - startX),
        h: Math.abs(y - startY),
      }
      if (ann.w > 5 && ann.h > 5) {
        setAnnotations(prev => [...prev, ann])
      } else {
        undo()
      }
    } else if (currentAnnotation.type === 'draw') {
      if (currentAnnotation.points.length > 2) {
        setAnnotations(prev => [...prev, currentAnnotation])
      } else {
        undo()
      }
    }

    setCurrentAnnotation(null)
    setRedoStack([])
  }

  const handleEraser = (e) => {
    if (activeTool !== 'eraser') return
    const pos = getCanvasPos(e)
    // 删除离点击位置最近的标注
    const pageAnn = annotations.filter(a => a.page === currentPage)
    let closest = null
    let minDist = 30

    pageAnn.forEach(ann => {
      let cx, cy
      if (ann.type === 'text') {
        cx = ann.x; cy = ann.y - (ann.fontSize || 18) / 2
      } else if (ann.type === 'rect') {
        cx = ann.x + ann.w / 2; cy = ann.y + ann.h / 2
      } else if (ann.type === 'draw' && ann.points) {
        ann.points.forEach(p => {
          const d = Math.hypot(p.x - pos.x, p.y - pos.y)
          if (d < minDist) { minDist = d; closest = ann }
        })
        return
      }
      const d = Math.hypot(cx - pos.x, cy - pos.y)
      if (d < minDist) { minDist = d; closest = ann }
    })

    if (closest) {
      pushUndo()
      setAnnotations(prev => prev.filter(a => a !== closest))
      setRedoStack([])
    }
  }

  const addTextAnnotation = () => {
    if (!textInput.trim()) return
    pushUndo()
    const ann = {
      type: 'text', page: currentPage, text: textInput,
      x: textPos.x, y: textPos.y, color: selectedColor, fontSize,
    }
    setAnnotations(prev => [...prev, ann])
    setShowTextInput(false)
    setRedoStack([])
  }

  const pushUndo = () => {
    setUndoStack(prev => [...prev, [...annotations]])
  }

  const undo = () => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setRedoStack(prev2 => [...prev2, [...annotations]])
    setAnnotations(prev)
    setUndoStack(prev2 => prev2.slice(0, -1))
  }

  const redo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setUndoStack(prev => [...prev, [...annotations]])
    setAnnotations(next)
    setRedoStack(prev => prev.slice(0, -1))
  }

  const clearAll = () => {
    pushUndo()
    setAnnotations([])
    setRedoStack([])
  }

  // 导出带标注的 PDF
  const exportPdf = async () => {
    if (!pdfData) return
    setMessage('正在生成 PDF...')

    try {
      const pdfDoc = await PDFDocument.load(pdfData)
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const pages2 = pdfDoc.getPages()

      // 添加标注到对应页面
      annotations.forEach(ann => {
        if (ann.page >= pages2.length) return
        const page = pages2[ann.page]
        const { width, height } = page.getSize()

        if (ann.type === 'text') {
          // 注意：坐标转换（Canvas 2x 缩放 → PDF 实际尺寸）
          const scaleX = width / (pageSize.width || width)
          const scaleY = height / (pageSize.height || height)
          page.drawText(ann.text, {
            x: ann.x * scaleX,
            y: height - ann.y * scaleY,
            size: (ann.fontSize || 18) * Math.min(scaleX, scaleY),
            font,
            color: hexToRgb(ann.color || '#000000'),
          })
        } else if (ann.type === 'rect') {
          const scaleX = width / (pageSize.width || width)
          const scaleY = height / (pageSize.height || height)
          page.drawRectangle({
            x: ann.x * scaleX,
            y: height - (ann.y + ann.h) * scaleY,
            width: ann.w * scaleX,
            height: ann.h * scaleY,
            borderColor: hexToRgb(ann.color || '#ef4444'),
            borderWidth: 1.5,
          })
        } else if (ann.type === 'draw' && ann.points) {
          const scaleX = width / (pageSize.width || width)
          const scaleY = height / (pageSize.height || height)
          ann.points.forEach((p, i) => {
            if (i === 0) return
            const prev = ann.points[i - 1]
            page.drawLine({
              start: { x: prev.x * scaleX, y: height - prev.y * scaleY },
              end: { x: p.x * scaleX, y: height - p.y * scaleY },
              color: hexToRgb(ann.color || '#ef4444'),
              thickness: 1.5,
            })
          })
        }
      })

      const pdfBytes = await pdfDoc.save()
      downloadBlob(pdfBytes, file.name.replace('.pdf', '_标注版.pdf'), 'application/pdf')
      setMessage('导出完成！')
    } catch (err) {
      setMessage('导出失败：' + err.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">PDF 编辑</h2>
      <p className="text-gray-500 text-sm mb-6">
        在 PDF 上添加文字、矩形标注、自由涂鸦，编辑完成后导出新的 PDF
      </p>

      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center mb-4"
        >
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 mb-2 font-medium">上传 PDF 开始编辑</p>
          <p className="text-gray-400 text-sm mb-4">拖拽文件到此处，或点击选择</p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
            <Upload size={16} />
            选择 PDF 文件
            <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
          </label>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">{message}</p>
          {progress > 0 && (
            <div className="mt-3 max-w-xs mx-auto">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{progress}%</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 文件信息栏 */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-red-500" />
              <span className="text-sm font-medium text-gray-700">{file.name}</span>
              <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{totalPages} 页</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setFile(null); setPages([]); setAnnotations([]) }} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                <Trash2 size={14} /> 关闭
              </button>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* 工具选择 */}
              {tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTool === tool.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={tool.desc}
                >
                  <tool.icon size={14} /> {tool.label}
                </button>
              ))}

              <div className="w-px h-6 bg-gray-200 mx-1" />

              {/* 颜色选择 */}
              <div className="flex items-center gap-1">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${selectedColor === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>

              <div className="w-px h-6 bg-gray-200 mx-1" />

              {/* 字号选择 */}
              <div className="flex items-center gap-1">
                {fontSizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className={`px-2 py-1 rounded text-xs font-mono ${fontSize === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >{s}</button>
                ))}
              </div>

              <div className="w-px h-6 bg-gray-200 mx-1" />

              {/* 撤销/重做 */}
              <button onClick={undo} disabled={undoStack.length === 0} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30" title="撤销">
                <Undo2 size={16} />
              </button>
              <button onClick={redo} disabled={redoStack.length === 0} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30" title="重做">
                <Redo2 size={16} />
              </button>

              <div className="flex-1" />

              <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                清除标注
              </button>
              <button onClick={exportPdf} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Save size={14} /> 导出 PDF
              </button>
            </div>
          </div>

          {/* 页面导航 */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-600 font-medium">
              第 {currentPage + 1} / {totalPages} 页
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Canvas 编辑区 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-auto flex justify-center" ref={containerRef}>
            <div className="relative inline-block">
              <canvas
                ref={canvasRef}
                onMouseDown={activeTool === 'eraser' ? handleEraser : handleMouseDown}
                onMouseMove={activeTool === 'eraser' ? null : handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={activeTool === 'eraser' ? handleEraser : null}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  cursor: activeTool === 'text' ? 'crosshair' :
                          activeTool === 'eraser' ? 'pointer' :
                          activeTool ? 'crosshair' : 'default',
                }}
              />

              {/* 文字输入浮层 */}
              {showTextInput && (
                <div
                  className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex items-center gap-2"
                  style={{ left: textPos.x, top: textPos.y - 40 }}
                >
                  <input
                    autoFocus
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTextAnnotation(); if (e.key === 'Escape') setShowTextInput(false) }}
                    className="border border-gray-200 rounded px-2 py-1 text-sm w-40"
                    placeholder="输入文字..."
                  />
                  <button onClick={addTextAnnotation} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">确定</button>
                  <button onClick={() => setShowTextInput(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`mt-4 text-sm text-center p-3 rounded-lg ${
          message.includes('完成') || message.includes('成功') || message.includes('已加载') ? 'bg-green-50 text-green-700' :
          message.includes('失败') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
        <p className="text-xs text-gray-500">
          <strong>💡 使用说明：</strong>
          ① 上传 PDF → ② 选择工具（文字/矩形/涂鸦/橡皮擦）→ ③ 在页面上操作 → ④ 点击"导出 PDF"下载带标注的新文件。
          支持撤销/重做，标注数据不会上传服务器。
        </p>
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? rgb(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255)
    : rgb(0, 0, 0)
}
