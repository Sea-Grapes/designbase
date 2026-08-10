declare function showDirectoryPicker(): Promise<FileSystemDirectoryHandle>


async function pickFolder() {
    if (!('showDirectoryPicker' in window)) return console.error('No file system access')
    const handle = await showDirectoryPicker()
}
