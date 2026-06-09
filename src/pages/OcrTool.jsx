import { useState } from 'react'
import { ScanText, Upload, Copy, Loader2, Trash2 } from 'lucide-react'
import { recognizeImage } from '../services/ai'
import { formatFileSize } from '../utils'

export default function OcrTool() {
  const [image, setImage] = useState(null)
  const [result, setResult] = useState('')
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(false)

  const readImage = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setMessage('请选择图片文件 (JPG / PNG / WebP)')
      return
    }
    const reader = new FileReader()
    reader.onload = (evt) => {
      setImage({ name: file.name, size: file.size, src: evt.target.result })
      setResult('')
      setMessage('')
      setError(false)
    }
    reader.readAsDataURL(file)
  }

  const handleFile = (e) => readImage(e.target.files?.[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    readImage(e.dataTransfer.files[0])
  }

  const startOCR = async () => {
    if (!image) return
    setProcessing(true)
    setResult('')
    setMessage('正在识别中...')
    setError(false)

    try {
      const text = await recognizeImage(image.src)
      if (!text || !text.trim() || text.trim() === '未检测到文字') {
        setResult('')
        setMessage('未检测到文字，请确保图片清晰且包含文字内容')
        setError(true)
      } else {
        setResult(text.trim())
        setMessage(`识别完成，共 ${text.trim().length} 个字符`)
      }
    } catch (err) {
      console.error('OCR Error:', err)
      const msg = err.message || ''
      if (msg.includes('401')) {
        setMessage('API Key 无效，请在设置中检查密钥')
      } else if (msg.includes('402')) {
        setMessage('账户余额不足')
      } else if (msg.includes('429')) {
        setMessage('请求过于频繁，请稍后再试')
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setMessage('无法连接 AI 服务，请确保后端已启动 (node server.js)')
      } else {
        setMessage('识别失败：' + (msg.slice(0, 80) || '未知错误'))
      }
      setError(true)
    }

    setProcessing(false)
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clearAll = () => {
    setImage(null)
    setResult('')
    setMessage('')
    setError(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">图片转文字</h2>
      <p className="text-gray-500 text-sm mb-6">
        上传图片，DeepSeek 视觉模型自动识别 — 手写、印刷、中文、英文、混合排版全支持
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`bg-white rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : image ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
            }`}
          >
            {!image ? (
              <>
                <ScanText size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 mb-2 font-medium">上传图片，一键识别</p>
                <p className="text-gray-400 text-sm mb-4">拖拽图片到此处，或点击选择</p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors text-sm font-medium">
                  <Upload size={16} />
                  选择图片
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
                <p className="text-xs text-gray-400 mt-3">
                  支持 JPG / PNG / WebP · DeepSeek 视觉模型 · 手写印刷中英混合自动识别
                </p>
              </>
            ) : (
              <div>
                <img src={image.src} alt={image.name} className="max-h-64 rounded-lg shadow-sm border border-gray-100 mx-auto" />
                <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                  <span className="text-gray-600 truncate max-w-[200px]">{image.name}</span>
                  <span className="text-gray-400">({formatFileSize(image.size)})</span>
                  <button onClick={clearAll} className="text-gray-400 hover:text-red-500 p-1" title="清除">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {image && (
            <>
              {!processing && (
                <button
                  onClick={startOCR}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  <ScanText size={18} />
                  开始智能识别
                </button>
              )}

              {processing && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">{message}</span>
                </div>
              )}

              {message && !processing && (
                <div className={`text-sm text-center p-3 rounded-lg ${
                  error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  {message}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Result */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">识别结果</span>
            {result && (
              <button onClick={copyResult} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                <Copy size={12} /> {copied ? '已复制！' : '复制全部'}
              </button>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto min-h-[300px]">
            {result ? (
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">{result}</p>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300">
                <div className="text-center">
                  <ScanText size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">上传图片后点击「开始智能识别」</p>
                  <p className="text-xs mt-1 text-gray-400">DeepSeek 视觉模型驱动</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-gray-600">
          <div>
            <strong className="text-gray-700">统一识别引擎</strong>
            <p className="text-gray-500 mt-1">
              使用 DeepSeek 视觉模型，一个引擎同时支持中文、英文、手写、印刷、混合排版的文字识别，无需手动切换。
            </p>
          </div>
          <div>
            <strong className="text-gray-700">无需本地下载</strong>
            <p className="text-gray-500 mt-1">
              不再需要下载几百 MB 的 Tesseract 语言包。识别通过后端 AI 代理完成，即开即用。
            </p>
          </div>
          <div>
            <strong className="text-gray-700">高准确率</strong>
            <p className="text-gray-500 mt-1">
              DeepSeek 视觉模型对复杂字体、手写潦草文字、模糊图片都有较高的识别准确率，远优于浏览器本地引擎。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
