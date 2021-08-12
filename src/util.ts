import ora from 'ora'
import { promises } from 'fs'
import { download } from './wrap'
import EventEmitter from 'events'
import { Socket } from 'socket.io'

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

export function watch(obj: any, action: (propName: string) => any) {
    Object.getOwnPropertyNames(obj).forEach(propName => {
        let value = obj[propName] as any
        Object.defineProperty(obj, propName, {
            get: () => value,
            set: newValue => {
                value = newValue
                action(propName)
            },
            configurable: true
        })
    })
}

export function sleep(timeout: number) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout)
    })
}

export function limitedTimeListener(
    eventEmitter: EventEmitter | Socket,
    eventName: string,
    action: () => void,
    timeout: number
) {
    eventEmitter.on(eventName, action)
    setTimeout(() => {
        eventEmitter.removeListener(eventName, action)
    }, timeout)
}

export function limitedTimeListenerOnce(
    eventEmitter: EventEmitter | Socket,
    eventName: string,
    action: () => void,
    timeout: number
) {
    const listener = () => {
        eventEmitter.removeListener(eventName, listener)
        action()
    }
    eventEmitter.once(eventName, listener)
    setTimeout(() => {
        eventEmitter.removeListener(eventName, listener)
    }, timeout)
}

export function expectEventWithin(
    time: number,
    eventName: string,
    eventEmitter: Socket
) {
    return new Promise<void>((resolve, reject) => {
        let temp = false
        const listener = () => {
            temp = true
        }
        eventEmitter.once(eventName, listener)
        setTimeout(() => {
            eventEmitter.removeListener(eventName, listener)
            temp ? resolve() : reject()
        }, time)
    })
}
