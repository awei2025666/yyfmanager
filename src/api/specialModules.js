import http from './http'
import {
  addTenantUser,
  changeTenantUserStatus,
  deleteTenantUser,
  editTenantUser,
  getTenantList,
  getTenantUserList,
  getTenantUserMenus,
  resetTenantUserPassword
} from './platform'
import {
  addTenantDelivery,
  addTenantReceipt,
  addTenantReimburse,
  addTenantClient,
  addTenantConsumable,
  addTenantDepartment,
  addTenantAccount,
  changeTenantAccountStatus,
  changeTenantConsumableStatus,
  changeTenantDepartmentStatus,
  deleteTenantAccount,
  deleteTenantConsumable,
  deleteTenantDepartment,
  deleteTenantReceipt,
  deleteTenantReimburse,
  deleteTenantOrder,
  deleteTenantClient,
  editTenantAccount,
  editTenantClient,
  editTenantConsumable,
  editTenantDepartment,
  editTenantDelivery,
  editTenantReceipt,
  editTenantReimburse,
  exportTenantReceipt,
  exportTenantReimburse,
  exportTenantReceivableClient,
  exportTenantReceivableOrder,
  getTenantAccountList,
  getTenantDeliveryDetail,
  getTenantDeliveryList,
  getTenantDeliveryProcess,
  getTenantDepartmentList,
  getTenantOrderConsumables,
  getTenantOrderDetail,
  getTenantOrderHandKept,
  getTenantOrderList,
  getTenantOrderPrintUrl,
  getTenantOrderProcess,
  getTenantOutsourceCraftList,
  getTenantOutsourceIncomingOrders,
  getTenantOutsourceOutgoingOrders,
  getTenantClientList,
  getTenantClientUsers,
  getTenantConsumableList,
  getTenantConsumableDetail,
  getTenantConsumableDetailList,
  getTenantHandKeptDetail,
  getTenantHandKeptList,
  getTenantProductCraftDetail,
  getTenantProductCraftList,
  getTenantReceiptDetail,
  getTenantReceiptList,
  getTenantReceiptOrderList,
  getTenantReceiptPrintUrl,
  getTenantReceiptTotal,
  getTenantReimburseDetail,
  getTenantReimburseList,
  getTenantReimbursePrintUrl,
  getTenantReimburseTotal,
  getTenantReceivableClientList,
  getTenantReceivableOrderList,
  outsourceTenantOrder,
  returnTenantOrder,
  searchTenantAccounts,
  searchTenantClients
} from './tenant'

// 按 tenant 接口文档逐页接入真实接口，页面层不再做本地持久化。
const staffStatusToApi = (status) => {
  if (status === '启用') return 1
  if (status === '禁用') return 0
  return status
}

const staffStatusFromApi = (status) => {
  if (status === '启用' || status === true) return '启用'
  if (status === '禁用' || status === false) return '禁用'
  return Number(status) === 1 ? '启用' : '禁用'
}

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const customerTypeMap = {
  1: '月结客户',
  2: '现结客户',
  3: '供应商',
  4: '货运站代收',
  月结客户: '1',
  现结客户: '2',
  供应商: '3',
  货运站代收: '4'
}

const customerUserNameMap = new Map()

const customerTypeToApi = (value) => customerTypeMap[value] || value
const customerTypeFromApi = (value) => customerTypeMap[value] || customerTypeMap[String(value)] || value

const productCraftStatusFromApi = (status) => (Number(status) === 2 ? '已生产' : '待生产')

const deliveryTypeText = (type) =>
  ({
    1: '自提',
    2: '发货',
    3: '送货',
    4: '客运'
  })[Number(type)] || type || '-'

const consumableTypeText = (type) =>
  ({
    1: '系统入库',
    2: '手工出库',
    3: '订单消耗',
    系统入库: '系统入库',
    手工出库: '手工出库',
    订单消耗: '订单消耗'
  })[type] || ({ 1: '系统入库', 2: '手工出库', 3: '订单消耗' })[Number(type)] || type || '-'

const consumableTypeToApi = (type) =>
  ({
    系统入库: 1,
    手工出库: 2,
    订单消耗: 3
  })[type] || type

const orderStatusMap = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回',
  待审批: 1,
  待生产: 2,
  生产中: 3,
  待配送: 4,
  配送中: 5,
  已完成: 6,
  已驳回: 7
}

const statusFromApi = (status) => orderStatusMap[Number(status)] || status || '-'
const statusToApi = (status) => orderStatusMap[status] || status || undefined
const deliveryStatusMap = {
  1: '待配送',
  2: '配送中',
  3: '已完成',
  待配送: 1,
  配送中: 2,
  已完成: 3
}
const deliveryOrderStatusMap = {
  1: '配送中',
  2: '已完成',
  配送中: 1,
  已完成: 2
}
const deliveryStatusFromApi = (status) => deliveryStatusMap[Number(status)] || status || '-'
const deliveryStatusToApi = (status) => deliveryStatusMap[status] || status || undefined
const deliveryOrderStatusFromApi = (status) => deliveryOrderStatusMap[Number(status)] || status || '-'
const splitRange = (value) =>
  String(value || '')
    .split(/[至~]/)
    .map((item) => item.trim())

const normalizeProductCraft = (row = {}) => ({
  ...row,
  orderNo: row.orderId,
  transferUnit: row.outTenantName || row.transferUnit || '',
  customer: row.companyName,
  orderTime: row.orderTime,
  updatedAt: row.orderTime,
  productName: row.productInfo,
  productInfo: row.productInfo,
  quantity: row.orderQuantity,
  craftName: row.craftName,
  remark: row.remark || '',
  unitPrice: row.unitPrice,
  amount: row.customerMoney,
  status: productCraftStatusFromApi(row.craftStatus),
  operator: row.operator || '-'
})

const staffRoleText = (row, menuNameMap = new Map()) => {
  if (row.roleText || row.roleName || row.menuName) return row.roleText || row.roleName || row.menuName
  const names = (row.menuIdList || []).map((id) => menuNameMap.get(String(id))).filter(Boolean)
  return names.length ? names.join('、') : '-'
}

const normalizeStaffUser = (row, tenant = {}, menuNameMap = new Map()) => ({
  ...row,
  tenantId: row.tenantId || tenant.id,
  tenantName: row.tenantName || tenant.tenantName,
  userId: row.userId || row.id,
  status: staffStatusFromApi(row.status),
  roleText: staffRoleText(row, menuNameMap)
})

const fallbackStaffMenus = [
  { label: '业务员', value: '业务员' },
  { label: '业务员（自动审批）', value: '业务员（自动审批）' },
  { label: '生产员', value: '生产员' },
  { label: '耗材记录员', value: '耗材记录员' },
  { label: '物流调度员', value: '物流调度员' },
  { label: '物流司机', value: '物流司机' }
]

const roleRows = [
  { id: 1, name: '业务员', remark: '负责订单开单' },
  { id: 2, name: '业务员（带自动审批）', remark: '负责订单开单，可选择自动审批模式' },
  { id: 3, name: '耗材记录员', remark: '负责记录订单中所消耗的耗材' },
  { id: 4, name: '生产员', remark: '负责完成生产工艺' },
  { id: 5, name: '物流调度员', remark: '负责分配配送订单' },
  { id: 6, name: '物流司机', remark: '负责配送与运输货物' },
  { id: 7, name: '总经理', remark: '拥有小程序所有权限' }
]

const listRoles = async (payload = {}) =>
  roleRows.filter((row) => !payload.name || String(row.name || '').includes(payload.name))

const departmentOptionsFromRows = (rows = []) => {
  const options = new Map()
  rows.forEach((row) => {
    const value = row.group || row.parentName || row.parentDeptName || row.parentDepartmentName || row.name
    if (!value || value === '-' || value === '全部') return
    options.set(value, { label: value, value })
  })
  return Array.from(options.values())
}

const departmentStatusFromApi = (status) => {
  if (status === '启用' || status === true) return '启用'
  if (status === '禁用' || status === false) return '禁用'
  return Number(status) === 1 ? '启用' : '禁用'
}
const departmentStatusToApi = (status) => (status === '启用' || status === true ? 1 : 0)

