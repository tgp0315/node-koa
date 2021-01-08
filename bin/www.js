const koa = require("koa");
let app = new koa();

app.use(async ctx => {
  ctx.body = "hello world";
});

app.listen(3000, () => {
  console.log('服务器启动 http://127.0.0.1:3000');
})