import { atomWithStorage } from "jotai/utils"

import isLocalStorageAvailable from "./is-local-storage-available"

type Unsubscribe = () => void

type SyncStorage<Value> = {
  getItem: (key: string) => Value
  setItem: (key: string, newValue: Value) => void
  removeItem: (key: string) => void
  subscribe?: (key: string, callback: (value: Value) => void) => Unsubscribe
}

type SyncStringStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, newValue: string) => void
  removeItem: (key: string) => void
}

export function createSafeStorage<Value>(
  defaultValue: Value,
  getStringStorage: () => SyncStringStorage | undefined
): SyncStorage<Value> {
  let lastStr: string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastValue: any

  const storage: SyncStorage<Value> = {
    getItem: (key) => {
      const parse = (str: string | null) => {
        str = str || ""
        if (lastStr !== str) {
          try {
            lastValue = JSON.parse(str)
          } catch {
            return defaultValue
          }
          lastStr = str
        }
        return lastValue
      }

      const str = getStringStorage()?.getItem(key) ?? null

      return parse(str)
    },
    setItem: (key, newValue) =>
      getStringStorage()?.setItem(key, JSON.stringify(newValue)),
    removeItem: (key) => getStringStorage()?.removeItem(key),
    subscribe: (key, callback) => {
      if (!getStringStorage()) {
        return () => {
          //
        }
      }

      const storageEventCallback = (e: StorageEvent) => {
        if (e.key === key && e.newValue) {
          callback(JSON.parse(e.newValue))
        }
      }

      window.addEventListener("storage", storageEventCallback)

      return () => {
        window.removeEventListener("storage", storageEventCallback)
      }
    }
  }

  return storage
}

const storagePlaceholder = undefined as unknown as Storage

function getSafeStorage<Value>(defaultValue: Value) {
  return createSafeStorage(defaultValue, () =>
    isLocalStorageAvailable() ? window.localStorage : storagePlaceholder
  )
}

export function atomWithSafeStorage<Value>(key: string, initialValue: Value) {
  return atomWithStorage(key, initialValue, getSafeStorage(initialValue))
}