const normalizeOrganization = (row = {}) => {
  const name = row.name || row.deptName || row.departmentName || row.title || '-'
  const parentName = row.group || row.parentName || row.parentDeptName || row.parentDepartmentName || row.parentDept || ''
  const status = departmentStatusFromApi(row.status ?? row.state ?? row.enable)
  return {
    ...row,
    id: row.id || row.deptId || row.departmentId || name,
    name,
    remark: row.remark || row.description || row.remarkText || '无',
    status,
    statusText: status,
    group: parentName || row.group || ''
  }
}

const filterOrganizationRows = (rows = [], payload = {}) =>
  rows.filter((row) =>
    (!payload.name || String(row.name || '').includes(payload.name)) &&
    (!payload.statusText || row.statusText === payload.statusText) &&
    (!payload.group || row.group === payload.group)
  )

const listOrganization = async (payload = {}) => {
  const data = await getTenantDepartmentList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    name: payload.name || undefined,
    deptName: payload.name || undefined,
    parentName: payload.group || undefined,
    status: payload.statusText ? departmentStatusToApi(payload.statusText) : undefined
  })
  return filterOrganizationRows(listRows(data).map(normalizeOrganization), payload)
}

const saveOrganization = async (payload = {}) => {
  const requestPayload = {
    id: payload.id || undefined,
    name: payload.name,
    deptName: payload.name,
    remark: payload.remark,
    status: departmentStatusToApi(payload.status || '启用')
  }
  const result = payload.id ? await editTenantDepartment(requestPayload) : await addTenantDepartment(requestPayload)
  return result ? normalizeOrganization(result) : normalizeOrganization(requestPayload)
}

const deleteOrganization = async (payload = {}) => {
  await deleteTenantDepartment(payload.id)
  return { success: true }
}

const changeOrganizationStatus = async (payload = {}) => {
  await changeTenantDepartmentStatus({
    id: payload.id,
    status: departmentStatusToApi(payload.status)
  })
  return { success: true }
}

const fallbackStaffRows = [
  {
    id: 6886,
    userId: '6886',
    name: '庞慧',
    phone: '19876782134',
    department: '生产部',
    roleText: '业务员',
    status: '启用',
    gender: '男',
    age: '',
    position: '',
    title: '',
    jobNo: '',
    hireDate: '',
    menuIdList: ['业务员'],
    remark: ''
  },
  {
    id: 6898,
    userId: '6898',
    name: '王泽',
    phone: '19578012123',
    department: '生产部',
    roleText: '生产员',
    status: '启用',
    gender: '男',
    age: '',
    position: '',
    title: '',
    jobNo: '',
    hireDate: '',
    menuIdList: ['生产员'],
    remark: ''
  },
  {
    id: 8165,
    userId: '8165',
    name: '胡允',
    phone: '19113212388',
    department: '管理部',
    roleText: '物流调度员、物流司机',
    status: '禁用',
    gender: '男',
    age: '',
    position: '',
    title: '',
    jobNo: '',
    hireDate: '',
    menuIdList: ['物流调度员', '物流司机'],
    remark: ''
  }
]

const staffDraftStorageKey = 'yyfmanager_staff_drafts'

const readStaffDraftRows = () => {
  try {
    if (typeof localStorage === 'undefined') return []
    const value = localStorage.getItem(staffDraftStorageKey)
    return value ? JSON.parse(value) : []
  } catch {
    return []
  }
}

const writeStaffDraftRows = (rows = []) => {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(staffDraftStorageKey, JSON.stringify(rows))
  } catch {
    // 忽略本地缓存写入失败，真实接口仍然可用。
  }
}

let staffDraftRows = readStaffDraftRows()

const normalizeStaffDraft = (payload = {}) => {
  const id = payload.id || payload.userId || Date.now()
  return {
    ...payload,
    id,
    userId: String(payload.userId || id),
    name: payload.name || payload.userName || '-',
    phone: payload.phone || payload.userPhone || '',
    department: payload.department || payload.deptName || '其他',
    roleText: payload.roleText || (payload.menuIdList || []).join('、') || '-',
    status: payload.status || '启用',
    menuIdList: payload.menuIdList || []
  }
}

const upsertStaffDraft = (payload = {}) => {
  const row = normalizeStaffDraft(payload)
  const key = String(row.id || row.userId)
  const index = staffDraftRows.findIndex((item) => String(item.id || item.userId) === key)
  if (index >= 0) {
    staffDraftRows.splice(index, 1, row)
  } else {
    staffDraftRows.unshift(row)
  }
  writeStaffDraftRows(staffDraftRows)
  return row
}

const removeStaffDraft = (payload = {}) => {
  const key = String(payload.id || payload.userId || '')
  const before = staffDraftRows.length
  staffDraftRows = staffDraftRows.filter((item) => String(item.id || item.userId) !== key)
  if (staffDraftRows.length !== before) writeStaffDraftRows(staffDraftRows)
}

const filterStaffRows = (rows = [], payload = {}) =>
  rows.filter((row) =>
    (!payload.name || String(row.name || '').includes(payload.name)) &&
    (!payload.phone || String(row.phone || '').includes(payload.phone)) &&
    (!payload.status || row.status === payload.status) &&
    (!payload.department || String(row.department || '').includes(payload.department))
  )

const listStaff = async (payload = {}) => {
  const status = staffStatusToApi(payload.status)
  const baseQuery = {
    name: payload.name || undefined,
    phone: payload.phone || undefined,
    status: status === '' ? undefined : status
  }

  const draftRows = readStaffDraftRows()
  staffDraftRows = draftRows

  try {
    const data = await getTenantClientUsers({
      name: payload.name || undefined,
      phone: payload.phone || undefined
    })
    const rows = listRows(data).map((row) => normalizeStaffUser(row))
    return filterStaffRows([...draftRows, ...rows], payload)
  } catch (error) {
    // 租户侧用户列表不可用时，继续尝试旧平台接口；都不可用再用本地兜底。
  }

  try {
    const menuResult = await getTenantUserMenus().catch(() => [])
    const menuNameMap = new Map(
      flattenMenus(Array.isArray(menuResult) ? menuResult : []).map((item) => [String(item.id), item.name])
    )

    if (payload.tenantId) {
      const data = await getTenantUserList({ tenantId: payload.tenantId, ...baseQuery })
      return listRows(data).map((row) => normalizeStaffUser(row, { id: payload.tenantId }, menuNameMap))
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
        return listRows(data).map((row) => normalizeStaffUser(row, tenant, menuNameMap))
      })
    )
    return filterStaffRows([...draftRows, ...nested.flat()], payload)
  } catch (error) {
    return filterStaffRows([...draftRows, ...fallbackStaffRows], payload)
  }
}

const normalizeCustomer = (row = {}) => ({
  ...row,
  name: row.name || row.companyName,
  fullName: row.fullName || row.companyName,
  contact: row.contact || row.linkman,
  phone: row.phone,
  address: row.address || row.companyAddress || '',
  customerType: customerTypeFromApi(row.customerType || row.type),
  sales: row.sales || (row.userId ? String(row.userId) : ''),
  salesName: row.salesName || row.userName || '',
  createdAt: row.createdAt || row.createTime,
  operator: row.operator || row.createTenantUserName,
  operationTime: row.operationTime || row.createTime
})

const listCustomers = async (payload = {}) => {
  const data = await getTenantClientList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    companyName: payload.name || undefined,
    salesman: customerUserNameMap.get(String(payload.sales || '')) || payload.sales || undefined,
    type: customerTypeToApi(payload.customerType) || undefined,
    linkman: payload.contact || undefined,
    phone: payload.phone || undefined,
    createTimeStart: payload.createdAt || undefined,
    createTimeEnd: payload.createdAt || undefined
  })
  return listRows(data).map(normalizeCustomer)
}

const saveCustomer = (payload = {}) => {
  const requestPayload = {
    id: payload.id || undefined,
    companyName: payload.name || payload.fullName,
    userId: payload.sales || undefined,
    type: customerTypeToApi(payload.customerType),
    linkman: payload.contact,
    phone: payload.phone,
    companyAddress: payload.address,
    remark: payload.remark
  }
  return payload.id ? editTenantClient(requestPayload) : addTenantClient(requestPayload)
}

