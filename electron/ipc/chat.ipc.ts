import { type IpcMain, type BrowserWindow } from 'electron'
import { attachChatRuntimeHandlers } from './chat-runtime'

export function registerChatIPC(ipcMain: IpcMain, win: BrowserWindow) {
  attachChatRuntimeHandlers(ipcMain, win)
}
