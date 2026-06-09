import { useState, useRef, useEffect, useCallback } from 'react'
import { Copy, Download, Code, X, Check, BookOpen, HelpCircle, Image as ImageIcon } from 'lucide-react'
import '../styles/katex.css'
import { copyText } from '../utils'

const templates = [
  {
    category: '基础',
    items: [
      { label: '分数', latex: '\\frac{a}{b}', desc: '分数' },
      { label: '平方根', latex: '\\sqrt{x}', desc: '平方根' },
      { label: 'n次根', latex: '\\sqrt[n]{x}', desc: 'n次方根' },
      { label: '上标', latex: 'x^{n}', desc: '上标' },
      { label: '下标', latex: 'x_{n}', desc: '下标' },
      { label: '上下标', latex: 'x_{n}^{m}', desc: '同时上下标' },
    ],
  },
  {
    category: '求和与积分',
    items: [
      { label: '求和', latex: '\\sum_{i=1}^{n} x_i', desc: '求和符号' },
      { label: '求积', latex: '\\prod_{i=1}^{n} x_i', desc: '连乘' },
      { label: '不定积分', latex: '\\int f(x)\\,dx', desc: '不定积分' },
      { label: '定积分', latex: '\\int_{a}^{b} f(x)\\,dx', desc: '定积分' },
      { label: '二重积分', latex: '\\iint_D f(x,y)\\,dx\\,dy', desc: '二重积分' },
      { label: '极限', latex: '\\lim_{x \\to \\infty} f(x)', desc: '极限' },
    ],
  },
  {
    category: '希腊字母',
    items: [
      { label: 'α β γ', latex: '\\alpha, \\beta, \\gamma', desc: '小写希腊字母' },
      { label: 'Δ Ω Σ', latex: '\\Delta, \\Omega, \\Sigma', desc: '大写希腊字母' },
      { label: 'θ λ μ', latex: '\\theta, \\lambda, \\mu', desc: '常用希腊字母' },
      { label: 'ε δ σ', latex: '\\varepsilon, \\delta, \\sigma', desc: '变体希腊字母' },
    ],
  },
  {
    category: '矩阵',
    items: [
      { label: '2x2矩阵', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', desc: '圆括号矩阵' },
      { label: '行列式', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', desc: '行列式' },
      { label: '方括号矩阵', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', desc: '方括号矩阵' },
      { label: '3x3矩阵', latex: '\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}', desc: '3x3矩阵' },
    ],
  },
  {
    category: '运算符',
    items: [
      { label: '约等于', latex: 'x \\approx y', desc: '约等于' },
      { label: '正比于', latex: 'y \\propto x', desc: '正比于' },
      { label: '不等于', latex: 'x \\neq y', desc: '不等于' },
      { label: '大于等于', latex: 'x \\geq y', desc: '大于等于' },
      { label: '偏导', latex: '\\frac{\\partial f}{\\partial x}', desc: '偏导数' },
      { label: '点乘/叉乘', latex: '\\cdot, \\times', desc: '乘号' },
    ],
  },
  {
    category: '集合与逻辑',
    items: [
      { label: '属于', latex: 'x \\in A', desc: '属于' },
      { label: '子集', latex: 'A \\subseteq B', desc: '子集' },
      { label: '并集/交集', latex: 'A \\cup B, A \\cap B', desc: '并集和交集' },
      { label: '全称/存在', latex: '\\forall, \\exists', desc: '量词' },
      { label: '空集', latex: '\\emptyset', desc: '空集' },
    ],
  },
  {
    category: '化学',
    items: [
      { label: '化学式', latex: '\\text{H}_2\\text{O}', desc: '水分子' },
      { label: '反应方程式', latex: '\\text{CO}_2 + \\text{H}_2\\text{O} \\rightarrow \\text{H}_2\\text{CO}_3', desc: '化学反应' },
      { label: '同位素', latex: '^{235}_{92}\\text{U}', desc: '铀同位素' },
      { label: '离子', latex: '\\text{Na}^+ + \\text{Cl}^-', desc: '离子式' },
    ],
  },
  {
    category: '常用公式',
    items: [
      { label: '二次方程', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', desc: '求根公式' },
      { label: '正态分布', latex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}', desc: '正态分布PDF' },
      { label: '欧拉公式', latex: 'e^{i\\pi} + 1 = 0', desc: '欧拉恒等式' },
      { label: '贝叶斯', latex: 'P(A|B) = \\frac{P(B|A)P(A)}{P(B)}', desc: '贝叶斯定理' },
      { label: '信息熵', latex: 'H(X) = -\\sum_{i} p_i \\log_2 p_i', desc: '香农熵' },
      { label: 'softmax', latex: '\\sigma(z)_i = \\frac{e^{z_i}}{\\sum_{j} e^{z_j}}', desc: 'Softmax函数' },
    ],
  },
]

export default function FormulaRenderer() {
  const [latex, setLatex] = useState('\\sum_{i=1}^{n} x_i = \\frac{n(n+1)}{2}')
  const [renderedHtml, setRenderedHtml] = useState('')
  const [renderError, setRenderError] = useState('')
  const [copied, setCopied] = useState('')
  const [activeCategory, setActiveCategory] = useState('基础')
  const previewRef = useRef(null)

  const render = useCallback((input) => {
    if (!input.trim()) { setRenderedHtml(''); setRenderError(''); return }
    try {
      const html = window.katex.renderToString(input, {
        throwOnError: true, displayMode: true,
        output: 'html', trust: false, strict: false,
      })
      setRenderedHtml(html); setRenderError('')
    } catch (err) {
      setRenderedHtml('')
      setRenderError(err.message.replace(/^KaTeX parse error:/, '语法错误：'))
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => render(latex), 300)
    return () => clearTimeout(timer)
  }, [latex, render])

  const handleCopyLatex = async () => {
    await copyText(latex)
    setCopied('code')
    setTimeout(() => setCopied(''), 2000)
  }

  // ── 复制为图片到剪贴板 ──
  const handleCopyAsImage = async () => {
    const container = previewRef.current
    if (!container) return

    // 先尝试直接复制SVG元素
    const svgEl = container.querySelector('svg')
    if (!svgEl) {
      // 没有SVG时用canvas渲染HTML
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const scale = 3
        const bbox = container.getBoundingClientRect()
        canvas.width = Math.max(bbox.width * scale, 400)
        canvas.height = Math.max(bbox.height * scale, 100)
        ctx.scale(scale, scale)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#000000'
        ctx.font = '24px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(latex.replace(/\\/g, ''), canvas.width / 2 / scale, canvas.height / 2 / scale)

        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            setCopied('image')
            setTimeout(() => setCopied(''), 2000)
          }
        }, 'image/png')
      } catch { /* fallback */ }
      return
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgEl)
      const canvas = document.createElement('canvas')
      const img = new Image()
      img.onload = async () => {
        const scale = 2
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.scale(scale, scale)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            setCopied('image')
            setTimeout(() => setCopied(''), 2000)
          } catch {
            setRenderError('复制失败，请使用 PNG 导出后再插入 Word')
          }
        }, 'image/png')
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    } catch {
      setRenderError('无法复制图片，请导出 PNG 后手动插入')
    }
  }

  const handleDownloadSVG = () => {
    if (!renderedHtml) return
    const container = previewRef.current
    if (!container) return
    const svgEl = container.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'formula.svg'
    a.click()
  }

  const handleDownloadPNG = () => {
    if (!renderedHtml) return
    const container = previewRef.current
    if (!container) return
    const svgEl = container.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const img = new Image()
    img.onload = () => {
      const scale = 2
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'formula.png'
        a.click()
      }, 'image/png')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const insertTemplate = (tpl) => {
    setLatex(prev => {
      const ta = document.getElementById('latex-input')
      if (ta) {
        const start = ta.selectionStart, end = ta.selectionEnd
        const newText = prev.slice(0, start) + tpl.latex + prev.slice(end)
        setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + tpl.latex.length }, 0)
        return newText
      }
      return prev + ' ' + tpl.latex
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">公式渲染器</h2>
      <p className="text-gray-500 text-sm mb-6">
        LaTeX 公式实时预览 · 8类公式模板 · 导出 SVG/PNG · <span className="text-green-600 font-medium">支持一键复制图片粘贴到 Word</span>
      </p>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">LaTeX 代码</span>
              <button onClick={handleCopyLatex} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                {copied === 'code' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied === 'code' ? '已复制' : '复制代码'}
              </button>
            </div>
            <textarea
              id="latex-input"
              value={latex}
              onChange={e => setLatex(e.target.value)}
              className="w-full h-48 p-4 text-sm font-mono resize-none focus:outline-none"
              placeholder="输入 LaTeX 公式..."
              spellCheck={false}
            />
          </div>

          {renderError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-mono">{renderError}</div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <BookOpen size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">公式模板（点击插入）</span>
            </div>
            <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100">
              {templates.map(cat => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat.category ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat.category}
                </button>
              ))}
            </div>
            <div className="p-2 grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
              {templates.find(cat => cat.category === activeCategory)?.items.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => insertTemplate(tpl)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-left transition-colors group"
                >
                  <Code size={12} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate">{tpl.label}</div>
                    <div className="text-[10px] text-gray-400 font-mono truncate">{tpl.latex}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">实时预览</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyLatex}
                  disabled={!renderedHtml}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <Code size={12} /> 复制LaTeX
                </button>
                <button
                  onClick={handleCopyAsImage}
                  disabled={!renderedHtml}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <ImageIcon size={12} /> {copied === 'image' ? '已复制!' : '复制图片'}
                </button>
                <button
                  onClick={handleDownloadSVG}
                  disabled={!renderedHtml}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <Download size={12} /> SVG
                </button>
                <button
                  onClick={handleDownloadPNG}
                  disabled={!renderedHtml}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <Download size={12} /> PNG
                </button>
              </div>
            </div>
            <div ref={previewRef} className="p-8 min-h-[320px] flex items-center justify-center">
              {renderedHtml ? (
                <div className="overflow-x-auto max-w-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
              ) : renderError ? (
                <div className="text-center">
                  <X size={32} className="mx-auto text-red-300 mb-3" />
                  <p className="text-sm text-red-500 font-mono">{renderError}</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <HelpCircle size={32} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">在左侧输入 LaTeX 公式即可预览</p>
                </div>
              )}
            </div>
          </div>

          {/* 操作说明 */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700">
              <span className="font-semibold">复制LaTeX源码 → Word：</span>
              点击「复制LaTeX」，在 Word 中按 Alt+= 插入公式，Ctrl+V 粘贴即可得到可编辑的数学公式！
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              <span className="font-semibold">复制图片 → Word：</span>
              点击「复制图片」按钮，在 Word 中 Ctrl+V 粘贴。适合不需要编辑的场合。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
