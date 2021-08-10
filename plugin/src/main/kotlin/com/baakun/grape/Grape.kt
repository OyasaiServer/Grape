package com.baakun.grape

import io.socket.client.IO
import io.socket.client.Socket
import org.bukkit.Bukkit
import org.bukkit.plugin.java.JavaPlugin
import java.net.URI
import java.util.*


class Grape : JavaPlugin() {
    override fun onEnable() {
        plugin = this
        val uri = URI.create("http://localhost:3000")
        val options = IO.Options.builder().build()
        val socket: Socket = IO.socket(uri, options)!!
        socket.on(Socket.EVENT_CONNECT) {
            socket.emit("internal")
            socket.on("ok") {
                Timer().scheduleAtFixedRate(object : TimerTask() {
                    override fun run() {
                        socket.emit("ping")
                    }
                }, 0, 5000)
                socket.on("cmd") {
                    Bukkit.getScheduler().callSyncMethod(this) { Bukkit.dispatchCommand(Bukkit.getConsoleSender(), it[0] as String) }.get()
                }
            }
        }
        socket.connect()
    }
    companion object {
        var plugin: JavaPlugin? = null
    }
}
