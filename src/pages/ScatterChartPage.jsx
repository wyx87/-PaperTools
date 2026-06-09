import { useState, useCallback } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import ChartDataInput, { resolveColors, colorThemes } from '../components/ChartDataInput'
import ChartControlPanel, { defaultSettings } from '../components/ChartControlPanel'
import ReactECharts from 'echarts-for-react'
import { Download, Copy, RotateCcw } from 'lucide-react'
import { useChartExport } from '../hooks/useChartExport'

const INITIAL = [
  [8.0, 5.2], [10.5, 7.8], [12.3, 9.1], [14.2, 10.5], [16.1, 12.3],
  [18.0, 14.0], [20.3, 15.2], [22.5, 17.1], [24.1, 18.5], [26.0, 20.0],
]
const sampleHeaders = ['X值', 'Y值']
const sampleRows = INITIAL.map(p => [String(p[0]), String(p[1])])

function calcTrendline(points) {
  const n = points.length
  if (n < 2) return []
  let sx = 0, sy = 0, sxx = 0, sxy = 0
  for (const [x, y] of points) { sx += x; sy += y; sxx += x * x; sxy += x * y }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx)
  const intercept = (sy - slope * sx) / n
  const minX = Math.min(...points.map(p => p[0]))
  const maxX = Math.max(...points.map(p => p[0]))
  return [[minX, slope * minX + intercept], [maxX, slope * maxX + intercept]]
}

export default function ScatterChartPage() {
  const [showTrendline, setShowTrendline] = useState(true)
  const [settings, setSettings] = useState(defaultSettings)
  const [points, setPoints] = useState(INITIAL)
  const { chartRef, copying, copyDone, handleExport, handleCopy } = useChartExport()
  const colors = resolveColors(settings, 2)
  const theme = colorThemes.find(t => t.id === settings.themeId) || colorThemes[0]

  const handleDataChange = useCallback((data) => {
    if (data) setPoints(data.points || [])
    else { setPoints(INITIAL); setSettings(defaultSettings); setShowTrendline(true) }
  }, [])
  const handleReset = () => { setPoints(INITIAL); setSettings(defaultSettings); setShowTrendline(true) }

  const trendData = showTrendline ? calcTrendline(points) : []

  const option = {
    backgroundColor: settings.background === 'transparent' ? 'transparent'
      : settings.background === 'lightgray' ? '#F3F4F6' : '#FFFFFF',
    title: settings.titleText ? {
      text: settings.titleText, left: settings.titlePos || 'center',
      textStyle: { color: '#1E3A5F', fontSize: 14, fontWeight: 'bold' },
    } : undefined,
    tooltip: { trigger: 'item', formatter: p => `(${p.value[0].toFixed(2)}, ${p.value[1].toFixed(2)})` },
    legend: settings.legendPos !== 'none' ? { [settings.legendPos]: 0, textStyle: { color: '#6B7280' } } : undefined,
    grid: { left: 60, right: 20, top: settings.titleText ? 55 : 15, bottom: 40 },
    xAxis: {
      type: 'value', axisLabel: { color: '#6B7280' },
      name: settings.xAxisName || 'X',
      nameTextStyle: { color: '#9CA3AF', fontSize: settings.axisFontSize },
      splitLine: { show: settings.showGridX, lineStyle: { color: '#E5E7EB', type: 'dashed' } },
    },
    yAxis: {
      type: 'value', axisLabel: { color: '#6B7280' },
      name: settings.yAxisName || 'Y',
      nameTextStyle: { color: '#9CA3AF', fontSize: settings.axisFontSize },
      splitLine: { show: settings.showGridY, lineStyle: { color: '#E5E7EB', type: 'dashed' } },
    },
    series: [
      {
        type: 'scatter', data: points, symbolSize: 8,
        itemStyle: { color: colors[0] },
        emphasis: { itemStyle: { color: colors[1] || colors[0] } },
        label: settings.showValueLabel ? {
          show: true, position: 'top', fontSize: settings.valueFontSize, color: '#374151',
        } : undefined,
      },
      ...(trendData.length ? [{
        type: 'line', data: trendData, showSymbol: false, smooth: false,
        lineStyle: { color: '#EF4444', type: 'dashed', width: 1.5 },
        tooltip: { formatter: p => `趋势线 (${p.value[0].toFixed(2)}, ${p.value[1].toFixed(2)})` }
      }] : []),
    ],
  }

  return (
    <ChartPageLayout title="散点图生成器" breadcrumb="散点图">
      <ChartDataInput onDataChange={handleDataChange} sampleHeaders={sampleHeaders} sampleRows={sampleRows} dataType="scatter">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium mr-1">选项</span>
          <button onClick={() => setShowTrendline(!showTrendline)} className={`px-2.5 py-1 text-[11px] rounded-md font-medium ${showTrendline?'bg-[#1E3A5F] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {showTrendline?'趋势线开':'趋势线关'}
          </button>
          <div className="ml-auto flex gap-1.5">
            <button onClick={handleReset} className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium flex items-center gap-1"><RotateCcw size={11}/>重置</button>
            <button onClick={() => handleExport('png')} className="px-2.5 py-1 text-[11px] rounded-md bg-[#3B82F6] text-white hover:bg-[#2563EB] font-medium flex items-center gap-1"><Download size={11}/>PNG</button>
            <button onClick={() => handleExport('svg')} className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium flex items-center gap-1"><Download size={11}/>SVG</button>
            <button onClick={handleCopy} className={`px-2.5 py-1 text-[11px] rounded-md font-medium flex items-center gap-1 ${copyDone?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Copy size={11}/>{copyDone?'已复制':copying?'...':'复制为图片'}</button>
          </div>
        </div>
        <ChartControlPanel settings={settings} onChange={setSettings} />
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <ReactECharts ref={chartRef} option={option} style={{ height: settings.chartHeight }} notMerge />
        </div>
      </ChartDataInput>
    </ChartPageLayout>
  )
}
