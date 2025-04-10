const DB_NAME = "soundboard_cache"
const STORE_NAME = "audio_files"
const DB_VERSION = 2

export class AudioDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const { oldVersion } = event

        if (oldVersion < 1) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "url" })
          store.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (oldVersion < 2) {
          const store = request.transaction!.objectStore(STORE_NAME)

          if (!store.indexNames.contains("timestamp")) {
            store.createIndex("timestamp", "timestamp", { unique: false })
          }
        }
      }
    })
  }

  async store(url: string, blob: Blob): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({ url, blob, timestamp: Date.now() })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async get(url: string): Promise<Blob | null> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(url)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.blob)
        } else {
          resolve(null)
        }
      }
    })
  }

  async delete(url: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(url)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

export const audioDB = new AudioDB()
