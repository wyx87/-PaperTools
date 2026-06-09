import { useState, useEffect, useRef } from 'react'
import { useToast } from './Toast'

export default function WritingPageLayout({ title, description, children }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题区 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>

      {children}
    </div>
  )
}

// 加载动画组件
export function LoadingSpinner({ text = '处理中，请稍候…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}

// 复制按钮
export function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150
        ${copied
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
        } ${className}`}
    >
      {copied ? '已复制 ✓' : '复制'}
    </button>
  )
}

// 上传 txt 按钮
export function TxtUploader({ onFileLoaded, accept = '.txt' }) {
  const fileRef = useRef(null)
  const { toast: addToast } = useToast()

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onFileLoaded(ev.target.result, file.name)
    }
    reader.onerror = () => {
      addToast('文件读取失败，请重试', 'error')
    }
    reader.readAsText(file)
  }

  return (
    <>
      <input ref={fileRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        上传 .txt
      </button>
    </>
  )
}
