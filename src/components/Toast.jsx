import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm animate-[slideIn_0.3s_ease-out] ${
              t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              t.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' :
              t.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                      'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {t.type === 'success' ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" /> :
             t.type === 'error'   ? <XCircle size={16} className="flex-shrink-0 mt-0.5" /> :
             t.type === 'warning' ? <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" /> :
                                     null}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="flex-shrink-0 opacity-50 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