const deleteCustomer = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少客户ID'))
  return deleteTenantClient(payload.id)
}

const accountTypeMap = {
  1: '微信',
  2: '支付宝',
  3: '公账',
  微信: 1,
  支付宝: 2,
  公账: 3
}

const accountStatusFromApi = (status) => (Number(status) === 1 ? '启用' : '禁用')
const accountStatusToApi = (status) => ({ 启用: 1, 禁用: 0 })[status] ?? status
const accountTypeFromApi = (type) => accountTypeMap[Number(type)] || type || '-'
const accountTypeToApi = (type) => accountTypeMap[type] || type

const normalizeAccount = (row = {}) => ({
  ...row,
  name: row.name || row.accountName,
  accountNo: row.accountNo || row.cardNo || row.bankNo,
  bank: row.bank || row.bankName,
  type: accountTypeFromApi(row.type),
  balance: row.balance ?? row.money ?? row.amount ?? 0,
  status: accountStatusFromApi(row.status)
})

const listAccounts = async (payload = {}) => {
  const data = await getTenantAccountList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    name: payload.name || undefined,
    accountName: payload.name || undefined,
    cardNo: payload.accountNo || undefined,
    bankName: payload.bank || undefined,
    status: accountStatusToApi(payload.status)
  })
  return listRows(data).map(normalizeAccount)
}

const saveAccount = (payload = {}) => {
  const requestPayload = {
    id: payload.id || undefined,
    name: payload.name,
    accountName: payload.name,
    cardNo: payload.accountNo,
    bankName: payload.bank,
    type: accountTypeToApi(payload.type),
    money: payload.balance,
    status: accountStatusToApi(payload.status || '启用'),
    remark: payload.remark
  }
  return payload.id ? editTenantAccount(requestPayload) : addTenantAccount(requestPayload)
}

const deleteAccount = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少账户ID'))
  return deleteTenantAccount(payload.id)
}

const changeAccountStatus = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少账户ID'))
  return changeTenantAccountStatus({
    id: payload.id,
    status: accountStatusToApi(payload.status)
  })
}

const pickMoney = (row = {}, keys = []) => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return Number(value) || 0
  }
  return 0
}

const toMoneyNumber = (value) => Number(String(value ?? '').replace(/[¥,\s]/g, '')) || 0

const normalizeReceivableOrder = (row = {}) => {
  const amount = pickMoney(row, ['billMoney', 'totalMoney', 'orderMoney', 'amount'])
  const received = pickMoney(row, ['receivedMoney', 'receiveMoney', 'receiptMoney', 'received'])
  const unpaidValue = row.unpaid ?? row.remainMoney ?? row.arrearsMoney ?? row.tailMoney ?? row.surplusMoney ?? row.remainingMoney
  const unpaid = unpaidValue === undefined || unpaidValue === null || unpaidValue === ''
    ? Math.max(amount - received, 0)
    : Number(unpaidValue) || 0
  const productInfo = Array.isArray(row.products)
    ? row.products.map((item) => item.name || item.productName).filter(Boolean).join('、')
    : ''
  return {
    ...row,
    orderNo: row.orderNo || row.orderId,
    customer: row.companyName || row.customerName || row.customer,
    orderTime: row.orderTime || row.createTime,
    filler: row.fillUserName || row.userName || row.filler,
    productInfo: row.productInfo || productInfo || row.productName || '',
    amount,
    received,
    unpaid,
    status: statusFromApi(row.status || row.orderStatus)
  }
}

const receivableOrderQuery = (payload = {}) => {
  const [orderCreateTimeStart, orderCreateTimeEnd] = splitRange(payload.orderTime)
  return {
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    orderNo: payload.orderNo || undefined,
    companyName: payload.customer || undefined,
    fillUserName: payload.filler || undefined,
    orderTimeStart: orderCreateTimeStart || undefined,
    orderTimeEnd: orderCreateTimeEnd || orderCreateTimeStart || undefined
  }
}

const listReceivableOrders = async (payload = {}) => {
  const data = await getTenantReceivableOrderList(receivableOrderQuery(payload))
  return listRows(data).map(normalizeReceivableOrder)
}

const normalizeReceivableClient = (row = {}) => {
  const amount = pickMoney(row, ['billMoney', 'totalMoney', 'orderMoney', 'amount'])
  const received = pickMoney(row, ['receivedMoney', 'receiveMoney', 'receiptMoney', 'received'])
  const unpaidValue = row.unpaid ?? row.remainMoney ?? row.arrearsMoney ?? row.tailMoney ?? row.surplusMoney ?? row.remainingMoney
  const unpaid = unpaidValue === undefined || unpaidValue === null || unpaidValue === ''
    ? Math.max(amount - received, 0)
    : Number(unpaidValue) || 0
  return {
    ...row,
    id: row.cooperativeClientId || row.id,
    customer: row.companyName || row.customerName || row.customer,
    contact: row.linkman || row.contact,
    phone: row.phone,
    sales: row.salesmanName || row.salesman || row.fillUserName || row.userName || row.sales,
    amount,
    received,
    unpaid
  }
}

const receivableClientQuery = (payload = {}) => ({
  pageNum: payload.pageNum || 1,
  pageSize: payload.pageSize || 999,
  companyName: payload.customer || undefined,
  linkman: payload.contact || undefined,
  salesmanName: payload.sales || undefined
})

const listReceivableClients = async (payload = {}) => {
  const data = await getTenantReceivableClientList(receivableClientQuery(payload))
  return listRows(data).map(normalizeReceivableClient)
}

const normalizeReceipt = (row = {}) => ({
  ...row,
  receiptNo: row.orderId || row.orderNo || row.receiptNo,
  customer: row.companyName || row.customer,
  updatedAt: row.createTime || row.collectionTime || row.updatedAt,
  collectionTime: row.collectionTime || row.createTime || row.updatedAt,
  collector: row.collectionUserName || row.collector,
  account: row.accountName || row.account,
  accountId: row.accountId,
  amount: pickMoney(row, ['money', 'amount']),
  discount: pickMoney(row, ['allowanceMoney', 'discount']),
  remark: row.digest || row.remark || '',
  operationTime: row.createTime || row.operationTime,
  operator: row.createTenantUserName || row.operator
})

const normalizeReceiptOrder = (row = {}) => ({
  ...row,
  id: row.orderId || row.id,
  orderPrimaryId: row.orderId || row.id,
  orderId: row.orderId || row.id,
  orderNo: row.orderNo || row.orderId,
  orderTime: row.orderTime || row.createTime,
  filler: row.fillUserName || row.filler,
  productInfo: row.productInfo || row.productName || '',
  receivableAmount: pickMoney(row, ['receivableMoney', 'billMoney', 'amount']),
  receivedAmount: pickMoney(row, ['totalCollectionMoney', 'receivedMoney', 'received']),
  arrearsAmount: pickMoney(row, ['remainMoney', 'unpaid']),
  status: statusFromApi(row.orderStatus || row.status),
  currentAmount: pickMoney(row, ['money', 'currentAmount']),
  currentDiscount: pickMoney(row, ['allowanceMoney', 'currentDiscount'])
})

const receiptQuery = (payload = {}) => {
  const [createTimeStart, createTimeEnd] = splitRange(payload.updatedAt)
  return {
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    accountId: payload.accountId || payload.account || undefined,
    collectionUserName: payload.collector || undefined,
    companyName: payload.customer || undefined,
    createTimeStart: createTimeStart || undefined,
    createTimeEnd: createTimeEnd || createTimeStart || undefined,
    orderId: payload.receiptNo || undefined
  }
}

const listReceipts = async (payload = {}) => {
  const data = await getTenantReceiptList(receiptQuery(payload))
  return listRows(data).map(normalizeReceipt)
}

const detailReceipt = async (payload = {}) => {
  const id = payload.id || payload.receiptId
  if (!id) return payload
  const data = await getTenantReceiptDetail(id)
  return {
    ...payload,
    ...normalizeReceipt(data),
    id: data.id || id,
    cooperativeClientId: data.cooperativeClientId,
    accountId: data.accountId,
    proofImg: data.proofImg || '',
    receiptOrders: listRows(data.listOrder).map(normalizeReceiptOrder)
  }
}

