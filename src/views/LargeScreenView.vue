<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getWorkbenchLargeScreenOrderList,
  getWorkbenchLargeScreenOrderStatistics
} from '../api/tenant'
import largeScreenHeader from '../assets/large-screen-header-tight.png'
import statusCardBg from '../assets/large-screen-status-card-bg-design.png'

const loading = ref(false)
const clockText = ref('')
const screenScale = reactive({
  x: 1,
  y: 1
})
const clockParts = reactive({
  date: '',
  week: '',
  hour: '00',
  minute: '00',
  second: '00'
})
const tenantName = ref('')
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
  status: normalizeStatus(row.status || row.orderStatus),
  statusValue: Number(row.status || row.orderStatus)
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

const canScrollRows = computed(() => rows.value.length > 8)
const scrollingRows = computed(() => (canScrollRows.value ? [...rows.value, ...rows.value] : rows.value))
const scrollStyle = computed(() => ({
  '--scroll-duration': `${Math.max(rows.value.length * 2.4, 16)}s`
}))

const screenShellStyle = computed(() => {
  const scale = screenScale.x
  const offsetX = 0
  const offsetY = Math.min(0, (window.innerHeight - 1080 * scale) / 2)
  return {
    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
  }
})

const orderStatusClass = (row = {}) => ({
  'status-done': row.statusValue === 6 || row.status === '已完成',
  'status-rejected': row.statusValue === 7 || row.status === '已驳回',
  'status-warning': [1, 2].includes(row.statusValue) || ['待审批', '待生产'].includes(row.status)
})

