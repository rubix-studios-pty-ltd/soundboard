import { audioDB } from '@/utils/indexed-db';

export interface CachedAudio {
    blobUrl: string;
    lastUsed: number;
    size: number;
    priority?: number;
}

interface AudioStats {
    playCount: number;
    lastPlayed: number;
}

class AudioCache {
    private memoryCache: Map<string, CachedAudio>;
    private maxMemCacheSize: number;
    private currentMemSize: number;
    private stats: Map<string, AudioStats>;
    private initialized: boolean;
    private initPromise: Promise<void>;

    constructor(maxMemCacheSize: number = 50 * 1024 * 1024) {
        this.memoryCache = new Map();
        this.maxMemCacheSize = maxMemCacheSize;
        this.currentMemSize = 0;
        this.stats = new Map();
        this.initialized = false;
        this.initPromise = this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            await audioDB.init();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize IndexedDB:', error);
        }
    }

    private updateStats(url: string): void {
        const now = Date.now();
        const stats = this.stats.get(url) || { playCount: 0, lastPlayed: 0 };
        stats.playCount++;
        stats.lastPlayed = now;
        this.stats.set(url, stats);
    }

    private calculatePriority(url: string): number {
        const stats = this.stats.get(url);
        if (!stats) return 0;

        const recencyScore = Math.exp(-((Date.now() - stats.lastPlayed) / (24 * 60 * 60 * 1000)));
        const frequencyScore = Math.log(stats.playCount + 1);
        
        return recencyScore * 0.7 + frequencyScore * 0.3;
    }

    async getOrCreate(url: string): Promise<string> {
        await this.initPromise;

        const memCached = this.memoryCache.get(url);
        if (memCached) {
            memCached.lastUsed = Date.now();
            this.updateStats(url);
            return memCached.blobUrl;
        }

        try {
            let blob: Blob | null = null;
            
            if (this.initialized) {
                blob = await audioDB.get(url);
            }

            if (!blob) {
                const response = await fetch(url);
                blob = await response.blob();
                
                if (this.initialized) {
                    audioDB.store(url, blob).catch(console.error);
                }
            }

            while (this.currentMemSize + blob.size > this.maxMemCacheSize && this.memoryCache.size > 0) {
                this.removeLeastPriority();
            }

            const blobUrl = URL.createObjectURL(blob);
            this.memoryCache.set(url, {
                blobUrl,
                lastUsed: Date.now(),
                size: blob.size,
                priority: this.calculatePriority(url)
            });
            this.currentMemSize += blob.size;
            this.updateStats(url);

            return blobUrl;
        } catch (error) {
            console.error('Error caching audio:', error);
            throw error;
        }
    }

    private removeLeastPriority(): void {
        let lowestPriority: [string, CachedAudio] | null = null;
        
        for (const [url, audio] of this.memoryCache.entries()) {
            if (!lowestPriority || (audio.priority ?? 0) < (lowestPriority[1].priority ?? 0)) {
                lowestPriority = [url, audio];
            }
        }

        if (lowestPriority) {
            const [url, audio] = lowestPriority;
            URL.revokeObjectURL(audio.blobUrl);
            this.currentMemSize -= audio.size;
            this.memoryCache.delete(url);
        }
    }

    clear(): void {
        this.memoryCache.forEach(audio => {
            URL.revokeObjectURL(audio.blobUrl);
        });
        this.memoryCache.clear();
        this.currentMemSize = 0;
    }

    remove(url: string): void {
        const cached = this.memoryCache.get(url);
        if (cached) {
            URL.revokeObjectURL(cached.blobUrl);
            this.currentMemSize -= cached.size;
            this.memoryCache.delete(url);
        }
        if (this.initialized) {
            audioDB.delete(url).catch(console.error);
        }
    }

    preload(url: string): void {
        this.getOrCreate(url).catch(console.error);
    }
}

export default AudioCache;
