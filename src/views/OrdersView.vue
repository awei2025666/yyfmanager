<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Printer, Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import {
  getTenantCraftList,
  getTenantOrderDetail,
  getTenantOrderList,
  getTenantOrderPrintUrl,
  getTenantOrderProcess,
  searchTenantClients
} from '../api/tenant'

const route = useRoute()
const router = useRouter()

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  companyName: '',
  fillUserName: '',
  orderId: '',
  status: '',
  orderTime: ''
})

const autoApprove = ref(true)
const loading = ref(false)
const saving = ref(false)
const detailLoading = ref(false)
const clientSearching = ref(false)
const clientOptions = ref([])
const lastClientKeyword = ref(null)
let clientSearchPromise = null
const outsourceLoading = ref(false)
const outsourceOptions = ref([])
const craftSearching = ref(false)
const craftOptions = ref([])
const lastCraftKeyword = ref(null)
let craftSearchPromise = null
const detailVisible = ref(false)
const routeDetailToken = ref('')
const orderFormVisible = ref(false)
const approveVisible = ref(false)
const rejectVisible = ref(false)
const currentRecord = ref(null)
const approvalRemark = ref('')
const rejectRemark = ref('')
const viewMode = ref(route.query.mode === 'detail' ? 'detail' : 'list')
const currentStep = ref(1)
const formMode = ref('create')
const sourceOrderId = ref(null)
const outsourceFilters = reactive({
  memberId: '',
  memberName: ''
})

const formState = reactive({
  id: null,
  orderId: '',
  cooperativeClientId: '',
  companyName: '',
  linkman: '',
  fillUserName: '',
  phone: '',
  deliveryDate: '',
  deliveryType: '',
  companyAddress: '',
  printingRequirements: '',
  productInfo: '',
  payMoney: 0,
  totalMoney: 0,
  productList: [],
  craftList: [],
  outsourceSupplierId: '',
  outsourceSupplierName: '',
  outsourceSupplierContact: '',
  status: 1,
  printCode: '--',
  remark: ''
})

const statusMap = {
  1: { label: '待审批', type: 'danger', tone: 'pending-approval' },
  2: { label: '待生产', type: 'warning', tone: 'pending-production' },
  3: { label: '生产中', type: 'warning', tone: 'producing' },
  4: { label: '待配送', type: 'primary', tone: 'pending-delivery' },
  5: { label: '配送中', type: 'primary', tone: 'delivering' },
  6: { label: '已完成', type: 'success', tone: 'completed' },
  7: { label: '已驳回', type: 'danger', tone: 'rejected' },
  8: { label: '已转外协', type: 'info', tone: 'outsourced' }
}
const statusOptions = computed(() =>
  Object.entries(statusMap)
    .filter(([key]) => Number(key) <= 7)
    .map(([value, item]) => ({ value: Number(value), ...item }))
)
const deliveryTypeOptions = [
  { label: '自提', value: 1 },
  { label: '发货', value: 2 },
  { label: '送货', value: 3 },
  { label: '客运', value: 4 }
]
const deliveryTypeText = (value) =>
  deliveryTypeOptions.find((item) => String(item.value) === String(value))?.label || value || '-'
const statusToneClass = (status) => `order-status--${statusMap[status]?.tone || 'outsourced'}`

const fillClientInfo = (client = {}) => {
  formState.cooperativeClientId = client.id || ''
  formState.companyName = client.companyName || ''
  formState.linkman = client.linkman || ''
  formState.phone = client.phone || ''
  formState.companyAddress = client.companyAddress || ''
}

const normalizeClientOptions = (data) => {
  const list = Array.isArray(data) ? data : data?.records || data?.list || []
  const selected = formState.cooperativeClientId
    ? list.find((item) => String(item.id) === String(formState.cooperativeClientId))
      || clientOptions.value.find((item) => String(item.id) === String(formState.cooperativeClientId))
    : null
  const next = selected ? [selected, ...list.filter((item) => String(item.id) !== String(selected.id))] : list
  return next.slice(0, 20)
}

const searchClients = async (keyword = '') => {
  const companyName = String(keyword || '').trim()
  if (clientSearching.value && lastClientKeyword.value === companyName) return clientSearchPromise
  if (!companyName && lastClientKeyword.value === '' && clientOptions.value.length) return
  lastClientKeyword.value = companyName
  clientSearching.value = true
  const request = searchTenantClients({ companyName })
  clientSearchPromise = request
  try {
    const data = await request
    clientOptions.value = normalizeClientOptions(data)
  } catch (error) {
    lastClientKeyword.value = null
    ElMessage.error(error?.message || '单位搜索失败')
  } finally {
    if (clientSearchPromise === request) {
      clientSearching.value = false
      clientSearchPromise = null
    }
  }
}

const selectClient = (id) => {
  const client = clientOptions.value.find((item) => String(item.id) === String(id))
  if (client) fillClientInfo(client)
}

const seedClientOption = (record = {}) => {
  const companyName = record.companyName || ''
  if (!companyName) return
  const id = record.cooperativeClientId || companyName
  formState.cooperativeClientId = id
  formState.companyName = companyName
  formState.linkman = record.linkman || ''
  formState.phone = record.phone || ''
  formState.companyAddress = record.companyAddress || '--'
  clientOptions.value = [{
    id,
    companyName,
    linkman: formState.linkman,
    phone: formState.phone,
    companyAddress: formState.companyAddress
  }]
}

const handleClientDropdownVisible = (visible) => {
  if (visible) searchClients('')
}

const normalizeOutsourceOptions = (data) => {
  const list = Array.isArray(data) ? data : data?.records || data?.list || []
  return list
    .map((item) => ({
      ...item,
      memberId: item.memberId || item.id || item.customerId || item.companyCode || '',
      memberName: item.memberName || item.companyName || item.name || '-',
      contact: item.contact || item.linkman || item.userName || '-'
    }))
    .filter((item) => {
      const idMatched = !outsourceFilters.memberId || String(item.memberId).includes(String(outsourceFilters.memberId))
      const nameMatched = !outsourceFilters.memberName || String(item.memberName).includes(String(outsourceFilters.memberName))
      return idMatched && nameMatched
    })
    .slice(0, 20)
}

const loadOutsourceUnits = async () => {
  outsourceLoading.value = true
  try {
    const data = await searchTenantClients({
      companyName: outsourceFilters.memberName || undefined,
      customerType: 3
    })
    outsourceOptions.value = normalizeOutsourceOptions(data)
  } catch (error) {
    ElMessage.error(error?.message || '外协单位加载失败')
  } finally {
    outsourceLoading.value = false
  }
}

