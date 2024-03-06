const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: "development",

    entry: {
        index: "./src/index.ts",
    },

    devtool: "inline-source-map",

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        fallback: {
            fs: false,
        },
    },

    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },

    devServer: {
        static: "./dist",
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: "Development",
            template: "src/index.html",
        }),
        new CopyPlugin({
            patterns: [
                { from: path.resolve(__dirname, "assets"), to: "assets" },
                {
                    from: path.resolve(__dirname, "src/style.css"),
                    to: "style.css",
                },
            ],
        }),
    ],

    optimization: {
        runtimeChunk: "single",
    },
};
