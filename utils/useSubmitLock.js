import { ref } from 'vue'

// 请求期间拦截重复点击，完成后短暂保留状态，覆盖成功提示后的页面跳转。
export const useSubmitLock = () => {
	const busy = ref(false)
	const run = async action => {
		if (busy.value) return
		busy.value = true
		try {
			return await action()
		} finally {
			setTimeout(() => { busy.value = false }, 800)
		}
	}
	return { busy, run }
}
