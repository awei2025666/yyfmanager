const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 180))

const clone = (value) => JSON.parse(JSON.stringify(value))

const state = {
  tenantId: 6,
  tenantUserId: 4,
  vipId: 4,
  craftId: 4
}

const menuTree = [
  { id: 1, parentId: 0, router: 'dashboard', type: 2, name: '工作台', children: [] },
  {
    id: 2,
    parentId: 0,
    router: 'tenants',
    type: 2,
    name: '会员管理',
    children: [
      { id: 21, parentId: 2, router: 'tenants:add', type: 3, name: '新增会员', children: [] },
      { id: 22, parentId: 2, router: 'tenants:edit', type: 3, name: '编辑会员', children: [] }
    ]
  },
  { id: 3, parentId: 0, router: 'packages', type: 2, name: '套餐管理', children: [] },
  { id: 4, parentId: 0, router: 'orders', type: 2, name: '订单管理', children: [] },
  { id: 5, parentId: 0, router: 'crafts', type: 2, name: '工艺管理', children: [] }
]

const tenantUsers = {
  1: [
    {
      id: 1,
      name: '李四',
      phone: '15212341234',
      status: 1,
      createTime: '2026-04-11 21:45:27',
      menuIdList: [1, 2, 21, 4]
    },
    {
      id: 2,
      name: '王五',
      phone: '15288889999',
      status: 0,
      createTime: '2026-04-12 11:13:27',
      menuIdList: [1, 4]
    }
  ],
  2: [
    {
      id: 3,
      name: '赵敏',
      phone: '15932145678',
      status: 1,
      createTime: '2026-04-13 10:22:18',
      menuIdList: [1, 3, 4]
    }
  ]
}

const tenants = [
  {
    id: 1,
    tenantName: '彩异印务',
    userName: '张三',
    userPhone: '13212341234',
    address: '成都龙泉驿成华大道 88 号',
    businessLicense: '2042286361943318529',
    businessLicensePath: 'https://dummyimage.com/600x360/e8eef9/5472a8&text=License',
    remark: '重点客户，续费率高',
    createTime: '2026-04-10 16:48:12',
    status: 1,
    vipDay: 365,
    vipName: '年度套餐',
    vipOrderList: [
      {
        orderId: '202604101',
        vipName: '月卡',
        payMoney: 599,
        createTime: '2026-04-10 16:48:43',
        status: 2
      },
      {
        orderId: '202604102',
        vipName: '年卡',
        payMoney: 7999,
        createTime: '2026-04-10 17:12:11',
        status: 2
      }
    ]
  },
  {
    id: 2,
    tenantName: '远见包装',
    userName: '李敏',
    userPhone: '13888886666',
    address: '重庆渝北湖云街 33 号',
    businessLicense: '2042286361943318530',
    businessLicensePath: 'https://dummyimage.com/600x360/f4efe8/9f6a2f&text=License',
    remark: '多门店协同',
    createTime: '2026-04-12 12:18:48',
    status: 1,
    vipDay: 120,
    vipName: '季度套餐',
    vipOrderList: [
      {
        orderId: '202604151',
        vipName: '季度套餐',
        payMoney: 1999,
        createTime: '2026-04-15 08:16:11',
        status: 2
      }
    ]
  },
  {
    id: 3,
    tenantName: '青禾设计',
    userName: '周磊',
    userPhone: '13612345678',
    address: '西安雁塔区高新一路 19 号',
    businessLicense: '2042286361943318531',
    businessLicensePath: 'https://dummyimage.com/600x360/e8f3ee/3f7c60&text=License',
    remark: '体验客户',
    createTime: '2026-04-13 09:18:18',
    status: 0,
    vipDay: 8,
    vipName: '月卡',
    vipOrderList: []
  },
  {
    id: 4,
    tenantName: '华图快印',
    userName: '王悦',
    userPhone: '13945678901',
    address: '长沙岳麓大道 102 号',
    businessLicense: '2042286361943318532',
    businessLicensePath: 'https://dummyimage.com/600x360/edf2fa/4d6484&text=License',
    remark: '',
    createTime: '2026-04-15 15:51:42',
    status: 1,
    vipDay: 268,
    vipName: '年度套餐',
    vipOrderList: []
  },
  {
    id: 5,
    tenantName: '光谱数码',
    userName: '刘峰',
    userPhone: '13723456789',
    address: '杭州滨江区创智路 8 号',
    businessLicense: '2042286361943318533',
    businessLicensePath: 'https://dummyimage.com/600x360/f8edf2/9e4f73&text=License',
    remark: '试用即将到期',
    createTime: '2026-04-19 19:38:01',
    status: 1,
    vipDay: 6,
    vipName: '体验版',
    vipOrderList: []
  }
]

