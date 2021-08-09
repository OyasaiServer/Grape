const { promises } = require('fs')

Promise.all([
    promises.copyFile('artifacts/index.js', 'test/index.js'),
    promises.copyFile('plugin/build/libs/Grape.jar', 'test/plugins/Grape.jar')
]).then(() => {
    console.log('\nTest setup done!\n')
})
