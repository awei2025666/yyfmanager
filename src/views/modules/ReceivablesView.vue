<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  exportTenantReceivableClient,
  exportTenantReceivableOrder,
  getTenantOrderDetail,
  getTenantReceivableClientList,
  getTenantReceivableClientTotal,
  getTenantReceivableOrderList,
  getTenantReceivableOrderTotal,
  searchTenantClients
} from '../../api/tenant'

const props = defineProps({
  initialTab: {
    type: String,
    default: 'orders'
  }
})

const activeTab = ref(props.initialTab === 'units' ? 'units' : 'orders')

const orderFilters = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  companyName: '',
  fillUserName: '',
  orderTime: []
})

const unitFilters = reactive({
  pageNum: 1,
  pageSize: 10,
  companyName: '',
  linkman: '',
  salesmanName: ''
})

const detailFilters = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: ''
})

const state = reactive({
  loading: false,
  totalLoading: false,
  exporting: false,
  detailLoading: false,
  craftLoading: false,
  clientLoading: false,
  total: 0,
  detailTotal: 0
})

const totals = reactive({
  billMoney: 0,
  receivedMoney: 0,
  allowanceMoney: 0,
  remainMoney: 0
})

const rows = ref([])
const allClientOptions = ref([])
const clientOptions = ref([])
const detailRows = ref([])
const currentUnit = ref(null)
const detailVisible = ref(false)
const loadedCraftOrderIds = ref(new Set())

const orderStatusMap = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回'
}

const craftStatusMap = {
  1: '待生产',
  2: '已生产'
}

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return payload?.records || payload?.list || payload?.rows || payload?.data?.records || payload?.data?.list || payload?.data?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? payload?.data?.total ?? normalizedRows.length) || 0
}

const pickNumber = (row = {}, keys = []) => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return Number(value) || 0
  }
  return 0
}