const vips = [
  {
    id: 1,
    name: '月卡',
    day: 30,
    currentPrice: 599,
    oldPrice: 699,
    remark: '适合轻量团队',
    status: 1,
    totalOrderNum: 38,
    totalOrderMoney: 22762
  },
  {
    id: 2,
    name: '季度套餐',
    day: 90,
    currentPrice: 1999,
    oldPrice: 2399,
    remark: '适合成长客户',
    status: 1,
    totalOrderNum: 21,
    totalOrderMoney: 41979
  },
  {
    id: 3,
    name: '年度套餐',
    day: 365,
    currentPrice: 7999,
    oldPrice: 8999,
    remark: '主推套餐',
    status: 1,
    totalOrderNum: 12,
    totalOrderMoney: 95988
  }
]

const orders = [
  {
    id: 1,
    orderId: '202604201001',
    payMoney: 1999,
    vipName: '季度套餐',
    createTime: '2026-04-20 09:12:42',
    status: 2,
    tenantName: '彩异印务',
    userName: '张三',
    userPhone: '13212341234'
  },
  {
    id: 2,
    orderId: '202604201002',
    payMoney: 7999,
    vipName: '年度套餐',
    createTime: '2026-04-20 09:22:18',
    status: 1,
    tenantName: '远见包装',
    userName: '李敏',
    userPhone: '13888886666'
  },
  {
    id: 3,
    orderId: '202604201003',
    payMoney: 599,
    vipName: '月卡',
    createTime: '2026-04-20 10:01:08',
    status: 3,
    tenantName: '青禾设计',
    userName: '周磊',
    userPhone: '13612345678'
  },
  {
    id: 4,
    orderId: '202604191001',
    payMoney: 7999,
    vipName: '年度套餐',
    createTime: '2026-04-19 14:40:02',
    status: 2,
    tenantName: '华图快印',
    userName: '王悦',
    userPhone: '13945678901'
  }
]

const crafts = [
  {
    id: 1,
    name: '双面光膜',
    priceBase: 10,
    unit: '千',
    formatSize: 4,
    sort: 1,
    remark: '适用于宣传单',
    tenantId: '-1',
    spotColors: 'PANTONE 485C',
    status: 1
  },
  {
    id: 2,
    name: '烫金',
    priceBase: 88,
    unit: '款',
    formatSize: 8,
    sort: 2,
    remark: '适用于高端包装',
    tenantId: '-1',
    spotColors: '',
    status: 1
  },
  {
    id: 3,
    name: '压纹',
    priceBase: 36,
    unit: '版',
    formatSize: 16,
    sort: 3,
    remark: '增加触感',
    tenantId: '-1',
    spotColors: '',
    status: 0
  }
]

const paginate = (items, pageNum = 1, pageSize = 10) => {
  const current = Number(pageNum) || 1
  const size = Number(pageSize) || 10
  const start = (current - 1) * size
  const records = items.slice(start, start + size)
  return {
    records: clone(records),
    total: items.length,
    size,
    current,
    pages: Math.max(1, Math.ceil(items.length / size))
  }
}

const filterByText = (source, key, value) => {
  if (!value) return source
  return source.filter((item) => String(item[key] || '').includes(value))
}

