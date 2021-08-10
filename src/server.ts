import { ChildProcess, spawn } from 'child_process'
import { Config } from './types'
import { Server as SocketIO, Socket } from 'socket.io'
import { readFile } from './wrap'
import { downloader, limitedTimeEventListener } from './util'
import util from 'minecraft-server-util'
import EventEmitter from 'events'
import ora from 'ora'

const { java, version, socketPort, address } = await readFile<Config>(
    './conf.json'
)

export default class Server extends EventEmitter {
    private instance?: ChildProcess
    private serverClient?: Socket
    state = {
        shouldBeOnline: false,
        onlinePlayerCount: 0,
        internal: false,
        external: false
    }

    constructor() {
        super()
        const io = new SocketIO(socketPort)
        io.on('connection', client => {
            client.on('internal', () => {
                client.emit('ok')
                this.serverClient = client
            })
            setInterval(async () => {
                this.serverClient?.emit('ping')
                let internalTemp = false
                const pingListener = () => {
                    internalTemp = true
                }
                this.serverClient?.once('pong', pingListener)
                let externalTemp = false
                try {
                    const status = await util.status(address)
                    this.state.onlinePlayerCount = status.onlinePlayers || 0
                    this.emit('state-change')
                    externalTemp = true
                } catch (e) {
                    this.state.onlinePlayerCount = 0
                    this.emit('state-change')
                    externalTemp = false
                } finally {
                    if (this.state.external !== externalTemp) {
                        this.state.external = externalTemp
                        this.emit('state-change')
                    }
                }
                setTimeout(() => {
                    this.serverClient?.removeListener('pong', pingListener)
                    if (this.state.internal !== internalTemp) {
                        this.state.internal = internalTemp
                        this.emit('state-change')
                    }
                }, 500)
            }, 5000)
        })
        this.on('state-change', async () => {
            if (
                !(
                    (this.state.internal === this.state.external) ===
                    this.state.shouldBeOnline
                )
            ) {
                this.state = {
                    shouldBeOnline: false,
                    onlinePlayerCount: 0,
                    internal: false,
                    external: false
                }
                if (this.state.shouldBeOnline !== this.state.internal) {
                    console.log('Server may be slow!!!')
                    await this.stop()
                    this.start()
                } else if (this.state.shouldBeOnline !== this.state.external) {
                    console.log('Server may be offline!!!')
                    await this.stop()
                    this.start()
                } else if (
                    (this.state.internal === this.state.external) ===
                    !this.state.shouldBeOnline
                ) {
                    console.log('Serious program error')
                }
            }
        })
    }

    start() {
        return new Promise<void>(resolve => {
            if (this.instance) throw Error('Server has already started!')
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
                limitedTimeEventListener(
                    this,
                    'state-change',
                    () => {
                        if (this.state.external && this.state.internal) {
                            this.state.shouldBeOnline = true
                            this.emit('state-change')
                            resolve()
                        }
                    },
                    180000
                )
            })
        })
    }

    stop() {
        return new Promise<void>(resolve => {
            if (!this.instance)
                throw Error('Server has not yet started / already stopped!')
            this.run('stop')
            this.state.shouldBeOnline = false
            this.emit('state-change')
            limitedTimeEventListener(
                this,
                'state-change',
                () => {
                    if (!this.state.external && !this.state.internal) {
                        this.instance = undefined
                        resolve()
                    }
                },
                180000
            )
        })
    }

    run(cmd: string) {
        if (!this.serverClient) {
            throw Error('Socket connection has not yet established!')
        }
        this.serverClient?.emit('cmd', cmd)
    }
}
