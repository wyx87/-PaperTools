import { Link } from 'react-router-dom'
import { FileOutput, Combine, Scissors, FileDown, Image, RotateCw, Shield } from 'lucide-react'

const tools = [
  {
    to: '/pdf/to-word', icon: FileOutput,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: 'PDF 智能转换', desc: '三层混合转换模型：文字提取 / OCR 识别 / 图片型 Word',
  },
  {
    to: '/pdf/merge', icon: Combine,
    color: 'bg-green-50 text-green-600 border-green-200',
    title: 'PDF 合并', desc: '将多个 PDF 文件合并为一个，支持拖拽排序',
  },
  {
    to: '/pdf/split', icon: Scissors,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    title: 'PDF 拆分', desc: '按页数、范围或份数拆分 PDF，可打包 ZIP 下载',
  },
  {
    to: '/pdf/compress', icon: FileDown,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: 'PDF 压缩', desc: '减小 PDF 文件体积，可调节压缩质量',
  },
  {
    to: '/pdf/to-image', icon: Image,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    title: 'PDF 转图片', desc: '将 PDF 每页渲染为高质量 PNG 图片',
  },
  {
    to: '/pdf/rotate-delete', icon: RotateCw,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '旋转/删除页面', desc: '对 PDF 页面进行旋转或删除，灵活调整',
  },
]

export default function PdfHome() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">PDF 全能处理</h1>
        <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
          6 大 PDF 处理工具，全部在浏览器本地完成。无需上传、完全免费、无限次数。
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {tools.map(tool => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl ${tool.color} border flex items-center justify-center flex-shrink-0`}>
                <tool.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{tool.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{tool.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 隐私和安全说明 */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Shield, text: '纯浏览器本地处理，文件不上传' },
          { icon: Shield, text: '支持最新 Chrome / Edge / Firefox' },
          { icon: Shield, text: '无文件数量限制，完全免费' },
        ].map((item, i) => (
          <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
            <item.icon size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-xs text-gray-600">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
