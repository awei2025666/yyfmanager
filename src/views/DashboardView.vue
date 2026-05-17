<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { CollectionTag, Histogram, OfficeBuilding, ShoppingCart } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import PageBlock from '../components/PageBlock.vue'
import {
  getCraftList,
  getOverview,
  getRealtimeOrders,
  getRecentUpdates,
  getTenantList,
  getTrend
} from '../api/platform'

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const trendType = ref(1)
const chartRef = ref(null)
let chart = null
const resizeChart = () => chart?.resize()

const state = reactive({
  overview: { orderTotal: 0, orderMoneyTotal: 0, tenantTotal: 0, craftTotal: 219 },
  trend: [],
  orders: [],
  updates: [],
  tenants: []
})

const trendOptions = [
  { label: '近7日', value: 1 },
  { label: '近6月', value: 2 },
  { label: '近1年', value: 3 }
]

const stats = computed(() => [
  { label: '订单总数', value: state.overview.orderTotal, unit: '', icon: ShoppingCart, trend: '↑10.4%', good: true },
  { label: '订单总金额', value: state.overview.orderMoneyTotal, unit: 'money', icon: Histogram, trend: '↓0.03%', good: false },
  { label: '工艺总数', value: state.overview.craftTotal, unit: '', icon: CollectionTag, trend: '↑8.11%', good: true },
  { label: '合作客户总数', value: state.overview.tenantTotal, unit: '', icon: OfficeBuilding, trend: '↑20%', good: true }
])

const formatNumber = (value) => new Intl.NumberFormat('zh-CN').format(Number(value || 0))

const orderStatus = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回'
}

const renderChart = () => {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)

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
    series: [
      {
        name: '订单数量',
        type: 'bar',
        barWidth: 34,
        data: state.trend.map((item) => item.tenantNum),
        itemStyle: { color: '#2673f5' }
      },
      {
        name: '合作客户',
        type: 'bar',
        barWidth: 34,
        data: state.trend.map((item) => Math.max(0, Number(item.tenantNum || 0) + 70)),
        itemStyle: { color: '#83b6f3' }
      },
      {
        name: '订单金额',
        type: 'line',
        smooth: false,
        yAxisIndex: 1,
        data: state.trend.map((item) => item.orderMoney),
        lineStyle: { width: 3, color: '#5d99f6' },
        itemStyle: { color: '#5d99f6' }
      }
    ]
  })
}

const loadData = async () => {
  try {
    const [overview, trend, orders, updates, tenants, crafts] = await Promise.all([
      getOverview(),
      getTrend(trendType.value),
      getRealtimeOrders(),
      getRecentUpdates(),
      getTenantList({ pageNum: 1, pageSize: 5 }),
      getCraftList({ pageNum: 1, pageSize: 1 })
    ])
    state.overview = overview
    state.overview.craftTotal = crafts.total || 0
    state.trend = trend || []
    state.orders = orders || []
    state.updates = updates || []
    state.tenants = tenants.records || []
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
        <div class="welcome-avatar"></div>
        <strong>张*敏，欢迎回来</strong>
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
                <span :class="{ down: !item.good }">{{ item.trend }} 较上月</span>
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
              <el-table-column prop="tenantName" label="单位名称" min-width="180" />
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
            <el-table :data="state.tenants" empty-text="暂无工艺看板数据">
              <el-table-column label="工艺名称" min-width="150">
                <template #default="{ row }">{{ ['双面光膜', '四色印刷', '双面哑膜', '单色印刷'][row.id ? row.id % 4 : 0] }}</template>
              </el-table-column>
              <el-table-column prop="tenantName" label="单位名称" min-width="180" />
              <el-table-column label="工艺状态" min-width="120">
                <template #default="{ row }">
                  <span class="status-text produced">{{ row.status === 1 ? '已生产' : '待生产' }}</span>
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
        <PageBlock title="最近动态">
          <div class="activity-list">
            <div v-for="item in state.updates.slice(0, 3)" :key="`${item.time}-${item.content}`">
              <span>{{ item.content }}</span>
              <time>{{ item.time }}</time>
            </div>
          </div>
        </PageBlock>

        <PageBlock title="待办事项">
          <div class="quick-grid compact">
            <button><span>4</span>订单审批</button>
            <button>产品工艺</button>
            <button>外协订单</button>
          </div>
        </PageBlock>

        <PageBlock title="快捷功能">
          <div class="quick-grid">
            <button>新建订单</button>
            <button>新建客户</button>
            <button>新建收款</button>
            <button>新建报销</button>
            <button>应收账款</button>
            <button>绩效统计</button>
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
  border-radius: 50%;
  background: linear-gradient(135deg, #caa17d, #1f2933);
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
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
}

.dashboard-main,
.dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  gap: 18px;
  color: #7a8594;
  font-size: 18px;
}

.activity-list div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 18px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px 16px;
}

.quick-grid button {
  position: relative;
  border: 0;
  min-height: 84px;
  border-radius: 6px;
  background: #f6f7f9;
  font-size: 18px;
  font-weight: 700;
}

.quick-grid span {
  position: absolute;
  top: -10px;
  left: 12px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ff4261;
  color: #ffffff;
  line-height: 26px;
}

@media (max-width: 1500px) {
  .dashboard-layout,
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
