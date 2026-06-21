import {
  exportTenantReceivableClient,
  exportTenantReceivableOrder,
  getTenantReceivableClientList,
  getTenantReceivableOrderList
} from '../../api/tenant'

const splitRange = (value = []) => {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split(/[至~]/)
    .map((item) => item.trim())
}

const listQuery = (payload = {}) => ({
  pageNum: payload.pageNum || 1,
  pageSize: payload.pageSize || 10
})

const pickMoney = (row = {}, keys = []) => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return Number(value) || 0
  }
  return 0
}

const orderStatusMap = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回'
}

const statusText = (status) => orderStatusMap[Number(status)] || status || '-'

export const receivableOrdersConfig = {
  title: '应收账款-订单明细',
  searchFields: [
    { key: 'orderNo', label: '订单号' },
    { key: 'customer', label: '单位名称' },
    { key: 'filler', label: '填单员' },
    { key: 'orderTime', label: '时间', type: 'daterange' }
  ],
  columns: [
    { prop: 'orderNo', label: '订单号', minWidth: 150 },
    { prop: 'customer', label: '单位名称', minWidth: 150 },
    { prop: 'orderTime', label: '订单时间', minWidth: 160 },
    { prop: 'filler', label: '填单员' },
    { prop: 'productInfo', label: '产品信息', minWidth: 180 },
    { prop: 'amount', label: '账单金额' },
    { prop: 'received', label: '已收金额' },
    { prop: 'allowance', label: '折让金额' },
    { prop: 'unpaid', label: '剩余尾款' },
    { prop: 'status', label: '订单状态' }
  ],
  listApi: getTenantReceivableOrderList,
  exportApi: exportTenantReceivableOrder,
  toQuery: (payload = {}) => {
    const [start, end] = splitRange(payload.orderTime)
    return {
      ...listQuery(payload),
      orderNo: payload.orderNo || undefined,
      companyName: payload.customer || undefined,
      fillUserName: payload.filler || undefined,
      orderTimeStart: start || undefined,
      orderTimeEnd: end || start || undefined
    }
  },
  normalize: (row = {}) => {
    const amount = pickMoney(row, ['billMoney', 'totalMoney', 'orderMoney', 'amount'])
    const received = pickMoney(row, ['receivedMoney', 'receiveMoney', 'receiptMoney', 'received'])
    const allowance = pickMoney(row, ['allowanceMoney', 'discountMoney', 'discountAmount'])
    const unpaidValue = row.unpaid ?? row.remainMoney ?? row.arrearsMoney ?? row.tailMoney ?? row.surplusMoney ?? row.remainingMoney
    const productInfo = Array.isArray(row.products)
      ? row.products.map((item) => item.name || item.productName).filter(Boolean).join('、')
      : ''
    return {
      ...row,
      orderNo: row.orderNo || row.orderId || '-',
      customer: row.companyName || row.customerName || row.customer || '-',
      orderTime: row.orderTime || row.createTime || '-',
      filler: row.fillUserName || row.userName || row.filler || '-',
      productInfo: row.productInfo || productInfo || row.productName || '-',
      amount,
      received,
      allowance,
      unpaid: unpaidValue === undefined || unpaidValue === null || unpaidValue === ''
        ? Math.max(amount - received, 0)
        : Number(unpaidValue) || 0,
      status: statusText(row.status || row.orderStatus)
    }
  }
}

export const receivableUnitsConfig = {
  title: '应收账款-单位明细',
  searchFields: [
    { key: 'customer', label: '单位名称' },
    { key: 'contact', label: '联系人' },
    { key: 'sales', label: '业务员' }
  ],
  columns: [
    { prop: 'customer', label: '单位名称', minWidth: 160 },
    { prop: 'amount', label: '账单金额' },
    { prop: 'received', label: '已收金额' },
    { prop: 'allowance', label: '折让金额' },
    { prop: 'unpaid', label: '剩余尾款' },
    { prop: 'contact', label: '联系人' },
    { prop: 'phone', label: '联系方式', minWidth: 140 },
    { prop: 'sales', label: '业务员' }
  ],
  listApi: getTenantReceivableClientList,
  exportApi: exportTenantReceivableClient,
  toQuery: (payload = {}) => ({
    ...listQuery(payload),
    companyName: payload.customer || undefined,
    linkman: payload.contact || undefined,
    salesmanName: payload.sales || undefined
  }),
  normalize: (row = {}) => {
    const amount = pickMoney(row, ['billMoney', 'totalMoney', 'orderMoney', 'amount'])
    const received = pickMoney(row, ['receivedMoney', 'receiveMoney', 'receiptMoney', 'received'])
    const allowance = pickMoney(row, ['allowanceMoney', 'discountMoney', 'discountAmount'])
    const unpaidValue = row.unpaid ?? row.remainMoney ?? row.arrearsMoney ?? row.tailMoney ?? row.surplusMoney ?? row.remainingMoney
    return {
      ...row,
      id: row.cooperativeClientId || row.id,
      customer: row.companyName || row.customerName || row.customer || '-',
      contact: row.linkman || row.contact || '-',
      phone: row.phone || '-',
      sales: row.salesmanName || row.salesman || row.fillUserName || row.userName || row.sales || '-',
      amount,
      received,
      allowance,
      unpaid: unpaidValue === undefined || unpaidValue === null || unpaidValue === ''
        ? Math.max(amount - received, 0)
        : Number(unpaidValue) || 0
    }
  }
}
