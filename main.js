const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: add an icon later
        title: 'Image Border App'
    });

    mainWindow.loadFile('index.html');

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle file selection
ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            {
                name: 'Images',
                extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
            }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// Handle multiple file selection for bulk processing
ipcMain.handle('select-multiple-images', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            {
                name: 'Images',
                extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
            }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths;
    }
    return [];
});

// Handle bulk save - save multiple images to a selected folder
ipcMain.handle('bulk-save-images', async (event, imageDataArray, borderSize, borderColor) => {
    // First, let user select output folder
    const folderResult = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select output folder for bordered images'
    });

    if (folderResult.canceled || !folderResult.filePaths.length) {
        return { success: false, error: 'No output folder selected' };
    }

    const outputFolder = folderResult.filePaths[0];
    const results = [];

    try {
        for (let i = 0; i < imageDataArray.length; i++) {
            const { dataUrl, originalPath } = imageDataArray[i];

            const ext = path.extname(originalPath) || '.png';
            const baseName = path.basename(originalPath, ext);
            const colorSuffix = borderColor === '#ffffff' ? 'white' : borderColor.replace('#', '');
            const fileName = `bordered_${baseName}_4x5_${borderSize}pct_${colorSuffix}${ext}`;
            const outputPath = path.join(outputFolder, fileName);

            try {
                // Remove data URL prefix to get base64 data
                const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                fs.writeFileSync(outputPath, buffer);
                results.push({ success: true, path: outputPath, originalPath });
            } catch (error) {
                results.push({ success: false, error: error.message, originalPath });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        return {
            success: true,
            results,
            summary: {
                total: results.length,
                successful: successCount,
                failed: failCount,
                outputFolder
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Handle file save
ipcMain.handle('save-image', async (event, dataUrl, originalPath, borderSize, borderColor) => {
    const ext = path.extname(originalPath) || '.png';
    const baseName = path.basename(originalPath, ext);
    const colorSuffix = borderColor === '#ffffff' ? 'white' : borderColor.replace('#', '');
    const defaultName = `bordered_${baseName}_4x5_${borderSize}pct_${colorSuffix}${ext}`;

    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [
            {
                name: 'Images',
                extensions: ['png', 'jpg', 'jpeg']
            }
        ]
    });

    if (!result.canceled && result.filePath) {
        try {
            // Remove data URL prefix to get base64 data
            const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            fs.writeFileSync(result.filePath, buffer);
            return { success: true, path: result.filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    return { success: false, error: 'Save cancelled' };
});
