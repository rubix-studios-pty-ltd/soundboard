interface AudioPoolItem {
    audio: HTMLAudioElement;
    source: string;
    isPlaying: boolean;
    // Track event listeners for proper cleanup
    cleanupListeners: (() => void)[];
    onEnd?: () => void;
}

class AudioPool {
    private pool: Map<string, AudioPoolItem>;
    private maxPoolSize: number;

    constructor(maxPoolSize: number = 10) {
        this.pool = new Map();
        this.maxPoolSize = maxPoolSize;
    }

    private setupAudioListeners(poolItem: AudioPoolItem): void {
        const endedListener = () => {
            poolItem.isPlaying = false;
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
        item.isPlaying = false;
    }

    async play(url: string, source: string, volume: number, repeat: boolean = false, onEnd?: () => void): Promise<void> {
        let poolItem = this.pool.get(source);

        // Clean up stopped audio to free up space
        if (!poolItem) {
            const stoppedItem = this.findStoppedAudio();
            if (stoppedItem) {
                this.cleanupAudioItem(stoppedItem);
                this.pool.delete(stoppedItem.source);
            }

            // Create new audio item if pool has space
            if (this.pool.size < this.maxPoolSize) {
                const audio = new Audio();
                poolItem = {
                    audio,
                    source,
                    isPlaying: false,
                    cleanupListeners: [],
                    onEnd
                };
                this.setupAudioListeners(poolItem);
                this.pool.set(source, poolItem);
            }
        }

        if (poolItem) {
            const { audio } = poolItem;
            poolItem.onEnd = onEnd;
            // Reset audio state
            audio.currentTime = 0;
            audio.src = url;
            audio.volume = volume;
            audio.loop = repeat;

            try {
                await audio.play();
                poolItem.isPlaying = true;
            } catch (error) {
                console.error('Error playing audio:', error);
                poolItem.isPlaying = false;
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
        const item = this.pool.get(source);
        if (item) {
            this.cleanupAudioItem(item);
            this.pool.delete(source);
        }
    }

    updateVolume(volume: number): void {
        this.pool.forEach(({ audio }) => {
            audio.volume = volume;
        });
    }

    isPlaying(source: string): boolean {
        const item = this.pool.get(source);
        return item ? item.isPlaying : false;
    }

    getAudio(source: string): HTMLAudioElement | undefined {
        const item = this.pool.get(source);
        return item?.audio;
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
