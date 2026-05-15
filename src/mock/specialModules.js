import { crudModuleSeeds } from '../config/crudModules'

const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 160))
const clone = (value) => JSON.parse(JSON.stringify(value))

const store = Object.fromEntries(
  Object.entries(crudModuleSeeds).map(([key, list]) => [key, clone(list || [])])
)

const sequence = Object.fromEntries(
  Object.entries(store).map(([key, list]) => [key, Math.max(...[0, ...list.map((item) => Number(item.id) || 0)]) + 1])
)

const linkedCount = (item) => item.receiptOrders?.length || item.deliveryOrders?.length || item.orderRows?.length || 0

const enrichRow = (moduleKey, item) => ({
  ...item,
  linkedOrders: linkedCount(item),
  approvalTimeline:
    moduleKey === 'reimbursements'
      ? item.approvalTimeline || [
          {
            date: item.updatedAt || '-',
            title: '提交申请',
            description: `${item.applicant || '操作员'} 已提交报销单`
          },
          {
            date: item.updatedAt2 || item.updatedAt || '-',
            title: '审批状态',
            description: `当前状态：${item.status || '待审批'}`
          }
        ]
      : item.approvalTimeline
})

export const mockSpecialModuleList = async (moduleKey, filters = {}) => {
  if (!store[moduleKey]) {
    store[moduleKey] = []
    sequence[moduleKey] = 1
  }

  const rows = store[moduleKey].filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true
      return String(item[key] ?? '').includes(String(value))
    })
  )
  return wait(rows.map((item) => enrichRow(moduleKey, item)))
}

export const mockSpecialModuleSave = async (moduleKey, payload = {}) => {
  const list = store[moduleKey] || (store[moduleKey] = [])
  const next = clone(payload)

  if (!next.id) {
    next.id = sequence[moduleKey] || list.length + 1
    sequence[moduleKey] = Number(next.id) + 1
    list.unshift(next)
  } else {
    const index = list.findIndex((item) => Number(item.id) === Number(next.id))
    if (index >= 0) {
      list[index] = { ...list[index], ...next }
    } else {
      list.unshift(next)
    }
  }

  return wait(enrichRow(moduleKey, next))
}
