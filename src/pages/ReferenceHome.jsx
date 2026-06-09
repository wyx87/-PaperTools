import { Link } from 'react-router-dom'
import { BookMarked, ArrowUpDown, ArrowRight, Shield, Lock, Copy, Zap } from 'lucide-react'

const tools = [
  {
    to: '/reference/generator',
    icon: BookMarked,
    label: '参考文献格式生成器',
    desc: '填写信息，一键生成 GB/T 7714 / APA / MLA 格式引用',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    to: '/reference/sort-authors',
    icon: ArrowUpDown,
    label: '作者拼音排序',
    desc: '输入中文作者列表，按拼音首字母自动排序',
    color: 'bg-emerald-100 text-emerald-600',
  },
]

export default function ReferenceHome() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* 标题区 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">文献与引用</h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
          参考文献格式生成、作者排序——两大工具帮你高效管理学术引用。
        </p>
      </div>

      {/* 安全说明 */}
      <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">关于引用生成</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              参考文献生成器基于你填写的信息<b>本地拼接</b>，不会上传任何数据。DOI 快速引用为<b>演示版</b>，仅包含预设样例；实际使用需接入 Crossref 等在线 API。所有结果可一键复制到 Word 或 LaTeX 中使用。
            </p>
          </div>
        </div>
      </div>

      {/* 功能卡片网格 */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {tools.map(tool => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-md transition-all duration-200"
          >
            <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
              <tool.icon size={22} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1.5 group-hover:text-amber-700 transition-colors">
              {tool.label}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">{tool.desc}</p>
            <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
              立即使用 <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      {/* 底部说明 */}
      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>提示：引用格式请以目标期刊/学校的最终要求为准，本文具仅供辅助。</p>
      </div>
    </div>
  )
}
