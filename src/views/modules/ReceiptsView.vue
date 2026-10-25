<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Plus, Printer, Refresh, Search, Upload } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantReceipt,
  deleteTenantReceipt,
  exportTenantReceipt,
  getTenantReceiptDetail,
  getTenantReceiptList,
  getTenantReceiptOrderList,
  getTenantReceiptPrintUrl,
  getTenantReceiptTotal,
  searchTenantAccounts,
  searchTenantClients,
  uploadTenantFile
} from '../../api/tenant'

const route = useRoute()

const orderStatusMap = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回'
}

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  orderId: '',
  companyName: '',
  collectionUserName: '',
  accountId: '',
  createTime: []
})

const state = reactive({
  loading: false,
  exporting: false,
  saving: false,
  total: 0,
  detailLoading: false,
  clientLoading: false
})

const rows = ref([])
const accountOptions = ref([])
const allClientOptions = ref([])
const clientOptions = ref([])
const formVisible = ref(false)
const detailVisible = ref(false)
const detailData = ref(null)

const form = reactive({
  id: '',
  cooperativeClientId: '',
  companyName: '',
  collectionTime: '',
  accountId: '',
  accountName: '',
  digest: '',
  proofImg: '',
  proofImgName: '',
  listOrder: []
})

const orderFilters = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  productInfo: ''
})

const orderState = reactive({
  loading: false,
  total: 0
})

const selectableOrders = ref([])
let orderRequestId = 0
const totals = reactive({
  moneyTotal: 0,
  allowanceMoneyTotal: 0
})

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return payload?.records || payload?.list || payload?.rows || payload?.data?.records || payload?.data?.list || []
}

const listTotal = (payload, normalizedRows = []) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const moneyValue = (value) => Number(value || 0)

