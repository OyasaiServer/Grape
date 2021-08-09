import ora from 'ora'
import { promises } from 'fs'
import { download } from './wrap'

export async function downloadPaperJar(version: string) {
    console.log()
    const deleteSpinner = ora('Deleting old paper.jar...').start()
    try {
        await promises.unlink('./paper.jar')
    } finally {
        deleteSpinner.succeed()
        const downloadSpinner = ora(
            `Downloading latest paper.jar for ${version}...`
        ).start()
        await download(
            `https://papermc.io/api/v1/paper/${version}/latest/download`,
            'paper.jar'
        )
        downloadSpinner.succeed()
        console.log()
        ora('Starting server...').info()
        console.log()
    }
}