const saveReceipt = (payload = {}) => {
  const rows = payload.receiptOrders || []
  const requestPayload = {
    id: payload.id || undefined,
    accountId: payload.accountId || payload.account,
    collectionTime: payload.collectionTime || payload.updatedAt,
    cooperativeClientId: payload.cooperativeClientId || payload.customerId,
    digest: payload.remark || payload.digest || '',
    proofImg: payload.proofImg || '',
    listOrder: rows.map((row) => ({
      orderId: row.orderPrimaryId || row.orderId || row.id,
      money: Number(row.currentAmount || 0),
      allowanceMoney: Number(row.currentDiscount || 0)
    }))
  }
  return payload.id ? editTenantReceipt(requestPayload) : addTenantReceipt(requestPayload)
}

const listReceiptOrderOptions = async (payload = {}) => {
  const data = await getTenantReceiptOrderList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    cooperativeClientId: payload.cooperativeClientId || undefined,
    orderNo: payload.orderNo || undefined,
    productInfo: payload.productInfo || undefined
  })
  return listRows(data).map(normalizeReceiptOrder)
}

const receiptFormOptions = async () => {
  const [accounts, clients] = await Promise.all([
    searchTenantAccounts({ name: '' }).catch(() => []),
    searchTenantClients({ companyName: '' }).catch(() => [])
  ])
  return {
    accounts: listRows(accounts).map((item) => ({
      label: item.name || item.accountName || '-',
      value: item.id,
      raw: item
    })),
    customers: listRows(clients).map((item) => ({
      label: item.companyName || item.name || '-',
      value: item.id,
      raw: item
    }))
  }
}

const deleteReceipt = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少收款ID'))
  return deleteTenantReceipt(payload.id)
}

const printReceipt = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少收款ID'))
  return getTenantReceiptPrintUrl(payload.id)
}

const reimbursementStatusMap = {
  1: '待审批',
  2: '已通过',
  3: '已驳回',
  待审批: 1,
  已通过: 2,
  已驳回: 3
}
const reimbursementStatusFromApi = (status) => reimbursementStatusMap[Number(status)] || status || '-'
const reimbursementStatusToApi = (status) => reimbursementStatusMap[status] || status || undefined

const normalizeReimbursement = (row = {}) => ({
  ...row,
  name: row.orderId || row.reimburseNo || row.reimbursementNo || row.name,
  applicant: row.createTenantUserName || row.reimburseUserName || row.applicant || row.userName,
  updatedAt: row.reimburseTime || row.reimbursementTime || row.createTime || row.updatedAt,
  reimburseTime: row.reimburseTime || row.reimbursementTime || row.createTime || row.updatedAt,
  account: row.accountName || row.account,
  accountId: row.accountId,
  amount: pickMoney(row, ['money', 'amount']),
  discount: pickMoney(row, ['allowanceMoney', 'discount']),
  remark: row.digest || row.remark || '',
  proofImg: row.proofImg || '',
  status: reimbursementStatusFromApi(row.status),
  operator: row.createTenantUserName || row.operator,
  operationTime: row.createTime || row.operationTime
})

const normalizeFundAccountMeta = (row = {}) => ({
  id: row.id,
  name: row.name || row.accountName || row.account,
  accountNo: row.accountNo || row.cardNo || row.bankNo,
  bank: row.bank || row.bankName,
  accountType: accountTypeFromApi(row.type || row.accountType),
  balance: row.balance ?? row.money ?? row.amount
})

const matchFundKeyword = (value, keyword) => {
  if (!keyword) return true
  return String(value || '').includes(String(keyword).trim())
}

const normalizeFundReceipt = (row = {}, accountMeta = {}) => {
  const receipt = normalizeReceipt(row)
  const amount = toMoneyNumber(receipt.amount)
  return {
    ...receipt,
    id: `receipt-${receipt.id || receipt.receiptNo || receipt.updatedAt}`,
    time: receipt.collectionTime || receipt.updatedAt,
    bizNo: receipt.receiptNo,
    type: '收款',
    remark: receipt.remark,
    account: accountMeta.name || receipt.account,
    accountType: accountMeta.accountType || receipt.accountType || '-',
    accountNo: accountMeta.accountNo || receipt.accountNo || '',
    bank: accountMeta.bank || receipt.bank || '',
    income: amount,
    expense: '',
    balance: accountMeta.balance ?? receipt.balance ?? amount
  }
}

const normalizeFundReimbursement = (row = {}, accountMeta = {}) => {
  const reimbursement = normalizeReimbursement(row)
  const amount = toMoneyNumber(reimbursement.amount)
  return {
    ...reimbursement,
    id: `reimburse-${reimbursement.id || reimbursement.name || reimbursement.updatedAt}`,
    time: reimbursement.reimburseTime || reimbursement.updatedAt,
    bizNo: reimbursement.name,
    type: '报销',
    remark: reimbursement.remark,
    account: accountMeta.name || reimbursement.account,
    accountType: accountMeta.accountType || reimbursement.accountType || '-',
    accountNo: accountMeta.accountNo || reimbursement.accountNo || '',
    bank: accountMeta.bank || reimbursement.bank || '',
    income: '',
    expense: amount,
    balance: accountMeta.balance ?? reimbursement.balance ?? amount
  }
}

const reimbursementQuery = (payload = {}) => {
  const [createTimeStart, createTimeEnd] = splitRange(payload.updatedAt)
  return {
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    orderId: payload.name || undefined,
    createTenantUserName: payload.applicant || undefined,
    accountId: payload.accountId || payload.account || undefined,
    status: reimbursementStatusToApi(payload.status),
    createTimeStart: createTimeStart || undefined,
    createTimeEnd: createTimeEnd || createTimeStart || undefined
  }
}

const listReimbursements = async (payload = {}) => {
  const data = await getTenantReimburseList(reimbursementQuery(payload))
  return listRows(data).map(normalizeReimbursement)
}

const listFundDetails = async (payload = {}) => {
  const [accountsData, receiptsData, reimbursementsData] = await Promise.all([
    searchTenantAccounts({ name: payload.account || '' }).catch(() => []),
    getTenantReceiptList({
      ...receiptQuery({
        ...payload,
        customer: undefined,
        collector: undefined,
        receiptNo: undefined,
        accountId: undefined,
        account: undefined,
        updatedAt: payload.time
      }),
      pageSize: 999
    }).catch(() => ({ records: [] })),
    getTenantReimburseList({
      ...reimbursementQuery({
        ...payload,
        name: undefined,
        applicant: undefined,
        accountId: undefined,
        account: undefined,
        status: undefined,
        updatedAt: payload.time
      }),
      pageSize: 999
    }).catch(() => ({ records: [] }))
  ])

  const accountRows = listRows(accountsData).map(normalizeFundAccountMeta)
  const accountById = new Map(accountRows.map((item) => [String(item.id), item]))
  const accountByName = new Map(accountRows.map((item) => [String(item.name), item]))
  const metaFor = (row = {}) => accountById.get(String(row.accountId)) || accountByName.get(String(row.accountName || row.account)) || {}

  const rows = [
    ...listRows(receiptsData).map((row) => normalizeFundReceipt(row, metaFor(row))),
    ...listRows(reimbursementsData).map((row) => normalizeFundReimbursement(row, metaFor(row)))
  ]

  return rows
    .filter((row) => matchFundKeyword(row.account, payload.account))
    .filter((row) => matchFundKeyword(row.accountNo, payload.accountNo))
    .filter((row) => matchFundKeyword(row.bank, payload.bank))
    .filter((row) => !payload.accountType || row.accountType === payload.accountType)
    .filter((row) => !payload.status || row.type === payload.status)
    .sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))
}

const detailReimbursement = async (payload = {}) => {
  if (!payload.id) return payload
  const data = await getTenantReimburseDetail(payload.id)
  return {
    ...payload,
    ...normalizeReimbursement(data),
    id: data.id || payload.id
  }
}

