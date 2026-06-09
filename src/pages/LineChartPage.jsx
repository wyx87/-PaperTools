import { useState, useCallback } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import ChartDataInput, { resolveColors } from '../components/ChartDataInput'
import ChartControlPanel, { defaultSettings } from '../components/ChartControlPanel'
import ReactECharts from 'echarts-for-react'
import { Download, Copy, RotateCcw } from 'lucide-react'
import { useChartExport } from '../hooks/useChartExport'

const INITIAL = {
  categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [
    { name: '方法A', data: [120, 132, 101, 134, 190, 230] },
    { name: '方法B', data: [220, 182, 191, 234, 290, 330] },
    { name: '方法C', data: [150, 232, 201, 154, 190, 250] },
  ],
}
const sampleHeaders = ['月份', '方法A', '方法B', '方法C']
const sampleRows = [
  ['1月', '120', '220', '150'],
  ['2月', '132', '182', '232'],
  ['3月', '101', '191', '201'],
  ['4月', '134', '234', '154'],
  ['5月', '190', '290', '190'],
  ['6月', '230', '330', '250'],
]

export default function LineChartPage() {
  const [smooth, setSmooth] = useState(true)
  const [showArea, setShowArea] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)
  const [columns, setColumns] = useState(INITIAL)
  const { chartRef, copying, copyDone, handleExport, handleCopy } = useChartExport()

  const colors = resolveColors(settings, columns.series.length)

  const handleDataChange = useCallback((data) => {
    if (data) setColumns({ categories: data.categories || [], series: data.series || [] })
    else { setColumns(INITIAL); setSettings(defaultSettings); setSmooth(true); setShowArea(false) }
  }, [])

  const handleReset = () => {
    setColumns(INITIAL); setSettings(defaultSettings); setSmooth(true); setShowArea(false)
  }

  const gridMargins = (() => {
    const b = settings.showValueLabel ? 25 : 10
    switch (settings.legendPos) {
      case 'top': return { left: 55, right: 20, top: settings.titleText ? 55 : 40, bottom: b }
      case 'left': return { left: 130, right: 20, top: settings.titleText ? 55 : 15, bottom: b }
      case 'right': return { left: 55, right: 130, top: settings.titleText ? 55 : 15, bottom: b }
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
      name: s.name, type: 'line', data: s.data, smooth,
      areaStyle: showArea ? { opacity: 0.15 } : undefined,
      itemStyle: { color: colors[i] },
      label: settings.showValueLabel ? {
        show: true, position: 'top', fontSize: settings.valueFontSize, color: '#374151',
      } : undefined,
    })),
  }

  return (
    <ChartPageLayout title="折线图生成器" breadcrumb="折线图">
      <ChartDataInput onDataChange={handleDataChange} sampleHeaders={sampleHeaders} sampleRows={sampleRows} dataType="multi-series">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium mr-1">曲线</span>
          <button onClick={() => setSmooth(!smooth)} className={`px-2.5 py-1 text-[11px] rounded-md font-medium ${smooth ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {smooth ? '平滑' : '直线'}
          </button>
          <button onClick={() => setShowArea(!showArea)} className={`px-2.5 py-1 text-[11px] rounded-md font-medium ${showArea ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {showArea ? '面积填充' : '无填充'}
          </button>
          <div className="ml-auto flex gap-1.5">
            <button onClick={handleReset} className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium flex items-center gap-1"><RotateCcw size={11}/>重置</button>
            <button onClick={() => handleExport('png')} className="px-2.5 py-1 text-[11px] rounded-md bg-[#3B82F6] text-white hover:bg-[#2563EB] font-medium flex items-center gap-1"><Download size={11}/>PNG</button>
            <button onClick={() => handleExport('svg')} className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium flex items-center gap-1"><Download size={11}/>SVG</button>
            <button onClick={handleCopy} className={`px-2.5 py-1 text-[11px] rounded-md font-medium flex items-center gap-1 ${copyDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Copy size={11}/>{copyDone ? '已复制' : copying ? '...' : '复制为图片'}</button>
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
