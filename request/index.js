const defaultUrl = 'https://user.fashioncat.top'
let isRedirectingLogin = false

const getToken = () => (
	uni.getStorageSync('Authorization') ||
	uni.getStorageSync('token') ||
	''
)

const isLoginPage = () => {
	const pages = getCurrentPages()
	const current = pages[pages.length - 1]
	if (current?.route === 'pages/login/index') return true
	if (typeof window !== 'undefined') {
		return window.location.hash.includes('/pages/login/index')
	}
	return false
}

const redirectToLogin = () => {
	if (isRedirectingLogin || isLoginPage()) return
	isRedirectingLogin = true
	uni.removeStorageSync('Authorization')
	uni.removeStorageSync('token')
	uni.showToast({
		title: '登录已过期，请重新登录',
		icon: 'none'
	})
	setTimeout(() => {
		uni.reLaunch({
			url: '/pages/login/index',
			complete: () => {
				isRedirectingLogin = false
			}
		})
	}, 500)
}

export function http(url, method = 'GET', params = {}, options = {}) {
	return new Promise((resolve, reject) => {
		const token = getToken()
		if (!token && url !== '/api/user/login') {
			redirectToLogin()
			reject({ code: 1002, message: '未登录' })
			return
		}
		const header = {
			'content-type': 'application/json',
			...(token ? { Authorization: token } : {}),
			...(options.header || {})
		}

		uni.request({
			url: defaultUrl + url,
			method: method.toUpperCase(),
			data: params,
			header,
			success: (res) => {
				const result = res.data

				if (res.statusCode < 200 || res.statusCode >= 300) {
					uni.showToast({
						title: result?.message || '服务器请求失败',
						icon: 'none'
					})
					reject(result || res)
					return
				}

				if (result?.code === 1002) {
					redirectToLogin()
					reject(result)
					return
				}

				if (result && result.code !== undefined && result.code !== 1000) {
					uni.showToast({
						title: result.message || '请求失败',
						icon: 'none'
					})
					reject(result)
					return
				}

				resolve(result?.data !== undefined ? result.data : result)
			},
			fail: (err) => {
				uni.showToast({
					title: '获取服务器信息失败',
					icon: 'none'
				})
				reject(err)
			}
		})
	})
}

export function uploadFile(filePath, name = 'file', formData = {}) {
	return new Promise((resolve, reject) => {
		const token = getToken()
		if (!token) {
			redirectToLogin()
			reject({ code: 1002, message: '未登录' })
			return
		}
		uni.uploadFile({
			url: defaultUrl + '/api/user/file/upload',
			filePath,
			name,
			formData,
			header: token ? { Authorization: token } : {},
			success: (res) => {
				let result = res.data
				if (typeof result === 'string') {
					try {
						result = JSON.parse(result)
					} catch (e) {}
				}

				if (result?.code === 1000) {
					resolve(result.data)
					return
				}

				if (result?.code === 1002) {
					redirectToLogin()
					reject(result)
					return
				}

				uni.showToast({
					title: result?.message || '上传失败',
					icon: 'none'
				})
				reject(result || res)
			},
			fail: (err) => {
				uni.showToast({
					title: '上传失败',
					icon: 'none'
				})
				reject(err)
			}
		})
	})
}

export { defaultUrl }
