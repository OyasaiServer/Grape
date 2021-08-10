/*
 * Copyright (c) 2021, Oyasai Server and/or its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 */
import Server from './server'
import { sleep } from './util'

const server = new Server()
await server.start()
console.log('SERVER HAS STARTED!!!')

await sleep(5000)

await server.stop()

console.log('SERVER HAS STOPPED!!!')

await sleep(3000)

await server.start()
console.log('SERVER HAS STARTED!!!')
