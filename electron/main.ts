import { app, BrowserWindow, ipcMain, Menu, nativeImage, powerSaveBlocker, shell, Tray } from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'

const currentDir = dirname(fileURLToPath(import.meta.url))
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let blockerId: number | null = null

function storePath(name: string) {
  return join(app.getPath('userData'), `${name}.json`)
}

async function readStore(name: string) {
  try {
    return JSON.parse(await readFile(storePath(name), 'utf8')) as unknown
  } catch {
    return null
  }
}

async function writeStore(name: string, value: unknown) {
  await mkdir(app.getPath('userData'), { recursive: true })
  const target = storePath(name)
  const temporary = `${target}.tmp`
  await writeFile(temporary, JSON.stringify(value), 'utf8')
  await rename(temporary, target)
}

function createWindow() {
  const iconPath = app.isPackaged ? join(process.resourcesPath, 'icon.png') : join(app.getAppPath(), 'build/icon.png')
  const preloadPath = join(currentDir, 'preload.cjs')
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: '#0d0912',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0d0912', symbolColor: '#d8b4fe', height: 42 },
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) void mainWindow.loadURL(devUrl)
  else void mainWindow.loadFile(join(currentDir, '../dist/index.html'))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

function createTray() {
  const iconPath = app.isPackaged ? join(process.resourcesPath, 'icon.png') : join(app.getAppPath(), 'build/icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 20, height: 20 })
  tray = new Tray(icon)
  tray.setToolTip('AlarmeBin — alarmes ativos em segundo plano')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir AlarmeBin', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { type: 'separator' },
    { label: 'Sair', click: () => { isQuitting = true; app.quit() } }
  ]))
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus() })
}

const hasLock = app.requestSingleInstanceLock()
if (!hasLock) app.quit()
else {
  app.on('second-instance', () => { mainWindow?.show(); mainWindow?.focus() })
  app.whenReady().then(() => {
    ipcMain.handle('store:read', (_event, name: string) => readStore(name))
    ipcMain.handle('store:write', (_event, name: string, value: unknown) => writeStore(name, value))
    ipcMain.handle('app:set-startup', (_event, enabled: boolean) => {
      app.setLoginItemSettings({ openAtLogin: enabled, args: ['--hidden'] })
      return app.getLoginItemSettings().openAtLogin
    })
    ipcMain.handle('app:get-startup', () => app.getLoginItemSettings().openAtLogin)
    ipcMain.on('alarm:started', () => {
      if (blockerId === null) blockerId = powerSaveBlocker.start('prevent-app-suspension')
      mainWindow?.show()
      mainWindow?.setAlwaysOnTop(true, 'screen-saver')
      mainWindow?.focus()
    })
    ipcMain.on('alarm:stopped', () => {
      if (blockerId !== null && powerSaveBlocker.isStarted(blockerId)) powerSaveBlocker.stop(blockerId)
      blockerId = null
      mainWindow?.setAlwaysOnTop(false)
    })
    createWindow()
    createTray()
    if (process.argv.includes('--hidden')) mainWindow?.hide()
  })
}

app.on('before-quit', () => { isQuitting = true })
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Mantém o processo vivo na bandeja para disparar alarmes.
  }
})