export const mockLogin = ({ account }) =>
  wait(`mock-token-${account || 'admin'}`)

export const mockOverview = () =>
  wait({
    orderTotal: orders.length,
    orderMoneyTotal: orders.reduce((sum, item) => sum + Number(item.payMoney || 0), 0),
    tenantTotal: tenants.length
  })

export const mockTrend = (type = 1) => {
  const span = type === 2 ? 6 : type === 3 ? 12 : 7
  const data = Array.from({ length: span }).map((_, index) => ({
    day: type === 1 ? `04-${String(14 + index).padStart(2, '0')}` : `${index + 1}月`,
    tenantNum: 8 + index * (type === 3 ? 2 : 3),
    orderMoney: 12000 + index * 3500
  }))
  return wait(data)
}

export const mockRealtimeOrders = () => wait(clone(orders.slice(0, 4)))

export const mockRecentUpdates = () =>
  wait([
    { time: '2026-04-20 09:30:12', content: '张三购买了年度套餐，已完成支付。' },
    { time: '2026-04-20 08:46:05', content: '远见包装完成会员充值 180 天。' },
    { time: '2026-04-19 20:14:31', content: '系统新增 3 个工艺配置项待审核。' },
    { time: '2026-04-19 18:32:48', content: '青禾设计提交了子账号权限调整申请。' }
  ])

export const mockTenantList = (payload = {}) => {
  let result = clone(tenants)
  result = filterByText(result, 'tenantName', payload.tenantName)
  result = filterByText(result, 'userName', payload.userName)
  result = filterByText(result, 'userPhone', payload.userPhone || payload.phone)
  if (payload.status !== '' && payload.status !== undefined && payload.status !== null) {
    result = result.filter((item) => Number(item.status) === Number(payload.status))
  }
  return wait(paginate(result, payload.pageNum, payload.pageSize))
}

export const mockTenantDetail = (id) =>
  wait(clone(tenants.find((item) => Number(item.id) === Number(id))))

export const mockTenantSave = (payload) => {
  if (payload.id) {
    const index = tenants.findIndex((item) => Number(item.id) === Number(payload.id))
    tenants[index] = { ...tenants[index], ...payload }
  } else {
    state.tenantId += 1
    tenants.unshift({
      id: state.tenantId,
      createTime: '2026-04-20 11:00:00',
      status: 1,
      vipDay: 0,
      vipName: '体验版',
      vipOrderList: [],
      businessLicensePath: 'https://dummyimage.com/600x360/e8eef9/5472a8&text=License',
      ...payload
    })
  }
  return wait(null)
}

export const mockTenantDelete = (id) => {
  const index = tenants.findIndex((item) => Number(item.id) === Number(id))
  if (index >= 0) tenants.splice(index, 1)
  return wait(null)
}

export const mockTenantStatus = ({ id, status }) => {
  const record = tenants.find((item) => Number(item.id) === Number(id))
  if (record) record.status = status
  return wait(null)
}

export const mockTenantRecharge = ({ id, day }) => {
  const record = tenants.find((item) => Number(item.id) === Number(id))
  if (record) record.vipDay = Number(record.vipDay || 0) + Number(day || 0)
  return wait(null)
}

export const mockTenantResetPassword = () => wait(null)

export const mockTenantUserList = ({ tenantId, name, phone }) => {
  let list = clone(tenantUsers[tenantId] || [])
  list = filterByText(list, 'name', name)
  list = filterByText(list, 'phone', phone)
  return wait(list)
}

export const mockTenantUserMenus = () => wait(clone(menuTree))

export const mockTenantUserSave = (payload) => {
  const list = tenantUsers[payload.tenantId] || (tenantUsers[payload.tenantId] = [])
  if (payload.id) {
    const index = list.findIndex((item) => Number(item.id) === Number(payload.id))
    list[index] = { ...list[index], ...payload }
  } else {
    state.tenantUserId += 1
    list.unshift({
      id: state.tenantUserId,
      createTime: '2026-04-20 11:18:00',
      status: 1,
      ...payload
    })
  }
  return wait(null)
}

