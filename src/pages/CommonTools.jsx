import { useState } from 'react'
import { Copy, RefreshCw, Ruler, Superscript, Type } from 'lucide-react'

// ── 科研专业单位换算 ──
const unitCategories = {
  pressure: {
    name: '压强/压力',
    desc: '论文中常用的压强单位换算',
    units: {
      '帕斯卡(Pa)': 1,
      '千帕(kPa)': 1e3,
      '兆帕(MPa)': 1e6,
      '吉帕(GPa)': 1e9,
      '巴(bar)': 1e5,
      '毫巴(mbar)': 1e2,
      '标准大气压(atm)': 101325,
      '毫米汞柱(mmHg)': 133.322,
      '托(Torr)': 133.322,
      '磅力/平方英寸(psi)': 6894.76,
    },
  },
  energy: {
    name: '能量/热量',
    desc: '物理化学论文常用能量单位',
    units: {
      '焦耳(J)': 1,
      '千焦(kJ)': 1e3,
      '卡路里(cal)': 4.184,
      '千卡(kcal)': 4184,
      '电子伏特(eV)': 1.602176634e-19,
      '千瓦时(kWh)': 3.6e6,
      '英热单位(BTU)': 1055.06,
      '尔格(erg)': 1e-7,
    },
  },
  viscosity: {
    name: '粘度',
    desc: '流体力学/材料学常用',
    units: {
      '帕斯卡·秒(Pa·s)': 1,
      '毫帕·秒(mPa·s)': 1e-3,
      '厘泊(cP)': 1e-3,
      '泊(P)': 0.1,
      '磅力·秒/平方英尺': 47.8803,
    },
  },
  magnetic: {
    name: '磁场/磁感应',
    desc: '物理/材料/医学(MRI)常用',
    units: {
      '特斯拉(T)': 1,
      '高斯(G)': 1e-4,
      '毫特斯拉(mT)': 1e-3,
      '微特斯拉(μT)': 1e-6,
      '纳特斯拉(nT)': 1e-9,
    },
  },
  radiation: {
    name: '辐射剂量',
    desc: '核科学/放射医学/环境科学',
    units: {
      '希沃特(Sv)': 1,
      '毫希沃特(mSv)': 1e-3,
      '微希沃特(μSv)': 1e-6,
      '雷姆(rem)': 0.01,
      '戈瑞(Gy)': 1,
      '拉德(rad)': 0.01,
    },
  },
  concentration: {
    name: '溶液浓度',
    desc: '化学/生物/药学实验',
    units: {
      '摩尔/升(mol/L)': 1,
      '毫摩尔/升(mmol/L)': 1e-3,
      '微摩尔/升(μmol/L)': 1e-6,
      '纳摩尔/升(nmol/L)': 1e-9,
      '皮摩尔/升(pmol/L)': 1e-12,
      '克/升(g/L)': 1,
      '毫克/毫升(mg/mL)': 1,
      '微克/毫升(μg/mL)': 1e-3,
      '百分比(%)': 10, // 假设1% ≈ 10g/L 作为参考
      '百万分之一(ppm)': 0.001, // 1ppm ≈ 1mg/L = 0.001g/L
    },
  },
  datastorage: {
    name: '数据存储',
    desc: '实验数据/计算资源',
    units: {
      '字节(B)': 1,
      '千字节(KB)': 1024,
      '兆字节(MB)': 1048576,
      '吉字节(GB)': 1073741824,
      '太字节(TB)': 1099511627776,
      '拍字节(PB)': 1125899906842624,
    },
  },
  light: {
    name: '光学/光度',
    desc: '光学实验/显示技术',
    units: {
      '流明(lm)': 1,
      '坎德拉(cd)': 1,
      '勒克斯(lux)': 1,
      '尼特(nit)': 1,
      '瓦特/球面度(W/sr)': 683,
    },
  },
}

