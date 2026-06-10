<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  CollectionTag,
  Connection,
  DocumentChecked,
  DocumentCopy,
  Files,
  Histogram,
  Memo,
  OfficeBuilding,
  Plus,
  ShoppingCart,
  TrendCharts,
  Wallet
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import PageBlock from '../components/PageBlock.vue'
import {
  getWorkbenchOverview,
  getWorkbenchRealtimeCrafts,
  getWorkbenchRealtimeOrders,
  getWorkbenchRecentUpdates,
  getWorkbenchTrend
} from '../api/tenant'
import { getNameInitial } from '../utils/userProfile'

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const router = useRouter()
const trendType = ref(1)
const chartRef = ref(null)
let chart = null
const resizeChart = () => chart?.resize()

const state = reactive({
  overview: { orderTotal: 0, orderMoneyTotal: 0, cooperativeClientTotal: 0, craftTotal: 0 },
  trend: [],
  orders: [],
  updates: [],
  crafts: [],
  userName: localStorage.getItem('platform_account') || '',
  avatar: localStorage.getItem('platform_avatar') || '',
  pendingOrderTotal: 0
})

const trendOptions = [
  { label: '近7日', value: 1 },
  { label: '近6月', value: 2 },
  { label: '近1年', value: 3 }
]

const pendingActions = [
  { label: '订单审批', icon: DocumentChecked, getBadge: () => state.pendingOrderTotal, route: { name: 'orders', query: { status: 1 } } },
  { label: '产品工艺', icon: Files, route: { name: 'productCrafts' } },
  { label: '外协订单', icon: DocumentCopy, route: { name: 'outsourceIncoming' } }
]

const quickActions = [
  { label: '新建订单', icon: DocumentChecked, route: { name: 'orders', query: { mode: 'create' } } },
  { label: '新建客户', icon: Plus, route: { name: 'customers', query: { mode: 'create' } } },
  { label: '新建收款', icon: Wallet, route: { name: 'receipts', query: { mode: 'create' } } },
  { label: '新建报销', icon: Memo, route: { name: 'reimbursements', query: { mode: 'create' } } },
  { label: '应收账款', icon: Connection, route: { name: 'receivableOrders' } },
  { label: '绩效统计', icon: TrendCharts, route: { name: 'craftPerformance' } }
]

const currentAccount = computed(() => state.userName || localStorage.getItem('platform_account') || 'admin')
const accountInitial = computed(() => getNameInitial(currentAccount.value))

const stats = computed(() => [
  {
    label: '订单总数',
    value: state.overview.orderTotal,
    unit: '',
    icon: ShoppingCart,
    trend: state.overview.orderTotalRate
  },
  {
    label: '订单总金额',
    value: state.overview.orderMoneyTotal,
    unit: 'money',
    icon: Histogram,
    trend: state.overview.orderMoneyTotalRate
  },
  {
    label: '工艺总数',
    value: state.overview.craftTotal,
    unit: '',
    icon: CollectionTag,
    trend: state.overview.craftTotalRate
  },
  {
    label: '合作客户总数',
    value: state.overview.cooperativeClientTotal,
    unit: '',
    icon: OfficeBuilding,
    trend: state.overview.cooperativeClientTotalRate
  }
])

const formatNumber = (value) => new Intl.NumberFormat('zh-CN').format(Number(value || 0))

const formatTrend = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const number = Number(value)
  if (Number.isNaN(number)) return `${value} 较上月`
  const prefix = number > 0 ? '↑' : number < 0 ? '↓' : ''
  return `${prefix}${Math.abs(number).toFixed(2).replace(/\.?0+$/, '')}% 较上月`
}

const isTrendDown = (value) => Number(value) < 0

const orderStatus = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回'
}

const craftStatus = {
  1: '待生产',
  2: '已生产'
}

const normalizeRecentTime = (item) => item.time || item.createTime || item.updateTime || ''

const orderDetailId = (row = {}) => row.id || row.orderRecordId || row.orderDbId || row.orderPrimaryId || row.orderId || row.orderNo
const craftDetailId = (row = {}) => row.id || row.productsCraftId || row.productCraftId || row.craftId || row.orderCraftId

const openOrderDetail = (row = {}) => {
  const detailId = orderDetailId(row)
  router.push({
    name: 'orders',
    query: detailId ? { detailId } : {}
  })
}

const openCraftDetail = (row = {}) => {
  const detailId = craftDetailId(row)
  router.push({
    name: 'productCrafts',
    query: {
      ...(detailId ? { detailId } : {}),
      ...(row.orderId ? { orderId: row.orderId } : {})
    }
  })
}

