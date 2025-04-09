import type { Settings } from '@/types';

class SettingsManager {
    private multiSoundSwitch: HTMLInputElement;
    private repeatSoundSwitch: HTMLInputElement;
    private alwaysOnTopSwitch: HTMLInputElement;
    private volumeSlider: HTMLInputElement;
    private muteButton: HTMLButtonElement;
    private speakerUnmuted: HTMLElement;
    private speakerMuted: HTMLElement;
    private previousVolume: number;
    private currentSettings: Settings;
    private initialized: Promise<void>;
    private onSettingsChangeCallbacks: ((settings: Settings) => void)[] = [];

    constructor() {
        this.multiSoundSwitch = document.getElementById('multiSoundSwitch') as HTMLInputElement;
        this.repeatSoundSwitch = document.getElementById('repeatSoundSwitch') as HTMLInputElement;
        this.alwaysOnTopSwitch = document.getElementById('alwaysOnTopSwitch') as HTMLInputElement;
        this.volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
        this.muteButton = document.getElementById('muteButton') as HTMLButtonElement;
        this.speakerUnmuted = document.getElementById('speakerUnmuted') as HTMLElement;
        this.speakerMuted = document.getElementById('speakerMuted') as HTMLElement;
        this.previousVolume = 1;
        this.currentSettings = {
            multiSoundEnabled: true,
            repeatSoundEnabled: false,
            alwaysOnTop: false,
            volume: 1,
            hideEnabled: false,
            hiddenSounds: [],
            colorEnabled: false,
            buttonColors: {},
            theme: {
                enabled: false,
                backgroundColor: '#f3f4f6',
                buttonColor: '#4b5563',
                buttonText: '#ffffff',
                buttonActive: '#374151',
                buttonHoverColor: '#404040'
            }
        };

        this.initialized = this.initializeSettings();
        this.setupEventListeners();
    }

    private initializeSettings(): Promise<void> {
        return new Promise<void>((resolve) => {
            window.electronAPI.loadSettings()
                .then(settings => {
                    this.currentSettings = settings;
                    this.applySettings(settings);
                    resolve();
                })
                .catch(error => {
                    console.error('Error initializing settings:', error);
                    resolve();
                });
        });
    }

    private applySettings(settings: Settings): void {
        this.multiSoundSwitch.checked = settings.multiSoundEnabled;
        this.repeatSoundSwitch.checked = settings.repeatSoundEnabled;
        this.alwaysOnTopSwitch.checked = settings.alwaysOnTop;
        this.volumeSlider.value = settings.volume.toString();
        this.updateMuteButtonIcon(settings.volume);
        
        if (typeof settings.hideEnabled === 'undefined') {
            settings.hideEnabled = false;
        }
        if (!Array.isArray(settings.hiddenSounds)) {
            settings.hiddenSounds = [];
        }
        if (typeof settings.colorEnabled === 'undefined') {
            settings.colorEnabled = false;
        }
        if (typeof settings.buttonColors !== 'object' || settings.buttonColors === null) {
            settings.buttonColors = {};
        }

        if (typeof settings.theme !== 'object' || 
            settings.theme === null ||
            typeof settings.theme.buttonText !== 'string' ||
            typeof settings.theme.buttonActive !== 'string' ||
            typeof settings.theme.buttonColor !== 'string' ||
            typeof settings.theme.backgroundColor !== 'string' ||
            typeof settings.theme.buttonHoverColor !== 'string'
        ) {
            settings.theme = {
                enabled: false,
                backgroundColor: '#f3f4f6',
                buttonColor: '#4b5563',
                buttonText: '#ffffff',
                buttonActive: '#374151',
                buttonHoverColor: '#404040'
            };
        }
    }

    async waitForInitialization(): Promise<void> {
        await this.initialized;
    }

    getSettings(): Settings {
        return this.currentSettings;
    }

    private setupEventListeners(): void {
        this.multiSoundSwitch.addEventListener('change', () => {
            this.updateSetting('multiSoundEnabled', this.multiSoundSwitch.checked);
        });

        this.repeatSoundSwitch.addEventListener('change', () => {
            this.updateSetting('repeatSoundEnabled', this.repeatSoundSwitch.checked);
        });

        this.alwaysOnTopSwitch.addEventListener('change', () => {
            this.updateSetting('alwaysOnTop', this.alwaysOnTopSwitch.checked);
            window.electronAPI.toggleAlwaysOnTop(this.alwaysOnTopSwitch.checked);
        });

        this.volumeSlider.addEventListener('input', () => {
            const volume = parseFloat(this.volumeSlider.value);
            this.updateSetting('volume', volume);
            this.updateMuteButtonIcon(volume);
        });

        this.muteButton.addEventListener('click', () => this.toggleMute());
    }

    private updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
        this.currentSettings[key] = value;
        window.electronAPI.saveSettings(this.currentSettings);
        this.onSettingsChangeCallbacks.forEach(callback => callback(this.currentSettings));
    }

    onSettingsChange(callback: (settings: Settings) => void): void {
        this.onSettingsChangeCallbacks.push(callback);
    }

    private updateMuteButtonIcon(volume: number): void {
        if (volume === 0) {
            this.speakerUnmuted.classList.add('hidden');
            this.speakerMuted.classList.remove('hidden');
        } else {
            this.speakerUnmuted.classList.remove('hidden');
            this.speakerMuted.classList.add('hidden');
        }
    }

    private toggleMute(): void {
        const currentVolume = parseFloat(this.volumeSlider.value);
        if (currentVolume > 0) {
            this.previousVolume = currentVolume;
            this.volumeSlider.value = '0';
            this.updateMuteButtonIcon(0);
            this.onSettingsChangeCallbacks.forEach(callback => callback({
                ...this.currentSettings,
                volume: 0
            }));
            this.updateSetting('volume', 0);
        } else {
            this.volumeSlider.value = this.previousVolume.toString();
            this.updateMuteButtonIcon(this.previousVolume);
            this.onSettingsChangeCallbacks.forEach(callback => callback({
                ...this.currentSettings,
                volume: this.previousVolume
            }));
            this.updateSetting('volume', this.previousVolume);
        }
    }
}

let instance: SettingsManager | null = null;

export default function getSettingsManager(): SettingsManager {
    if (!instance) {
        instance = new SettingsManager();
    }
    return instance;
}
