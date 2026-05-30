import axios from 'axios'
import { redirectToLogin } from './authGuard'

export const tenantBaseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api-proxy' : '')

const tenantHttp = axios.create({
  baseURL: tenantBaseURL,
  timeout: 12000
})

tenantHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem('platform_token')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

tenantHttp.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (payload instanceof Blob || payload instanceof ArrayBuffer) {
      return payload
    }
    if (payload?.code === 1000) {
      return payload.data
    }

    if (payload?.code === 1002) {
      redirectToLogin()
    }

    return Promise.reject(new Error(payload?.message || '请求失败'))
  },
  (error) => Promise.reject(error)
)

const exportPost = (url, payload = {}) => tenantHttp.post(url, payload, { responseType: 'blob' })

export const tenantLoginApi = (payload) => tenantHttp.post('/api/tenant/login', payload)
export const getTenantUserInfo = () => tenantHttp.get('/api/tenant/tenantUser/info')
export const editTenantLoginPassword = (payload = {}) => tenantHttp.post('/api/tenant/tenantUser/editPassword', payload)

export const getWorkbenchOverview = () => tenantHttp.get('/api/tenant/workbench/dataOverview')
export const getWorkbenchTrend = (type) =>
  tenantHttp.get('/api/tenant/workbench/lineChart', { params: { type } })
export const getWorkbenchRealtimeOrders = () => tenantHttp.get('/api/tenant/workbench/realTimeOrder')
export const getWorkbenchRealtimeCrafts = () => tenantHttp.get('/api/tenant/workbench/realTimeCraft')
export const getWorkbenchRecentUpdates = (payload = {}) =>
  tenantHttp.get('/api/tenant/workbench/recentUpdates', { params: payload })
export const getWorkbenchLargeScreenOrderList = (payload = {}) =>
  tenantHttp.get('/api/tenant/workbench/largeScreenOrderList', { params: payload })
export const getWorkbenchLargeScreenOrderStatistics = () =>
  tenantHttp.get('/api/tenant/workbench/largeScreenOrderStatistics')

export const getTenantOrderList = (payload) => tenantHttp.post('/api/tenant/order/list', payload)
export const getTenantOrderDetail = (id) => tenantHttp.get('/api/tenant/order/info', { params: { id } })
export const addTenantOrder = (payload = {}) => tenantHttp.post('/api/tenant/order/add', payload)
export const editTenantOrder = (payload = {}) => tenantHttp.post('/api/tenant/order/edit', payload)
export const getTenantOrderProcess = (id) => tenantHttp.get('/api/tenant/order/processInfo', { params: { id } })
export const getTenantOrderConsumables = (id) => tenantHttp.get('/api/tenant/order/consumableInfo', { params: { id } })
export const getTenantOrderHandKept = (id) => tenantHttp.get('/api/tenant/order/handKeptInfo', { params: { id } })
export const getTenantOrderPrintUrl = (id) => tenantHttp.get('/api/tenant/order/printUrl', { params: { id } })
export const getTenantOrderAutoApprove = () => tenantHttp.get('/api/tenant/order/autoApproval')
export const changeTenantOrderAutoApprove = (payload = {}) => tenantHttp.post('/api/tenant/order/changeAutoApproval', payload)
export const approveTenantOrder = (payload = {}) => tenantHttp.post('/api/tenant/order/approve', payload)
export const returnTenantOrder = (id) => tenantHttp.get('/api/tenant/order/returnOrder', { params: { id } })
export const deleteTenantOrder = (id) => tenantHttp.get('/api/tenant/order/del', { params: { id } })
export const getTenantOutsourceTenants = (payload = {}) => tenantHttp.post('/api/tenant/order/tenants', payload)
export const outsourceTenantOrder = (payload = {}) => tenantHttp.post('/api/tenant/order/outsource', payload)
export const getTenantOutsourceIncomingOrders = (payload) => tenantHttp.post('/api/tenant/order/intoOrder', payload)
export const getTenantOutsourceOutgoingOrders = (payload) => tenantHttp.post('/api/tenant/order/outOrder', payload)
export const getTenantProductCraftList = (payload) => tenantHttp.post('/api/tenant/productsCraft/list', payload)
export const getTenantProductCraftDetail = (id) =>
  tenantHttp.get('/api/tenant/productsCraft/detail', { params: { id } })
