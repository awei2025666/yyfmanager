import http from './http'

export const loginApi = (payload) => http.post('/api/platform/login', payload)
export const uploadPlatformFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return http.post('/api/platform/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getOverview = () => http.get('/api/platform/workbench/dataOverview')
export const getTrend = (type) => http.get('/api/platform/workbench/lineChart', { params: { type } })
export const getRealtimeOrders = () => http.get('/api/platform/workbench/realTimeOrder')
export const getRecentUpdates = () => http.get('/api/platform/workbench/recentUpdates')

export const getTenantList = (payload) => http.post('/api/platform/tenant/list', payload)
export const addTenant = (payload) => http.post('/api/platform/tenant/add', payload)
export const editTenant = (payload) => http.post('/api/platform/tenant/edit', payload)
export const deleteTenant = (id) => http.get('/api/platform/tenant/del', { params: { id } })
export const changeTenantStatus = (payload) => http.post('/api/platform/tenant/status', payload)
export const rechargeTenant = (payload) => http.post('/api/platform/tenant/recharge', payload)
export const resetTenantPassword = (id) =>
  http.get('/api/platform/tenant/resetPassword', { params: { id } })
export const getTenantDetail = (id) => http.get('/api/platform/tenant/detail', { params: { id } })
export const getTenantUserList = (payload) => http.post('/api/platform/tenant/tenantUserList', payload)
export const getTenantUserMenus = () => http.get('/api/platform/tenant/tenantUserMenus')
export const addTenantUser = (payload) => http.post('/api/platform/tenant/tenantUserAdd', payload)
export const editTenantUser = (payload) => http.post('/api/platform/tenant/tenantUserEdit', payload)
export const changeTenantUserStatus = (payload) =>
  http.post('/api/platform/tenant/tenantUserStatus', payload)
export const resetTenantUserPassword = (id) =>
  http.get('/api/platform/tenant/tenantUserResetPassword', { params: { id } })
export const deleteTenantUser = (id) =>
  http.get('/api/platform/tenant/tenantUserDel', { params: { id } })

export const getVipList = (payload) => http.post('/api/platform/vip/list', payload)
export const addVip = (payload) => http.post('/api/platform/vip/add', payload)
export const editVip = (payload) => http.post('/api/platform/vip/edit', payload)
export const changeVipStatus = (payload) => http.post('/api/platform/vip/status', payload)
export const deleteVip = (id) => http.get('/api/platform/vip/del', { params: { id } })
export const getVipTotal = () => http.get('/api/platform/vip/totalData')

export const getOrderList = (payload) => http.post('/api/platform/order/list', payload)
export const getOrderTotal = () => http.get('/api/platform/order/totalData')

export const getCraftList = (payload) => http.post('/api/platform/craft/list', payload)
export const addCraft = (payload) => http.post('/api/platform/craft/add', payload)
export const editCraft = (payload) => http.post('/api/platform/craft/edit', payload)
export const changeCraftStatus = (payload) => http.post('/api/platform/craft/status', payload)
export const deleteCraft = (id) => http.get('/api/platform/craft/del', { params: { id } })
