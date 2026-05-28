import {
  deleteTenantReceipt,
  deleteTenantReimburse,
  exportTenantReceipt,
  exportTenantReimburse,
  getTenantReceiptDetail,
  getTenantReceiptList,
  getTenantReceiptPrintUrl,
  getTenantReimburseDetail,
  getTenantReimburseList,
  getTenantReimbursePrintUrl
} from '../../api/tenant'

const splitRange = (value = []) => {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split(/[至~]/)
    .map((item) => item.trim())
}

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const pickMoney = (row = {}, keys = []) => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return Number(value) || 0
  }
  return 0
}

const listQuery = (payload = {}) => ({
  pageNum: payload.pageNum || 1,
  pageSize: payload.pageSize || 10
})

const statusMap = {
  1: '待审批',
  2: '已通过',
  3: '已驳回',
  待审批: 1,
  已通过: 2,
  已驳回: 3
}

const reimbursementStatus = (status) => statusMap[Number(status)] || status || '-'
const reimbursementStatusToApi = (status) => statusMap[status] || status || undefined

const orderStatusMap = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回'
}

const normalizeReceiptOrder = (row = {}) => ({
  ...row,
  orderNo: row.orderNo || row.orderId || '-',
  orderTime: row.orderTime || row.createTime || '-',
  filler: row.fillUserName || row.filler || '-',
  productInfo: row.productInfo || row.productName || '-',
  receivableAmount: pickMoney(row, ['receivableMoney', 'billMoney', 'amount']),
  receivedAmount: pickMoney(row, ['totalCollectionMoney', 'receivedMoney', 'received']),
  arrearsAmount: pickMoney(row, ['remainMoney', 'unpaid']),
  status: orderStatusMap[Number(row.orderStatus || row.status)] || row.orderStatus || row.status || '-',
  currentAmount: pickMoney(row, ['money', 'currentAmount']),
  currentDiscount: pickMoney(row, ['allowanceMoney', 'currentDiscount'])
})

export const receiptConfig = {
  title: '收款信息',
  searchFields: [
    { key: 'receiptNo', label: '收款单号' },
    { key: 'customer', label: '单位名称' },
    { key: 'collector', label: '收款人' },
    { key: 'account', label: '收款账户' },
    { key: 'updatedAt', label: '起始时间', type: 'daterange' }
  ],
  columns: [
    { prop: 'receiptNo', label: '收款单号', minWidth: 150 },
    { prop: 'customer', label: '单位名称', minWidth: 150 },
    { prop: 'updatedAt', label: '收款时间', minWidth: 170 },
    { prop: 'collector', label: '收款人' },
    { prop: 'account', label: '收款账户' },
    { prop: 'amount', label: '收款金额' },
    { prop: 'discount', label: '折让' },
    { prop: 'remark', label: '摘要', minWidth: 160 }
  ],
  detailFields: [
    { prop: 'receiptNo', label: '收款单号' },
    { prop: 'updatedAt', label: '收款时间' },
    { prop: 'amount', label: '收款金额' },
    { prop: 'remark', label: '摘要' },
    { prop: 'customer', label: '单位名称' },
    { prop: 'account', label: '收款账户' },
    { prop: 'discount', label: '折让金额' },
    { prop: 'operator', label: '操作员' },
    { prop: 'operationTime', label: '操作时间' }
  ],
  detailTable: {
    key: 'receiptOrders',
    columns: [
      { prop: 'orderNo', label: '订单号' },
      { prop: 'orderTime', label: '订单时间' },
      { prop: 'filler', label: '填单员' },
      { prop: 'productInfo', label: '产品信息' },
      { prop: 'receivableAmount', label: '应收金额' },
      { prop: 'receivedAmount', label: '已收金额' },
      { prop: 'arrearsAmount', label: '剩余尾款' },
      { prop: 'status', label: '订单状态' },
      { prop: 'currentAmount', label: '本次收款' },
      { prop: 'currentDiscount', label: '本次折让' }
    ]
  },
  listApi: getTenantReceiptList,
  detailApi: getTenantReceiptDetail,
  deleteApi: deleteTenantReceipt,
  printApi: getTenantReceiptPrintUrl,
  exportApi: exportTenantReceipt,
  toQuery: (payload = {}) => {
    const [start, end] = splitRange(payload.updatedAt)
    return {
      ...listQuery(payload),
      orderId: payload.receiptNo || undefined,
      companyName: payload.customer || undefined,
      collectionUserName: payload.collector || undefined,
      accountId: payload.account || undefined,
      createTimeStart: start || undefined,
      createTimeEnd: end || start || undefined
    }
  },
  normalize: (row = {}) => ({
    ...row,
    id: row.id || row.receiptId,
    receiptNo: row.orderId || row.orderNo || row.receiptNo || '-',
    customer: row.companyName || row.customer || '-',
    updatedAt: row.createTime || row.collectionTime || row.updatedAt || '-',
    collectionTime: row.collectionTime || row.createTime || row.updatedAt || '-',
    collector: row.collectionUserName || row.collector || '-',
    account: row.accountName || row.account || '-',
    accountId: row.accountId,
    amount: pickMoney(row, ['money', 'amount']),
    discount: pickMoney(row, ['allowanceMoney', 'discount']),
    remark: row.digest || row.remark || '',
    operationTime: row.createTime || row.operationTime || '-',
    operator: row.createTenantUserName || row.operator || '-'
  }),
  normalizeDetail: (data = {}, fallback = {}) => ({
    ...receiptConfig.normalize({ ...fallback, ...data }),
    receiptOrders: listRows(data.listOrder).map(normalizeReceiptOrder)
  })
}