const resetOutsourceFilters = () => {
  outsourceFilters.memberId = ''
  outsourceFilters.memberName = ''
  loadOutsourceUnits()
}

const selectOutsourceUnit = (row = {}) => {
  formState.outsourceSupplierId = row.memberId || row.id || ''
  formState.outsourceSupplierName = row.memberName || row.companyName || ''
  formState.outsourceSupplierContact = row.contact || row.linkman || ''
}

const normalizeCraftOptions = (data) => {
  const list = Array.isArray(data) ? data : data?.records || data?.list || []
  return list.slice(0, 30).map((item) => ({
    ...item,
    id: item.id ?? item.craftId ?? item.craftName ?? item.name,
    craftName: item.craftName || item.name || item.craft || '-'
  }))
}

const searchCrafts = async (keyword = '') => {
  const craftName = String(keyword || '').trim()
  if (craftSearching.value && lastCraftKeyword.value === craftName) return craftSearchPromise
  if (!craftName && lastCraftKeyword.value === '' && craftOptions.value.length) return
  lastCraftKeyword.value = craftName
  craftSearching.value = true
  const request = getTenantCraftList({
    pageNum: 1,
    pageSize: 30,
    craftName: craftName || undefined
  })
  craftSearchPromise = request
  try {
    const data = await request
    craftOptions.value = normalizeCraftOptions(data)
  } catch (error) {
    lastCraftKeyword.value = null
    ElMessage.error(error?.message || '工艺数据加载失败')
  } finally {
    if (craftSearchPromise === request) {
      craftSearching.value = false
      craftSearchPromise = null
    }
  }
}

const handleCraftDropdownVisible = (visible) => {
  if (visible) searchCrafts('')
}

const rows = ref([])
const summary = reactive({
  orderTotal: 0,
  orderMoneyTotal: 0
})

const enrichOrderRow = (item = {}) => {
  const products = item.products || item.productList || []
  const crafts = item.crafts || item.craftList || []
  const timeline = item.timeline?.length
    ? item.timeline
    : [
        {
          date: item.orderTime || item.createTime || '--',
          title: '创建订单',
          desc: `${item.fillUserName || item.userName || '系统'} 提交订单`
        }
      ]

  return {
    deliveryType: item.deliveryType || '',
    companyAddress: item.companyAddress || '--',
    linkman: item.linkman || '',
    phone: item.phone || '',
    deliveryDate: item.deliveryDate || item.orderTime || item.createTime || '',
    printingRequirements: item.printingRequirements || '',
    productInfo: item.productInfo || item.vipName || '--',
    companyName: item.companyName || '--',
    fillUserName: item.fillUserName || item.userName || '--',
    orderTime: item.orderTime || item.createTime || '--',
    totalMoney: item.totalMoney ?? item.payMoney ?? 0,
    payMoney: item.totalMoney ?? item.payMoney ?? 0,
    printCode: item.printCode || '--',
    remark: item.remark || '',
    ...item,
    products,
    crafts,
    timeline
  }
}

const normalizeDetailRow = (detail = {}, base = {}, processList = []) => {
  const products = (detail.productList || detail.products || []).map((item) => ({
    ...item,
    productName: item.productName || item.name || item.productInfo || '-',
    finishedSpec: item.finishedSpec || item.trimmedSize || item.specification || '--',
    quantity: item.quantity ?? item.orderQuantity ?? 0,
    unit: item.unit || '-',
    amount: item.amount ?? item.money ?? 0
  }))
  const crafts = (detail.craftList || detail.crafts || []).map((item) => ({
    ...item,
    productName: item.productName || item.productInfo || '-',
    craftName: item.craftName || item.name || '-',
    spec: item.spec || item.specification || '--',
    openNum: item.openNum ?? item.formatSize ?? '--',
    startPrice: item.startPrice ?? item.priceBase ?? '--',
    finishNum: item.finishNum ?? item.orderQuantity ?? 0,
    unit: item.unit || '-',
    price: item.price ?? item.unitPrice ?? 0,
    customerAmount: item.customerAmount ?? item.customerMoney ?? 0,
    remark: item.remark || ''
  }))
  const timeline = (processList || []).map((item) => ({
    date: item.createTime || '--',
    title: item.content || '订单记录',
    desc: item.tenantUserName || item.createUserName || ''
  }))
  return enrichOrderRow({
    ...base,
    ...detail,
    products,
    crafts,
    timeline: timeline.length ? timeline : base.timeline
  })
}

