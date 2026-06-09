import { useState, useRef, useMemo } from 'react'
import {
  Upload, Download, BarChart3, Settings, X, Palette, FileCode2, Copy, AlertTriangle,
  ChevronDown, ChevronRight, Table2, Calculator, RotateCcw, BarChartHorizontal,
  TrendingUp, Plus, Layers, Image
} from 'lucide-react'
import * as XLSX from 'xlsx'
import ReactECharts from 'echarts-for-react'
import { copyText } from '../utils'

// ── 图表类型 ──
const chartTypes = [
  { id: 'bar', label: '柱状图', desc: '数据对比' },
  { id: 'line', label: '折线图', desc: '趋势变化' },
  { id: 'area', label: '面积图', desc: '累积趋势' },
  { id: 'scatter', label: '散点图', desc: '相关关系' },
  { id: 'pie', label: '饼图', desc: '占比分布' },
  { id: 'radar', label: '雷达图', desc: '多维对比' },
  { id: 'combo', label: '组合图', desc: '柱+折线' },
  { id: 'stackbar', label: '堆叠柱', desc: '堆叠对比' },
  { id: 'funnel', label: '漏斗图', desc: '转化分析' },
  { id: 'boxplot', label: '箱线图', desc: '分布统计' },
  { id: 'heatmap', label: '热力图', desc: '矩阵密度' },
]

// ── 配色方案 ──
const colorPresets = {
  '学术蓝': ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb', '#1d4ed8', '#1e40af', '#3b82f6'],
  '学术红': ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#dc2626', '#b91c1c', '#7f1d1d', '#ef4444'],
  '学术绿': ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857', '#064e3b', '#10b981'],
  '暖色调': ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#f59e0b', '#d97706', '#ea580c', '#c2410c'],
  '冷色调': ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#6366f1', '#818cf8', '#0891b2', '#0e7490'],
  '莫兰迪': ['#8b7e74', '#b5a99a', '#d4c5b9', '#7d9d9c', '#9ab8b3', '#6b7b8d', '#8d9dad', '#a4b4c4'],
  '对比色': ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  '深色系': ['#1e293b', '#334155', '#475569', '#64748b', '#0f172a', '#1e293b', '#334155', '#475569'],
  '自然色': ['#228b22', '#32cd32', '#98fb98', '#556b2f', '#8fbc8f', '#6b8e23', '#2e8b57', '#3cb371'],
  '渐变蓝': ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8', '#1e40af'],
  '专业灰': ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#1f2937', '#111827', '#374151'],
}

const customColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#14b8a6', '#6366f1', '#d946ef', '#0ea5e9', '#e11d48', '#22c55e', '#a855f7',
  '#64748b', '#1e293b', '#dc2626', '#2563eb', '#7c3aed', '#db2777', '#0891b2', '#ca8a04',
]

// ── 统计计算 ──
function computeStats(values) {
  const nums = values.map(v => parseFloat(v)).filter(v => !isNaN(v))
  if (nums.length === 0) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const n = sorted.length
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / n
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)
  const q1idx = Math.floor(n * 0.25)
  const q3idx = Math.floor(n * 0.75)
  return {
    count: n, sum, mean, median: n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)],
    std, variance, min: sorted[0], max: sorted[n - 1],
    q1: sorted[q1idx], q3: sorted[q3idx],
  }
}

// ── 线性回归 ──
function linearRegression(xs, ys) {
  const xn = xs.map(Number).filter(v => !isNaN(v))
  const yn = ys.map(Number).filter(v => !isNaN(v))
  if (xn.length < 2 || yn.length < 2) return null
  const n = Math.min(xn.length, yn.length)
  let sx = 0, sy = 0, sxy = 0, sx2 = 0
  for (let i = 0; i < n; i++) {
    sx += xn[i]; sy += yn[i]; sxy += xn[i] * yn[i]; sx2 += xn[i] * xn[i]
  }
  const denom = n * sx2 - sx * sx
  if (denom === 0) return null
  const slope = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n
  const minX = Math.min(...xn), maxX = Math.max(...xn)
  return {
    slope, intercept,
    data: [[minX, slope * minX + intercept], [maxX, slope * maxX + intercept]],
    r2: 1 - yn.reduce((s, y, i) => s + (y - (slope * xn[i] + intercept)) ** 2, 0) /
      yn.reduce((s, y) => s + (y - sy / n) ** 2, 0),
  }
}

