import download_w from 'download'
import { promises } from 'fs'

export function download(url: string, filename: string) {
    return download_w(url, '.', { filename })
}

export async function readFile<T>(path: string) {
    return JSON.parse((await promises.readFile(path)).toString()) as T
}
