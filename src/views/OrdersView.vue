<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Printer, Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import {
  addTenantOrderError,
  addTenantOrder,
  approveTenantOrder,
  changeTenantOrderAutoApprove,
  completeTenantOrderProduction,
  deleteTenantOrder,
  editTenantOrder,
  addTenantExternalTenant,
  deleteTenantExternalTenant,
  editTenantExternalTenant,
  getTenantExternalTenantList,
  getTenantDeliveryPrintUrl,
  getTenantOrderAutoApprove,
  getTenantCraftList,
  getTenantOrderConsumables,
  getTenantOrderDetail,
  getTenantOrderEditInfo,
  getTenantOrderHandKept,
  getTenantOrderList,
  getTenantOrderPrintUrl,
  getTenantOrderProcess,
  getTenantOrderErrorInfo,
  outsourceTenantOrder,
  returnTenantOrder,
  getTenantClientUsers,
  searchTenantClients,
  getTenantOutsourceTenants,
  searchTenantCrafts,
  uploadTenantFile
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
  orderTimeRange: []
})

const autoApprove = ref(true)
const autoApproveLoading = ref(false)
const loading = ref(false)
const saving = ref(false)
const detailLoading = ref(false)
const clientSearching = ref(false)
const allClientOptions = ref([])
const clientOptions = ref([])
const lastClientKeyword = ref(null)
let clientSearchPromise = null
const outsourceLoading = ref(false)
const outsourceOptions = ref([])
const externalTenantVisible = ref(false)
const externalTenantFormVisible = ref(false)
const externalTenantLoading = ref(false)
const externalTenantSaving = ref(false)
const externalTenantRows = ref([])
const externalTenantTotal = ref(0)
const craftSearching = ref(false)
const craftOptions = ref([])
const lastCraftKeyword = ref(null)
let craftSearchPromise = null
const detailVisible = ref(false)
const routeDetailToken = ref('')
const orderFormVisible = ref(false)
const approveVisible = ref(false)
const rejectVisible = ref(false)
const manualCompleteVisible = ref(false)
const manualCompleteSaving = ref(false)
const errorVisible = ref(false)
const errorSaving = ref(false)
const errorDetailVisible = ref(false)
const errorDetailLoading = ref(false)
const errorDetail = ref(null)
const currentRecord = ref(null)
const approvalRemark = ref('')
const rejectRemark = ref('')
const manualCompleteTarget = ref(null)
const errorTarget = ref(null)
const userOptions = ref([])
const viewMode = ref(route.query.mode === 'detail' ? 'detail' : 'list')
const activeProductKey = ref('')
const formMode = ref('create')
const sourceOrderId = ref(null)
const outsourceFilters = reactive({
  memberId: '',
  memberName: ''
})
const externalTenantFilters = reactive({
  pageNum: 1,
  pageSize: 10,
  tenantName: ''
})
const externalTenantForm = reactive({
  id: '',
  tenantName: '',
  userName: ''
})
const manualCompleteForm = reactive({
  completeRemark: '',
  completeImgRemark: '',
  completeImgRemarkUrl: ''
})
const errorForm = reactive({
  tenantUserId: '',
  remark: ''
})
const foilingPointVisible = ref(false)
const foilingPointTarget = ref(null)
const foilingPointForm = reactive({
  foilingPointPrice: '',
  foilingSheetPrice: '',
  points: ['']
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
  printCode: '',
  remark: ''
})

let localRowSeq = 0
const createLocalRowKey = () => `row-${Date.now()}-${localRowSeq += 1}`
const ensureProductRowKey = (row = {}) => {
  if (!row._rowKey) row._rowKey = row.id || row.productId || createLocalRowKey()
  return String(row._rowKey)
}

const statusMap = {
  1: { label: '待审批', type: 'danger', tone: 'pending-approval' },
  2: { label: '待生产', type: 'warning', tone: 'pending-production' },
  3: { label: '生产中', type: 'warning', tone: 'producing' },
  4: { label: '待配送', type: 'primary', tone: 'pending-delivery' },
  5: { label: '配送中', type: 'primary', tone: 'delivering' },
  6: { label: '已完成', type: 'success', tone: 'completed' },
  7: { label: '已驳回', type: 'danger', tone: 'rejected' },
  8: { label: '差错单', type: 'danger', tone: 'error' }
}
const statusOptions = computed(() =>
  Object.entries(statusMap)
    .map(([value, item]) => ({ value: Number(value), ...item }))
)
const deliveryTypeOptions = [
  { label: '自提', value: 1 },
  { label: '发货', value: 2 },
  { label: '送货', value: 3 },
  { label: '客运', value: 4 }
]
const singleDoubleOptions = [
  { label: '单面', value: 1 },
  { label: '双面自翻', value: 2 },
  { label: '双面天地翻', value: 3 },
  { label: '双面扣板', value: 4 }
]
const deliveryTypeText = (value) =>
  deliveryTypeOptions.find((item) => String(item.value) === String(value))?.label || value || ''
const singleDoubleText = (value) =>
  singleDoubleOptions.find((item) => String(item.value) === String(value))?.label || ''
const statusToneClass = (status) => `order-status--${statusMap[status]?.tone || 'outsourced'}`
const craftStatusText = (value) => (Number(value) === 2 ? '已完成' : '待生产')
const craftStatusClass = (value) => (Number(value) === 2 ? 'craft-status-success' : 'craft-status-warning')
const orderSourceText = (value) => (Number(value) === 2 ? '外协' : '本厂')
const orderSourceClass = (value) => (Number(value) === 2 ? 'order-source-outsourced' : 'order-source-local')
const shouldShowManualComplete = (row = {}) => Number(row.manual) === 1 && Number(row.craftStatus) === 1
const normalizeUserOption = (row = {}) => ({
  id: row.id || row.userId || row.tenantUserId,
  name: row.name || row.userName || row.tenantUserName || row.nickName || ''
})
const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const boolFromApi = (value) => value === true || value === 1 || value === '1' || value === '启用'

const productInfoText = (item = {}) => {
  const products = item.products || item.productList || []
  if (Array.isArray(products) && products.length) {
    return productInfoLines(item).join('\n') || '--'
  }
  if (item.productInfo) return item.productInfo
  return item.productName || item.vipName || '--'
}

const productLineText = (product = {}) => {
  const name = product.productName || product.name || product.productInfo || ''
  const spec = product.trimmedSize || product.finishedSpec || product.specification || ''
  const quantity = product.orderQuantity ?? product.quantity ?? product.num ?? ''
  const unit = product.unit || ''
  const money = product.money ?? product.amount ?? product.totalMoney ?? ''
  const specText = spec ? `${spec}-` : ''
  const quantityText = quantity !== '' ? `${quantity}${unit}` : ''
  const moneyText = money !== '' && money !== null && money !== undefined ? `，${Number(money || 0).toLocaleString('zh-CN')}元` : ''
  return `${name}${specText}${quantityText}${moneyText}` || '--'
}

const productInfoLines = (item = {}) => {
  const products = item.products || item.productList || []
  if (Array.isArray(products) && products.length) {
    const lines = products
      .map(productLineText)
      .filter(Boolean)
    if (lines.length) return lines
  }
  return [item.productInfo || item.productName || item.vipName || '--']
}

const fillClientInfo = (client = {}) => {
  formState.cooperativeClientId = client.id || ''
  formState.companyName = client.companyName || ''
  formState.linkman = client.linkman || ''
  formState.phone = client.phone || ''
  formState.companyAddress = client.companyAddress || ''
}

const clientOptionId = (item = {}) =>
  item.id ?? item.cooperativeClientId ?? item.clientId ?? item.customerId ?? item.companyId ?? item.unitId ?? item.companyName

const orderClientId = (item = {}) =>
  item.cooperativeClientId ?? item.clientId ?? item.customerId ?? item.companyId ?? item.unitId ?? item.companyName

const clientOptionName = (item = {}) =>
  item.companyName
  || item.cooperativeClientName
  || item.clientName
  || item.customerName
  || item.unitName
  || item.tenantName
  || item.memberName
  || item.name
  || ''

const normalizeClientOptions = (data) => {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : data?.records || data?.list || data?.data?.records || data?.data?.list || []
  const normalizedList = list
    .map((item) => ({
      ...item,
      id: clientOptionId(item),
      companyName: clientOptionName(item),
      companyNamePinyin: item.companyNamePinyin || item.pinyin || ''
    }))
    .filter((item) => item.companyName)
  const selected = formState.cooperativeClientId
    ? normalizedList.find((item) => String(item.id) === String(formState.cooperativeClientId))
      || allClientOptions.value.find((item) => String(item.id) === String(formState.cooperativeClientId))
    : null
  return selected
    ? [selected, ...normalizedList.filter((item) => String(item.id) !== String(selected.id))]
    : normalizedList
}

const clientMatchesKeyword = (client = {}, keyword = '') => {
  const companyName = String(keyword || '').trim()
  if (!companyName) return true
  const lowerKeyword = companyName.toLowerCase()
  return [client.companyName, client.companyNamePinyin]
    .some((value) => String(value || '').toLowerCase().includes(lowerKeyword))
}

const filterClientOptions = (keyword = '') =>
  allClientOptions.value
    .filter((item) => clientMatchesKeyword(item, keyword))
    .slice(0, 50)

const searchClients = (keyword = '') => {
  const companyName = String(keyword || '').trim()
  lastClientKeyword.value = companyName
  clientOptions.value = filterClientOptions(companyName)
}

const loadClientOptions = async () => {
  if (clientSearching.value) return clientSearchPromise
  clientSearching.value = true
  const request = searchTenantClients({ companyName: '' })
  clientSearchPromise = request
  try {
    const data = await request
    allClientOptions.value = normalizeClientOptions(data)
    searchClients(lastClientKeyword.value || '')
  } catch (error) {
    ElMessage.error(error?.message || '单位列表加载失败')
  } finally {
    if (clientSearchPromise === request) {
      clientSearching.value = false
      clientSearchPromise = null
    }
  }
}

const selectClient = (id) => {
  const client = allClientOptions.value.find((item) => String(item.id) === String(id))
    || clientOptions.value.find((item) => String(item.id) === String(id))
  if (client) fillClientInfo(client)
}

const seedClientOption = (record = {}) => {
  const companyName = clientOptionName(record)
  if (!companyName) return
  const id = orderClientId(record) || companyName
  formState.cooperativeClientId = id
  formState.companyName = companyName
  formState.linkman = record.linkman || ''
  formState.phone = record.phone || ''
  formState.companyAddress = record.companyAddress || ''
  const option = {
    id,
    companyName,
    companyNamePinyin: record.companyNamePinyin || '',
    linkman: formState.linkman,
    phone: formState.phone,
    companyAddress: formState.companyAddress
  }
  if (!allClientOptions.value.some((item) => String(item.id) === String(id))) {
    allClientOptions.value.push(option)
  }
  if (!clientOptions.value.some((item) => String(item.id) === String(id))) {
    clientOptions.value.unshift(option)
  }
}

