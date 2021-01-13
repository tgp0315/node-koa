/**
 *  
*/
const nunjucks = require('nunjucks')
const path = require('path')
const moment = require('moment')
// let nunjucksEVN = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.resolve('views')), {})
let nunjucksEVN = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'))

// 为nkj加入一个过滤器
nunjucksEVN.addFilter('timeFormate',  (time, formate) => moment(time, false).format( formate || 'YYYY-MM-DD HH:mm:ss'))

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
