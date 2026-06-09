import { Shield, Loader2 } from 'lucide-react'

export default function PdfPageLayout({ title, description, children, processing, processingText = '处理中，请稍候…', progress }) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* 标题区 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {/* 内容区 */}
      {children}

      {/* 处理状态 */}
      {processing && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{processingText}</p>
          {progress !== undefined && progress !== null && (
            <div className="mt-3 max-w-xs mx-auto">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}%</p>
            </div>
          )}
        </div>
      )}

      {/* 隐私声明 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
          <Shield size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong className="text-gray-700">隐私保护：</strong>
            所有处理均在浏览器本地完成，文件不会上传到任何服务器，保护您的隐私。
          </p>
        </div>
      </div>
    </div>
  )
}