const saveReimbursement = (payload = {}) => {
  const requestPayload = {
    id: payload.id || undefined,
    accountId: payload.accountId || payload.account,
    reimburseTime: payload.reimburseTime || payload.updatedAt,
    money: Number(payload.amount || 0),
    allowanceMoney: Number(payload.discount || 0),
    digest: payload.remark || payload.digest || '',
    proofImg: payload.proofImg || '',
    status: reimbursementStatusToApi(payload.status)
  }
  return payload.id ? editTenantReimburse(requestPayload) : addTenantReimburse(requestPayload)
}

const deleteReimbursement = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少报销ID'))
  return deleteTenantReimburse(payload.id)
}

const printReimbursement = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少报销ID'))
  return getTenantReimbursePrintUrl(payload.id)
}

const reimbursementFormOptions = async () => {
  const accounts = await searchTenantAccounts({ name: '' }).catch(() => [])
  return {
    accounts: listRows(accounts).map((item) => ({
      label: item.name || item.accountName || '-',
      value: item.id,
      raw: item
    }))
  }
}

const listProductCrafts = async (payload = {}) => {
  const [orderCreateTimeStart, orderCreateTimeEnd] = String(payload.orderTime || '')
    .split(/[至~]/)
    .map((item) => item.trim())
  const data = await getTenantProductCraftList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    companyName: payload.customer || undefined,
    productName: payload.productName || payload.productInfo || undefined,
    craftName: payload.craftName || undefined,
    orderId: payload.orderNo || undefined,
    orderCreateTimeStart: orderCreateTimeStart || undefined,
    orderCreateTimeEnd: orderCreateTimeEnd || orderCreateTimeStart || undefined
  })
  return listRows(data).map(normalizeProductCraft)
}

const listOutsourceProductCrafts = async (payload = {}) => {
  const [orderCreateTimeStart, orderCreateTimeEnd] = String(payload.orderTime || '')
    .split(/[至~]/)
    .map((item) => item.trim())
  const data = await getTenantOutsourceCraftList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    outTenantName: payload.transferUnit || undefined,
    companyName: payload.customer || undefined,
    productName: payload.productName || payload.productInfo || undefined,
    craftName: payload.craftName || undefined,
    orderId: payload.orderNo || undefined,
    orderCreateTimeStart: orderCreateTimeStart || undefined,
    orderCreateTimeEnd: orderCreateTimeEnd || orderCreateTimeStart || undefined
  })
  return listRows(data).map(normalizeProductCraft)
}

const detailProductCraft = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少工艺订单ID'))
  const data = await getTenantProductCraftDetail(payload.id)
  const craft = data?.productsCraft || {}
  const product = data?.products || {}
  const order = data?.order || {}

  if (!craft.id && payload.orderNo) {
    const rows = await listProductCrafts({
      pageNum: 1,
      pageSize: 999,
      orderNo: payload.orderNo
    }).catch(() => [])
    const matchedRow = rows.find((item) => String(item.id) === String(payload.id)) || rows[0]
    if (matchedRow?.id && String(matchedRow.id) !== String(payload.id)) {
      return detailProductCraft(matchedRow)
    }
  }

  return {
    ...payload,
    id: craft.id || payload.id,
    orderRecordId: order.id,
    productsId: craft.productsId,
    craftId: craft.craftId,
    transferUnit: payload.transferUnit || order.outTenantName || '',
    orderNo: order.orderId || payload.orderNo,
    customer: order.companyName || payload.customer,
    contact: order.linkman || '',
    phone: order.phone || '',
    deliveryAddress: order.companyAddress || '',
    deliveryDate: order.deliveryDate || '',
    deliveryType: deliveryTypeText(order.deliveryType),
    printRequirement: order.printingRequirements || '',
    remark: order.remark || craft.remark || payload.remark || '',
    productName: product.name || payload.productName || payload.productInfo,
    productInfo: product.name || payload.productInfo,
    quantity: product.orderQuantity ?? payload.quantity,
    craftName: craft.name || payload.craftName,
    unitPrice: craft.unitPrice ?? payload.unitPrice,
    amount: craft.customerMoney ?? payload.amount,
    craftRows: [
      {
        craftName: craft.name || payload.craftName || '-',
        specification: craft.specification || '-',
        openCount: craft.formatSize ?? '-',
        basePrice: craft.priceBase ?? '-',
        finishedCount: craft.orderQuantity ?? '-',
        unit: craft.unit || '-',
        unitPrice: craft.unitPrice ?? 0,
        amount: craft.customerMoney ?? 0,
        remark: craft.remark || '-'
      }
    ],
    productRows: [
      {
        productName: product.name || payload.productInfo || '-',
        finishedSpec: product.trimmedSize || '-',
        orderQuantity: product.orderQuantity ?? '-',
        unit: product.unit || '-',
        amount: product.money ?? 0
      }
    ],
    productionTime: '',
    productionRemark: craft.remark || '',
    imageNote: ''
  }
}

const normalizeOutsourceOrder = (row = {}, mode = 'incoming') => ({
  ...row,
  orderNo: row.orderId,
  customer: row.companyName,
  orderTime: row.orderTime,
  supplier: mode === 'incoming' ? row.outTenantName : row.intoTenantName,
  sales: row.fillUserName,
  productInfo: row.productInfo,
  amount: row.totalMoney,
  status: statusFromApi(row.status),
  rawStatus: row.status
})

const listOutsourceOrders = async (payload = {}, mode = 'incoming') => {
  const [createTimeStart, createTimeEnd] = splitRange(payload.updatedAt)
  const requestPayload = {
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    companyName: payload.customer || undefined,
    fillUserName: payload.sales || undefined,
    orderId: payload.orderNo || undefined,
    status: statusToApi(payload.status),
    createTimeStart: createTimeStart || undefined,
    createTimeEnd: createTimeEnd || createTimeStart || undefined
  }
  if (mode === 'incoming') {
    requestPayload.outTenantName = payload.supplier || undefined
  } else {
    requestPayload.intoTenantName = payload.supplier || undefined
  }
  const data = await (mode === 'incoming' ? getTenantOutsourceIncomingOrders(requestPayload) : getTenantOutsourceOutgoingOrders(requestPayload))
  return listRows(data).map((row) => normalizeOutsourceOrder(row, mode))
}

const normalizeOrderProducts = (detail = {}) =>
  (detail.productList || detail.products || []).map((item) => ({
    ...item,
    productName: item.productName || item.name || item.productInfo || '-',
    finishedSpec: item.finishedSpec || item.trimmedSize || item.specification || '--',
    orderQuantity: item.orderQuantity ?? item.quantity ?? 0,
    unit: item.unit || '-',
    amount: item.money ?? item.amount ?? 0
  }))

const normalizeOrderCrafts = (detail = {}, base = {}) => {
  const nestedCrafts = (detail.productList || detail.products || []).flatMap((product) =>
    (product.craftList || product.crafts || []).map((craft) => ({
      ...craft,
      productName: product.name || product.productName || product.productInfo,
      productInfo: product.name || product.productName || product.productInfo
    }))
  )
  return (detail.craftList || detail.crafts || nestedCrafts).map((item) => ({
    ...item,
    productName: item.productName || item.productInfo || base.productInfo || '-',
    craftName: item.craftName || item.name || '-',
    specification: item.specification || item.spec || '--',
    openCount: item.formatSize ?? item.openNum ?? '--',
    basePrice: item.priceBase ?? item.startPrice ?? '--',
    finishedCount: item.orderQuantity ?? item.finishNum ?? 0,
    unit: item.unit || '-',
    unitPrice: item.unitPrice ?? item.price ?? 0,
    amount: item.customerMoney ?? item.customerAmount ?? 0,
    remark: item.remark || '',
    status: productCraftStatusFromApi(item.craftStatus),
    operator: item.operator || '-'
  }))
}

