export interface Config {
    address: string
    version: string
    socketPort: number
    restartTime: number
    java: {
        location: string
        args: string[]
    }
}