export const mockTenantUserStatus = ({ id, tenantId, status }) => {
  const list = tenantUsers[tenantId] || []
  const record = list.find((item) => Number(item.id) === Number(id))
  if (record) record.status = status
  return wait(null)
}

export const mockTenantUserResetPassword = () => wait(null)

export const mockTenantUserDelete = ({ id, tenantId }) => {
  const list = tenantUsers[tenantId] || []
  const index = list.findIndex((item) => Number(item.id) === Number(id))
  if (index >= 0) list.splice(index, 1)
  return wait(null)
}

export const mockVipList = (payload = {}) => {
  let result = clone(vips)
  result = filterByText(result, 'name', payload.name)
  if (payload.status !== '' && payload.status !== undefined && payload.status !== null) {
    result = result.filter((item) => Number(item.status) === Number(payload.status))
  }
  return wait(paginate(result, payload.pageNum, payload.pageSize))
}

export const mockVipTotal = () =>
  wait({
    orderTotal: vips.reduce((sum, item) => sum + Number(item.totalOrderNum || 0), 0),
    orderMoneyTotal: vips.reduce((sum, item) => sum + Number(item.totalOrderMoney || 0), 0)
  })

export const mockVipSave = (payload) => {
  if (payload.id) {
    const index = vips.findIndex((item) => Number(item.id) === Number(payload.id))
    vips[index] = { ...vips[index], ...payload }
  } else {
    state.vipId += 1
    vips.unshift({ id: state.vipId, status: 1, totalOrderNum: 0, totalOrderMoney: 0, ...payload })
  }
  return wait(null)
}

export const mockVipStatus = ({ id, status }) => {
  const record = vips.find((item) => Number(item.id) === Number(id))
  if (record) record.status = status
  return wait(null)
}

export const mockVipDelete = (id) => {
  const index = vips.findIndex((item) => Number(item.id) === Number(id))
  if (index >= 0) vips.splice(index, 1)
  return wait(null)
}

export const mockOrderList = (payload = {}) => {
  let result = clone(orders)
  result = filterByText(result, 'orderId', payload.orderId)
  result = filterByText(result, 'tenantName', payload.tenantName)
  result = filterByText(result, 'userName', payload.userName)
  result = filterByText(result, 'userPhone', payload.phone)
  if (payload.status) {
    result = result.filter((item) => Number(item.status) === Number(payload.status))
  }
  return wait(paginate(result, payload.pageNum, payload.pageSize))
}

export const mockOrderTotal = () =>
  wait({
    orderTotal: orders.length,
    orderMoneyTotal: orders.reduce((sum, item) => sum + Number(item.payMoney || 0), 0)
  })

export const mockCraftList = (payload = {}) => {
  let result = clone(crafts)
  result = filterByText(result, 'name', payload.name)
  result = filterByText(result, 'unit', payload.unit)
  if (payload.status !== '' && payload.status !== undefined && payload.status !== null) {
    result = result.filter((item) => Number(item.status) === Number(payload.status))
  }
  return wait(paginate(result, payload.pageNum, payload.pageSize))
}

export const mockCraftSave = (payload) => {
  if (payload.id) {
    const index = crafts.findIndex((item) => Number(item.id) === Number(payload.id))
    crafts[index] = { ...crafts[index], ...payload }
  } else {
    state.craftId += 1
    crafts.unshift({ id: state.craftId, tenantId: '-1', status: 1, ...payload })
  }
  return wait(null)
}

export const mockCraftStatus = ({ id, status }) => {
  const record = crafts.find((item) => Number(item.id) === Number(id))
  if (record) record.status = status
  return wait(null)
}

export const mockCraftDelete = (id) => {
  const index = crafts.findIndex((item) => Number(item.id) === Number(id))
  if (index >= 0) crafts.splice(index, 1)
  return wait(null)
}
