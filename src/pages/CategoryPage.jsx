import { Link, useParams } from 'react-router-dom'
import {
  FileText, FileOutput, Combine, Scissors, FileDown, Image as ImageIcon, RotateCw,
  PenTool, Type, Pilcrow, Library as LibIcon, Eraser,
  BookMarked, ArrowUpDown,
  BarChart3, Table2, TrendingUp, PieChart, GitFork, BrainCircuit, FunctionSquare,
  Send, Shield,
  ChevronRight, ArrowLeft, Lock,
} from 'lucide-react'

// Shared tool configuration for all categories
const categoryConfig = {
  pdf: {
    title: 'PDF 全能处理',
    desc: '6 大 PDF 处理工具，全部在浏览器本地完成。无需上传、完全免费、无限次数。',
    icon: FileText,
    iconBg: '#EFF6FF',
    iconBorder: '#DBEAFE',
    iconColor: '#3B82F6',
    tools: [
      { to: '/pdf/to-word', icon: FileOutput, label: 'PDF 智能转换', desc: '三层混合转换：文字提取 / OCR 识别 / 图片型 Word，纯本地运行' },
      { to: '/pdf/merge', icon: Combine, label: 'PDF 合并', desc: '将多个 PDF 文件合并为一个，支持拖拽排序' },
      { to: '/pdf/split', icon: Scissors, label: 'PDF 拆分', desc: '按页数、范围或份数拆分 PDF，可打包 ZIP 下载' },
      { to: '/pdf/compress', icon: FileDown, label: 'PDF 压缩', desc: '减小 PDF 文件体积，可调节压缩质量' },
      { to: '/pdf/to-image', icon: ImageIcon, label: 'PDF 转图片', desc: '将 PDF 每页渲染为高质量 PNG 图片' },
      { to: '/pdf/rotate-delete', icon: RotateCw, label: '旋转/删除页面', desc: '对 PDF 页面进行旋转或删除，灵活调整' },
    ],
    highlights: [
      { icon: Shield, text: '纯浏览器本地处理，文件不上传' },
      { icon: Shield, text: '支持最新 Chrome / Edge / Firefox' },
      { icon: Shield, text: '无文件数量限制，完全免费' },
    ],
  },
  writing: {
    title: '论文写作辅助',
    desc: '4 大写作辅助工具，提升论文写作效率与排版质量。全部在浏览器本地处理。',
    icon: PenTool,
    iconBg: '#F9FAFB',
    iconBorder: '#E5E7EB',
    iconColor: '#6B7280',
    tools: [
      { to: '/writing/word-count', icon: Type, label: '字数统计增强版', desc: '多维实时统计：中英文、数字、标点、行数段落数' },
      { to: '/writing/punctuation', icon: Pilcrow, label: '标点全半角转换', desc: '一键统一中英文标点，适配中/英文排版需求' },
      { to: '/writing/phrases', icon: LibIcon, label: '学术句式模板库', desc: '50+ 条学术写作常用句式，分类浏览·一键复制' },
      { to: '/writing/cleaner', icon: Eraser, label: '排版清理器', desc: '清除多余空行、空格，统一换行符——让文本整洁' },
    ],
    highlights: [
      { icon: Shield, text: '纯浏览器本地处理，数据不上传' },
      { icon: Shield, text: '支持最新 Chrome / Edge / Firefox' },
    ],
  },
  reference: {
    title: '文献与引用',
    desc: '参考文献格式生成、作者排序——两大工具帮你高效管理学术引用。',
    icon: BookMarked,
    iconBg: '#F0FDFA',
    iconBorder: '#CCFBF1',
    iconColor: '#14B8A6',
    tools: [
      { to: '/reference/generator', icon: BookMarked, label: '参考文献格式生成器', desc: '填写信息，一键生成 GB/T 7714 / APA / MLA 格式引用' },
      { to: '/reference/sort-authors', icon: ArrowUpDown, label: '作者拼音排序', desc: '输入中文作者列表，按拼音首字母自动排序' },
    ],
    note: '提示：引用格式请以目标期刊/学校的最终要求为准，本文具仅供辅助。',
  },
  chart: {
    title: '图表·表格·公式',
    desc: '11 个专业工具，覆盖论文图表、表格、流程图、思维导图及公式渲染全流程。',
    icon: BarChart3,
    iconBg: '#FAF5FF',
    iconBorder: '#F3E8FF',
    iconColor: '#8B5CF6',
    tools: [
      { to: '/chart/bar', icon: BarChart3, label: '柱状图', desc: '簇状·堆叠·百分比' },
      { to: '/chart/line', icon: TrendingUp, label: '折线图', desc: '单线·多线·面积' },
      { to: '/chart/pie', icon: PieChart, label: '饼图', desc: '普通·环形' },
      { to: '/chart/scatter', icon: TrendingUp, label: '散点图', desc: '趋势线·回归' },
      { to: '/chart/radar', icon: PieChart, label: '雷达图', desc: '多维评价对比' },
      { to: '/chart/area', icon: TrendingUp, label: '面积图', desc: '堆积·百分比' },
      { to: '/chart/combo', icon: BarChart3, label: '组合图', desc: '柱线混合·双Y轴' },
      { to: '/chart/table', icon: Table2, label: '三线表', desc: '学术规范表格' },
      { to: '/chart/flowchart', icon: GitFork, label: '流程图', desc: '缩进大纲·多样式' },
      { to: '/chart/mindmap', icon: BrainCircuit, label: '思维导图', desc: '论文大纲·文献分类' },
      { to: '/chart/formula', icon: FunctionSquare, label: '公式渲染', desc: 'LaTeX·模板库' },
    ],
  },
  submit: {
    title: '投稿检查',
    desc: '投稿前的最后把关——生成投稿信、整理审稿回复、逐项自查，确保万无一失。',
    icon: Send,
    iconBg: '#F0FDF4',
    iconBorder: '#DCFCE7',
    iconColor: '#22C55E',
    tools: [
      { to: '/submit/cover-letter', icon: FileText, label: '投稿信生成器', desc: '填写论文信息，一键生成中英文投稿信（Cover Letter）' },
      { to: '/submit/review-response', icon: Send, label: '审稿回复助手', desc: '逐条整理对审稿人意见的回复，格式化输出' },
      { to: '/submit/checklist', icon: Shield, label: '投稿自检清单', desc: '20+ 项投稿前检查，生成自查报告' },
    ],
  },
}

