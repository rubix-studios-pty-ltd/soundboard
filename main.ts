import type { Settings as SettingsType, HotkeyMap as HotkeyMapType } from '@/types';
import type { BrowserWindow as BrowserWindowType } from 'electron';
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Store from 'electron-store';

app.commandLine.appendSwitch('log-level', '3');
app.disableHardwareAcceleration();

const DEFAULT_SETTINGS = {
    multiSoundEnabled: true,
    repeatSoundEnabled: false,
    alwaysOnTop: false,
    volume: 1
};

interface StoreSchema {
    hotkeys: HotkeyMapType;
    settings: SettingsType;
}

const store = new Store({
    schema: {
        hotkeys: {
            type: 'object'
        },
        settings: {
            type: 'object'
        }
    },
    defaults: {
        hotkeys: {},
        settings: DEFAULT_SETTINGS
    },
    migrations: {
        '1.0.0': (storeMigration: Store<StoreSchema>) => {
            try {
                const settings = storeMigration.get('settings');
                storeMigration.set('settings', {
                    multiSoundEnabled: Boolean(settings?.multiSoundEnabled ?? true),
                    repeatSoundEnabled: Boolean(settings?.repeatSoundEnabled ?? false),
                    alwaysOnTop: Boolean(settings?.alwaysOnTop ?? false),
                    volume: Math.min(1, Math.max(0, Number(settings?.volume) || 1))
                });
            } catch (error) {
                console.error('Migration failed, resetting to defaults:', error);
                storeMigration.set('settings', DEFAULT_SETTINGS);
            }
        }
    }
});

try {
    const settings = store.get('settings');
    if (!settings || typeof settings.volume !== 'number' || isNaN(settings.volume) || settings.volume < 0 || settings.volume > 1) {
        store.set('settings', {
            ...DEFAULT_SETTINGS,
            ...settings,
            volume: 1
        });
    }
} catch (error) {
    console.error('Error validating settings:', error);
    store.set('settings', DEFAULT_SETTINGS);
}

let win: BrowserWindowType | null = null;
const ROOT_PATH = path.join(__dirname, '..');

function createWindow(): void {
    win = new BrowserWindow({
        width: 620,
        height: 986,
        resizable: true,
        alwaysOnTop: store.get('settings')?.alwaysOnTop ?? false,
        autoHideMenuBar: true,
        show: false,
        backgroundColor: '#F0E8E4',
        webPreferences: {
            preload: path.join(ROOT_PATH, 'dist', 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false
        }
    });

    if (win) {
        win.once('ready-to-show', () => {
            win?.show();
        });

        win.loadFile(path.join(ROOT_PATH, 'index.html'));

        if (process.argv.includes('--enable-logging')) {
            win.webContents.openDevTools();
        }
    }
}

function setupIPC(): void {
    ipcMain.handle('load-hotkeys', (): HotkeyMapType => {
        try {
            return store.get('hotkeys') ?? {};
        } catch (error) {
            console.error('Error loading hotkeys:', error);
            return {};
        }
    });

    ipcMain.handle('load-settings', (): SettingsType => {
        try {
            return store.get('settings') ?? DEFAULT_SETTINGS;
        } catch (error) {
            console.error('Error loading settings:', error);
            return DEFAULT_SETTINGS;
        }
    });

    ipcMain.on('save-hotkeys', (_: any, newHotkeys: HotkeyMapType) => {
        try {
            store.set('hotkeys', newHotkeys);
        } catch (error) {
            console.error('Error saving hotkeys:', error);
        }
    });

    ipcMain.on('save-settings', (_: any, settings: SettingsType) => {
        try {
            const validatedSettings: SettingsType = {
                multiSoundEnabled: Boolean(settings.multiSoundEnabled),
                repeatSoundEnabled: Boolean(settings.repeatSoundEnabled),
                alwaysOnTop: Boolean(settings.alwaysOnTop),
                volume: Number(settings.volume)
            };

            if (isNaN(validatedSettings.volume) || validatedSettings.volume < 0 || validatedSettings.volume > 1) {
                validatedSettings.volume = 1;
            }

            store.set('settings', validatedSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
            try {
                store.set('settings', DEFAULT_SETTINGS);
            } catch (e) {
                console.error('Failed to save default settings:', e);
            }
        }
    });

    ipcMain.on('toggle-always-on-top', (_: any, isEnabled: boolean) => {
        try {
            if (win) {
                win.setAlwaysOnTop(isEnabled);
                const currentSettings = store.get('settings') ?? DEFAULT_SETTINGS;
                store.set('settings', { ...currentSettings, alwaysOnTop: isEnabled });
            }
        } catch (error) {
            console.error('Error toggling always-on-top:', error);
        }
    });
}

app.whenReady().then(() => {
    try {
        createWindow();
        setupIPC();
    } catch (error) {
        console.error('Error during startup:', error);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error: Error | unknown) => {
    console.error('Unhandled Rejection:', error);
});
