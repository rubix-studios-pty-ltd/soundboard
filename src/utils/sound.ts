import AudioPool from '@/utils/audio-pool';
import HotkeyManager from './hotkeys';
import { soundData } from '@/data/audio';
import { musicData } from '@/data/music';
import type { SoundData } from '@/types';
import getSettingsManager from '@/utils/settings';

class SoundboardApp {
    private container1: HTMLElement;
    private container2: HTMLElement;
    private audioPool: AudioPool;
    private hotkeyManager: HotkeyManager;
    private stopAllButton: HTMLButtonElement;
    private template: HTMLTemplateElement;
    private volumeSlider: HTMLInputElement;

    constructor() {
        this.container1 = document.getElementById('container1') as HTMLElement;
        this.container2 = document.getElementById('container2') as HTMLElement;
        this.stopAllButton = document.getElementById('stopAllButton') as HTMLButtonElement;
        this.template = document.getElementById('sound-button-template') as HTMLTemplateElement;
        this.volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
        this.audioPool = new AudioPool();
        this.hotkeyManager = new HotkeyManager();
        
        this.initializeSettings().then(() => {
            this.initializeSoundboard();
            this.setupEventListeners();
            
            const settingsManager = getSettingsManager();
            settingsManager.onSettingsChange(settings => {
                // Update volume if changed
                if (parseFloat(this.volumeSlider.value) !== settings.volume) {
                    this.volumeSlider.value = settings.volume.toString();
                    this.audioPool.updateVolume(settings.volume);
                }

                // Handle multiSound setting changes - only stop sounds if multiSound is disabled
                if (!settings.multiSoundEnabled) {
                    const soundButtons = Array.from(document.querySelectorAll('.sound-button.active'));
                    const uiButtons = Array.from(document.querySelectorAll('.settings-control.active'));
                    const activeButtons = soundButtons.filter(btn => !uiButtons.includes(btn));
                    
                    if (activeButtons.length > 1) {
                        // Stop all but the most recently played sound
                        activeButtons.slice(0, -1).forEach(button => {
                            this.audioPool.stopSpecific(button.id);
                            button.classList.remove('active');
                        });
                    }
                }
            });
        });
    }

    private async initializeSettings(): Promise<void> {
        const settingsManager = getSettingsManager();
        await settingsManager.waitForInitialization();
    }

    private async toggleSound(file: string, buttonId: string): Promise<void> {
        const buttonElement = document.getElementById(buttonId) as HTMLButtonElement;
        const settings = getSettingsManager().getSettings();
        const currentVolume = parseFloat(this.volumeSlider.value);

        try {
            const isPlaying = this.audioPool.isPlaying(file);
            
            // When repeat is enabled, always play a new instance of the sound
            if (settings.repeatSoundEnabled) {
                // Handle multiSound setting
                if (!settings.multiSoundEnabled) {
                    const soundButtons = Array.from(document.querySelectorAll('.sound-button.active'));
                    const uiButtons = Array.from(document.querySelectorAll('.settings-control.active'));
                    const activeButtons = soundButtons.filter(btn => !uiButtons.includes(btn));
                    
                    if (activeButtons.length > 0) {
                        this.audioPool.stopAll();
                        activeButtons.forEach(btn => btn.classList.remove("active"));
                    }
                }

                // Start a new instance of the sound
                const response = await fetch(file);
                const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            await this.audioPool.play(url, file, currentVolume, false, () => {
                buttonElement.classList.remove("active");
            });
            buttonElement.classList.add("active");
            URL.revokeObjectURL(url);
            return;
            }

            // Normal non-repeat behavior
            if (isPlaying) {
                this.audioPool.stopSpecific(file);
                buttonElement.classList.remove("active");
                return;
            }

            // Handle multiSound setting
            if (!settings.multiSoundEnabled) {
                const soundButtons = Array.from(document.querySelectorAll('.sound-button.active'));
                const uiButtons = Array.from(document.querySelectorAll('.settings-control.active'));
                const activeButtons = soundButtons.filter(btn => !uiButtons.includes(btn));
                
                if (activeButtons.length > 0) {
                    this.audioPool.stopAll();
                    activeButtons.forEach(btn => btn.classList.remove("active"));
                }
            }

            // Start playing new sound
            const response = await fetch(file);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            await this.audioPool.play(url, file, currentVolume, false, () => {
                buttonElement.classList.remove("active");
            });
            buttonElement.classList.add("active");

            // Cleanup the blob URL
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error playing sound:', error);
            buttonElement.classList.remove("active");
            // Clean up on error
            this.audioPool.stopSpecific(file);
        }
    }

    private createSoundButton(data: SoundData): HTMLElement {
        const button = this.template.content.cloneNode(true) as HTMLElement;
        const btnElement = button.querySelector('button') as HTMLButtonElement;
        
        btnElement.id = data.id;
        btnElement.setAttribute('data-sound-id', data.id);
        btnElement.onclick = () => this.toggleSound(data.file, data.id);
        btnElement.oncontextmenu = (e) => {
            e.preventDefault();
            this.hotkeyManager.showModal(data.id);
            return false;
        };

        const titleSpan = button.querySelector('.title') as HTMLSpanElement;
        titleSpan.textContent = data.title;

        return button;
    }

    private initializeSoundboard(): void {
        if (!this.container1 || !this.container2) {
            console.error('Could not find soundboard containers');
            return;
        }

        this.container1.innerHTML = '';
        this.container2.innerHTML = '';

        soundData.forEach(data => {
            this.container1.appendChild(this.createSoundButton(data));
        });

        musicData.forEach(data => {
            this.container2.appendChild(this.createSoundButton(data));
        });
    }

    private setupEventListeners(): void {
        this.stopAllButton.addEventListener('click', () => {
            this.audioPool.stopAll();
            const soundButtons = document.querySelectorAll('.sound-button:not(.settings-control)');
            soundButtons.forEach(button => {
                button.classList.remove('active');
            });
        });

        const settingsManager = getSettingsManager();
        settingsManager.onSettingsChange(settings => {
            this.audioPool.updateVolume(settings.volume);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SoundboardApp();
});
