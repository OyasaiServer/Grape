package com.baakun.grape

import io.socket.client.IO
import io.socket.client.Socket
import org.bukkit.plugin.java.JavaPlugin
import java.net.URI
import java.util.*


class Grape : JavaPlugin() {
    override fun onEnable() {
        plugin = this
        val uri = URI.create("http://localhost:3000")
        val options = IO.Options.builder().build()
        val socket: Socket = IO.socket(uri, options)!!
        var i = 0
        socket.on(Socket.EVENT_CONNECT) {
            Timer().scheduleAtFixedRate(object : TimerTask() {
                override fun run() {
                    println("$i: Test")
                    socket.emit("test", "$i: Test")
                    i++
                }
            }, 0, 1000)
            socket.on("cmd") {

            }
        }
        socket.connect()
    }
    companion object {
        var plugin: JavaPlugin? = null
    }
}
