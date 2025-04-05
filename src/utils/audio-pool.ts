import AudioCache from '@/utils/audio-cache';

export interface AudioPoolItem {
    audio: HTMLAudioElement;
    source: string;
    isPlaying: boolean;
    cleanupListeners: (() => void)[];
    onEnd?: () => void;
    lastUsed: number;
}

class AudioPool {
    private pool: Map<string, AudioPoolItem>;
    private maxPoolSize: number;
    private maxInstancesPerSound: number;
    private multiSoundEnabled: boolean;
    private audioCache: AudioCache;
    private unusedAudioElements: HTMLAudioElement[];
    private preloadedSounds: Map<string, string>;
    private instanceCounts: Map<string, number>;

    constructor(maxPoolSize: number = 100, maxInstancesPerSound: number = 10, multiSoundEnabled: boolean = true) {
        this.pool = new Map();
        this.maxPoolSize = maxPoolSize;
        this.maxInstancesPerSound = maxInstancesPerSound;
        this.audioCache = new AudioCache();
        this.unusedAudioElements = [];
        this.preloadedSounds = new Map();
        this.instanceCounts = new Map();
        this.multiSoundEnabled = multiSoundEnabled;

        for (let i = 0; i < Math.min(maxPoolSize, 10); i++) {
            this.unusedAudioElements.push(new Audio());
        }
    }

    preloadSound(url: string, source: string): void {
        this.preloadedSounds.set(source, url);
    }

    isPreloaded(source: string): boolean {
        return this.preloadedSounds.has(source);
    }

    async play(source: string, volume: number, repeat: boolean = false, onEnd?: () => void): Promise<void> {
        const url = this.preloadedSounds.get(source);
        if (!url) {
            throw new Error(`Sound ${source} not preloaded`);
        }
        return this.playFromUrl(url, source, volume, repeat, onEnd);
    }

    private getAudioElement(): HTMLAudioElement {
        return this.unusedAudioElements.pop() || new Audio();
    }

    private recycleAudioElement(audio: HTMLAudioElement): void {
        audio.src = '';
        audio.load();
        if (this.unusedAudioElements.length < this.maxPoolSize) {
            this.unusedAudioElements.push(audio);
        }
    }

    private setupAudioListeners(poolItem: AudioPoolItem): void {
        const endedListener = () => {
            poolItem.isPlaying = false;
            poolItem.onEnd?.();
            if (poolItem.source) {
                const currentCount = this.instanceCounts.get(poolItem.source) || 0;
                if (currentCount > 0) {
                    this.instanceCounts.set(poolItem.source, currentCount - 1);
                }
            }
            this.recycleAudioElement(poolItem.audio);
        };
        
        const pauseListener = () => {
            if (!poolItem.audio.ended) {
                poolItem.isPlaying = false;
                poolItem.onEnd?.();
            }
        };

        const errorListener = () => {
            poolItem.isPlaying = false;
            poolItem.onEnd?.();
            if (poolItem.source) {
                const currentCount = this.instanceCounts.get(poolItem.source) || 0;
                if (currentCount > 0) {
                    this.instanceCounts.set(poolItem.source, currentCount - 1);
                }
            }
            const itemKey = Array.from(this.pool.entries())
                .find(([_, item]) => item === poolItem)?.[0];
            if (itemKey) {
                this.pool.delete(itemKey);
            }
            this.recycleAudioElement(poolItem.audio);
        };

        poolItem.audio.addEventListener('ended', endedListener);
        poolItem.audio.addEventListener('pause', pauseListener);
        poolItem.audio.addEventListener('error', errorListener);

        poolItem.cleanupListeners = [
            () => poolItem.audio.removeEventListener('ended', endedListener),
            () => poolItem.audio.removeEventListener('pause', pauseListener),
            () => poolItem.audio.removeEventListener('error', errorListener)
        ];
    }

    private cleanupAudioItem(item: AudioPoolItem): void {
        item.cleanupListeners?.forEach(cleanup => cleanup());
        item.audio.src = '';
        item.isPlaying = false;
        if (item.source) {
            const currentCount = this.instanceCounts.get(item.source) || 0;
            if (currentCount > 0) {
                this.instanceCounts.set(item.source, currentCount - 1);
            }
        }
        this.recycleAudioElement(item.audio);
    }

