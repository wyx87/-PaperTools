import { useState, useCallback } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import ChartDataInput, { resolveColors, colorThemes } from '../components/ChartDataInput'
import ChartControlPanel, { defaultSettings } from '../components/ChartControlPanel'
import ReactECharts from 'echarts-for-react'
import { Download, Copy, RotateCcw } from 'lucide-react'
import { useChartExport } from '../hooks/useChartExport'

const INITIAL = [
  { name: '方法A', value: 335 },
  { name: '方法B', value: 310 },
  { name: '方法C', value: 234 },
  { name: '方法D', value: 135 },
  { name: '方法E', value: 154 },
]
const sampleHeaders = ['方法', '数值']
const sampleRows = [
  ['方法A', '335'], ['方法B', '310'], ['方法C', '234'],
  ['方法D', '135'], ['方法E', '154'],
]

export default function PieChartPage() {
  const [donut, setDonut] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)
  const [items, setItems] = useState(INITIAL)
  const { chartRef, copying, copyDone, handleExport, handleCopy } = useChartExport()
  const colors = resolveColors(settings, items.length)

  const handleDataChange = useCallback((data) => {
    if (data) setItems(data.items || [])
    else { setItems(INITIAL); setSettings(defaultSettings); setDonut(false) }
  }, [])

  const handleReset = () => { setItems(INITIAL); setSettings(defaultSettings); setDonut(false) }

  const option = {
    backgroundColor: settings.background === 'transparent' ? 'transparent'
      : settings.background === 'lightgray' ? '#F3F4F6' : '#FFFFFF',
    title: settings.titleText ? {
      text: settings.titleText, left: settings.titlePos || 'center',
      textStyle: { color: '#1E3A5F', fontSize: 14, fontWeight: 'bold' },
    } : undefined,
    tooltip: { trigger: 'item' },
    legend: settings.legendPos !== 'none' ? {
      orient: settings.legendPos === 'left' || settings.legendPos === 'right' ? 'vertical' : 'horizontal',
      [settings.legendPos === 'none' ? 'bottom' : settings.legendPos]: settings.legendPos === 'left' || settings.legendPos === 'right' ? 'center' : 0,
      textStyle: { color: '#6B7280', fontSize: 11 },
    } : undefined,
    series: [{
      type: 'pie',
      radius: donut ? ['40%', '70%'] : '65%',
      center: ['50%', '50%'],
      data: items,
      label: {
        show: settings.showValueLabel,
        color: '#6B7280',
        fontSize: settings.valueFontSize,
      },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.1)' } },
    }],
    color: colors,
  }

  return (
    <ChartPageLayout title="饼图生成器" breadcrumb="饼图">
      <ChartDataInput onDataChange={handleDataChange} sampleHeaders={sampleHeaders} sampleRows={sampleRows} dataType="pie">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium mr-1">类型</span>
          <button onClick={() => setDonut(false)} className={`px-2.5 py-1 text-[11px] rounded-md font-medium ${!donut?'bg-[#1E3A5F] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>普通饼图</button>
          <button onClick={() => setDonut(true)} className={`px-2.5 py-1 text-[11px] rounded-md font-medium ${donut?'bg-[#1E3A5F] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>环形图</button>
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
