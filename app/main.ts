declare function showDirectoryPicker(): Promise<FileSystemDirectoryHandle>


export async function pickFolder() {
    if (!('showDirectoryPicker' in window)) return console.error('No file system access')
    const handle = await showDirectoryPicker()
}

const DB_NAME = 'designbase'
const STORE_NAME = 'fs'

function openDb() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => {
            req.result.createObjectStore(STORE_NAME)
        }
        req.onsuccess = () => res(req.result)
        req.onerror = () => rej(req.error)
    })
}

const db = await openDb()

async function set(key, value) {
    
}