const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
//const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './index.js',
    devtool: 'source-map',
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Classic Snake Game'
        })
    ],
    module: {
        rules: [
            {
                test: /^index.js$/,
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
        filename: 'playsnake.webpack.min.js',
        path: path.resolve(__dirname, 'docs')
    }
};