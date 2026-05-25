<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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
  getTenantUserInfo,
  getTenantOrderList,
  getWorkbenchOverview,
  getWorkbenchRealtimeCrafts,
  getWorkbenchRealtimeOrders,
  getWorkbenchRecentUpdates,
  getWorkbenchTrend
} from '../api/tenant'
import { getAvatarUrl, getNameInitial } from '../utils/userProfile'

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

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
  userName: '',
  avatar: localStorage.getItem('platform_avatar') || '',
  pendingOrderTotal: 0
})

const trendOptions = [
  { label: '近7日', value: 1 },
  { label: '近6月', value: 2 },
  { label: '近1年', value: 3 }
]

const pendingActions = [
  { label: '订单审批', icon: DocumentChecked, getBadge: () => state.pendingOrderTotal },
  { label: '产品工艺', icon: Files },
  { label: '外协订单', icon: DocumentCopy }
]

const quickActions = [
  { label: '新建订单', icon: DocumentChecked },
  { label: '新建客户', icon: Plus },
  { label: '新建收款', icon: Wallet },
  { label: '新建报销', icon: Memo },
  { label: '应收账款', icon: Connection },
  { label: '绩效统计', icon: TrendCharts }
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
  if (value === null || value === undefined || value === '') return '暂无上月数据'
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
    legend: { top: 8, right: 24, itemWidth: 28, itemHeight: 16, textStyle: { fontSize: 16 } },
    grid: { top: 72, left: 52, right: 52, bottom: 42 },
    xAxis: {
      type: 'category',
      data: state.trend.map((item) => item.day),
      axisTick: { alignWithLabel: true },
      axisLabel: { fontSize: 16 }
    },
    yAxis: [
      { type: 'value', axisLabel: { fontSize: 16 }, splitLine: { lineStyle: { color: '#d7d7d7' } } },
      { type: 'value', axisLabel: { fontSize: 16 }, splitLine: { show: false } }
    ],
    series
  }, true)
}

const loadData = async () => {
  try {
    const [userInfo, overview, trend, orders, updates, crafts, pendingOrders] = await Promise.all([
      getTenantUserInfo(),
      getWorkbenchOverview(),
      getWorkbenchTrend(trendType.value),
      getWorkbenchRealtimeOrders(),
      getWorkbenchRecentUpdates(),
      getWorkbenchRealtimeCrafts(),
      getTenantOrderList({ pageNum: 1, pageSize: 1, status: 1 })
    ])
    state.userName = userInfo?.name || ''
    state.avatar = getAvatarUrl(userInfo)
    state.overview = { ...state.overview, ...(overview || {}) }
    state.trend = trend || []
    state.orders = orders || []
    state.updates = updates || []
    state.crafts = crafts || []
    state.pendingOrderTotal = pendingOrders.total || 0
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
        <div class="welcome-avatar">
          <img v-if="state.avatar" :src="state.avatar" alt="头像" />
          <span v-else>{{ accountInitial }}</span>
        </div>
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
            <el-table :data="state.orders" empty-text="暂无实时订单">
              <el-table-column prop="orderId" label="订单号" min-width="150" />
              <el-table-column prop="companyName" label="单位名称" min-width="180" />
              <el-table-column prop="status" label="订单状态" min-width="120">
                <template #default="{ row }">
                  <span class="status-text">{{ orderStatus[row.status] || '待审批' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="90">
                <template #default>
                  <el-button link type="primary">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </PageBlock>

          <PageBlock title="产品工艺">
            <el-table :data="state.crafts" empty-text="暂无工艺看板数据">
              <el-table-column prop="companyName" label="单位名称" min-width="150" />
              <el-table-column prop="craftName" label="工艺名称" min-width="150" />
              <el-table-column label="工艺状态" min-width="120">
                <template #default="{ row }">
                  <span class="status-text produced">{{ craftStatus[row.craftStatus] || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="90">
                <template #default>
                  <el-button link type="primary">详情</el-button>
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
            <button v-for="item in pendingActions" :key="item.label" type="button">
              <span v-if="item.getBadge?.()">{{ item.getBadge() }}</span>
              <em><el-icon><component :is="item.icon" /></el-icon></em>
              <strong>{{ item.label }}</strong>
            </button>
          </div>
        </PageBlock>

        <PageBlock title="快捷功能" class="side-card side-card--quick">
          <div class="quick-grid">
            <button v-for="item in quickActions" :key="item.label" type="button">
              <em><el-icon><component :is="item.icon" /></el-icon></em>
              <strong>{{ item.label }}</strong>
            </button>
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
  gap: 16px;
}

.welcome-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 102px;
  padding: 24px 34px;
  border-radius: 6px;
  background: #ffffff;
}

.welcome-user {
  display: flex;
  align-items: center;
  gap: 22px;
}

.welcome-avatar {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #caa17d, #1f2933);
  color: #ffffff;
  font-size: 22px;
  font-weight: 800;
  overflow: hidden;
}

.welcome-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.welcome-user strong {
  font-size: 24px;
}

.welcome-panel p {
  margin: 0;
  color: #b8b8b8;
  font-size: 22px;
  font-weight: 700;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 370px;
  align-items: start;
  gap: 18px;
}

.dashboard-main,
.dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-side {
  min-width: 0;
}

.data-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 36px 0;
  border-top: 1px solid #eeeeee;
  border-bottom: 1px solid #eeeeee;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 24px;
  border-right: 1px solid #eeeeee;
}

.metric-item:last-child {
  border-right: 0;
}

.metric-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f4f6fb;
  color: #1764ff;
  font-size: 30px;
  flex: 0 0 auto;
}

.metric-item p {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
}

.metric-item strong {
  display: block;
  font-size: 32px;
  font-weight: 500;
  line-height: 1.15;
}

.metric-item span {
  display: block;
  margin-top: 8px;
  color: #20c35a;
  font-size: 16px;
}

.metric-item span.down {
  color: #ff4261;
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 28px;
}

.chart-head h3 {
  margin: 0;
  font-size: 26px;
}

.chart-box {
  height: 410px;
}

.bottom-tables {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.status-text {
  color: #ff8a00;
}

.status-text.produced {
  color: #22c55e;
}

.activity-list {
  display: grid;
  gap: 24px;
  color: #7a8594;
  font-size: 18px;
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

.side-card :deep(.page-block__head) {
  padding: 34px 42px 0;
}

.side-card :deep(.page-block__title) {
  font-size: 28px;
}

.side-card :deep(.page-block__body) {
  padding: 34px 42px 42px;
}

.side-more {
  border: 0;
  background: transparent;
  color: #1f66ff;
  font-size: 20px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.side-card--updates {
  min-height: 230px;
}

.side-card--todo {
  min-height: 238px;
}

.side-card--quick {
  min-height: 418px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 30px 22px;
}

.quick-grid button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  border: 0;
  min-height: 96px;
  padding: 0;
  background: transparent;
  color: #111111;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.quick-grid em {
  position: relative;
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f6f7f9;
  color: #202124;
  font-style: normal;
  font-size: 30px;
}

.quick-grid strong {
  max-width: 100%;
  color: #111111;
  font-size: 18px;
  line-height: 1.25;
  font-weight: 800;
  white-space: nowrap;
}

.quick-grid span {
  position: absolute;
  top: -10px;
  left: calc(50% - 42px);
  z-index: 1;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ff4261;
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  line-height: 30px;
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
