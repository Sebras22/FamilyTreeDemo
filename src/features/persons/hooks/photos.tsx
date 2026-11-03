import { useEffect, useState, useSyncExternalStore } from 'react'
import { api } from '@/shared/api/api'

const cache = new Map<string, Promise<string | null>>()
const versions = new Map<number, number>()
const listeners = new Set<() => void>()

export function invalidatePhoto(personId: number) {
  for (const key of [...cache.keys()]) {
    if (key.endsWith(`:${personId}`)) {
      cache.get(key)?.then((url) => url && URL.revokeObjectURL(url))
      cache.delete(key)
    }
  }
  versions.set(personId, (versions.get(personId) ?? 0) + 1)
  listeners.forEach((l) => l())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function usePhoto(personId: number, hasPhoto: boolean): string | null {
  const version = useSyncExternalStore(subscribe, () => versions.get(personId) ?? 0)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!hasPhoto) {
      setUrl(null)
      return
    }
    const key = `${version}:${personId}`
    let promise = cache.get(key)
    if (!promise) {
      promise = api.photo(personId).then((blob) => URL.createObjectURL(blob)).catch(() => null)
      cache.set(key, promise)
    }
    let cancelled = false
    promise.then((u) => !cancelled && setUrl(u))
    return () => {
      cancelled = true
    }
  }, [personId, hasPhoto, version])

  return url
}
