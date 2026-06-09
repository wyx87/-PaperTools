import { Loader2, AlertTriangle } from 'lucide-react'

export default function ProcessingGuardModal({ message = '正在处理，请勿切换页面或关闭浏览器', onStay, onLeave }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center border border-gray-100">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
          <AlertTriangle size={32} className="text-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-[#1E3A5F] mb-2">处理进行中</h3>
        <p className="text-sm text-gray-600 mb-2 leading-relaxed">{message}</p>
        <p className="text-xs text-gray-400 mb-6">离开将中断操作，可能导致处理失败</p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onLeave}
            className="px-5 py-2.5 text-sm rounded-xl font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            确认离开
          </button>
          <button
            onClick={onStay}
            className="px-5 py-2.5 text-sm rounded-xl font-medium text-white bg-[#1E3A5F] hover:bg-[#2E5A8F] transition-colors shadow-sm flex items-center gap-2"
          >
            <Loader2 size={16} className="animate-spin" />
            继续等待
          </button>
        </div>
      </div>
    </div>
  )
}
