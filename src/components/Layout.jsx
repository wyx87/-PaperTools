import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Home, FileText, FileOutput, ScanText, BarChart3, GitBranch, PenTool,
  ClipboardCheck, Wrench, Menu, X, ChevronRight, ChevronDown, FunctionSquare, BookOpen,
  Send, Sparkles, ArrowLeft, Combine, Scissors, FileDown, Image, RotateCw,
  Type, Pilcrow, Library, Eraser,
  BookMarked, ArrowUpDown,
  Table2, PieChart, TrendingUp, GitFork, BrainCircuit,
  MessageSquare,
} from 'lucide-react'
import logoSvg from '../assets/logo.svg'
import { useProcessingGuard } from '../contexts/ProcessingGuardContext'
import ProcessingGuardModal from './ProcessingGuardModal'

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { section: 'PDF 全能处理' },
  { path: '/pdf', icon: FileText, label: 'PDF 工具首页', indent: true },
  { path: '/pdf/to-word', icon: FileOutput, label: 'PDF 智能转换', indent: true },
  { path: '/pdf/merge', icon: Combine, label: 'PDF 合并', indent: true },
  { path: '/pdf/split', icon: Scissors, label: 'PDF 拆分', indent: true },
  { path: '/pdf/compress', icon: FileDown, label: 'PDF 压缩', indent: true },
  { path: '/pdf/to-image', icon: Image, label: 'PDF 转图片', indent: true },
  { path: '/pdf/rotate-delete', icon: RotateCw, label: '旋转/删页', indent: true },
  { section: '论文写作辅助' },
  { path: '/writing', icon: PenTool, label: '写作工具首页', indent: true },
  { path: '/writing/word-count', icon: Type, label: '字数统计', indent: true },
  { path: '/writing/punctuation', icon: Pilcrow, label: '标点转换', indent: true },
  { path: '/writing/phrases', icon: Library, label: '句式模板库', indent: true },
  { path: '/writing/cleaner', icon: Eraser, label: '排版清理器', indent: true },
  { section: '文献与引用' },
  { path: '/reference', icon: BookMarked, label: '引用工具首页', indent: true },
  { path: '/reference/generator', icon: BookMarked, label: '格式生成器', indent: true },
  { path: '/reference/sort-authors', icon: ArrowUpDown, label: '作者排序', indent: true },
  { section: '图表·表格·公式' },
  { path: '/chart', icon: BarChart3, label: '图表工具首页', indent: true },
  { path: '/chart/bar', icon: BarChart3, label: '柱状图', indent: true },
  { path: '/chart/line', icon: TrendingUp, label: '折线图', indent: true },
  { path: '/chart/pie', icon: PieChart, label: '饼图', indent: true },
  { path: '/chart/scatter', icon: TrendingUp, label: '散点图', indent: true },
  { path: '/chart/radar', icon: PieChart, label: '雷达图', indent: true },
  { path: '/chart/area', icon: TrendingUp, label: '面积图', indent: true },
  { path: '/chart/combo', icon: BarChart3, label: '组合图', indent: true },
  { path: '/chart/table', icon: Table2, label: '三线表', indent: true },
  { path: '/chart/flowchart', icon: GitFork, label: '流程图', indent: true },
  { path: '/chart/mindmap', icon: BrainCircuit, label: '思维导图', indent: true },
  { path: '/chart/formula', icon: FunctionSquare, label: '公式渲染', indent: true },
  { section: '投稿检查' },
  { path: '/submit', icon: Send, label: '投稿工具首页', indent: true },
  { path: '/submit/cover-letter', icon: FileText, label: '投稿信生成', indent: true },
  { path: '/submit/review-response', icon: MessageSquare, label: '审稿回复', indent: true },
  { path: '/submit/checklist', icon: ClipboardCheck, label: '自检清单', indent: true },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showGuardModal, setShowGuardModal] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({})
  const location = useLocation()
  const navigate = useNavigate()
  const { processing, processingMessage, stopProcessing } = useProcessingGuard()

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }))
  }

  useEffect(() => {
    const preventDefaults = (e) => e.preventDefault()
    const events = ['dragenter', 'dragover', 'dragleave', 'drop']
    events.forEach((evt) => document.body.addEventListener(evt, preventDefaults, false))
    return () => {
      events.forEach((evt) => document.body.removeEventListener(evt, preventDefaults, false))
    }
  }, [])

  // Intercept navigation when processing
  const handleNavClick = (e, item) => {
    if (processing) {
      e.preventDefault()
      setShowGuardModal(true)
      // Store intended target so we can navigate if user confirms
      sessionStorage.setItem('_pendingNav', item.path)
    } else {
      setSidebarOpen(false)
    }
  }

  const handleConfirmLeave = () => {
    stopProcessing()
    setShowGuardModal(false)
    const target = sessionStorage.getItem('_pendingNav')
    sessionStorage.removeItem('_pendingNav')
    if (target) navigate(target)
    setSidebarOpen(false)
  }

  const handleStay = () => {
    setShowGuardModal(false)
    sessionStorage.removeItem('_pendingNav')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Processing Guard Modal */}
      {showGuardModal && (
        <ProcessingGuardModal
          message={processingMessage}
          onStay={handleStay}
          onLeave={handleConfirmLeave}
        />
      )}

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <span className="font-extrabold text-[#1E3A5F] text-xl">论文工具箱</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-20 h-full w-[240px] bg-white border-r border-gray-100 flex flex-col
        transition-transform duration-200 lg:translate-x-0 shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <img src={logoSvg} alt="PaperTools 论文工具箱" className="h-12" />
        </Link>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 overflow-y-auto">
          {/* Home link */}
          <div className="mb-4">
            <NavLink
              to="/"
              onClick={(e) => handleNavClick(e, { path: '/' })}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] lg:text-sm transition-all duration-150 ${
                  processing ? 'text-gray-400 cursor-pointer opacity-60'
                  : isActive ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-[#1E3A5F]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Home size={17} className={isActive && !processing ? 'text-[#1E3A5F]' : 'text-gray-400'} />
                  <span className="truncate flex-1">首页</span>
                  {isActive && !processing && <ChevronRight size={12} className="text-[#3B82F6] flex-shrink-0" />}
                </>
              )}
            </NavLink>
          </div>

          {/* Section groups */}
          {navItems.reduce((acc, item, idx) => {
            if (item.section !== undefined) {
              const sectionItems = []
              let j = idx + 1
              while (j < navItems.length && navItems[j].section === undefined) {
                sectionItems.push(navItems[j])
                j++
              }
              const sectionName = item.section
              const firstItem = sectionItems[0]
              const subItems = sectionItems.slice(1)
              const isCollapsed = collapsedSections[sectionName]

              const renderLink = (si) => {
                if (!si) return null
                const SiIcon = si.icon
                return (
                  <NavLink
                    key={si.path}
                    to={si.path}
                    onClick={(e) => handleNavClick(e, si)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] lg:text-sm transition-all duration-150 ${si.indent ? 'ml-3 pl-4' : ''} ${
                        processing ? 'text-gray-400 cursor-pointer opacity-60'
                        : isActive ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#1E3A5F]'
                      }`
                    }
                  >
                    <SiIcon size={si.indent ? 13 : 15} />
                    <span className="truncate flex-1">{si.label}</span>
                  </NavLink>
                )
              }

              const firstItemActive = firstItem && (
                (firstItem.path === '/' ? location.pathname === '/' : location.pathname.startsWith(firstItem.path))
              )

              acc.push(
                <div key={`s-${idx}`} className="pt-4">
                  {/* Section title — NOT clickable */}
                  <div className="px-3 pb-1.5">
                    <span className="text-[15px] lg:text-[17px] font-bold text-[#374151] tracking-tight select-none">
                      {sectionName}
                    </span>
                  </div>

                  {/* First item — clickable toggles */}
                  {firstItem && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        toggleSection(sectionName)
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] lg:text-sm transition-all duration-150 ${
                        firstItemActive && !processing
                          ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-[#1E3A5F]'
                      }`}
                    >
                      <firstItem.icon size={15} className={firstItemActive && !processing ? 'text-[#1E3A5F]' : 'text-gray-400'} />
                      <span className="flex-1 text-left truncate">{firstItem.label}</span>
                      <ChevronDown
                        size={13}
                        className={`text-[#9CA3AF] transition-transform duration-200 flex-shrink-0 ${
                          isCollapsed ? '' : 'rotate-180'
                        }`}
                      />
                    </button>
                  )}

                  {/* Sub-items */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'
                    }`}
                  >
                    <div className="space-y-0.5 mt-0.5">
                      {subItems.map(si => renderLink(si))}
                    </div>
                  </div>
                </div>
              )
            }
            return acc
          }, [])}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 text-[10px] text-gray-400 text-center leading-relaxed">
          所有处理均在浏览器本地完成<br />文件不会上传，保护您的隐私
        </div>
      </aside>

      {/* Processing indicator bar */}
      {processing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-sm py-2 px-4 text-center font-medium animate-pulse lg:ml-[240px]">
          {processingMessage} — 请勿离开当前页面
        </div>
      )}

      {/* Main content */}
      <main className={`lg:ml-[240px] pt-14 lg:pt-0 min-h-screen ${processing ? 'lg:pt-10' : ''}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
        <footer className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-center text-xs text-[#9CA3AF]">
          论文工具箱 · 所有处理均在浏览器本地完成 · 文件不会上传 · 保护您的隐私
        </footer>
      </main>
    </div>
  )
}