const tools = [
  { id: 'unit', icon: Ruler, label: '专业单位换算', desc: '压强、能量、粘度、磁场、辐射、浓度等' },
  { id: 'convert', icon: RefreshCw, label: '格式互转', desc: 'CSV ↔ JSON ↔ Markdown表格' },
  { id: 'scientific', icon: Superscript, label: '科学计数法', desc: '数值与科学计数法互转' },
  { id: 'greek', icon: Type, label: '特殊符号', desc: '希腊字母和数学符号速查' },
]

const greekLetters = [
  { upper: 'Α', lower: 'α', name: 'Alpha' },
  { upper: 'Β', lower: 'β', name: 'Beta' },
  { upper: 'Γ', lower: 'γ', name: 'Gamma' },
  { upper: 'Δ', lower: 'δ', name: 'Delta' },
  { upper: 'Ε', lower: 'ε', name: 'Epsilon' },
  { upper: 'Ζ', lower: 'ζ', name: 'Zeta' },
  { upper: 'Η', lower: 'η', name: 'Eta' },
  { upper: 'Θ', lower: 'θ', name: 'Theta' },
  { upper: 'Ι', lower: 'ι', name: 'Iota' },
  { upper: 'Κ', lower: 'κ', name: 'Kappa' },
  { upper: 'Λ', lower: 'λ', name: 'Lambda' },
  { upper: 'Μ', lower: 'μ', name: 'Mu' },
  { upper: 'Ν', lower: 'ν', name: 'Nu' },
  { upper: 'Ξ', lower: 'ξ', name: 'Xi' },
  { upper: 'Ο', lower: 'ο', name: 'Omicron' },
  { upper: 'Π', lower: 'π', name: 'Pi' },
  { upper: 'Ρ', lower: 'ρ', name: 'Rho' },
  { upper: 'Σ', lower: 'σ', name: 'Sigma' },
  { upper: 'Τ', lower: 'τ', name: 'Tau' },
  { upper: 'Υ', lower: 'υ', name: 'Upsilon' },
  { upper: 'Φ', lower: 'φ', name: 'Phi' },
  { upper: 'Χ', lower: 'χ', name: 'Chi' },
  { upper: 'Ψ', lower: 'ψ', name: 'Psi' },
  { upper: 'Ω', lower: 'ω', name: 'Omega' },
]

const specialSymbols = [
  { symbol: '±', name: '正负号' }, { symbol: '×', name: '乘号' }, { symbol: '÷', name: '除号' },
  { symbol: '≤', name: '小于等于' }, { symbol: '≥', name: '大于等于' }, { symbol: '≠', name: '不等于' },
  { symbol: '≈', name: '约等于' }, { symbol: '∞', name: '无穷' }, { symbol: '√', name: '根号' },
  { symbol: '∑', name: '求和' }, { symbol: '∏', name: '求积' }, { symbol: '∫', name: '积分' },
  { symbol: '∂', name: '偏导' }, { symbol: '∆', name: '增量' }, { symbol: '°', name: '度' },
  { symbol: '′', name: '分' }, { symbol: '″', name: '秒' }, { symbol: '‰', name: '千分号' },
]