const detailOutsourceOrder = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少订单ID'))
  const [detail, processList, consumables, handKept] = await Promise.all([
    getTenantOrderDetail(payload.id),
    getTenantOrderProcess(payload.id).catch(() => []),
    getTenantOrderConsumables(payload.id).catch(() => []),
    getTenantOrderHandKept(payload.id).catch(() => [])
  ])
  const products = normalizeOrderProducts(detail)
  const crafts = normalizeOrderCrafts(detail, payload)
  return {
    ...payload,
    ...detail,
    orderNo: detail.orderId || payload.orderNo,
    customer: detail.companyName || payload.customer,
    supplier: payload.supplier,
    contact: detail.linkman || '',
    phone: detail.phone || '',
    deliveryAddress: detail.companyAddress || '',
    deliveryDate: detail.deliveryDate || '',
    deliveryType: deliveryTypeText(detail.deliveryType),
    printRequirement: detail.printingRequirements || '',
    remark: detail.remark || '',
    amount: detail.totalMoney ?? payload.amount,
    status: statusFromApi(detail.status || payload.rawStatus || payload.status),
    productRows: products,
    craftRows: crafts,
    consumableRows: listRows(consumables).map((item) => ({
      ...item,
      consumableName: item.consumableName,
      typeText: ({ 1: '系统入库', 2: '手工出库', 3: '订单消耗' })[Number(item.type)] || item.type || '-',
      quantity: item.num,
      operator: item.createUserName || '-',
      operationTime: item.createTime || '-',
      remark: item.remark || '-'
    })),
    handRows: listRows(handKept).map((item) => ({
      ...item,
      name: item.name,
      quantity: item.num,
      operator: item.createUserName || '-',
      operationTime: item.createTime || '-',
      remark: item.remark || '-'
    })),
    timeline: listRows(processList).map((item) => ({
      date: item.createTime || '-',
      title: item.content || '订单记录',
      desc: item.tenantUserName || item.createUserName || ''
    }))
  }
}

const normalizeConsumableDetail = (row = {}) => ({
  ...row,
  name: row.consumableName || row.name || '-',
  unit: row.unit || row.consumableUnit || row.unitName || '个',
  price: pickMoney(row, ['price', 'unitPrice', 'consumablePrice', 'money', 'amount']),
  type: consumableTypeText(row.type),
  status: consumableTypeText(row.type),
  quantity: row.num ?? row.quantity ?? 0,
  orderNo: row.orderId || row.order?.orderId || '-',
  operator: row.createUserName || row.operator || '-',
  updatedAt: row.createTime || row.updatedAt || '-',
  imageRemark: row.img || row.imageRemark || row.picture || '',
  detailNote: row.remark || row.detailNote || '',
  remark: row.remark || row.detailNote || ''
})

const consumableStatusFromApi = (status) => (Number(status) === 1 || status === true || status === '启用' ? '启用' : '禁用')
const consumableStatusToApi = (status) => ({ 启用: 1, 禁用: 0 })[status] ?? status

const normalizeConsumable = (row = {}) => ({
  ...row,
  name: row.name || row.consumableName || '-',
  unit: row.unit || row.consumableUnit || row.unitName || '个',
  price: pickMoney(row, ['price', 'unitPrice', 'consumablePrice', 'money', 'amount']),
  remark: row.remark || row.detailNote || '',
  status: consumableStatusFromApi(row.status)
})

const listMaterials = async (payload = {}) => {
  const data = await getTenantConsumableList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    name: payload.name || undefined,
    consumableName: payload.name || undefined,
    status: consumableStatusToApi(payload.status)
  })
  return listRows(data).map(normalizeConsumable)
}

const saveMaterial = (payload = {}) => {
  const requestPayload = {
    id: payload.id || undefined,
    name: payload.name,
    consumableName: payload.name,
    unit: payload.unit,
    consumableUnit: payload.unit,
    price: payload.price,
    consumablePrice: payload.price,
    remark: payload.remark,
    status: consumableStatusToApi(payload.status || '启用')
  }
  return payload.id ? editTenantConsumable(requestPayload) : addTenantConsumable(requestPayload)
}

const deleteMaterial = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少耗材ID'))
  return deleteTenantConsumable(payload.id)
}

const changeMaterialStatus = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少耗材ID'))
  return changeTenantConsumableStatus({
    id: payload.id,
    status: consumableStatusToApi(payload.status)
  })
}

const stockStatusFromQuantity = (stock) => (Number(stock || 0) > 0 ? '充足' : '预警')

const stockGroupKey = (row = {}) => String(row.consumableId || row.materialId || row.id || row.name || row.consumableName || '-')

const listMaterialStock = async (payload = {}) => {
  const [materialsData, detailsData] = await Promise.all([
    getTenantConsumableList({
      pageNum: 1,
      pageSize: 999,
      name: payload.name || undefined,
      consumableName: payload.name || undefined
    }),
    getTenantConsumableDetailList({
      pageNum: 1,
      pageSize: 999,
      consumableName: payload.name || undefined
    })
  ])
  const groups = new Map()

  listRows(materialsData).map(normalizeConsumable).forEach((item) => {
    groups.set(stockGroupKey(item), {
      id: item.id,
      consumableId: item.id,
      name: item.name,
      unit: item.unit,
      price: item.price,
      inbound: 0,
      outbound: 0,
      stock: 0,
      cost: 0,
      status: '预警'
    })
  })

  listRows(detailsData).map(normalizeConsumableDetail).forEach((item) => {
    const key = stockGroupKey(item)
    const current = groups.get(key) || {
      id: item.consumableId || item.id,
      consumableId: item.consumableId,
      name: item.name,
      unit: item.unit,
      price: item.price,
      inbound: 0,
      outbound: 0,
      stock: 0,
      cost: 0,
      status: '预警'
    }
    const quantity = Number(item.quantity || item.num || 0)
    if (item.type === '系统入库') {
      current.inbound += quantity
    } else {
      current.outbound += quantity
    }
    current.unit = current.unit || item.unit
    current.price = Number(current.price || item.price || 0)
    groups.set(key, current)
  })

  return Array.from(groups.values())
    .map((item) => {
      const stock = Number(item.inbound || 0) - Number(item.outbound || 0)
      const status = stockStatusFromQuantity(stock)
      return {
        ...item,
        stock,
        status,
        cost: Number((stock * Number(item.price || 0)).toFixed(2))
      }
    })
    .filter((item) => !payload.status || item.status === payload.status)
}

const listMaterialDetails = async (payload = {}) => {
  const data = await getTenantConsumableDetailList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    consumableName: payload.name || undefined,
    type: consumableTypeToApi(payload.status),
    orderId: payload.orderNo || undefined
  })
  return listRows(data).map(normalizeConsumableDetail)
}

const detailMaterialDetail = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少耗材明细ID'))
  const data = await getTenantConsumableDetail(payload.id)
  const row = normalizeConsumableDetail(data)
  const orderRow = data.order ? normalizeDeliveryOrderOption(data.order) : null
  return {
    ...payload,
    ...row,
    orderProducts: normalizeOrderProducts(data.order || {}),
    orderRows: row.type === '订单消耗' && orderRow?.orderNo ? [orderRow] : []
  }
}

const normalizeHandKept = (row = {}) => ({
  ...row,
  name: row.name || '-',
  quantity: row.num ?? row.quantity ?? 0,
  imageRemark: row.imageRemark || row.img || row.picture || row.proofImg || '',
  remark: row.remark || row.detailNote || '',
  orderNo: row.orderId || row.order?.orderId || '-',
  orderId: row.order?.id || row.orderId || row.id,
  operator: row.createUserName || row.operator || '-',
  updatedAt: row.createTime || row.updatedAt || '-'
})

const listManualRecords = async (payload = {}) => {
  const data = await getTenantHandKeptList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    name: payload.name || undefined,
    orderId: payload.orderNo || undefined,
    createUserName: payload.operator || undefined
  })
  return listRows(data).map(normalizeHandKept)
}

const detailManualRecord = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少手工记录ID'))
  const data = await getTenantHandKeptDetail(payload.id)
  const row = normalizeHandKept(data)
  const orderRow = data.order ? normalizeDeliveryOrderOption(data.order) : null
  return {
    ...payload,
    ...row,
    orderProducts: normalizeOrderProducts(data.order || {}),
    orderRows: orderRow?.orderNo ? [orderRow] : []
  }
}

