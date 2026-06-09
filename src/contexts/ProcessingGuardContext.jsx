import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const ProcessingGuardContext = createContext(null)

export function ProcessingGuardProvider({ children }) {
  const [processing, setProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const pendingNavRef = useRef(null)

  // Block browser refresh/close during processing
  useEffect(() => {
    if (processing) {
      const handler = (e) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [processing])

  const startProcessing = useCallback((message = '正在处理，请勿切换页面或关闭浏览器') => {
    setProcessing(true)
    setProcessingMessage(message)
  }, [])

  const stopProcessing = useCallback(() => {
    setProcessing(false)
    setProcessingMessage('')
    pendingNavRef.current = null
  }, [])

  const isProcessing = useCallback(() => processing, [processing])

  return (
    <ProcessingGuardContext.Provider value={{
      processing, processingMessage, startProcessing, stopProcessing, isProcessing,
      pendingNavRef,
    }}>
      {children}
    </ProcessingGuardContext.Provider>
  )
}

export function useProcessingGuard() {
  const ctx = useContext(ProcessingGuardContext)
  if (!ctx) throw new Error('useProcessingGuard must be used within ProcessingGuardProvider')
  return ctx
}
