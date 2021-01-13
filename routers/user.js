const userRouter = require('koa-router')()

userRouter.get('/user', (ctx, next) => {
  ctx.render('user/user.html', {
    title: '用户页'
  })
})

module.exports = userRouter
