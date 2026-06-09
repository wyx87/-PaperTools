import { useCallback, useRef, useState } from 'react'

/**
 * Hook: ECharts chart export and clipboard copy (PNG + SVG)
 */
export function useChartExport() {
  const chartRef = useRef(null)
  const [copying, setCopying] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

  const getInstance = useCallback(() => chartRef.current?.getEchartsInstance?.() || chartRef.current?.getEchartsInstance, [])
  
  const getInstanceActual = useCallback(() => {
    const ref = chartRef.current
    if (!ref) return null
    if (typeof ref.getEchartsInstance === 'function') return ref.getEchartsInstance()
    return ref
  }, [])

  const handleExport = useCallback((format = 'png') => {
    const instance = getInstanceActual()
    if (!instance || typeof instance.getDataURL !== 'function') return
    const url = instance.getDataURL({ type: format, pixelRatio: 2, backgroundColor: '#fff' })
    const a = document.createElement('a'); a.href = url; a.download = `chart.${format}`; a.click()
  }, [getInstanceActual])

  const handleCopy = useCallback(async () => {
    setCopying(true)
    const instance = getInstanceActual()
    if (!instance || typeof instance.getDataURL !== 'function') { setCopying(false); return }
    try {
      const dataUrl = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
      const resp = await fetch(dataUrl)
      const blob = await resp.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 1500)
    } catch {
      // Fallback: download
      const dataUrl = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
      const a = document.createElement('a'); a.href = dataUrl; a.download = 'chart.png'; a.click()
    }
    setCopying(false)
  }, [getInstanceActual])

  const getDataUrl = useCallback((format = 'png') => {
    const instance = getInstanceActual()
    if (!instance || typeof instance.getDataURL !== 'function') return ''
    return instance.getDataURL({ type: format, pixelRatio: 2, backgroundColor: '#fff' })
  }, [getInstanceActual])

  return { chartRef, copying, copyDone, handleExport, handleCopy, getDataUrl, getInstance: getInstanceActual }
}
