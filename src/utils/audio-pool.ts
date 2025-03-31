export interface AudioPoolItem {
    audio: HTMLAudioElement;
    source: string;
    isPlaying: boolean;
    cleanupListeners: (() => void)[];
    onEnd?: () => void;
    blobUrl?: string;  // Store blob URL for cleanup
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
            this.pool.delete(poolItem.source);
        };

        poolItem.audio.addEventListener('ended', endedListener);
        poolItem.audio.addEventListener('pause', pauseListener);
        poolItem.audio.addEventListener('error', errorListener);

        // Store cleanup function
        poolItem.cleanupListeners = [
            () => poolItem.audio.removeEventListener('ended', endedListener),
            () => poolItem.audio.removeEventListener('pause', pauseListener),
            () => poolItem.audio.removeEventListener('error', errorListener)
        ];
    }

    private cleanupAudioItem(item: AudioPoolItem): void {
        item.cleanupListeners?.forEach(cleanup => cleanup());
        item.audio.pause();
        item.audio.currentTime = 0;
        item.audio.src = '';
        if (item.blobUrl) {
            URL.revokeObjectURL(item.blobUrl);
            item.blobUrl = undefined;
        }
        item.isPlaying = false;
    }

    async play(url: string, source: string, volume: number, repeat: boolean = false, onEnd?: () => void): Promise<void> {
        let poolItem = this.pool.get(source);

        if (repeat || !poolItem) {
            const stoppedItem = this.findStoppedAudio();
            if (stoppedItem) {
                this.cleanupAudioItem(stoppedItem);
                this.pool.delete(stoppedItem.source);
            }

            if (this.pool.size < this.maxPoolSize) {
                const audio = new Audio();
                poolItem = {
                    audio,
                    source,
                    isPlaying: false,
                    cleanupListeners: [],
                    onEnd,
                    blobUrl: url  // Store the blob URL
                };
                this.setupAudioListeners(poolItem);
                const key = repeat ? `${source}_${Date.now()}` : source;
                this.pool.set(key, poolItem);
            }
        } else if (poolItem && !repeat) {
            // Clean up previous blob URL if it exists
            if (poolItem.blobUrl && poolItem.blobUrl !== url) {
                URL.revokeObjectURL(poolItem.blobUrl);
            }
            poolItem.blobUrl = url;
            poolItem.onEnd = onEnd;
        }

        if (poolItem) {
            const { audio } = poolItem;
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
        } else {
            console.warn('Audio pool is full. Cannot play more sounds simultaneously.');
        }
    }

    stopAll(): void {
        this.pool.forEach(item => {
            this.cleanupAudioItem(item);
        });
        this.pool.clear();
    }

    stopSpecific(source: string): void {
        // Find and stop all instances of the sound (for repeat mode)
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
        // Check if any instance of this sound is playing (for repeat mode)
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
            // Check both isPlaying flag and actual audio state
            if (!item.isPlaying && (item.audio.ended || item.audio.paused)) {
                return item;
            }
        }
        return undefined;
    }
}

export default AudioPool;