export default function CommonTools() {
  const [active, setActive] = useState('unit')

  // Unit state
  const [unitCat, setUnitCat] = useState('pressure')
  const [unitFrom, setUnitFrom] = useState('帕斯卡(Pa)')
  const [unitTo, setUnitTo] = useState('标准大气压(atm)')
  const [unitValue, setUnitValue] = useState('1')
  const [unitResult, setUnitResult] = useState('')
  const [showUnitHelp, setShowUnitHelp] = useState(false)

  // Convert state
  const [convertInput, setConvertInput] = useState('')
  const [convertOutput, setConvertOutput] = useState('')
  const [convertFrom, setConvertFrom] = useState('csv')
  const [convertTo, setConvertTo] = useState('json')
  const [convertMsg, setConvertMsg] = useState('')

  // Scientific state
  const [sciInput, setSciInput] = useState('')
  const [sciOutput, setSciOutput] = useState('')
  const [sciMode, setSciMode] = useState('toSci')
  const [sciPrecision, setSciPrecision] = useState(4)

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
  }

  // ── 单位换算 ──
  const handleUnitConvert = () => {
    const cat = unitCategories[unitCat]
    if (!cat) return

    // 处理科学计数法输入
    const val = Number(unitValue)
    if (isNaN(val)) { setUnitResult('请输入有效数值，支持科学计数法如 1.5e3'); return }
    if (!cat.units[unitFrom] || !cat.units[unitTo]) { setUnitResult('请选择单位'); return }

    const fromFactor = cat.units[unitFrom]
    const toFactor = cat.units[unitTo]
    const result = val * fromFactor / toFactor

    // 根据大小选择显示格式
    let resultStr
    if (Math.abs(result) < 0.01 || Math.abs(result) >= 1e6) {
      resultStr = result.toExponential(4)
    } else {
      resultStr = result.toPrecision(6)
    }

    setUnitResult(`${val} ${unitFrom} = ${resultStr} ${unitTo}`)
  }

  // 切换单位类别时重置
  const switchUnitCat = (cat) => {
    setUnitCat(cat)
    const units = Object.keys(unitCategories[cat].units)
    setUnitFrom(units[0])
    setUnitTo(units[1] || units[0])
    setUnitResult('')
  }

  // ── 格式转换 ──
  const handleConvert = () => {
    try {
      let result = ''
      if (convertFrom === 'csv' && convertTo === 'json') {
        const lines = convertInput.trim().split('\n').filter(l => l.trim())
        if (lines.length < 2) throw new Error('CSV至少需要表头+1行数据')
        const headers = lines[0].split(',').map(h => h.trim())
        const data = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim())
          const obj = {}
          headers.forEach((h, i) => { obj[h] = vals[i] || '' })
          return obj
        })
        result = JSON.stringify(data, null, 2)
      } else if (convertFrom === 'json' && convertTo === 'csv') {
        const arr = JSON.parse(convertInput)
        if (!Array.isArray(arr) || arr.length === 0) throw new Error('需要JSON数组格式，如 [{"a":1}, {"a":2}]')
        const headers = Object.keys(arr[0])
        result = headers.join(',') + '\n' + arr.map(item => headers.map(h => item[h] ?? '').join(',')).join('\n')
      } else if (convertFrom === 'json' && convertTo === 'markdown') {
        const arr = JSON.parse(convertInput)
        if (!Array.isArray(arr) || arr.length === 0) throw new Error('需要JSON数组')
        const headers = Object.keys(arr[0])
        result = '| ' + headers.join(' | ') + ' |\n| ' + headers.map(() => '---').join(' | ') + ' |\n'
        result += arr.map(item => '| ' + headers.map(h => item[h] ?? '').join(' | ') + ' |').join('\n')
      } else if (convertFrom === 'markdown' && convertTo === 'csv') {
        const lines = convertInput.trim().split('\n').filter(l => l.trim() && !l.match(/^\|?\s*[-:]+\s*\|/))
        const rows = lines.map(l => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()))
        if (rows.length < 2) throw new Error('Markdown表格至少需要表头+1行')
        result = rows.map(r => r.join(',')).join('\n')
      } else if (convertFrom === 'markdown' && convertTo === 'json') {
        const lines = convertInput.trim().split('\n').filter(l => l.trim() && !l.match(/^\|?\s*[-:]+\s*\|/))
        const rows = lines.map(l => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()))
        if (rows.length < 2) throw new Error('Markdown表格至少需要表头+1行')
        const headers = rows[0]
        const data = rows.slice(1).map(row => {
          const obj = {}
          headers.forEach((h, i) => { obj[h] = row[i] || '' })
          return obj
        })
        result = JSON.stringify(data, null, 2)
      } else {
        setConvertMsg('不支持的转换方向，请调整选择')
        return
      }
      setConvertOutput(result)
      setConvertMsg('转换成功！')
    } catch (e) {
      setConvertMsg('转换失败：' + e.message)
      setConvertOutput('')
    }
  }

  // ── 科学计数法（修复版：正确解析 "1.23e-6" 字符串）──
  const handleSciConvert = () => {
    const trimmed = sciInput.trim()
    if (!trimmed) { setSciOutput('请输入数值'); return }

    if (sciMode === 'toSci') {
      const val = Number(trimmed)
      if (isNaN(val)) { setSciOutput('请输入有效数值，如 0.00000123'); return }
      setSciOutput(val.toExponential(sciPrecision))
    } else {
      // 从科学计数法转数值：支持 1.23e-6, 1.23E-6, 1.23×10^-6
      const cleaned = trimmed.replace(/×10\^/i, 'e')
      const val = Number(cleaned)
      if (isNaN(val)) { setSciOutput('请输入有效科学计数法，如 1.23e-6'); return }

      // 小数值用完整显示
      if (Math.abs(val) < 1e-3 && Math.abs(val) > 0) {
        setSciOutput(val.toFixed(Math.min(20, Math.abs(Math.floor(Math.log10(Math.abs(val)))) + 2)))
      } else {
        setSciOutput(String(val))
      }
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">通用工具</h2>
      <p className="text-gray-500 text-sm mb-6">科研专业单位换算、格式转换、科学计数法、特殊符号</p>

      {/* Tool tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActive(tool.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === tool.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tool.icon size={16} /> {tool.label}
          </button>
        ))}
      </div>

      {/* ── 专业单位换算 ── */}
      {active === 'unit' && (
        <div className="space-y-4">
          {/* 类别选择 */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(unitCategories).map(([k, v]) => (
              <button
                key={k}
                onClick={() => switchUnitCat(k)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  unitCat === k
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>

          {/* 当前类别说明 */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-700">
            📖 {unitCategories[unitCat].name}：{unitCategories[unitCat].desc}
          </div>

          {/* 换算区 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col gap-4">
              {/* 输入 */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">输入数值（支持科学计数法，如 1.5e3）</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={unitValue}
                    onChange={e => setUnitValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUnitConvert()}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm flex-1 font-mono focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
                    placeholder="输入数值"
                  />
                  <select
                    value={unitFrom}
                    onChange={e => setUnitFrom(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 min-w-[160px]"
                  >
                    {Object.keys(unitCategories[unitCat].units).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 箭头 */}
              <div className="flex justify-center">
                <span className="text-gray-300 text-xl">↓</span>
              </div>

              {/* 输出 */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">转换为</label>
                <div className="flex items-center gap-3">
                  <select
                    value={unitTo}
                    onChange={e => setUnitTo(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 min-w-[160px]"
                  >
                    {Object.keys(unitCategories[unitCat].units).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleUnitConvert}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    换算
                  </button>
                </div>
              </div>
            </div>

            {/* 结果 */}
            {unitResult && (
              <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm font-mono font-medium text-green-800">{unitResult}</span>
                <button
                  onClick={() => copyText(unitResult)}
                  className="flex items-center gap-1 px-3 py-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Copy size={12} /> 复制
                </button>
              </div>
            )}

            {/* 快捷换算表 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowUnitHelp(!showUnitHelp)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {showUnitHelp ? '收起' : '展开'} 常用换算速查
              </button>
              {showUnitHelp && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-500">
                  {Object.entries(unitCategories[unitCat].units).slice(0, 8).map(([name, factor]) => (
                    <div key={name} className="flex justify-between px-2 py-1 bg-gray-50 rounded">
                      <span>{name}</span>
                      <span className="font-mono text-gray-600">= {factor.toExponential(3)} 基准</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 格式互转 ── */}
      {active === 'convert' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <select value={convertFrom} onChange={e => setConvertFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown表格</option>
              </select>
              <span className="text-gray-400 text-sm">→</span>
              <select value={convertTo} onChange={e => setConvertTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="markdown">Markdown表格</option>
              </select>
              <button onClick={handleConvert} className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                <RefreshCw size={14} /> 转换
              </button>
            </div>
            <textarea
              value={convertInput}
              onChange={e => setConvertInput(e.target.value)}
              className="w-full h-60 border border-gray-200 rounded-lg p-3 text-sm font-mono resize-none"
              placeholder={
                convertFrom === 'csv' ? '名称,数值,单位\n样本A,1.5,cm\n样本B,2.3,cm' :
                convertFrom === 'json' ? '[{"名称":"样本A","数值":1.5},{"名称":"样本B","数值":2.3}]' :
                '| 名称 | 数值 |\n| --- | --- |\n| 样本A | 1.5 |\n| 样本B | 2.3 |'
              }
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">输出结果</span>
              {convertOutput && (
                <button onClick={() => copyText(convertOutput)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Copy size={12} /> 复制
                </button>
              )}
            </div>
            <textarea
              value={convertOutput}
              readOnly
              className="w-full h-60 border border-gray-200 rounded-lg p-3 text-sm font-mono resize-none bg-gray-50"
              placeholder="转换结果..."
            />
            {convertMsg && (
              <p className={`mt-2 text-xs ${convertMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{convertMsg}</p>
            )}
          </div>
        </div>
      )}

      {/* ── 科学计数法 ── */}
      {active === 'scientific' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <Superscript size={18} className="text-blue-500" />
            <span className="font-semibold text-gray-800">科学计数法转换</span>
          </div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setSciMode('toSci'); setSciOutput('') }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${sciMode === 'toSci' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              数值 → 科学计数法
            </button>
            <button
              onClick={() => { setSciMode('fromSci'); setSciOutput('') }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${sciMode === 'fromSci' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              科学计数法 → 数值
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={sciInput}
              onChange={e => setSciInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSciConvert()}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 font-mono"
              placeholder={sciMode === 'toSci' ? '输入数值，如 0.00000123 或 123456789' : '输入科学计数法，如 1.23e-6 或 1.23×10^-6'}
            />
            {sciMode === 'toSci' && (
              <select
                value={sciPrecision}
                onChange={e => setSciPrecision(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-500"
              >
                {[2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n}位</option>)}
              </select>
            )}
            <button onClick={handleSciConvert} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              转换
            </button>
          </div>
          {sciOutput && (
            <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg p-4">
              <span className="text-sm font-mono font-medium text-blue-800">{sciOutput}</span>
              <button onClick={() => copyText(sciOutput)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <Copy size={12} /> 复制
              </button>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-400">
            支持格式：1.23e-6、1.23E-6、1.23×10⁻⁶
          </p>
        </div>
      )}

      {/* ── 特殊符号 ── */}
      {active === 'greek' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">希腊字母 — 点击复制</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {greekLetters.map((g, i) => (
                <div key={i} className="flex gap-1">
                  <button
                    onClick={() => copyText(g.upper)}
                    className="flex-1 py-2 bg-gray-50 hover:bg-blue-50 rounded-lg text-center text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-100"
                    title={`${g.name} 大写 - 点击复制`}
                  >
                    {g.upper}
                  </button>
                  <button
                    onClick={() => copyText(g.lower)}
                    className="flex-1 py-2 bg-gray-50 hover:bg-blue-50 rounded-lg text-center text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-100"
                    title={`${g.name} 小写 - 点击复制`}
                  >
                    {g.lower}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">数学符号 — 点击复制</h3>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
              {specialSymbols.map((s, i) => (
                <button
                  key={i}
                  onClick={() => copyText(s.symbol)}
                  className="py-2 bg-gray-50 hover:bg-blue-50 rounded-lg text-center text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-100"
                  title={`${s.name} - 点击复制`}
                >
                  {s.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
