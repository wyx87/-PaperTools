import { useState, useRef } from 'react'
import { Wrench, Ruler, RefreshCw, Image, ShieldCheck, Copy, Upload, Download, Trash2, X } from 'lucide-react'
import JSZip from 'jszip'
import { downloadBlob, formatFileSize, copyText } from '../utils'

// ── 科研专业单位换算 ──
const unitCategories = {
  pressure: {
    name: '压强/压力', desc: '论文中常用的压强单位换算',
    units: { '帕斯卡(Pa)': 1, '千帕(kPa)': 1e3, '兆帕(MPa)': 1e6, '吉帕(GPa)': 1e9, '巴(bar)': 1e5, '毫巴(mbar)': 1e2, '标准大气压(atm)': 101325, '毫米汞柱(mmHg)': 133.322, '托(Torr)': 133.322, '磅力/平方英寸(psi)': 6894.76 },
  },
  energy: {
    name: '能量/热量', desc: '物理化学论文常用能量单位',
    units: { '焦耳(J)': 1, '千焦(kJ)': 1e3, '卡路里(cal)': 4.184, '千卡(kcal)': 4184, '电子伏特(eV)': 1.602176634e-19, '千瓦时(kWh)': 3.6e6, '英热单位(BTU)': 1055.06 },
  },
  viscosity: {
    name: '粘度', desc: '流体力学/材料学常用',
    units: { '帕斯卡·秒(Pa·s)': 1, '毫帕·秒(mPa·s)': 1e-3, '厘泊(cP)': 1e-3, '泊(P)': 0.1 },
  },
  magnetic: {
    name: '磁场/磁感应', desc: '物理/材料/医学(MRI)常用',
    units: { '特斯拉(T)': 1, '高斯(G)': 1e-4, '毫特斯拉(mT)': 1e-3, '微特斯拉(μT)': 1e-6 },
  },
  radiation: {
    name: '辐射剂量', desc: '核科学/放射医学/环境科学',
    units: { '希沃特(Sv)': 1, '毫希沃特(mSv)': 1e-3, '微希沃特(μSv)': 1e-6, '雷姆(rem)': 0.01, '戈瑞(Gy)': 1, '拉德(rad)': 0.01 },
  },
  concentration: {
    name: '溶液浓度', desc: '化学/生物/药学实验',
    units: { '摩尔/升(mol/L)': 1, '毫摩尔/升(mmol/L)': 1e-3, '微摩尔/升(μmol/L)': 1e-6, '纳摩尔/升(nmol/L)': 1e-9, '克/升(g/L)': 1, '毫克/毫升(mg/mL)': 1, '微克/毫升(μg/mL)': 1e-3 },
  },
  datastorage: {
    name: '数据存储', desc: '实验数据/计算资源',
    units: { '字节(B)': 1, '千字节(KB)': 1024, '兆字节(MB)': 1048576, '吉字节(GB)': 1073741824, '太字节(TB)': 1099511627776 },
  },
  light: {
    name: '光学/光度', desc: '光学实验/显示技术',
    units: { '流明(lm)': 1, '坎德拉(cd)': 1, '勒克斯(lux)': 1, '尼特(nit)': 1 },
  },
}

const subTools = [
  { id: 'unit', icon: Ruler, label: '单位换算', desc: '8类科研专业单位换算' },
  { id: 'convert', icon: RefreshCw, label: '格式互转', desc: 'CSV ↔ JSON ↔ Markdown' },
  { id: 'image', icon: Image, label: '图片压缩', desc: '批量压缩图片大小' },
  { id: 'metadata', icon: ShieldCheck, label: '元数据清理', desc: '清除文档中的个人信息' },
]

