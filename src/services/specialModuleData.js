import {
  getSpecialModuleFormOptions,
  getSpecialModuleList,
  runSpecialModuleAction,
  saveSpecialModule as saveSpecialModuleApi
} from '../api/specialModules'

const aliasMap = {
  receipts: {
    receiptNo: ['receiptNo', 'orderId', 'code'],
    customer: ['customer', 'tenantName', 'customerName'],
    collector: ['collector', 'userName', 'operator'],
    account: ['account', 'accountName', 'payType'],
    amount: ['amount', 'payMoney', 'money'],
    discount: ['discount', 'discountMoney', 'reduceMoney'],
    updatedAt: ['updatedAt', 'createTime', 'time']
  },
  reimbursements: {
    name: ['name', 'reimbursementNo', 'code'],
    applicant: ['applicant', 'userName', 'operator'],
    account: ['account', 'accountName', 'payType'],
    amount: ['amount', 'money', 'payMoney'],
    discount: ['discount', 'discountMoney', 'reduceMoney'],
    status: ['status', 'approveStatus'],
    updatedAt: ['updatedAt', 'createTime', 'time']
  },
  accounts: {
    name: ['name', 'accountName'],
    accountNo: ['accountNo', 'bankNo', 'cardNo'],
    bank: ['bank', 'bankName'],
    balance: ['balance', 'money', 'amount']
  },
  fundDetails: {
    bizNo: ['bizNo', 'orderId', 'code'],
    account: ['account', 'accountName'],
    accountType: ['accountType', 'typeName'],
    accountNo: ['accountNo', 'cardNo'],
    bank: ['bank', 'bankName'],
    income: ['income', 'incomeMoney'],
    expense: ['expense', 'expenseMoney'],
    balance: ['balance', 'surplusMoney'],
    time: ['time', 'createTime', 'updatedAt']
  },
  receivableOrders: {
    orderNo: ['orderNo', 'orderId'],
    customer: ['customer', 'tenantName', 'customerName'],
    orderTime: ['orderTime', 'createTime', 'updatedAt'],
    filler: ['filler', 'userName', 'operator'],
    amount: ['amount', 'billMoney', 'payMoney'],
    received: ['received', 'receivedMoney'],
    unpaid: ['unpaid', 'arrearsMoney', 'tailMoney']
  },
  receivableUnits: {
    customer: ['customer', 'tenantName', 'customerName'],
    contact: ['contact', 'userName'],
    phone: ['phone', 'userPhone'],
    sales: ['sales', 'salesman'],
    amount: ['amount', 'billMoney'],
    received: ['received', 'receivedMoney'],
    unpaid: ['unpaid', 'arrearsMoney', 'tailMoney']
  },
  staff: {
    userId: ['userId', 'id'],
    name: ['name', 'userName'],
    phone: ['phone', 'userPhone'],
    department: ['department', 'deptName'],
    roleText: ['roleText', 'roleName'],
    status: ['status'],
    createTime: ['createTime', 'createdAt']
  }
}

const pickValue = (row, aliases, fallbackKey) => {
  for (const key of aliases || []) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key]
  }
  return row[fallbackKey]
}

const normalizeRow = (moduleKey, row) => {
  const aliases = aliasMap[moduleKey]
  if (!aliases) return row

  const next = { ...row }
  Object.entries(aliases).forEach(([key, aliasKeys]) => {
    next[key] = pickValue(row, aliasKeys, key)
  })
  return next
}

const normalizeListResult = (moduleKey, payload) => {
  const rows = Array.isArray(payload) ? payload : payload?.records || payload?.list || payload?.rows || []
  return rows.map((row) => normalizeRow(moduleKey, row))
}

export const loadSpecialModuleRows = async (moduleKey, filters = {}) => {
  const result = await getSpecialModuleList(moduleKey, filters)
  return {
    rows: normalizeListResult(moduleKey, result)
  }
}

export const persistSpecialModuleRow = async (moduleKey, payload = {}) => {
  const result = await saveSpecialModuleApi(moduleKey, payload)
  return {
    row: normalizeRow(moduleKey, result || payload)
  }
}

export const executeSpecialModuleAction = (moduleKey, action, payload = {}) =>
  runSpecialModuleAction(moduleKey, action, payload)

export const loadSpecialModuleFormOptions = (moduleKey) => getSpecialModuleFormOptions(moduleKey)
