import { app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let mainWindow;
let widgetWindow;
let isQuiting = false;
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Main Desktop App",
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "media") {
      callback(true);
      return;
    }
    callback(false);
  });
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function createWidgetWindow() {
  widgetWindow = new BrowserWindow({
    title: "Desktop Clock Widget",
    width: 300,
    height: 150,
    x: 50,
    // Position from left edge
    y: 50,
    // Position from top edge
    frame: false,
    // Remove window frame
    alwaysOnTop: true,
    // Keep widget always on top
    skipTaskbar: true,
    // Don't show in taskbar
    resizable: false,
    // Prevent resizing
    minimizable: false,
    // Prevent minimizing
    maximizable: false,
    // Prevent maximizing
    closable: true,
    // Allow closing
    transparent: true,
    // Make background transparent
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  widgetWindow.setAlwaysOnTop(true, "screen-saver");
  widgetWindow.setVisibleOnAllWorkspaces(true);
  const widgetUrl = VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#widget` : `file://${path.join(RENDERER_DIST, "index.html")}#widget`;
  widgetWindow.loadURL(widgetUrl);
  widgetWindow.on("close", (event) => {
    if (!isQuiting) {
      event.preventDefault();
      widgetWindow == null ? void 0 : widgetWindow.hide();
    }
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    isQuiting = true;
    app.quit();
    mainWindow = null;
    widgetWindow = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
    createWidgetWindow();
  }
});
app.on("before-quit", () => {
  isQuiting = true;
});
app.whenReady().then(() => {
  createMainWindow();
  createWidgetWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
