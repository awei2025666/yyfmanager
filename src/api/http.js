import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  baseURL: 'http://hunike.nat100.top/7777',
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
      localStorage.removeItem('platform_token')
    }

    return Promise.reject(new Error(payload?.message || '请求失败'))
  },
  (error) => Promise.reject(error)
)

export default http