export default function DataChart() {
  const [data, setData] = useState(null)
  const [headers, setHeaders] = useState([])
  const [error, setError] = useState('')

  const [chartType, setChartType] = useState('bar')
  const [xCol, setXCol] = useState(0)
  const [yCols, setYCols] = useState([1])

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [xLabel, setXLabel] = useState('')
  const [yLabel, setYLabel] = useState('')

  const [colorScheme, setColorScheme] = useState('学术蓝')
  const [seriesColors, setSeriesColors] = useState({})
  const [bgColor, setBgColor] = useState('#ffffff')
  const [fontSize, setFontSize] = useState(12)

  // 柱状图
  const [barWidth, setBarWidth] = useState(60)
  const [barGap, setBarGap] = useState(30)
  const [barRadius, setBarRadius] = useState([4, 4, 0, 0])
  const [barHorizontal, setBarHorizontal] = useState(false)
  const [barStack, setBarStack] = useState(false)

  // 折线/面积图
  const [lineWidth, setLineWidth] = useState(2)
  const [lineSmooth, setLineSmooth] = useState(true)
  const [symbolSize, setSymbolSize] = useState(6)
  const [areaOpacity, setAreaOpacity] = useState(25)

  // 饼图
  const [pieInnerRadius, setPieInnerRadius] = useState(45)
  const [pieOuterRadius, setPieOuterRadius] = useState(72)
  const [pieShowLabel, setPieShowLabel] = useState(true)
  const [pieRose, setPieRose] = useState(false)

  // 散点图
  const [scatterSize, setScatterSize] = useState(10)

  // ── 新增 ──
  const [showTrendline, setShowTrendline] = useState(false)
  const [showErrorBar, setShowErrorBar] = useState(false)
  const [errorBarCol, setErrorBarCol] = useState(-1)
  const [dualAxis, setDualAxis] = useState(false)
  const [dualYCols, setDualYCols] = useState([])
  const [yMin, setYMin] = useState('')
  const [yMax, setYMax] = useState('')
  const [xMin, setXMin] = useState('')
  const [xMax, setXMax] = useState('')
  const [gridStyle, setGridStyle] = useState('dashed')
  const [chartWidth, setChartWidth] = useState(undefined)
  const [chartHeight, setChartHeight] = useState(460)
  const [borderWidth, setBorderWidth] = useState(0)
  const [borderColor, setBorderColor] = useState('#e5e7eb')
  const [shadow, setShadow] = useState(false)

  // 坐标轴
  const [showGrid, setShowGrid] = useState(true)
  const [xRotate, setXRotate] = useState(0)

  // 数据标签
  const [showDataLabel, setShowDataLabel] = useState(false)
  const [labelPosition, setLabelPosition] = useState('top')

  // 图例
  const [showLegend, setShowLegend] = useState(true)
  const [legendPos, setLegendPos] = useState('bottom')

  // UI
  const [showSettings, setShowSettings] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [expandedSection, setExpandedSection] = useState('basic')
  const [activeTab, setActiveTab] = useState('preview')
  const [copied, setCopied] = useState('')
  const chartRef = useRef(null)

  // ── 解析上传文件 ──
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError('')

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const text = evt.target.result
          const lines = text.split('\n').filter(l => l.trim())
          if (lines.length === 0) { setError('文件为空'); return }
          const json = lines.map(line => {
            const result = [], len = line.length
            let current = '', inQuotes = false
            for (let i = 0; i < len; i++) {
              const ch = line[i]
              if (ch === '"') { inQuotes = !inQuotes }
              else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
              else { current += ch }
            }
            result.push(current.trim())
            return result
          })
          processData(json, file.name)
        } catch (err) { setError('CSV 解析失败：' + err.message) }
      }
      reader.readAsText(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 })
        processData(json, file.name)
      } catch (err) { setError('文件解析失败，请确认是有效的 Excel 或 CSV 文件') }
    }
    reader.readAsBinaryString(file)
  }

  const processData = (json, fileName) => {
    if (!json || json.length === 0) { setError('文件中没有数据'); return }
    const h = json[0].map((h, i) => (h !== undefined && h !== null ? String(h) : `列${i + 1}`))
    if (json.length < 2) { setError('数据至少需要1行（含表头）'); setHeaders(h); setData([]); return }
    setHeaders(h)
    const rows = json.slice(1).filter(r => r.some(c => c !== undefined && c !== null && c !== ''))
    setData(rows)
    setXCol(0)
    setYCols(h.length > 1 ? [1] : [0])
    setDualYCols([])
    setTitle(fileName.replace(/\.[^.]+$/, ''))
    setXLabel(h[0] || '')
    setYLabel(h.length > 1 ? h[1] : '')
    setSeriesColors({})
    setError('')
    setErrorBarCol(-1)
  }

  const toggleYCol = (i) => {
    setYCols(prev => {
      const next = prev.includes(i) ? prev.filter(v => v !== i) : [...prev, i]
      setDualYCols(old => old.filter(c => next.includes(c)))
      return next
    })
  }

  const toggleDual = (i) => {
    setDualYCols(prev => prev.includes(i) ? prev.filter(v => v !== i) : [...prev, i])
  }

  const getSeriesColor = (colIndex, fallbackIndex) => {
    if (seriesColors[colIndex]) return seriesColors[colIndex]
    const preset = colorPresets[colorScheme] || colorPresets['学术蓝']
    return preset[fallbackIndex % preset.length]
  }

  // ── 构建 ECharts Option ──
  const option = useMemo(() => {
    if (!data || headers.length === 0) return null
    const xData = data.map(r => String(r[xCol] ?? ''))
    const textStyle = { fontSize }

    const baseOption = {
      backgroundColor: bgColor,
      title: title ? {
        text: title,
        subtext: subtitle || '',
        left: 'center',
        textStyle: { fontSize: fontSize + 4, fontWeight: 600, color: '#1f2937' },
        subtextStyle: { fontSize: fontSize - 1, color: '#9ca3af' },
        padding: [8, 0, 4, 0],
      } : undefined,
      tooltip: { trigger: chartType === 'pie' || chartType === 'radar' ? 'item' : 'axis' },
      animation: true,
      animationDuration: 600,
    }

    if (showLegend && chartType !== 'radar') {
      const orient = legendPos === 'left' || legendPos === 'right' ? 'vertical' : 'horizontal'
      baseOption.legend = {
        type: 'scroll',
        [legendPos]: 0,
        orient,
        textStyle: { fontSize, color: '#4b5563' },
        icon: 'roundRect',
        itemWidth: 12, itemHeight: 12,
      }
    }

    const makeGrid = (extraTop = 0) => {
      const gridOpt = {
        left: yLabel ? '14%' : '8%',
        right: dualAxis ? '16%' : '6%',
        bottom: xLabel ? '15%' : '10%',
        top: title ? 70 + extraTop : (subtitle ? 50 : 30) + extraTop,
        containLabel: true,
      }
      if (borderWidth > 0) {
        gridOpt.borderWidth = borderWidth
        gridOpt.borderColor = borderColor
      }
      if (shadow) {
        gridOpt.shadowBlur = 8
        gridOpt.shadowColor = 'rgba(0,0,0,0.08)'
        gridOpt.shadowOffsetX = 0
        gridOpt.shadowOffsetY = 2
      }
      return gridOpt
    }

    const makeLabel = (position) => showDataLabel ? {
      show: true,
      position: position || labelPosition,
      fontSize: fontSize - 2,
      color: '#374151',
      formatter: chartType === 'pie' ? '{b}: {d}%' : '{c}',
    } : { show: false }

    const gridLineStyle = {
      color: gridStyle === 'none' ? 'transparent' : gridStyle === 'dotted' ? '#e5e7eb' : '#f3f4f6',
      type: gridStyle === 'dotted' ? 'dotted' : gridStyle === 'solid' ? 'solid' : 'dashed',
    }

    const getAxisRange = (isY) => {
      const min = isY ? yMin : xMin
      const max = isY ? yMax : xMax
      const range = {}
      if (min !== '' && !isNaN(Number(min))) range.min = Number(min)
      if (max !== '' && !isNaN(Number(max))) range.max = Number(max)
      return range
    }

    const xAxisBase = {
      type: barHorizontal ? 'value' : 'category',
      data: barHorizontal ? undefined : xData,
      name: barHorizontal ? yLabel : xLabel,
      nameTextStyle: { fontSize, color: '#6b7280' },
      axisLabel: {
        rotate: barHorizontal ? 0 : xRotate,
        fontSize,
        color: '#6b7280',
      },
      splitLine: showGrid ? { lineStyle: gridLineStyle } : { show: false },
      ...getAxisRange(false),
    }

    const yAxisBase = {
      type: barHorizontal ? 'category' : 'value',
      data: barHorizontal ? xData : undefined,
      name: barHorizontal ? xLabel : yLabel,
      nameTextStyle: { fontSize, color: '#6b7280' },
      axisLabel: { fontSize, color: '#6b7280' },
      splitLine: showGrid ? { lineStyle: gridLineStyle } : { show: false },
      ...getAxisRange(true),
    }

    const makeNewSeries = (type, col, seriesIndex) => {
      const s = {
        name: headers[col],
        type,
        yAxisIndex: dualAxis && dualYCols.includes(col) ? 1 : 0,
        color: getSeriesColor(col, seriesIndex),
      }

      if (type === 'bar' || type === 'line' || type === 'scatter') {
        if (type === 'scatter') {
          s.data = data.map(r => [parseFloat(r[xCol]) || 0, parseFloat(r[col]) || 0])
        } else {
          s.data = data.map(r => parseFloat(r[col]) || 0)
        }
      }

      if (type === 'bar') {
        s.barWidth = `${barWidth}%`
        s.barGap = !barStack ? `${barGap}%` : undefined
        s.barCategoryGap = `${Math.max(10, 100 - barWidth)}%`
        s.itemStyle = { borderRadius: barRadius, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }
        s.label = makeLabel('top')
        s.stack = barStack ? 'total' : undefined
      }

      if (type === 'line') {
        s.smooth = lineSmooth
        s.lineStyle = { width: lineWidth }
        s.symbol = symbolSize > 0 ? 'circle' : 'none'
        s.symbolSize = symbolSize > 0 ? symbolSize : 0
        s.label = makeLabel('top')
      }

      if (type === 'scatter') {
        s.symbolSize = scatterSize
        s.label = makeLabel('right')
      }

      // Error bars
      if (showErrorBar && errorBarCol >= 0 && errorBarCol < headers.length) {
        if (type === 'bar' || type === 'line') {
          s.markLine = {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'solid', width: 1.5, color: '#94a3b8' },
            data: data.map((r, ri) => {
              const val = parseFloat(r[col]) || 0
              const err = parseFloat(r[errorBarCol]) || 0
              if (err === 0) return null
              return [
                { xAxis: ri, yAxis: val - err },
                { xAxis: ri, yAxis: val + err },
              ]
            }).filter(Boolean),
          }
        }
      }

      return s
    }

    switch (chartType) {
      case 'bar':
      case 'stackbar': {
        const stacked = chartType === 'stackbar' ? true : barStack
        const series = yCols.map((col, i) => ({
          ...makeNewSeries('bar', col, i),
          stack: stacked ? 'total' : undefined,
        }))

        const xAxis = { ...xAxisBase }
        const yAxis = { ...yAxisBase }

        if (barHorizontal) {
          xAxis.splitLine = showGrid ? { lineStyle: gridLineStyle } : { show: false }
        }

        const yAxes = [yAxis]
        if (dualAxis && dualYCols.length > 0) {
          yAxes.push({ ...yAxis, name: '' })
        }

        return { ...baseOption, grid: makeGrid(), xAxis, yAxis: yAxes.length === 1 ? yAxis : yAxes, series }

        // Add trendline for bar
        if (showTrendline && series.length > 0) {
          const col = yCols[0]
          const ys = data.map(r => parseFloat(r[col]) || 0)
          const xs = data.map((_, i) => i)
          const reg = linearRegression(xs, ys)
          if (reg) {
            series.push({
              name: '趋势线',
              type: 'line',
              data: reg.data.map(([x, y]) => [x, y]),
              xAxisIndex: 0, yAxisIndex: 0,
              lineStyle: { type: 'dashed', width: 1.5, color: '#ef4444' },
              symbol: 'none',
              silent: true,
              z: 10,
            })
          }
        }
        return { ...baseOption, grid: makeGrid(), xAxis, yAxis: yAxes.length === 1 ? yAxis : yAxes, series }
      }

      case 'line': {
        const series = yCols.map((col, i) => makeNewSeries('line', col, i))
        const yAxes = [yAxisBase]
        if (dualAxis && dualYCols.length > 0) yAxes.push({ ...yAxisBase, name: '' })
        return { ...baseOption, grid: makeGrid(), xAxis: xAxisBase, yAxis: yAxes.length === 1 ? yAxisBase : yAxes, series }
      }

      case 'area':
        return {
          ...baseOption,
          grid: makeGrid(),
          xAxis: { ...xAxisBase, boundaryGap: false },
          yAxis: yAxisBase,
          series: yCols.map((col, i) => ({
            name: headers[col],
            type: 'line',
            data: data.map(r => parseFloat(r[col]) || 0),
            smooth: lineSmooth,
            lineStyle: { width: lineWidth, color: getSeriesColor(col, i) },
            symbol: symbolSize > 0 ? 'circle' : 'none',
            symbolSize: symbolSize > 0 ? symbolSize : 0,
            areaStyle: { color: getSeriesColor(col, i), opacity: areaOpacity / 100 },
            stack: 'total',
            label: makeLabel('top'),
          })),
        }

      case 'scatter': {
        const series = yCols.map((col, i) => makeNewSeries('scatter', col, i))

        // Trendline
        if (showTrendline && series.length > 0) {
          const col = yCols[0]
          const xs = data.map(r => parseFloat(r[xCol]) || 0)
          const ys = data.map(r => parseFloat(r[col]) || 0)
          const reg = linearRegression(xs, ys)
          if (reg) {
            series.push({
              name: `趋势线 (R²=${reg.r2.toFixed(3)})`,
              type: 'line',
              data: reg.data,
              lineStyle: { type: 'dashed', width: 2, color: '#ef4444' },
              symbol: 'none',
              silent: true,
              z: 10,
            })
          }
        }

        return {
          ...baseOption,
          grid: makeGrid(),
          xAxis: { ...xAxisBase, type: 'value', data: undefined, name: xLabel || headers[xCol] },
          yAxis: { ...yAxisBase, type: 'value', data: undefined, name: yLabel },
          series,
        }
      }

      case 'pie':
        return {
          backgroundColor: bgColor,
          title: title ? {
            text: title,
            subtext: subtitle || '',
            left: 'center',
            textStyle: { fontSize: fontSize + 4, fontWeight: 600, color: '#1f2937' },
            subtextStyle: { fontSize: fontSize - 1, color: '#9ca3af' },
          } : undefined,
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          legend: showLegend ? {
            orient: legendPos === 'left' || legendPos === 'right' ? 'vertical' : 'horizontal',
            [legendPos]: 0,
            type: 'scroll',
            textStyle: { fontSize, color: '#4b5563' },
          } : undefined,
          series: [{
            type: 'pie',
            radius: [`${pieInnerRadius}%`, `${pieOuterRadius}%`],
            roseType: pieRose ? 'radius' : undefined,
            center: showLegend && (legendPos === 'left' || legendPos === 'right') ? ['58%', '55%'] : ['50%', '55%'],
            data: data.map((r, i) => ({
              name: String(r[xCol] ?? ''),
              value: parseFloat(r[yCols[0] || 0]) || 0,
              itemStyle: { color: getSeriesColor(i, i), borderWidth: 2, borderColor: bgColor },
            })),
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' }, scaleSize: 8 },
            label: {
              show: pieShowLabel,
              formatter: '{b}: {d}%',
              fontSize: fontSize - 2,
              color: '#374151',
            },
            labelLine: pieShowLabel ? { length: 15, length2: 10 } : { show: false },
          }],
        }

      case 'radar': {
        const indicator = data.map(r => ({
          name: String(r[xCol] ?? ''),
          max: yCols.reduce((acc, c) => Math.max(acc, Math.max(...data.map(rr => parseFloat(rr[c]) || 0)) * 1.3), 0),
        }))
        return {
          ...baseOption,
          tooltip: {},
          radar: {
            indicator,
            center: ['50%', '55%'],
            radius: '65%',
            axisName: { fontSize: fontSize - 1, color: '#4b5563' },
            splitArea: { areaStyle: { color: ['rgba(59,130,246,0.02)', 'rgba(59,130,246,0.04)'] } },
          },
          series: yCols.map((col, i) => ({
            type: 'radar',
            name: headers[col],
            data: [{ value: data.map(r => parseFloat(r[col]) || 0), name: headers[col] }],
            color: getSeriesColor(col, i),
            areaStyle: { opacity: 0.15 },
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: { width: lineWidth },
          })),
        }
      }

      case 'combo': {
        const series = yCols.map((col, i) => {
          const useLine = dualAxis && dualYCols.includes(col)
          return makeNewSeries(useLine ? 'line' : 'bar', col, i)
        })

        const xAxis = { ...xAxisBase }
        const yAxis1 = { ...yAxisBase }
        const yAxes = [yAxis1]
        if (dualAxis && dualYCols.length > 0) yAxes.push({ ...yAxisBase, name: '' })

        return { ...baseOption, grid: makeGrid(), xAxis, yAxis: yAxes.length === 1 ? yAxis1 : yAxes, series }
      }

      case 'funnel': {
        const funnelData = data.map((r, i) => ({
          name: String(r[xCol] ?? ''),
          value: parseFloat(r[yCols[0] || 0]) || 0,
          itemStyle: { color: getSeriesColor(i, i), borderWidth: 1, borderColor: bgColor },
        })).filter(d => d.value > 0).sort((a, b) => b.value - a.value)

        return {
          backgroundColor: bgColor,
          title: title ? { text: title, subtext: subtitle || '', left: 'center', textStyle: { fontSize: fontSize + 4, fontWeight: 600, color: '#1f2937' }, subtextStyle: { fontSize: fontSize - 1, color: '#9ca3af' } } : undefined,
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          series: [{
            type: 'funnel',
            left: '15%', right: '15%', top: title ? 70 : 40, bottom: 40,
            minSize: '15%', maxSize: '100%',
            sort: 'descending',
            gap: 3,
            data: funnelData,
            label: { show: true, position: 'inside', formatter: '{b}\n{c}', fontSize: fontSize - 2, color: '#fff' },
            labelLine: { show: false },
          }],
        }
      }

      case 'boxplot': {
        // 计算箱线图所需数据
        const series = []
        const xAxisData = []
        yCols.forEach((col, ci) => {
          const values = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v))
          if (values.length < 5) return
          const sorted = [...values].sort((a, b) => a - b)
          const n = sorted.length
          const min = sorted[0]
          const q1 = sorted[Math.floor(n * 0.25)]
          const median = sorted[Math.floor(n * 0.5)]
          const q3 = sorted[Math.floor(n * 0.75)]
          const max = sorted[n - 1]
          xAxisData.push(headers[col])
          series.push({
            name: headers[col],
            type: 'boxplot',
            data: [[min, q1, median, q3, max]],
            itemStyle: { color: getSeriesColor(col, ci), borderColor: getSeriesColor(col, ci) },
          })
        })

        return {
          backgroundColor: bgColor,
          title: title ? { text: title, subtext: subtitle || '', left: 'center', textStyle: { fontSize: fontSize + 4, fontWeight: 600, color: '#1f2937' }, subtextStyle: { fontSize: fontSize - 1, color: '#9ca3af' } } : undefined,
          tooltip: { trigger: 'item' },
          grid: { left: '12%', right: '8%', bottom: '12%', top: title ? 70 : 40 },
          xAxis: { type: 'category', data: xAxisData, axisLabel: { fontSize, color: '#6b7280' } },
          yAxis: { type: 'value', name: yLabel, axisLabel: { fontSize, color: '#6b7280' } },
          series,
        }
      }

      case 'heatmap': {
        const hmX = data.map(r => String(r[xCol] ?? ''))
        const hmY = yCols.map(c => headers[c])
        const hmData = []
        let hmMin = Infinity, hmMax = -Infinity
        yCols.forEach((col, yi) => {
          data.forEach((r, xi) => {
            const v = parseFloat(r[col]) || 0
            hmData.push([xi, yi, v])
            if (v < hmMin) hmMin = v
            if (v > hmMax) hmMax = v
          })
        })

        return {
          backgroundColor: bgColor,
          title: title ? { text: title, subtext: subtitle || '', left: 'center', textStyle: { fontSize: fontSize + 4, fontWeight: 600, color: '#1f2937' }, subtextStyle: { fontSize: fontSize - 1, color: '#9ca3af' } } : undefined,
          tooltip: { position: 'top', formatter: (params) => `${hmX[params.value[0]]} · ${hmY[params.value[1]]}<br/>值: ${params.value[2]}` },
          grid: { left: '15%', right: '8%', bottom: '12%', top: title ? 70 : 40 },
          xAxis: { type: 'category', data: hmX, splitArea: { show: true }, axisLabel: { fontSize: fontSize - 2, color: '#6b7280', rotate: xRotate } },
          yAxis: { type: 'category', data: hmY, splitArea: { show: true }, axisLabel: { fontSize: fontSize - 2, color: '#6b7280' } },
          visualMap: { min: hmMin, max: hmMax, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, color: ['#dbeafe', '#3b82f6', '#1e40af'] },
          series: [{ type: 'heatmap', data: hmData, label: { show: true, fontSize: fontSize - 3, color: '#374151' }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } } }],
        }
      }

      default:
        return null
    }
  }, [
    data, headers, chartType, xCol, yCols, title, subtitle, xLabel, yLabel,
    colorScheme, seriesColors, bgColor, fontSize,
    barWidth, barGap, barRadius, barHorizontal, barStack,
    lineWidth, lineSmooth, symbolSize, areaOpacity,
    pieInnerRadius, pieOuterRadius, pieShowLabel, pieRose,
    scatterSize, showGrid, xRotate,
    showDataLabel, labelPosition,
    showLegend, legendPos,
    showTrendline, showErrorBar, errorBarCol,
    dualAxis, dualYCols, yMin, yMax, xMin, xMax,
    gridStyle, borderWidth, borderColor, shadow,
  ])

  // ── 统计数据 ──
  const stats = useMemo(() => {
    if (!data || headers.length === 0) return null
    const result = {}
    headers.forEach((h, i) => {
      const nums = data.map(r => parseFloat(r[i])).filter(v => !isNaN(v))
      if (nums.length > 0) result[h] = computeStats(data.map(r => r[i]))
    })
    return result
  }, [data, headers])

  // ── 趋势线分析 ──
  const trendlineResult = useMemo(() => {
    if (!data || headers.length === 0 || !showTrendline) return null
    const xs = data.map(r => parseFloat(r[xCol]) || 0)
    const col = yCols[0]
    if (col === undefined) return null
    const ys = data.map(r => parseFloat(r[col]) || 0)
    return linearRegression(xs, ys)
  }, [data, headers, xCol, yCols, showTrendline])

  // ── 导出 ──
  const handleDownload = (format) => {
    const instance = chartRef.current?.getEchartsInstance?.()
    if (!instance) return
    const url = instance.getDataURL({ type: format, pixelRatio: 2, backgroundColor: bgColor })
    const a = document.createElement('a')
    a.href = url
    a.download = (title || 'chart') + '.' + format
    a.click()
  }

  const copyOptionCode = () => {
    if (!option) return
    navigator.clipboard.writeText(JSON.stringify(option, null, 2))
    setCopied('code')
    setTimeout(() => setCopied(''), 2000)
  }

  const copyDataAsCSV = () => {
    if (!data || !headers.length) return
    const csv = [headers.join(','), ...data.map(r => r.map(c => c ?? '').join(','))].join('\n')
    navigator.clipboard.writeText(csv)
    setCopied('csv')
    setTimeout(() => setCopied(''), 2000)
  }

  const copyToWord = () => {
    const instance = chartRef.current?.getEchartsInstance?.()
    if (!instance) return
    const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: bgColor })
    const img = new window.Image()
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          setCopied('word')
          setTimeout(() => setCopied(''), 2000)
        } catch { handleDownload('png') }
      }, 'image/png')
    }
    img.src = url
  }

  const Section = ({ id, icon, label, children }) => (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? '' : id)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
      >
        <span className="text-gray-500">{icon}</span>
        {label}
        <span className="ml-auto text-gray-400">
          {expandedSection === id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {expandedSection === id && (
        <div className="p-3 bg-white space-y-3">{children}</div>
      )}
    </div>
  )

  const Input = ({ label, value, onChange, type = 'text', placeholder, min, max, step, className = '' }) => (
    <div className={className}>
      <label className="text-[11px] text-gray-500 mb-1 block font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        min={min} max={max} step={step}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
      />
    </div>
  )

  const Toggle = ({ label, value, onChange }) => (
    <label className="flex items-center justify-between py-1.5 cursor-pointer">
      <span className="text-xs text-gray-600">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors relative ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow ${value ? 'left-4' : 'left-0.5'}`} />
      </button>
    </label>
  )

  const RadioGroup = ({ label, options, value, onChange }) => (
    <div>
      <label className="text-[11px] text-gray-500 mb-1 block font-medium">{label}</label>
      <div className="flex gap-1 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              value === opt.value ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">数据出图</h2>
      <p className="text-gray-500 text-sm mb-6">
        上传 Excel/CSV，11种图表类型 · 30+项自定义设置 · 误差线 · 趋势线 · 双Y轴 · 对标 Word 图表功能 · 直接复制到Word
      </p>

      {!data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-2 font-medium">上传数据文件开始制图</p>
          <p className="text-gray-400 text-sm mb-6">支持 .xlsx .xls .csv 格式</p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-colors font-medium">
            <Upload size={18} /> 上传数据文件
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          </label>
          <p className="text-xs text-gray-400 mt-4">格式：第1列=标签/名称，第2列及之后=数值数据</p>
          {error && (
            <div className="mt-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center justify-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-1.5 sticky top-0 z-10 shadow-sm">
            {chartTypes.map(ct => (
              <button
                key={ct.id}
                onClick={() => setChartType(ct.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  chartType === ct.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={ct.desc}
              >
                {ct.label}
              </button>
            ))}
            <div className="flex-1 min-w-[8px]" />
            <button onClick={() => { setShowColors(!showColors); if (!showColors) setShowSettings(false) }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${showColors ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Palette size={12} /> 配色
            </button>
            <button onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${showSettings ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Settings size={12} /> 设置
            </button>
            <button onClick={() => setShowCode(!showCode)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${showCode ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <FileCode2 size={12} /> JSON
            </button>
            <span className="w-px h-5 bg-gray-200 mx-1" />
            <button onClick={copyToWord} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 font-medium">
              <Copy size={12} /> {copied === 'word' ? '已复制' : '复制到Word'}
            </button>
            <button onClick={() => handleDownload('png')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 font-medium">
              <Download size={12} /> PNG
            </button>
            <button onClick={() => handleDownload('svg')} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 font-medium">
              <Download size={12} /> SVG
            </button>
            <label className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 cursor-pointer font-medium">
              <Upload size={12} /> 换文件
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            </label>
          </div>

          {/* Color panel */}
          {showColors && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">配色方案</span>
                <button onClick={() => setShowColors(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
                {Object.entries(colorPresets).map(([name, cols]) => (
                  <button
                    key={name}
                    onClick={() => { setColorScheme(name); setSeriesColors({}) }}
                    className={`p-2.5 rounded-xl border-2 transition-all ${colorScheme === name ? 'border-blue-500 shadow-md bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex gap-0.5 mb-1.5">
                      {cols.slice(0, 5).map((c, i) => (
                        <div key={i} className="w-full h-3 rounded-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-gray-700">{name}</span>
                  </button>
                ))}
              </div>

              {yCols.length > 0 && (
                <>
                  <div className="text-xs font-medium text-gray-600 mb-2">单独设置各系列颜色</div>
                  <div className="flex flex-wrap gap-3">
                    {yCols.map((col, idx) => (
                      <div key={col} className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500 w-24 truncate">{headers[col]}</span>
                        <div className="flex gap-0.5 flex-wrap">
                          {customColors.slice(0, 12).map(c => (
                            <button
                              key={c}
                              onClick={() => setSeriesColors(prev => ({ ...prev, [col]: c }))}
                              className={`w-5 h-5 rounded border-2 transition-all ${(seriesColors[col] || getSeriesColor(col, idx)) === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                        {seriesColors[col] && (
                          <button onClick={() => { const n = { ...seriesColors }; delete n[col]; setSeriesColors(n) }} className="text-gray-400 hover:text-red-500">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Settings panel */}
          {showSettings && (
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-800">图表设置（30+项可调）</span>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
              </div>

              <Section id="basic" icon="📊" label="基础信息">
                <Input label="图表标题" value={title} onChange={setTitle} placeholder="图表标题" className="col-span-2" />
                <Input label="副标题" value={subtitle} onChange={setSubtitle} placeholder="可选副标题" className="col-span-2" />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="X 轴标签" value={xLabel} onChange={setXLabel} />
                  <Input label="Y 轴标签" value={yLabel} onChange={setYLabel} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">X 轴数据列</label>
                  <select value={xCol} onChange={e => setXCol(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white">
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Y 轴数据列（多选）</label>
                  <div className="flex flex-wrap gap-1.5">
                    {headers.map((h, i) => (
                      <button key={i} onClick={() => toggleYCol(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${yCols.includes(i) ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
                <Input label="字体大小" value={fontSize} onChange={setFontSize} type="number" min={8} max={20} step={1} />
              </Section>

              <Section id="style" icon="🎨" label="图表外观">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">背景颜色</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                      <input value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono" />
                      <button onClick={() => setBgColor('#ffffff')} className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1 bg-gray-100 rounded-lg">默认</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">网格线样式</label>
                    <RadioGroup value={gridStyle} onChange={setGridStyle} label="" options={[
                      { value: 'dashed', label: '虚线' }, { value: 'solid', label: '实线' }, { value: 'dotted', label: '点线' }, { value: 'none', label: '无' },
                    ]} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="边框宽度 (px)" value={borderWidth} onChange={setBorderWidth} type="number" min={0} max={10} step={1} />
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">边框颜色</label>
                    <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border border-gray-200" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Toggle label="阴影效果" value={shadow} onChange={setShadow} />
                </div>
              </Section>

              {/* 柱状图 */}
              {(chartType === 'bar' || chartType === 'stackbar' || chartType === 'combo') && (
                <Section id="barOpts" icon={<BarChart3 size={12} />} label="柱状图设置">
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="柱子宽度 (%)" value={barWidth} onChange={setBarWidth} type="number" min={10} max={100} step={5} />
                    <Input label="柱子间距 (%)" value={barGap} onChange={setBarGap} type="number" min={0} max={200} step={5} />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['左上', '右上', '右下', '左下'].map((name, i) => (
                      <Input key={i} label={`${name}圆角`} value={barRadius[i]} onChange={v => { const n = [...barRadius]; n[i] = Number(v); setBarRadius(n) }} type="number" min={0} max={20} step={1} />
                    ))}
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <Toggle label="水平柱状图" value={barHorizontal} onChange={setBarHorizontal} />
                    {chartType !== 'stackbar' && <Toggle label="堆叠模式" value={barStack} onChange={setBarStack} />}
                  </div>
                </Section>
              )}

              {/* 折线/面积图 */}
              {(chartType === 'line' || chartType === 'area' || chartType === 'combo') && (
                <Section id="lineOpts" icon="📈" label={chartType === 'area' ? '面积图设置' : '折线图设置'}>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="线条宽度" value={lineWidth} onChange={setLineWidth} type="number" min={0.5} max={8} step={0.5} />
                    <Input label="数据点大小" value={symbolSize} onChange={setSymbolSize} type="number" min={0} max={20} step={1} />
                  </div>
                  {chartType === 'area' && (
                    <Input label="填充透明度 (%)" value={areaOpacity} onChange={setAreaOpacity} type="number" min={5} max={90} step={5} />
                  )}
                  <Toggle label="平滑曲线" value={lineSmooth} onChange={setLineSmooth} />
                </Section>
              )}

              {/* 饼图 */}
              {chartType === 'pie' && (
                <Section id="pieOpts" icon="🥧" label="饼图设置">
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="内半径 (%)" value={pieInnerRadius} onChange={setPieInnerRadius} type="number" min={0} max={90} step={5} />
                    <Input label="外半径 (%)" value={pieOuterRadius} onChange={setPieOuterRadius} type="number" min={10} max={95} step={5} />
                  </div>
                  <p className="text-[10px] text-gray-400">内半径 &gt; 0 为环形图，0 为实心饼图</p>
                  <div className="flex gap-4">
                    <Toggle label="显示数据标签" value={pieShowLabel} onChange={setPieShowLabel} />
                    <Toggle label="玫瑰图模式" value={pieRose} onChange={setPieRose} />
                  </div>
                </Section>
              )}

              {/* 散点图 */}
              {chartType === 'scatter' && (
                <Section id="scatterOpts" icon="🔵" label="散点图设置">
                  <Input label="散点大小" value={scatterSize} onChange={setScatterSize} type="number" min={2} max={30} step={1} />
                  <Toggle label="显示趋势线（线性回归）" value={showTrendline} onChange={setShowTrendline} />
                  {trendlineResult && (
                    <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700">
                      趋势线：y = {trendlineResult.slope.toFixed(3)}x + {trendlineResult.intercept.toFixed(3)}，R² = {trendlineResult.r2.toFixed(4)}
                    </div>
                  )}
                </Section>
              )}

              {/* 雷达图 */}
              {chartType === 'radar' && (
                <Section id="radarOpts" icon="🕸️" label="雷达图设置">
                  <Input label="线条宽度" value={lineWidth} onChange={setLineWidth} type="number" min={1} max={6} step={0.5} />
                </Section>
              )}

              {/* 误差线 */}
              {(chartType === 'bar' || chartType === 'line') && (
                <Section id="errorbar" icon="⚠️" label="误差线">
                  <Toggle label="显示误差线" value={showErrorBar} onChange={setShowErrorBar} />
                  {showErrorBar && (
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">误差值所在列</label>
                      <div className="flex flex-wrap gap-1.5">
                        {headers.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => setErrorBarCol(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${errorBarCol === i ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">选择包含误差值的列，将以当前值±误差值显示误差线</p>
                    </div>
                  )}
                </Section>
              )}

              {/* 双Y轴 */}
              {(chartType === 'bar' || chartType === 'line' || chartType === 'combo') && yCols.length > 1 && (
                <Section id="dualaxis" icon={<Layers size={12} />} label="双Y轴">
                  <Toggle label="启用双Y轴" value={dualAxis} onChange={setDualAxis} />
                  {dualAxis && (
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">右侧Y轴的系列</label>
                      <div className="flex flex-wrap gap-1.5">
                        {yCols.map(i => (
                          <button
                            key={i}
                            onClick={() => toggleDual(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dualYCols.includes(i) ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}
                          >
                            {headers[i]}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">选中的系列使用右侧Y轴，组合图中建议折线使用右侧Y轴</p>
                    </div>
                  )}
                </Section>
              )}

              {/* 坐标轴范围 */}
              {(chartType !== 'pie' && chartType !== 'radar') && (
                <Section id="axisRange" icon="📏" label="坐标轴范围">
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Y轴最小值" value={yMin} onChange={setYMin} placeholder="自动" />
                    <Input label="Y轴最大值" value={yMax} onChange={setYMax} placeholder="自动" />
                  </div>
                  {chartType === 'scatter' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="X轴最小值" value={xMin} onChange={setXMin} placeholder="自动" />
                      <Input label="X轴最大值" value={xMax} onChange={setXMax} placeholder="自动" />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400">留空则自动计算范围</p>
                </Section>
              )}

              {/* 坐标轴 */}
              {(chartType !== 'pie' && chartType !== 'radar') && (
                <Section id="axis" icon="📐" label="坐标轴显示">
                  <Toggle label="显示网格线" value={showGrid} onChange={setShowGrid} />
                  <Input label="X轴标签旋转角度 (°)" value={xRotate} onChange={setXRotate} type="number" min={-90} max={90} step={5} />
                </Section>
              )}

              {/* 数据标签 */}
              {(chartType !== 'radar') && (
                <Section id="datalabel" icon="🏷️" label="数据标签">
                  <Toggle label="显示数值标签" value={showDataLabel} onChange={setShowDataLabel} />
                  {showDataLabel && chartType !== 'pie' && (
                    <RadioGroup label="标签位置" options={[
                      { value: 'top', label: '顶部' }, { value: 'inside', label: '内部' }, { value: 'right', label: '右侧' },
                    ]} value={labelPosition} onChange={setLabelPosition} />
                  )}
                </Section>
              )}

              {/* 图例 */}
              <Section id="legend" icon="📖" label="图例设置">
                <Toggle label="显示图例" value={showLegend} onChange={setShowLegend} />
                {showLegend && (
                  <RadioGroup label="图例位置" options={[
                    { value: 'bottom', label: '底部' }, { value: 'top', label: '顶部' },
                    { value: 'left', label: '左侧' }, { value: 'right', label: '右侧' },
                  ]} value={legendPos} onChange={setLegendPos} />
                )}
              </Section>
            </div>
          )}

          {/* JSON code */}
          {showCode && option && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">ECharts 配置 (JSON)</span>
                <button onClick={copyOptionCode} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded">
                  <Copy size={12} /> {copied === 'code' ? '已复制' : '复制'}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-700 overflow-x-auto max-h-64 overflow-y-auto bg-gray-50/60">
                {JSON.stringify(option, null, 2)}
              </pre>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4">
              {option ? (
                <ReactECharts
                  ref={chartRef}
                  option={option}
                  style={{ height: chartHeight, width: chartWidth }}
                  opts={{ renderer: 'svg' }}
                  notMerge={true}
                />
              ) : (
                <div className="h-[460px] flex items-center justify-center text-gray-400 text-sm">
                  无法生成图表，请检查数据列选择
                </div>
              )}
            </div>
          </div>

          {/* 数据表 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
                <Table2 size={14} /> 数据预览
              </button>
              <button onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'stats' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
                <Calculator size={14} /> 数据统计
              </button>
              {trendlineResult && (
                <button onClick={() => setActiveTab('trendline')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'trendline' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
                  <TrendingUp size={14} /> 趋势分析
                </button>
              )}
              <div className="flex-1" />
              <button onClick={copyDataAsCSV} className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
                <Copy size={12} /> {copied === 'csv' ? '已复制' : '复制CSV'}
              </button>
            </div>

            {activeTab === 'preview' && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50/80">
                      {headers.map((h, i) => (
                        <th key={i} className={`px-4 py-2.5 text-left font-medium whitespace-nowrap ${i === xCol ? 'text-blue-600 bg-blue-50/50' : yCols.includes(i) ? 'text-green-600 bg-green-50/50' : 'text-gray-600'}`}>
                          {h}
                          <span className="ml-1 font-normal text-[10px]">
                            {i === xCol ? '(X轴)' : yCols.includes(i) ? (dualYCols.includes(i) ? '(Y2轴)' : '(Y轴)') : ''}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 15).map((row, ri) => (
                      <tr key={ri} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                        {headers.map((_, ci) => (
                          <td key={ci} className={`px-4 py-2 whitespace-nowrap ${ci === xCol ? 'text-blue-700 font-medium' : yCols.includes(ci) ? 'text-green-700' : 'text-gray-600'}`}>
                            {row[ci] !== undefined && row[ci] !== null ? String(row[ci]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 15 && (
                  <div className="px-4 py-2 text-center text-xs text-gray-400 bg-gray-50/50 border-t border-gray-50">
                   显示前 15 行，共 {data.length} 行数据
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="overflow-x-auto p-2">
                {stats ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-50/80">统计量</th>
                        {headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-center font-medium text-gray-600 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['count', 'min', 'max', 'mean', 'median', 'std', 'variance', 'q1', 'q3', 'sum'].map(stat => (
                        <tr key={stat} className="border-t border-gray-50 hover:bg-gray-50/50">
                          <td className="px-3 py-1.5 font-medium text-gray-500 sticky left-0 bg-white">
                            {{ count: '样本数', min: '最小值', max: '最大值', mean: '平均值', median: '中位数', std: '标准差', variance: '方差', q1: 'Q1', q3: 'Q3', sum: '总和' }[stat]}
                          </td>
                          {headers.map((h, i) => {
                            const s = stats[h]
                            if (!s) return <td key={i} className="px-3 py-1.5 text-center text-gray-300">-</td>
                            const val = s[stat]
                            if (val === undefined || val === null) return <td key={i} className="px-3 py-1.5 text-center text-gray-300">-</td>
                            const formatted = typeof val === 'number'
                              ? (stat === 'count' ? val : Math.abs(val) < 0.001 || Math.abs(val) > 1e6 ? val.toExponential(3) : val.toFixed(3))
                              : val
                            return <td key={i} className="px-3 py-1.5 text-center font-mono text-gray-700">{formatted}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-sm">暂无可统计数据</div>
                )}
              </div>
            )}

            {activeTab === 'trendline' && trendlineResult && (
              <div className="p-4 space-y-3">
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                  <div className="font-medium mb-2">线性回归分析</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>回归方程：<span className="font-mono">y = {trendlineResult.slope.toFixed(4)}x + {trendlineResult.intercept.toFixed(4)}</span></div>
                    <div>斜率：<span className="font-mono">{trendlineResult.slope.toFixed(4)}</span></div>
                    <div>截距：<span className="font-mono">{trendlineResult.intercept.toFixed(4)}</span></div>
                    <div>R²：<span className="font-mono">{trendlineResult.r2.toFixed(4)}</span> ({trendlineResult.r2 > 0.8 ? '强相关' : trendlineResult.r2 > 0.5 ? '中等相关' : '弱相关'})</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