const stats = computed(() => {
  const totalMoney = Number(summary.orderMoneyTotal || 0)
  const pendingCount = rows.value.filter((item) => item.status === 1).length
  return {
    orderTotal: Number(summary.orderTotal || 0),
    orderMoneyTotal: totalMoney,
    pendingCount
  }
})
const activeFilters = computed(() =>
  [
    { key: 'companyName', label: '单位名称', value: filters.companyName },
    { key: 'fillUserName', label: '业务员', value: filters.fillUserName },
    { key: 'orderId', label: '订单号', value: filters.orderId },
    { key: 'status', label: '订单状态', value: filters.status === '' ? '' : statusMap[filters.status]?.label },
    { key: 'orderTime', label: '订单时间', value: filters.orderTime }
  ].filter((item) => item.value !== '' && item.value !== null && item.value !== undefined)
)
const localCards = computed(() => [
  { label: '当前页订单', value: rows.value.length },
  { label: '已完成', value: rows.value.filter((item) => item.status === 6).length },
  { label: '已驳回', value: rows.value.filter((item) => item.status === 7).length }
])
const orderStepItems = computed(() => [
  ...(formMode.value === 'outsource' ? [{ step: 1, label: '外协单位', done: currentStep.value > 1 }] : []),
  { step: formMode.value === 'outsource' ? 2 : 1, label: '订单信息', done: currentStep.value > (formMode.value === 'outsource' ? 2 : 1) },
  { step: formMode.value === 'outsource' ? 3 : 2, label: '产品信息', done: currentStep.value > (formMode.value === 'outsource' ? 3 : 2) },
  { step: formMode.value === 'outsource' ? 4 : 3, label: '工艺信息', done: false }
])
const maxOrderStep = computed(() => formMode.value === 'outsource' ? 4 : 3)
const formContentStep = computed(() => formMode.value === 'outsource' ? currentStep.value - 1 : currentStep.value)
const orderDialogTitle = computed(() => {
  if (formMode.value === 'outsource') return '转外协'
  return formState.id ? '编辑订单' : '添加订单'
})
const productRows = computed(() => {
  if (orderFormVisible.value) return formState.productList || []
  if (!orderFormVisible.value && currentRecord.value?.products?.length) return currentRecord.value.products
  return []
})
const savedProductOptions = computed(() =>
  (formState.productList || [])
    .filter((item) => !item._isEditing && item.productName)
    .map((item, index) => ({
      ...item,
      optionId: item.id || `${item.productName}-${index}`
    }))
)
const rowProductAmount = (row = {}) => {
  const quantity = Number(row.orderQuantity ?? row.quantity ?? row.num ?? 1)
  const amount = Number(row.amount ?? row.money ?? row.price ?? row.unitPrice ?? row.totalMoney ?? row.customerMoney ?? 0)
  return quantity * amount
}
const productTotalAmount = computed(() => productRows.value.reduce((sum, row) => sum + rowProductAmount(row), 0))
const formOrderTotal = computed(() => productTotalAmount.value)
const addProductRow = () => {
  if (!Array.isArray(formState.productList)) formState.productList = []
  formState.productList.push({
    productName: '',
    finishedSpec: '',
    quantity: '',
    unit: '',
    amount: '',
    _isEditing: true,
    _isNew: true
  })
}
const saveProductRow = (row) => {
  if (!row.productName || !row.quantity || !row.amount) {
    ElMessage.warning('请填写产品名称、订货数量和金额')
    return
  }
  row.quantity = Number(row.quantity)
  row.amount = Number(row.amount)
  row._isEditing = false
  row._isNew = false
}
const cancelProductRow = (row, index) => {
  if (row._isNew) {
    formState.productList.splice(index, 1)
    return
  }
  row._isEditing = false
}
const editProductRow = (row) => {
  row._isEditing = true
  row._isNew = false
}
const removeProductRow = (index) => {
  formState.productList.splice(index, 1)
}
const cleanProductRow = (row = {}) => {
  const { _isEditing, _isNew, ...payload } = row
  return payload
}
const craftRows = computed(() => {
  if (orderFormVisible.value) return formState.craftList || []
  if (!orderFormVisible.value && currentRecord.value?.crafts?.length) return currentRecord.value.crafts
  return []
})
const addCraftRow = () => {
  if (!savedProductOptions.value.length) {
    ElMessage.warning('请先添加并保存产品信息')
    return
  }
  if (!Array.isArray(formState.craftList)) formState.craftList = []
  formState.craftList.push({
    productName: '',
    craftId: '',
    craftName: '',
    spec: '',
    openNum: '',
    startPrice: '',
    finishNum: '',
    unit: '',
    price: '',
    customerAmount: '',
    remark: '',
    _isEditing: true,
    _isNew: true
  })
}
const selectCraftProduct = (row) => {
  const product = savedProductOptions.value.find((item) => item.productName === row.productName)
  if (!product) return
  row.productId = product.id || ''
  row.spec = row.spec || product.finishedSpec || ''
  row.openNum = row.openNum || product.quantity || ''
  row.startPrice = row.startPrice || product.unit || ''
  row.unit = row.unit || product.unit || ''
}
const selectCraftName = (row, id) => {
  const craft = craftOptions.value.find((item) => String(item.id) === String(id))
  if (!craft) return
  row.craftId = craft.id
  row.craftName = craft.craftName
}
const saveCraftRow = (row) => {
  if (!row.productName || !row.craftName) {
    ElMessage.warning('请选择产品名称和工艺名称')
    return
  }
  row._isEditing = false
  row._isNew = false
}
const cancelCraftRow = (row, index) => {
  if (row._isNew) {
    formState.craftList.splice(index, 1)
    return
  }
  row._isEditing = false
}
const editCraftRow = (row) => {
  row._isEditing = true
  row._isNew = false
}
const removeCraftRow = (index) => {
  formState.craftList.splice(index, 1)
}
const cleanCraftRow = (row = {}) => {
  const { _isEditing, _isNew, ...payload } = row
  return payload
}
const detailInfo = computed(() => {
  const row = currentRecord.value || formState
  return [
    { label: '订单号', value: row.orderId || '20260329001' },
    { label: '单位名称', value: row.companyName || '成都龙泉驿古月良品广告' },
    { label: '联系人', value: row.linkman || '丽丽' },
    { label: '联系方式', value: row.phone || '1556246752' },
    { label: '送货地址', value: row.companyAddress || '四川省成都市龙泉驿区万源路317号', wide: true },
    { label: '交货日期', value: row.deliveryDate || row.orderTime || '2026-04-01 12:00:00' },
    { label: '交货方式', value: deliveryTypeText(row.deliveryType) },
    { label: '印刷要求', value: row.printingRequirements || '无' },
    { label: '备注', value: row.remark || '无' }
  ]
})

const formatMoney = (value) => `¥${new Intl.NumberFormat('zh-CN').format(Number(value || 0).toFixed ? Number(value || 0) : value)}`

const setOrderMode = (mode) => {
  viewMode.value = mode
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }))
  const query = { ...route.query }
  if (mode === 'list') {
    delete query.mode
  } else {
    query.mode = mode === 'form' ? 'create' : mode
  }
  router.replace({ name: 'orders', query })
}

const resetFilters = () => {
  Object.assign(filters, {
    pageNum: 1,
    pageSize: 10,
    companyName: '',
    fillUserName: '',
    orderId: '',
    status: '',
    orderTime: ''
  })
  loadData()
}

const buildQuery = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  companyName: filters.companyName || undefined,
  fillUserName: filters.fillUserName || undefined,
  orderId: filters.orderId || routeQueryValue('detailId') || undefined,
  status: filters.status || undefined,
  createTimeStart: filters.orderTime || undefined,
  createTimeEnd: filters.orderTime || undefined
})

const loadData = async () => {
  loading.value = true
  try {
    const list = await getTenantOrderList(buildQuery())
    rows.value = (list.records || []).map(enrichOrderRow)
    summary.orderTotal = list.total || 0
    summary.orderMoneyTotal = rows.value.reduce((sum, item) => sum + Number(item.totalMoney || 0), 0)
    await openRouteDetailIfNeeded()
  } catch (error) {
    ElMessage.error(error?.message || '订单数据加载失败')
  } finally {
    loading.value = false
  }
}

const routeQueryValue = (key) => {
  const value = route.query[key]
  return Array.isArray(value) ? value[0] : value
}

const openRouteDetailIfNeeded = async () => {
  const detailId = routeQueryValue('detailId')
  if (!detailId) return
  const token = `${detailId}:${route.fullPath}`
  if (routeDetailToken.value === token) return
  routeDetailToken.value = token
  const row = rows.value.find((item) =>
    [item.id, item.orderId, item.orderNo, item.orderRecordId].some((value) => String(value || '') === String(detailId))
  )
  await openDetail(row || { id: detailId, orderId: detailId })
}

