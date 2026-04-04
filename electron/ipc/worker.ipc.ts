import { type IpcMain, type BrowserWindow } from 'electron'
import { callRealTool } from './mcp.ipc'

interface WorkerTask {
  id: string
  type: 'image_gen' | 'video_gen' | 'content_curation'
  status: 'pending' | 'running' | 'completed' | 'failed'
  payload: any
  result?: any
  error?: string
  createdAt: number
}

const taskQueue: WorkerTask[] = []
let isProcessing = false

export function registerWorkerIPC(ipcMain: IpcMain, win: BrowserWindow) {
  ipcMain.handle('worker:enqueue', (_e, task: Omit<WorkerTask, 'id' | 'status' | 'createdAt'>) => {
    const newTask: WorkerTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'pending',
      createdAt: Date.now()
    }
    taskQueue.push(newTask)
    console.log(`[Worker] Task enqueued: ${newTask.id} (${newTask.type})`)

    if (!isProcessing) {
      void processQueue(win)
    }

    return newTask
  })

  ipcMain.handle('worker:get-status', () => {
    return {
      isProcessing,
      queueSize: taskQueue.length,
      pending: taskQueue.filter(t => t.status === 'pending').length,
      completed: taskQueue.filter(t => t.status === 'completed').length,
      tasks: taskQueue.slice(-10) // Últimas 10 tareas
    }
  })
}

async function processQueue(win: BrowserWindow) {
  if (taskQueue.length === 0) {
    isProcessing = false
    return
  }

  isProcessing = true
  const task = taskQueue.find(t => t.status === 'pending')

  if (!task) {
    isProcessing = false
    return
  }

  task.status = 'running'
  win.webContents.send('worker:update', task)

  try {
    let result: any
    if (task.type === 'image_gen') {
      result = await callRealTool('generate_image', task.payload)
    } else if (task.type === 'video_gen') {
      result = await callRealTool('generate_video', task.payload)
    }

    task.status = 'completed'
    task.result = result
    console.log(`[Worker] Task completed: ${task.id}`)
  } catch (e: any) {
    task.status = 'failed'
    task.error = e.message
    console.error(`[Worker] Task failed: ${task.id}`, e)
  }

  win.webContents.send('worker:update', task)

  // Continuar con la siguiente tarea
  setTimeout(() => void processQueue(win), 1000)
}