export const getTenantProductCraftStatistics = () => tenantHttp.get('/api/tenant/productsCraft/statistics')
export const getTenantOutsourceCraftList = (payload) => tenantHttp.post('/api/tenant/productsCraft/intoCraft', payload)
export const getTenantOutsourceCraftStatistics = () => tenantHttp.get('/api/tenant/productsCraft/statisticsOutsourcing')
export const getTenantConsumableDetailList = (payload = {}) => tenantHttp.post('/api/tenant/consumableDetail/list', payload)
export const getTenantConsumableDetail = (id) =>
  tenantHttp.get('/api/tenant/consumableDetail/detail', { params: { id } })
export const getTenantConsumableInventoryList = (payload = {}) => tenantHttp.post('/api/tenant/consumableInventory/list', payload)
export const getTenantConsumableList = (payload = {}) => tenantHttp.post('/api/tenant/consumable/list', payload)
export const addTenantConsumable = (payload = {}) => tenantHttp.post('/api/tenant/consumable/add', payload)
export const editTenantConsumable = (payload = {}) => tenantHttp.post('/api/tenant/consumable/edit', payload)
export const deleteTenantConsumable = (id) => tenantHttp.post('/api/tenant/consumable/delete', { id })
export const changeTenantConsumableStatus = (payload = {}) => tenantHttp.post('/api/tenant/consumable/status', payload)
export const getTenantHandKeptList = (payload = {}) => tenantHttp.post('/api/tenant/handKept/list', payload)
export const getTenantHandKeptDetail = (id) => tenantHttp.get('/api/tenant/handKept/detail', { params: { id } })
export const addTenantHandKept = (payload = {}) => tenantHttp.post('/api/tenant/handKept/add', payload)
export const editTenantHandKept = (payload = {}) => tenantHttp.post('/api/tenant/handKept/edit', payload)
export const deleteTenantHandKept = (id) => tenantHttp.get('/api/tenant/handKept/del', { params: { id } })
export const exportTenantHandKept = (payload = {}) => exportPost('/api/tenant/handKept/export', payload)
export const getTenantDeliveryList = (payload = {}) => tenantHttp.post('/api/tenant/delivery/list', payload)
export const getTenantDeliveryDetail = (id) => tenantHttp.get('/api/tenant/delivery/detail', { params: { id } })
export const getTenantDeliveryProcess = (id) => tenantHttp.get('/api/tenant/delivery/processInfo', { params: { id } })
export const addTenantDelivery = (payload = {}) => tenantHttp.post('/api/tenant/delivery/add', payload)
export const editTenantDelivery = (payload = {}) => tenantHttp.post('/api/tenant/delivery/edit', payload)
export const getTenantDeliveryTotal = () => tenantHttp.get('/api/tenant/delivery/total')
export const getTenantReceivableOrderList = (payload = {}) => tenantHttp.post('/api/tenant/receivable/orderList', payload)
export const getTenantReceivableOrderTotal = () => tenantHttp.get('/api/tenant/receivable/orderTotal')
export const exportTenantReceivableOrder = (payload = {}) => exportPost('/api/tenant/receivable/orderExport', payload)
export const getTenantReceivableClientList = (payload = {}) => tenantHttp.post('/api/tenant/receivable/clientList', payload)
export const getTenantReceivableClientTotal = () => tenantHttp.get('/api/tenant/receivable/clientTotal')
export const exportTenantReceivableClient = (payload = {}) => exportPost('/api/tenant/receivable/clientExport', payload)
export const searchTenantAccounts = (payload = {}) => tenantHttp.post('/api/tenant/account/all', payload)
export const getTenantAccountList = (payload = {}) => tenantHttp.post('/api/tenant/account/list', payload)
export const addTenantAccount = (payload = {}) => tenantHttp.post('/api/tenant/account/add', payload)
export const editTenantAccount = (payload = {}) => tenantHttp.post('/api/tenant/account/edit', payload)
export const deleteTenantAccount = (id) => tenantHttp.get('/api/tenant/account/del', { params: { id } })
export const changeTenantAccountStatus = (payload = {}) => tenantHttp.post('/api/tenant/account/status', payload)
export const getTenantReceiptOrderList = (payload = {}) => tenantHttp.post('/api/tenant/receipt/orderList', payload)
export const getTenantReceiptList = (payload = {}) => tenantHttp.post('/api/tenant/receipt/list', payload)
export const addTenantReceipt = (payload = {}) => tenantHttp.post('/api/tenant/receipt/add', payload)
export const editTenantReceipt = (payload = {}) => tenantHttp.post('/api/tenant/receipt/edit', payload)
export const deleteTenantReceipt = (id) => tenantHttp.get('/api/tenant/receipt/del', { params: { id } })
export const getTenantReceiptDetail = (id) => tenantHttp.get('/api/tenant/receipt/detail', { params: { id } })
export const getTenantReceiptPrintUrl = (id) => tenantHttp.get('/api/tenant/receipt/printUrl', { params: { id } })
export const getTenantReceiptTotal = () => tenantHttp.get('/api/tenant/receipt/total')
export const exportTenantReceipt = (payload = {}) => exportPost('/api/tenant/receipt/export', payload)
export const getTenantReimburseList = (payload = {}) => tenantHttp.post('/api/tenant/reimburse/list', payload)
export const addTenantReimburse = (payload = {}) => tenantHttp.post('/api/tenant/reimburse/add', payload)
export const editTenantReimburse = (payload = {}) => tenantHttp.post('/api/tenant/reimburse/edit', payload)
export const deleteTenantReimburse = (id) => tenantHttp.get('/api/tenant/reimburse/del', { params: { id } })
export const getTenantReimburseDetail = (id) => tenantHttp.get('/api/tenant/reimburse/detail', { params: { id } })
export const getTenantReimbursePrintUrl = (id) => tenantHttp.get('/api/tenant/reimburse/printUrl', { params: { id } })
export const getTenantReimburseTotal = () => tenantHttp.get('/api/tenant/reimburse/total')
export const exportTenantReimburse = (payload = {}) => exportPost('/api/tenant/reimburse/export', payload)
export const getTenantClientList = (payload) =>
  tenantHttp.post('/api/tenant/cooperativeClient/list', payload)