const openAdd = () => {
  formMode.value = 'create'
  sourceOrderId.value = null
  Object.assign(formState, {
    id: null,
    orderId: '',
    cooperativeClientId: '',
    companyName: '',
    linkman: '',
    fillUserName: '',
    phone: '',
    deliveryDate: '',
    deliveryType: '',
    companyAddress: '',
    printingRequirements: '',
    productInfo: '',
    payMoney: 0,
    totalMoney: 0,
    productList: [],
    products: [],
    craftList: [],
    crafts: [],
    outsourceSupplierId: '',
    outsourceSupplierName: '',
    outsourceSupplierContact: '',
    status: autoApprove.value ? 2 : 1,
    printCode: '--',
    remark: ''
  })
  clientOptions.value = []
  lastClientKeyword.value = null
  craftOptions.value = []
  lastCraftKeyword.value = null
  currentStep.value = 1
  orderFormVisible.value = true
}

const openEdit = (row) => {
  formMode.value = 'edit'
  sourceOrderId.value = null
  const record = JSON.parse(JSON.stringify(row))
  Object.assign(formState, {
    ...record,
    productList: record.products || record.productList || [],
    craftList: record.crafts || record.craftList || []
  })
  seedClientOption(record)
  currentStep.value = 1
  orderFormVisible.value = true
}

const openOutsource = async (row) => {
  formMode.value = 'outsource'
  sourceOrderId.value = row.id
  let record = JSON.parse(JSON.stringify(row))
  if (row?.id) {
    detailLoading.value = true
    try {
      const detail = await getTenantOrderDetail(row.id)
      record = normalizeDetailRow(detail || {}, row, row.timeline || [])
    } catch (error) {
      ElMessage.error(error?.message || '订单详情加载失败')
    } finally {
      detailLoading.value = false
    }
  }
  Object.assign(formState, {
    ...record,
    productList: record.products || record.productList || [],
    craftList: record.crafts || record.craftList || [],
    outsourceSupplierId: '',
    outsourceSupplierName: '',
    outsourceSupplierContact: ''
  })
  seedClientOption(record)
  outsourceFilters.memberId = ''
  outsourceFilters.memberName = ''
  currentStep.value = 1
  orderFormVisible.value = true
  loadOutsourceUnits()
}

const saveOrder = () => {
  if (saving.value) return
  if (formMode.value === 'outsource' && !formState.outsourceSupplierId) {
    ElMessage.warning('请选择外协单位')
    return
  }
  if (formState.productList?.some((item) => item._isEditing)) {
    ElMessage.warning('请先保存产品信息')
    return
  }
  if (formState.craftList?.some((item) => item._isEditing)) {
    ElMessage.warning('请先保存工艺信息')
    return
  }
  saving.value = true
  const total = formOrderTotal.value
  const products = JSON.parse(JSON.stringify(productRows.value.map(cleanProductRow)))
  const crafts = JSON.parse(JSON.stringify(craftRows.value.map(cleanCraftRow)))
  const payload = {
    ...JSON.parse(JSON.stringify(formState)),
    payMoney: total,
    totalMoney: total,
    products,
    crafts
  }
  if (formState.id) {
    const index = rows.value.findIndex((item) => item.id === formState.id)
    if (index > -1) {
      rows.value[index] = {
        ...rows.value[index],
        ...payload,
        status: formMode.value === 'outsource' ? 8 : payload.status,
        outsourceSupplierId: formState.outsourceSupplierId,
        outsourceSupplierName: formState.outsourceSupplierName,
        outsourceSupplierContact: formState.outsourceSupplierContact
      }
    }
  } else {
    rows.value.unshift({
      ...payload,
      id: Date.now(),
      orderId: formState.orderId || `20260421${rows.value.length + 1}`,
      orderTime: formState.deliveryDate || '2026-04-21 10:30',
      timeline: [{ date: '2026-04-21', title: '创建订单', desc: '当前账号 提交订单' }],
      crafts
    })
  }
  orderFormVisible.value = false
  ElMessage.success(formMode.value === 'outsource' ? '订单已转外协' : '订单已保存')
  saving.value = false
}

