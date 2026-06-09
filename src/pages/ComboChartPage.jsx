import { useState, useCallback } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import ChartDataInput, { resolveColors } from '../components/ChartDataInput'
import ChartControlPanel, { defaultSettings, comboTypes } from '../components/ChartControlPanel'
import ReactECharts from 'echarts-for-react'
import { Download, Copy, RotateCcw } from 'lucide-react'
import { useChartExport } from '../hooks/useChartExport'

const INITIAL = {
  categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [
    { name: '销量(柱)', data: [320, 332, 301, 334, 390, 420] },
    { name: '增长率(线)', data: [15, 22, 18, 25, 30, 38] },
  ],
}
const sampleHeaders = ['月份', '销量(柱)', '增长率(线)']
const sampleRows = [
  ['1月', '320', '15'], ['2月', '332', '22'], ['3月', '301', '18'],
  ['4月', '334', '25'], ['5月', '390', '30'], ['6月', '420', '38'],
]

export default function ComboChartPage() {
  const [comboType, setComboType] = useState('bar-line')
  const [settings, setSettings] = useState(defaultSettings)
  const [columns, setColumns] = useState(INITIAL)
  const { chartRef, copying, copyDone, handleExport, handleCopy } = useChartExport()
  const colors = resolveColors(settings, columns.series.length)
  const ct = comboTypes.find(c => c.id === comboType) || comboTypes[0]

  const handleDataChange = useCallback((data) => {
    if (data) setColumns({ categories: data.categories || [], series: data.series || [] })
    else { setColumns(INITIAL); setSettings(defaultSettings); setComboType('bar-line') }
  }, [])
  const handleReset = () => { setColumns(INITIAL); setSettings(defaultSettings); setComboType('bar-line') }

  const needDualY = ct.s1 !== ct.s2 || ct.id === 'bar-line-area'
  const isArea = (type) => type === 'area'
  const getActualType = (t) => t === 'area' ? 'line' : t

  const gridMargins = (() => {
    const b = settings.showValueLabel ? 25 : 10
    const r = needDualY ? 55 : 20
    switch (settings.legendPos) {
      case 'top': return { left: 55, right: r, top: settings.titleText ? 55 : 40, bottom: b }
      case 'none': return { left: 55, right: r, top: settings.titleText ? 50 : 15, bottom: b }
      default: return { left: 55, right: r, top: settings.titleText ? 55 : 15, bottom: 40 }
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
      type: 'category', data: columns.categories,
      name: settings.xAxisName || undefined,
      nameTextStyle: settings.xAxisName ? { color: '#9CA3AF', fontSize: settings.axisFontSize } : undefined,
      axisLabel: { color: '#6B7280', fontSize: 11, rotate: settings.xLabelRotate || 0 },
      splitLine: { show: settings.showGridX },
    },
    yAxis: needDualY ? [
      {
        type: 'value', name: columns.series[0]?.name || '',
        nameTextStyle: { color: '#9CA3AF', fontSize: settings.axisFontSize },
        axisLabel: { color: '#6B7280' },
        splitLine: { show: settings.showGridY, lineStyle: { color: '#E5E7EB', type: 'dashed' } },
      },
      {
        type: 'value', name: columns.series[1]?.name || '',
        nameTextStyle: { color: '#9CA3AF', fontSize: settings.axisFontSize },
        axisLabel: { color: '#6B7280' },
        splitLine: { show: false },
      },
    ] : {
      type: 'value',
      name: settings.yAxisName || undefined,
      nameTextStyle: settings.yAxisName ? { color: '#9CA3AF', fontSize: settings.axisFontSize } : undefined,
      axisLabel: { color: '#6B7280' },
      splitLine: { show: settings.showGridY, lineStyle: { color: '#E5E7EB', type: 'dashed' } },
    },
    series: columns.series.map((s, i) => {
      const seriesType = getActualType(i === 0 ? ct.s1 : ct.s2)
      const isAreaSeries = isArea(i === 0 ? ct.s1 : ct.s2)
      return {
        name: s.name,
        type: seriesType,
        data: s.data,
        yAxisIndex: needDualY && i > 0 ? 1 : 0,
        smooth: seriesType === 'line',
        ...(seriesType === 'bar' ? {
          itemStyle: { borderRadius: [4, 4, 0, 0], color: colors[i] },
          barWidth: '40%',
        } : {
          itemStyle: { color: colors[i] },
        }),
        ...(isAreaSeries ? { areaStyle: { opacity: 0.3 } } : {}),
        label: settings.showValueLabel ? {
          show: true, position: 'top', fontSize: settings.valueFontSize, color: '#374151',
        } : undefined,
      }
    }),
  }

  return (
    <ChartPageLayout title="组合图生成器" breadcrumb="组合图">
      <ChartDataInput onDataChange={handleDataChange} sampleHeaders={sampleHeaders} sampleRows={sampleRows} dataType="multi-series">
        <div className="flex flex-wrap items-center gap-2">
          <div className="ml-auto flex gap-1.5">
            <button onClick={handleReset} className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium flex items-center gap-1"><RotateCcw size={11}/>重置</button>
            <button onClick={() => handleExport('png')} className="px-2.5 py-1 text-[11px] rounded-md bg-[#3B82F6] text-white hover:bg-[#2563EB] font-medium flex items-center gap-1"><Download size={11}/>PNG</button>
            <button onClick={() => handleExport('svg')} className="px-2.5 py-1 text-[11px] rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium flex items-center gap-1"><Download size={11}/>SVG</button>
            <button onClick={handleCopy} className={`px-2.5 py-1 text-[11px] rounded-md font-medium flex items-center gap-1 ${copyDone?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Copy size={11}/>{copyDone?'已复制':copying?'...':'复制为图片'}</button>
          </div>
        </div>
        <ChartControlPanel settings={settings} onChange={setSettings} showComboTypes comboType={comboType} onComboTypeChange={setComboType} />
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <ReactECharts ref={chartRef} option={option} style={{ height: settings.chartHeight }} notMerge />
        </div>
      </ChartDataInput>
    </ChartPageLayout>
  )
}
