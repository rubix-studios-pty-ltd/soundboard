import AudioPool from '@/utils/audio-pool';
import HotkeyManager from '@/utils/hotkeys';
import { soundData } from '@/data/audio';
import { musicData } from '@/data/music';
import type { SoundData } from '@/types';
import getSettingsManager from '@/utils/settings';
import { generateSoundId } from '@/utils/sound-id';

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
        
        const settingsManager = getSettingsManager();
        const settings = settingsManager.getSettings();
        this.audioPool = new AudioPool(
            settings.maxPlaybackSounds ?? 100,
            10,
            settings.multiSoundEnabled ?? false
        );
        this.hotkeyManager = new HotkeyManager();
        
        Promise.all([
            this.initializeSettings(),
            this.preloadFrequentSounds()
        ]).then(() => {
            this.initializeSoundboard();
            this.setupEventListeners();
            this.setupSettingsListeners();
        });
    }

    private setupSettingsListeners(): void {
        const settingsManager = getSettingsManager();
        settingsManager.onSettingsChange(settings => {
            if (parseFloat(this.volumeSlider.value) !== settings.volume) {
                this.volumeSlider.value = settings.volume.toString();
                this.audioPool.updateVolume(settings.volume);
            }

            this.audioPool.updateMultiSoundEnabled(settings.multiSoundEnabled ?? false);
        });
    }

    private async preloadFrequentSounds(): Promise<void> {
        const frequentSounds = [
            ...soundData.slice(0, 5),
            ...musicData.slice(0, 5)
        ].filter(sound => sound.frequent !== false);

        const batchSize = 3;
        for (let i = 0; i < frequentSounds.length; i += batchSize) {
            const batch = frequentSounds.slice(i, i + batchSize);
            await Promise.all(
                batch.map(async sound => {
                    try {
                        const response = await fetch(sound.file);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        this.audioPool.preloadSound(url, sound.file);
                    } catch (error) {
                        console.warn(`Failed to preload sound: ${sound.file}`, error);
                    }
                })
            );
        }
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

            if (settings.repeatSoundEnabled) {
                await this.playSound(file, currentVolume, buttonElement, true);
                return;
            }

            if (isPlaying) {
                this.audioPool.stopSpecific(file);
                buttonElement.classList.remove("active");
                return;
            }

            if (!settings.multiSoundEnabled) {
                await this.stopActiveSounds();
            }

            await this.playSound(file, currentVolume, buttonElement, false);

        } catch (error) {
            console.error('Error playing sound:', error);
            buttonElement.classList.remove("active");
            this.audioPool.stopSpecific(file);
        }
    }

    private async playSound(file: string, volume: number, buttonElement: HTMLButtonElement, repeat: boolean): Promise<void> {
        try {
            const response = await fetch(file);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            this.audioPool.preloadSound(url, file);
            await this.audioPool.play(file, volume, repeat, () => {
                buttonElement.classList.remove("active");
            });
            buttonElement.classList.add("active");
        } catch (error) {
            console.error('Error in playSound:', error);
            throw error;
        }
    }

    private async stopActiveSounds(): Promise<void> {
        const soundButtons = Array.from(document.querySelectorAll('.sound-button.active'));
        const uiButtons = Array.from(document.querySelectorAll('.settings-control.active'));
        const activeButtons = soundButtons.filter(btn => !uiButtons.includes(btn));
        
        if (activeButtons.length > 0) {
            for (const btn of activeButtons) {
                const soundId = btn.id;
                const soundFile = this.getSoundFileFromId(soundId);
                if (soundFile && this.audioPool.isPlaying(soundFile)) {
                    this.audioPool.stopSpecific(soundFile);
                    btn.classList.remove("active");
                }
            }
        }
    }

    private getSoundFileFromId(id: string): string | undefined {
        const foundSound = soundData.find(s => s.id === id || generateSoundId(s.file) === id);
        if (foundSound) return foundSound.file;
        
        const foundMusic = musicData.find(s => s.id === id || generateSoundId(s.file) === id);
        return foundMusic?.file;
    }

    private createSoundButton(data: SoundData): HTMLElement {
        const button = this.template.content.cloneNode(true) as HTMLElement;
        const btnElement = button.querySelector('button') as HTMLButtonElement;

        const soundId = data.id ?? generateSoundId(data.file);
        btnElement.id = soundId;
        btnElement.setAttribute('data-sound-id', soundId);
        btnElement.onclick = () => this.toggleSound(data.file, soundId);
        btnElement.oncontextmenu = (e) => {
            e.preventDefault();
            this.hotkeyManager.showModal(soundId);
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
            const soundButtons = document.querySelectorAll('.sound-button:not(.settings-control).active');
            soundButtons.forEach(button => {
                const soundId = button.id;
                const soundFile = this.getSoundFileFromId(soundId);
                if (soundFile) {
                    this.audioPool.stopSpecific(soundFile);
                    button.classList.remove('active');
                }
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