const formatMoney = (value) => `￥${moneyValue(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatTime = (value) => String(value || '-').replace('T', ' ')

const nowString = () => {
  const pad = (value) => String(value).padStart(2, '0')
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const normalizeReceipt = (row = {}) => ({
  ...row,
  id: row.id || row.receiptId,
  orderId: row.orderId || row.orderNo || row.receiptNo || '-',
  companyName: row.companyName || '-',
  createTime: formatTime(row.createTime || row.collectionTime),
  collectionUserName: row.collectionUserName || '-',
  accountName: row.accountName || '-',
  money: moneyValue(row.money),
  allowanceMoney: moneyValue(row.allowanceMoney),
  digest: row.digest || ''
})

const normalizeReceiptOrder = (row = {}, options = {}) => {
  const receiptAllowance = row.currentAllowanceMoney ?? row.receiptAllowanceMoney ?? row.thisAllowanceMoney
  return {
    ...row,
    orderId: row.orderId || row.id,
    orderNo: row.orderNo || row.orderId || '-',
    orderTime: formatTime(row.orderTime || row.createTime),
    fillUserName: row.fillUserName || row.filler || '-',
    productInfo: productInfoText(row) || '-',
    billMoney: moneyValue(row.billMoney ?? row.receivableMoney),
    receivedMoney: moneyValue(row.receivedMoney ?? row.totalCollectionMoney),
    receivedAllowanceMoney: moneyValue(row.receivedAllowanceMoney ?? row.totalAllowanceMoney ?? row.allowanceMoney),
    remainMoney: moneyValue(row.remainMoney),
    orderStatus: row.orderStatus || row.status,
    money: row.money ?? '',
    currentAllowanceMoney: options.useReceiptAllowance ? receiptAllowance ?? row.allowanceMoney ?? '' : receiptAllowance ?? '',
    checked: false
  }
}
const productInfoText = (row = {}) => {
  if (row.productInfo) return row.productInfo
  if (row.productName) return row.productName
  const products = row.products || row.productList || row.productsList || []
  if (!Array.isArray(products)) return '-'
  return products.map((item) => item.productInfo || item.productName || item.name).filter(Boolean).join('、') || '-'
}
const formMoneyTotal = computed(() => form.listOrder.reduce((sum, item) => sum + moneyValue(item.money), 0))
const formAllowanceTotal = computed(() => form.listOrder.reduce((sum, item) => sum + moneyValue(item.currentAllowanceMoney), 0))

const queryPayload = () => {
  const [start, end] = Array.isArray(filters.createTime) ? filters.createTime : []
  return {
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    orderId: filters.orderId || undefined,
    companyName: filters.companyName || undefined,
    collectionUserName: filters.collectionUserName || undefined,
    accountId: filters.accountId || undefined,
    createTimeStart: start || undefined,
    createTimeEnd: end || undefined
  }
}

const loadAccounts = async (name = '') => {
  try {
    accountOptions.value = await searchTenantAccounts({ name })
  } catch (error) {
    ElMessage.error(error?.message || '收款账户加载失败')
  }
}

const normalizeClientOptions = (data) =>
  listRows(data)
    .map((item) => ({
      ...item,
      id: item.id || item.cooperativeClientId || item.clientId || item.companyName,
      companyName: item.companyName || item.name || '',
      companyNamePinyin: item.companyNamePinyin || item.pinyin || ''
    }))
    .filter((item) => item.id && item.companyName)

const clientMatchesKeyword = (client = {}, keyword = '') => {
  const text = String(keyword || '').trim().toLowerCase()
  if (!text) return true
  return [client.companyName, client.companyNamePinyin]
    .some((value) => String(value || '').toLowerCase().includes(text))
}

const filterClientOptions = (companyName = '') => {
  clientOptions.value = allClientOptions.value
    .filter((item) => clientMatchesKeyword(item, companyName))
    .slice(0, 50)
}

const loadClients = async () => {
  state.clientLoading = true
  try {
    const data = await searchTenantClients({ companyName: '' })
    allClientOptions.value = normalizeClientOptions(data)
    filterClientOptions()
  } catch (error) {
    ElMessage.error(error?.message || '单位列表加载失败')
  } finally {
    state.clientLoading = false
  }
}

const handleClientDropdownVisible = (visible) => {
  if (!visible) return
  if (!allClientOptions.value.length) {
    loadClients()
  } else {
    filterClientOptions()
  }
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantReceiptList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeReceipt)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '收款信息加载失败')
  } finally {
    state.loading = false
  }
}

const loadTotals = async () => {
  try {
    const data = await getTenantReceiptTotal()
    totals.moneyTotal = moneyValue(data?.moneyTotal)
    totals.allowanceMoneyTotal = moneyValue(data?.allowanceMoneyTotal)
  } catch (error) {
    totals.moneyTotal = 0
    totals.allowanceMoneyTotal = 0
  }
}

const refreshAll = async () => {
  await Promise.all([loadData(), loadTotals()])
}

const searchData = () => {
  filters.pageNum = 1
  refreshAll()
}

const resetFilters = () => {
  filters.pageNum = 1
  filters.pageSize = 10
  filters.orderId = ''
  filters.companyName = ''
  filters.collectionUserName = ''
  filters.accountId = ''
  filters.createTime = []
  refreshAll()
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const exportData = async () => {
  state.exporting = true
  try {
    const blob = await exportTenantReceipt(queryPayload())
    downloadBlob(blob, '收款信息.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    state.exporting = false
  }
}

const resetForm = () => {
  orderRequestId += 1
  selectableOrders.value = []
  orderState.loading = false
  orderState.total = 0
  form.id = ''
  form.cooperativeClientId = ''
  form.companyName = ''
  form.fileUrl=''
  form.collectionTime = nowString()
  form.accountId = ''
  form.accountName = ''
  form.digest = ''
  form.proofImg = ''
  form.proofImgName = ''
  form.listOrder = []
}

const openCreate = () => {
  resetForm()
  formVisible.value = true
}

const handleClientChange = (id) => {
  const client = allClientOptions.value.find((item) => String(item.id) === String(id))
    || clientOptions.value.find((item) => String(item.id) === String(id))
  form.companyName = client?.companyName || ''
  form.listOrder = []
  selectableOrders.value = []
  orderState.total = 0
  resetSelectableOrders()
}

const handleAccountChange = (id) => {
  const account = accountOptions.value.find((item) => item.id === id)
  form.accountName = account?.name || ''
}

const uploadProof = async ({ file }) => {
  try {
    const data = await uploadTenantFile(file)
    form.fileUrl = data?.url || data?.fileUrl || URL.createObjectURL(file)
    form.proofImg = data?.url || data?.path || data?.fileUrl || data?.id || data || ''
    form.proofImgName = file.name
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error(error?.message || '上传失败')
  }
}

const receiptPayload = () => ({
  accountId: form.accountId,
  collectionTime: form.collectionTime,
  cooperativeClientId: form.cooperativeClientId,
  digest: form.digest,
  proofImg: form.proofImg,
  listOrder: form.listOrder.map((item) => ({
    orderId: item.orderId,
    money: moneyValue(item.money),
    allowanceMoney: moneyValue(item.currentAllowanceMoney)
  }))
})

const saveReceipt = async () => {
  if (!form.cooperativeClientId) {
    ElMessage.warning('请选择单位名称')
    return
  }
  if (!form.accountId) {
    ElMessage.warning('请选择收款账户')
    return
  }
  if (!form.listOrder.length) {
    ElMessage.warning('请选择订单')
    return
  }
  state.saving = true
  try {
    await addTenantReceipt(receiptPayload())
    ElMessage.success('保存成功')
    formVisible.value = false
    refreshAll()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    state.saving = false
  }
}

const orderQueryPayload = () => ({
  pageNum: orderFilters.pageNum,
  pageSize: orderFilters.pageSize,
  cooperativeClientId: form.cooperativeClientId,
  orderNo: orderFilters.orderNo || undefined,
  productInfo: orderFilters.productInfo || undefined
})

const loadSelectableOrders = async () => {
  const requestId = ++orderRequestId
  if (!form.cooperativeClientId) {
    selectableOrders.value = []
    orderState.total = 0
    orderState.loading = false
    return
  }
  orderState.loading = true
  try {
    const data = await getTenantReceiptOrderList(orderQueryPayload())
    if (requestId !== orderRequestId) return
    const selectedMap = new Map(form.listOrder.map((item) => [String(item.orderId), item]))
    const normalizedRows = listRows(data).map((item) => {
      const row = normalizeReceiptOrder(item)
      return selectedMap.get(String(row.orderId)) || row
    })
    selectableOrders.value = normalizedRows
    orderState.total = listTotal(data, normalizedRows)
  } catch (error) {
    if (requestId !== orderRequestId) return
    selectableOrders.value = []
    orderState.total = 0
    ElMessage.error(error?.message || '订单列表加载失败')
  } finally {
    if (requestId === orderRequestId) orderState.loading = false
  }
}

const searchSelectableOrders = () => {
  orderFilters.pageNum = 1
  loadSelectableOrders()
}

const resetSelectableOrders = () => {
  orderFilters.pageNum = 1
  orderFilters.pageSize = 10
  orderFilters.orderNo = ''
  orderFilters.productInfo = ''
  loadSelectableOrders()
}

const setOrderChecked = (row, checked) => {
  row.checked = checked
  form.listOrder = form.listOrder.filter((item) => String(item.orderId) !== String(row.orderId))
  if (checked) form.listOrder.push(row)
}

const toggleOrderRow = (row) => setOrderChecked(row, !row.checked)

const orderRowClassName = ({ row }) => row.checked ? 'is-selected-order' : ''

const removeRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除收款单 ${row.orderId || ''} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantReceipt(row.id)
    ElMessage.success('删除成功')
    refreshAll()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const printRow = async (row) => {
  try {
    const data = await getTenantReceiptPrintUrl(row.id)
    const url = data?.url || data
    if (url) {
      window.open(url, '_blank')
    } else {
      ElMessage.warning('未获取到打印地址')
    }
  } catch (error) {
    ElMessage.error(error?.message || '打印失败')
  }
}

const openDetail = async (row) => {
  detailVisible.value = true
  detailData.value = null
  state.detailLoading = true
  try {
    const data = await getTenantReceiptDetail(row.id)
    detailData.value = {
      ...normalizeReceipt(data),
      collectionTime: formatTime(data?.collectionTime || data?.createTime),
      accountName: data?.accountName || '-',
      createTenantUserName: data?.createTenantUserName || '-',
      proofImg: data?.proofImg || '',
      listOrder: listRows(data?.listOrder).map((item) => normalizeReceiptOrder(item, { useReceiptAllowance: true }))
    }
  } catch (error) {
    ElMessage.error(error?.message || '详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

onMounted(() => {
  loadAccounts()
  loadClients()
  refreshAll()
  if (route.query.mode === 'create') {
    openCreate()
  }
})
</script>

<template>
  <div class="module-page receipts-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="82px">
        <el-form-item label="收款单号">
          <el-input v-model="filters.orderId" clearable placeholder="请输入收款单号" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="单位名称">
          <el-select
            v-model="filters.companyName"
            clearable
            filterable
            remote
            reserve-keyword
            placeholder="请输入单位名称"
            :remote-method="filterClientOptions"
            :loading="state.clientLoading"
            @visible-change="handleClientDropdownVisible"
          >
            <el-option
              v-for="item in clientOptions"
              :key="item.id"
              :label="item.companyName"
              :value="item.companyName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="收款人">
          <el-input v-model="filters.collectionUserName" clearable placeholder="请输入收款人" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="收款账户">
          <el-select
            v-model="filters.accountId"
            clearable
            filterable
            remote
            reserve-keyword
            placeholder="请选择收款账户"
            :remote-method="loadAccounts"
          >
            <el-option v-for="item in accountOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起始时间">
          <el-date-picker
            v-model="filters.createTime"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="请选择开始日期"
            end-placeholder="请选择结束日期"
          />
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" :icon="Search" @click="searchData">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </PageBlock>

    <PageBlock>
      <div class="table-toolbar">
        <div class="toolbar-actions">
          <el-button type="primary" :icon="Plus" @click="openCreate">添加</el-button>
          <el-button :icon="Download" :loading="state.exporting" @click="exportData">导出</el-button>
        </div>
        <div class="summary-bar">
          <span>收款合计：<strong>{{ formatMoney(totals.moneyTotal) }}</strong></span>
          <span>折让合计：<strong>{{ formatMoney(totals.allowanceMoneyTotal) }}</strong></span>
        </div>
      </div>

      <el-table v-loading="state.loading" :data="rows" border @row-dblclick="openDetail">
        <el-table-column prop="orderId" label="收款单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="companyName" label="单位名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" label="收款时间" min-width="170" />
        <el-table-column prop="collectionUserName" label="收款人" min-width="110" />
        <el-table-column prop="accountName" label="收款账户" min-width="120" />
        <el-table-column label="收款金额" min-width="120">
          <template #default="{ row }">{{ formatMoney(row.money) }}</template>
        </el-table-column>
        <el-table-column label="折让" min-width="120">
          <template #default="{ row }">{{ formatMoney(row.allowanceMoney) }}</template>
        </el-table-column>
        <el-table-column prop="digest" label="摘要" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Printer" @click="printRow(row)">打印</el-button>
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
            <el-button type="danger" link @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="filters.pageNum"
          v-model:page-size="filters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 30, 50]"
          :total="state.total"
          @current-change="loadData"
          @size-change="searchData"
        />
      </div>
    </PageBlock>

    <el-dialog
      v-model="formVisible"
      title="新增收款信息"
      width="92%"
      class="receipt-form-dialog"
      destroy-on-close
    >
      <div class="receipt-form-content">
        <PageBlock>
          <h3 class="section-title">收款信息</h3>
          <el-form class="receipt-form" :model="form" label-width="80px" size="small">
            <el-form-item label="单位名称" required>
              <el-select
                v-model="form.cooperativeClientId"
                clearable
                filterable
                remote
                reserve-keyword
                placeholder="请输入单位名称"
                :remote-method="filterClientOptions"
                :loading="state.clientLoading"
                @visible-change="handleClientDropdownVisible"
                @change="handleClientChange"
              >
                <el-option v-for="item in clientOptions" :key="item.id" :label="item.companyName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="收款时间" required>
              <el-date-picker
                v-model="form.collectionTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择收款时间"
              />
            </el-form-item>
            <el-form-item label="收款账户" required>
              <el-select
                v-model="form.accountId"
                clearable
                filterable
                remote
                reserve-keyword
                placeholder="请选择收款账户"
                :remote-method="loadAccounts"
                @change="handleAccountChange"
              >
                <el-option v-for="item in accountOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="收款金额">
              <el-input :model-value="formatMoney(formMoneyTotal)" disabled />
            </el-form-item>
            <el-form-item label="折让金额">
              <el-input :model-value="formatMoney(formAllowanceTotal)" disabled />
            </el-form-item>
            <el-form-item label="收款凭证">
              <el-upload action="#" accept="image/*" :show-file-list="false" :http-request="uploadProof">
                <el-button :icon="Upload">选择文件</el-button>
              </el-upload>
              <span class="upload-tip">{{ form.proofImg ? `` : '未选择任何文件' }}</span>
              <el-image v-if="form.fileUrl" class="preview-image" :src="form.fileUrl" :preview-src-list="[form.fileUrl]" fit="cover" preview-teleported />
            </el-form-item>
            <el-form-item label="摘要" class="wide">
              <el-input v-model="form.digest" type="textarea" :rows="1" placeholder="请输入摘要" />
            </el-form-item>
          </el-form>
        </PageBlock>

        <PageBlock>
          <div class="section-head">
            <h3 class="section-title">收款明细</h3>
            <span class="order-selection-tip">已选 {{ form.listOrder.length }} 单，点击行可选择或取消</span>
          </div>
          <el-form v-if="form.cooperativeClientId" class="dialog-search" :model="orderFilters" label-width="70px" size="small">
            <el-form-item label="订单号">
              <el-input v-model="orderFilters.orderNo" clearable placeholder="请输入订单号" @keyup.enter="searchSelectableOrders" />
            </el-form-item>
            <el-form-item label="产品名称">
              <el-input v-model="orderFilters.productInfo" clearable placeholder="请输入产品信息" @keyup.enter="searchSelectableOrders" />
            </el-form-item>
            <el-form-item class="dialog-actions" label-width="0">
              <el-button type="primary" :icon="Search" @click="searchSelectableOrders">查询</el-button>
              <el-button :icon="Refresh" @click="resetSelectableOrders">重置</el-button>
            </el-form-item>
          </el-form>
          <el-table
            v-loading="orderState.loading"
            :data="selectableOrders"
            class="receipt-orders-table"
            row-key="orderId"
            :row-class-name="orderRowClassName"
            :empty-text="form.cooperativeClientId ? '暂无订单' : '请先选择单位名称'"
            max-height="400"
            border
            @row-click="toggleOrderRow"
          >
            <el-table-column width="52" fixed="left" align="center">
              <template #default="{ row }">
                <div @click.stop>
                  <el-checkbox :model-value="row.checked" :aria-label="`选择订单 ${row.orderNo}`" @change="setOrderChecked(row, $event)" />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="orderNo" label="订单号" min-width="150" show-overflow-tooltip />
            <el-table-column prop="orderTime" label="订单时间" min-width="160" />
            <el-table-column prop="fillUserName" label="填单员" min-width="100" />
            <el-table-column prop="productInfo" label="产品信息" min-width="180" show-overflow-tooltip />
            <el-table-column label="应收金额" min-width="120">
              <template #default="{ row }">{{ formatMoney(row.billMoney) }}</template>
            </el-table-column>
            <el-table-column label="已收金额" min-width="120">
              <template #default="{ row }">{{ formatMoney(row.receivedMoney) }}</template>
            </el-table-column>
            <el-table-column label="已折让金额" min-width="120">
              <template #default="{ row }">{{ formatMoney(row.receivedAllowanceMoney) }}</template>
            </el-table-column>
            <el-table-column label="剩余尾款" min-width="120">
              <template #default="{ row }">{{ formatMoney(row.remainMoney) }}</template>
            </el-table-column>
            <el-table-column label="订单状态" min-width="110">
              <template #default="{ row }">{{ orderStatusMap[Number(row.orderStatus)] || row.orderStatus || '-' }}</template>
            </el-table-column>
            <el-table-column label="本次收款" width="160" fixed="right">
              <template #default="{ row }">
                <div v-if="row.checked" @click.stop>
                  <el-input-number v-model="row.money" :min="0" :precision="2" size="small" controls-position="right" />
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="本次折让" width="160" fixed="right">
              <template #default="{ row }">
                <div v-if="row.checked" @click.stop>
                  <el-input-number v-model="row.currentAllowanceMoney" :min="0" :precision="2" size="small" controls-position="right" />
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="form.cooperativeClientId" class="pagination-wrap">
            <el-pagination
              v-model:current-page="orderFilters.pageNum"
              v-model:page-size="orderFilters.pageSize"
              background
              layout="total, sizes, prev, pager, next"
              :page-sizes="[10, 20, 30, 50]"
              :total="orderState.total"
              @current-change="loadSelectableOrders"
              @size-change="searchSelectableOrders"
            />
          </div>
        </PageBlock>
      </div>
      <template #footer>
        <div class="form-footer">
          <div class="form-total">
            收款合计：<strong>{{ formatMoney(formMoneyTotal) }}</strong>
            <span>折让合计：<strong>{{ formatMoney(formAllowanceTotal) }}</strong></span>
          </div>
          <div>
            <el-button @click="formVisible = false">取消</el-button>
            <el-button type="primary" :loading="state.saving" @click="saveReceipt">保存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="收款详情" width="88%" destroy-on-close>
      <div v-loading="state.detailLoading">
        <dl v-if="detailData" class="detail-grid">
          <div><dt>收款单号</dt><dd>{{ detailData.orderId }}</dd></div>
          <div><dt>单位名称</dt><dd>{{ detailData.companyName }}</dd></div>
          <div><dt>收款时间</dt><dd>{{ detailData.collectionTime }}</dd></div>
          <div><dt>收款人</dt><dd>{{ detailData.createTenantUserName }}</dd></div>
          <div><dt>收款账户</dt><dd>{{ detailData.accountName }}</dd></div>
          <div><dt>收款金额</dt><dd>{{ formatMoney(detailData.money) }}</dd></div>
          <div><dt>折让金额</dt><dd>{{ formatMoney(detailData.allowanceMoney) }}</dd></div>
          <div><dt>摘要</dt><dd>{{ detailData.digest || '-' }}</dd></div>
          <div class="detail-field full">
            <span>收款凭证</span>
            <div class="detail-images">
              <el-image
                  v-if="detailData?.proofImgUrl"
                  class="detail-image"
                  :src="detailData?.proofImgUrl"
                  :preview-src-list="[detailData?.proofImgUrl]"
                  fit="cover"
                  preview-teleported
              />
              <span v-else>-</span>
            </div>
          </div>
        </dl>
        <el-table v-if="detailData" :data="detailData.listOrder" border>
          <el-table-column prop="orderNo" label="订单号" min-width="150" />
          <el-table-column prop="orderTime" label="订单时间" min-width="160" />
          <el-table-column prop="fillUserName" label="填单员" />
          <el-table-column prop="productInfo" label="产品信息" min-width="180" show-overflow-tooltip />
          <el-table-column label="应收金额"><template #default="{ row }">{{ formatMoney(row.billMoney) }}</template></el-table-column>
          <el-table-column label="已收金额"><template #default="{ row }">{{ formatMoney(row.receivedMoney) }}</template></el-table-column>
          <el-table-column label="已折让金额"><template #default="{ row }">{{ formatMoney(row.receivedAllowanceMoney) }}</template></el-table-column>
          <el-table-column label="剩余尾款"><template #default="{ row }">{{ formatMoney(row.remainMoney) }}</template></el-table-column>
          <el-table-column label="本次收款"><template #default="{ row }">{{ formatMoney(row.money) }}</template></el-table-column>
          <el-table-column label="本次折让"><template #default="{ row }">{{ formatMoney(row.currentAllowanceMoney) }}</template></el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.receipts-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 20px;
}

.search-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 14px 24px;
}

.search-form :deep(.el-form-item),
.dialog-search :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-input),
.search-form :deep(.el-select),
.search-form :deep(.el-date-editor.el-input),
.search-form :deep(.el-date-editor--daterange),
.receipt-form :deep(.el-input),
.receipt-form :deep(.el-select),
.receipt-form :deep(.el-date-editor.el-input) {
  width: 100%;
}

.search-actions {
  grid-column: 1 / -1;
  justify-self: end;
}

.table-toolbar,
.section-head,
.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.toolbar-actions,
.summary-bar,
.form-total {
  display: flex;
  align-items: center;
  gap: 18px;
}

.summary-bar strong,
.form-total strong {
  color: #ff3b59;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.receipt-form-dialog :deep(.el-dialog__body) {
  max-height: 68vh;
  overflow: auto;
  background: #f5f7fb;
}

.receipt-form-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
}

.section-head {
  margin-bottom: 10px;
}

.section-head .section-title {
  margin-bottom: 0;
}

.order-selection-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.receipt-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 16px;
}

.receipt-form :deep(.el-form-item) {
  min-width: 0;
  margin-bottom: 0;
}

.receipt-form .wide {
  grid-column: 1 / -1;
}

.receipt-form .preview-image {
  width: 32px;
  height: 32px;
  margin-left: 8px;
}

.receipt-orders-table :deep(.el-table__row) {
  cursor: pointer;
}

.receipt-orders-table :deep(.is-selected-order) {
  --el-table-tr-bg-color: var(--el-color-primary-light-9);
  --el-table-row-hover-bg-color: var(--el-color-primary-light-8);
}

.receipt-orders-table :deep(.el-input-number) {
  width: 100%;
}

.upload-name {
  margin-left: 12px;
  color: #606266;
}

.dialog-search {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  gap: 10px 16px;
  margin-bottom: 12px;
}

.dialog-actions {
  align-self: end;
  justify-self: end;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 12px 20px;
  margin: 0 0 18px;
  padding: 18px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.detail-grid div {
  display: flex;
  gap: 10px;
}

.detail-grid dt {
  color: #909399;
}

.detail-grid dd {
  margin: 0;
  font-weight: 600;
}

@media (max-width: 1100px) {
  .search-form,
  .dialog-search {
    grid-template-columns: 1fr;
  }

  .receipt-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-actions,
  .dialog-actions {
    justify-self: start;
  }

  .table-toolbar,
  .form-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .receipt-form {
    grid-template-columns: 1fr;
  }
}
</style>
