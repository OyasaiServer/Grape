import { ChildProcess, exec, spawn } from 'child_process'
import { Config } from './types'
import { Server as SocketIO, Socket } from 'socket.io'
import { readFile } from './wrap'
import { downloadPaperJar, limitedTimeEventListener } from './util'
import util from 'minecraft-server-util'
import EventEmitter from 'events'

const { java, version, socketPort, address } = await readFile<Config>(
    './conf.json'
)

export default class Server extends EventEmitter {
    private instance?: ChildProcess
    private serverClient?: Socket
    private state = {
        shouldBeOnline: false,
        isPlayerOnline: false,
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
                    this.state.isPlayerOnline = Boolean(status.onlinePlayers)
                    externalTemp = true
                } catch (e) {
                    externalTemp = false
                } finally {
                    if (this.state.external !== externalTemp) {
                        this.state.external = externalTemp
                        this.emit('state-change')
                        this.emit('state-external-change')
                    }
                }
                setTimeout(() => {
                    this.serverClient?.removeListener('pong', pingListener)
                    if (this.state.internal !== internalTemp) {
                        this.state.internal = internalTemp
                        this.emit('state-change')
                        this.emit('state-internal-change')
                    }
                }, 500)
            }, 5000)
        })
    }

    start() {
        return new Promise<void>(resolve => {
            if (this.instance) throw Error('Server has already started!')
            downloadPaperJar(version).then(() => {
                this.instance = spawn(
                    java.location,
                    ['-jar', ...java.args, './paper.jar', 'nogui'],
                    { cwd: './', stdio: 'inherit' }
                )
            })
            limitedTimeEventListener(
                this,
                'state-change',
                () => {
                    if (this.state.external && this.state.internal) {
                        this.state.shouldBeOnline = true
                        resolve()
                    }
                },
                180000
            )
        })
    }

    stop() {
        return new Promise<void>(resolve => {
            if (!this.instance)
                throw Error('Server has not yet started / already stopped!')
            this.run('stop')
            this.state.shouldBeOnline = false
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
