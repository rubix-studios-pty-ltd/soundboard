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
    private audioCache: AudioCache;
    private unusedAudioElements: HTMLAudioElement[];

    constructor(maxPoolSize: number = 50) {
        this.pool = new Map();
        this.maxPoolSize = maxPoolSize;
        this.audioCache = new AudioCache();
        this.unusedAudioElements = [];

        for (let i = 0; i < Math.min(maxPoolSize, 10); i++) {
            this.unusedAudioElements.push(new Audio());
        }
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
        this.recycleAudioElement(item.audio);
    }

    async play(url: string, source: string, volume: number, repeat: boolean = false, onEnd?: () => void): Promise<void> {
        const existingItem = this.pool.get(source);
        if (existingItem) {
            this.cleanupAudioItem(existingItem);
            this.pool.delete(source);
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
            const key = repeat ? `${source}_${Date.now()}` : source;
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
            this.pool.set(key, poolItem);

            audioElement.currentTime = 0;
            audioElement.src = blobUrl;
            audioElement.volume = volume;
            audioElement.loop = false;

            await audioElement.play();
            poolItem.isPlaying = true;
            poolItem.lastUsed = Date.now();
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
    }

    stopSpecific(source: string): void {
        for (const [key, item] of this.pool.entries()) {
            if (key.startsWith(source)) {
                this.cleanupAudioItem(item);
                this.pool.delete(key);
            }
        }
    }

    updateVolume(volume: number): void {
        this.pool.forEach(({ audio }) => {
            audio.volume = volume;
        });
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
