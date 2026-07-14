<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getTenantUserInfo,
  getWorkbenchHdpiConf,
  getWorkbenchLargeScreenOrderList,
  getWorkbenchLargeScreenOrderStatistics,
  updateWorkbenchHdpiContent
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
const bannerContent = ref('欢迎使用印刷ERP数据大屏')
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

const resolveTenantName = (data = {}) =>
  data.tenantName
  || data.companyName
  || data.name
  || data.tenant?.tenantName
  || localStorage.getItem('platform_tenant_name')
  || ''

const applyStatistics = (data = {}) => {
  tenantName.value = resolveTenantName(data) || tenantName.value
  stats.pendingApproval = pickNumber(data, ['waitApprovalTotal', 'pendingApproval', 'waitApprove', 'waitApproval', 'auditCount', 'approvalCount'])
  stats.pendingProduction = pickNumber(data, ['waitProductionTotal', 'pendingProduction', 'waitProduction', 'waitProduce', 'productionCount'])
  stats.pendingDelivery = pickNumber(data, ['waitDeliveryTotal', 'pendingDelivery', 'waitDelivery', 'deliveryWaitCount'])
  stats.delivering = pickNumber(data, ['inDeliveryTotal', 'delivering', 'deliverying', 'deliveryCount', 'inDeliveryCount'])
  stats.completed = pickNumber(data, ['completeTotal', 'completed', 'finish', 'finished', 'completedCount', 'finishCount'])
  stats.overdue = pickNumber(data, ['overdueTotal', 'overdue', 'expired', 'timeout', 'overdueCount', 'expiredCount'])
}

const applyHdpiContent = (data) => {
  if (typeof data === 'string') {
    bannerContent.value = data || bannerContent.value
    return
  }
  bannerContent.value = data?.content || data?.text || data?.value || bannerContent.value
}

const loadTenantName = async () => {
  if (tenantName.value) return
  try {
    const info = await getTenantUserInfo()
    tenantName.value = resolveTenantName(info)
    if (tenantName.value) localStorage.setItem('platform_tenant_name', tenantName.value)
  } catch (error) {
    tenantName.value = localStorage.getItem('platform_tenant_name') || tenantName.value
  }
}

const loadHdpiContent = async () => {
  try {
    const data = await getWorkbenchHdpiConf()
    applyHdpiContent(data)
  } catch (error) {
    ElMessage.error(error?.message || '大屏文字加载失败')
  }
}

const editBannerContent = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入大屏横幅文字', '编辑大屏文字', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValue: bannerContent.value,
      inputType: 'textarea',
      inputPlaceholder: '请输入横幅文字'
    })
    const content = String(value || '').trim()
    if (!content) return ElMessage.warning('请输入大屏文字')
    await updateWorkbenchHdpiContent({ content })
    bannerContent.value = content
    ElMessage.success('大屏文字已更新')
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '大屏文字保存失败')
  }
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
  loadTenantName()
}

onMounted(() => {
  updateScreenScale()
  updateClock()
  loadScreen()
  loadHdpiContent()
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
          {{ clockText }}
        </div>
        <h1>{{ tenantName || '印刷ERP数据大屏' }}</h1>
      </header>

      <button type="button" class="screen-banner" @click="editBannerContent">
        <div class="screen-banner__track">
          <span>{{ bannerContent }}</span>
          <span aria-hidden="true">{{ bannerContent }}</span>
        </div>
      </button>

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
          <span>订单时间</span>
          <span>填单员</span>
          <span>产品信息</span>
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
              <span>{{ row.orderTime }}</span>
              <span>{{ row.filler }}</span>
              <span>{{ row.productInfo }}</span>
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
  min-height: 104px;
  overflow: visible;
}

.header-frame-image {
  position: absolute;
  top: 4px;
  left: 50%;
  width: 100%;
  height: 90px;
  object-fit: fill;
  object-position: center center;
  transform: translateX(-50%);
  filter: brightness(1.08) saturate(1.15);
  pointer-events: none;
}

.screen-header h1 {
  position: absolute;
  top: 38px;
  left: 50%;
  z-index: 4;
  margin: 0;
  width: 860px;
  max-width: 46%;
  min-height: 42px;
  padding: 4px 36px;
  border: 1px solid rgba(75, 174, 255, 0.38);
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(5, 17, 54, 0.18), rgba(10, 44, 105, 0.58), rgba(5, 17, 54, 0.18));
  color: #ffffff;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0;
  text-shadow: 0 0 18px rgba(83, 165, 255, 0.7);
  text-align: center;
  line-height: 1.28;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transform: translateX(-50%);
}

.screen-time {
  position: absolute;
  left: 72px;
  top: 72px;
  z-index: 1;
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-shadow: 0 0 12px rgba(89, 159, 255, 0.28);
}

.screen-banner {
  position: relative;
  display: block;
  width: calc(100% - 84px);
  height: 106px;
  margin: 22px 42px 34px;
  padding: 0;
  border: 2px solid rgba(95, 191, 255, 0.82);
  border-radius: 4px;
  background:
    linear-gradient(90deg, rgba(0, 12, 42, 0.96), rgba(6, 52, 112, 0.9) 18%, rgba(3, 26, 76, 0.96) 50%, rgba(6, 52, 112, 0.9) 82%, rgba(0, 12, 42, 0.96)),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0 2px, transparent 2px 14px);
  color: #fff7b0;
  box-shadow:
    0 0 22px rgba(26, 155, 255, 0.42),
    inset 0 0 26px rgba(65, 179, 255, 0.34),
    inset 0 -10px 22px rgba(0, 0, 0, 0.28);
  overflow: hidden;
  cursor: pointer;
}

.screen-banner::before,
.screen-banner::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-top: 3px solid rgba(255, 237, 91, 0.84);
  border-bottom: 3px solid rgba(255, 237, 91, 0.84);
  pointer-events: none;
}

.screen-banner::after {
  inset: 0;
  border: 0;
  background:
    linear-gradient(90deg, rgba(4, 10, 35, 0.96), transparent 14%, transparent 86%, rgba(4, 10, 35, 0.96)),
    radial-gradient(circle at 8% 50%, rgba(255, 246, 160, 0.32), transparent 10%),
    radial-gradient(circle at 92% 50%, rgba(255, 246, 160, 0.32), transparent 10%);
}

.screen-banner__track {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  width: max-content;
  min-width: 200%;
  height: 100%;
  animation: banner-marquee 24s linear infinite;
}

.screen-banner__track span {
  min-width: 50%;
  padding: 0 88px;
  color: #fff7b0;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 0;
  white-space: nowrap;
  text-align: center;
  text-shadow:
    0 0 10px rgba(255, 226, 80, 0.68),
    0 0 22px rgba(255, 103, 28, 0.45);
}

.screen-banner:hover .screen-banner__track {
  animation-play-state: paused;
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
  grid-template-columns: 1.35fr 1.35fr 0.95fr 2.6fr 0.8fr;
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

@keyframes banner-marquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
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
