import { useState } from 'react'
import { useTask } from '../contexts/TaskContext'
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react'

export default function TaskPanel() {
  const { tasks, dismissTask, clearDone } = useTask()
  const [expanded, setExpanded] = useState(false)

  if (tasks.length === 0) return null

  const runningTasks = tasks.filter(t => t.status === 'running')
  const doneTasks = tasks.filter(t => t.status !== 'running')

  return (
    <div className="border-t border-gray-100 bg-gray-50/50">
      {/* 折叠标题 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {runningTasks.length > 0 && (
            <Loader2 size={12} className="animate-spin text-blue-500" />
          )}
          <span className="font-medium text-gray-600">
            后台任务 {runningTasks.length > 0 && `(${runningTasks.length} 运行中)`}
          </span>
          {doneTasks.length > 0 && (
            <span className="text-gray-400">· {doneTasks.length} 已完成</span>
          )}
        </div>
        {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {/* 展开列表 */}
      {expanded && (
        <div className="max-h-48 overflow-y-auto border-t border-gray-100">
          {runningTasks.map(task => (
            <div key={task.id} className="px-4 py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2 text-xs">
                <Loader2 size={12} className="animate-spin text-blue-500 flex-shrink-0" />
                <span className="text-gray-700 truncate flex-1">{task.name}</span>
                <span className="text-blue-500 text-[10px]">运行中</span>
              </div>
            </div>
          ))}
          {doneTasks.map(task => (
            <div key={task.id} className="px-4 py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs flex-1 min-w-0">
                  {task.status === 'done' ? (
                    <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={12} className="text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-gray-700 truncate flex-1">{task.name}</span>
                </div>
                <button
                  onClick={() => dismissTask(task.id)}
                  className="p-0.5 hover:bg-gray-200 rounded ml-1 flex-shrink-0"
                >
                  <X size={12} className="text-gray-400" />
                </button>
              </div>
              {task.status === 'done' && task.result && (
                <div className="mt-1 ml-5 text-[10px] text-gray-400 truncate">
                  结果已就绪 ({task.result.length} 字符)
                </div>
              )}
              {task.status === 'error' && task.error && (
                <div className="mt-1 ml-5 text-[10px] text-red-400 truncate">
                  {task.error}
                </div>
              )}
            </div>
          ))}
          {doneTasks.length > 0 && (
            <button
              onClick={clearDone}
              className="w-full text-center text-[10px] text-gray-400 hover:text-gray-600 py-1.5 hover:bg-gray-100"
            >
              清除已完成任务
            </button>
          )}
        </div>
      )}
    </div>
  )
}
