import { ChildProcess, spawn } from 'child_process'
import { Config } from './types'
import { Server as SocketIO, Socket } from 'socket.io'
import { readFile } from './wrap'
import { downloader, expectEventWithin, watch } from './util'
import util from 'minecraft-server-util'
import EventEmitter from 'events'
import ora from 'ora'

const { java, version, socketPort, address } = await readFile<Config>(
    './conf.json'
)

export default class Server extends EventEmitter {
    private instance?: ChildProcess
    private internalSocket?: Socket
    state: {
        expected: 'online' | 'offline' | 'starting' | 'stopping'
        onlinePlayerCount: number
        internalCheck: boolean
        externalCheck: boolean
    }
    constructor() {
        super()
        this.state = {
            expected: 'offline',
            onlinePlayerCount: 0,
            internalCheck: false,
            externalCheck: false
        }
        watch(this.state, () => {
            this.emit('state-change')
        })
        const io = new SocketIO(socketPort)
        io.on('connection', client => {
            client.on('internal-connection-request', () => {
                client.emit('ok')
                this.internalSocket = client
            })
            setInterval(async () => {
                try {
                    const status = await util.status(address)
                    this.state.onlinePlayerCount = status.onlinePlayers || 0
                    this.state.externalCheck = true
                } catch (e) {
                    this.state.onlinePlayerCount = 0
                    this.state.externalCheck = false
                }
                if (this.internalSocket) {
                    this.internalSocket.emit('ping')
                    expectEventWithin(500, 'pong', this.internalSocket)
                        .then(() => {
                            this.state.internalCheck = true
                        })
                        .catch(() => {
                            this.state.internalCheck = false
                        })
                } else {
                    this.state.internalCheck = false
                }
            }, 5000)
        })
        // this.on('state-change', async () => {
        //     if (
        //         !(
        //             (this.state.internal === this.state.external) ===
        //             this.state.shouldBeOnline
        //         )
        //     ) {
        //         this.state = {
        //             shouldBeOnline: false,
        //             onlinePlayerCount: 0,
        //             internal: false,
        //             external: false
        //         }
        //         if (this.state.shouldBeOnline !== this.state.internal) {
        //             console.log('Server may be slow!!!')
        //             await this.stop()
        //             this.start()
        //         } else if (this.state.shouldBeOnline !== this.state.external) {
        //             console.log('Server may be offline!!!')
        //             await this.stop()
        //             this.start()
        //         } else if (
        //             (this.state.internal === this.state.external) ===
        //             !this.state.shouldBeOnline
        //         ) {
        //             console.log('Serious program error')
        //         }
        //     }
        // })
    }

    rescue() {}

    start() {
        return new Promise<void>(resolve => {
            if (this.instance) throw Error('Server has already started!')
            this.state.expected = 'starting'
            Promise.all([
                downloader(
                    'paper.jar',
                    `https://papermc.io/api/v1/paper/${version}/latest/download`
                ),
                downloader(
                    './plugins/Grape.jar',
                    'https://github.com/oyasaiserver/grape/releases/latest/download/Grape.jar'
                )
            ]).then(() => {
                this.instance = spawn(
                    java.location,
                    ['-jar', ...java.args, './paper.jar', 'nogui'],
                    { cwd: './', stdio: 'inherit' }
                )
                console.log()
                ora('Starting server...').info()
                console.log()
            })
            const listener = () => {
                if (this.state.internalCheck && this.state.externalCheck) {
                    this.removeListener('state-change', listener)
                    this.state.expected = 'online'
                    resolve()
                }
            }
            this.on('state-change', listener)
        })
    }

    stop() {
        return new Promise<void>(resolve => {
            if (!this.instance) throw Error('Server has not yet started!')
            this.state.expected = 'stopping'
            this.run('stop')
            const listener = () => {
                if (!this.state.internalCheck && !this.state.externalCheck) {
                    this.removeListener('state-change', listener)
                    this.state.expected = 'offline'
                    resolve()
                }
            }
            this.on('state-change', listener)
        })
    }

    run(cmd: string) {
        if (!this.internalSocket) {
            throw Error('Socket connection has not yet established!')
        }
        this.internalSocket?.emit('cmd', cmd)
    }
}
