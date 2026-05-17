import http from './http'
import {
  addTenantUser,
  deleteTenantUser,
  editTenantUser,
  getTenantList,
  getTenantUserList,
  getTenantUserMenus,
  resetTenantUserPassword
} from './platform'

// 当前在线接口文档仅公开了登录、工作台、会员、套餐、订单、工艺这几组接口。
// 其余 ERP 模块需要在这里补充真实接口后才能在生产环境使用。
const staffStatusToApi = (status) => {
  if (status === '启用') return 1
  if (status === '禁用') return 0
  return status
}

const staffStatusFromApi = (status) => (Number(status) === 1 ? '启用' : '禁用')

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const normalizeStaffUser = (row, tenant = {}) => ({
  ...row,
  tenantId: row.tenantId || tenant.id,
  tenantName: row.tenantName || tenant.tenantName,
  userId: row.userId || row.id,
  status: staffStatusFromApi(row.status),
  roleText: row.roleText || row.roleName || row.menuName || (row.menuIdList || []).join('、') || '-'
})

const listStaff = async (payload = {}) => {
  const status = staffStatusToApi(payload.status)
  const baseQuery = {
    name: payload.name || undefined,
    phone: payload.phone || undefined,
    status: status === '' ? undefined : status
  }

  if (payload.tenantId) {
    const data = await getTenantUserList({ tenantId: payload.tenantId, ...baseQuery })
    return listRows(data).map((row) => normalizeStaffUser(row, { id: payload.tenantId }))
  }

  const tenantResult = await getTenantList({
    pageNum: 1,
    pageSize: 999,
    status: 1
  })
  const tenants = listRows(tenantResult)
  const nested = await Promise.all(
    tenants.map(async (tenant) => {
      const data = await getTenantUserList({ tenantId: tenant.id, ...baseQuery })
      return listRows(data).map((row) => normalizeStaffUser(row, tenant))
    })
  )
  return nested.flat()
}

const saveStaff = (payload = {}) => {
  if (!payload.tenantId) {
    return Promise.reject(new Error('人员接口要求 tenantId，请先选择所属会员'))
  }

  const requestPayload = {
    id: payload.id || undefined,
    tenantId: payload.tenantId,
    name: payload.name,
    phone: payload.phone,
    password: payload.loginPassword || payload.password || undefined,
    menuIdList: payload.menuIdList || []
  }

  return payload.id ? editTenantUser(requestPayload) : addTenantUser(requestPayload)
}

const resetStaffPassword = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少人员ID'))
  return resetTenantUserPassword(payload.id)
}

const deleteStaff = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少人员ID'))
  return deleteTenantUser(payload.id)
}

const flattenMenus = (menus = []) =>
  menus.flatMap((item) => [item, ...flattenMenus(item.children || [])])

const moduleApiMap = {
  staff: {
    list: listStaff,
    save: saveStaff,
    resetPassword: resetStaffPassword,
    delete: deleteStaff,
    formOptions: async () => {
      const [tenantResult, menuResult] = await Promise.all([
        getTenantList({ pageNum: 1, pageSize: 999, status: 1 }),
        getTenantUserMenus()
      ])
      return {
        tenants: listRows(tenantResult).map((item) => ({
          label: item.tenantName,
          value: item.id
        })),
        menus: flattenMenus(Array.isArray(menuResult) ? menuResult : []).map((item) => ({
          label: item.name,
          value: item.id
        }))
      }
    }
  }
}

export const getSpecialModuleList = (moduleKey, payload = {}) => {
  const config = moduleApiMap[moduleKey]
  if (!config?.list) {
    return Promise.reject(new Error(`missing list api for ${moduleKey}`))
  }
  if (typeof config.list === 'function') return config.list(payload)
  return http.post(config.list, payload)
}

export const saveSpecialModule = (moduleKey, payload = {}) => {
  const config = moduleApiMap[moduleKey]
  if (!config?.save) {
    return Promise.reject(new Error(`missing save api for ${moduleKey}`))
  }
  if (typeof config.save === 'function') return config.save(payload)
  return http.post(config.save, payload)
}

export const runSpecialModuleAction = (moduleKey, action, payload = {}) => {
  const config = moduleApiMap[moduleKey]
  const handler = config?.[action]
  if (!handler) {
    return Promise.reject(new Error(`missing ${action} api for ${moduleKey}`))
  }
  if (typeof handler === 'function') return handler(payload)
  return http.post(handler, payload)
}

export const getSpecialModuleFormOptions = (moduleKey) => {
  const config = moduleApiMap[moduleKey]
  if (!config?.formOptions) return Promise.resolve({})
  return config.formOptions()
}