const moneyText = (value) =>
  `￥${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

const statusText = (value) => orderStatusMap[Number(value)] || value || '-'
const craftStatusText = (value) => craftStatusMap[Number(value)] || value || '-'

const statusClass = (value) => {
  const text = statusText(value)
  if (['待审批', '待生产', '生产中'].includes(text)) return 'status-warning'
  if (['待配送', '配送中'].includes(text)) return 'status-primary'
  if (text === '已完成') return 'status-success'
  if (text === '已驳回') return 'status-danger'
  return ''
}

const craftStatusClass = (value) => (craftStatusText(value) === '已生产' ? 'status-success' : 'status-danger')

const productText = (row = {}) => {
  const lists = [row.productList, row.products, row.productsList, row.orderProductList].find(Array.isArray) || []
  const names = lists
    .map((item) => item.productInfo || item.name || item.productName || item.productsName)
    .filter(Boolean)
  return row.productInfo || row.productName || row.productsName || names.join('、') || '-'
}

const normalizeCraftRows = (row = {}) => {
  const lists = [
    row.craftList,
    row.processList,
    row.productsCraftList,
    row.productCraftList,
    row.orderCraftList,
    row.processInfoList
  ].find(Array.isArray) || []

  return lists.map((item, index) => ({
    id: item.id || item.craftId || index,
    name: item.name || item.craftName || '-',
    unitPrice: pickNumber(item, ['unitPrice', 'price', 'productUnitPrice']),
    customerMoney: pickNumber(item, ['customerMoney', 'amount', 'money']),
    status: item.craftStatus ?? item.status,
    operator: item.operator || item.createUserName || item.tenantUserName || '-'
  }))
}

const normalizeCraftDetailRows = (detail = {}) =>
  listRows(detail.craftList)
    .map((item, index) => ({
      id: item.id || item.craftId || index,
      name: item.craftName || item.name || '-',
      unitPrice: pickNumber(item, ['unitPrice', 'price']),
      customerMoney: pickNumber(item, ['customerMoney', 'amount', 'money']),
      status: item.craftStatus ?? item.status,
      operator: item.operator || item.createUserName || item.tenantUserName || '-'
    }))

const normalizeOrderRow = (row = {}) => {
  const billMoney = pickNumber(row, ['billMoney', 'totalMoney', 'orderMoney', 'amount'])
  const receivedMoney = pickNumber(row, ['receivedMoney', 'receiveMoney', 'receiptMoney', 'received'])
  const allowanceMoney = pickNumber(row, ['allowanceMoney', 'discountMoney', 'discountAmount'])
  const remainValue = row.remainMoney ?? row.arrearsMoney ?? row.tailMoney ?? row.surplusMoney ?? row.remainingMoney ?? row.unpaid
  return {
    ...row,
    id: row.id || row.orderId,
    orderNo: row.orderNo || '-',
    companyName: row.companyName || row.customerName || row.customer || '-',
    orderTime: row.orderTime || row.createTime || '-',
    fillUserName: row.fillUserName || row.userName || row.filler || '-',
    productInfo: productText(row),
    billMoney,
    receivedMoney,
    allowanceMoney,
    remainMoney: remainValue === undefined || remainValue === null || remainValue === '' ? Math.max(billMoney - receivedMoney, 0) : Number(remainValue) || 0,
    status: row.status ?? row.orderStatus,
    craftRows: normalizeCraftRows(row)
  }
}

const normalizeUnitRow = (row = {}) => {
  const billMoney = pickNumber(row, ['billMoney', 'totalMoney', 'orderMoney', 'amount'])
  const receivedMoney = pickNumber(row, ['receivedMoney', 'receiveMoney', 'receiptMoney', 'received'])
  const allowanceMoney = pickNumber(row, ['allowanceMoney', 'discountMoney', 'discountAmount'])
  const remainValue = row.remainMoney ?? row.arrearsMoney ?? row.tailMoney ?? row.surplusMoney ?? row.remainingMoney ?? row.unpaid
  return {
    ...row,
    id: row.cooperativeClientId || row.clientId || row.id,
    companyName: row.companyName || row.customerName || row.customer || '-',
    billMoney,
    receivedMoney,
    allowanceMoney,
    remainMoney: remainValue === undefined || remainValue === null || remainValue === '' ? Math.max(billMoney - receivedMoney, 0) : Number(remainValue) || 0,
    linkman: row.linkman || row.contact || '-',
    phone: row.phone || row.linkPhone || '-',
    salesmanName: row.salesmanName || row.salesman || row.fillUserName || row.userName || '-'
  }
}

const orderQuery = () => {
  const [start, end] = orderFilters.orderTime || []
  return {
    pageNum: orderFilters.pageNum,
    pageSize: orderFilters.pageSize,
    orderNo: orderFilters.orderNo || undefined,
    companyName: orderFilters.companyName || undefined,
    fillUserName: orderFilters.fillUserName || undefined,
    orderTimeStart: start || undefined,
    orderTimeEnd: end || start || undefined
  }
}

const unitQuery = () => ({
  pageNum: unitFilters.pageNum,
  pageSize: unitFilters.pageSize,
  companyName: unitFilters.companyName || undefined,
  linkman: unitFilters.linkman || undefined,
  salesmanName: unitFilters.salesmanName || undefined
})

const detailQuery = () => ({
  pageNum: detailFilters.pageNum,
  pageSize: detailFilters.pageSize,
  cooperativeClientId: currentUnit.value?.cooperativeClientId,
  orderNo: detailFilters.orderNo || undefined
})

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

const applyTotals = (data = {}) => {
  totals.billMoney = pickNumber(data, ['billMoneyTotal', 'billMoney', 'totalMoney', 'orderMoneyTotal', 'amount'])
  totals.receivedMoney = pickNumber(data, ['receivedMoneyTotal', 'receivedMoney', 'receiveMoney', 'receiptMoneyTotal'])
  totals.allowanceMoney = pickNumber(data, ['allowanceMoneyTotal', 'allowanceMoney', 'discountMoneyTotal', 'discountAmountTotal'])
  totals.remainMoney = pickNumber(data, ['remainMoneyTotal', 'remainMoney', 'arrearsMoneyTotal', 'tailMoneyTotal', 'surplusMoneyTotal'])
}

const loadTotals = async () => {
  state.totalLoading = true
  try {
    const data =
      activeTab.value === 'orders'
        ? await getTenantReceivableOrderTotal()
        : await getTenantReceivableClientTotal()
    applyTotals(data || {})
  } catch {
    applyTotals({})
  } finally {
    state.totalLoading = false
  }
}

const loadData = async () => {
  state.loading = true
  try {
    const data =
      activeTab.value === 'orders'
        ? await getTenantReceivableOrderList(orderQuery())
        : await getTenantReceivableClientList(unitQuery())
    const normalizedRows = listRows(data).map(activeTab.value === 'orders' ? normalizeOrderRow : normalizeUnitRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '应收账款加载失败')
  } finally {
    state.loading = false
  }
}

const reloadPage = () => {
  loadTotals()
  loadData()
}

const searchData = () => {
  if (activeTab.value === 'orders') {
    orderFilters.pageNum = 1
  } else {
    unitFilters.pageNum = 1
  }
  reloadPage()
}

const resetFilters = () => {
  if (activeTab.value === 'orders') {
    Object.assign(orderFilters, {
      pageNum: 1,
      pageSize: 10,
      orderNo: '',
      companyName: '',
      fillUserName: '',
      orderTime: []
    })
  } else {
    Object.assign(unitFilters, {
      pageNum: 1,
      pageSize: 10,
      companyName: '',
      linkman: '',
      salesmanName: ''
    })
  }
  reloadPage()
}

const changeTab = (name) => {
  if (activeTab.value === name) return
  activeTab.value = name
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
    const blob =
      activeTab.value === 'orders'
        ? await exportTenantReceivableOrder(orderQuery())
        : await exportTenantReceivableClient(unitQuery())
    downloadBlob(blob, activeTab.value === 'orders' ? '应收账款-订单明细.xlsx' : '应收账款-单位明细.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    state.exporting = false
  }
}

const loadDetailOrders = async () => {
  if (!currentUnit.value) return
  state.detailLoading = true
  try {
    const data = await getTenantReceivableOrderList(detailQuery())
    const normalizedRows = listRows(data).map(normalizeOrderRow)
    detailRows.value = normalizedRows
    state.detailTotal = listTotal(data, normalizedRows)
    loadedCraftOrderIds.value = new Set()
  } catch (error) {
    detailRows.value = []
    state.detailTotal = 0
    ElMessage.error(error?.message || '单位明细详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

const loadOrderCrafts = async (row) => {
  const id = row.id || row.orderId || row.orderNo
  if (!id || loadedCraftOrderIds.value.has(String(id))) return
  state.craftLoading = true
  try {
    const detail = await getTenantOrderDetail(id)
    row.craftRows = normalizeCraftDetailRows(detail)
    loadedCraftOrderIds.value = new Set([...loadedCraftOrderIds.value, String(id)])
  } catch (error) {
    ElMessage.error(error?.message || '订单工艺加载失败')
  } finally {
    state.craftLoading = false
  }
}

const openUnitDetail = (row) => {
  currentUnit.value = row
  Object.assign(detailFilters, {
    pageNum: 1,
    pageSize: 10,
    orderNo: ''
  })
  detailVisible.value = true
  loadDetailOrders()
}

const searchDetail = () => {
  detailFilters.pageNum = 1
  loadDetailOrders()
}

const resetDetail = () => {
  Object.assign(detailFilters, {
    pageNum: 1,
    pageSize: 10,
    orderNo: ''
  })
  loadDetailOrders()
}

watch(activeTab, reloadPage)

onMounted(() => {
  loadClients()
  reloadPage()
})
</script>

<template>
  <div class="receivable-page">
    <PageBlock>
      <div class="tab-switch">
        <button type="button" :class="{ active: activeTab === 'orders' }" @click="changeTab('orders')">订单明细</button>
        <button type="button" :class="{ active: activeTab === 'units' }" @click="changeTab('units')">单位明细</button>
      </div>

      <el-form v-if="activeTab === 'orders'" class="search-form" :model="orderFilters" label-width="86px">
        <el-form-item label="订单号">
          <el-input v-model="orderFilters.orderNo" clearable placeholder="请输入订单号" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="单位名称">
          <el-select
            v-model="orderFilters.companyName"
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
        <el-form-item label="填单员">
          <el-input v-model="orderFilters.fillUserName" clearable placeholder="请输入填单员" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="orderFilters.orderTime"
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

      <el-form v-else class="search-form search-form--units" :model="unitFilters" label-width="86px">
        <el-form-item label="单位名称">
          <el-select
            v-model="unitFilters.companyName"
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
        <el-form-item label="联系人">
          <el-input v-model="unitFilters.linkman" clearable placeholder="请输入联系人" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="业务员">
          <el-input v-model="unitFilters.salesmanName" clearable placeholder="请输入业务员" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" :icon="Search" @click="searchData">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </PageBlock>

    <PageBlock class="table-card">
      <div class="table-toolbar">
        <el-button :icon="Download" :loading="state.exporting" @click="exportData">导出</el-button>
        <div class="stats-bar" v-loading="state.totalLoading">
          <span class="stats-item">账单金额：<strong>{{ moneyText(totals.billMoney) }}</strong></span>
          <span class="stats-item">已收金额：<strong>{{ moneyText(totals.receivedMoney) }}</strong></span>
          <span class="stats-item">折让金额：<strong>{{ moneyText(totals.allowanceMoney) }}</strong></span>
          <span class="stats-item">剩余尾款：<strong>{{ moneyText(totals.remainMoney) }}</strong></span>
        </div>
      </div>

      <el-table v-if="activeTab === 'orders'" v-loading="state.loading" :data="rows" border>
        <el-table-column prop="orderNo" label="订单号" min-width="150" show-overflow-tooltip />
        <el-table-column prop="companyName" label="单位名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="orderTime" label="订单时间" min-width="160" />
        <el-table-column prop="fillUserName" label="填单员" min-width="110" />
        <el-table-column prop="productInfo" label="产品信息" min-width="190" show-overflow-tooltip />
        <el-table-column label="账单金额" min-width="120">
          <template #default="{ row }">{{ moneyText(row.billMoney) }}</template>
        </el-table-column>
        <el-table-column label="已收金额" min-width="120">
          <template #default="{ row }">{{ moneyText(row.receivedMoney) }}</template>
        </el-table-column>
        <el-table-column label="折让金额" min-width="120">
          <template #default="{ row }">{{ moneyText(row.allowanceMoney) }}</template>
        </el-table-column>
        <el-table-column label="剩余尾款" min-width="120">
          <template #default="{ row }">{{ moneyText(row.remainMoney) }}</template>
        </el-table-column>
        <el-table-column label="订单状态" min-width="110">
          <template #default="{ row }">
            <span :class="statusClass(row.status)">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-table v-else v-loading="state.loading" :data="rows" border>
        <el-table-column prop="companyName" label="单位名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="账单金额" min-width="130">
          <template #default="{ row }">{{ moneyText(row.billMoney) }}</template>
        </el-table-column>
        <el-table-column label="已收金额" min-width="130">
          <template #default="{ row }">{{ moneyText(row.receivedMoney) }}</template>
        </el-table-column>
        <el-table-column label="折让金额" min-width="130">
          <template #default="{ row }">{{ moneyText(row.allowanceMoney) }}</template>
        </el-table-column>
        <el-table-column label="剩余尾款" min-width="130">
          <template #default="{ row }">{{ moneyText(row.remainMoney) }}</template>
        </el-table-column>
        <el-table-column prop="linkman" label="联系人" min-width="120" />
        <el-table-column prop="phone" label="联系方式" min-width="140" />
        <el-table-column prop="salesmanName" label="业务员" min-width="120" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openUnitDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-if="activeTab === 'orders'"
          v-model:current-page="orderFilters.pageNum"
          v-model:page-size="orderFilters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 30, 50]"
          :total="state.total"
          @current-change="loadData"
          @size-change="searchData"
        />
        <el-pagination
          v-else
          v-model:current-page="unitFilters.pageNum"
          v-model:page-size="unitFilters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 30, 50]"
          :total="state.total"
          @current-change="loadData"
          @size-change="searchData"
        />
      </div>
    </PageBlock>

    <el-dialog v-model="detailVisible" title="详情" width="88%" class="receivable-detail-dialog" destroy-on-close>
      <el-form class="detail-search" :model="detailFilters" label-width="86px">
        <el-form-item label="订单号">
          <el-input v-model="detailFilters.orderNo" clearable placeholder="请输入订单号" @keyup.enter="searchDetail" />
        </el-form-item>
        <el-form-item class="detail-search-actions">
          <el-button type="primary" :icon="Search" @click="searchDetail">查询</el-button>
          <el-button :icon="Refresh" @click="resetDetail">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="state.detailLoading" :data="detailRows" border @expand-change="(row, expanded) => expanded.length && loadOrderCrafts(row)">
        <el-table-column type="expand" width="46">
          <template #default="{ row }">
            <div v-if="row.craftRows.length" v-loading="state.craftLoading" class="craft-detail-list">
              <div v-for="craft in row.craftRows" :key="craft.id" class="craft-detail-row">
                <span>工艺名称：{{ craft.name }}</span>
                <span>产品单价：{{ moneyText(craft.unitPrice) }}</span>
                <span>客户金额：{{ moneyText(craft.customerMoney) }}</span>
                <span>
                  工艺状态：
                  <strong :class="craftStatusClass(craft.status)">{{ craftStatusText(craft.status) }}</strong>
                </span>
                <span>操作员：{{ craft.operator }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无工艺数据" :image-size="48" />
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="150" show-overflow-tooltip />
        <el-table-column prop="orderTime" label="订单时间" min-width="160" />
        <el-table-column prop="fillUserName" label="填单员" min-width="110" />
        <el-table-column prop="productInfo" label="产品信息" min-width="240" show-overflow-tooltip />
        <el-table-column label="账单金额" min-width="120">
          <template #default="{ row }">{{ moneyText(row.billMoney) }}</template>
        </el-table-column>
        <el-table-column label="已收金额" min-width="120">
          <template #default="{ row }">{{ moneyText(row.receivedMoney) }}</template>
        </el-table-column>
        <el-table-column label="折让金额" min-width="120">
          <template #default="{ row }">{{ moneyText(row.allowanceMoney) }}</template>
        </el-table-column>
        <el-table-column label="剩余尾款" min-width="120">
          <template #default="{ row }">{{ moneyText(row.remainMoney) }}</template>
        </el-table-column>
        <el-table-column label="订单状态" min-width="110">
          <template #default="{ row }">
            <span :class="statusClass(row.status)">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="detailFilters.pageNum"
          v-model:page-size="detailFilters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 30, 50]"
          :total="state.detailTotal"
          @current-change="loadDetailOrders"
          @size-change="searchDetail"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.receivable-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 20px;
}

.tab-switch {
  display: inline-flex;
  margin-bottom: 18px;
  border: 1px solid #1f6bff;
  border-radius: 4px;
  overflow: hidden;
}

.tab-switch button {
  min-width: 110px;
  height: 36px;
  border: 0;
  background: #ffffff;
  color: #1f6bff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.tab-switch button.active {
  background: #1f6bff;
  color: #ffffff;
}

.search-form,
.detail-search {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 14px 22px;
}

.search-form :deep(.el-form-item),
.detail-search :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-input),
.search-form :deep(.el-date-editor--daterange),
.detail-search :deep(.el-input) {
  width: 100%;
}

.search-actions,
.detail-search-actions {
  grid-column: 1 / -1;
  justify-self: end;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  margin-bottom: 14px;
}

.stats-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 16px;
  min-height: 32px;
  padding: 0 4px;
  color: #111111;
  font-weight: 700;
}

.stats-item {
  white-space: nowrap;
}

.stats-bar strong {
  color: #ff3152;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.status-warning {
  color: #ff9f1a;
}

.status-primary {
  color: #1f6bff;
}

.status-success {
  color: #22c55e;
}

.status-danger {
  color: #ff3152;
}

.receivable-detail-dialog :deep(.el-dialog__body) {
  padding-top: 18px;
}

.detail-search {
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #ebeef5;
}

.craft-detail-list {
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
}

.craft-detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 14px 28px;
  border-bottom: 1px solid #e5e7eb;
  color: #606266;
}

.craft-detail-row:last-child {
  border-bottom: 0;
}

@media (max-width: 900px) {
  .search-form,
  .detail-search {
    grid-template-columns: 1fr;
  }

  .table-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .stats-bar {
    justify-content: flex-start;
  }
}
</style>
