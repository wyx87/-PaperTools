import { useState, useCallback } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import ChartDataInput, { resolveColors, colorThemes } from '../components/ChartDataInput'
import ChartControlPanel, { defaultSettings } from '../components/ChartControlPanel'
import ReactECharts from 'echarts-for-react'
import { Download, Copy, RotateCcw } from 'lucide-react'
import { useChartExport } from '../hooks/useChartExport'

const INITIAL = {
  categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [
    { name: '产品A', data: [320, 302, 341, 374, 390, 420] },
    { name: '产品B', data: [120, 132, 101, 134, 190, 230] },
    { name: '产品C', data: [220, 182, 191, 234, 290, 330] },
  ],
}
const sampleHeaders = ['月份', '产品A', '产品B', '产品C']
const sampleRows = [
  ['1月', '320', '120', '220'], ['2月', '302', '132', '182'],
  ['3月', '341', '101', '191'], ['4月', '374', '134', '234'],
  ['5月', '390', '190', '290'], ['6月', '420', '230', '330'],
]

export default function AreaChartPage() {
  const [mode, setMode] = useState('stack')
  const [settings, setSettings] = useState(defaultSettings)
  const [columns, setColumns] = useState(INITIAL)
  const { chartRef, copying, copyDone, handleExport, handleCopy } = useChartExport()
  const colors = resolveColors(settings, columns.series.length)

  const handleDataChange = useCallback((data) => {
    if (data) setColumns({ categories: data.categories || [], series: data.series || [] })
    else { setColumns(INITIAL); setSettings(defaultSettings); setMode('stack') }
  }, [])

  const handleReset = () => { setColumns(INITIAL); setSettings(defaultSettings); setMode('stack') }

  const gridMargins = (() => {
    const b = settings.showValueLabel ? 25 : 10
    switch (settings.legendPos) {
      case 'top': return { left: 55, right: 20, top: settings.titleText ? 55 : 40, bottom: b }
      case 'left': return { left: 130, right: 20, top: settings.titleText ? 55 : 15, bottom: b }
      case 'none': return { left: 55, right: 20, top: settings.titleText ? 50 : 15, bottom: b }
      default: return { left: 55, right: 20, top: settings.titleText ? 55 : 15, bottom: 40 }
    }
  })()

  const option = {
    backgroundColor: settings.background === 'transparent' ? 'transparent'
      : settings.background === 'lightgray' ? '#F3F4F6' : '#FFFFFF',
    title: settings.titleText ? {
      text: settings.titleText, left: settings.titlePos || 'center',
      textStyle: { color: '#1E3A5F', fontSize: 14, fontWeight: 'bold' },
    } : undefined,
    tooltip: { trigger: 'axis' },
    legend: settings.legendPos !== 'none' ? {
      data: columns.series.map(s => s.name),
      [settings.legendPos]: 0,
      textStyle: { color: '#6B7280' },
    } : undefined,
    grid: gridMargins,
    xAxis: {
      type: 'category', data: columns.categories, boundaryGap: false,
      name: settings.xAxisName || undefined,
      nameTextStyle: settings.xAxisName ? { color: '#9CA3AF', fontSize: settings.axisFontSize } : undefined,
      axisLabel: { color: '#6B7280', fontSize: 11, rotate: settings.xLabelRotate || 0 },
      splitLine: { show: settings.showGridX },
    },
    yAxis: {
      type: 'value',
      name: settings.yAxisName || undefined,
      nameTextStyle: settings.yAxisName ? { color: '#9CA3AF', fontSize: settings.axisFontSize } : undefined,
      axisLabel: { color: '#6B7280' },
      splitLine: { show: settings.showGridY, lineStyle: { color: '#E5E7EB', type: 'dashed' } },
    },
    series: columns.series.map((s, i) => ({
      name: s.name, type: 'line', data: s.data, smooth: true,
      areaStyle: { opacity: 0.5 },
      ...(mode === 'stack' ? { stack: 'total' } : {}),
      ...(mode === 'percent' ? { stack: 'percent' } : {}),
      itemStyle: { color: colors[i] },
      label: settings.showValueLabel ? {
        show: true, position: 'top', fontSize: settings.valueFontSize, color: '#374151',
      } : undefined,
    })),
  }

  return (
    <ChartPageLayout title="面积图生成器" breadcrumb="面积图">
      <ChartDataInput onDataChange={handleDataChange} sampleHeaders={sampleHeaders} sampleRows={sampleRows} dataType="multi-series">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium mr-1">模式</span>
          {[{ id: 'stack', label: '堆积面积' }, { id: 'percent', label: '百分比面积' }, { id: 'none', label: '独立面积' }].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`px-2.5 py-1 text-[11px] rounded-md font-medium ${mode===m.id?'bg-[#1E3A5F] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{m.label}</button>
          ))}
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