const handleClientDropdownVisible = (visible) => {
  if (!visible) return
  if (!allClientOptions.value.length) {
    loadClientOptions()
  } else {
    searchClients('')
  }
}

const loadUserOptions = async (keyword = '') => {
  try {
    const data = await getTenantClientUsers({ name: keyword || undefined })
    userOptions.value = listRows(data)
      .map(normalizeUserOption)
      .filter((item) => item.id && item.name)
  } catch (error) {
    userOptions.value = []
    ElMessage.error(error?.message || '人员列表加载失败')
  }
}

const normalizeOutsourceOptions = (data) => {
  const list = Array.isArray(data) ? data : data?.records || data?.list || []
  return list
    .map((item) => ({
      ...item,
      memberId: item.memberId || item.id || item.customerId || item.companyCode || '',
      memberName: item.memberName || item.tenantName || item.companyName || item.name || '',
      tenantName: item.tenantName || item.memberName || item.companyName || item.name || '',
      contact: item.contact || item.linkman || item.userName || ''
    }))
}

const normalizeExternalTenantRows = (data = {}) => {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : data.records || data.list || data.rows || data.data?.records || data.data?.list || []
  return list.map((item) => ({
    ...item,
    id: item.id || item.tenantId || item.memberId,
    tenantName: item.tenantName || item.memberName || item.companyName || item.name || '',
    userName: item.userName || item.linkman || item.contact || ''
  }))
}

const externalTenantListTotal = (data = {}, rows = []) => {
  if (Array.isArray(data)) return rows.length
  return Number(data.total ?? data.data?.total ?? rows.length) || 0
}

const loadOutsourceUnits = async () => {
  outsourceLoading.value = true
  try {
    const data = await getTenantOutsourceTenants({
      tenantName: outsourceFilters.memberName || undefined,
    })
    outsourceOptions.value = normalizeOutsourceOptions(data)
  } catch (error) {
    ElMessage.error(error?.message || '外协单位加载失败')
  } finally {
    outsourceLoading.value = false
  }
}

const loadExternalTenants = async () => {
  externalTenantLoading.value = true
  try {
    const data = await getTenantExternalTenantList({
      pageNum: externalTenantFilters.pageNum,
      pageSize: externalTenantFilters.pageSize,
      tenantName: externalTenantFilters.tenantName || undefined
    })
    const rows = normalizeExternalTenantRows(data)
    externalTenantRows.value = rows
    externalTenantTotal.value = externalTenantListTotal(data, rows)
  } catch (error) {
    externalTenantRows.value = []
    externalTenantTotal.value = 0
    ElMessage.error(error?.message || '非本系统会员加载失败')
  } finally {
    externalTenantLoading.value = false
  }
}

const openExternalTenantDialog = () => {
  externalTenantVisible.value = true
  externalTenantFilters.pageNum = 1
  loadExternalTenants()
}

const searchExternalTenants = () => {
  externalTenantFilters.pageNum = 1
  loadExternalTenants()
}

const resetExternalTenantFilters = () => {
  externalTenantFilters.pageNum = 1
  externalTenantFilters.pageSize = 10
  externalTenantFilters.tenantName = ''
  loadExternalTenants()
}

const resetExternalTenantForm = () => {
  externalTenantForm.id = ''
  externalTenantForm.tenantName = ''
  externalTenantForm.userName = ''
}

const openExternalTenantCreate = () => {
  resetExternalTenantForm()
  externalTenantFormVisible.value = true
}

const openExternalTenantEdit = (row = {}) => {
  externalTenantForm.id = row.id || ''
  externalTenantForm.tenantName = row.tenantName || ''
  externalTenantForm.userName = row.userName || ''
  externalTenantFormVisible.value = true
}

const saveExternalTenant = async () => {
  if (!externalTenantForm.tenantName) return ElMessage.warning('请输入会员名称')
  externalTenantSaving.value = true
  try {
    const payload = {
      id: externalTenantForm.id || undefined,
      tenantName: externalTenantForm.tenantName,
      userName: externalTenantForm.userName
    }
    if (externalTenantForm.id) {
      await editTenantExternalTenant(payload)
    } else {
      await addTenantExternalTenant(payload)
    }
    externalTenantFormVisible.value = false
    ElMessage.success(externalTenantForm.id ? '编辑成功' : '新增成功')
    loadExternalTenants()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    externalTenantSaving.value = false
  }
}

