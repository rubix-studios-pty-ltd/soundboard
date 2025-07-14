declare module "electron-store" {
  type JSONValue =
    | string
    | number
    | boolean
    | null
    | JSONValue[]
    | { [key: string]: JSONValue }

  class Store<T = Record<string, unknown>> {
    constructor(options?: Store.Options<T>)
    get<K extends keyof T>(key: K): T[K]
    get<K extends keyof T>(key: K, defaultValue: T[K]): T[K]
    set<K extends keyof T>(key: K, value: T[K]): void
    set(key: string, value: JSONValue): void
    has(key: string): boolean
    reset(...keys: string[]): void
    delete(key: string): void
    clear(): void
    onDidChange<K extends keyof T>(
      key: K,
      callback: (newValue: T[K], oldValue: T[K]) => void
    ): () => void
    size: number
    store: T
    path: string
  }

  namespace Store {
    interface Options<T> {
      name?: string
      cwd?: string
      encoding?: string
      serialize?: (value: T) => string
      deserialize?: (value: string) => T
      defaults?: Partial<T>
      schema?: Record<string, unknown>
      watch?: boolean
      clearInvalidConfig?: boolean
      migrations?: Record<string, (store: Store<T>) => void>
    }
  }

  export = Store
}
