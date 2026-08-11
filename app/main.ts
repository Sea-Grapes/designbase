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
        t.objectStore(STORE_NAME).delete(key)
        t.oncomplete = () => ok()
        t.onerror = () => err(t.error)
    })
}

export async function pickFolder(): Promise<FileSystemDirectoryHandle | null> {
    if (!('showDirectoryPicker' in window)) {
        console.error('No file system access')
        return null
    }
    const handle = await showDirectoryPicker({ mode: 'readwrite' })
    await set('handle', handle)
    return handle
}

async function tryRestoreFolder(): Promise<FileSystemDirectoryHandle | null> {
    const handle = await get('handle') as FileSystemDirectoryHandle
    if (!handle) return null
    let req = await handle.queryPermission({ mode: 'readwrite' })
    if (req !== 'granted') req = await handle.requestPermission({ mode: 'readwrite' })
    return req === 'granted' ? handle : null
}


interface Media {
    path: string
    handle: FileSystemFileHandle
}

async function scanMediaRecursive(dir: FileSystemDirectoryHandle, prefix: string[] = []) {
    const result: Media[] = []

    for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'directory') result.push(...await scanMediaRecursive(handle, [...prefix, name]))
        else if (handle.kind === 'file') {
            result.push({
                path: [...prefix, name].join('/'),
                handle,
            })
        }
    }

    return result
}

export async function scanMedia(root: FileSystemDirectoryHandle) {
    let media_dir
    try {
        media_dir = await root.getDirectoryHandle('media')
    }
    catch {
        media_dir = await root.getDirectoryHandle('media', { create: true })
        return []
    }
    return scanMediaRecursive(media_dir)
}

async function readManifest(root: FileSystemDirectoryHandle) {
    try {
        const h = await root.getFileHandle('manifest.json')
        const file = await h.getFile()
        const text = await file.text()
        return text ? JSON.parse(text) : {}
    }
    catch {
        return {}
    }
}

async function writeManifest(root: FileSystemDirectoryHandle, data) {
    const h = await root.getFileHandle('manifest.json', { create: true })
    const writable = await h.createWritable()
    await writable.write(JSON.stringify(data, null, 2))
    await writable.close()
}

const cards = document.querySelector('.cards')

function createCard(entry: Media, manifest) {
    cards.replaceChildren()
    const card = document.createElement('div')
    card.className = 'card'
    cards.append(card)

    const obs = new IntersectionObserver(async ([e]) => {
        if (!e.isIntersecting) return
        obs.disconnect()

        const file = await entry.handle.getFile()
        const url = URL.createObjectURL(file)

        let display_el
        if (file.type.startsWith('video')) {
            display_el = document.createElement('video') as HTMLVideoElement
            display_el.muted = true
            display_el.loop = true
            display_el.preload = 'metadata'
            display_el.src = url
            await display_el.play()
            // card.addEventListener('click', () => {
            //     if (dom.paused) dom.play()
            //     else dom.pause()
            // })
        }
        else if (file.type.startsWith('image')) {
            display_el = document.createElement('img')
            display_el.src = url
        }

        if (!display_el) return
        card.append(display_el)

        const title = document.createElement('p')
        title.className = 'title'
        title.textContent = file.name
        card.append(title)


    })
    obs.observe(card)
    return card
}


let handle
if (handle) console.log('folder restored')
let media = []
let manifest

const open_folder_btn = document.querySelector<HTMLButtonElement>('.open-folder')
open_folder_btn.addEventListener('click', async e => {
    handle = await pickFolder()
    await handleUpdate()
})

handle = await tryRestoreFolder()
await handleUpdate()

async function handleUpdate() {
    if (!handle) return
    media = await scanMedia(handle)
    manifest = await readManifest(handle)

    console.log('media', media)
    console.log('manifest', manifest)

    for (const item of media) {
        createCard(item, manifest)
    }
}