const removeExternalTenant = async (row = {}) => {
  try {
    await ElMessageBox.confirm(`确认删除 ${row.tenantName || '该会员'} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantExternalTenant(row.id)
    ElMessage.success('删除成功')
    loadExternalTenants()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
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

const selectExternalTenant = (row = {}) => {
  formState.outsourceSupplierId = row.id || ''
  formState.outsourceSupplierName = row.tenantName || ''
  formState.outsourceSupplierContact = row.userName || ''
  externalTenantVisible.value = false
}

const craftOptionId = (item = {}) =>
  item.id ?? item.craftId ?? item.craftIdList ?? item.processId ?? item.technologyId ?? item.craftName ?? item.name

const craftRowCraftId = (item = {}) =>
  item.craftId ?? item.craftIdList ?? item.processId ?? item.technologyId ?? item.id

const craftOptionName = (item = {}) =>
  item.craftName
  || item.name
  || item.craft
  || item.processName
  || item.technologyName
  || item.craftTitle
  || item.craftTypeName
  || ''

const normalizeCraftOptions = (data) => {
  const list = Array.isArray(data) ? data : data?.records || data?.list || []
  return list.map((item) => ({
    ...item,
    id: craftOptionId(item),
    craftName: craftOptionName(item)
  }))
}

const seedCraftOptions = (crafts = []) => {
  const current = Array.isArray(craftOptions.value) ? [...craftOptions.value] : []
  ;(crafts || []).forEach((item) => {
    const id = craftRowCraftId(item)
    const craftName = craftOptionName(item)
    if (id === '' || id === null || id === undefined || !craftName) return
    if (!current.some((option) => String(option.id) === String(id))) {
      current.push({ ...item, id, craftName })
    }
  })
  craftOptions.value = current
}

const hydrateCraftNames = (crafts = []) => {
  ;(crafts || []).forEach((item) => {
    const id = craftRowCraftId(item)
    const option = craftOptions.value.find((craft) => String(craft.id) === String(id))
    if (option?.craftName) item.craftName = option.craftName
  })
}

const searchCrafts = async (keyword = '') => {
  const craftName = String(keyword || '').trim()
  if (craftSearching.value && lastCraftKeyword.value === craftName) return craftSearchPromise
  if (!craftName && lastCraftKeyword.value === '' && craftOptions.value.length) return
  lastCraftKeyword.value = craftName
  craftSearching.value = true
  const request = searchTenantCrafts({
    name: craftName || undefined
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
          date: item.orderTime || item.createTime || '',
          title: '创建订单',
          desc: `${item.fillUserName || item.userName || '系统'} 提交订单`
        }
      ]

  return {
    ...item,
    deliveryType: item.deliveryType || '',
    companyAddress: item.companyAddress || '',
    linkman: item.linkman || '',
    phone: item.phone || '',
    deliveryDate: item.deliveryDate || item.orderTime || item.createTime || '',
    printingRequirements: item.printingRequirements || '',
    productInfo: productInfoText(item),
    companyName: item.companyName || '',
    fillUserName: item.fillUserName || item.userName || '',
    orderTime: item.orderTime || item.createTime || '',
    totalMoney: item.totalMoney ?? item.payMoney ?? 0,
    payMoney: item.totalMoney ?? item.payMoney ?? 0,
    orderSource: item.orderSource ?? 1,
    status: Number(item.status ?? 1),
    printCode: item.printCode || '',
    remark: item.remark || '',
    products,
    crafts,
    timeline
  }
}

const normalizeProductRow = (item = {}) => ({
    ...item,
    _rowKey: item._rowKey || item.productKey || item.id || item.productId || createLocalRowKey(),
    productName: item.productName || item.name || item.productInfo || '',
    finishedSpec: item.finishedSpec || item.trimmedSize || item.specification || item.trimmedSize || '',
    quantity: item.quantity ?? item.orderQuantity ?? 0,
    unit: item.unit || '',
    amount: item.amount ?? item.money ?? 0
})

const normalizeCraftRow = (item = {}, product = {}) => ({
    ...item,
    productId: item.productId || product.id || undefined,
    productName: item.productName || product.productName || product.name || item.productInfo || '',
    craftId: craftRowCraftId(item) || '',
    craftName: craftOptionName(item),
    spec: item.spec || item.specification || '',
    openNum: item.openNum ?? item.formatSize ?? '',
    numberPerBoard: item.numberPerBoard ?? '',
    singleDouble: item.singleDouble ?? '',
    spotColors: item.spotColors || '',
    colour: item.colour || item.color || '',
    formula: item.formula || '',
    startPrice: item.startPrice ?? item.priceBase ?? 0,
    priceBase: item.priceBase ?? 0,
    foilingStartingPrice: item.foilingStartingPrice ?? null,
    foilingPointPrice: item.foilingPointPrice ?? null,
    foilingSheetPrice: item.foilingSheetPrice ?? null,
    foilingPointList: (item.foilingPointList || item.foilingPoints || item.foilingPointPrice || item.foilingSheetPrice || item.foilingStartingPrice)
      ? normalizeFoilingPointList(item.foilingPointList ?? item.foilingPoints, item.formula)
      : [],
    finishNum: item.finishNum ?? item.orderQuantity ?? 0,
    unit: item.unit || '',
    price: item.price ?? item.unitPrice ?? 0,
    customerAmount: item.customerAmount ?? item.customerMoney ?? null,
    remark: item.remark || '',
    craftStatus: item.craftStatus ?? item.status ?? 1,
    operator: item.operator || item.createUserName || item.tenantUserName || '-',
    orderSource: item.orderSource ?? product.orderSource ?? 1,
    manual: item.manual ?? product.manual ?? 0,
    outsourceChecked: Boolean(item.outsourceChecked || item.outTenantId),
    outTenantId: item.outTenantId || ''
})

const nestedCraftRows = (products = []) =>
  products.flatMap((product) => {
    const crafts = product.craftList || product.crafts || []
    return Array.isArray(crafts) ? crafts.map((craft) => normalizeCraftRow(craft, product)) : []
  })

const consumableTypeLabels = {
  1: '系统入库',
  2: '手工出库',
  3: '订单消耗'
}

const consumableTypeText = (value) => consumableTypeLabels[Number(value)] || value || ''

const normalizeConsumableRecord = (item = {}) => ({
  id: item.id || `${item.consumableName || item.name}-${item.createTime || item.num}`,
  name: item.consumableName || item.name || '',
  type: consumableTypeText(item.type),
  num: item.num ?? item.quantity ?? 0,
  remark: item.remark || '',
  operator: item.createUserName || item.operator || item.tenantUserName || '',
  time: item.createTime || item.updateTime || ''
})

const normalizeHandKeptRecord = (item = {}) => ({
  id: item.id || `${item.consumableName || item.name}-${item.createTime || item.num}`,
  name: item.consumableName || item.name || '',
  num: item.num ?? item.quantity ?? 0,
  remark: item.remark || '',
  operator: item.createUserName || item.operator || item.tenantUserName || '',
  time: item.createTime || item.updateTime || ''
})

const normalizeDetailRow = (detail = {}, base = {}, processList = []) => {
  const rawProducts = detail.productList || detail.products || []
  const products = rawProducts.map(normalizeProductRow)
  const rawCrafts = detail.craftList || detail.crafts || []
  const craftFallback = {
    orderSource: detail.orderSource ?? base.orderSource,
    manual: detail.manual ?? base.manual
  }
  const crafts = rawCrafts.length ? rawCrafts.map((item) => normalizeCraftRow(item, craftFallback)) : nestedCraftRows(rawProducts)
  const timeline = (processList || []).map((item) => ({
    date: item.createTime || '',
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
    { key: 'orderTimeRange', label: '订单时间', value: filters.orderTimeRange?.join(' 至 ') }
  ].filter((item) => item.value !== '' && item.value !== null && item.value !== undefined)
)
const localCards = computed(() => [
  { label: '当前页订单', value: rows.value.length },
  { label: '已完成', value: rows.value.filter((item) => item.status === 6).length },
  { label: '已驳回', value: rows.value.filter((item) => item.status === 7).length }
])
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
    .filter((item) => item.productName)
    .map((item, index) => ({
      ...item,
      _rowKey: ensureProductRowKey(item),
      optionId: item.id || `${item.productName}-${index}`
    }))
)
const activeProductRow = computed(() => {
  if (!productRows.value.length) return null
  return productRows.value.find((item) => ensureProductRowKey(item) === activeProductKey.value) || productRows.value[0]
})
const zeroIfEmpty = (value) => (value === '' || value === null || value === undefined ? 0 : value)
const toFixed4Number = (value) => Number(Number(value || 0).toFixed(4))
const formulaValue = (formula = '') => {
  const text = String(formula || '').trim()
  if (!text) return null
  if (!/^[\d\s.+\-*/()]+$/.test(text)) return null
  try {
    const result = Function(`"use strict"; return (${text})`)()
    return Number.isFinite(Number(result)) ? Number(result) : null
  } catch {
    return null
  }
}
const stripOuterParentheses = (text = '') => {
  let value = String(text || '').trim()
  let changed = true
  while (changed && value.startsWith('(') && value.endsWith(')')) {
    changed = false
    let depth = 0
    let wraps = true
    for (let index = 0; index < value.length; index += 1) {
      const char = value[index]
      if (char === '(') depth += 1
      if (char === ')') depth -= 1
      if (depth === 0 && index < value.length - 1) {
        wraps = false
        break
      }
      if (depth < 0) {
        wraps = false
        break
      }
    }
    if (wraps) {
      value = value.slice(1, -1).trim()
      changed = true
    }
  }
  return value
}
const splitFoilingFormulaPoints = (formula = '') => {
  const text = stripOuterParentheses(formula)
  if (!text) return []
  const points = []
  let depth = 0
  let start = 0
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === '+' && depth === 0) {
      points.push(stripOuterParentheses(text.slice(start, index)))
      start = index + 1
    }
  }
  points.push(stripOuterParentheses(text.slice(start)))
  return points.map((item) => item.trim()).filter(Boolean)
}
const normalizeFoilingPointList = (value, formula = '') => {
  let points = []
  if (Array.isArray(value)) {
    points = value
      .map((item) => String((item?.formula ?? item?.value ?? item) || '').trim())
      .filter(Boolean)
  } else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      points = Array.isArray(parsed)
        ? parsed.map((item) => String((item?.formula ?? item?.value ?? item) || '').trim()).filter(Boolean)
        : []
    } catch {
      points = splitFoilingFormulaPoints(value)
    }
  }
  if (!points.length) points = splitFoilingFormulaPoints(formula)
  return points.map((item) => ({ formula: item }))
}
const formatFoilingFormula = (points = []) => {
  const formulas = normalizeFoilingPointList(points).map((item) => item.formula).filter(Boolean)
  if (!formulas.length) return ''
  return `(${formulas.map((item) => `(${item})`).join(' + ')})`
}
const hasFoilingStartingPrice = (row = {}) =>
  Number(row.foilingPointPrice || 0) > 0
  || Number(row.foilingSheetPrice || 0) > 0
  || Number(row.foilingStartingPrice || 0) > 0
const hasExplicitFoilingPointList = (row = {}) =>
  (Array.isArray(row.foilingPointList) && row.foilingPointList.length > 0)
  || (typeof row.foilingPointList === 'string' && row.foilingPointList.trim())
const isFoilingCraft = (row = {}) =>
  hasFoilingStartingPrice(row)
  || hasExplicitFoilingPointList(row)
const syncFoilingFormula = (row = {}) => {
  if (!isFoilingCraft(row)) return
  row.foilingPointList = normalizeFoilingPointList(row.foilingPointList, row.formula)
  row.formula = formatFoilingFormula(row.foilingPointList)
}
const openFoilingPointDialog = (row) => {
  foilingPointTarget.value = row
  const points = normalizeFoilingPointList(row.foilingPointList, row.formula)
  foilingPointForm.foilingPointPrice = row.foilingPointPrice ?? row.foilingStartingPrice ?? ''
  foilingPointForm.foilingSheetPrice = row.foilingSheetPrice ?? row.foilingStartingPrice ?? ''
  foilingPointForm.points = points.length ? points.map((item) => item.formula) : ['']
  foilingPointVisible.value = true
}
const addFoilingPoint = () => {
  foilingPointForm.points.push('')
}
const removeFoilingPoint = (index) => {
  if (foilingPointForm.points.length <= 1) {
    foilingPointForm.points = ['']
    return
  }
  foilingPointForm.points.splice(index, 1)
}
const saveFoilingPointDialog = () => {
  const points = foilingPointForm.points.map((item) => String(item || '').trim()).filter(Boolean)
  if (!points.length) {
    ElMessage.warning('请至少填写一个烫金点位')
    return
  }
  if (points.some((item) => formulaValue(item) === null)) {
    ElMessage.warning('点位只能填写数字、括号和四则运算符')
    return
  }
  const row = foilingPointTarget.value
  if (!row) return
  row.foilingPointPrice = foilingPointForm.foilingPointPrice === '' ? null : Number(foilingPointForm.foilingPointPrice)
  row.foilingSheetPrice = foilingPointForm.foilingSheetPrice === '' ? null : Number(foilingPointForm.foilingSheetPrice)
  row.foilingPointList = points.map((item) => ({ formula: item }))
  row.formula = formatFoilingFormula(row.foilingPointList)
  row.customerAmount = computedCraftCustomerAmount(row)
  syncAllProductAmounts()
  foilingPointVisible.value = false
}
const computedCraftCustomerAmount = (craft = {}) => {
  const rawFinishNum = Number(zeroIfEmpty(craft.finishNum ?? craft.orderQuantity))
  if (!rawFinishNum) return 0

  const type = Number(craft.singleDouble || 1)
  let finishNum = rawFinishNum
  let price = Number(zeroIfEmpty(craft.price ?? craft.unitPrice))
  let startPrice = Number(zeroIfEmpty(craft.startPrice ?? craft.basePrice))
  const priceBase = Number(zeroIfEmpty(craft.priceBase))

  if (type === 2 || type === 3) {
    finishNum *= 2
  }
  if (type === 4) {
    price *= 2
    startPrice *= 2
  }

  if (isFoilingCraft(craft)) {
    const points = normalizeFoilingPointList(craft.foilingPointList, craft.formula)
    if (points.length) {
      const pointStartPrice = Number(zeroIfEmpty(craft.foilingPointPrice ?? craft.foilingStartingPrice))
      const sheetStartPrice = Number(zeroIfEmpty(craft.foilingSheetPrice ?? craft.foilingStartingPrice))
      const pointTotal = points.reduce((sum, point) => {
        const pointValue = formulaValue(point.formula)
        if (pointValue === null) return sum
        return sum + Math.max(pointValue * price, pointStartPrice)
      }, 0)
      return toFixed4Number(Math.max(pointTotal, sheetStartPrice) * finishNum)
    }
  }

  const formula = formulaValue(craft.formula)
  if (formula !== null) {
    return toFixed4Number(formula * finishNum * price)
  }

  if (priceBase === 0) {
    return toFixed4Number(Math.max(finishNum * price, startPrice))
  }
  return toFixed4Number(((finishNum - priceBase) * price) + startPrice)
}
const hasStoredCraftAmount = (craft = {}) =>
  craft.customerAmount !== '' && craft.customerAmount !== null && craft.customerAmount !== undefined
  || craft.customerMoney !== '' && craft.customerMoney !== null && craft.customerMoney !== undefined
const storedCraftAmount = (craft = {}) => Number(zeroIfEmpty(craft.customerAmount ?? craft.customerMoney))
const displayCraftCustomerAmount = (craft = {}) => {
  if (orderFormVisible.value) return computedCraftCustomerAmount(craft)
  if (!craft._isEditing && hasStoredCraftAmount(craft)) return storedCraftAmount(craft)
  return computedCraftCustomerAmount(craft)
}
const productCraftSourceRows = () => {
  if (orderFormVisible.value) return formState.craftList || []
  if (currentRecord.value?.crafts?.length) return currentRecord.value.crafts
  return []
}
const productMatchValues = (product = {}) =>
  [product._rowKey, product.id, product.productId, product.productName, product.name].map((value) => String(value || '')).filter(Boolean)
const craftMatchValues = (craft = {}) =>
  [craft._productRowKey, craft.productId, craft.productName, craft.name].map((value) => String(value || '')).filter(Boolean)
const isCraftOfProduct = (craft = {}, product = {}) => {
  const productValues = productMatchValues(product)
  if (!productValues.length) return false
  return craftMatchValues(craft).some((value) => productValues.includes(value))
}
const craftCustomerAmount = (craft = {}) => displayCraftCustomerAmount(craft)
const productCraftAmount = (product = {}) =>
  productCraftSourceRows()
    .filter((craft) => isCraftOfProduct(craft, product))
    .reduce((sum, craft) => sum + craftCustomerAmount(craft), 0)
const currentProductCraftRows = computed(() => {
  if (!orderFormVisible.value || !activeProductRow.value) return []
  return craftRows.value.filter((craft) => isCraftOfProduct(craft, activeProductRow.value))
})
const handleCraftTableWheel = (event) => {
  const root = event.currentTarget
  const scrollWrap = root?.querySelector('.el-scrollbar__wrap') || root?.querySelector('.el-table__body-wrapper')
  if (!scrollWrap) return
  const maxScrollLeft = scrollWrap.scrollWidth - scrollWrap.clientWidth
  if (maxScrollLeft <= 0) return
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  if (!delta) return
  const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, scrollWrap.scrollLeft + delta))
  if (nextScrollLeft === scrollWrap.scrollLeft) return
  event.preventDefault()
  scrollWrap.scrollLeft = nextScrollLeft
}
const selectProductRow = (row = {}) => {
  activeProductKey.value = ensureProductRowKey(row)
}
const productTableRowClassName = ({ row }) =>
  activeProductRow.value && ensureProductRowKey(row) === ensureProductRowKey(activeProductRow.value)
    ? 'is-active-product'
    : ''
const syncProductAmount = (product = {}) => {
  product.amount = productCraftAmount(product)
  product.money = product.amount
}
const syncAllProductAmounts = () => {
  productRows.value.forEach(syncProductAmount)
}
const productTotalAmount = computed(() => productRows.value.reduce((sum, row) => sum + productCraftAmount(row), 0))
const formOrderTotal = computed(() => productTotalAmount.value)
const addProductRow = () => {
  if (!Array.isArray(formState.productList)) formState.productList = []
  const row = {
    _rowKey: createLocalRowKey(),
    productName: '',
    finishedSpec: '',
    quantity: '',
    unit: '',
    amount: 0,
    _isEditing: true,
    _isNew: true
  }
  formState.productList.push(row)
  selectProductRow(row)
}
const saveProductRow = (row) => {
  if (!row.productName || !row.quantity) {
    ElMessage.warning('请填写产品名称和订货数量')
    return
  }
  row.quantity = Number(row.quantity)
  ensureProductRowKey(row)
  selectProductRow(row)
  syncProductAmount(row)
  row._isEditing = false
  row._isNew = false
}
const cancelProductRow = (row, index) => {
  if (row._isNew) {
    formState.productList.splice(index, 1)
    if (activeProductKey.value === row._rowKey) {
      activeProductKey.value = formState.productList[0] ? ensureProductRowKey(formState.productList[0]) : ''
    }
    return
  }
  row._isEditing = false
}
const editProductRow = (row) => {
  row._isEditing = true
  row._isNew = false
}
const removeProductRow = (index) => {
  const row = formState.productList[index]
  const rowKey = row ? ensureProductRowKey(row) : ''
  formState.productList.splice(index, 1)
  if (row) {
    formState.craftList = (formState.craftList || []).filter((craft) => !isCraftOfProduct(craft, row))
  }
  if (activeProductKey.value === rowKey) {
    activeProductKey.value = formState.productList[0] ? ensureProductRowKey(formState.productList[0]) : ''
  }
}
const cleanProductRow = (row = {}) => {
  const { _isEditing, _isNew, ...payload } = row
  payload.amount = productCraftAmount(row)
  payload.money = payload.amount
  return payload
}
const craftRows = computed(() => {
  if (orderFormVisible.value) return formState.craftList || []
  if (!orderFormVisible.value && currentRecord.value?.crafts?.length) return currentRecord.value.crafts
  return []
})
const addCraftRow = () => {
  const product = activeProductRow.value
  if (!product) {
    ElMessage.warning('请先选择产品')
    return
  }
  if (!product.productName) {
    ElMessage.warning('请先填写当前产品名称')
    return
  }
  if (!Array.isArray(formState.craftList)) formState.craftList = []
  formState.craftList.push({
    _productRowKey: ensureProductRowKey(product),
    productId: product.id || product.productId || '',
    productName: product.productName || product.name || '',
    craftId: '',
    craftName: '',
    spec: '',
    openNum: '',
    numberPerBoard: '',
    singleDouble: '',
    spotColors: '',
    colour: '',
    formula: '',
    startPrice: 0,
    priceBase: 0,
    foilingStartingPrice: null,
    foilingPointPrice: null,
    foilingSheetPrice: null,
    foilingPointList: [],
    finishNum: 0,
    unit: '',
    price: 0,
    customerAmount: 0,
    remark: '',
    outsourceChecked: formMode.value === 'outsource',
    outTenantId: formMode.value === 'outsource' ? formState.outsourceSupplierId : '',
    _isEditing: true,
    _isNew: true
  })
}
const selectCraftProduct = (row) => {
  const product = savedProductOptions.value.find((item) => item.productName === row.productName)
  if (!product) return
  row._productRowKey = ensureProductRowKey(product)
  row.productId = product.id || ''
}
const selectCraftName = async (row, id) => {
  const craft = craftOptions.value.find((item) => String(item.id) === String(id))
  if (!craft) return
  Object.assign(row, {
    spec: '',
    openNum: '',
    numberPerBoard: '',
    singleDouble: '',
    spotColors: '',
    colour: '',
    formula: '',
    startPrice: 0,
    priceBase: 0,
    foilingStartingPrice: null,
    foilingPointPrice: null,
    foilingSheetPrice: null,
    foilingPointList: [],
    finishNum: 0,
    unit: '',
    price: 0,
    customerAmount: 0,
    remark: ''
  })
  row.craftId = craft.id
  row.craftName = craft.craftName
  row.spec = craft.spec || craft.specification || craft.formatSize || ''
  row.openNum = craft.openNum ?? craft.openCount ?? craft.formatSize ?? ''
  row.numberPerBoard = craft.numberPerBoard ?? ''
  row.singleDouble = craft.singleDouble ?? ''
  row.spotColors = craft.spotColors ?? ''
  row.colour = craft.colour ?? craft.color ?? ''
  row.formula = craft.formula ?? ''
  row.startPrice = zeroIfEmpty(craft.startPrice ?? craft.priceBase ?? craft.basePrice)
  row.priceBase = zeroIfEmpty(craft.priceBase)
  row.foilingStartingPrice = craft.foilingStartingPrice ?? craft.foilStartingPrice ?? craft.gildingStartingPrice ?? null
  row.foilingPointPrice = craft.foilingPointPrice ?? craft.foilPointPrice ?? craft.pointStartPrice ?? row.foilingStartingPrice
  row.foilingSheetPrice = craft.foilingSheetPrice ?? craft.foilSheetPrice ?? craft.sheetStartPrice ?? row.foilingStartingPrice
  row.foilingPointList = normalizeFoilingPointList(craft.foilingPointList ?? craft.foilingPoints, row.formula)
  if (isFoilingCraft(row)) syncFoilingFormula(row)
  row.unit = craft.unit || ''
  row.price = zeroIfEmpty(craft.price ?? craft.unitPrice)
  row.remark = craft.remark || ''
  if (isFoilingCraft(row) && !row.foilingPointList.length) {
    openFoilingPointDialog(row)
  }
}
const saveCraftRow = (row) => {
  if (!row.productName || !row.craftName) {
    ElMessage.warning('请选择产品名称和工艺名称')
    return false
  }
  if (isFoilingCraft(row)) {
    syncFoilingFormula(row)
    if (!row.foilingPointList.length) {
      ElMessage.warning('请填写烫金点位')
      return false
    }
    if (row.foilingPointList.some((item) => formulaValue(item.formula) === null)) {
      ElMessage.warning('烫金点位只能填写数字、括号和四则运算符')
      return false
    }
  } else if (row.formula && formulaValue(row.formula) === null) {
    ElMessage.warning('公式只能填写数字、括号和四则运算符')
    return false
  }
  row.startPrice = zeroIfEmpty(row.startPrice)
  row.priceBase = zeroIfEmpty(row.priceBase)
  row.finishNum = zeroIfEmpty(row.finishNum)
  row.price = zeroIfEmpty(row.price)
  row.singleDouble = row.singleDouble || ''
  row.customerAmount = computedCraftCustomerAmount(row)
  syncAllProductAmounts()
  row._isEditing = false
  row._isNew = false
  return true
}
const cancelCraftRow = (row, index) => {
  if (row._isNew) {
    const realIndex = formState.craftList.indexOf(row)
    formState.craftList.splice(realIndex > -1 ? realIndex : index, 1)
    syncAllProductAmounts()
    return
  }
  row._isEditing = false
  syncAllProductAmounts()
}
const editCraftRow = (row) => {
  row._isEditing = true
  row._isNew = false
}
const removeCraftRow = (row, index) => {
  const realIndex = formState.craftList.indexOf(row)
  formState.craftList.splice(realIndex > -1 ? realIndex : index, 1)
  syncAllProductAmounts()
}
const cleanCraftRow = (row = {}) => {
  const { _isEditing, _isNew, ...payload } = row
  const customerAmount = displayCraftCustomerAmount(row)
  payload.startPrice = zeroIfEmpty(payload.startPrice)
  payload.priceBase = zeroIfEmpty(payload.priceBase ?? payload.startPrice)
  payload.foilingStartingPrice = payload.foilingStartingPrice === '' || payload.foilingStartingPrice === undefined
    ? null
    : payload.foilingStartingPrice
  payload.foilingPointPrice = payload.foilingPointPrice === '' || payload.foilingPointPrice === undefined
    ? null
    : payload.foilingPointPrice
  payload.foilingSheetPrice = payload.foilingSheetPrice === '' || payload.foilingSheetPrice === undefined
    ? null
    : payload.foilingSheetPrice
  payload.foilingPointList = isFoilingCraft(payload) ? normalizeFoilingPointList(payload.foilingPointList, payload.formula) : []
  if (payload.foilingPointList.length) payload.formula = formatFoilingFormula(payload.foilingPointList)
  payload.finishNum = zeroIfEmpty(payload.finishNum)
  payload.orderQuantity = zeroIfEmpty(payload.orderQuantity ?? payload.finishNum)
  payload.price = zeroIfEmpty(payload.price)
  payload.unitPrice = zeroIfEmpty(payload.unitPrice ?? payload.price)
  payload.customerAmount = customerAmount
  payload.customerMoney = customerAmount
  return payload
}
const normalizeOrderProductPayload = (product = {}) => ({
  id: product.id || undefined,
  name: product.name || product.productName,
  productName: product.productName || product.name,
  orderQuantity: product.orderQuantity ?? product.quantity ?? product.num,
  quantity: product.quantity ?? product.orderQuantity ?? product.num,
  trimmedSize: product.trimmedSize || product.finishedSpec,
  finishedSpec: product.finishedSpec || product.trimmedSize,
  unit: product.unit,
  money: product.money ?? product.amount,
  amount: product.amount ?? product.money,
  remark: product.remark
})
const normalizeOrderCraftPayload = (craft = {}) => ({
  id: craft.id || undefined,
  craftId: craft.craftId || undefined,
  productId: craft.productId || undefined,
  productName: craft.productName,
  name: craft.name || craft.craftName,
  craftName: craft.craftName || craft.name,
  specification: craft.specification || craft.spec,
  spec: craft.spec || craft.specification,
  formatSize: craft.formatSize ?? craft.openNum,
  openNum: craft.openNum ?? craft.formatSize,
  numberPerBoard: craft.numberPerBoard,
  singleDouble: craft.singleDouble,
  spotColors: craft.spotColors,
  colour: craft.colour,
  formula: craft.formula,
  priceBase: craft.startPrice ?? craft.priceBase,
  startPrice: craft.startPrice ?? craft.priceBase,
  foilingStartingPrice: craft.foilingStartingPrice,
  foilingPointPrice: craft.foilingPointPrice,
  foilingSheetPrice: craft.foilingSheetPrice,
  foilingPointList: isFoilingCraft(craft) ? normalizeFoilingPointList(craft.foilingPointList, craft.formula) : [],
  orderQuantity: craft.orderQuantity ?? craft.finishNum,
  finishNum: craft.finishNum ?? craft.orderQuantity,
  unit: craft.unit,
  unitPrice: craft.unitPrice ?? craft.price,
  price: craft.price ?? craft.unitPrice,
  customerMoney: craft.customerMoney ?? craft.customerAmount,
  customerAmount: craft.customerAmount ?? craft.customerMoney,
  outTenantId: craft.outTenantId || undefined,
  remark: craft.remark
})
const craftRowsForPayload = (options = {}) => {
  const rows = craftRows.value.map((row) => {
    const next = { ...row }
    if (options.outsource) {
      next.outTenantId = next.outsourceChecked ? formState.outsourceSupplierId : ''
    }
    return next
  })
  return rows
}

const buildOrderRequestPayload = (options = {}) => {
  const total = formOrderTotal.value
  const products = JSON.parse(JSON.stringify(productRows.value.map(cleanProductRow)))
  const crafts = JSON.parse(JSON.stringify(craftRowsForPayload(options).map(cleanCraftRow)))
  const normalizedCrafts = crafts.map(normalizeOrderCraftPayload)
  const normalizedProducts = products.map((product) => {
    const matchingCrafts = normalizedCrafts.filter((craft) => isCraftOfProduct(craft, product))
    const craftAmount = matchingCrafts.reduce((sum, craft) => sum + craftCustomerAmount(craft), 0)
    return {
      ...normalizeOrderProductPayload(product),
      amount: craftAmount,
      money: craftAmount,
      craftList: matchingCrafts
    }
  })
  return {
    id: formState.id || undefined,
    orderId: formState.orderId || undefined,
    cooperativeClientId: formState.cooperativeClientId || undefined,
    companyName: formState.companyName,
    linkman: formState.linkman,
    fillUserName: formState.fillUserName,
    phone: formState.phone,
    deliveryDate: formState.deliveryDate,
    deliveryType: formState.deliveryType,
    companyAddress: formState.companyAddress,
    printingRequirements: formState.printingRequirements,
    status: formState.status,
    remark: formState.remark,
    payMoney: total,
    totalMoney: total,
    productList: normalizedProducts,
    craftList: normalizedCrafts
  }
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
const formatMoney4 = (value) => `¥${Number(value || 0).toLocaleString('zh-CN', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4
})}`

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
    orderTimeRange: []
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
  createTimeStart: filters.orderTimeRange?.[0] || undefined,
  createTimeEnd: filters.orderTimeRange?.[1] || undefined
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

const loadAutoApprove = async () => {
  autoApproveLoading.value = true
  try {
    const result = await getTenantOrderAutoApprove()
    autoApprove.value = boolFromApi(result?.autoApprove ?? result?.autoApproval ?? result?.status ?? result)
  } catch (error) {
    ElMessage.error(error?.message || '自动审批状态加载失败')
  } finally {
    autoApproveLoading.value = false
  }
}

const changeAutoApprove = async (value) => {
  if (autoApproveLoading.value) return
  const previous = !value
  autoApproveLoading.value = true
  try {
    await changeTenantOrderAutoApprove({
      autoApproval: value ? 1 : 0,
      status: value ? 1 : 0
    })
    autoApprove.value = value
    ElMessage.success('自动审批已更新')
  } catch (error) {
    autoApprove.value = previous
    ElMessage.error(error?.message || '自动审批设置失败')
  } finally {
    autoApproveLoading.value = false
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
    printCode: '',
    remark: ''
  })
  lastClientKeyword.value = null
  searchClients('')
  craftOptions.value = []
  lastCraftKeyword.value = null
  activeProductKey.value = ''
  orderFormVisible.value = true
}

const openEdit = async (row) => {
  formMode.value = 'edit'
  sourceOrderId.value = null
  let record = JSON.parse(JSON.stringify(row))
  if (row?.id) {
    detailLoading.value = true
    try {
      const detail = await getTenantOrderEditInfo(row.id)
      record = normalizeDetailRow(detail || {}, row, row.timeline || [])
    } catch (error) {
      ElMessage.error(error?.message || '订单编辑回显加载失败')
    } finally {
      detailLoading.value = false
    }
  }
  Object.assign(formState, {
    ...record,
    productList: record.products || record.productList || [],
    craftList: record.crafts || record.craftList || []
  })
  seedClientOption(record)
  craftOptions.value = []
  lastCraftKeyword.value = null
  await searchCrafts('')
  seedCraftOptions(formState.craftList)
  hydrateCraftNames(formState.craftList)
  activeProductKey.value = formState.productList[0] ? ensureProductRowKey(formState.productList[0]) : ''
  orderFormVisible.value = true
}

const openOutsource = async (row) => {
  formMode.value = 'outsource'
  sourceOrderId.value = row.id
  let record = JSON.parse(JSON.stringify(row))
  if (row?.id) {
    detailLoading.value = true
    try {
      const detail = await getTenantOrderEditInfo(row.id)
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
    craftList: (record.crafts || record.craftList || []).map((item) => ({
      ...item,
      outsourceChecked: Boolean(item.outsourceChecked || item.outTenantId)
    })),
    outsourceSupplierId: '',
    outsourceSupplierName: '',
    outsourceSupplierContact: ''
  })
  seedClientOption(record)
  craftOptions.value = []
  lastCraftKeyword.value = null
  await searchCrafts('')
  seedCraftOptions(formState.craftList)
  hydrateCraftNames(formState.craftList)
  activeProductKey.value = formState.productList[0] ? ensureProductRowKey(formState.productList[0]) : ''
  outsourceFilters.memberId = ''
  outsourceFilters.memberName = ''
  orderFormVisible.value = true
  loadOutsourceUnits()
}

const saveOrder = async () => {
  if (saving.value) return
  if (formMode.value === 'outsource' && !formState.outsourceSupplierId) {
    ElMessage.warning('请选择外协单位')
    return
  }
  if (formMode.value === 'outsource' && !craftRows.value.some((item) => item.outsourceChecked)) {
    ElMessage.warning('请选择需要转外协的工艺')
    return
  }
  for (const product of formState.productList || []) {
    if (!product.productName || !product.quantity) {
      ElMessage.warning('请填写产品名称和订货数量')
      return
    }
    product.quantity = Number(product.quantity)
    ensureProductRowKey(product)
    syncProductAmount(product)
    product._isEditing = false
    product._isNew = false
  }
  for (const craft of formState.craftList || []) {
    if (!saveCraftRow(craft)) return
  }
  saving.value = true
  try {
    if (formMode.value === 'outsource') {
      await outsourceTenantOrder({
        ...buildOrderRequestPayload({ outsource: true }),
        id: sourceOrderId.value || formState.id,
        tenantId: formState.outsourceSupplierId
      })
    } else {
      const payload = buildOrderRequestPayload()
      if (formState.id) {
        await editTenantOrder(payload)
      } else {
        await addTenantOrder(payload)
      }
    }
    orderFormVisible.value = false
    ElMessage.success(formMode.value === 'outsource' ? '订单已转外协' : '订单已保存')
    await loadData()
  } catch (error) {
    ElMessage.error(error?.message || '订单保存失败')
  } finally {
    saving.value = false
  }
}

const openDetail = async (row) => {
  currentRecord.value = JSON.parse(JSON.stringify(row))
  detailVisible.value = true
  if (!row?.id) return
  detailLoading.value = true
  try {
    const [detail, processList, consumables, handKept] = await Promise.all([
      getTenantOrderDetail(row.id),
      getTenantOrderProcess(row.id),
      getTenantOrderConsumables(row.id).catch(() => []),
      getTenantOrderHandKept(row.id).catch(() => [])
    ])
    currentRecord.value = {
      ...normalizeDetailRow(detail || {}, row, processList || []),
      consumables: listRows(consumables).map(normalizeConsumableRecord),
      handKept: listRows(handKept).map(normalizeHandKeptRecord)
    }
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

const printDelivery = async (row) => {
  const printId = row?.deliveryId || row?.deliveryOrderId || row?.deliveryOrder?.id || row?.id || row?.orderPrimaryId || row?.orderDbId
  if (!printId) {
    ElMessage.error('缺少ID，无法打印配送单')
    return
  }
  try {
    const result = await getTenantDeliveryPrintUrl(printId)
    const url = typeof result === 'string' ? result : result?.url || result?.printUrl || result?.fileUrl
    if (!url) {
      ElMessage.error('配送单打印地址为空')
      return
    }
    window.open(url, '_blank')
  } catch (error) {
    ElMessage.error(error?.message || '配送单打印地址获取失败')
  }
}

const openErrorOrder = async (row) => {
  errorTarget.value = row
  errorForm.tenantUserId = ''
  errorForm.remark = ''
  errorVisible.value = true
  if (!userOptions.value.length) {
    await loadUserOptions()
  }
}

const submitErrorOrder = async () => {
  const orderId = errorTarget.value?.id || errorTarget.value?.orderPrimaryId || errorTarget.value?.orderDbId
  if (!orderId) return ElMessage.error('缺少订单ID，无法提交差错单')
  if (!errorForm.tenantUserId) return ElMessage.warning('请选择责任人')
  errorSaving.value = true
  try {
    await addTenantOrderError({
      orderId,
      tenantUserId: errorForm.tenantUserId,
      remark: errorForm.remark || undefined
    })
    errorVisible.value = false
    ElMessage.success('差错单已提交')
    await loadData()
  } catch (error) {
    ElMessage.error(error?.message || '差错单提交失败')
  } finally {
    errorSaving.value = false
  }
}

const openErrorDetail = async (row) => {
  const orderId = row?.id || row?.orderPrimaryId || row?.orderDbId
  if (!orderId) return ElMessage.error('缺少订单ID，无法查看差错详情')
  errorDetailVisible.value = true
  errorDetailLoading.value = true
  errorDetail.value = null
  try {
    const data = await getTenantOrderErrorInfo(orderId)
    errorDetail.value = {
      orderId: row.orderId || row.orderNum || row.orderNo || orderId,
      companyName: row.companyName || '-',
      productInfo: productInfoText(row),
      totalMoney: row.totalMoney,
      personInCharge: data?.personInCharge || data?.personInChargeName || data?.tenantUserName || '-',
      remark: data?.remark || '-'
    }
  } catch (error) {
    ElMessage.error(error?.message || '差错详情加载失败')
  } finally {
    errorDetailLoading.value = false
  }
}

const removeOrder = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除订单 ${row.orderId} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  const orderId = row?.id || row?.orderPrimaryId || row?.orderDbId
  if (!orderId) {
    ElMessage.error('缺少订单ID，无法删除')
    return
  }
  try {
    await deleteTenantOrder(orderId)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const openApprove = (row) => {
  currentRecord.value = row
  approvalRemark.value = ''
  approveVisible.value = true
}

const confirmApprove = async () => {
  const orderId = currentRecord.value?.id || currentRecord.value?.orderPrimaryId || currentRecord.value?.orderDbId
  if (!orderId) return ElMessage.error('缺少订单ID，无法审批')
  try {
    await approveTenantOrder({ id: orderId, status: 1, remark: approvalRemark.value || undefined })
    approveVisible.value = false
    detailVisible.value = false
    ElMessage.success('订单已通过')
    await loadData()
  } catch (error) {
    ElMessage.error(error?.message || '审批失败')
  }
}

const openReject = (row) => {
  currentRecord.value = row
  rejectRemark.value = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  const orderId = currentRecord.value?.id || currentRecord.value?.orderPrimaryId || currentRecord.value?.orderDbId
  if (!orderId) return ElMessage.error('缺少订单ID，无法审批')
  try {
    await approveTenantOrder({ id: orderId, status: 2, remark: rejectRemark.value || undefined })
    rejectVisible.value = false
    detailVisible.value = false
    ElMessage.success('订单已驳回')
    await loadData()
  } catch (error) {
    ElMessage.error(error?.message || '驳回失败')
  }
}

const openManualComplete = (row) => {
  manualCompleteTarget.value = row
  manualCompleteForm.completeRemark = ''
  manualCompleteForm.completeImgRemark = ''
  manualCompleteForm.completeImgRemarkUrl = ''
  manualCompleteVisible.value = true
}

const uploadManualCompleteImage = async ({ file }) => {
  try {
    const data = await uploadTenantFile(file)
    manualCompleteForm.completeImgRemark = data?.fileId || data?.id || data
    manualCompleteForm.completeImgRemarkUrl = data?.url || data?.fileUrl || data?.path || URL.createObjectURL(file)
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error(error?.message || '上传失败')
  }
}

const confirmManualComplete = async () => {
  const craftId = manualCompleteTarget.value?.id
  if (!craftId) {
    ElMessage.error('缺少工艺ID，无法手动完成')
    return
  }
  manualCompleteSaving.value = true
  try {
    await completeTenantOrderProduction({
      id: craftId,
      completeRemark: manualCompleteForm.completeRemark || undefined,
      completeImgRemark: manualCompleteForm.completeImgRemark || undefined
    })
    manualCompleteVisible.value = false
    ElMessage.success('手动完成成功')
    if (currentRecord.value?.id) {
      await openDetail(currentRecord.value)
    }
  } catch (error) {
    ElMessage.error(error?.message || '手动完成失败')
  } finally {
    manualCompleteSaving.value = false
  }
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
  orderFormVisible.value = true
}

const repeatOrder = async (row) => {
  const orderId = row?.id || row?.orderPrimaryId || row?.orderDbId
  if (!orderId) return ElMessage.error('缺少订单ID，无法返单')
  try {
    await returnTenantOrder(orderId)
    ElMessage.success('返单成功')
    await loadData()
  } catch (error) {
    ElMessage.error(error?.message || '返单失败')
  }
}

const outsourceOrder = (row) => {
  openOutsource(row)
}

const rowActions = (row) => {
  if (row.status === 1) return ['审批', '编辑', '删除']
  if (row.status === 7) return ['重新申请', '删除']
  if (row.status === 2) return ['详情','编辑', '差错单']
  if (row.status === 8) return ['详情', '差错详情']
  if (row.status === 6) return ['详情', '返单','差错单']
  return ['详情','差错单']
}

const handleAction = (row, action) => {
  if (action === '审批') return openDetail(row)
  if (action === '编辑') return openEdit(row)
  if (action === '删除') return removeOrder(row)
  if (action === '重新申请') return openEdit(row)
  if (action === '差错单') return openErrorOrder(row)
  if (action === '差错详情') return openErrorDetail(row)
  if (action === '返单') return repeatOrder(row)
  return openDetail(row)
}

onMounted(() => {
  loadClientOptions()
  loadUserOptions()
  loadData()
  loadAutoApprove()
})

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
          <el-select
            v-model="filters.companyName"
            filterable
            remote
            clearable
            reserve-keyword
            placeholder="请输入单位名称"
            :remote-method="searchClients"
            :loading="clientSearching"
            @visible-change="handleClientDropdownVisible"
          >
            <el-option
              v-for="item in clientOptions"
              :key="item.id"
              :label="item.companyName"
              :value="item.companyName"
            />
          </el-select>
        </label>
        <label>
          <span>业务员</span>
          <el-input v-model="filters.fillUserName" placeholder="请输入业务员" />
        </label>
        <label>
          <span>订单号</span>
          <el-input v-model="filters.orderId" placeholder="请输入订单号" />
        </label>
        <label>
          <span>订单状态</span>
          <el-select v-model="filters.status" placeholder="请选择订单状态" clearable>
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </label>
        <label>
          <span>订单时间</span>
          <el-date-picker
            v-model="filters.orderTimeRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="请选择开始时间"
            end-placeholder="请选择结束时间"
            range-separator="至"
          />
        </label>
        <div class="filter-actions">
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon>
            <span>查询</span>
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </PageBlock>

    <PageBlock v-if="viewMode === 'list'" class="table-card">
      <div class="list-actions">
        <el-button type="primary" :icon="Plus" @click="openAdd">添加</el-button>
        <div class="list-actions__right">
          <div class="auto-approve">
            <span>自动审批</span>
            <el-switch
              :model-value="autoApprove"
              :loading="autoApproveLoading"
              @change="changeAutoApprove"
            />
          </div>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        </div>
      </div>

      <div v-if="activeFilters.length" class="filter-tags">
        <span class="filter-tags__label">当前筛选</span>
        <el-tag
          v-for="item in activeFilters"
          :key="item.key"
          closable
          effect="plain"
          @close="filters[item.key] = Array.isArray(filters[item.key]) ? [] : ''; loadData()"
        >
          {{ item.label }}：{{ item.value }}
        </el-tag>
      </div>

      <div class="table-meta">
        <span>共 {{ stats.orderTotal }} 条数据</span>
        <span>当前页 {{ rows.length }} 条</span>
        <el-button link @click="resetFilters">重置筛选</el-button>
      </div>

      <el-table
          v-loading="loading"
          :data="rows"
          empty-text="当前筛选下暂无订单数据"
          :cell-style="({ row }) => row.status === 8 ? { color: 'red' } : {}"
      >
        <el-table-column prop="orderId" label="订单号" min-width="150" />
        <el-table-column prop="companyName" label="单位名称" min-width="180" />
        <el-table-column prop="orderTime" label="订单时间" min-width="160" />
        <el-table-column prop="fillUserName" label="业务员" min-width="100" />
        <el-table-column label="产品信息" min-width="220">
          <template #default="{ row }">
            <div class="product-info-lines">
              <span v-for="(item, index) in productInfoLines(row)" :key="`${row.id || row.orderId}-${index}`">
                {{ item }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="totalMoney" label="订单金额" min-width="130">
          <template #default="{ row }">{{ formatMoney(row.totalMoney) }}</template>
        </el-table-column>
        <el-table-column label="类型" min-width="110">
          <template #default="{ row }">
            <el-tag class="order-source-tag" :class="orderSourceClass(row.orderSource)" effect="plain">
              {{ orderSourceText(row.orderSource) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" min-width="110">
          <template #default="{ row }">
            <button type="button" class="status-link" @click="openDetail(row)">
              <el-tag class="order-status-tag" :class="statusToneClass(row.status)" effect="plain">
                {{ statusMap[row.status]?.label || '' }}
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
                :type="['删除', '驳回', '差错单'].includes(action) ? 'danger' : 'primary'"
                @click="handleAction(row, action)"
              >
                {{ action }}
              </el-button>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="配送单打印" min-width="110" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" plain :icon="Printer" @click="printDelivery(row)">打印</el-button>
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
      class="order-form-dialog"
      :close-on-click-modal="false"
    >
      <section class="order-flow">
      <PageBlock class="form-panel order-edit-panel">
        <div v-if="formMode === 'outsource'" class="order-form-section">
          <h3>外协单位</h3>
          <div class="outsource-search">
            <label>
              <span>会员名称</span>
              <el-input v-model="outsourceFilters.memberName" placeholder="请输入会员名称" />
            </label>
            <div class="outsource-search__actions">
              <el-button type="primary" @click="loadOutsourceUnits">
                <el-icon><Search /></el-icon>
                <span>查询</span>
              </el-button>
              <el-button :icon="Refresh" @click="resetOutsourceFilters">重置</el-button>
              <el-button type="danger" plain @click="openExternalTenantDialog">非本系统会员</el-button>
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
            <el-table-column prop="tenantName" label="会员名称" min-width="320" />
            <el-table-column prop="contact" label="联系人" min-width="240" />
          </el-table>
        </div>
        <div class="order-form-section order-info-section">
          <h3>订单信息</h3>
          <div class="form-grid design-form-grid order-info-grid">
            <label class="span-2">
              <span><em>*</em>单位名称</span>
              <el-select
                v-model="formState.cooperativeClientId"
                filterable
                remote
                clearable
                reserve-keyword
                placeholder="请输入单位名称"
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
              <el-input v-model="formState.linkman" placeholder="请输入联系人" />
            </label>
            <label>
              <span><em>*</em>联系方式</span>
              <el-input v-model="formState.phone" placeholder="请输入联系方式" />
            </label>
            <label class="span-2">
              <span><em>*</em>送货地址</span>
              <el-input v-model="formState.companyAddress" placeholder="请输入送货地址" />
            </label>
            <label>
              <span><em>*</em>交货日期</span>
              <el-date-picker
                v-model="formState.deliveryDate"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择交货日期"
              />
            </label>
            <label>
              <span><em>*</em>交货方式</span>
              <el-select v-model="formState.deliveryType" placeholder="请选择交货方式">
                <el-option v-for="item in deliveryTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </label>
            <label class="span-2">
              <span>印刷要求</span>
              <el-input v-model="formState.printingRequirements" placeholder="请输入印刷要求" />
            </label>
            <label class="span-2">
              <span>备注</span>
              <el-input v-model="formState.remark" type="textarea" :rows="2" placeholder="请输入备注" />
            </label>
          </div>
        </div>
        <div class="order-form-section">
          <div class="order-billing-section">
            <div class="billing-toolbar">
              <el-button type="primary" class="flow-add-button" @click="addProductRow">新增产品</el-button>
            </div>
          <el-table
            :data="productRows"
            class="design-table billing-product-table"
            :row-class-name="productTableRowClassName"
            @row-click="selectProductRow"
          >
            <el-table-column prop="productName" label="产品名称" min-width="460">
              <template #default="{ row }">
                <el-input v-model="row.productName" placeholder="请输入产品名称" />
              </template>
            </el-table-column>
            <el-table-column prop="finishedSpec" label="成品规格" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.finishedSpec" placeholder="请输入成品规格" />
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="订货数量" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.quantity" placeholder="请输入数量" />
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" min-width="130">
              <template #default="{ row }">
                <el-input v-model="row.unit" placeholder="请输入单位" />
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" min-width="160">
              <template #default="{ row }">
                <span>{{ formatMoney4(productCraftAmount(row)) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="90" fixed="right">
              <template #default="{ $index }">
                <div class="table-actions">
                  <button type="button" @click="removeProductRow($index)">删除</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          </div>

          <div class="order-billing-section order-billing-section--craft">
            <div class="billing-toolbar billing-toolbar--craft">
              <div class="billing-current-product">
                当前产品：<strong>{{ activeProductRow?.productName || '请选择产品' }}</strong>
              </div>
              <el-button type="primary" class="flow-add-button" :disabled="!activeProductRow" @click="addCraftRow">新增工艺</el-button>
            </div>
          <el-table
            :data="currentProductCraftRows"
            class="design-table billing-craft-table"
            empty-text="当前产品暂无工艺"
            @wheel="handleCraftTableWheel"
          >
            <el-table-column v-if="formMode === 'outsource'" label="外协" width="70" fixed="left">
              <template #default="{ row }">
                <el-checkbox v-model="row.outsourceChecked" />
              </template>
            </el-table-column>
            <el-table-column prop="craftName" label="工艺名称" min-width="150">
              <template #default="{ row }">
                <el-select
                  v-model="row.craftId"
                  filterable
                  remote
                  clearable
                  reserve-keyword
                  placeholder="请输入工艺名称"
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
              </template>
            </el-table-column>
            <el-table-column prop="spec" label="规格" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.spec" placeholder="请输入规格" />
              </template>
            </el-table-column>
            <el-table-column prop="openNum" label="开数" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.openNum" placeholder="请输入开数" />
              </template>
            </el-table-column>
            <el-table-column prop="numberPerBoard" label="每板个数" min-width="130">
              <template #default="{ row }">
                <el-input v-model="row.numberPerBoard" placeholder="请输入每板个数" />
              </template>
            </el-table-column>
            <el-table-column prop="singleDouble" label="单双面" min-width="160">
              <template #default="{ row }">
                <el-select v-model="row.singleDouble" placeholder="请选择单双面">
                  <el-option v-for="item in singleDoubleOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="startPrice" label="起价" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.startPrice" placeholder="请输入起步价" />
              </template>
            </el-table-column>
            <el-table-column prop="spotColors" label="专色" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.spotColors" placeholder="请输入专色" />
              </template>
            </el-table-column>
            <el-table-column prop="colour" label="颜色" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.colour" placeholder="请输入颜色" />
              </template>
            </el-table-column>
            <el-table-column prop="finishNum" label="成品数量" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.finishNum" placeholder="请输入成品数" />
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.unit" placeholder="请输入单位" />
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.price" placeholder="请输入价格" />
              </template>
            </el-table-column>
            <el-table-column prop="formula" label="公式" min-width="240">
              <template #default="{ row }">
                <div class="formula-editor">
                  <el-input v-model="row.formula" :disabled="isFoilingCraft(row)" placeholder="请输入公式" />
                  <el-button v-if="isFoilingCraft(row)" type="primary" link @click="openFoilingPointDialog(row)">+ 点位</el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="customerAmount" label="客户金额" min-width="150">
              <template #default="{ row }">
                <span>{{ formatMoney4(displayCraftCustomerAmount(row)) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.remark" placeholder="请输入备注" />
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="90" fixed="right">
              <template #default="{ row, $index }">
                <div class="table-actions">
                  <button type="button" @click="removeCraftRow(row, $index)">删除</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          </div>
        </div>
      </PageBlock>

      <div class="sticky-total">
        <strong>订单合计：<span>{{ formatMoney4(formOrderTotal) }}</span></strong>
        <div>
          <el-button :disabled="saving" @click="orderFormVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveOrder">保存</el-button>
        </div>
      </div>
      </section>
    </el-dialog>

    <el-dialog
      v-model="foilingPointVisible"
      title="烫金点位"
      width="720px"
      class="foiling-point-dialog"
      :close-on-click-modal="false"
    >
      <div class="foiling-point-form">
        <div class="foiling-price-row">
          <label>
            <span>点位起价</span>
            <el-input v-model="foilingPointForm.foilingPointPrice" placeholder="请输入点位起价" />
          </label>
          <label>
            <span>每页起价</span>
            <el-input v-model="foilingPointForm.foilingSheetPrice" placeholder="请输入每页起价" />
          </label>
        </div>
        <div class="foiling-point-list">
          <div class="foiling-point-head">
            <span>点位</span>
            <el-button type="primary" link @click="addFoilingPoint">+ 点位</el-button>
          </div>
          <div v-for="(point, index) in foilingPointForm.points" :key="index" class="foiling-point-item">
            <el-input v-model="foilingPointForm.points[index]" placeholder="请输入烫金点位，例如 0.1*0.2" />
            <el-button type="danger" link @click="removeFoilingPoint(index)">删除</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="foilingPointVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFoilingPointDialog">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="externalTenantVisible"
      title="非本系统会员"
      width="860px"
      class="external-tenant-dialog"
      :close-on-click-modal="false"
    >
      <div class="external-tenant-panel">
        <div class="external-tenant-toolbar">
          <el-input
            v-model="externalTenantFilters.tenantName"
            clearable
            placeholder="请输入会员名称"
            @keyup.enter="searchExternalTenants"
          />
          <el-button type="primary" @click="searchExternalTenants">
            <el-icon><Search /></el-icon>
            <span>查询</span>
          </el-button>
          <el-button :icon="Refresh" @click="resetExternalTenantFilters">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="openExternalTenantCreate">添加</el-button>
        </div>
        <el-table v-loading="externalTenantLoading" :data="externalTenantRows" border>
          <el-table-column prop="tenantName" label="会员名称" min-width="220" />
          <el-table-column prop="userName" label="联系人" min-width="180" />
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="selectExternalTenant(row)">选择</el-button>
              <el-button type="primary" link @click="openExternalTenantEdit(row)">编辑</el-button>
              <el-button type="danger" link @click="removeExternalTenant(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="externalTenantFilters.pageNum"
            v-model:page-size="externalTenantFilters.pageSize"
            background
            layout="total, prev, pager, next, sizes"
            :page-sizes="[10, 20, 30, 50]"
            :total="externalTenantTotal"
            @current-change="loadExternalTenants"
            @size-change="searchExternalTenants"
          />
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="externalTenantFormVisible"
      :title="externalTenantForm.id ? '编辑非本系统会员' : '新增非本系统会员'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form class="external-tenant-form" :model="externalTenantForm" label-width="96px">
        <el-form-item label="会员名称" required>
          <el-input v-model="externalTenantForm.tenantName" placeholder="请输入会员名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="externalTenantForm.userName" placeholder="请输入联系人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="externalTenantFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="externalTenantSaving" @click="saveExternalTenant">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="errorVisible"
      title="差错单"
      width="560px"
      class="order-error-dialog"
      :close-on-click-modal="false"
    >
      <div class="order-error-summary">
        <div>
          <span>订单号</span>
          <strong>{{ errorTarget?.orderId || errorTarget?.orderNum || errorTarget?.orderNo || '-' }}</strong>
        </div>
        <div>
          <span>单位名称</span>
          <strong>{{ errorTarget?.companyName || '-' }}</strong>
        </div>
      </div>
      <el-form label-position="top">
        <el-form-item label="责任人" required>
          <el-select
            v-model="errorForm.tenantUserId"
            filterable
            clearable
            placeholder="请选择责任人"
            class="full-width"
          >
            <el-option v-for="item in userOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="errorForm.remark"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="errorVisible = false">取消</el-button>
        <el-button type="primary" :loading="errorSaving" @click="submitErrorOrder">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="errorDetailVisible"
      title="差错详情"
      width="640px"
      class="order-error-dialog"
      :close-on-click-modal="false"
    >
      <div v-loading="errorDetailLoading" class="order-error-detail">
        <div class="order-error-detail__head">
          <el-tag class="order-status-tag order-status--error" effect="plain">差错单</el-tag>
          <strong>{{ errorDetail?.orderId || '-' }}</strong>
        </div>
        <div class="order-error-detail__grid">
          <div>
            <span>单位名称</span>
            <strong>{{ errorDetail?.companyName || '-' }}</strong>
          </div>
          <div>
            <span>责任人</span>
            <strong>{{ errorDetail?.personInCharge || '-' }}</strong>
          </div>
          <div>
            <span>订单金额</span>
            <strong>{{ formatMoney(errorDetail?.totalMoney) }}</strong>
          </div>
          <div class="full-span">
            <span>产品信息</span>
            <strong>{{ errorDetail?.productInfo || '-' }}</strong>
          </div>
          <div class="full-span">
            <span>备注</span>
            <p>{{ errorDetail?.remark || '-' }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="errorDetailVisible = false">知道了</el-button>
      </template>
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
              <template #default="{ row }">{{ formatMoney4(productCraftAmount(row)) }}</template>
            </el-table-column>
          </el-table>
        </PageBlock>

        <PageBlock title="工艺信息">
          <el-table :data="craftRows" class="design-table">
            <el-table-column prop="productName" label="产品名称" min-width="320" />
            <el-table-column prop="craftName" label="工艺名称" min-width="150" />
            <el-table-column prop="spec" label="规格" min-width="110" />
            <el-table-column prop="openNum" label="开数" min-width="110" />
            <el-table-column prop="numberPerBoard" label="每板个数" min-width="120">
              <template #default="{ row }">{{ row.numberPerBoard || '-' }}</template>
            </el-table-column>
            <el-table-column label="单双面" min-width="130">
              <template #default="{ row }">{{ singleDoubleText(row.singleDouble) || '-' }}</template>
            </el-table-column>
            <el-table-column prop="startPrice" label="起价" min-width="110" />
            <el-table-column prop="spotColors" label="专色" min-width="110" show-overflow-tooltip>
              <template #default="{ row }">{{ row.spotColors || '-' }}</template>
            </el-table-column>
            <el-table-column prop="colour" label="颜色" min-width="110" show-overflow-tooltip>
              <template #default="{ row }">{{ row.colour || '-' }}</template>
            </el-table-column>
            <el-table-column prop="finishNum" label="成品数量" min-width="140" />
            <el-table-column prop="unit" label="单位" min-width="110" />
            <el-table-column prop="price" label="单价" min-width="110">
              <template #default="{ row }">{{ formatMoney(row.price) }}</template>
            </el-table-column>
            <el-table-column prop="formula" label="公式" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ row.formula || '-' }}</template>
            </el-table-column>
            <el-table-column prop="customerAmount" label="客户金额" min-width="150">
              <template #default="{ row }">{{ formatMoney4(displayCraftCustomerAmount(row)) }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="120" />
            <el-table-column label="工艺状态" min-width="110">
              <template #default="{ row }">
                <span :class="craftStatusClass(row.craftStatus)">{{ craftStatusText(row.craftStatus) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" min-width="120" />
            <el-table-column label="类型" min-width="110">
              <template #default="{ row }">
                <el-tag class="order-source-tag" :class="orderSourceClass(row.orderSource)" effect="plain">
                  {{ orderSourceText(row.orderSource) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="120" fixed="right">
              <template #default="{ row }">
                <el-button v-if="shouldShowManualComplete(row)" type="primary" link @click="openManualComplete(row)">
                  手动完成
                </el-button>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </PageBlock>

        <PageBlock title="耗材记录">
          <el-table :data="currentRecord.consumables || []" class="design-table">
            <el-table-column prop="name" label="耗材名称" min-width="180" />
            <el-table-column prop="type" label="明细类型" min-width="150" />
            <el-table-column prop="num" label="数量" min-width="120" />
            <el-table-column prop="remark" label="备注" min-width="200" />
            <el-table-column prop="operator" label="操作员" min-width="140" />
            <el-table-column prop="time" label="操作时间" min-width="180" />
          </el-table>
        </PageBlock>

        <PageBlock title="手工记录">
          <el-table :data="currentRecord.handKept || []" class="design-table">
            <el-table-column prop="name" label="手工名称" min-width="180" />
            <el-table-column prop="num" label="数量" min-width="120" />
            <el-table-column prop="remark" label="备注" min-width="220" />
            <el-table-column prop="operator" label="操作员" min-width="140" />
            <el-table-column prop="time" label="操作时间" min-width="180" />
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
          <strong>订单合计：<span>{{ formatMoney4(productTotalAmount) }}</span></strong>
          <div>
            <el-button @click="detailVisible = false">返回</el-button>
            <el-button v-if="currentRecord.status === 1" type="danger" @click="openReject(currentRecord)">驳回</el-button>
            <el-button v-if="currentRecord.status === 1" type="primary" @click="openApprove(currentRecord)">通过</el-button>
          </div>
        </div>
      </section>
    </el-dialog>

    <el-dialog v-model="manualCompleteVisible" title="手动完成" width="620px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="备注">
          <el-input v-model="manualCompleteForm.completeRemark" type="textarea" :rows="4" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="图片备注">
          <div class="manual-complete-upload">
            <el-upload action="#" accept="image/*" :show-file-list="false" :http-request="uploadManualCompleteImage">
              <el-button :icon="Plus">上传图片</el-button>
            </el-upload>
            <el-image
              v-if="manualCompleteForm.completeImgRemarkUrl"
              class="manual-complete-image"
              :src="manualCompleteForm.completeImgRemarkUrl"
              :preview-src-list="[manualCompleteForm.completeImgRemarkUrl]"
              fit="cover"
              preview-teleported
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualCompleteVisible = false">取消</el-button>
        <el-button type="primary" :loading="manualCompleteSaving" @click="confirmManualComplete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveVisible" title="通过订单" width="620px">
      <el-input v-model="approvalRemark" type="textarea" :rows="5" placeholder="请输入备注" />
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

.product-info-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
  line-height: 1.45;
  white-space: normal;
  word-break: break-word;
}

.filter-grid,
.form-grid,
.detail-grid {
  display: grid;
  gap: 12px;
}

.filter-grid {
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 12px 20px;
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
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 18px;
  grid-column: 1 / -1;
}

.filter-grid :deep(.el-input),
.filter-grid :deep(.el-select),
.filter-grid :deep(.el-date-editor.el-input) {
  width: 100%;
  --el-input-height: 32px;
  font-size: 14px;
}

.filter-grid :deep(.el-select__wrapper) {
  min-height: 32px;
}

.filter-grid :deep(.el-button),
.filter-actions :deep(.el-button) {
  min-width: 76px;
  width: auto;
  height: 32px;
  font-size: 14px;
}

.filter-card :deep(.page-block__body) {
  padding: 16px;
}

.table-card :deep(.page-block__body) {
  padding: 16px;
}

.list-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.list-actions__right {
  display: flex;
  align-items: center;
  gap: 10px;
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

.order-source-tag {
  font-weight: 600;
}

.order-source-local {
  color: #1677ff !important;
  border-color: #bae0ff !important;
  background: #e6f4ff !important;
}

.order-source-outsourced {
  color: #722ed1 !important;
  border-color: #d3adf7 !important;
  background: #f9f0ff !important;
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

.order-status--error {
  color: #cf1322 !important;
  border-color: #ffccc7 !important;
  background: #fff1f0 !important;
}

.craft-status-warning {
  color: #fa8c16;
  font-weight: 700;
}

.craft-status-success {
  color: #52c41a;
  font-weight: 700;
}

.manual-complete-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}

.manual-complete-image {
  width: 72px;
  height: 72px;
  border-radius: 6px;
}

.order-error-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 18px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #f8fafc;
}

.order-error-summary span,
.order-error-detail__grid span {
  display: block;
  margin-bottom: 6px;
  color: #909399;
  font-size: 13px;
}

.order-error-summary strong,
.order-error-detail__grid strong {
  color: #303133;
  font-weight: 700;
}

.order-error-dialog .full-width {
  width: 100%;
}

.order-error-detail__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.order-error-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.order-error-detail__grid .full-span {
  grid-column: 1 / -1;
}

.order-error-detail__grid p {
  min-height: 68px;
  padding: 12px;
  margin: 0;
  color: #303133;
  white-space: pre-wrap;
  border-radius: 6px;
  background: #f8fafc;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 16px;
}

.order-flow,
.order-detail-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:deep(.order-form-dialog.el-dialog),
:deep(.order-detail-dialog.el-dialog) {
  width: min(1280px, calc(100vw - 88px)) !important;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.order-form-dialog.el-dialog) {
  width: calc(100vw - 24px) !important;
  max-width: calc(100vw - 24px) !important;
  height: calc(100vh - 32px);
  max-height: calc(100vh - 32px) !important;
  display: flex;
  flex-direction: column;
}

:deep(.order-form-dialog .el-dialog__header),
:deep(.order-detail-dialog .el-dialog__header) {
  padding: 12px 18px 10px;
  margin: 0;
  border-bottom: 1px solid #ebeef5;
}

:deep(.order-form-dialog .el-dialog__title),
:deep(.order-detail-dialog .el-dialog__title) {
  color: #303133;
  font-size: 16px;
  font-weight: 700;
}

:deep(.order-form-dialog .el-dialog__body),
:deep(.order-detail-dialog .el-dialog__body) {
  max-height: calc(92vh - 92px);
  padding: 16px 20px 0;
  overflow: auto;
  background: #f5f7fa;
}

:deep(.order-form-dialog .el-dialog__body) {
  flex: 1;
  max-height: none;
  min-height: 0;
  padding: 10px 16px 0;
  background: #ffffff;
}

:deep(.order-form-dialog) .order-flow,
:deep(.order-detail-dialog) .order-detail-page {
  gap: 8px;
}

:deep(.order-form-dialog) .order-flow {
  min-height: 100%;
}

.step-card :deep(.page-block__body) {
  padding: 40px 120px;
}

:deep(.order-form-dialog) .step-card :deep(.page-block__body) {
  padding: 20px 72px;
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

.steps-line--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 620px;
}

.steps-line--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: 980px;
}

.steps-line::before {
  position: absolute;
  top: 18px;
  left: calc(100% / 6);
  right: calc(100% / 6);
  height: 2px;
  background: #bdbdbd;
  content: "";
}

.steps-line--four::before {
  left: 12.5%;
  right: 12.5%;
}

.steps-line--two::before {
  left: 25%;
  right: 25%;
}

.step-node {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 8px;
  color: #b7b7b7;
  font-size: 14px;
  font-weight: 700;
}

.step-node span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 2px solid #b7b7b7;
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
  flex: 1;
  min-height: 560px;
}

:deep(.order-form-dialog) .form-panel {
  min-height: calc(100vh - 160px);
}

:deep(.order-form-dialog) .order-edit-panel :deep(.page-block__body) {
  padding: 10px 12px 0;
}

.form-panel h3 {
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.2;
}

.outsource-search {
  display: grid;
  grid-template-columns: 280px 280px 1fr;
  gap: 16px;
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

.external-tenant-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.external-tenant-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) repeat(3, auto);
  gap: 12px;
  align-items: center;
}

.external-tenant-toolbar :deep(.el-button) {
  min-width: 88px;
}

.external-tenant-form :deep(.el-input) {
  width: 100%;
}

.design-form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
}

.order-info-section {
  margin-bottom: 12px;
}

.order-info-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 14px;
  align-items: end;
}

.order-info-grid label {
  gap: 4px;
}

.order-info-grid label span {
  font-size: 13px;
}

.order-info-grid .span-2 {
  grid-column: span 2;
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
  --el-input-height: 32px;
  font-size: 14px;
}

.design-form-grid :deep(.el-select__wrapper) {
  min-height: 32px;
}

.flow-add-button {
  min-width: 96px;
  height: 32px;
  margin-bottom: 16px;
  font-size: 14px;
}

.order-billing-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-billing-section + .order-billing-section {
  margin-top: 18px;
}

.order-billing-section--craft {
  min-height: 280px;
}

.billing-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.billing-toolbar--craft {
  justify-content: flex-start;
}

.billing-toolbar .flow-add-button {
  margin-bottom: 0;
}

.billing-current-product {
  color: #606266;
  font-size: 14px;
}

.billing-current-product strong {
  color: #303133;
}

.design-table {
  width: 100%;
}

:deep(.order-form-dialog) .design-table :deep(.el-table__header th) {
  height: 38px;
}

:deep(.order-form-dialog) .design-table :deep(.el-table__body td.el-table__cell) {
  height: 40px;
}

:deep(.order-form-dialog) .design-table :deep(.cell) {
  line-height: 1.25;
}

.billing-product-table :deep(.el-table__row) {
  cursor: pointer;
}

.billing-product-table :deep(.el-table__row.is-active-product > td.el-table__cell),
.billing-product-table :deep(.el-table__row.is-active-product:hover > td.el-table__cell) {
  background: #fff1b8;
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

.formula-editor {
  display: flex;
  gap: 8px;
  align-items: center;
}

.formula-editor .el-button {
  flex: 0 0 auto;
}

.foiling-point-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.foiling-price-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.foiling-price-row label {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.foiling-point-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.foiling-point-head,
.foiling-point-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.foiling-point-head {
  justify-content: space-between;
  color: #303133;
  font-size: 15px;
  font-weight: 600;
}

.foiling-point-item .el-input {
  flex: 1;
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
  min-height: 72px;
  margin: 0 -20px -16px;
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #ebeef5;
}

:deep(.order-form-dialog) .sticky-total {
  position: sticky;
  bottom: 0;
  margin: 0 -16px;
  min-height: 56px;
  padding: 10px 16px;
}

.sticky-total strong {
  font-size: 18px;
}

.sticky-total strong span {
  color: #ff9200;
}

.sticky-total > div {
  display: flex;
  gap: 12px;
}

.sticky-total :deep(.el-button) {
  min-width: 96px;
  height: 36px;
  font-size: 14px;
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
  font-size: 14px;
  font-weight: 500;
}

.detail-grid strong {
  color: #303133;
  font-size: 14px;
}

.design-detail-grid {
  gap: 12px 20px;
  padding: 12px 0;
}

.full-span {
  grid-column: 1 / -1;
}

.status-banner {
  margin-bottom: 0;
  padding: 16px;
  border-radius: 4px;
  text-align: center;
  font-size: 18px;
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
  font-size: 16px;
  font-weight: 700;
  color: #d48806;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
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
/* 强制垂直居中并限制最大宽高 */
::v-deep .el-dialog {
  margin: 0 !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: calc(100% - 30px);
  max-width: calc(100% - 30px);
}

</style>
