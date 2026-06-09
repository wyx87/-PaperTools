import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { formatFileSize } from '../utils'

const FileDrop = forwardRef(function FileDrop({
  files = [],
  onFilesChange,
  multiple = false,
  accept = '.pdf,application/pdf',
  placeholder = '将文件拖到此处，或点击选择',
  hint = '',
  maxSize = 100 * 1024 * 1024, // 100MB
}, ref) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    reset: () => onFilesChange([])
  }), [onFilesChange])

  const validateFile = (file) => {
    if (accept.includes('pdf') && file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return '请选择 PDF 文件'
    }
    if (file.size > maxSize) {
      return `文件 "${file.name}" 超过 ${formatFileSize(maxSize)} 限制`
    }
    return null
  }

  const addFiles = (newFiles) => {
    const valid = []
    const errors = []
    for (const f of Array.from(newFiles)) {
      const err = validateFile(f)
      if (err) errors.push(err)
      else valid.push(f)
    }
    if (multiple) {
      onFilesChange([...files, ...valid])
    } else {
      onFilesChange(valid.slice(0, 1))
    }
    return errors
  }

  const handleChange = (e) => {
    addFiles(e.target.files)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const errs = addFiles(e.dataTransfer.files)
    if (errs.length) console.warn(errs)
  }

  const removeFile = (index) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
        onDrop={handleDrop}
        className={`
          bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all
          ${dragOver ? 'border-blue-400 bg-blue-50/50 shadow-lg scale-[1.01]' :
            files.length > 0 ? 'border-green-300 bg-green-50/20' : 'border-gray-200 hover:border-gray-300'}
        `}
      >
        <Upload size={40} className={`mx-auto mb-3 transition-colors ${dragOver ? 'text-blue-500' : 'text-gray-300'}`} />
        <p className="text-gray-700 font-medium mb-1">{placeholder}</p>
        {hint && <p className="text-gray-400 text-xs mb-4">{hint}</p>}
        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
          <Upload size={15} />
          选择文件
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mt-3 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b text-xs font-medium text-gray-500 flex items-center justify-between">
            <span>已选择 {files.length} 个文件</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(f.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default FileDrop
