import { useState, useCallback } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import ChartDataInput, { resolveColors } from '../components/ChartDataInput'
import ChartControlPanel, { defaultSettings } from '../components/ChartControlPanel'
import ReactECharts from 'echarts-for-react'
import { Download, Copy, RotateCcw } from 'lucide-react'
import { useChartExport } from '../hooks/useChartExport'

// ---- Initial data ----
const INITIAL = {
  categories: ['对照组', '实验组A', '实验组B', '实验组C', '实验组D'],
  series: [
    { name: '指标1', data: [45, 62, 78, 55, 68] },
    { name: '指标2', data: [38, 55, 65, 48, 72] },
  ],
}
const sampleHeaders = ['组别', '指标1', '指标2']
const sampleRows = [
  ['对照组', '45', '38'],
  ['实验组A', '62', '55'],
  ['实验组B', '78', '65'],
  ['实验组C', '55', '48'],
  ['实验组D', '68', '72'],
]

export default function BarChartPage() {
  const [chartType, setChartType] = useState('cluster')
  const [settings, setSettings] = useState(defaultSettings)
  const [columns, setColumns] = useState(INITIAL)
  const { chartRef, copying, copyDone, handleExport, handleCopy } = useChartExport()

  const colors = resolveColors(settings, columns.series.length)

  const handleDataChange = useCallback((data) => {
    if (data) {
      setColumns({ categories: data.categories || [], series: data.series || [] })
    } else {
      // Full reset
      setColumns(INITIAL)
      setChartType('cluster')
      setSettings(defaultSettings)
    }
  }, [])

  const handleReset = () => {
    setColumns(INITIAL)
    setChartType('cluster')
    setSettings(defaultSettings)
  }

  // Build grid margins based on legend position
  const gridMargins = (() => {
    const b = settings.showValueLabel ? 25 : 10
    switch (settings.legendPos) {
      case 'top': return { left: 50, right: 20, top: settings.titleText ? 55 : (settings.legendPos === 'none' ? 15 : 40), bottom: b }
      case 'left': return { left: 120, right: 20, top: settings.titleText ? 55 : 15, bottom: b }
      case 'right': return { left: 50, right: 120, top: settings.titleText ? 55 : 15, bottom: b }
      case 'none': return { left: 50, right: 20, top: settings.titleText ? 50 : 15, bottom: b }
      default: return { left: 50, right: 20, top: settings.titleText ? 55 : 15, bottom: 40 }
    }
  })()

  const option = {
    backgroundColor: settings.background === 'transparent' ? 'transparent'
      : settings.background === 'lightgray' ? '#F3F4F6' : '#FFFFFF',
    title: settings.titleText ? {
      text: settings.titleText,
      left: settings.titlePos || 'center',
      textStyle: { color: '#1E3A5F', fontSize: 14, fontWeight: 'bold' },
    } : undefined,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: settings.legendPos !== 'none' ? {
      data: columns.series.map(s => s.name),
      [settings.legendPos]: 0,
      textStyle: { color: '#6B7280' },
    } : undefined,
    grid: gridMargins,
    xAxis: {
      type: 'category',
      data: columns.categories,
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
      name: s.name,
      type: 'bar',
      data: s.data,
      ...(chartType === 'stack' ? { stack: 'total' } : {}),
      ...(chartType === 'percent' ? { stack: 'percent' } : {}),
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: colors[i],
      },
      label: settings.showValueLabel ? {
        show: true,
        position: 'top',
        fontSize: settings.valueFontSize,
        color: '#374151',
      } : undefined,
    })),
  }

  return (
    <ChartPageLayout title="柱状图生成器" breadcrumb="柱状图">
      <ChartDataInput onDataChange={handleDataChange} sampleHeaders={sampleHeaders} sampleRows={sampleRows} dataType="multi-series">
        {/* Sub-type controls */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium mr-1">子类型</span>
          {[{ id: 'cluster', label: '簇状' }, { id: 'stack', label: '堆叠' }, { id: 'percent', label: '百分比' }].map(t => (
            <button key={t.id} onClick={() => setChartType(t.id)}
              className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors ${chartType === t.id ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex gap-1.5">
            <button onClick={handleReset} className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium flex items-center gap-1">
              <RotateCcw size={11} />重置
            </button>
            <button onClick={() => handleExport('png')} className="px-2.5 py-1 text-[11px] rounded-md bg-[#3B82F6] text-white hover:bg-[#2563EB] font-medium flex items-center gap-1">
              <Download size={11} />PNG
            </button>
            <button onClick={() => handleExport('svg')} className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium flex items-center gap-1">
              <Download size={11} />SVG
            </button>
            <button onClick={handleCopy}
              className={`px-2.5 py-1 text-[11px] rounded-md font-medium flex items-center gap-1 ${copyDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Copy size={11} />{copyDone ? '已复制' : copying ? '...' : '复制为图片'}
            </button>
          </div>
        </div>

        {/* Chart Control Panel */}
        <ChartControlPanel settings={settings} onChange={setSettings} />

        {/* Chart */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <ReactECharts ref={chartRef} option={option} style={{ height: settings.chartHeight, maxWidth: '100%' }} notMerge />
        </div>
      </ChartDataInput>
    </ChartPageLayout>
  )
}
