import { app, BrowserWindow } from 'electron';
import * as path from 'path';

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') { app.quit(); }});
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { createWindow(); }});