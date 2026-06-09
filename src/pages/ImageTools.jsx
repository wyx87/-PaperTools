import { useState, useRef } from 'react'
import { Image, Upload, Download, Crop, Scissors, Pencil, Trash2, X } from 'lucide-react'
import { downloadBlob, formatFileSize } from '../utils'

const tools = [
  { id: 'compress', icon: Image, label: '压缩图片', desc: '减小图片文件大小' },
  { id: 'resize', icon: Crop, label: '调整尺寸', desc: '统一宽高' },
  { id: 'crop', icon: Scissors, label: '裁剪', desc: '截取图片区域' },
  { id: 'format', icon: Download, label: '格式转换', desc: 'PNG/JPG/WebP互转' },
]

export default function ImageTools() {
  const [active, setActive] = useState('compress')
  const [images, setImages] = useState([])
  const [quality, setQuality] = useState(80)
  const [targetWidth, setTargetWidth] = useState(800)
  const [targetHeight, setTargetHeight] = useState(600)
  const [outputFormat, setOutputFormat] = useState('png')
  const [message, setMessage] = useState('')
  const canvasRef = useRef(null)

  const activeTool = tools.find(t => t.id === active)

  const handleFiles = (e) => {
    const files = Array.from(e.target.files)
    const readers = files.map(file => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (evt) => resolve({ name: file.name, size: file.size, src: evt.target.result, file })
      reader.readAsDataURL(file)
    }))
    Promise.all(readers).then(results => setImages(results))
    setMessage('')
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const compressImage = (src, q) => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(blob => resolve({ blob, width: img.width, height: img.height }), 'image/jpeg', q / 100)
      }
      img.src = src
    })
  }

  const resizeImage = (src, w, h) => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        canvas.width = w
        canvas.height = h || Math.round(img.height * (w / img.width))
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(blob => resolve({ blob, width: canvas.width, height: canvas.height }), 'image/png')
      }
      img.src = src
    })
  }

  const convertFormat = (src, format) => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
        canvas.toBlob(blob => resolve({ blob, width: img.width, height: img.height }), mime)
      }
      img.src = src
    })
  }

  const handleAction = async () => {
    if (images.length === 0) { setMessage('请先选择图片'); return }
    setMessage('处理中...')

    try {
      for (const img of images) {
        let result
        if (active === 'compress') {
          result = await compressImage(img.src, quality)
        } else if (active === 'resize') {
          result = await resizeImage(img.src, targetWidth, targetHeight || undefined)
        } else if (active === 'format') {
          result = await convertFormat(img.src, outputFormat)
        } else {
          continue
        }
        const ext = active === 'format' ? outputFormat : active === 'compress' ? 'jpg' : 'png'
        const newName = img.name.replace(/\.[^.]+$/, `_${active}.${ext}`)
        downloadBlob(result.blob, newName)
      }
      setMessage('处理完成！')
    } catch (err) {
      setMessage('处理失败：' + err.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">图片处理</h2>
      <p className="text-gray-500 text-sm mb-6">压缩、裁剪、格式转换，纯本地处理</p>

      <canvas ref={canvasRef} className="hidden" />

      {/* Tool tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => { setActive(tool.id); setImages([]); setMessage('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === tool.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tool.icon size={16} /> {tool.label}
          </button>
        ))}
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-4">
        <Upload size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-600 mb-2 font-medium">{activeTool?.desc}</p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
          <Upload size={16} /> 选择图片
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
        </label>
      </div>

      {/* Settings */}
      {active === 'compress' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="text-sm text-gray-600 mb-1 block">压缩质量: {quality}%</label>
          <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full" />
        </div>
      )}
      {active === 'resize' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">宽度 (px)</label>
            <input type="number" value={targetWidth} onChange={e => setTargetWidth(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">高度 (px，留空按比例)</label>
            <input type="number" value={targetHeight} onChange={e => setTargetHeight(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28" placeholder="自动" />
          </div>
        </div>
      )}
      {active === 'format' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="text-xs text-gray-500 mb-1 block">输出格式</label>
          <div className="flex gap-2">
            {['png', 'jpg', 'webp'].map(f => (
              <button
                key={f}
                onClick={() => setOutputFormat(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${outputFormat === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image list */}
      {images.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="text-sm font-medium text-gray-700 mb-3">已选择 {images.length} 张图片</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img.src} alt={img.name} className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">{img.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      {images.length > 0 && (
        <button onClick={handleAction} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium">
          <Download size={18} /> {activeTool?.label}
        </button>
      )}

      {message && (
        <div className={`mt-4 text-sm text-center p-3 rounded-lg ${message.includes('完成') ? 'bg-green-50 text-green-700' : message.includes('失败') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