    private async playFromUrl(url: string, source: string, volume: number, repeat: boolean = false, onEnd?: () => void): Promise<void> {
            const instanceId = repeat ? `${source}_${Date.now()}` : source;
            if (repeat) {
                const currentCount = this.instanceCounts.get(source) || 0;
                if (currentCount >= this.maxInstancesPerSound) {
                let oldestKey: string | undefined;
                let oldestTime = Date.now();

                for (const [key, item] of this.pool.entries()) {
                    if (key.startsWith(source) && item.lastUsed < oldestTime) {
                        oldestKey = key;
                        oldestTime = item.lastUsed;
                    }
                }

                if (oldestKey) {
                    const item = this.pool.get(oldestKey);
                    if (item) {
                        this.cleanupAudioItem(item);
                        this.pool.delete(oldestKey);
                    }
                }
            }
    } else if (!this.multiSoundEnabled) {
            // When multiSound is disabled, stop all instances of this sound
            for (const [key, item] of this.pool.entries()) {
                if (key.startsWith(source)) {
                    this.cleanupAudioItem(item);
                    this.pool.delete(key);
                }
            }
        }

        if (this.pool.size >= this.maxPoolSize) {
            let lruItem: [string, AudioPoolItem] | undefined;
            for (const [key, item] of this.pool.entries()) {
                if (!item.isPlaying && (!lruItem || item.lastUsed < lruItem[1].lastUsed)) {
                    lruItem = [key, item];
                }
            }
            if (lruItem) {
                this.cleanupAudioItem(lruItem[1]);
                this.pool.delete(lruItem[0]);
            } else {
                const stoppedItem = this.findStoppedAudio();
                if (stoppedItem) {
                    const stoppedKey = Array.from(this.pool.entries())
                        .find(([_, item]) => item === stoppedItem)?.[0];
                    if (stoppedKey) {
                        this.cleanupAudioItem(stoppedItem);
                        this.pool.delete(stoppedKey);
                    }
                } else {
                    console.warn('Audio pool is full. Cannot play more sounds simultaneously.');
                    return;
                }
            }
        }

        try {
            const audioElement = this.getAudioElement();
            const blobUrl = await this.audioCache.getOrCreate(url);
            
            const poolItem: AudioPoolItem = {
                audio: audioElement,
                source,
                isPlaying: false,
                cleanupListeners: [],
                onEnd,
                lastUsed: Date.now()
            };
            
            this.setupAudioListeners(poolItem);
            this.pool.set(instanceId, poolItem);

            audioElement.currentTime = 0;
            audioElement.src = blobUrl;
            audioElement.volume = volume;
            audioElement.loop = false;

            await audioElement.play();
            poolItem.isPlaying = true;
            poolItem.lastUsed = Date.now();

            if (repeat || this.multiSoundEnabled) {
                const currentCount = this.instanceCounts.get(source) || 0;
                this.instanceCounts.set(source, currentCount + 1);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            this.pool.delete(source);
            const audioElement = this.pool.get(source)?.audio;
            if (audioElement) {
                this.recycleAudioElement(audioElement);
            }
            throw error;
        }
    }

    stopAll(): void {
        this.pool.forEach(item => {
            this.cleanupAudioItem(item);
        });
        this.pool.clear();
        this.instanceCounts.clear();
    }

    stopSpecific(source: string): void {
        for (const [key, item] of this.pool.entries()) {
            if (key.startsWith(source)) {
                this.cleanupAudioItem(item);
                this.pool.delete(key);
            }
        }
        this.instanceCounts.delete(source);
    }

    updateVolume(volume: number): void {
        this.pool.forEach(({ audio }) => {
            audio.volume = volume;
        });
    }

    updateMultiSoundEnabled(enabled: boolean): void {
        this.multiSoundEnabled = enabled;
    }

    isPlaying(source: string): boolean {
        for (const [key, item] of this.pool.entries()) {
            if (key.startsWith(source) && item.isPlaying) {
                return true;
            }
        }
        return false;
    }

    getAudio(source: string): HTMLAudioElement | undefined {
        const item = this.pool.get(source);
        return item?.audio;
    }

    getPlayingAudios(): Map<string, AudioPoolItem> {
        return this.pool;
    }

    private findStoppedAudio(): AudioPoolItem | undefined {
        for (const [, item] of this.pool) {
            if (!item.isPlaying && (item.audio.ended || item.audio.paused)) {
                return item;
            }
        }
        return undefined;
    }
}

export default AudioPool;
