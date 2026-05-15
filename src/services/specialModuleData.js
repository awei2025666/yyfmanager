import { getSpecialModuleList, saveSpecialModule as saveSpecialModuleApi } from '../api/specialModules'
import { mockSpecialModuleList, mockSpecialModuleSave } from '../mock/specialModules'

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

const safe = async (moduleKey, apiFn, mockFn, ...args) => {
  try {
    const result = await apiFn(moduleKey, ...args)
    return { source: 'live', data: result }
  } catch (error) {
    const result = await mockFn(moduleKey, ...args)
    return { source: 'mock', data: result }
  }
}

export const loadSpecialModuleRows = async (moduleKey, filters = {}) => {
  const result = await safe(moduleKey, getSpecialModuleList, mockSpecialModuleList, filters)
  return {
    source: result.source,
    rows: normalizeListResult(moduleKey, result.data)
  }
}

export const persistSpecialModuleRow = async (moduleKey, payload = {}) => {
  const result = await safe(moduleKey, saveSpecialModuleApi, mockSpecialModuleSave, payload)
  return {
    source: result.source,
    row: normalizeRow(moduleKey, result.data || payload)
  }
}
