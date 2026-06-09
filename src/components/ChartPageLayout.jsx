import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function ChartPageLayout({ title, breadcrumb, children, className = '', categoryLink = '/chart', categoryLabel = '图表·表格·公式' }) {
  return (
    <div className={`max-w-5xl mx-auto ${className}`}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mb-5">
        <Link to="/" className="hover:text-[#3B82F6] transition-colors">首页</Link>
        <ChevronRight size={12} />
        <Link to={categoryLink} className="hover:text-[#3B82F6] transition-colors">{categoryLabel}</Link>
        {breadcrumb && (
          <>
            <ChevronRight size={12} />
            <span className="text-[#1E3A5F] font-medium">{breadcrumb}</span>
          </>
        )}
      </nav>

      {/* Title */}
      <h1 className="text-3xl font-extrabold text-[#1E3A5F] mb-2 tracking-tight">{title}</h1>
      <div className="w-14 h-0.5 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full mb-6" />

      {/* Content */}
      {children}

      {/* Privacy notice */}
      <div className="mt-10 pt-5 border-t border-gray-100 text-center">
        <p className="text-[11px] text-[#9CA3AF]">
          所有处理均在浏览器本地完成，文件不会上传，保护您的隐私
        </p>
      </div>
    </div>
  )
}
