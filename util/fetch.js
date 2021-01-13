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