export const exportTenantClient = (payload = {}) => exportPost('/api/tenant/cooperativeClient/export', payload)
export const searchTenantClients = (payload = {}) => tenantHttp.post('/api/tenant/cooperativeClient/all', payload)
export const getTenantClientUsers = (payload = {}) => tenantHttp.post('/api/tenant/user/all', payload)
export const addTenantClient = (payload) => tenantHttp.post('/api/tenant/cooperativeClient/add', payload)
export const editTenantClient = (payload) => tenantHttp.post('/api/tenant/cooperativeClient/edit', payload)
export const deleteTenantClient = (id) =>
  tenantHttp.get('/api/tenant/cooperativeClient/del', { params: { id } })
export const getTenantCraftList = (payload) => tenantHttp.post('/api/tenant/craft/list', payload)
export const searchTenantCrafts = (payload = {}) => tenantHttp.post('/api/tenant/craft/all', payload)
export const addTenantCraft = (payload = {}) => tenantHttp.post('/api/tenant/craft/add', payload)
export const editTenantCraft = (payload = {}) => tenantHttp.post('/api/tenant/craft/edit', payload)
export const changeTenantCraftStatus = (payload = {}) => tenantHttp.post('/api/tenant/craft/status', payload)
export const deleteTenantCraft = (id) => tenantHttp.get('/api/tenant/craft/del', { params: { id } })

