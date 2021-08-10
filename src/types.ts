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

export interface Env {
    DISCORD_TOKEN: string
}
