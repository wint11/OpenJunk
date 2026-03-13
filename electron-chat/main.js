const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');

// 窗口配置
const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 400;

let mainWindow = null;
let tray = null;
let isQuiting = false;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 200,
    minHeight: 200,
    maxWidth: 600,
    maxHeight: 800,
    resizable: false, // 固定大小
    frame: false, // 无边框
    transparent: true, // 开启透明
    hasShadow: false, // 去除阴影
    alwaysOnTop: true, // 默认置顶（桌宠通常置顶）
    skipTaskbar: true, // 不在任务栏显示
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#00000000', // 透明背景
    titleBarStyle: 'hidden'
  });

  // 加载本地HTML文件
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // 加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 窗口关闭时最小化到托盘
  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  
  // 设置忽略鼠标事件，实现点击穿透
  // 默认不穿透，由前端控制
  // mainWindow.setIgnoreMouseEvents(false);
}

// 创建托盘图标
function createTrayIcon() {
  // 16x16 蓝色方块
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF, 0x61, 0x00, 0x00, 0x00,
    0x4A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0xFC, 0xCF, 0xC0, 0x00,
    0x20, 0x10, 0x10, 0x10, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60,
    0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60,
    0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60,
    0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60,
    0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60,
    0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x00, 0xE4, 0xC7, 0x01, 0x03, 0x00,
    0x01, 0x13, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  try {
    return nativeImage.createFromBuffer(pngData);
  } catch (e) {
    return nativeImage.createEmpty();
  }
}

// 创建系统托盘
function createTray() {
  try {
    const trayIcon = createTrayIcon();
    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示/隐藏',
        click: () => toggleWindow()
      },
      {
        label: '设置',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('open-settings');
          }
        }
      },
      {
        label: '置顶窗口',
        type: 'checkbox',
        checked: false,
        click: (menuItem) => {
          if (mainWindow) {
            mainWindow.setAlwaysOnTop(menuItem.checked);
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          isQuiting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('OpenJunk Chat');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => toggleWindow());
  } catch (e) {
    console.error('创建托盘失败:', e);
  }
}

// 切换窗口显示/隐藏
function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

// 注册全局快捷键
function registerShortcuts() {
  globalShortcut.register('Alt+Q', () => toggleWindow());
}

// 应用就绪
app.whenReady().then(() => {
  createWindow();
  setTimeout(createTray, 1000);
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => isQuiting = true);
app.on('will-quit', () => globalShortcut.unregisterAll());

// IPC 通信
ipcMain.handle('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('toggle-always-on-top', () => {
  if (mainWindow) {
    const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
    return !isAlwaysOnTop;
  }
  return false;
});

ipcMain.handle('set-window-size', (event, width, height) => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
  }
});

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setIgnoreMouseEvents(ignore, options);
  }
});

// 窗口移动 IPC
ipcMain.handle('window-move', (event, deltaX, deltaY) => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + deltaX, y + deltaY);
  }
});