const openDashboardAction = (item = {}) => {
  if (item.route) router.push(item.route)
}

const renderChart = () => {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  const hasOrderNum = state.trend.some((item) =>
    ['orderNum', 'orderCount', 'orderTotal'].some((key) => item[key] !== undefined && item[key] !== null)
  )
  const series = [
    hasOrderNum && {
      name: '订单数量',
      type: 'bar',
      barWidth: 34,
      data: state.trend.map((item) => item.orderNum ?? item.orderCount ?? item.orderTotal ?? 0),
      itemStyle: { color: '#2673f5' }
    },
    {
      name: '合作客户',
      type: 'bar',
      barWidth: 34,
      data: state.trend.map((item) => item.cooperativeClientNum ?? item.tenantNum ?? 0),
      itemStyle: { color: '#83b6f3' }
    },
    {
      name: '订单金额',
      type: 'line',
      smooth: false,
      yAxisIndex: 1,
      data: state.trend.map((item) => item.orderMoney ?? 0),
      lineStyle: { width: 3, color: '#5d99f6' },
      itemStyle: { color: '#5d99f6' }
    }
  ].filter(Boolean)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 8, right: 16, itemWidth: 24, itemHeight: 14, textStyle: { fontSize: 14 } },
    grid: { top: 64, left: 44, right: 44, bottom: 36 },
    xAxis: {
      type: 'category',
      data: state.trend.map((item) => item.day),
      axisTick: { alignWithLabel: true },
      axisLabel: { fontSize: 14 }
    },
    yAxis: [
      { type: 'value', axisLabel: { fontSize: 14 }, splitLine: { lineStyle: { color: '#d7d7d7' } } },
      { type: 'value', axisLabel: { fontSize: 14 }, splitLine: { show: false } }
    ],
    series
  }, true)
}

const loadData = async () => {
  try {
    const [overview, trend, orders, updates, crafts] = await Promise.all([
      getWorkbenchOverview(),
      getWorkbenchTrend(trendType.value),
      getWorkbenchRealtimeOrders(),
      getWorkbenchRecentUpdates({ pageNum: 1, pageSize: 3 }),
      getWorkbenchRealtimeCrafts()
    ])
    state.overview = { ...state.overview, ...(overview || {}) }
    state.trend = trend || []
    state.orders = orders || []
    state.updates = Array.isArray(updates) ? updates : updates?.records || []
    state.crafts = crafts || []
    state.pendingOrderTotal =
      overview?.pendingOrderTotal ??
      overview?.waitApproveOrderTotal ??
      overview?.approvalOrderTotal ??
      state.orders.filter((item) => Number(item.status) === 1).length
  } catch (error) {
    ElMessage.error(error?.message || '工作台数据加载失败')
  } finally {
    nextTick(renderChart)
  }
}

watch(trendType, loadData)