export const getTenantCraftPerformanceList = (payload = {}) =>
  tenantHttp.post('/api/tenant/performance/craftStatisticsList', payload)
export const exportTenantCraftPerformance = (payload = {}) =>
  exportPost('/api/tenant/performance/craftStatisticsExport', payload)
export const getTenantPerformanceCraftList = (payload = {}) =>
  tenantHttp.post('/api/tenant/performance/craftList', payload)
export const getTenantPerformanceCraftTotal = () => tenantHttp.get('/api/tenant/performance/craftTotal')
export const exportTenantPerformanceCraft = (payload = {}) =>
  exportPost('/api/tenant/performance/craftExport', payload)
export const getTenantPerformanceDriverList = (payload = {}) =>
  tenantHttp.post('/api/tenant/performance/driverList', payload)
export const getTenantPerformanceDriverTotal = () => tenantHttp.get('/api/tenant/performance/driverTotal')
export const exportTenantPerformanceDriver = (payload = {}) =>
  exportPost('/api/tenant/performance/driverExport', payload)
export const getTenantPerformanceOrderList = (payload = {}) =>
  tenantHttp.post('/api/tenant/performance/orderList', payload)
export const getTenantPerformanceOrderTotal = () => tenantHttp.get('/api/tenant/performance/orderTotal')
export const exportTenantPerformanceOrder = (payload = {}) =>
  exportPost('/api/tenant/performance/orderExport', payload)
export const getTenantFinancialList = (payload = {}) => tenantHttp.post('/api/tenant/financial/list', payload)
export const getTenantFinancialTotal = () => tenantHttp.get('/api/tenant/financial/total')
export const exportTenantFinancial = (payload = {}) => exportPost('/api/tenant/financial/export', payload)

export const getTenantDepartmentOptions = (payload = {}) => tenantHttp.post('/api/tenant/dept/all', payload)
export const getTenantRoleList = (payload = {}) => tenantHttp.post('/api/tenant/role/list', payload)
export const getTenantProductionUsers = (payload = {}) => tenantHttp.post('/api/tenant/user/production', payload)
export const getTenantStaffList = (payload = {}) => tenantHttp.post('/api/tenant/user/list', payload)
export const addTenantStaff = (payload = {}) => tenantHttp.post('/api/tenant/user/add', payload)
export const editTenantStaff = (payload = {}) => tenantHttp.post('/api/tenant/user/edit', payload)
export const resetTenantStaffPassword = (id) => tenantHttp.get('/api/tenant/user/resetPassword', { params: { id } })
export const deleteTenantStaff = (id) => tenantHttp.get('/api/tenant/user/del', { params: { id } })
export const changeTenantStaffStatus = (payload = {}) => tenantHttp.post('/api/tenant/user/status', payload)

export const getTenantDepartmentList = (payload = {}) =>
  tenantHttp.post('/api/tenant/dept/list', payload)
export const getTenantVipList = (payload = {}) => tenantHttp.get('/api/tenant/vip/plan', { params: payload })
export const createTenantVipPay = (payload = {}) => tenantHttp.post('/api/tenant/vip/pay', payload)
export const getTenantVipPayStatus = (id) => tenantHttp.get('/api/tenant/vip/payStatus', { params: { id } })
export const addTenantDepartment = (payload = {}) =>
  tenantHttp.post('/api/tenant/dept/add', payload)
export const editTenantDepartment = (payload = {}) =>
  tenantHttp.post('/api/tenant/dept/edit', payload)
export const deleteTenantDepartment = (id) =>
  tenantHttp.get('/api/tenant/dept/del', { params: { id } })
export const changeTenantDepartmentStatus = (payload = {}) =>
  tenantHttp.post('/api/tenant/dept/status', payload)
