import { useState, useCallback } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import ChartDataInput, { resolveColors } from '../components/ChartDataInput'
import ChartControlPanel, { defaultSettings } from '../components/ChartControlPanel'
import ReactECharts from 'echarts-for-react'
import { Download, Copy, RotateCcw } from 'lucide-react'
import { useChartExport } from '../hooks/useChartExport'

const INITIAL = {
  categories: ['维度A', '维度B', '维度C', '维度D', '维度E'],
  series: [
    { name: '对象1', data: [85, 72, 90, 65, 78] },
    { name: '对象2', data: [70, 88, 65, 80, 72] },
    { name: '对象3', data: [60, 58, 75, 90, 85] },
  ],
}
const sampleHeaders = ['维度', '对象1', '对象2', '对象3']
const sampleRows = [
  ['维度A', '85', '70', '60'], ['维度B', '72', '88', '58'],
  ['维度C', '90', '65', '75'], ['维度D', '65', '80', '90'],
  ['维度E', '78', '72', '85'],
]

export default function RadarChartPage() {
  const [shape, setShape] = useState('polygon')
  const [settings, setSettings] = useState(defaultSettings)
  const [columns, setColumns] = useState(INITIAL)
  const { chartRef, copying, copyDone, handleExport, handleCopy } = useChartExport()
  const colors = resolveColors(settings, columns.series.length)

  const handleDataChange = useCallback((data) => {
    if (data) setColumns({ categories: data.categories || [], series: data.series || [] })
    else { setColumns(INITIAL); setSettings(defaultSettings); setShape('polygon') }
  }, [])
  const handleReset = () => { setColumns(INITIAL); setSettings(defaultSettings); setShape('polygon') }

  const option = {
    backgroundColor: settings.background === 'transparent' ? 'transparent'
      : settings.background === 'lightgray' ? '#F3F4F6' : '#FFFFFF',
    title: settings.titleText ? {
      text: settings.titleText, left: settings.titlePos || 'center',
      textStyle: { color: '#1E3A5F', fontSize: 14, fontWeight: 'bold' },
    } : undefined,
    tooltip: {},
    legend: settings.legendPos !== 'none' ? {
      data: columns.series.map(s => s.name),
      [settings.legendPos]: 0,
      textStyle: { color: '#6B7280' },
    } : undefined,
    radar: {
      indicator: columns.categories.map(c => ({ name: c, max: 100 })),
      shape,
      axisName: { color: '#6B7280', fontSize: settings.axisFontSize },
    },
    series: [{
      type: 'radar',
      data: columns.series.map((s, i) => ({
        name: s.name, value: s.data,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: colors[i] },
      })),
    }],
  }

  return (
    <ChartPageLayout title="雷达图生成器" breadcrumb="雷达图">
      <ChartDataInput onDataChange={handleDataChange} sampleHeaders={sampleHeaders} sampleRows={sampleRows} dataType="multi-series">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium mr-1">形状</span>
          <button onClick={() => setShape('polygon')} className={`px-2.5 py-1 text-[11px] rounded-md font-medium ${shape==='polygon'?'bg-[#1E3A5F] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>多边形</button>
          <button onClick={() => setShape('circle')} className={`px-2.5 py-1 text-[11px] rounded-md font-medium ${shape==='circle'?'bg-[#1E3A5F] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>圆形</button>
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
