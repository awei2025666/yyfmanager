<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Printer, Refresh, Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
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

const router = useRouter()

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
  total: 0
})

const rows = ref([])
const activeMode = ref(props.mode)

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
  router.push({ name: 'orders', query: { detailId } })
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

</style>
