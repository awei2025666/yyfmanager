const path = require('path')
const ci = require('miniprogram-ci')
const pkg = require('../package.json')

const appid = process.env.WX_APPID || 'wx84810f77ce4438c6'
const projectPath = path.resolve(__dirname, '../dist/build/mp-weixin')
const privateKeyPath = process.env.WX_PRIVATE_KEY_PATH || `/Users/nile/Downloads/private.${appid}.key`
const version = process.env.WX_UPLOAD_VERSION || pkg.version || '1.0.0'
const desc = process.env.WX_UPLOAD_DESC || '测试环境提交'

const project = new ci.Project({
	appid,
	type: 'miniProgram',
	projectPath,
	privateKeyPath,
	ignores: ['node_modules/**/*']
})

ci.upload({
	project,
	version,
	desc,
	setting: {
		es6: true,
		minify: true,
		autoPrefixWXSS: true
	},
	onProgressUpdate: console.log
}).then(() => {
	console.log(`微信小程序上传成功：${appid} ${version}`)
}).catch(err => {
	console.error(err)
	process.exit(1)
})
