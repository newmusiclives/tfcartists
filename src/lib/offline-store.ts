/**
 * IndexedDB helper for offline action queuing.
 *
 * When the browser is offline, POST requests (favorites, subscriptions, etc.)
 * are stored in IndexedDB. When connectivity returns, syncAll() replays them.
 */

const DB_NAME = "tfr-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-actions";

export interface PendingAction {
  id?: number;
  action: string;
  url: string;
  body: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Queue an action to be replayed when back online. */
export async function queueAction(
  action: string,
  url: string,
  body: unknown
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const record: PendingAction = {
      action,
      url,
      body: JSON.stringify(body),
      timestamp: Date.now(),
    };

    const request = store.add(record);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Return all pending actions in queue order. */
export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as PendingAction[]);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Remove a single completed action by id. */
export async function clearAction(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Replay all queued POST requests.
 * Each successful request is removed from the queue.
 * Returns the number of successfully synced actions.
 */
export async function syncAll(): Promise<number> {
  const actions = await getPendingActions();
  let synced = 0;

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: action.body,
      });

      if (response.ok && action.id !== undefined) {
        await clearAction(action.id);
        synced++;
      } else if (response.status >= 400 && response.status < 500) {
        // Client error — discard, retrying won't help
        if (action.id !== undefined) {
          await clearAction(action.id);
        }
        console.warn(
          `[OfflineStore] Discarded action "${action.action}" — server returned ${response.status}`
        );
      }
      // 5xx errors are left in the queue for the next sync attempt
    } catch {
      // Still offline or network error — leave in queue
      console.warn(
        `[OfflineStore] Failed to sync "${action.action}" — will retry later`
      );
    }
  }

  if (synced > 0) {
    console.log(`[OfflineStore] Synced ${synced}/${actions.length} actions`);
  }

  return synced;
}
