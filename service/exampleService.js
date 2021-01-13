const fetch = require('../util/fetch.js')

module.exports = {
  getTodoList (params = {}) {
    return fetch({
      url: 'https://www.easy-mock.com/mock/5c35a2a2ce7b4303bd93fbda/example/todolist',
      method: 'post',
      data: params
    })
  }
}