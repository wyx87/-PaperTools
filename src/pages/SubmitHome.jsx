import { Link } from 'react-router-dom'
import ChartPageLayout from '../components/ChartPageLayout'
import { FileText, MessageSquare, ClipboardCheck, ChevronRight } from 'lucide-react'

const tools = [
  {
    to: '/submit/cover-letter',
    icon: FileText,
    label: '投稿信生成器',
    desc: '填写论文信息，一键生成中英文投稿信（Cover Letter）',
  },
  {
    to: '/submit/review-response',
    icon: MessageSquare,
    label: '审稿回复助手',
    desc: '逐条整理对审稿人意见的回复，格式化输出',
  },
  {
    to: '/submit/checklist',
    icon: ClipboardCheck,
    label: '投稿自检清单',
    desc: '15 项投稿前检查，生成自查报告',
  },
]

export default function SubmitHome() {
  return (
    <ChartPageLayout title="投稿检查" breadcrumb="" categoryLink="/submit" categoryLabel="投稿检查">
      <p className="text-[#6B7280] text-sm mb-8 leading-relaxed">
        投稿前的最后把关——生成投稿信、整理审稿回复、逐项自查，确保万无一失。
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map(tool => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#10B981]/30 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
              <tool.icon size={20} className="text-green-500" />
            </div>
            <h3 className="font-semibold text-[#1E3A5F] text-sm mb-1">{tool.label}</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">{tool.desc}</p>
          </Link>
        ))}
      </div>
    </ChartPageLayout>
  )
}
