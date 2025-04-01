export interface AudioPoolItem {
    audio: HTMLAudioElement;
    source: string;
    isPlaying: boolean;
    cleanupListeners: (() => void)[];
    onEnd?: () => void;
    blobUrl?: string;
}

class AudioPool {
    private pool: Map<string, AudioPoolItem>;
    private maxPoolSize: number;

    constructor(maxPoolSize: number = 50) {
        this.pool = new Map();
        this.maxPoolSize = maxPoolSize;
    }

    private setupAudioListeners(poolItem: AudioPoolItem): void {
        const endedListener = () => {
            poolItem.isPlaying = false;
            if (poolItem.blobUrl) {
                URL.revokeObjectURL(poolItem.blobUrl);
                poolItem.blobUrl = undefined;
            }
            poolItem.onEnd?.();
        };
        
        const pauseListener = () => {
            if (!poolItem.audio.ended) {
                poolItem.isPlaying = false;
                poolItem.onEnd?.();
            }
        };

        const errorListener = () => {
            poolItem.isPlaying = false;
            if (poolItem.blobUrl) {
                URL.revokeObjectURL(poolItem.blobUrl);
                poolItem.blobUrl = undefined;
            }
            poolItem.onEnd?.();
            const itemKey = Array.from(this.pool.entries())
                .find(([_, item]) => item === poolItem)?.[0];
            if (itemKey) {
                this.pool.delete(itemKey);
            }
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
        if (item.blobUrl) {
            URL.revokeObjectURL(item.blobUrl);
            item.blobUrl = undefined;
        }
        item.audio.src = '';
        item.audio.remove();
        item.isPlaying = false;
    }

    async play(url: string, source: string, volume: number, repeat: boolean = false, onEnd?: () => void): Promise<void> {
        const existingItem = this.pool.get(source);
        if (existingItem) {
            this.cleanupAudioItem(existingItem);
            this.pool.delete(source);
        }

        if (this.pool.size >= this.maxPoolSize) {
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

        const audio = new Audio();
        const key = repeat ? `${source}_${Date.now()}` : source;
        const poolItem: AudioPoolItem = {
            audio,
            source,
            isPlaying: false,
            cleanupListeners: [],
            onEnd,
            blobUrl: url
        };
        
        this.setupAudioListeners(poolItem);
        this.pool.set(key, poolItem);

        audio.currentTime = 0;
        audio.src = url;
        audio.volume = volume;
        audio.loop = false;

        try {
            await audio.play();
            poolItem.isPlaying = true;
        } catch (error) {
            console.error('Error playing audio:', error);
            poolItem.isPlaying = false;
            if (poolItem.blobUrl) {
                URL.revokeObjectURL(poolItem.blobUrl);
                poolItem.blobUrl = undefined;
            }
            this.pool.delete(source);
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
