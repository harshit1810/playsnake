const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './index.js',
    plugins: [
        new CleanWebpackPlugin(['docs']),
        new HtmlWebpackPlugin({
            title: 'PlaySnake'
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