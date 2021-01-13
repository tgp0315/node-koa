# 简介
  > nodejs搭建多页面服务端渲染
  * 技术点
    1. koa 搭建服务
    2. koa-router 创建页面路由
    3. nunjucks 模板引擎组合html
    4. webpack打包多页面
    5. node端异步请求
    6. 服务端日志打印

  > 项目源码 git clone https://gitee.com/wjj0720/node_server_rendering.git
  
  * 运行
    - npm i 
    - npm start

-----
  
## 一、 现代服务端渲染的由来
  > 服务端渲染概念： 是指，浏览器向服务器发出请求页面，服务端将准备好的模板和数据组装成完整的HTML返回给浏览器展示
  * 1、前端后端分离
    > 早在七八年前，几乎所有网站都使用 ASP、Java、PHP做后端渲染，随着网络的加快，客户端性能提高以及js本身的性能提高，我们开始往客户端增加更多的功能逻辑和交互，前端不再是简单的html+css更多的是交互，前端页在这是从后端分离出来「前后端正式分家」

  * 2、客户端渲染
    > 随着ajax技术的普及以及前端框架的崛起(jq、Angular、React、Vue) 框架的崛起，开始转向了前端渲染,使用 JS 来渲染页面大部分内容达到局部刷新的作用
    * 优势
      - 局部刷新，用户体验优
      - 富交互 
      - 节约服务器成本
    * 缺点
      - 不利于SEO(爬虫无法爬取ajax)请求回来的数据
      - 受浏览器性能限制、增加手机端的耗电
      - 首屏渲染需要等js运行才能展示数据

  * 3、现在服务端渲染
    > 为了解决上面客户端渲染的缺点，然前后端分离后必不能合，如果要把前后端部门合并，拆掉的肯定是前端部门
    * 现在服务端渲染的特点
      - 前端开发人员编写html+css模板
      - node中间服务负责前端模板和后台数据的组合
      - 数据依然由java等前服务端语言提供
    * 优势
      - 前后端分工明确
      - SEO问题解决

  * 4、前、后端渲染相关讨论参考
    - [知乎问答：为什么现在又流行服务器端渲染html](https://blog.csdn.net/b9q8e64lo6mm/article/details/79418969)
    - [精读前后端渲染之争](https://github.com/camsong/blog/issues/8)
    - [服务端渲染 vs 客户端渲染](https://jkchao.cn/article/5a11155fb520d115154c8fa1)

---

## 二、 项目开始
> 确保你安装node

  ### 第一步 让服务跑起来
  > 目标: 创建node服务,通过浏览器访问,返回'hello node!'(html页面其实就是一串字符串)

  ```js
    /** 创建项目目录结构如下 */
      │─ package-lock.json
      │─ package.json
      │─ README.md
      ├─bin
        │─ www.js

    // 1. 安装依赖 npm i koa 
    // 2. 修改package.json文件中 scripts 属性如下
      "scripts": {
        "start": "node bin/www.js"
      }

    // 3. www.js写入如下代码
      const Koa = require('koa');
      let app = new Koa();
      app.use(ctx => {
        ctx.body = 'hello node!'
      });
      app.listen(3000, () => {
        console.log('服务器启动 http://127.0.0.1:3000');
      });

    // 4 npm start 浏览器访问 http://127.0.0.1:3000 查看效果

  ```

  ### 第二步 路由的使用 
  > 目标:使用koa-router根据不同url返回不同页面内容
  * 依赖 npm i koa-router
    [koa-router 更多细节 请至npm查看](https://www.npmjs.com/package/koa-router)

  ```js
    /** 新增routers文件夹   目录结构如下 
      │─.gitignore
      │─package.json
      │─README.md
      ├─bin
      │   │─www.js
      ├─node_modules
      └─routers
          │─home.js
          │─index.js
          │─user.js 
    */
    //项目中应按照模块对路由进行划分,示例简单将路由划分为首页(/)和用户页(/user) 在index中将路由集中管理导, 出并在app实例后挂载到app上
  ```
  ```js
    /** router/home.js 文件 */
    // 引包
    const homeRouter = require('koa-router')()
    //创建路由规则
    homeRouter.get(['/', '/index.html', '/index', '/home.html', '/home'], (ctx, next) => {
      ctx.body = 'home'
    });
    // 导出路由备用
    module.exports = homeRouter

    /** router/user.js 文件 */
    const userRouter = require('koa-router')()
    userRouter.get('/user', (ctx, next) => {
      ctx.body = 'user'
    });
    module.exports = userRouter

  ```
  ```js
    /** router/index.js 文件 */
    // 路由集中点
    const routers = [
      require('./home.js'),
      require('./user.js')
    ]
    // 简单封装 
    module.exports = function (app) {
      routers.forEach(router => {
        app.use(router.routes())
      })
      return routers[0]
    }
  ```

  ```js
    /** www.js 文件改写 */
    // 引入koa
    const Koa = require('koa')
    const Routers = require('../routers/index.js')
    // 实例化koa对象
    let app = new Koa()

    // 挂载路由
    app.use((new Routers(app)).allowedMethods())

    // 监听3000端口
    app.listen(3000, () => {
      console.log('服务器启动 http://127.0.0.1:3000')
    })

  ```
  
  ### 第三步 加入模板
  > 目标:
  1.使用nunjucks解析html模板返回页面
  2.了解koa中间件的使用

  * 依赖 npm i nunjucks
  [nunjucks中文文档](https://nunjucks.bootcss.com/api.htm)

  ```js
    /*
      *我向项目目录下加入两个准备好的html文件 目录结构如下
      │─.gitignore
      │─package.json
      │─README.md
      ├─bin
      │   │─www.js
      │─middlewares  //新增中间件目录  
      │   ├─nunjucksMiddleware.js  //nunjucks模板中间件
      ├─node_modules
      │─routers
      │   │─home.js
      │   │─index.js
      │   │─user.js 
      │─views  //新增目录 作为视图层
          ├─home
          │   ├─home.html 
          ├─user
              ├─user.html
     */
  ```
  ```js
    /* nunjucksMiddleware.js 中间件的编写 
      *什么是中间件: 中间件就是在程序执行过程中增加辅助功能
      *nunjucksMiddleware作用: 给请求上下文加上render方法 将来在路由中使用 
    */
    const nunjucks = require('nunjucks')
    const path = require('path')
    const moment = require('moment')
    let nunjucksEVN = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'))
    // 为nkj加入一个过滤器
    nunjucksEVN.addFilter('timeFormate',  (time, formate) => moment(time).format( formate || 'YYYY-MM-DD HH:mm:ss'))

    // 判断文件是否有html后缀
    let isHtmlReg = /\.html$/
    let resolvePath = (params = {}, filePath) => {
      filePath = isHtmlReg.test(filePath) ? filePath : filePath + (params.suffix || '.html')
      return path.resolve(params.path || '', filePath)
    }

    /** 
    * @description nunjucks中间件 添加render到请求上下文
    * @param params {}
    */
    module.exports = (params) => {
      return (ctx, next) => {
        ctx.render = (filePath, renderData = {}) => {
          ctx.type = 'text/html'
          ctx.body = nunjucksEVN.render(resolvePath(params, filePath), Object.assign({}, ctx.state, renderData))
        }
        // 中间件本身执行完成 需要调用next去执行下一步计划
        return next()
      }
    }
  ```
  ```js
    /* 中间件挂载 www.js中增加部分代码 */

    // 头部引入文件 
    const nunjucksMiddleware = require('../middlewares/nunjucksMiddleware.js')
    //在路由之前调用 因为我们的中间件是在路由中使用的 故应该在路由前加到请求上下文ctx中
    app.use(nunjucksMiddleware({
      // 指定模板文件夹
      path: path.resolve(__dirname, '../views')
    })
  ```
  ```js
    /* 路由中调用 以routers/home.js 为例 修改代码如下*/
    const homeRouter = require('koa-router')()
    homeRouter.get(['/', '/index.html', '/index', '/home.html', '/home'], (ctx, next) => {
      // 渲染页面的数据
      ctx.state.todoList = [
        {name: '吃饭', time: '2019.1.4 12:00'},
        {name: '下午茶', time: '2019.1.4 15:10'},
        {name: '下班', time: '2019.1.4 18:30'}
      ]
      // 这里的ctx.render方法就是我们通过nunjucksMiddleware中间件添加的
      ctx.render('home/home', {
        title: '首页'
      })
    })
    module.exports = homeRouter

  ```

  ### 第四步 抽取公共模板
  > 目标: 抽取页面的公用部分 如导航/底部/html模板等

  ```html
    /**views目录下增加两个文件夹_layout(公用模板) _component(公共组件) 目录结构如下
      │─.gitignore
      │─package.json
      │─README.md
      ├─bin
      │   │─www.js  /koa服务
      │─middlewares  //中间件目录  
      │   ├─nunjucksMiddleware.js  //nunjucks模板中间件
      ├─node_modules
      │─routers  //服务路由目录
      │   │─home.js
      │   │─index.js
      │   │─user.js 
      │─views  //页面视图层
          │─_component
          │   │─nav.html (公用导航)
          │─_layout
          │   │─layout.html  (公用html框架)
          ├─home
          │   ├─home.html 
          ├─user
              ├─user.html
    */
  ```
  ```html
    <!-- layout.html 文件代码 -->
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>{{ title }}</title>
    </head>
    <body>
      <!-- 占位 名称为content的block将放在此处 -->
      {% block content %}
      {% endblock %}
    </body>
    </html>


    <!-- nav.html  公用导航  -->
    <ul>
      <li><a href="/">首页</a></li>
      <li><a href="/user">用户页</a></li>
    </ul>
  ```
  ```html
    <!-- home.html 改写 -->
    <!-- njk继承模板 -->
    {% extends "../_layout/layout.html" %}
    {% block content %}
      <!-- njk引入公共模块 -->
      {% include "../_component/nav.html" %}
      <h1>待办事项</h1>
      <ul>
        <!-- 过滤器的调用 timeFormate即我们在中间件中给njk加的过滤器 -->
        {% for item in todoList %}
          <li>{{item.name}} ---> {{item.time | timeFormate}}</li>
        {% endfor %}
      </ul>
    {% endblock %}


    <!-- user.html -->
    {% extends "../_layout/layout.html" %}
    {% block content %}
      {% include "../_component/nav.html" %}
      用户中心
    {% endblock %}

  ```

  ### 第五步 静态资源处理
  > 目标: 处理页面js\css\img等资源引入
  * 依赖 
    1. 用webpack打包静态资源 npm i webpack webpack-cli -D
    2. 处理js npm i @babel/core @babel/preset-env babel-loader -D
    3. 处理less npm i css-loader less-loader less mini-css-extract-plugin -D
    4. 处理文件 npm i file-loader copy-webpack-plugin -D
    5. 处理html npm i html-webpack-plugin -D
    6. 清理打包文件 npm i clean-webpack-plugin -D
    > *相关插件使用 查看npm相关文档*

  ```js
    /* 项目目录 变更 
    │  .gitignore
    │  package.json
    │  README.md
    ├─bin
    │  www.js
    ├─config  //增加webpack配置目录
    │  webpack.config.js
    ├─middlewares
    │  nunjucksMiddleware.js
    ├─routers
    │  home.js
    │  index.js
    │  user.js
    ├─src
    │  │─template.html  // + html模板 以此模板为每个入口生成 引入对应js的模板
    │  ├─images // +图资源目录
    │  │  ww.jpg
    │  ├─js // + js目录 
    │  │  ├─home
    │  │  │   home.js
    │  │  └─user
    │  │      user.js
    │  └─less // + css目录
    │      ├─common
    │      │   common.less
    │      │   nav.less
    │      ├─home
    │      │   home.less
    │      └─user
    │          user.less
    └─views
        ├─home
        │  home.html
        ├─user
        │  user.html
        ├─_component
        │      nav.html
        └─_layout  // webpac打包后的html模板
            ├─home
            │   home.html
            └─user
                user.html
    */
  ```
  ```html
    <!--  template.html 内容-->
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>{{title}}</title>
    </head>
    <body>
      <!-- njk模板继承后填充 -->
      {% block content %}
      {% endblock %}
    </body>
    </html>
  ```
  ```js
    /* src/js/home/home.js 一个入口文件*/
    
    import '../../less/home/home.less' //引入css
    import img from '../../images/ww.jpg' //引入图片
    console.log(111);
    let add = (a, b) => a + b; //箭头函数
    let a = 3, b = 4;
    let c = add(a, b);
    console.log(c);
    // 这里只做打包演示代码 不具任何意义
  ```
  ```css
    <!-- less/home/home.less 内容 -->
    // 引入公共样式
    @import '../common/common.less';
    @import '../common/nav.less';

    .list {
      li {
        color: rebeccapurple;
      }
    }
    .bg-img {
      width: 200px;
      height: 200px;
      background: url(../../images/ww.jpg); // 背景图片
      margin: 10px 0;
    }
  ```
  
  ```js
    /* webpack配置  webpack.config.js */
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

    <!-- package.json中添加 -->
    "scripts": {
      "start": "node bin/www.js",
      "build": "webpack --env.production --config config/webpack.config.js"
    }

    运行 npm run build 后生成 dist views/_layout 两个目录
  ```
  ```html
    <!-- 查看打包后生成的模板 views/_layout/home/home.html-->
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>{{title}}</title>
      <!-- 引入了css文件 -->
    <link href="/css/home.css" rel="stylesheet"></head>
    <body>
      {% block content %}
      {% endblock %}
      <!-- 引入了js文件 此时打包后的js/css在dist目录下面 -->
    <script type="text/javascript" src="/js/home.js"></script></body>
    </html>
  ```
  ```html
    <!-- view/home/home.html 页面改写 -->
    <!-- njk继承模板 继承的目标来自webpack打包生成 -->
    {% extends "../_layout/home/home.html" %}
    {% block content %}
      <!-- njk引入公共模块 -->
      {% include "../_component/nav.html" %}
      <h1>待办事项</h1>
      <ul class="list">
        <!-- 过滤器的调用 timeFormate即我们在中间件中给njk加的过滤器 -->
        {% for item in todoList %}
          <li>{{item.name}} ---> {{item.time | timeFormate}}</li>
        {% endfor %}
      </ul>
      <div class="bg-img"> 背景图</div>
      <!-- 页面图片引入方式 -->
      <img src="/images/ww.jpg"/>
    {% endblock %}
  ```
  ```js
    /**koa处理静态资源 
     * 依赖 npm i 'koa-static
    */

    // www.js 增加 将静态资源目录指向 打包后的dist目录
    app.use(require('koa-static')(path.resolve('dist')))
  ```
  > 运行 
    npm run build
    npm start
    浏览器访问127.0.0.1:3000 查看页面 js css img 效果


  ### 第六步 监听编译
  > 目标: 文件发生改实时编译打包
  * 依赖 npm i pm2 concurrently
  ```js
    /**项目中文件发生变动 需要重启服务才能看到效果是一件蛋疼的事,故需要实时监听变动 */
    <!-- 我们要监听的有两点 一是node服务 而是webpack打包 package.json变动如下 -->
      "scripts": {
        // concurrently 监听同时监听两条命令
        "start": "concurrently \"npm run build:dev\" \"npm run server:dev\"",
        "dev": "npm start",
        // 生产环境 执行两条命令即可 无监听
        "product": "npm run build:pro && npm run server:pro",
        // pm2 --watch参数监听服务的代码变更
        "server:dev": "pm2 start bin/www.js --watch",
        // 生产不需要用监听
        "server:pro": "pm2 start bin/www.js",
        // webpack --watch 对打包文件监听
        "build:dev": "webpack --watch --env.production --config config/webpack.config.js",
        "build:pro": "webpack --env.production --config config/webpack.config.js"
      }
  ```
  ### 第七步 数据请求
  > 目标: node请求接口数据 填充模板
  * 依赖 npm i [node-fetch](https://github.com/bitinn/node-fetch)
  ```js
    /*上面的代码中routers/home.js首页路由中我们向页面渲染了下面的一组数据 */
    ctx.state.todoList = [
      {name: '吃饭', time: '2019.1.4 12:00'},
      {name: '下午茶', time: '2019.1.4 15:10'},
      {name: '下班1', time: '2019.1.4 18:30'}
    ]
    /*但 数据是同步的 项目中我们必然会向java获取其他后台拿到渲染数据再填充页面 我们来看看怎么做*/
  ```
  ```js
      /*我们在根目录下创建一个util的目录作为工具库 并简单封装fetch.js请求数据*/
    const nodeFetch = require('node-fetch')
    module.exports = ({url, method, data = {}}) => {
      // get请求 将参数拼到url
      url = method === 'get' || !method ? "?" + Object.keys(data).map(item => `${item}=${data[item]}`).join('&') : url;
      return nodeFetch(url, {
            method: method || 'get',
            body:  JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        }).then(res => res.json())
    }
  ```
  ```js
    /*在根目录下创建一个service的目录作为数据层 并创建一个exampleService.js 作为示例*/
    //引入封装的 请求工具
    const fetch = require('../util/fetch.js')
    module.exports = {
      getTodoList (params = {}) {
        return fetch({
          url: 'https://www.easy-mock.com/mock/5c35a2a2ce7b4303bd93fbda/example/todolist',
          method: 'post',
          data: params
        })
      },
      //...
    }
  ```
  ```js
    /* 将请求加入到路由中 routers/home.js 改写 */
    const homeRouter = require('koa-router')()
    let exampleService = require('../service/exampleService.js') // 引入service api
    //将路由匹配回调 改成async函数 并在请时候 await数据回来 再调用render
    homeRouter.get(['/', '/index.html', '/index', '/home.html', '/home'], async (ctx, next) => {
      // 请求数据
      let todoList = await exampleService.getTodoList({name: 'ott'})
      // 替换原来的静态数据
      ctx.state.todoList = todoList.data
      ctx.render('home/home', {
        title: '首页'
      })
    })
    // 导出路由备用
    module.exports = homeRouter
  ```

  ### 第八步 日志打印
  > 目标: 使程序运行可视
  * 依赖 npm i [log4js](https://github.com/log4js-node/log4js-node)

  ```js
    /* 在util目录下创建 logger.js 代码如下 作简单的logger封装 */
    const log4js = require('log4js');
    const path = require('path')
    // 定义log config
    log4js.configure({
      appenders: { 
        // 定义两个输出源
        info: { type: 'file', filename: path.resolve('log/info.log') },
        error: { type: 'file', filename: path.resolve('log/error.log') }
      },
      categories: { 
        // 为info/warn/debug 类型log调用info输出源   error/fatal 调用error输出源
        default: { appenders: ['info'], level: 'info' },
        info: { appenders: ['info'], level: 'info' },
        warn: { appenders: ['info'], level: 'warn' },
        debug: { appenders: ['info'], level: 'debug' },
        error: { appenders: ['error'], level: 'error' },
        fatal: { appenders: ['error'], level: 'fatal' },
      }
    });
    // 导出5种类型的 logger
    module.exports = {
      debug: (...params) => log4js.getLogger('debug').debug(...params),
      info: (...params) => log4js.getLogger('info').info(...params),
      warn: (...params) => log4js.getLogger('warn').warn(...params),
      error: (...params) => log4js.getLogger('error').error(...params),
      fatal: (...params) => log4js.getLogger('fatal').fatal(...params),
    }
  ```
  ```js
    /* 在fetch.js中是哟logger */
    const nodeFetch = require('node-fetch')
    const logger = require('./logger.js')

    module.exports = ({url, method, data = {}}) => {
      // 加入请求日志
      logger.info('请求url:', url , method||'get', JSON.stringify(data))

      // get请求 将参数拼到url
      url = method === 'get' || !method ? "?" + Object.keys(data).map(item => `${item}=${data[item]}`).join('&') : url;

      return nodeFetch(url, {
        method: method || 'get',
          body:  JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json())
    }

    <!-- 日志打印 -->
    [2019-01-09T17:34:11.404] [INFO] info - 请求url: https://www.easy-mock.com/mock/5c35a2a2ce7b4303bd93fbda/example/todolist post {"name":"ott"}

  ```

  > *注: 仅共学习参考,生产配置自行斟酌!转载请备注来源!*


  

    