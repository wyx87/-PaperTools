import { Link } from 'react-router-dom'
import {
  BarChart3, TrendingUp, PieChart, GitFork, BrainCircuit,
  Table2, ArrowRight, Shield,
} from 'lucide-react'

const tools = [
  { to: '/chart/bar', icon: BarChart3, label: '柱状图', desc: '簇状·堆叠·百分比', color: 'bg-blue-100 text-blue-600' },
  { to: '/chart/line', icon: TrendingUp, label: '折线图', desc: '单线·多线·面积', color: 'bg-emerald-100 text-emerald-600' },
  { to: '/chart/pie', icon: PieChart, label: '饼图', desc: '普通·环形', color: 'bg-pink-100 text-pink-600' },
  { to: '/chart/scatter', icon: TrendingUp, label: '散点图', desc: '趋势线·回归', color: 'bg-purple-100 text-purple-600' },
  { to: '/chart/radar', icon: PieChart, label: '雷达图', desc: '多维评价对比', color: 'bg-cyan-100 text-cyan-600' },
  { to: '/chart/area', icon: TrendingUp, label: '面积图', desc: '堆积·百分比', color: 'bg-teal-100 text-teal-600' },
  { to: '/chart/combo', icon: BarChart3, label: '组合图', desc: '柱线混合·双Y轴', color: 'bg-indigo-100 text-indigo-600' },
  { to: '/chart/table', icon: Table2, label: '三线表', desc: '学术规范表格', color: 'bg-amber-100 text-amber-600' },
  { to: '/chart/flowchart', icon: GitFork, label: '流程图', desc: 'Mermaid·预设模板', color: 'bg-green-100 text-green-600' },
  { to: '/chart/mindmap', icon: BrainCircuit, label: '思维导图', desc: '论文大纲·文献分类', color: 'bg-violet-100 text-violet-600' },
]

export default function ChartHome() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1E3A5F] mb-1.5">图表·表格·公式</h1>
      <p className="text-sm text-[#6B7280] mb-2">10 个专业工具，覆盖论文图表制作全流程</p>
      <div className="w-12 h-0.5 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full mb-6" />

      {/* Privacy */}
      <div className="mb-8 p-4 bg-gradient-to-r from-[#1E3A5F]/5 to-[#3B82F6]/5 border border-[#1E3A5F]/10 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield size={15} className="text-[#1E3A5F]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1E3A5F] text-sm mb-0.5">纯本地处理</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              所有图表、表格均在浏览器中渲染，数据不会上传。ECharts / Mermaid 均为开源前端库。
            </p>
          </div>
        </div>
      </div>

      {/* Tool grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {tools.map(tool => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-[#3B82F6]/30 hover:shadow-md transition-all duration-200 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              <tool.icon size={19} />
            </div>
            <h3 className="font-semibold text-[#1E3A5F] text-sm mb-1 group-hover:text-[#3B82F6] transition-colors">
              {tool.label}
            </h3>
            <p className="text-xs text-[#6B7280] mb-3">{tool.desc}</p>
            <div className="flex items-center gap-1 text-xs font-medium text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity">
              立即使用 <ArrowRight size={11} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
