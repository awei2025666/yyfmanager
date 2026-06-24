<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Printer, Refresh, Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  getTenantOrderConsumables,
  getTenantOrderHandKept,
  getTenantOrderOutsourceInfo,
  getTenantOrderPrintUrl,
  getTenantOutsourceIncomingOrders,
  getTenantOutsourceOutgoingOrders
} from '../../api/tenant'

const props = defineProps({
  mode: {
    type: String,
    default: 'incoming',
    validator: (value) => ['incoming', 'outgoing'].includes(value)
  }
})

const statusOptions = [
  { label: '待审批', value: 1 },
  { label: '待生产', value: 2 },
  { label: '生产中', value: 3 },
  { label: '待配送', value: 4 },
  { label: '配送中', value: 5 },
  { label: '已完成', value: 6 },
  { label: '已驳回', value: 7 }
]

const statusText = (value) =>
  statusOptions.find((item) => Number(item.value) === Number(value))?.label || value || '-'
const craftStatusText = (value) => (Number(value) === 2 ? '已完成' : '待生产')

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  customer: '',
  supplier: '',
  sales: '',
  orderNo: '',
  status: '',
  orderTime: []
})

const state = reactive({
  loading: false,
  detailLoading: false,
  total: 0
})

const rows = ref([])
const activeMode = ref(props.mode)
const detailVisible = ref(false)
const detailCrafts = ref([])
const detailConsumables = ref([])
const detailHandKept = ref([])