export default function CategoryPage() {
  const { id } = useParams()
  const config = categoryConfig[id]

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-400 mb-4">分类未找到</h1>
        <Link to="/" className="text-[#3B82F6] hover:underline text-sm">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#9CA3AF] mb-6">
        <Link to="/" className="hover:text-[#3B82F6] transition-colors flex items-center gap-1">
          <ArrowLeft size={12} /> 首页
        </Link>
        <ChevronRight size={12} />
        <span className="text-[#1E3A5F] font-medium">{config.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: config.iconBg,
            border: `1px solid ${config.iconBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <config.icon size={26} strokeWidth={1.5} style={{ color: config.iconColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">{config.title}</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{config.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span style={{
            fontSize: '0.8125rem', fontWeight: 500,
            padding: '3px 12px', borderRadius: 999,
            background: config.iconBg, color: config.iconColor,
          }}>
            {config.tools.length} 个工具
          </span>
          <span style={{
            fontSize: '0.8125rem', fontWeight: 500,
            padding: '3px 12px', borderRadius: 999,
            background: 'rgba(30,58,95,0.05)', color: '#1E3A5F',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Lock size={11} />纯本地
          </span>
        </div>
      </div>

      {/* Tool grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {config.tools.map(tool => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#3B82F6]/30 hover:shadow-md transition-all duration-200 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div style={{
                width: 42, height: 42,
                borderRadius: 12,
                background: config.iconBg,
                border: `1px solid ${config.iconBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <tool.icon size={19} style={{ color: config.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1E3A5F] text-sm mb-1 group-hover:text-[#3B82F6] transition-colors">
                  {tool.label}
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">{tool.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Highlights (if any) */}
      {config.highlights && config.highlights.length > 0 && (
        <div className={`grid ${config.highlights.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 mb-8`}>
          {config.highlights.map((item, i) => (
            <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
              <item.icon size={16} className="text-blue-500 flex-shrink-0" />
              <span className="text-xs text-gray-600">{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Note (if any) */}
      {config.note && (
        <div className="text-center text-xs text-gray-400 mb-8">
          <p>{config.note}</p>
        </div>
      )}

      {/* Privacy notice */}
      <div className="mt-10 pt-5 border-t border-gray-100 text-center">
        <p className="text-[11px] text-[#9CA3AF]">
          所有处理均在浏览器本地完成，文件不会上传，保护您的隐私
        </p>
      </div>
    </div>
  )
}
