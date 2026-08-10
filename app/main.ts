declare function showDirectoryPicker(): Promise<FileSystemDirectoryHandle>


export async function pickFolder() {
    if (!('showDirectoryPicker' in window)) return console.error('No file system access')
    const handle = await showDirectoryPicker()
}

class Db {
    DB_NAME
}

const DB_NAME = 'designbase'
const STORE_NAME = 'fs'

function openDb(): Promise<IDBDatabase> {
    return new Promise((ok, err) => {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => {
            req.result.createObjectStore(STORE_NAME)
        }
        req.onsuccess = () => ok(req.result)
        req.onerror = () => err(req.error)
    })
}

const db = await openDb()

function set(key, value): Promise<void> {
    return new Promise((ok, err) => {
        const t = db.transaction(STORE_NAME, 'readwrite')
        t.objectStore(STORE_NAME).put(value, key)
        t.oncomplete = () => ok()
        t.onerror = () => err(t.error)
    })
}

function get(key: IDBValidKey): Promise<unknown> {
    return new Promise((ok, err) => {
        const t = db.transaction(STORE_NAME, 'readonly')
        const req = t.objectStore(STORE_NAME).get(key)
        req.onsuccess = () => ok(req.result)
        req.onerror = () => err(req.error)
    })
}

function del(key: IDBValidKey): Promise<void> {
    return new Promise((ok, err) => {
        const t = db.transaction(STORE_NAME, 'readwrite')
        
    })
}