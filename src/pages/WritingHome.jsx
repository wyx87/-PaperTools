import { Link } from 'react-router-dom'
import { Type, Pilcrow, Library, Eraser, Shield } from 'lucide-react'

const tools = [
  {
    to: '/writing/word-count', icon: Type,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '字数统计增强版', desc: '多维实时统计：中英文、数字、标点、行数段落数',
  },
  {
    to: '/writing/punctuation', icon: Pilcrow,
    color: 'bg-green-50 text-green-600 border-green-200',
    title: '标点全半角转换', desc: '一键统一中英文标点，适配中/英文排版需求',
  },
  {
    to: '/writing/phrases', icon: Library,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    title: '学术句式模板库', desc: '50+ 条学术写作常用句式，分类浏览·一键复制',
  },
  {
    to: '/writing/cleaner', icon: Eraser,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '排版清理器', desc: '清除多余空行、空格，统一换行符——让文本整洁',
  },
]

export default function WritingHome() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">论文写作辅助</h1>
        <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
          4 大写作工具，全部在浏览器本地处理。无需上传、完全免费、无限次数。
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

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {[
          '纯浏览器本地处理，数据不上传',
          '支持最新 Chrome / Edge / Firefox',
        ].map((text, i) => (
          <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
            <Shield size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-xs text-gray-600">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
