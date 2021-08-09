const path = require('path')

module.exports = {
    entry: './src/index.ts',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            electron: false
        }
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'artifacts')
    },
    plugins: [],
    experiments: {
        topLevelAwait: true
    },
    mode: 'production'
}
