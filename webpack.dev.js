const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './index.js',
    devtool: 'source-map',
    plugins: [
        new ESLintPlugin({
            fix: true,
            failOnError: false,
            files: ['index.js', './modules/*.js']
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: '/node_modules|dist|docs|webpack*/',
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    output: {
        filename: 'playsnake.min.js',
        path: path.resolve(__dirname, 'docs')
    }
};