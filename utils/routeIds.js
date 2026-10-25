// 微信小程序的路由参数需要显式解码；ID 保持字符串，避免长整型精度丢失。
export const parseRouteIds = value => {
	let decoded = String(value ?? '')
	try {
		decoded = decodeURIComponent(decoded)
	} catch (error) {
		return []
	}
	return decoded.split(',').map(id => id.trim()).filter(Boolean)
}
