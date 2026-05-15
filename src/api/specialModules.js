import http from './http'

// 当前在线接口文档仅公开了登录、工作台、会员、套餐、订单、工艺这几组接口。
// 其余 ERP 模块接口未在文档中公开前，统一交给 mock/service 兜底，避免误调不存在的地址。
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
