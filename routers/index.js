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
