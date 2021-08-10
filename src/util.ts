import ora from 'ora'
import { promises } from 'fs'
import { download } from './wrap'
import EventEmitter from 'events'

export async function downloader(filename: string, url: string) {
    console.log()
    const deleteSpinner = ora(`Deleting old ${filename}`).start()
    try {
        await promises.unlink(filename)
    } finally {
        deleteSpinner.succeed()
        const downloadSpinner = ora('Downloading...').start()
        await download(url, filename)
        downloadSpinner.succeed()
    }
}

export function sleep(timeout: number) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout)
    })
}

export function limitedTimeEventListener(
    eventEmitter: EventEmitter,
    eventName: string,
    action: () => void,
    timeout: number
) {
    const listener = () => action()
    eventEmitter.on(eventName, listener)
    setTimeout(() => {
        eventEmitter.removeListener(eventName, listener)
    }, timeout)
}