export const reimbursementConfig = {
  title: '报销列表',
  searchFields: [
    { key: 'name', label: '报销单号' },
    { key: 'applicant', label: '报销人' },
    { key: 'account', label: '报销账户' },
    {
      key: 'status',
      label: '报销状态',
      type: 'select',
      options: [
        { label: '待审批', value: '待审批' },
        { label: '已通过', value: '已通过' },
        { label: '已驳回', value: '已驳回' }
      ]
    },
    { key: 'updatedAt', label: '起始时间', type: 'daterange' }
  ],
  columns: [
    { prop: 'name', label: '报销单号', minWidth: 150 },
    { prop: 'applicant', label: '报销人' },
    { prop: 'updatedAt', label: '报销时间', minWidth: 170 },
    { prop: 'account', label: '报销账户' },
    { prop: 'amount', label: '金额' },
    { prop: 'discount', label: '折让' },
    { prop: 'remark', label: '摘要', minWidth: 160 },
    { prop: 'status', label: '报销状态' }
  ],
  detailFields: [
    { prop: 'name', label: '报销单号' },
    { prop: 'updatedAt', label: '报销时间' },
    { prop: 'amount', label: '报销金额' },
    { prop: 'remark', label: '摘要' },
    { prop: 'account', label: '报销账户' },
    { prop: 'discount', label: '折让金额' },
    { prop: 'applicant', label: '操作员' },
    { prop: 'operationTime', label: '操作时间' }
  ],
  listApi: getTenantReimburseList,
  detailApi: getTenantReimburseDetail,
  deleteApi: deleteTenantReimburse,
  printApi: getTenantReimbursePrintUrl,
  exportApi: exportTenantReimburse,
  toQuery: (payload = {}) => {
    const [start, end] = splitRange(payload.updatedAt)
    return {
      ...listQuery(payload),
      orderId: payload.name || undefined,
      createTenantUserName: payload.applicant || undefined,
      accountId: payload.account || undefined,
      status: reimbursementStatusToApi(payload.status),
      createTimeStart: start || undefined,
      createTimeEnd: end || start || undefined
    }
  },
  normalize: (row = {}) => ({
    ...row,
    id: row.id || row.reimburseId,
    name: row.orderId || row.reimburseNo || row.reimbursementNo || row.name || '-',
    applicant: row.createTenantUserName || row.reimburseUserName || row.applicant || row.userName || '-',
    updatedAt: row.reimburseTime || row.reimbursementTime || row.createTime || row.updatedAt || '-',
    account: row.accountName || row.account || '-',
    accountId: row.accountId,
    amount: pickMoney(row, ['money', 'amount']),
    discount: pickMoney(row, ['allowanceMoney', 'discount']),
    remark: row.digest || row.remark || '',
    proofImg: row.proofImg || '',
    status: reimbursementStatus(row.status),
    operator: row.createTenantUserName || row.operator || '-',
    operationTime: row.createTime || row.operationTime || '-'
  })
}
