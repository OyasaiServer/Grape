import { ChildProcess, exec, spawn } from 'child_process'
import { Config } from './types'
import { Server as SocketIO, Socket } from 'socket.io'
import { readFile } from './wrap'
import { downloadPaperJar } from './util'

const { java, version, socketPort } = await readFile<Config>('./conf.json')

export default class Server {
    instance?: ChildProcess
    serverClient?: Socket
    alive: boolean

    constructor() {
        this.alive = false
        const io = new SocketIO(socketPort)
        io.on('connection', client => {
            client.on('internal', () => {
                this.serverClient = client
                client.emit('ok')
            })
            client.on('ping', () => {
                this.alive = true
                console.log('PING recieved')
            })
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
                resolve() // TODO get ping and resolve
            })
        })
    }

    stop() {
        return new Promise<void>(resolve => {
            this.run('stop')
            const interval = setInterval(() => {
                exec('pidof java', err => {
                    if (err) {
                        clearInterval(interval)
                        resolve()
                    }
                })
            }, 500)
        })
    }

    run(cmd: string) {
        if (!this.serverClient) {
            throw Error('Socket connection has not been established!')
        }
        this.serverClient?.emit('cmd', cmd)
    }
}