const moneyText = (value) =>
  `¥${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

const updateClock = () => {
  const now = new Date()
  const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
  const pad = (value) => String(value).padStart(2, '0')
  clockParts.date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  clockParts.week = week
  clockParts.hour = pad(now.getHours())
  clockParts.minute = pad(now.getMinutes())
  clockParts.second = pad(now.getSeconds())
  clockText.value = `${clockParts.date} ${clockParts.week} ${clockParts.hour}:${clockParts.minute}:${clockParts.second}`
}

const updateScreenScale = () => {
  screenScale.x = window.innerWidth / 1920
  screenScale.y = window.innerHeight / 1080
}

const applyStatistics = (data = {}) => {
  tenantName.value = data.tenantName || data.companyName || data.name || ''
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
      getWorkbenchLargeScreenOrderList({ pageNum: 1, pageSize: 20 })
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
  updateScreenScale()
  updateClock()
  loadScreen()
  window.addEventListener('resize', updateScreenScale)
  clockTimer = window.setInterval(updateClock, 1000)
  refreshTimer = window.setInterval(loadScreen, 60 * 1000)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreenScale)
  window.clearInterval(clockTimer)
  window.clearInterval(refreshTimer)
})
</script>

<template>
  <main class="screen-page" v-loading="loading">
    <section class="screen-shell" :style="screenShellStyle">
      <header class="screen-header">
        <img class="header-frame-image" :src="largeScreenHeader" alt="" aria-hidden="true" />
        <div class="screen-time" :aria-label="clockText">
          <span>{{ clockParts.date }}</span>
          <span>{{ clockParts.week }}</span>
          <span class="time-clock">
            {{ clockParts.hour }}:{{ clockParts.minute }}:<b :key="clockParts.second">{{ clockParts.second }}</b>
          </span>
        </div>
        <h1>{{ tenantName || '印刷ERP数据大屏' }}</h1>
      </header>

      <div class="total-panel">
        <span>订单总数量</span>
        <div class="digit-list">
          <strong v-for="(digit, index) in orderDigits" :key="`${digit}-${index}`">{{ digit }}</strong>
          <em>单</em>
        </div>
      </div>
      <div class="total-decor" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i>
        <span></span>
        <i></i><i></i><i></i><i></i><i></i>
      </div>

      <div class="status-grid">
        <article
          v-for="item in statusCards"
          :key="item.key"
          class="status-card"
          :class="{ warn: item.warn }"
          :style="{ backgroundImage: `url(${statusCardBg})` }"
        >
          <p>{{ item.label }}</p>
          <strong>{{ item.value }}</strong>
          <i class="status-card__foot"></i>
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
          <div class="screen-table__scroll" :class="{ 'is-scrolling': canScrollRows }" :style="scrollStyle">
            <div
              v-for="(row, index) in scrollingRows"
              :key="`${row.id || row.orderNo}-${index}`"
              class="screen-table__row"
            >
              <span>{{ row.orderNo }}</span>
              <span>{{ row.customer }}</span>
              <span>{{ row.orderTime }}</span>
              <span>{{ row.filler }}</span>
              <span>{{ row.productInfo }}</span>
              <span>{{ moneyText(row.amount) }}</span>
              <span class="order-status" :class="orderStatusClass(row)">{{ row.status }}</span>
            </div>
          </div>
        </div>
        <div v-else class="screen-empty">暂无数据</div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.screen-page {
  width: 100vw;
  height: 100vh;
  padding: 0;
  background: #040823;
  color: #ffffff;
  overflow: hidden;
}

.screen-shell {
  width: 1920px;
  min-height: 1080px;
  padding: 0 92px 0;
  border: 0;
  background:
    radial-gradient(circle at 50% 4%, rgba(26, 91, 214, 0.26), transparent 26%),
    linear-gradient(180deg, #061843 0%, #050b2a 46%, #03051d 100%);
  box-shadow: inset 0 0 72px rgba(0, 107, 255, 0.16);
  transform-origin: left top;
}

.screen-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 96px;
}

.header-frame-image {
  position: absolute;
  top: 0;
  left: 50%;
  width: 100%;
  height: 78px;
  object-fit: fill;
  object-position: center center;
  transform: translateX(-50%);
  filter: brightness(1.08) saturate(1.15);
  pointer-events: none;
}

.screen-header h1 {
  position: absolute;
  top: 39px;
  left: 50%;
  z-index: 2;
  margin: 0;
  min-width: min(43vw, 820px);
  padding: 0 92px;
  color: #ffffff;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0;
  text-shadow: 0 0 18px rgba(83, 165, 255, 0.7);
  text-align: center;
  line-height: 1;
  transform: translate(-50%, -50%);
}

.screen-time {
  position: absolute;
  left: 72px;
  top: 80px;
  z-index: 1;
  color: #f7fbff;
  font-size: 28px;
  font-weight: 500;
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.time-clock {
  display: inline-flex;
  align-items: baseline;
  white-space: nowrap;
}

.time-clock b {
  display: inline-block;
  min-width: 2ch;
  color: inherit;
  font-weight: 900;
  text-align: left;
  text-shadow: inherit;
  animation: second-tick 0.32s ease-out;
}

@keyframes second-tick {
  0% {
    transform: translateY(4px) scale(0.92);
    opacity: 0.45;
  }

  65% {
    transform: translateY(-1px) scale(1.08);
    opacity: 1;
  }

  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.total-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 18px 0 10px;
}

.total-panel > span,
.digit-list strong,
.digit-list em {
  display: inline-grid;
  place-items: center;
  min-width: 52px;
  height: 58px;
  border: 1px solid rgba(82, 163, 255, 0.65);
  background:
    linear-gradient(180deg, rgba(34, 113, 196, 0.86), rgba(11, 57, 122, 0.95)),
    radial-gradient(circle at 50% 0, rgba(75, 172, 255, 0.3), transparent 68%);
  color: #ffffff;
  box-shadow: inset 0 0 18px rgba(65, 158, 255, 0.28);
}

.total-panel > span {
  min-width: 170px;
  padding: 0 20px;
  font-size: 25px;
  font-weight: 900;
}

.digit-list {
  display: flex;
  gap: 9px;
}

.digit-list strong {
  font-size: 42px;
  line-height: 1;
  font-family: Impact, "Arial Narrow", "PingFang SC", sans-serif;
  font-weight: 900;
  text-shadow: 0 0 12px rgba(152, 211, 255, 0.46);
}

.digit-list em {
  min-width: 50px;
  font-style: normal;
  font-size: 24px;
  font-weight: 800;
}

.total-decor {
  display: grid;
  grid-template-columns: repeat(5, 26px) minmax(360px, 560px) repeat(5, 26px);
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin: 0 auto 40px;
}

.total-decor i,
.total-decor span {
  display: block;
  height: 4px;
  background: #1e82ca;
}

.total-decor i:nth-child(-n + 2),
.total-decor i:nth-last-child(-n + 2) {
  background: #fff25b;
}

.total-decor span {
  height: 2px;
  background: linear-gradient(90deg, rgba(40, 126, 217, 0.2), #2d6cd4 18%, #2d6cd4 82%, rgba(40, 126, 217, 0.2));
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 52px;
  margin: 0 42px 26px;
}

.status-card {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  aspect-ratio: 257 / 154;
  padding: 0;
  border: 0;
  background-color: transparent;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center;
  text-align: center;
  overflow: hidden;
}

.status-card.warn {
  filter: sepia(0.28) saturate(1.18) hue-rotate(350deg);
}

.status-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: transparent;
  pointer-events: none;
}

.status-card p {
  position: absolute;
  top: 13.6%;
  left: 0;
  z-index: 1;
  width: 100%;
  margin: 0;
  padding-bottom: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.status-card strong {
  position: absolute;
  top: 53.9%;
  left: 0;
  z-index: 2;
  color: #8dccff;
  display: block;
  width: 100%;
  font-size: 48px;
  font-family: Impact, "Arial Narrow", "PingFang SC", sans-serif;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 14px rgba(116, 196, 255, 0.5);
}

.status-card.warn strong {
  color: #fff39b;
}

.screen-table {
  margin: 26px 42px 0;
  background: rgba(7, 24, 69, 0.92);
  border: 1px solid rgba(39, 80, 165, 0.5);
  box-shadow: inset 0 0 18px rgba(32, 94, 185, 0.08);
}

.screen-table__head,
.screen-table__row {
  display: grid;
  grid-template-columns: 1.2fr 1.7fr 1.25fr 0.9fr 2.4fr 1fr 0.8fr;
  align-items: center;
}

.screen-table__head {
  min-height: 64px;
  background: #153985;
  color: #ffffff;
  font-size: 17px;
  font-weight: 900;
}

.screen-table__body {
  height: 520px;
  overflow: hidden;
}

.screen-table__scroll.is-scrolling {
  animation: table-scroll var(--scroll-duration) linear infinite;
}

.screen-table__row {
  height: 65px;
  border-top: 1px solid rgba(70, 103, 183, 0.35);
  color: rgba(245, 249, 255, 0.88);
  font-size: 15px;
  font-weight: 700;
}

.screen-table__head span,
.screen-table__row span {
  height: 100%;
  display: flex;
  align-items: center;
  border-right: 1px solid rgba(68, 103, 181, 0.24);
}

.screen-table__head span:last-child,
.screen-table__row span:last-child {
  border-right: 0;
}

.screen-table span {
  min-width: 0;
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-status {
  font-weight: 900;
}

.order-status.status-done {
  color: #44e37c;
  text-shadow: 0 0 10px rgba(68, 227, 124, 0.36);
}

.order-status.status-rejected {
  color: #ff5d68;
  text-shadow: 0 0 10px rgba(255, 93, 104, 0.38);
}

.order-status.status-warning {
  color: #ffd85a;
  text-shadow: 0 0 10px rgba(255, 216, 90, 0.34);
}

.screen-empty {
  display: grid;
  place-items: center;
  min-height: 520px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 18px;
  font-weight: 700;
}

@keyframes table-scroll {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-50%);
  }
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
