import http from './http'

// 当前在线接口文档仅公开了登录、工作台、会员、套餐、订单、工艺这几组接口。
// 其余 ERP 模块需要在这里补充真实接口后才能在生产环境使用。
const moduleApiMap = {}

export const getSpecialModuleList = (moduleKey, payload = {}) => {
  const config = moduleApiMap[moduleKey]
  if (!config?.list) {
    return Promise.reject(new Error(`missing list api for ${moduleKey}`))
  }
  return http.post(config.list, payload)
}

export const saveSpecialModule = (moduleKey, payload = {}) => {
  const config = moduleApiMap[moduleKey]
  if (!config?.save) {
    return Promise.reject(new Error(`missing save api for ${moduleKey}`))
  }
  return http.post(config.save, payload)
}