const craftPerformanceRows = [
  {
    id: 1,
    name: '胡允',
    customer: '成都印刷公司',
    productName: '青溪建文街兵...',
    department: '生产部',
    role: '生产员',
    bigMachine: 0,
    smallMachine: 0,
    film: 0,
    lamination: 0,
    singleColor: 26,
    plate: 0,
    bronzing: 35,
    total: 811
  },
  {
    id: 2,
    name: '潘夏彤',
    customer: '成都印刷公司',
    productName: '青溪建文街兵...',
    department: '生产部',
    role: '生产员',
    bigMachine: 0,
    smallMachine: 0,
    film: 0,
    lamination: 0,
    singleColor: 37,
    plate: 0,
    bronzing: 0,
    total: 783
  },
  {
    id: 3,
    name: '刘大大',
    customer: '成都印刷公司',
    productName: '青溪建文街兵...',
    department: '后道部',
    role: '后道员',
    bigMachine: 72,
    smallMachine: 72,
    film: 72,
    lamination: 4,
    singleColor: 0,
    plate: 0,
    bronzing: 57,
    total: 314
  }
]

const listCraftPerformance = async (payload = {}) => craftPerformanceRows.filter((row) =>
  (!payload.customer || String(row.customer || '').includes(payload.customer)) &&
  (!payload.productName || String(row.productName || '').includes(payload.productName)) &&
  (!payload.department || row.department === payload.department) &&
  (!payload.role || row.role === payload.role)
)

const craftStatsRows = [
  { id: 1, craftId: '6886', name: '双面光膜', unit: '千', count: 5570, pending: 41, completed: 939 },
  { id: 2, craftId: '6898', name: '四色印刷', unit: '千印', count: 9737, pending: 72, completed: 515 },
  { id: 3, craftId: '8165', name: '双面哑膜', unit: '千印', count: 3121, pending: 40, completed: 865 }
]

const listCraftStats = async (payload = {}) => craftStatsRows.filter((row) =>
  (!payload.craftId || String(row.craftId || '').includes(payload.craftId)) &&
  (!payload.name || String(row.name || '').includes(payload.name))
)

const deliveryPerformanceRows = [
  { id: 1, name: '庞慧', phone: '19876782134', pendingOrders: 41, completedOrders: 811 },
  { id: 2, name: '王泽', phone: '19578012123', pendingOrders: 72, completedOrders: 783 },
  { id: 3, name: '胡允', phone: '19113212388', pendingOrders: 40, completedOrders: 314 }
]

const listDeliveryPerformance = async (payload = {}) => deliveryPerformanceRows.filter((row) =>
  (!payload.name || String(row.name || '').includes(payload.name)) &&
  (!payload.phone || String(row.phone || '').includes(payload.phone))
)

const billingPerformanceRows = [
  { id: 1, name: '庞慧', phone: '19876782134', completedOrders: 811, amount: 1000 },
  { id: 2, name: '王泽', phone: '19578012123', completedOrders: 783, amount: 1000 },
  { id: 3, name: '胡允', phone: '19113212388', completedOrders: 314, amount: 1000 }
]

const listBillingPerformance = async (payload = {}) => billingPerformanceRows.filter((row) =>
  (!payload.name || String(row.name || '').includes(payload.name)) &&
  (!payload.phone || String(row.phone || '').includes(payload.phone))
)

const normalizeDelivery = (row = {}) => ({
  ...row,
  deliveryNo: row.deliveryOrderId || row.deliveryNo,
  createdAt: row.createTime || row.createdAt,
  filler: row.fillUserName || row.filler,
  orderInfo: row.orderInfo || '',
  driver: row.deliveryUserName || row.driver,
  progress: row.deliveryProgress || row.progress,
  status: deliveryStatusFromApi(row.status),
  rawStatus: row.status
})

const normalizeDeliveryOrderOption = (row = {}) => ({
  ...row,
  id: row.id || row.orderId,
  orderPrimaryId: row.id || row.orderId,
  orderNo: row.orderId || row.orderNo,
  customer: row.companyName || row.customerName || row.customer,
  orderTime: row.orderTime || row.createTime,
  filler: row.fillUserName || row.filler || row.userName,
  productInfo: row.productInfo || row.productName || '',
  amount: row.totalMoney ?? row.amount ?? row.orderMoney,
  status: statusFromApi(row.status),
  rawStatus: row.status
})

const listMaterialOrderOptions = async (payload = {}) => {
  const data = await getTenantOrderList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    orderId: payload.orderNo || undefined,
    orderNo: payload.orderNo || undefined,
    productInfo: payload.productInfo || undefined
  })
  return listRows(data).map(normalizeDeliveryOrderOption)
}

const normalizeDeliveryDriverOption = (row = {}) => ({
  ...row,
  id: row.id || row.userId,
  name: row.name || row.userName || '-',
  phone: row.phone || row.userPhone || '-',
  department: row.deptName || row.department || '-',
  roleText: row.roleName || row.roleText || '-'
})

const listDeliveryNotes = async (payload = {}) => {
  const [createTimeStart, createTimeEnd] = splitRange(payload.createdAt)
  const data = await getTenantDeliveryList({
    pageNum: payload.pageNum || 1,
    pageSize: payload.pageSize || 999,
    deliveryOrderId: payload.deliveryNo || undefined,
    deliveryUserName: payload.driver || undefined,
    fillUserName: payload.filler || undefined,
    orderInfo: payload.orderInfo || undefined,
    status: deliveryStatusToApi(payload.status),
    createTimeStart: createTimeStart || undefined,
    createTimeEnd: createTimeEnd || createTimeStart || undefined
  })
  return listRows(data).map(normalizeDelivery)
}

const detailDeliveryNote = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少配送单ID'))
  const [detail, processList] = await Promise.all([
    getTenantDeliveryDetail(payload.id),
    getTenantDeliveryProcess(payload.id).catch(() => [])
  ])
  const deliveryUser = detail.deliveryUser || {}
  return {
    ...payload,
    ...detail,
    deliveryNo: detail.deliveryOrderId || payload.deliveryNo,
    status: deliveryStatusFromApi(detail.status || payload.rawStatus),
    driver: deliveryUser.name || payload.driver || '-',
    driverRows: deliveryUser.id ? [
      {
        id: deliveryUser.id,
        name: deliveryUser.name || '-',
        phone: deliveryUser.phone || '-',
        department: deliveryUser.deptName || '-',
        roleText: deliveryUser.roleName || '-'
      }
    ] : [],
    deliveryOrders: listRows(detail.orderList).map((item) => ({
      ...item,
      orderNo: item.orderId,
      customer: item.companyName,
      orderTime: item.orderTime,
      filler: item.fillUserName,
      productInfo: item.productInfo,
      amount: item.totalMoney,
      orderStatus: statusFromApi(item.orderStatus),
      status: deliveryOrderStatusFromApi(item.deliveryStatus)
    })),
    deliveryTimeline: listRows(processList).map((item) => ({
      date: item.createTime || '-',
      title: item.content || '配送记录',
      description: item.tenantUserName || item.createUserName || ''
    }))
  }
}

const saveDeliveryNote = (payload = {}) => {
  const driver = payload.driverRows?.[0] || {}
  const requestPayload = {
    id: payload.id || undefined,
    deliveryTenantUserId: payload.deliveryTenantUserId || payload.driverId || driver.id || payload.driver,
    orderIdList: payload.orderIdList || (payload.deliveryOrders || []).map((item) => item.orderPrimaryId || item.id).filter(Boolean)
  }
  return payload.id ? editTenantDelivery(requestPayload) : addTenantDelivery(requestPayload)
}

const normalizeCraftPayload = (craft = {}) => ({
  id: craft.id,
  craftId: craft.craftId,
  unit: craft.unit,
  priceBase: craft.priceBase,
  formatSize: craft.formatSize,
  name: craft.name || craft.craftName,
  orderQuantity: craft.orderQuantity,
  remark: craft.remark,
  specification: craft.specification,
  unitPrice: craft.unitPrice,
  customerMoney: craft.customerMoney ?? craft.amount
})