export default function ToolsHub() {
  const [active, setActive] = useState('unit')

  // ── 单位换算 ──
  const [unitCat, setUnitCat] = useState('pressure')
  const [unitFrom, setUnitFrom] = useState('帕斯卡(Pa)')
  const [unitTo, setUnitTo] = useState('标准大气压(atm)')
  const [unitValue, setUnitValue] = useState('1')
  const [unitResult, setUnitResult] = useState('')

  // ── 格式转换 ──
  const [convInput, setConvInput] = useState('')
  const [convOutput, setConvOutput] = useState('')
  const [convFrom, setConvFrom] = useState('csv')
  const [convTo, setConvTo] = useState('json')
  const [convMsg, setConvMsg] = useState('')

  // ── 图片压缩 ──
  const [images, setImages] = useState([])
  const [quality, setQuality] = useState(75)
  const [imgMsg, setImgMsg] = useState('')
  const canvasRef = useRef(null)

  // ── 元数据清理 ──
  const [metaFile, setMetaFile] = useState(null)
  const [metaResult, setMetaResult] = useState(null)
  const [metaMsg, setMetaMsg] = useState('')
  const [metaProcessing, setMetaProcessing] = useState(false)

  // ── 单位换算 ──
  const handleUnitConvert = () => {
    const cat = unitCategories[unitCat]
    if (!cat) return
    const val = Number(unitValue)
    if (isNaN(val)) { setUnitResult('请输入有效数值'); return }
    if (!cat.units[unitFrom] || !cat.units[unitTo]) { setUnitResult('请选择单位'); return }
    const result = val * cat.units[unitFrom] / cat.units[unitTo]
    let resultStr
    if (Math.abs(result) < 0.01 || Math.abs(result) >= 1e6) resultStr = result.toExponential(4)
    else resultStr = result.toPrecision(6)
    setUnitResult(`${val} ${unitFrom} = ${resultStr} ${unitTo}`)
  }

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
      if (convFrom === 'csv' && convTo === 'json') {
        const lines = convInput.trim().split('\n').filter(l => l.trim())
        if (lines.length < 2) throw new Error('CSV至少需要表头+1行数据')
        const headers = lines[0].split(',').map(h => h.trim())
        const data = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim())
          const obj = {}
          headers.forEach((h, i) => { obj[h] = vals[i] || '' })
          return obj
        })
        result = JSON.stringify(data, null, 2)
      } else if (convFrom === 'json' && convTo === 'csv') {
        const arr = JSON.parse(convInput)
        if (!Array.isArray(arr) || arr.length === 0) throw new Error('需要JSON数组格式')
        const headers = Object.keys(arr[0])
        result = headers.join(',') + '\n' + arr.map(item => headers.map(h => item[h] ?? '').join(',')).join('\n')
      } else if (convFrom === 'json' && convTo === 'markdown') {
        const arr = JSON.parse(convInput)
        if (!Array.isArray(arr) || arr.length === 0) throw new Error('需要JSON数组')
        const headers = Object.keys(arr[0])
        result = '| ' + headers.join(' | ') + ' |\n| ' + headers.map(() => '---').join(' | ') + ' |\n'
        result += arr.map(item => '| ' + headers.map(h => item[h] ?? '').join(' | ') + ' |').join('\n')
      } else if (convFrom === 'markdown' && convTo === 'csv') {
        const lines = convInput.trim().split('\n').filter(l => l.trim() && !l.match(/^\|?\s*[-:]+\s*\|/))
        const rows = lines.map(l => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()))
        if (rows.length < 2) throw new Error('Markdown表格至少需要表头+1行')
        result = rows.map(r => r.join(',')).join('\n')
      } else if (convFrom === 'markdown' && convTo === 'json') {
        const lines = convInput.trim().split('\n').filter(l => l.trim() && !l.match(/^\|?\s*[-:]+\s*\|/))
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
        setConvMsg('不支持的转换方向'); return
      }
      setConvOutput(result)
      setConvMsg('转换成功！')
    } catch (e) {
      setConvMsg('转换失败：' + e.message)
      setConvOutput('')
    }
  }

  // ── 图片压缩 ──
  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files)
    const readers = files.map(file => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (evt) => resolve({ name: file.name, size: file.size, src: evt.target.result, file })
      reader.readAsDataURL(file)
    }))
    Promise.all(readers).then(results => setImages(results))
    setImgMsg('')
  }

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))

  const compressImages = async () => {
    if (images.length === 0) { setImgMsg('请先选择图片'); return }
    setImgMsg('压缩中...')
    try {
      for (const img of images) {
        const image = new window.Image()
        await new Promise((resolve) => { image.onload = resolve; image.src = img.src })
        const canvas = canvasRef.current || document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality / 100))
        const newName = img.name.replace(/\.[^.]+$/, '_compressed.jpg')
        downloadBlob(blob, newName)
      }
      setImgMsg(`压缩完成！质量 ${quality}%`)
    } catch (err) {
      setImgMsg('压缩失败：' + err.message)
    }
  }

  // ── 元数据清理 ──
  const handleMetaFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.endsWith('.docx')) {
      setMetaMsg('请上传 .docx 文件')
      return
    }
    setMetaFile(f)
    setMetaResult(null)
    setMetaMsg('')
  }

  const cleanMetadata = async () => {
    if (!metaFile) return
    setMetaProcessing(true)
    setMetaMsg('分析元数据...')
    try {
      const arrayBuffer = await metaFile.arrayBuffer()
      const zip = await JSZip.loadAsync(arrayBuffer)

      // 读取核心属性和扩展属性
      const coreXml = await zip.file('docProps/core.xml')?.async('string')
      const appXml = await zip.file('docProps/app.xml')?.async('string')

      const extractTag = (xml, tag) => {
        if (!xml) return null
        const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`))
        return m ? m[1] : null
      }

      const meta = {
        creator: extractTag(coreXml, 'dc:creator') || extractTag(coreXml, 'creator'),
        lastModifiedBy: extractTag(coreXml, 'cp:lastModifiedBy') || extractTag(coreXml, 'lastModifiedBy'),
        created: extractTag(coreXml, 'dcterms:created') || extractTag(coreXml, 'created'),
        modified: extractTag(coreXml, 'dcterms:modified') || extractTag(coreXml, 'modified'),
        title: extractTag(coreXml, 'dc:title') || extractTag(coreXml, 'title'),
        description: extractTag(coreXml, 'dc:description'),
        company: extractTag(appXml, 'Company'),
        totalTime: extractTag(appXml, 'TotalTime'),
        revision: extractTag(coreXml, 'cp:revision') || extractTag(coreXml, 'revision'),
      }

      // 清除元数据
      if (coreXml) {
        let cleanedCore = coreXml
        const tagsToClean = ['dc:creator', 'cp:lastModifiedBy', 'dc:title', 'dc:description', 'dc:subject', 'cp:revision', 'dcterms:created', 'dcterms:modified']
        tagsToClean.forEach(tag => {
          cleanedCore = cleanedCore.replace(new RegExp(`<${tag}[^>]*>[^<]*<\\/${tag}>`, 'g'), `<${tag}></${tag}>`)
        })
        zip.file('docProps/core.xml', cleanedCore)
      }
      if (appXml) {
        let cleanedApp = appXml
        const appTags = ['Company', 'Manager', 'TotalTime']
        appTags.forEach(tag => {
          cleanedApp = cleanedApp.replace(new RegExp(`<${tag}[^>]*>[^<]*<\\/${tag}>`, 'g'), `<${tag}></${tag}>`)
        })
        zip.file('docProps/app.xml', cleanedApp)
      }

      // 下载清理后的文件
      const cleanedBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      downloadBlob(cleanedBlob, metaFile.name.replace('.docx', '_已清理.docx'))
      setMetaResult(meta)
      setMetaMsg('清理完成！已下载去除个人信息的文档')
    } catch (err) {
      setMetaMsg('清理失败：' + err.message)
    }
    setMetaProcessing(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">科研工具箱</h2>
      <p className="text-gray-500 text-sm mb-6">单位换算 · 格式互转 · 图片压缩 · 元数据清理</p>

      <canvas ref={canvasRef} className="hidden" />

      {/* Sub-tool tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {subTools.map(tool => (
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

      {/* ── 单位换算 ── */}
      {active === 'unit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(unitCategories).map(([k, v]) => (
              <button key={k} onClick={() => switchUnitCat(k)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  unitCat === k ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {v.name}
              </button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-700">
            {unitCategories[unitCat].name}：{unitCategories[unitCat].desc}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">输入数值</label>
                <div className="flex items-center gap-3">
                  <input type="text" value={unitValue} onChange={e => setUnitValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUnitConvert()}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm flex-1 font-mono focus:border-blue-400 outline-none"
                    placeholder="输入数值" />
                  <select value={unitFrom} onChange={e => setUnitFrom(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 min-w-[160px]">
                    {Object.keys(unitCategories[unitCat].units).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-center"><span className="text-gray-300 text-xl">=</span></div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">转换为</label>
                <div className="flex items-center gap-3">
                  <select value={unitTo} onChange={e => setUnitTo(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 min-w-[160px]">
                    {Object.keys(unitCategories[unitCat].units).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button onClick={handleUnitConvert} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    换算</button>
                </div>
              </div>
            </div>
            {unitResult && (
              <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm font-mono font-medium text-green-800">{unitResult}</span>
                <button onClick={() => copyText(unitResult)} className="flex items-center gap-1 px-3 py-1 text-xs text-green-600 hover:bg-green-100 rounded-lg">
                  <Copy size={12} /> 复制
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 格式互转 ── */}
      {active === 'convert' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <select value={convFrom} onChange={e => setConvFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                <option value="csv">CSV</option><option value="json">JSON</option><option value="markdown">Markdown表格</option>
              </select>
              <span className="text-gray-400 text-sm">→</span>
              <select value={convTo} onChange={e => setConvTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                <option value="json">JSON</option><option value="csv">CSV</option><option value="markdown">Markdown表格</option>
              </select>
              <button onClick={handleConvert} className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                <RefreshCw size={14} /> 转换
              </button>
            </div>
            <textarea value={convInput} onChange={e => setConvInput(e.target.value)}
              className="w-full h-60 border border-gray-200 rounded-lg p-3 text-sm font-mono resize-none"
              placeholder={convFrom === 'csv' ? '名称,数值\n样本A,1.5\n样本B,2.3' : convFrom === 'json' ? '[{"名称":"样本A","数值":1.5}]' : '| 名称 | 数值 |\n| --- | --- |\n| 样本A | 1.5 |'} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">输出结果</span>
              {convOutput && <button onClick={() => copyText(convOutput)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"><Copy size={12} /> 复制</button>}
            </div>
            <textarea readOnly value={convOutput} className="w-full h-60 border border-gray-200 rounded-lg p-3 text-sm font-mono resize-none bg-gray-50" placeholder="转换结果..." />
            {convMsg && <p className={`mt-2 text-xs ${convMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{convMsg}</p>}
          </div>
        </div>
      )}

      {/* ── 图片压缩 ── */}
      {active === 'image' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Image size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 mb-2 font-medium">批量压缩图片</p>
            <p className="text-gray-400 text-sm mb-4">纯本地处理，支持批量选择多张图片</p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
              <Upload size={16} /> 选择图片
              <input type="file" accept="image/*" multiple onChange={handleImageFiles} className="hidden" />
            </label>
          </div>

          {images.length > 0 && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="text-sm text-gray-600 mb-2 block">压缩质量: {quality}%</label>
                <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">已选择 {images.length} 张图片</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img.src} alt={img.name} className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
                      <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={compressImages} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium">
                <Download size={18} /> 压缩并下载
              </button>
            </>
          )}

          {imgMsg && (
            <div className={`text-sm text-center p-3 rounded-lg ${
              imgMsg.includes('完成') ? 'bg-green-50 text-green-700' : imgMsg.includes('失败') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>{imgMsg}</div>
          )}
        </div>
      )}

      {/* ── 元数据清理 ── */}
      {active === 'metadata' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            {!metaFile ? (
              <>
                <ShieldCheck size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 mb-2 font-medium">上传 .docx 清除元数据</p>
                <p className="text-gray-400 text-sm mb-4">清除作者、公司、修改时间、编辑时长等隐私信息</p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
                  <Upload size={16} /> 选择 .docx
                  <input type="file" accept=".docx" onChange={handleMetaFile} className="hidden" />
                </label>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-medium text-gray-800">{metaFile.name}</span>
                  <button onClick={() => { setMetaFile(null); setMetaResult(null); setMetaMsg('') }}
                    className="text-xs text-gray-400 hover:text-red-500">重新选择</button>
                </div>
                {!metaProcessing && (
                  <button onClick={cleanMetadata} className="mt-4 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    清除元数据并下载
                  </button>
                )}
                {metaProcessing && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    {metaMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          {metaResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm font-medium text-gray-700 mb-3">发现以下元数据（已清除）：</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(metaResult).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-500">{k}:</span>
                    <span className="text-gray-800 font-mono truncate ml-2">{v || '(空)'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {metaMsg && !metaProcessing && (
            <div className={`text-sm text-center p-3 rounded-lg ${metaMsg.includes('完成') ? 'bg-green-50 text-green-700' : metaMsg.includes('失败') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {metaMsg}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700">
            <strong>会清除什么？</strong> 作者名、最后修改者、公司信息、编辑总时长、创建/修改时间、标题、描述等 Word 文档中嵌入的个人信息。原始文件不会被修改，会下载一份清理后的副本。
          </div>
        </div>
      )}

      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
        <p className="text-xs text-gray-500">所有工具均在浏览器本地运行，文件不会上传到任何服务器。</p>
      </div>
    </div>
  )
}
