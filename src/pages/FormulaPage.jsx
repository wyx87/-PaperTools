import { useState, useCallback, useEffect, useRef } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import { Copy, Image as ImageIcon, FileCode, AlertCircle, Check, ChevronDown } from 'lucide-react'

const FORMULA_CATEGORIES = {
  '代数运算': [
    { name: '一元二次方程求根', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    { name: '二项式展开', latex: '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^{k}' },
    { name: '平方差公式', latex: 'a^2 - b^2 = (a-b)(a+b)' },
    { name: '因式分解和', latex: '(a+b+c)^2 = a^2+b^2+c^2+2ab+2bc+2ca' },
  ],
  '微积分': [
    { name: '导数定义', latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h)-f(x)}{h}" },
    { name: '牛顿-莱布尼茨公式', latex: '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)' },
    { name: '高斯积分', latex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}' },
    { name: '泰勒级数', latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n' },
    { name: '偏微分方程', latex: '\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u' },
  ],
  '线性代数': [
    { name: '矩阵乘法', latex: 'C_{ij} = \\sum_{k=1}^{n} A_{ik} B_{kj}' },
    { name: '行列式展开', latex: '\\det(A) = \\sum_{j=1}^{n} (-1)^{i+j} a_{ij} M_{ij}' },
    { name: '特征值方程', latex: 'A\\mathbf{v} = \\lambda \\mathbf{v}' },
    { name: 'Gram-Schmidt正交化', latex: '\\mathbf{u}_k = \\mathbf{v}_k - \\sum_{i=1}^{k-1} \\text{proj}_{\\mathbf{u}_i}(\\mathbf{v}_k)' },
  ],
  '集合与逻辑': [
    { name: '德摩根律', latex: '\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}' },
    { name: '笛卡尔积', latex: 'A \\times B = \\{(a,b) \\mid a \\in A, b \\in B\\}' },
    { name: '幂集基数', latex: '|\\mathcal{P}(A)| = 2^{|A|}' },
    { name: '逻辑蕴含', latex: '(P \\implies Q) \\iff (\\neg P \\lor Q)' },
  ],
  '三角函数': [
    { name: '欧拉公式', latex: 'e^{i\\theta} = \\cos\\theta + i\\sin\\theta' },
    { name: '和差化积', latex: '\\sin A + \\sin B = 2\\sin\\frac{A+B}{2}\\cos\\frac{A-B}{2}' },
    { name: '倍角公式', latex: '\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta = 2\\cos^2\\theta - 1' },
    { name: '余弦定理', latex: 'c^2 = a^2 + b^2 - 2ab\\cos C' },
  ],
  '物理公式': [
    { name: '牛顿第二定律', latex: '\\mathbf{F} = m\\mathbf{a}' },
    { name: '质能方程', latex: 'E = mc^2' },
    { name: '麦克斯韦-法拉第', latex: '\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}' },
    { name: '薛定谔方程', latex: 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi' },
    { name: '万有引力', latex: 'F = G\\frac{m_1 m_2}{r^2}' },
  ],
  '化学公式': [
    { name: '化学平衡常数', latex: 'K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}' },
    { name: '阿仑尼乌斯方程', latex: 'k = A e^{-E_a/(RT)}' },
    { name: '能斯特方程', latex: 'E = E^\\circ - \\frac{RT}{nF}\\ln Q' },
    { name: '理想气体状态方程', latex: 'PV = nRT' },
  ],
  '统计概率': [
    { name: '贝叶斯定理', latex: 'P(A|B) = \\frac{P(B|A)\\,P(A)}{P(B)}' },
    { name: '正态分布', latex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}' },
    { name: '期望与方差', latex: '\\text{Var}(X) = E[X^2] - (E[X])^2' },
    { name: '大数定律', latex: '\\lim_{n \\to \\infty} P\\left(\\left|\\frac{1}{n}\\sum X_i - \\mu\\right| < \\varepsilon\\right) = 1' },
    { name: '协方差', latex: '\\text{Cov}(X,Y) = E[(X-E[X])(Y-E[Y])]' },
  ],
}

const CATEGORY_KEYS = Object.keys(FORMULA_CATEGORIES)

// MathJax CDN — loaded on-demand for tex2mml (Word-compatible MathML)
function loadMathJax() {
  return new Promise((resolve, reject) => {
    if (window.MathJax?.tex2mmlPromise) return resolve(window.MathJax)
    if (document.getElementById('mathjax-script')) {
      // Script already loading, poll
      const t = setInterval(() => {
        if (window.MathJax?.tex2mmlPromise) { clearInterval(t); resolve(window.MathJax) }
      }, 200)
      setTimeout(() => { clearInterval(t); reject(new Error('MathJax load timeout')) }, 15000)
      return
    }
    const script = document.createElement('script')
    script.id = 'mathjax-script'
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3/es5/tex-mml-chtml.js'
    script.async = true
    script.onload = () => {
      // Give MathJax a moment to initialize
      const check = () => {
        if (window.MathJax?.tex2mmlPromise) resolve(window.MathJax)
        else setTimeout(check, 200)
      }
      setTimeout(check, 500)
    }
    script.onerror = () => reject(new Error('MathJax CDN 加载失败'))
    document.head.appendChild(script)
  })
}

// 自动去除 LaTeX 可能夹带的 $ 和 $$ 符号（如豆包等 AI 生成的包裹格式）
function stripLatexDelimiters(code) {
  let s = code.trim()
  // 去除 $$...$$ 包裹
  if (s.startsWith('$$') && s.endsWith('$$')) {
    s = s.slice(2, -2).trim()
  }
  // 去除 $...$ 包裹
  if (s.startsWith('$') && s.endsWith('$') && !s.startsWith('$$')) {
    s = s.slice(1, -1).trim()
  }
  return s
}

export default function FormulaPage() {
  const [latex, setLatex] = useState('\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)')
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedType, setCopiedType] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({ '代数运算': true })
  const [mathmlLoading, setMathmlLoading] = useState(false)
  const previewRef = useRef(null)

  // 输入时自动清理 $ 包裹
  const handleLatexChange = (val) => {
    setLatex(stripLatexDelimiters(val))
  }

  // KaTeX display render (fast, beautiful)
  useEffect(() => {
    try {
      const result = window.katex.renderToString(latex, {
        throwOnError: true,
        displayMode: true,
        trust: true,
      })
      setHtml(result)
      setError('')
    } catch (e) {
      setError(e.message)
      setHtml('')
    }
  }, [latex])

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const handleTemplateClick = (formula) => {
    setLatex(formula.latex)
  }

  // Copy as MathML via MathJax — guaranteed Word-editable
  const handleCopyMathML = async () => {
    setMathmlLoading(true)
    try {
      // Load MathJax and get tex2mmlPromise
      const mj = await loadMathJax()
      const mathmlStr = await mj.tex2mmlPromise(latex)

      // Copy as text/html so Word recognizes it as an equation
      try {
        const htmlBlob = new Blob([mathmlStr], { type: 'text/html' })
        const textBlob = new Blob([mathmlStr], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
        ])
      } catch {
        // Fallback: execCommand
        const div = document.createElement('div')
        div.innerHTML = mathmlStr
        div.style.position = 'fixed'
        div.style.left = '-9999px'
        div.style.top = '0'
        document.body.appendChild(div)
        const range = document.createRange()
        range.selectNodeContents(div)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
        document.execCommand('copy')
        sel.removeAllRanges()
        document.body.removeChild(div)
      }
      setCopiedType('mathml')
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      // Fallback: try KaTeX MathML
      try {
        const mathml = window.katex.renderToString(latex, { output: 'mathml', throwOnError: false })
        const htmlBlob = new Blob([mathml], { type: 'text/html' })
        const textBlob = new Blob([mathml], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
        ])
        setCopiedType('mathml')
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch (err2) {
        setError('MathML 复制失败: ' + e.message)
      }
    } finally {
      setMathmlLoading(false)
    }
  }

  // Copy formula as PNG image
  const handleCopyImage = async () => {
    if (!html) return
    try {
      const container = document.createElement('div')
      container.innerHTML = html
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.padding = '16px'
      container.style.background = 'white'
      document.body.appendChild(container)

      const rect = container.getBoundingClientRect()
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = Math.max(rect.width, 300) * scale
      canvas.height = Math.max(rect.height, 60) * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const svgStr = new XMLSerializer().serializeToString(container)
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve()
        }
        img.onerror = reject
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
      })
      document.body.removeChild(container)

      try {
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            setCopiedType('image')
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
        })
      } catch {
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = 'formula.png'
        a.click()
        setCopiedType('image')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (e) {
      setError('图片复制失败: ' + e.message)
    }
  }

  // Copy LaTeX source code
  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latex)
      setCopiedType('latex')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('复制失败')
    }
  }

  const copiedLabel = copiedType === 'mathml'
    ? 'MathML 已复制（MathJax）'
    : copiedType === 'image' ? '图片已复制' : '代码已复制'
  const totalFormulas = CATEGORY_KEYS.reduce((sum, k) => sum + FORMULA_CATEGORIES[k].length, 0)

  return (
    <ChartPageLayout title="公式渲染器" breadcrumb="公式渲染">
      {/* ===== Upper: Editor + Preview ===== */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Left: Editor */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5">
              <FileCode size={15} className="text-[#93C5FD]" />LaTeX 公式输入
            </h3>
            <button onClick={() => { setLatex(''); setError(''); }}
              className="text-xs px-2.5 py-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              清空
            </button>
          </div>
          <textarea
            value={latex}
            onChange={e => handleLatexChange(e.target.value)}
            placeholder={`输入纯 LaTeX 代码（不要包含 $ 符号）\n示例: \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n\n⚠️ 如果从豆包/AI 复制的内容带有 $$...$$ 或 $...$ 包裹，会自动去除。`}
            rows={5}
            className="w-full text-base font-mono p-4 outline-none resize-y"
            spellCheck={false}
          />
          {error && (
            <div className="mx-4 mb-3 p-2.5 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
              <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 font-mono leading-relaxed break-all">{error}</p>
            </div>
          )}
        </div>

        {/* Right: Preview + Copy buttons */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-semibold text-[#1E3A5F]">实时渲染预览</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleCopyLatex}
                className="text-xs px-3 py-1.5 rounded-md font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center gap-1">
                <Copy size={12} />LaTeX
              </button>
              <button onClick={handleCopyMathML}
                disabled={mathmlLoading}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  copied && copiedType === 'mathml'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                } ${mathmlLoading ? 'opacity-50 cursor-wait' : ''}`}>
                {mathmlLoading
                  ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : copied && copiedType === 'mathml' ? <Check size={12} /> : <Copy size={12} />
                }
                MathML
              </button>
              <button onClick={handleCopyImage}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  copied && copiedType === 'image'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {copied && copiedType === 'image' ? <Check size={12} /> : <ImageIcon size={12} />}
                图片
              </button>
            </div>
          </div>
          <div ref={previewRef} className="flex-1 flex items-center justify-center p-6 bg-gray-50/30 min-h-[180px]">
            {html ? (
              <div dangerouslySetInnerHTML={{ __html: html }} className="text-[#1E3A5F] max-w-full overflow-x-auto" />
            ) : error ? (
              <p className="text-sm text-gray-400">修正语法错误后自动显示</p>
            ) : (
              <p className="text-sm text-gray-400">输入 LaTeX 公式，实时预览</p>
            )}
          </div>
          {copied && (
            <div className="mx-4 mb-3 p-2.5 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
              <Check size={14} className="text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700">{copiedLabel} — {
                copiedType === 'mathml' ? '粘贴到 Word 中可编辑公式（MathJax 引擎）' :
                copiedType === 'image' ? '已复制为高清图片' : 'LaTeX 代码已复制'
              }</span>
            </div>
          )}
          {/* LaTeX 格式 + Word 粘贴使用说明 */}
          <div className="mx-4 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
              <div className="text-[13px] text-gray-600 leading-relaxed">
                <p className="font-semibold text-[#1E3A5F] mb-1.5">如何使用？</p>
                
                <p className="font-semibold text-gray-700 mt-2 mb-1">📝 LaTeX 输入格式</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>输入<b>纯 LaTeX 公式代码</b>，例如 <code className="bg-white px-1 rounded text-xs">\frac{a}{b}</code></li>
                  <li><b>⚠️ 不要包含 $ 或 $$ 符号</b>——豆包等 AI 生成的 <code className="bg-white px-1 rounded text-xs">$...$</code> 或 <code className="bg-white px-1 rounded text-xs">$$...$$</code> 包裹会自动去除</li>
                  <li>可直接从下方模板库点选公式，或从其他来源复制 LaTeX 代码粘贴</li>
                </ol>

                <p className="font-semibold text-gray-700 mt-2 mb-1">📋 粘贴到 Word</p>
                <ol className="list-decimal pl-4 space-y-0.5" start={4}>
                  <li>点击上方 <span className="font-medium text-[#3B82F6]">「MathML」</span> 按钮。</li>
                  <li>打开 Word，在目标位置 <span className="font-medium">右键 → 粘贴选项 → 只保留文本</span>。</li>
                  <li>公式将显示为可双击编辑的 Word 公式对象。</li>
                </ol>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  如果粘贴后显示为代码，请确保使用的是 Word 2016 或更高版本（Windows）。Mac 版 Word 可能需尝试其他粘贴方式。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Template Library ===== */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5">
            <FileCode size={15} className="text-[#C4B5FD]" />公式模板库
            <span className="text-xs text-gray-400 font-normal">{totalFormulas} 个公式 · 8 类</span>
          </h3>
        </div>
        <div className="p-3">
          <div className="space-y-2">
            {CATEGORY_KEYS.map(cat => (
              <div key={cat} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50/70 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-[#1E3A5F]">
                    {cat}
                    <span className="text-gray-400 ml-1.5 font-normal">({FORMULA_CATEGORIES[cat].length})</span>
                  </span>
                  <ChevronDown size={14}
                    className={`text-gray-400 transition-transform duration-200 ${expandedCategories[cat] ? 'rotate-180' : ''}`} />
                </button>
                {expandedCategories[cat] && (
                  <div className="p-2.5 flex flex-wrap gap-2">
                    {FORMULA_CATEGORIES[cat].map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleTemplateClick(f)}
                        className={`px-3 py-2 text-sm rounded-lg font-medium transition-all border ${
                          latex === f.latex
                            ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                            : 'bg-white text-gray-600 border-gray-150 hover:border-[#1E3A5F]/20 hover:bg-[#1E3A5F]/5'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hint */}
      <div className="mt-4 p-3.5 bg-[#1E3A5F]/5 rounded-lg space-y-1">
        <p className="text-sm text-[#6B7280]">
          使用 KaTeX 快速渲染显示 + MathJax 3 引擎生成 Word 兼容 MathML。
          点击「MathML」后粘贴到 Word，公式自动变为可编辑对象（双击可修改）；「图片」复制为高清 PNG 备选。
        </p>
        <p className="text-xs text-gray-400">
          ⚠️ 输入公式时不需要 $ 或 $$ 符号（如从豆包等 AI 复制的内容会自动去除）。模板库提供 {totalFormulas} 个常用公式参考。
        </p>
      </div>
    </ChartPageLayout>
  )
}