const openDetail = async (row) => {
  currentRecord.value = JSON.parse(JSON.stringify(row))
  detailVisible.value = true
  if (!row?.id) return
  detailLoading.value = true
  try {
    const [detail, processList] = await Promise.all([
      getTenantOrderDetail(row.id),
      getTenantOrderProcess(row.id)
    ])
    currentRecord.value = normalizeDetailRow(detail || {}, row, processList || [])
  } catch (error) {
    ElMessage.error(error?.message || '订单详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

const printOrder = async (row) => {
  const orderId = row?.id || row?.orderPrimaryId || row?.orderDbId
  if (!orderId) {
    ElMessage.error('缺少订单ID，无法打印')
    return
  }
  try {
    const result = await getTenantOrderPrintUrl(orderId)
    const url = typeof result === 'string' ? result : result?.url || result?.printUrl || result?.fileUrl
    if (!url) {
      ElMessage.error('打印地址为空')
      return
    }
    window.open(url, '_blank')
  } catch (error) {
    ElMessage.error(error?.message || '打印地址获取失败')
  }
}

const removeOrder = async (row) => {
  await ElMessageBox.confirm(`确认删除订单 ${row.orderId} 吗？`, '删除确认', { type: 'warning' })
  rows.value = rows.value.filter((item) => item.id !== row.id)
  summary.orderTotal = Math.max(0, Number(summary.orderTotal || 0) - 1)
  ElMessage.success('删除成功')
}

const openApprove = (row) => {
  currentRecord.value = row
  approvalRemark.value = ''
  approveVisible.value = true
}

const confirmApprove = () => {
  currentRecord.value.status = 2
  currentRecord.value.timeline.unshift({
    date: '2026-04-21',
    title: '审批通过',
    desc: approvalRemark.value || '审批通过'
  })
  approveVisible.value = false
  detailVisible.value = false
  ElMessage.success('订单已通过')
}

const openReject = (row) => {
  currentRecord.value = row
  rejectRemark.value = ''
  rejectVisible.value = true
}

const confirmReject = () => {
  currentRecord.value.status = 7
  currentRecord.value.timeline.unshift({
    date: '2026-04-21',
    title: '驳回订单',
    desc: rejectRemark.value || '资料不完整'
  })
  rejectVisible.value = false
  detailVisible.value = false
  ElMessage.success('订单已驳回')
}

const reapplyOrder = async (row) => {
  formMode.value = 'create'
  sourceOrderId.value = row.id
  let record = JSON.parse(JSON.stringify(row))
  if (row?.id) {
    detailLoading.value = true
    try {
      const detail = await getTenantOrderDetail(row.id)
      record = normalizeDetailRow(detail || {}, row, row.timeline || [])
    } catch (error) {
      ElMessage.error(error?.message || '订单详情加载失败')
    } finally {
      detailLoading.value = false
    }
  }
  Object.assign(formState, {
    ...record,
    id: null,
    orderId: '',
    productList: (record.products || record.productList || []).map((item) => ({ ...item, _isEditing: false, _isNew: false })),
    products: [],
    craftList: (record.crafts || record.craftList || []).map((item) => ({ ...item, _isEditing: false, _isNew: false })),
    crafts: [],
    outsourceSupplierId: '',
    outsourceSupplierName: '',
    outsourceSupplierContact: '',
    status: autoApprove.value ? 2 : 1
  })
  seedClientOption(record)
  craftOptions.value = []
  lastCraftKeyword.value = null
  currentStep.value = 1
  orderFormVisible.value = true
}

const repeatOrder = (row) => {
  const nextStatus = autoApprove.value ? 2 : 1
  const copy = JSON.parse(JSON.stringify(row))
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  const orderTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const orderId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  rows.value.unshift({
    ...copy,
    id: Date.now(),
    orderId,
    status: nextStatus,
    orderTime,
    timeline: [
      { date: orderTime, title: '返单创建', desc: '根据原订单复制创建' },
      ...(copy.timeline || [])
    ]
  })
  summary.orderTotal = Number(summary.orderTotal || 0) + 1
  summary.orderMoneyTotal = rows.value.reduce((sum, item) => sum + Number(item.totalMoney || 0), 0)
  ElMessage.success(`已返单，状态为${statusMap[nextStatus].label}`)
}

const outsourceOrder = (row) => {
  openOutsource(row)
}

const rowActions = (row) => {
  if (row.status === 1) return ['审批', '编辑', '删除']
  if (row.status === 7) return ['重新申请', '删除']
  if (row.status === 2) return ['详情', '转外协']
  if (row.status === 6 || row.status === 8) return ['详情', '返单']
  return ['详情']
}

const handleAction = (row, action) => {
  if (action === '审批') return openDetail(row)
  if (action === '编辑') return openEdit(row)
  if (action === '删除') return removeOrder(row)
  if (action === '重新申请') return reapplyOrder(row)
  if (action === '转外协') return outsourceOrder(row)
  if (action === '返单') return repeatOrder(row)
  return openDetail(row)
}

onMounted(loadData)

watch(
  () => route.fullPath,
  () => {
    loadData()
  }
)
</script>

<template>
  <div class="page-stack">
    <section v-if="viewMode === 'list'" class="summary-grid">
      <article class="summary-card">
        <p>订单数合计</p>
        <strong>{{ stats.orderTotal }}</strong>
      </article>
      <article class="summary-card">
        <p>金额合计</p>
        <strong>{{ formatMoney(stats.orderMoneyTotal) }}</strong>
      </article>
      <article class="summary-card">
        <p>待审批</p>
        <strong>{{ stats.pendingCount }}</strong>
      </article>
      <article v-for="card in localCards" :key="card.label" class="summary-card">
        <p>{{ card.label }}</p>
        <strong>{{ card.value }}</strong>
      </article>
    </section>

    <PageBlock v-if="viewMode === 'list'" class="filter-card">
      <div class="filter-grid">
        <label>
          <span>单位名称</span>
          <el-input v-model="filters.companyName" placeholder="请输入" />
        </label>
        <label>
          <span>业务员</span>
          <el-input v-model="filters.fillUserName" placeholder="请输入" />
        </label>
        <label>
          <span>订单号</span>
          <el-input v-model="filters.orderId" placeholder="请输入" />
        </label>
        <label>
          <span>订单状态</span>
          <el-select v-model="filters.status" placeholder="请选择" clearable>
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </label>
        <label>
          <span>订单时间</span>
          <el-date-picker v-model="filters.orderTime" value-format="YYYY-MM-DD" placeholder="请选择" />
        </label>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </PageBlock>

    <PageBlock v-if="viewMode === 'list'" class="table-card">
      <div class="list-actions">
        <el-button type="primary" :icon="Plus" @click="openAdd">添加</el-button>
        <div class="auto-approve">
          <span>自动审批</span>
          <el-switch v-model="autoApprove" />
        </div>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>

      <div v-if="activeFilters.length" class="filter-tags">
        <span class="filter-tags__label">当前筛选</span>
        <el-tag
          v-for="item in activeFilters"
          :key="item.key"
          closable
          effect="plain"
          @close="filters[item.key] = ''; loadData()"
        >
          {{ item.label }}：{{ item.value }}
        </el-tag>
      </div>

      <div class="table-meta">
        <span>共 {{ stats.orderTotal }} 条数据</span>
        <span>当前页 {{ rows.length }} 条</span>
        <el-button link @click="resetFilters">重置筛选</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" empty-text="当前筛选下暂无订单数据">
        <el-table-column prop="orderId" label="订单号" min-width="150" />
        <el-table-column prop="companyName" label="单位名称" min-width="180" />
        <el-table-column prop="orderTime" label="订单时间" min-width="160" />
        <el-table-column prop="fillUserName" label="业务员" min-width="100" />
        <el-table-column prop="productInfo" label="产品信息" min-width="220" show-overflow-tooltip />
        <el-table-column prop="totalMoney" label="订单金额" min-width="130">
          <template #default="{ row }">{{ formatMoney(row.totalMoney) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" min-width="110">
          <template #default="{ row }">
            <button type="button" class="status-link" @click="openDetail(row)">
              <el-tag class="order-status-tag" :class="statusToneClass(row.status)" effect="plain">
                {{ statusMap[row.status]?.label || '-' }}
              </el-tag>
            </button>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220">
          <template #default="{ row }">
            <el-space wrap>
              <el-button
                v-for="action in rowActions(row)"
                :key="action"
                link
                :type="action === '删除' || action === '驳回' ? 'danger' : 'primary'"
                @click="handleAction(row, action)"
              >
                {{ action }}
              </el-button>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="工单打印" min-width="110" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" plain :icon="Printer" @click="printOrder(row)">打印</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="filters.pageNum"
          v-model:page-size="filters.pageSize"
          background
          layout="total, prev, pager, next, sizes"
          :page-sizes="[10, 20, 30, 50]"
          :total="stats.orderTotal"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </PageBlock>

    <el-dialog
      v-model="orderFormVisible"
      :title="orderDialogTitle"
      width="1280px"
      class="order-form-dialog"
      :close-on-click-modal="false"
    >
      <section class="order-flow">
      <PageBlock class="step-card">
        <div class="steps-line" :class="{ 'steps-line--four': orderStepItems.length === 4 }">
          <div
            v-for="item in orderStepItems"
            :key="item.step"
            class="step-node"
            :class="{ active: currentStep === item.step, done: item.done }"
          >
            <span>{{ item.done ? '✓' : item.step }}</span>
            <strong>{{ item.label }}</strong>
          </div>
        </div>
      </PageBlock>

      <PageBlock class="form-panel">
        <template v-if="formMode === 'outsource' && currentStep === 1">
          <div class="outsource-search">
            <label>
              <span>会员id</span>
              <el-input v-model="outsourceFilters.memberId" placeholder="请输入" />
            </label>
            <label>
              <span>会员名称</span>
              <el-input v-model="outsourceFilters.memberName" placeholder="请输入" />
            </label>
            <div class="outsource-search__actions">
              <el-button type="primary" :icon="Search" @click="loadOutsourceUnits">查询</el-button>
              <el-button :icon="Refresh" @click="resetOutsourceFilters">重置</el-button>
            </div>
          </div>
          <el-table
            v-loading="outsourceLoading"
            :data="outsourceOptions"
            class="design-table outsource-table"
            empty-text="暂无外协单位"
            @row-click="selectOutsourceUnit"
          >
            <el-table-column width="70">
              <template #default="{ row }">
                <el-radio
                  :model-value="formState.outsourceSupplierId"
                  :label="row.memberId"
                  @change="selectOutsourceUnit(row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="memberId" label="会员id" min-width="260" />
            <el-table-column prop="memberName" label="会员名称" min-width="320" />
            <el-table-column prop="contact" label="联系人" min-width="240" />
          </el-table>
        </template>
        <template v-else-if="formContentStep === 1">
          <h3>订单信息</h3>
          <div class="form-grid design-form-grid">
            <label class="full-span">
              <span><em>*</em>单位名称</span>
              <el-select
                v-model="formState.cooperativeClientId"
                filterable
                remote
                clearable
                reserve-keyword
                placeholder="边输边搜"
                :remote-method="searchClients"
                :loading="clientSearching"
                @visible-change="handleClientDropdownVisible"
                @change="selectClient"
              >
                <el-option
                  v-for="item in clientOptions"
                  :key="item.id"
                  :label="item.companyName"
                  :value="item.id"
                />
              </el-select>
            </label>
            <label>
              <span><em>*</em>联系人</span>
              <el-input v-model="formState.linkman" disabled placeholder="根据所选单位自动带出" />
            </label>
            <label>
              <span><em>*</em>联系方式</span>
              <el-input v-model="formState.phone" disabled placeholder="根据所选单位自动带出" />
            </label>
            <label class="full-span">
              <span><em>*</em>送货地址</span>
              <el-input v-model="formState.companyAddress" disabled placeholder="根据所选单位自动带出" />
            </label>
            <label>
              <span><em>*</em>交货日期</span>
              <el-date-picker
                v-model="formState.deliveryDate"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="年/月/日 时:分"
              />
            </label>
            <label>
              <span><em>*</em>交货方式</span>
              <el-select v-model="formState.deliveryType" placeholder="请选择">
                <el-option v-for="item in deliveryTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </label>
            <label class="full-span">
              <span>印刷要求</span>
              <el-input v-model="formState.printingRequirements" placeholder="输入" />
            </label>
            <label class="full-span">
              <span>备注</span>
              <el-input v-model="formState.remark" type="textarea" :rows="4" placeholder="输入" />
            </label>
          </div>
        </template>
        <template v-else-if="formContentStep === 2">
          <el-button type="primary" class="flow-add-button" @click="addProductRow">添加</el-button>
          <el-table :data="productRows" class="design-table">
            <el-table-column prop="productName" label="产品名称" min-width="460">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.productName" placeholder="请输入" />
                <span v-else>{{ row.productName || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="finishedSpec" label="成品规格" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.finishedSpec" placeholder="请输入" />
                <span v-else>{{ row.finishedSpec || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="订货数量" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.quantity" placeholder="请输入" />
                <span v-else>{{ row.quantity || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" min-width="130">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.unit" placeholder="请输入" />
                <span v-else>{{ row.unit || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" min-width="160">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.amount" placeholder="请输入" />
                <span v-else>{{ formatMoney(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="150">
              <template #default="{ row, $index }">
                <div class="table-actions">
                  <template v-if="row._isEditing">
                    <button type="button" @click="saveProductRow(row)">保存</button>
                    <button type="button" @click="cancelProductRow(row, $index)">取消</button>
                  </template>
                  <template v-else>
                    <button type="button" @click="editProductRow(row)">编辑</button>
                    <button type="button" @click="removeProductRow($index)">删除</button>
                  </template>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <template v-else>
          <el-button type="primary" class="flow-add-button" @click="addCraftRow">添加</el-button>
          <el-table :data="craftRows" class="design-table">
            <el-table-column prop="productName" label="产品名称" min-width="150">
              <template #default="{ row }">
                <el-select v-if="row._isEditing" v-model="row.productName" placeholder="请选择" @change="selectCraftProduct(row)">
                  <el-option
                    v-for="item in savedProductOptions"
                    :key="item.optionId"
                    :label="item.productName"
                    :value="item.productName"
                  />
                </el-select>
                <span v-else>{{ row.productName || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="craftName" label="工艺名称" min-width="150">
              <template #default="{ row }">
                <el-select
                  v-if="row._isEditing"
                  v-model="row.craftId"
                  filterable
                  remote
                  clearable
                  reserve-keyword
                  placeholder="边输边搜"
                  :remote-method="searchCrafts"
                  :loading="craftSearching"
                  @visible-change="handleCraftDropdownVisible"
                  @change="(id) => selectCraftName(row, id)"
                >
                  <el-option
                    v-for="item in craftOptions"
                    :key="item.id"
                    :label="item.craftName"
                    :value="item.id"
                  />
                </el-select>
                <span v-else>{{ row.craftName || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="spec" label="规格" min-width="120">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.spec" placeholder="请输入" />
                <span v-else>{{ row.spec || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="openNum" label="开数" min-width="120">
              <template #default="{ row }">
                <span v-if="row._isEditing">{{ row.openNum || '默认带出' }}</span>
                <span v-else>{{ row.openNum || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="startPrice" label="起价" min-width="120">
              <template #default="{ row }">
                <span v-if="row._isEditing">{{ row.startPrice || '默认带出' }}</span>
                <span v-else>{{ row.startPrice || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="finishNum" label="成品数量" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.finishNum" placeholder="请输入" />
                <span v-else>{{ row.finishNum || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" min-width="120">
              <template #default="{ row }">
                <span v-if="row._isEditing">{{ row.unit || '默认带出' }}</span>
                <span v-else>{{ row.unit || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价" min-width="120">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.price" placeholder="请输入" />
                <span v-else>{{ formatMoney(row.price) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="customerAmount" label="客户金额" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.customerAmount" placeholder="请输入" />
                <span v-else>{{ formatMoney(row.customerAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150">
              <template #default="{ row }">
                <el-input v-if="row._isEditing" v-model="row.remark" placeholder="请输入" />
                <span v-else>{{ row.remark || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="120">
              <template #default="{ row, $index }">
                <div class="table-actions">
                  <template v-if="row._isEditing">
                    <button type="button" @click="saveCraftRow(row)">保存</button>
                    <button type="button" @click="cancelCraftRow(row, $index)">取消</button>
                  </template>
                  <template v-else>
                    <button type="button" @click="editCraftRow(row)">编辑</button>
                    <button type="button" @click="removeCraftRow($index)">删除</button>
                  </template>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </PageBlock>

      <div class="sticky-total">
        <strong>订单合计：<span>{{ formatMoney(formOrderTotal) }}</span></strong>
        <div>
          <el-button :disabled="saving" @click="orderFormVisible = false">取消</el-button>
          <el-button v-if="currentStep > 1" type="primary" @click="currentStep -= 1">上一步</el-button>
          <el-button v-if="currentStep < maxOrderStep" type="primary" @click="currentStep += 1">下一步</el-button>
          <el-button v-else type="primary" :loading="saving" @click="saveOrder">保存</el-button>
        </div>
      </div>
      </section>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="1280px"
      class="order-detail-dialog"
      :close-on-click-modal="false"
    >
      <section v-if="currentRecord" v-loading="detailLoading" class="order-detail-page">
        <div class="status-banner" :class="statusToneClass(currentRecord.status)" @click="openDetail(currentRecord)">
          {{ statusMap[currentRecord.status]?.label || '订单详情' }}
        </div>

        <PageBlock title="订单信息">
          <div class="detail-grid design-detail-grid">
            <div v-for="item in detailInfo" :key="item.label" :class="{ 'full-span': item.wide }">
              <span>{{ item.label }}：</span><strong>{{ item.value }}</strong>
            </div>
          </div>
        </PageBlock>

        <PageBlock title="产品信息">
          <el-table :data="productRows" class="design-table">
            <el-table-column prop="productName" label="产品名称" min-width="520" />
            <el-table-column prop="finishedSpec" label="成品规格" min-width="160" />
            <el-table-column prop="quantity" label="订货数量" min-width="150" />
            <el-table-column prop="unit" label="单位" min-width="120" />
            <el-table-column prop="amount" label="金额" min-width="150">
              <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
            </el-table-column>
          </el-table>
        </PageBlock>

        <PageBlock title="工艺信息">
          <el-table :data="craftRows" class="design-table">
            <el-table-column prop="productName" label="产品名称" min-width="320" />
            <el-table-column prop="craftName" label="工艺名称" min-width="150" />
            <el-table-column prop="spec" label="规格" min-width="110" />
            <el-table-column prop="openNum" label="开数" min-width="110" />
            <el-table-column prop="startPrice" label="起价" min-width="110" />
            <el-table-column prop="finishNum" label="成品数量" min-width="140" />
            <el-table-column prop="unit" label="单位" min-width="110" />
            <el-table-column prop="price" label="单价" min-width="110">
              <template #default="{ row }">{{ formatMoney(row.price) }}</template>
            </el-table-column>
            <el-table-column prop="customerAmount" label="客户金额" min-width="150">
              <template #default="{ row }">{{ formatMoney(row.customerAmount) }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="120" />
          </el-table>
        </PageBlock>

        <PageBlock title="订单记录">
          <div class="timeline-card" v-for="item in currentRecord.timeline" :key="`${item.date}-${item.title}`">
            <p>{{ item.date }}</p>
            <strong>{{ item.title }}</strong>
            <span>{{ item.desc }}</span>
          </div>
        </PageBlock>

        <div class="sticky-total">
          <strong>订单合计：<span>{{ formatMoney(productTotalAmount) }}</span></strong>
          <div>
            <el-button @click="detailVisible = false">返回</el-button>
            <el-button v-if="currentRecord.status === 1" type="danger" @click="openReject(currentRecord)">驳回</el-button>
            <el-button v-if="currentRecord.status === 1" type="primary" @click="openApprove(currentRecord)">通过</el-button>
          </div>
        </div>
      </section>
    </el-dialog>

    <el-dialog v-model="approveVisible" title="通过订单" width="620px">
      <el-input v-model="approvalRemark" type="textarea" :rows="5" placeholder="备注" />
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="驳回订单" width="620px">
      <el-input v-model="rejectRemark" type="textarea" :rows="5" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.summary-card {
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: rgba(255, 255, 255, 0.9);
}

.summary-card p {
  margin: 0;
  color: #6f7a8f;
}

.summary-card strong {
  display: block;
  margin-top: 12px;
  font-size: 34px;
}

.toolbar-actions,
.detail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auto-approve {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #f6f8fc;
}

.source-pill {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: #eef4ff;
  color: #2558d8;
  font-size: 13px;
  font-weight: 600;
}

.filter-grid,
.form-grid,
.detail-grid {
  display: grid;
  gap: 12px;
}

.filter-grid {
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 26px 42px;
  align-items: end;
}

.filter-grid label,
.design-form-grid label {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-grid label span,
.design-form-grid label span {
  color: #9a9a9a;
  font-size: 20px;
  font-weight: 700;
}

.filter-actions {
  display: flex;
  gap: 18px;
}

.filter-grid :deep(.el-input),
.filter-grid :deep(.el-select),
.filter-grid :deep(.el-date-editor.el-input) {
  width: 100%;
  --el-input-height: 56px;
  font-size: 18px;
}

.filter-grid :deep(.el-select__wrapper) {
  min-height: 56px;
}

.filter-grid :deep(.el-button),
.filter-actions :deep(.el-button) {
  width: 100%;
  height: 56px;
}

.filter-card :deep(.page-block__body) {
  padding: 40px 54px;
}

.table-card :deep(.page-block__body) {
  padding: 38px 54px 46px;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 34px;
}

.table-meta {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  color: #77829a;
}

.filter-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.filter-tags__label {
  color: #627088;
  font-size: 13px;
  font-weight: 600;
}

.status-link {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.order-status-tag {
  font-weight: 600;
}

.order-status--pending-approval {
  color: #ff4d4f !important;
  border-color: #ffd6d9 !important;
  background: #fff1f0 !important;
}

.order-status--pending-production {
  color: #fa8c16 !important;
  border-color: #ffe1ba !important;
  background: #fff7e6 !important;
}

.order-status--producing {
  color: #9254de !important;
  border-color: #d3adf7 !important;
  background: #f9f0ff !important;
}

.order-status--pending-delivery {
  color: #1677ff !important;
  border-color: #bae0ff !important;
  background: #e6f4ff !important;
}

.order-status--delivering {
  color: #13a8a8 !important;
  border-color: #b5f5ec !important;
  background: #e6fffb !important;
}

.order-status--completed {
  color: #52c41a !important;
  border-color: #b7eb8f !important;
  background: #f6ffed !important;
}

.order-status--rejected {
  color: #f5222d !important;
  border-color: #ffa39e !important;
  background: #fff1f0 !important;
}

.order-status--outsourced {
  color: #8c8c8c !important;
  border-color: #d9d9d9 !important;
  background: #fafafa !important;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 16px;
}

.order-flow,
.order-detail-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

:deep(.order-form-dialog.el-dialog),
:deep(.order-detail-dialog.el-dialog) {
  width: min(1280px, calc(100vw - 88px)) !important;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.order-form-dialog .el-dialog__header),
:deep(.order-detail-dialog .el-dialog__header) {
  padding: 24px 36px 18px;
  margin: 0;
  border-bottom: 1px solid #eeeeee;
}

:deep(.order-form-dialog .el-dialog__title),
:deep(.order-detail-dialog .el-dialog__title) {
  color: #111111;
  font-size: 24px;
  font-weight: 700;
}

:deep(.order-form-dialog .el-dialog__body),
:deep(.order-detail-dialog .el-dialog__body) {
  max-height: calc(92vh - 92px);
  padding: 26px 42px 0;
  overflow: auto;
  background: #f5f5f5;
}

:deep(.order-form-dialog) .order-flow,
:deep(.order-detail-dialog) .order-detail-page {
  gap: 16px;
}

.step-card :deep(.page-block__body) {
  padding: 104px 220px 100px;
}

:deep(.order-form-dialog) .step-card :deep(.page-block__body) {
  padding: 34px 86px 38px;
}

.steps-line {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.steps-line--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: 980px;
}

.steps-line::before {
  position: absolute;
  top: 25px;
  left: 12.5%;
  right: 12.5%;
  height: 2px;
  background: #bdbdbd;
  content: "";
}

.steps-line--four::before {
  left: 10%;
  right: 10%;
}

.step-node {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 16px;
  color: #b7b7b7;
  font-size: 20px;
  font-weight: 700;
}

.step-node span {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border: 4px solid #b7b7b7;
  border-radius: 50%;
  background: #fff;
  color: currentColor;
}

.step-node strong {
  min-height: 28px;
  white-space: nowrap;
}

.step-node.active {
  color: #1764ff;
}

.step-node.active span {
  border-color: #1764ff;
}

.step-node.done {
  color: #5abc3c;
}

.step-node.done span {
  border-color: #5abc3c;
}

.form-panel {
  min-height: 560px;
}

.form-panel h3 {
  margin: 0 0 40px;
  font-size: 30px;
  line-height: 1.2;
}

.outsource-search {
  display: grid;
  grid-template-columns: 280px 280px 1fr;
  gap: 28px;
  align-items: end;
  margin-bottom: 22px;
}

.outsource-search label {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #8b8b8b;
  font-size: 16px;
  font-weight: 700;
}

.outsource-search :deep(.el-input) {
  --el-input-height: 40px;
}

.outsource-search__actions {
  display: flex;
  justify-content: flex-end;
  gap: 18px;
}

.outsource-search__actions :deep(.el-button) {
  min-width: 104px;
  height: 40px;
}

.outsource-table {
  min-height: 360px;
}

.outsource-table :deep(.el-radio__label) {
  display: none;
}

.design-form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px 80px;
}

.design-form-grid label span em {
  color: #ff3b30;
  font-style: normal;
  margin-right: 2px;
}

.design-form-grid :deep(.el-input),
.design-form-grid :deep(.el-select),
.design-form-grid :deep(.el-date-editor.el-input) {
  width: 100%;
  --el-input-height: 56px;
  font-size: 18px;
}

.design-form-grid :deep(.el-select__wrapper) {
  min-height: 56px;
}

.flow-add-button {
  min-width: 224px;
  height: 90px;
  margin-bottom: 36px;
  font-size: 32px;
}

.design-table {
  width: 100%;
}

.design-table :deep(.el-table__row:has(.el-input)) {
  background: #edf3ff;
}

.design-table :deep(.el-input__wrapper) {
  min-height: 40px;
  border-radius: 0;
  background: #f5f6f8;
  box-shadow: none;
}

.table-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.table-actions button {
  padding: 0;
  border: 0;
  color: #1267ff;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
}

.design-table :deep(.el-table__header th) {
  background: #f0f1f3;
}

.sticky-total {
  position: sticky;
  bottom: 0;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  min-height: 126px;
  margin: 0 -36px -28px;
  padding: 24px 48px;
  background: #ffffff;
  border-top: 1px solid #efefef;
}

:deep(.order-form-dialog) .sticky-total {
  position: sticky;
  bottom: 0;
  margin: 0 -42px;
  min-height: 96px;
  padding: 18px 42px;
}

.sticky-total strong {
  font-size: 32px;
}

.sticky-total strong span {
  color: #ff9200;
}

.sticky-total > div {
  display: flex;
  gap: 26px;
}

.sticky-total :deep(.el-button) {
  min-width: 170px;
  height: 72px;
  font-size: 26px;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-grid div {
  padding: 0;
  border-radius: 0;
  background: transparent;
}

.detail-grid span {
  color: #9a9a9a;
  font-size: 24px;
  font-weight: 700;
}

.detail-grid strong {
  color: #111;
  font-size: 24px;
}

.design-detail-grid {
  gap: 34px 120px;
  padding: 22px 0 12px;
}

.full-span {
  grid-column: 1 / -1;
}

.status-banner {
  margin-bottom: 0;
  padding: 34px;
  border-radius: 6px;
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
}

.timeline-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #e6ebf5;
  margin-bottom: 10px;
}

.timeline-card p,
.timeline-card strong,
.timeline-card span {
  display: block;
}

.timeline-card p {
  margin: 0 0 8px;
  color: #97a0b2;
}

.detail-footer {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.detail-total {
  font-size: 22px;
  font-weight: 700;
  color: #d48806;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 36px;
}

@media (max-width: 1200px) {
  .summary-grid,
  .filter-grid,
  .form-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-footer,
  .toolbar-actions,
  .sticky-total {
    flex-wrap: wrap;
  }

  .step-card :deep(.page-block__body) {
    padding: 54px 28px;
  }
}
</style>