onMounted(() => {
  loadData()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>

<template>
  <div class="dashboard-page">
    <section class="welcome-panel">
      <div class="welcome-user">
        <el-avatar class="welcome-avatar" :size="48">
          <img v-if="state.avatar" :src="state.avatar" alt="头像" />
          <span v-else>{{ accountInitial }}</span>
        </el-avatar>
        <strong>{{ currentAccount }}，欢迎回来</strong>
      </div>
      <p>欢迎使用印刷ERP管理系统</p>
    </section>

    <div class="dashboard-layout">
      <main class="dashboard-main">
        <PageBlock title="数据一览">
          <div class="data-overview">
            <article v-for="item in stats" :key="item.label" class="metric-item">
              <el-icon class="metric-icon"><component :is="item.icon" /></el-icon>
              <div>
                <p>{{ item.label }}</p>
                <strong>{{ item.unit === 'money' ? `¥${formatNumber(item.value)}` : formatNumber(item.value) }}</strong>
                <span v-if="formatTrend(item.trend)" :class="{ down: isTrendDown(item.trend) }">{{ formatTrend(item.trend) }}</span>
              </div>
            </article>
          </div>

          <div class="chart-head">
            <h3>订单趋势</h3>
            <el-segmented v-model="trendType" :options="trendOptions" />
          </div>
          <div ref="chartRef" class="chart-box" />
        </PageBlock>

        <div class="bottom-tables">
          <PageBlock title="实时订单">
            <el-table :data="state.orders" empty-text="暂无实时订单" size="default">
              <el-table-column prop="orderId" label="订单号" min-width="150" />
              <el-table-column prop="companyName" label="单位名称" min-width="180" />
              <el-table-column prop="status" label="订单状态" min-width="120">
                <template #default="{ row }">
                  <span class="status-text">{{ orderStatus[row.status] || '待审批' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="90">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openOrderDetail(row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </PageBlock>

          <PageBlock title="产品工艺">
            <el-table :data="state.crafts" empty-text="暂无工艺看板数据" size="default">
              <el-table-column prop="companyName" label="单位名称" min-width="150" />
              <el-table-column prop="craftName" label="工艺名称" min-width="150" />
              <el-table-column label="工艺状态" min-width="120">
                <template #default="{ row }">
                  <span class="status-text produced">{{ craftStatus[row.craftStatus] || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="90">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openCraftDetail(row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </PageBlock>
        </div>
      </main>

      <aside class="dashboard-side">
        <PageBlock title="最近动态" class="side-card side-card--updates">
          <template #extra>
            <router-link :to="{ name: 'recentUpdates' }" class="side-more">查看更多</router-link>
          </template>
          <div class="activity-list">
            <div v-for="item in state.updates.slice(0, 3)" :key="`${item.time}-${item.content}`">
              <span>{{ item.content }}</span>
              <time>{{ normalizeRecentTime(item) }}</time>
            </div>
          </div>
        </PageBlock>

        <PageBlock title="待办事项" class="side-card side-card--todo">
          <div class="quick-grid compact">
            <el-button v-for="item in pendingActions" :key="item.label" text class="quick-action" @click="openDashboardAction(item)">
              <el-badge :value="item.getBadge?.()" :hidden="!item.getBadge?.()">
              <em><el-icon><component :is="item.icon" /></el-icon></em>
              </el-badge>
              <strong>{{ item.label }}</strong>
            </el-button>
          </div>
        </PageBlock>

        <PageBlock title="快捷功能" class="side-card side-card--quick">
          <div class="quick-grid">
            <el-button v-for="item in quickActions" :key="item.label" text class="quick-action" @click="openDashboardAction(item)">
              <em><el-icon><component :is="item.icon" /></el-icon></em>
              <strong>{{ item.label }}</strong>
            </el-button>
          </div>
        </PageBlock>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
}

.welcome-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 88px;
  padding: 20px 24px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  background: var(--el-bg-color);
}

.welcome-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-avatar {
  background: linear-gradient(135deg, #caa17d, #1f2933);
  color: var(--el-color-white);
  font-size: var(--el-font-size-base);
  font-weight: 800;
}

.welcome-user strong {
  font-size: var(--el-font-size-medium);
  line-height: 1.4;
}

.welcome-panel p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
}

.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: 12px;
}

.dashboard-main,
.dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-side {
  min-width: 0;
}

.data-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 16px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 72px;
  padding: 0 16px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.metric-item:last-child {
  border-right: 0;
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
  font-size: 20px;
  flex: 0 0 auto;
}

.metric-item p {
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
  font-weight: 600;
}

.metric-item strong {
  display: block;
  color: var(--el-text-color-primary);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.metric-item span {
  display: block;
  margin-top: 6px;
  color: var(--el-color-success);
  font-size: var(--el-font-size-extra-small);
}

.metric-item span.down {
  color: var(--el-color-danger);
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
}

.chart-head h3 {
  margin: 0;
  font-size: var(--el-font-size-medium);
  line-height: 1.4;
}

.chart-box {
  height: 300px;
}

.bottom-tables {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.status-text {
  color: var(--el-color-warning);
}

.status-text.produced {
  color: var(--el-color-success);
}

.activity-list {
  display: grid;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
}

.activity-list div {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 18px;
}

.activity-list span,
.activity-list time {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-more {
  color: var(--el-color-primary);
  font-size: var(--el-font-size-base);
  font-weight: 500;
  text-decoration: none;
}

.side-card--updates {
  min-height: 172px;
}

.side-card--todo {
  min-height: 184px;
}

.side-card--quick {
  min-height: 292px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 12px;
}

.quick-action {
  width: 100%;
  height: auto;
  min-height: 72px;
  padding: 0;
  color: var(--el-text-color-primary);
}

.quick-action :deep(> span) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.quick-grid em {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-style: normal;
  font-size: 20px;
}

.quick-grid strong {
  max-width: 100%;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
  line-height: 1.25;
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .bottom-tables {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .data-overview {
    grid-template-columns: 1fr;
  }

  .metric-item {
    min-height: 110px;
    border-right: 0;
    border-bottom: 1px solid #eeeeee;
  }
}
</style>
