import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const TaskContext = createContext(null)

const STORAGE_KEY = 'paper_toolbox_tasks'

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 只恢复非运行中的任务（页面刷新后running任务已丢失）
      return (parsed || []).filter(t => t.status !== 'running')
    }
  } catch {}
  return []
}

let taskIdCounter = 0

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState(loadTasks)

  // 持久化到 localStorage
  useEffect(() => {
    try {
      const toSave = tasks.filter(t => t.status !== 'running' || Date.now() - t.createdAt < 60000)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch {}
  }, [tasks])

  // 提交一个后台任务
  const submitTask = useCallback((name, asyncFn) => {
    const id = ++taskIdCounter
    const newTask = {
      id,
      name,
      status: 'running',
      result: '',
      error: '',
      createdAt: Date.now(),
    }

    setTasks(prev => [...prev, newTask])

    // 在后台执行
    asyncFn()
      .then(result => {
        setTasks(prev => prev.map(t =>
          t.id === id ? { ...t, status: 'done', result } : t
        ))
      })
      .catch(err => {
        setTasks(prev => prev.map(t =>
          t.id === id ? { ...t, status: 'error', error: err.message || '任务失败' } : t
        ))
      })

    return id
  }, [])

  // 清除单个任务
  const dismissTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  // 清除所有已完成/错误的任务
  const clearDone = useCallback(() => {
    setTasks(prev => prev.filter(t => t.status === 'running'))
  }, [])

  // 获取某个任务的结果
  const getTaskResult = useCallback((id) => {
    return tasks.find(t => t.id === id)
  }, [tasks])

  return (
    <TaskContext.Provider value={{ tasks, submitTask, dismissTask, clearDone, getTaskResult }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTask() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTask must be used within TaskProvider')
  return ctx
}