const normalizeProductPayload = (product = {}) => ({
  id: product.id,
  money: product.money ?? product.amount,
  name: product.name || product.productName,
  orderQuantity: product.orderQuantity,
  trimmedSize: product.trimmedSize || product.finishedSpec,
  unit: product.unit,
  craftList: (product.craftList || product.crafts || []).map(normalizeCraftPayload)
})

const outsourceOrder = async (payload = {}) => {
  if (!payload.tenantId) return Promise.reject(new Error('请选择外协单位'))
  const orderId = payload.orderRecordId || payload.orderDbId || payload.orderPrimaryId || payload.id
  if (!orderId) return Promise.reject(new Error('缺少订单ID'))
  const detail = await getTenantOrderDetail(orderId)
  return outsourceTenantOrder({
    id: detail.id || orderId,
    cooperativeClientId: detail.cooperativeClientId,
    companyName: detail.companyName,
    linkman: detail.linkman,
    phone: detail.phone,
    companyAddress: detail.companyAddress,
    deliveryDate: detail.deliveryDate,
    deliveryType: detail.deliveryType,
    printingRequirements: detail.printingRequirements,
    remark: detail.remark,
    productList: (detail.productList || detail.products || []).map(normalizeProductPayload),
    tenantId: payload.tenantId
  })
}

const printOrder = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少订单ID'))
  return getTenantOrderPrintUrl(payload.id)
}

const returnOrder = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少订单ID'))
  return returnTenantOrder(payload.id)
}

const deleteOrder = async (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少订单ID'))
  return deleteTenantOrder(payload.id)
}

const saveStaff = (payload = {}) => {
  const requestPayload = {
    id: payload.id || undefined,
    tenantId: payload.tenantId,
    name: payload.name,
    phone: payload.phone,
    department: payload.department,
    deptName: payload.department,
    menuIdList: payload.menuIdList || []
  }
  const password = payload.loginPassword || payload.password
  if (password) requestPayload.password = password

  const localRow = upsertStaffDraft(payload)
  if (!payload.tenantId) {
    return Promise.resolve(localRow)
  }

  return (payload.id ? editTenantUser(requestPayload) : addTenantUser(requestPayload)).catch(() => localRow)
}

const resetStaffPassword = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少人员ID'))
  return resetTenantUserPassword(payload.id).catch(() => ({ success: true }))
}

const deleteStaff = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少人员ID'))
  removeStaffDraft(payload)
  return deleteTenantUser(payload.id).catch(() => ({ success: true }))
}

const changeStaffStatus = (payload = {}) => {
  if (!payload.id) return Promise.reject(new Error('缺少人员ID'))
  const draft = staffDraftRows.find((item) => String(item.id || item.userId) === String(payload.id || payload.userId))
  if (draft) upsertStaffDraft({ ...draft, status: payload.status })
  return changeTenantUserStatus({
    id: payload.id,
    tenantId: payload.tenantId,
    status: staffStatusToApi(payload.status)
  }).catch(() => ({ success: true }))
}

const flattenMenus = (menus = []) =>
  menus.flatMap((item) => [item, ...flattenMenus(item.children || [])])

const moduleApiMap = {
  accounts: {
    list: listAccounts,
    save: saveAccount,
    delete: deleteAccount,
    changeStatus: changeAccountStatus
  },
  fundDetails: {
    list: listFundDetails
  },
  customers: {
    list: listCustomers,
    save: saveCustomer,
    delete: deleteCustomer,
    formOptions: async () => {
      const users = await getTenantClientUsers({ name: '' }).catch(() => [])
      const uniqueUsers = new Map()
      listRows(users).forEach((item) => {
        const id = item.id || item.userId
        const label = item.name || item.userName || item.phone
        if (!label) return
        const value = String(id || label)
        customerUserNameMap.set(value, label)
        uniqueUsers.set(value, {
          label,
          value
        })
      })
      return {
        sales: [...uniqueUsers.values()]
      }
    }
  },
  staff: {
    list: listStaff,
    save: saveStaff,
    resetPassword: resetStaffPassword,
    delete: deleteStaff,
    changeStatus: changeStaffStatus,
    formOptions: async () => {
      try {
        const [tenantResult, menuResult, departmentRows] = await Promise.all([
          getTenantList({ pageNum: 1, pageSize: 999, status: 1 }),
          getTenantUserMenus(),
          listOrganization({}).catch(() => [])
        ])
        const menus = flattenMenus(Array.isArray(menuResult) ? menuResult : []).map((item) => ({
          label: item.name,
          value: item.id
        }))
        return {
          tenants: listRows(tenantResult).map((item) => ({
            label: item.tenantName,
            value: item.id
          })),
          departments: departmentOptionsFromRows(departmentRows),
          menus: menus.length ? menus : fallbackStaffMenus
        }
      } catch (error) {
        return {
          tenants: [],
          departments: [],
          menus: fallbackStaffMenus
        }
      }
    }
  },
  roles: {
    list: listRoles
  },
  organization: {
    list: listOrganization,
    save: saveOrganization,
    delete: deleteOrganization,
    changeStatus: changeOrganizationStatus
  },
  productCrafts: {
    list: listProductCrafts,
    detail: detailProductCraft,
    outsource: outsourceOrder
  },
  productCraftsOutsource: {
    list: listOutsourceProductCrafts,
    detail: detailProductCraft
  },
  deliveryNotes: {
    list: listDeliveryNotes,
    detail: detailDeliveryNote,
    save: saveDeliveryNote,
    formOptions: async () => {
      const [pendingOrders, users] = await Promise.all([
        getTenantOrderList({ pageNum: 1, pageSize: 999, status: 4 }),
        getTenantClientUsers({ name: '' }).catch(() => [])
      ])
      const pendingRows = listRows(pendingOrders)
      const orders = pendingRows.length
        ? pendingRows
        : listRows(await getTenantOrderList({ pageNum: 1, pageSize: 999 }))
      return {
        deliveryOrders: orders.map(normalizeDeliveryOrderOption),
        drivers: listRows(users).map(normalizeDeliveryDriverOption)
      }
    }
  },
  receivableOrders: {
    list: listReceivableOrders,
    export: (payload) => exportTenantReceivableOrder(receivableOrderQuery(payload))
  },
  receivableUnits: {
    list: listReceivableClients,
    export: (payload) => exportTenantReceivableClient(receivableClientQuery(payload))
  },
  receipts: {
    list: listReceipts,
    detail: detailReceipt,
    save: saveReceipt,
    delete: deleteReceipt,
    print: printReceipt,
    export: (payload) => exportTenantReceipt(receiptQuery(payload)),
    formOptions: receiptFormOptions,
    receiptOrders: listReceiptOrderOptions,
    total: getTenantReceiptTotal
  },
  reimbursements: {
    list: listReimbursements,
    detail: detailReimbursement,
    save: saveReimbursement,
    delete: deleteReimbursement,
    print: printReimbursement,
    export: (payload) => exportTenantReimburse(reimbursementQuery(payload)),
    formOptions: reimbursementFormOptions,
    total: getTenantReimburseTotal
  },
  materials: {
    list: listMaterials,
    save: saveMaterial,
    delete: deleteMaterial,
    changeStatus: changeMaterialStatus
  },
  materialStock: {
    list: listMaterialStock
  },
  materialDetails: {
    list: listMaterialDetails,
    detail: detailMaterialDetail,
    orderOptions: listMaterialOrderOptions
  },
  manualRecords: {
    list: listManualRecords,
    detail: detailManualRecord
  },
  craftStats: {
    list: listCraftStats
  },
  craftPerformance: {
    list: listCraftPerformance
  },
  billingPerformance: {
    list: listBillingPerformance
  },
  deliveryPerformance: {
    list: listDeliveryPerformance
  },
  outsourceIncoming: {
    list: (payload) => listOutsourceOrders(payload, 'incoming'),
    detail: detailOutsourceOrder,
    outsource: outsourceOrder,
    print: printOrder,
    returnOrder,
    delete: deleteOrder
  },
  outsourceOutgoing: {
    list: (payload) => listOutsourceOrders(payload, 'outgoing'),
    detail: detailOutsourceOrder,
    outsource: outsourceOrder,
    print: printOrder,
    returnOrder,
    delete: deleteOrder
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
