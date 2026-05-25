import axios from 'axios'
import { ElMessage } from 'element-plus'
import { redirectToLogin } from './authGuard'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api-proxy' : 'http://hunike.nat100.top/7888'),
  timeout: 12000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('platform_token')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (payload?.code === 1000) {
      return payload.data
    }

    if (payload?.message) {
      ElMessage.error(payload.message)
    }

    if (payload?.code === 1002) {
      redirectToLogin()
    }

    return Promise.reject(new Error(payload?.message || '请求失败'))
  },
  (error) => Promise.reject(error)
)

export default http
