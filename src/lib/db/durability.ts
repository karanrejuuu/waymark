/**
 * Storage Durability Engine
 * Requests persistent storage from the browser to prevent automatic cache/IndexedDB eviction.
 */

export interface StorageStatus {
  supported: boolean;
  persisted: boolean;
  usageBytes: number | null;
  quotaBytes: number | null;
}

export async function checkStorageDurability(): Promise<StorageStatus> {
  if (typeof window === "undefined" || !navigator.storage) {
    return { supported: false, persisted: false, usageBytes: null, quotaBytes: null };
  }

  try {
    const persisted = await navigator.storage.persisted();
    let usageBytes: number | null = null;
    let quotaBytes: number | null = null;

    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage ?? null;
      quotaBytes = estimate.quota ?? null;
    }

    return {
      supported: true,
      persisted,
      usageBytes,
      quotaBytes,
    };
  } catch (err) {
    console.warn("Could not check storage persistence:", err);
    return { supported: true, persisted: false, usageBytes: null, quotaBytes: null };
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.persist) {
    return false;
  }

  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) return true;

    const granted = await navigator.storage.persist();
    return granted;
  } catch (err) {
    console.warn("Storage persistence request error:", err);
    return false;
  }
}
