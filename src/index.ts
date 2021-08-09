/*
 * Copyright (c) 2021, Oyasai Server and/or its affiliates. All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 */
import { readFile } from './wrap'
import Server from './server'
import { Config } from './types'
import { downloadPaperJar, sleep } from './util'
import { CronJob } from 'cron'

const conf = await readFile<Config>('./conf.json')
const server = new Server(conf.java)
await downloadPaperJar(conf.version)
server.start()
new CronJob(
    `0 ${conf.restartTime} * * * `,
    async () => {
        await sleep(1000)
        server.restart()
    },
    null,
    true,
    'Asia/Tokyo'
)
