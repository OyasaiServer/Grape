export interface ServerConfig {
    location: string
    args: string[]
}

export interface Config {
    version: string
    restartTime: number
    java: ServerConfig
}

export interface Env {
    DISCORD_TOKEN: string
}
