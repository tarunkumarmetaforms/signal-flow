import { app, BrowserWindow } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let mainWindow: BrowserWindow | null
let widgetWindow: BrowserWindow | null
let isQuiting = false

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Main Desktop App',
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Open DevTools by default
  mainWindow.webContents.openDevTools()

  // Handle permission requests for media access
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true) // Grant permission
      return
    }
    callback(false) // Deny other permissions
  })

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function createWidgetWindow() {
  widgetWindow = new BrowserWindow({
    title: 'Desktop Clock Widget',
    width: 300,
    height: 150,
    x: 50, // Position from left edge
    y: 50, // Position from top edge
    frame: false, // Remove window frame
    alwaysOnTop: true, // Keep widget always on top
    skipTaskbar: true, // Don't show in taskbar
    resizable: false, // Prevent resizing
    minimizable: false, // Prevent minimizing
    maximizable: false, // Prevent maximizing
    closable: true, // Allow closing
    transparent: true, // Make background transparent
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Keep widget always on top even when other windows are focused
  widgetWindow.setAlwaysOnTop(true, 'screen-saver')
  widgetWindow.setVisibleOnAllWorkspaces(true)

  // Load widget HTML - we'll create a separate widget page
  const widgetUrl = VITE_DEV_SERVER_URL 
    ? `${VITE_DEV_SERVER_URL}#widget` 
    : `file://${path.join(RENDERER_DIST, 'index.html')}#widget`
  
  widgetWindow.loadURL(widgetUrl)

  // Prevent widget from being closed accidentally
  widgetWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault()
      widgetWindow?.hide()
    }
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    isQuiting = true
    app.quit()
    mainWindow = null
    widgetWindow = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
    createWidgetWindow()
  }
})

app.on('before-quit', () => {
  isQuiting = true
})

app.whenReady().then(() => {
  createMainWindow()
  createWidgetWindow()
})
