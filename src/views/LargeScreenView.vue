<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getWorkbenchLargeScreenOrderList,
  getWorkbenchLargeScreenOrderStatistics
} from '../api/tenant'

const loading = ref(false)
const clockText = ref('')
const rows = ref([])
const stats = reactive({
  total: 0,
  pendingApproval: 0,
  pendingProduction: 0,
  pendingDelivery: 0,
  delivering: 0,
  completed: 0,
  overdue: 0
})

let clockTimer
let refreshTimer

const statusLabels = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回',
  8: '已外协'
}

const pickNumber = (source = {}, keys = []) => {
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') return Number(value) || 0
  }
  return 0
}

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows = []) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? payload?.pageTotal ?? payload?.count ?? normalizedRows.length) || 0
}

const normalizeStatus = (value) => statusLabels[Number(value)] || value || '-'

const productInfoText = (row = {}) => {
  if (row.productInfo) return row.productInfo
  if (row.productName) return row.productName
  if (row.productsName) return row.productsName
  if (row.productNames) return row.productNames
  const products = row.products || row.productList || row.productsList || row.orderProductList || []
  if (!Array.isArray(products)) return '-'
  return (
    products
      .map((item) => item.productInfo || item.productName || item.name || item.productsName || item.products?.name)
      .filter(Boolean)
      .join('、') || '-'
  )
}

const normalizeOrder = (row = {}) => ({
  id: row.id || row.orderId || row.orderNo,
  orderNo: row.orderId || row.orderNo || row.no || '-',
  customer: row.companyName || row.customerName || row.cooperativeClientName || '-',
  orderTime: row.orderTime || row.createTime || '-',
  filler: row.fillUserName || row.userName || row.createTenantUserName || '-',
  productInfo: productInfoText(row),
  amount: Number(row.totalMoney ?? row.payMoney ?? row.money ?? row.amount ?? 0),
  status: normalizeStatus(row.status || row.orderStatus)
})

const orderDigits = computed(() =>
  String(Math.max(0, Number(stats.total || 0))).padStart(6, '0').split('')
)

const statusCards = computed(() => [
  { key: 'pendingApproval', label: '待审批', value: stats.pendingApproval },
  { key: 'pendingProduction', label: '待生产', value: stats.pendingProduction },
  { key: 'pendingDelivery', label: '待配送', value: stats.pendingDelivery },
  { key: 'delivering', label: '配送中', value: stats.delivering },
  { key: 'completed', label: '已完成', value: stats.completed },
  { key: 'overdue', label: '已逾期', value: stats.overdue, warn: true }
])

