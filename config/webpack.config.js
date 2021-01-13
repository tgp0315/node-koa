const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

// 多入口
let entry = {
  home: 'src/js/home/home.js',
  user: 'src/js/user/user.js'
}


module.exports = evn => ({
  mode: evn.production ? 'production' : 'development',
  // 给每个入口 path.reslove 
  entry: Object.keys(entry).reduce((obj, item) => (obj[item] = path.resolve(entry[item])) && obj, {}),
  output: {
    publicPath: '/',
    filename: 'js/[name].js',
    path: path.resolve('dist')
  },
  module: {
    rules: [
      { // bable 根据需要转换到对应版本 
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      { // 转换less 并交给MiniCssExtractPlug插件提取到单独文件
        test: /\.less$/,
        loader: [MiniCssExtractPlugin.loader,  'css-loader', 'less-loader'],
        exclude: /node_modules/
      },
      { //将css、js引入的图片目录指到dist目录下的images 保持与页面引入的一致
        test: /\.(png|svg|jpg|gif)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: './images',
         }
        }]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: './font',
         }
        }]
      }
    ]
  },
  plugins: [
    // 删除上一次打包目录(一般来说删除自己输出过的目录 )
    new CleanWebpackPlugin(['dist', 'views/_layout'], {
      // 当配置文件与package.json不再同一目录时候需要指定根目录
      root: path.resolve() 
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
      chunkFilename: "[id].css"
    }),
    // 将src下的图片资源平移到dist目录
    new CopyWebpackPlugin(
      [{
        from: path.resolve('src/images'),
        to: path.resolve('dist/images')
      }
    ]),
    // HtmlWebpackPlugin 每个入口生成一个html 并引入对应打包生产好的js
    ...Object.keys(entry).map(item => new HtmlWebpackPlugin({
      // 模块名对应入口名称
      chunks: [item], 
      // 输入目录 (可自行定义 这边输入到views下面的_layout)
      filename: path.resolve('views/_layout/' + entry[item].split('/').slice(-2).join('/').replace('js', 'html')),
      // 基准模板
      template: path.resolve('src/template.html')
    }))
  ]
});