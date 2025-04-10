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
    private audioContext: AudioContext;
    private initialized: boolean;
    private loadingSounds: Set<string>;

    constructor(maxPoolSize: number = 100, maxInstancesPerSound: number = 20, multiSoundEnabled: boolean = true) {
        this.pool = new Map();
        this.maxPoolSize = maxPoolSize;
        this.maxInstancesPerSound = maxInstancesPerSound;
        this.audioCache = new AudioCache();
        this.unusedAudioElements = [];
        this.preloadedSounds = new Map();
        this.instanceCounts = new Map();
        this.multiSoundEnabled = multiSoundEnabled;
        this.initialized = false;
        this.audioContext = new AudioContext();
        this.loadingSounds = new Set();
        this.initializeAudioSystem();

        document.addEventListener('click', () => {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }, { once: true });
    }

    private async initializeAudioSystem(): Promise<void> {
        if (this.initialized) {
            return;
        }

        const silentAudio = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA=";
        const warmupCount = Math.min(5, this.maxPoolSize);
    
        for (let i = 0; i < warmupCount; i++) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.crossOrigin = 'anonymous';
            audio.src = silentAudio;
            
            try {
                await audio.play();
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
                this.unusedAudioElements.push(audio);
            } catch (error) {
                console.warn('Audio warmup failed:', error);
            }
        }
    
        this.initialized = true;
    }

    preloadSound(url: string, source: string): void {
        if (!this.loadingSounds.has(source)) {
            this.preloadedSounds.set(source, url);
        }
    }

    isPreloaded(source: string): boolean {
        return this.preloadedSounds.has(source) && !this.loadingSounds.has(source);
    }

    async play(source: string, volume: number, repeat: boolean = false, onEnd?: () => void): Promise<void> {
        if (this.loadingSounds.has(source)) {
            return;
        }

        const url = this.preloadedSounds.get(source);
        if (!url) {
            throw new Error(`Sound ${source} not preloaded`);
        }

        if (!repeat && !this.multiSoundEnabled) {
            this.stopAll();
        }

        else if (!repeat && this.multiSoundEnabled) {
            this.stopSpecific(source);
        }

        else if (repeat && !this.multiSoundEnabled) {
            const currentSounds = new Set<string>();
            for (const [key, item] of this.pool.entries()) {
                if (key.startsWith(source)) {
                    currentSounds.add(key);
                }
            }
            for (const [key, item] of this.pool.entries()) {
                if (!currentSounds.has(key)) {
                    this.cleanupAudioItem(item);
                    this.pool.delete(key);
                }
            }
        }
        
        try {
            this.loadingSounds.add(source);
            await this.playFromUrl(url, source, volume, repeat, onEnd);
        } finally {
            this.loadingSounds.delete(source);
        }
    }

    private getAudioElement(): HTMLAudioElement {
        const audio = this.unusedAudioElements.pop();
        if (audio) {
            return audio;
        }

        const newAudio = new Audio();
        newAudio.preload = 'auto';
        newAudio.crossOrigin = 'anonymous';
        newAudio.load();
        return newAudio;
    }

    private recycleAudioElement(audio: HTMLAudioElement): void {
        audio.src = '';
        audio.load();
        if (this.unusedAudioElements.length < this.maxPoolSize) {
            this.unusedAudioElements.push(audio);
        }
    }

    private setupAudioListeners(poolItem: AudioPoolItem): void {
        const decrementInstanceCount = (source: string) => {
            const currentCount = this.instanceCounts.get(source) || 0;
            this.instanceCounts.set(source, Math.max(0, currentCount - 1));
        };

        const endedListener = () => {
            poolItem.isPlaying = false;
            poolItem.onEnd?.();
            if (poolItem.source) {
                decrementInstanceCount(poolItem.source);
            }
            this.recycleAudioElement(poolItem.audio);
        };
        
        const pauseListener = () => {
            if (!poolItem.audio.ended) {
                poolItem.isPlaying = false;
                poolItem.onEnd?.();
                if (poolItem.source) {
                    decrementInstanceCount(poolItem.source);
                }
            }
        };

        const errorListener = () => {
            poolItem.isPlaying = false;
            poolItem.onEnd?.();
            if (poolItem.source) {
                decrementInstanceCount(poolItem.source);
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
            this.instanceCounts.set(item.source, Math.max(0, currentCount - 1));
        }
        this.recycleAudioElement(item.audio);
    }

    private async playFromUrl(url: string, source: string, volume: number, repeat: boolean = false, onEnd?: () => void): Promise<void> {
        const instanceId = `${source}_${Date.now()}`;
        
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
                        item.cleanupListeners?.forEach(cleanup => cleanup());
                        item.audio.src = '';
                        item.isPlaying = false;
                        this.recycleAudioElement(item.audio);
                        this.pool.delete(oldestKey);
                    }
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
                lruItem[1].cleanupListeners?.forEach(cleanup => cleanup());
                lruItem[1].audio.src = '';
                lruItem[1].isPlaying = false;
                this.recycleAudioElement(lruItem[1].audio);
                this.pool.delete(lruItem[0]);
            } else {
                const stoppedItem = this.findStoppedAudio();
                if (stoppedItem) {
                    const stoppedKey = Array.from(this.pool.entries())
                        .find(([_, item]) => item === stoppedItem)?.[0];
                    if (stoppedKey) {
                        stoppedItem.cleanupListeners?.forEach(cleanup => cleanup());
                        stoppedItem.audio.src = '';
                        stoppedItem.isPlaying = false;
                        this.recycleAudioElement(stoppedItem.audio);
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
            
            const currentCount = this.instanceCounts.get(source) || 0;
            this.instanceCounts.set(source, currentCount + 1);
        } catch (error) {
            console.error('Error playing audio:', error);
            this.stopSpecific(source);
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
        let itemsFound = false;
        for (const [key, item] of this.pool.entries()) {
            if (key.startsWith(source)) {
                this.cleanupAudioItem(item);
                this.pool.delete(key);
                itemsFound = true;
            }
        }
        if (itemsFound) {
            this.instanceCounts.set(source, 0);
        }
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