const moneyText = (value) =>
  `¥${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

const updateClock = () => {
  const now = new Date()
  const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
  const pad = (value) => String(value).padStart(2, '0')
  clockText.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${week} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const applyStatistics = (data = {}) => {
  stats.pendingApproval = pickNumber(data, ['waitApprovalTotal', 'pendingApproval', 'waitApprove', 'waitApproval', 'auditCount', 'approvalCount'])
  stats.pendingProduction = pickNumber(data, ['waitProductionTotal', 'pendingProduction', 'waitProduction', 'waitProduce', 'productionCount'])
  stats.pendingDelivery = pickNumber(data, ['waitDeliveryTotal', 'pendingDelivery', 'waitDelivery', 'deliveryWaitCount'])
  stats.delivering = pickNumber(data, ['inDeliveryTotal', 'delivering', 'deliverying', 'deliveryCount', 'inDeliveryCount'])
  stats.completed = pickNumber(data, ['completeTotal', 'completed', 'finish', 'finished', 'completedCount', 'finishCount'])
  stats.overdue = pickNumber(data, ['overdueTotal', 'overdue', 'expired', 'timeout', 'overdueCount', 'expiredCount'])
}

const loadScreen = async () => {
  loading.value = true
  try {
    const [statisticsData, listData] = await Promise.all([
      getWorkbenchLargeScreenOrderStatistics(),
      getWorkbenchLargeScreenOrderList({ pageNum: 1, pageSize: 10 })
    ])
    applyStatistics(statisticsData || {})
    const normalizedRows = listRows(listData).map(normalizeOrder)
    rows.value = normalizedRows
    stats.total = listTotal(listData, normalizedRows)
  } catch (error) {
    rows.value = []
    ElMessage.error(error?.message || '可视化大屏加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  updateClock()
  loadScreen()
  clockTimer = window.setInterval(updateClock, 30 * 1000)
  refreshTimer = window.setInterval(loadScreen, 60 * 1000)
})

onBeforeUnmount(() => {
  window.clearInterval(clockTimer)
  window.clearInterval(refreshTimer)
})
</script>

<template>
  <main class="screen-page" v-loading="loading">
    <section class="screen-shell">
      <header class="screen-header">
        <div class="screen-time">{{ clockText }}</div>
        <h1>印刷ERP数据大屏</h1>
        <div class="screen-weather">天气 --</div>
      </header>

      <div class="total-panel">
        <span>订单总数量</span>
        <div class="digit-list">
          <strong v-for="(digit, index) in orderDigits" :key="`${digit}-${index}`">{{ digit }}</strong>
          <em>单</em>
        </div>
      </div>

      <div class="status-grid">
        <article v-for="item in statusCards" :key="item.key" class="status-card" :class="{ warn: item.warn }">
          <p>{{ item.label }}</p>
          <strong>{{ item.value }}</strong>
        </article>
      </div>

      <section class="screen-table">
        <div class="screen-table__head">
          <span>订单号</span>
          <span>单位名称</span>
          <span>订单时间</span>
          <span>填单员</span>
          <span>产品信息</span>
          <span>订单金额</span>
          <span>订单状态</span>
        </div>
        <div v-if="rows.length" class="screen-table__body">
          <div v-for="row in rows" :key="row.id || row.orderNo" class="screen-table__row">
            <span>{{ row.orderNo }}</span>
            <span>{{ row.customer }}</span>
            <span>{{ row.orderTime }}</span>
            <span>{{ row.filler }}</span>
            <span>{{ row.productInfo }}</span>
            <span>{{ moneyText(row.amount) }}</span>
            <span>{{ row.status }}</span>
          </div>
        </div>
        <div v-else class="screen-empty">暂无数据</div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.screen-page {
  min-height: 100vh;
  padding: 26px;
  background: #eef0f4;
  color: #ffffff;
}

.screen-shell {
  min-height: calc(100vh - 52px);
  padding: 38px 58px 50px;
  border: 1px solid rgba(56, 125, 255, 0.45);
  background:
    radial-gradient(circle at 50% 0%, rgba(31, 113, 255, 0.22), transparent 30%),
    linear-gradient(180deg, #061334 0%, #050a24 52%, #030318 100%);
  box-shadow: inset 0 0 56px rgba(0, 133, 255, 0.18);
}

.screen-header {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 88px;
}

.screen-header::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 86px;
  border: 2px solid rgba(45, 119, 255, 0.78);
  clip-path: polygon(4% 0, 29% 0, 31% 58%, 69% 58%, 71% 0, 96% 0, 98% 38%, 74% 38%, 72% 96%, 28% 96%, 26% 38%, 2% 38%);
  opacity: 0.85;
}

.screen-header h1 {
  position: relative;
  margin: 0;
  padding: 0 140px;
  color: #ffffff;
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 0;
  text-shadow: 0 0 18px rgba(83, 165, 255, 0.7);
}

.screen-time,
.screen-weather {
  position: relative;
  z-index: 1;
  color: #f7fbff;
  font-size: 20px;
  font-weight: 700;
}

.screen-weather {
  text-align: right;
}

.total-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 26px 0 28px;
}

.total-panel > span,
.digit-list strong,
.digit-list em {
  display: inline-grid;
  place-items: center;
  min-width: 54px;
  height: 60px;
  border: 1px solid rgba(82, 163, 255, 0.65);
  background: linear-gradient(180deg, rgba(22, 91, 164, 0.8), rgba(13, 44, 98, 0.9));
  color: #ffffff;
  box-shadow: inset 0 0 18px rgba(65, 158, 255, 0.28);
}

.total-panel > span {
  min-width: 178px;
  padding: 0 22px;
  font-size: 25px;
  font-weight: 900;
}

.digit-list {
  display: flex;
  gap: 10px;
}

.digit-list strong {
  font-size: 42px;
  line-height: 1;
}

.digit-list em {
  min-width: 52px;
  font-style: normal;
  font-size: 24px;
  font-weight: 800;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 46px;
  margin: 36px 26px 26px;
}

.status-card {
  position: relative;
  min-height: 148px;
  padding: 20px 18px 16px;
  border: 1px solid rgba(105, 177, 255, 0.7);
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(8, 29, 75, 0.95), rgba(8, 38, 91, 0.75));
  text-align: center;
  overflow: hidden;
}

.status-card.warn {
  border-color: rgba(255, 226, 121, 0.75);
  background: linear-gradient(180deg, rgba(45, 37, 41, 0.94), rgba(77, 58, 35, 0.72));
}

.status-card::after {
  content: '';
  position: absolute;
  right: 12px;
  bottom: 28px;
  left: 12px;
  height: 24px;
  background: repeating-linear-gradient(120deg, rgba(55, 136, 235, 0.34) 0 14px, transparent 14px 22px);
  opacity: 0.55;
}

.status-card.warn::after {
  background: repeating-linear-gradient(120deg, rgba(255, 210, 79, 0.32) 0 14px, transparent 14px 22px);
}

.status-card p {
  position: relative;
  z-index: 1;
  margin: 0 0 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(114, 178, 255, 0.22);
  font-size: 20px;
  font-weight: 800;
}

.status-card strong {
  position: relative;
  z-index: 1;
  color: #8dccff;
  font-size: 42px;
  line-height: 1;
}

.status-card.warn strong {
  color: #fff39b;
}

.screen-table {
  margin: 26px 26px 0;
  background: rgba(8, 26, 75, 0.9);
  border: 1px solid rgba(55, 93, 176, 0.45);
}

.screen-table__head,
.screen-table__row {
  display: grid;
  grid-template-columns: 1.2fr 1.7fr 1.25fr 0.9fr 2.4fr 1fr 0.8fr;
  align-items: center;
}

.screen-table__head {
  min-height: 64px;
  background: rgba(21, 53, 132, 0.88);
  color: #ffffff;
  font-size: 17px;
  font-weight: 900;
}

.screen-table__row {
  min-height: 62px;
  border-top: 1px solid rgba(102, 134, 211, 0.32);
  color: rgba(245, 249, 255, 0.88);
  font-size: 15px;
  font-weight: 700;
}

.screen-table span {
  min-width: 0;
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.screen-empty {
  display: grid;
  place-items: center;
  min-height: 300px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 18px;
  font-weight: 700;
}

@media (max-width: 1280px) {
  .screen-shell {
    padding: 28px;
  }

  .status-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
  }
}
</style>