const pageTitle = computed(() => (activeMode.value === 'incoming' ? '外协订单-转入的' : '外协订单-转出的'))
const supplierLabel = computed(() => (activeMode.value === 'incoming' ? '转单单位' : '接单单位'))
const listApi = computed(() => activeMode.value === 'incoming' ? getTenantOutsourceIncomingOrders : getTenantOutsourceOutgoingOrders)

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const moneyText = (value) =>
  `¥${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

const productInfoText = (row = {}) => {
  if (row.productInfo) return row.productInfo
  const products = row.productList || row.products || []
  if (!Array.isArray(products)) return row.productName || '-'
  return products.map((item) => item.productName || item.name || item.productInfo).filter(Boolean).join('、') || '-'
}

const outsourceCraftRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.craftList || payload?.crafts || payload?.records || payload?.list || payload?.rows || []
}

const consumableTypeLabels = {
  1: '系统入库',
  2: '手工出库',
  3: '订单消耗'
}

const normalizeCraftRow = (row = {}) => ({
  ...row,
  id: row.id || row.productsCraftId,
  productName: row.productName || row.productInfo || row.name || '-',
  craftName: row.craftName || row.name || '-',
  spec: row.spec || row.specification || '-',
  openNum: row.openNum ?? row.formatSize ?? '-',
  startPrice: row.startPrice ?? row.priceBase ?? 0,
  finishNum: row.finishNum ?? row.orderQuantity ?? 0,
  unit: row.unit || '-',
  price: row.price ?? row.unitPrice ?? 0
})

const normalizeConsumableRecord = (row = {}) => ({
  id: row.id || `${row.consumableName || row.name}-${row.createTime || row.num}`,
  name: row.consumableName || row.name || '-',
  type: consumableTypeLabels[Number(row.type)] || row.type || '-',
  num: row.num ?? row.quantity ?? 0,
  remark: row.remark || '-',
  operator: row.createUserName || row.operator || row.tenantUserName || '-',
  time: row.createTime || row.updateTime || '-'
})

const normalizeHandKeptRecord = (row = {}) => ({
  id: row.id || `${row.name || row.handKeptName || row.createTime || row.num}`,
  name: row.name || row.handKeptName || row.handName || '-',
  num: row.num ?? row.quantity ?? 0,
  remark: row.remark || '-',
  operator: row.createUserName || row.operator || row.tenantUserName || '-',
  time: row.createTime || row.updateTime || '-'
})

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.orderPrimaryId || row.orderDbId,
  detailId: row.orderPrimaryId || row.orderDbId || row.orderRecordId || row.id || row.orderId || row.orderNo,
  orderNo: row.orderId || row.orderNo || '-',
  customer: row.companyName || row.customer || '-',
  orderTime: row.orderTime || row.createTime || '-',
  supplier: activeMode.value === 'incoming'
    ? row.outTenantName || row.supplier || '-'
    : row.intoTenantName || row.supplier || '-',
  sales: row.fillUserName || row.userName || '-',
  productInfo: productInfoText(row),
  amount: row.totalMoney ?? row.payMoney ?? row.amount ?? 0,
  status: statusText(row.status || row.orderStatus),
  rawStatus: row.status || row.orderStatus
})

const queryPayload = () => {
  const [start, end] = filters.orderTime || []
  const payload = {
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    companyName: filters.customer || undefined,
    fillUserName: filters.sales || undefined,
    orderId: filters.orderNo || undefined,
    status: filters.status || undefined,
    createTimeStart: start || undefined,
    createTimeEnd: end || start || undefined
  }
  if (activeMode.value === 'incoming') {
    payload.outTenantName = filters.supplier || undefined
  } else {
    payload.intoTenantName = filters.supplier || undefined
  }
  return payload
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await listApi.value(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '外协订单列表加载失败')
  } finally {
    state.loading = false
  }
}

const searchData = () => {
  filters.pageNum = 1
  loadData()
}

const resetFilters = () => {
  Object.assign(filters, {
    pageNum: 1,
    pageSize: 10,
    customer: '',
    supplier: '',
    sales: '',
    orderNo: '',
    status: '',
    orderTime: []
  })
  loadData()
}

const changeMode = (mode) => {
  if (activeMode.value === mode) return
  activeMode.value = mode
  resetFilters()
}

const openDetail = async (row) => {
  const detailId = row.detailId || row.id || row.orderNo
  if (!detailId || detailId === '-') return ElMessage.error('缺少订单ID，无法查看详情')
  detailVisible.value = true
  state.detailLoading = true
  detailCrafts.value = []
  detailConsumables.value = []
  detailHandKept.value = []
  try {
    const [crafts, consumables, handKept] = await Promise.all([
      getTenantOrderOutsourceInfo(detailId),
      getTenantOrderConsumables(detailId).catch(() => []),
      getTenantOrderHandKept(detailId).catch(() => [])
    ])
    detailCrafts.value = outsourceCraftRows(crafts).map(normalizeCraftRow)
    detailConsumables.value = listRows(consumables).map(normalizeConsumableRecord)
    detailHandKept.value = listRows(handKept).map(normalizeHandKeptRecord)
  } catch (error) {
    ElMessage.error(error?.message || '外协详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

const printOrder = async (row) => {
  if (!row.id) return ElMessage.error('缺少订单ID，无法打印')
  try {
    const url = await getTenantOrderPrintUrl(row.id)
    if (url) window.open(url.url, '_blank')
  } catch (error) {
    ElMessage.error(error?.message || '打印地址获取失败')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="module-page">
    <PageBlock class="search-card">
      <div class="tab-switch">
        <button type="button" :class="{ active: activeMode === 'incoming' }" @click="changeMode('incoming')">
          转入订单
        </button>
        <button type="button" :class="{ active: activeMode === 'outgoing' }" @click="changeMode('outgoing')">
          转出订单
        </button>
      </div>
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="单位名称">
          <el-input v-model="filters.customer" clearable placeholder="请输入单位名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item :label="supplierLabel">
          <el-input v-model="filters.supplier" clearable :placeholder="`请输入${supplierLabel}`" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="业务员">
          <el-input v-model="filters.sales" clearable placeholder="请输入业务员" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="filters.orderNo" clearable placeholder="请输入订单号" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="filters.status" clearable placeholder="请选择订单状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单时间">
          <el-date-picker
            v-model="filters.orderTime"
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
        <strong>{{ pageTitle }}</strong>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="orderNo" label="订单号" min-width="130" />
        <el-table-column prop="customer" label="单位名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="orderTime" label="订单时间" min-width="160" />
        <el-table-column prop="sales" label="业务员" min-width="100" />
        <el-table-column prop="supplier" :label="supplierLabel" min-width="140" show-overflow-tooltip />
        <el-table-column prop="productInfo" label="产品信息" min-width="170" show-overflow-tooltip />
        <el-table-column label="订单金额" min-width="120">
          <template #default="{ row }">{{ moneyText(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" min-width="110" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="openDetail(row)">详情</el-button>
            <el-button v-if="activeMode === 'incoming'" type="primary" link :icon="Printer" @click="printOrder(row)">打印</el-button>
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
      v-model="detailVisible"
      title="外协详情"
      width="1180px"
      class="outsource-detail-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-loading="state.detailLoading" class="outsource-detail">
        <PageBlock title="工艺信息">
          <el-table :data="detailCrafts" border>
            <el-table-column prop="productName" label="产品名称" min-width="180" />
            <el-table-column prop="craftName" label="工艺名称" min-width="150" />
            <el-table-column prop="spec" label="规格" min-width="110" />
            <el-table-column prop="openNum" label="开数" min-width="110" />
            <el-table-column prop="startPrice" label="起价" min-width="110" />
            <el-table-column prop="finishNum" label="成品数量" min-width="120" />
            <el-table-column prop="unit" label="单位" min-width="100" />
            <el-table-column label="单价" min-width="110">
              <template #default="{ row }">{{ moneyText(row.price) }}</template>
            </el-table-column>
            <el-table-column label="工艺状态" min-width="110">
              <template #default="{ row }">{{ craftStatusText(row.craftStatus ?? row.status) }}</template>
            </el-table-column>
          </el-table>
        </PageBlock>

        <PageBlock title="耗材记录">
          <el-table :data="detailConsumables" border>
            <el-table-column prop="name" label="耗材名称" min-width="180" />
            <el-table-column prop="type" label="明细类型" min-width="150" />
            <el-table-column prop="num" label="数量" min-width="120" />
            <el-table-column prop="remark" label="备注" min-width="220" />
            <el-table-column prop="operator" label="操作员" min-width="140" />
            <el-table-column prop="time" label="操作时间" min-width="180" />
          </el-table>
        </PageBlock>

        <PageBlock title="手工记录">
          <el-table :data="detailHandKept" border>
            <el-table-column prop="name" label="手工名称" min-width="180" />
            <el-table-column prop="num" label="数量" min-width="120" />
            <el-table-column prop="remark" label="备注" min-width="220" />
            <el-table-column prop="operator" label="操作员" min-width="140" />
            <el-table-column prop="time" label="操作时间" min-width="180" />
          </el-table>
        </PageBlock>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">返回</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
.module-page {
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

.search-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 12px 20px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-input),
.search-form :deep(.el-select),
.search-form :deep(.el-date-editor.el-input) {
  width: 100%;
}

.search-actions {
  grid-column: 1 / -1;
  justify-self: end;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.outsource-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.outsource-detail-dialog :deep(.el-dialog__body) {
  max-height: 72vh;
  overflow: auto;
  background: #f5f7fb;
}

</style>
