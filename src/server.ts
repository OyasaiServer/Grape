import { ChildProcess, spawn } from 'child_process'
import { ServerConfig } from './types'
import { Server as Socket } from 'socket.io'

export default class Server implements ServerConfig {
    private instance?: ChildProcess
    location: string
    args: string[]
    socket?: Socket
    constructor({ location, args }: ServerConfig) {
        this.location = location
        this.args = args
        this.socket = new Socket()
    }
    start() {
        if (this.instance) throw Error('Server has already started!')
        this.instance = spawn(
            this.location,
            ['-jar', ...this.args, './paper.jar', 'nogui'],
            { cwd: './', stdio: 'inherit' }
        )
    }

    restart() {}
}
