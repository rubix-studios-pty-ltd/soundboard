export interface CachedAudio {
    blobUrl: string;
    lastUsed: number;
    size: number;
}

class AudioCache {
    private cache: Map<string, CachedAudio>;
    private maxCacheSize: number;
    private currentSize: number;

    constructor(maxCacheSize: number = 50 * 1024 * 1024) {
        this.cache = new Map();
        this.maxCacheSize = maxCacheSize;
        this.currentSize = 0;
    }

    async getOrCreate(url: string): Promise<string> {
        const cached = this.cache.get(url);
        if (cached) {
            cached.lastUsed = Date.now();
            return cached.blobUrl;
        }

        try {
            const response = await fetch(url);
            const blob = await response.blob();

            while (this.currentSize + blob.size > this.maxCacheSize && this.cache.size > 0) {
                this.removeLeastRecentlyUsed();
            }

            const blobUrl = URL.createObjectURL(blob);
            this.cache.set(url, {
                blobUrl,
                lastUsed: Date.now(),
                size: blob.size
            });
            this.currentSize += blob.size;

            return blobUrl;
        } catch (error) {
            console.error('Error caching audio:', error);
            throw error;
        }
    }

    private removeLeastRecentlyUsed(): void {
        let oldest: [string, CachedAudio] | null = null;
        
        for (const [url, audio] of this.cache.entries()) {
            if (!oldest || audio.lastUsed < oldest[1].lastUsed) {
                oldest = [url, audio];
            }
        }

        if (oldest) {
            const [url, audio] = oldest;
            URL.revokeObjectURL(audio.blobUrl);
            this.currentSize -= audio.size;
            this.cache.delete(url);
        }
    }

    clear(): void {
        this.cache.forEach(audio => {
            URL.revokeObjectURL(audio.blobUrl);
        });
        this.cache.clear();
        this.currentSize = 0;
    }

    remove(url: string): void {
        const cached = this.cache.get(url);
        if (cached) {
            URL.revokeObjectURL(cached.blobUrl);
            this.currentSize -= cached.size;
            this.cache.delete(url);
        }
    }
}

export default AudioCache;
