import {
  exportTenantCraftPerformance,
  exportTenantPerformanceCraft,
  exportTenantPerformanceDriver,
  exportTenantPerformanceOrder,
  getTenantCraftPerformanceList,
  getTenantPerformanceCraftList,
  getTenantPerformanceDriverList,
  getTenantPerformanceOrderList
} from '../../api/tenant'

const listQuery = (payload = {}) => ({
  pageNum: payload.pageNum || 1,
  pageSize: payload.pageSize || 10
})

const splitRange = (value = []) => {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split(/[至~]/)
    .map((item) => item.trim())
}

const performanceQuery = (payload = {}) => {
  const [start, end] = splitRange(payload.time)
  return {
    ...listQuery(payload),
    name: payload.name || undefined,
    phone: payload.phone || undefined,
    createTimeStart: start || undefined,
    createTimeEnd: end || start || undefined
  }
}

const numberText = (value) => Number(value || 0).toLocaleString('zh-CN')
const moneyText = (value) =>
  `¥${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

const sumRows = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0)

export const billingPerformanceConfig = {
  title: '开单绩效',
  searchFields: [
    { key: 'time', label: '时间', type: 'daterange' },
    { key: 'name', label: '人员姓名' },
    { key: 'phone', label: '联系方式' }
  ],
  columns: [
    { prop: 'name', label: '人员姓名' },
    { prop: 'phone', label: '联系方式（账号）', minWidth: 150 },
    { prop: 'completedOrders', label: '已完成订单数', minWidth: 140 },
    { prop: 'amount', label: '已完成订单金额', minWidth: 160 }
  ],
  listApi: getTenantPerformanceOrderList,
  exportApi: exportTenantPerformanceOrder,
  toQuery: performanceQuery,
  normalize: (row = {}, index = 0) => ({
    ...row,
    id: row.id || row.userId || index + 1,
    name: row.name || row.userName || '-',
    phone: row.phone || row.userPhone || '-',
    completedOrders: row.completedCount ?? row.completedOrders ?? 0,
    amount: row.completedMoney ?? row.amount ?? 0
  }),
  summary: (rows = []) =>
    `已完成订单数合计：${numberText(sumRows(rows, 'completedOrders'))}    已完成订单金额合计：${moneyText(sumRows(rows, 'amount'))}`
}

export const deliveryPerformanceConfig = {
  title: '配送绩效',
  searchFields: [
    { key: 'time', label: '时间', type: 'daterange' },
    { key: 'name', label: '人员姓名' },
    { key: 'phone', label: '联系方式' }
  ],
  columns: [
    { prop: 'name', label: '人员姓名' },
    { prop: 'phone', label: '联系方式（账号）', minWidth: 150 },
    { prop: 'pendingOrders', label: '待配送订单', minWidth: 130 },
    { prop: 'completedOrders', label: '已配送订单', minWidth: 130 }
  ],
  listApi: getTenantPerformanceDriverList,
  exportApi: exportTenantPerformanceDriver,
  toQuery: performanceQuery,
  normalize: (row = {}, index = 0) => ({
    ...row,
    id: row.id || row.userId || index + 1,
    name: row.name || row.userName || '-',
    phone: row.phone || row.userPhone || '-',
    pendingOrders: row.pendingCount ?? row.pendingOrders ?? 0,
    completedOrders: row.completedCount ?? row.completedOrders ?? 0
  }),
  summary: (rows = []) =>
    `待配送订单合计：${numberText(sumRows(rows, 'pendingOrders'))}    已配送订单合计：${numberText(sumRows(rows, 'completedOrders'))}`
}

export const craftStatsConfig = {
  title: '工艺统计',
  searchFields: [
    { key: 'craftId', label: '工艺id' },
    { key: 'name', label: '工艺名称' },
    { key: 'time', label: '起始时间', type: 'daterange' }
  ],
  columns: [
    { prop: 'craftId', label: '工艺id' },
    { prop: 'name', label: '工艺名称' },
    { prop: 'unit', label: '单位' },
    { prop: 'count', label: '累计生产数', minWidth: 130 },
    { prop: 'pending', label: '待生产数', minWidth: 120 },
    { prop: 'completed', label: '已生产数', minWidth: 120 }
  ],
  listApi: getTenantPerformanceCraftList,
  exportApi: exportTenantPerformanceCraft,
  toQuery: (payload = {}) => ({
    ...performanceQuery(payload),
    name: payload.name || payload.craftId || undefined
  }),
  normalize: (row = {}, index = 0) => ({
    ...row,
    id: row.id || row.craftId || index + 1,
    craftId: row.craftId || row.id || '-',
    name: row.craftName || row.name || '-',
    unit: row.unit || '-',
    count: row.totalProductionNum ?? row.count ?? 0,
    pending: row.pendingProductionNum ?? row.pending ?? 0,
    completed: row.producedNum ?? row.completed ?? 0
  }),
  summary: (rows = []) =>
    `生产合计：${numberText(sumRows(rows, 'count'))}    待生产合计：${numberText(sumRows(rows, 'pending'))}    已生产合计：${numberText(sumRows(rows, 'completed'))}`
}

export const craftPerformanceConfig = {
  title: '工艺绩效',
  labelWidth: '96px',
  searchFields: [
    { key: 'time', label: '时间', type: 'daterange' },
    { key: 'customer', label: '客户名称' },
    { key: 'productName', label: '产品名称' }
  ],
  columns: [
    { prop: 'name', label: '人员姓名' },
    { prop: 'customer', label: '客户名称', minWidth: 150 },
    { prop: 'productName', label: '产品名称', minWidth: 150 },
    { prop: 'craftName', label: '工艺名称', minWidth: 130 },
    { prop: 'bigMachine', label: '大机器' },
    { prop: 'smallMachine', label: '小机器' },
    { prop: 'total', label: '完成数合计', minWidth: 130 }
  ],
  listApi: getTenantCraftPerformanceList,
  exportApi: exportTenantCraftPerformance,
  toQuery: (payload = {}) => {
    const [start, end] = splitRange(payload.time)
    return {
      ...listQuery(payload),
      companyName: payload.customer || undefined,
      productName: payload.productName || undefined,
      startTime: start || undefined,
      endTime: end || start || undefined
    }
  },
  normalize: (row = {}, index = 0) => {
    const machineNum = Number(row.machineNum || 0)
    const craftNum = Number(row.craftNum || 0)
    return {
      ...row,
      id: row.id || row.userId || index + 1,
      name: row.userName || row.name || '-',
      customer: row.companyName || row.customer || '-',
      productName: row.productName || '-',
      craftName: row.craftName || '-',
      bigMachine: Number(row.machineType) === 1 ? machineNum : 0,
      smallMachine: Number(row.machineType) === 2 ? machineNum : 0,
      total: craftNum
    }
  }
}
