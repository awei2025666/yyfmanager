<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  Refresh,
  Calendar,
  CollectionTag,
  DataBoard,
  Histogram,
  OfficeBuilding,
  ShoppingCart
} from '@element-plus/icons-vue'
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

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

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
  { label: '近 7 日', value: 1 },
  { label: '近 6 月', value: 2 },
  { label: '近 1 年', value: 3 }
]

const stats = computed(() => [
  { label: '订单总数', value: state.overview.orderTotal, unit: '笔', icon: ShoppingCart, tint: 'blue' },
  { label: '订单金额', value: state.overview.orderMoneyTotal, unit: '元', icon: Histogram, tint: 'orange' },
  { label: '工艺总数', value: state.overview.craftTotal, unit: '', icon: CollectionTag, tint: 'pink' },
  { label: '合作客户总数', value: state.overview.tenantTotal, unit: '家', icon: OfficeBuilding, tint: 'green' }
])
const dashboardCards = computed(() => [
  { label: '实时订单', value: state.orders.length },
  { label: '最近动态', value: state.updates.length },
  { label: '展示客户', value: state.tenants.length }
])

const formatNumber = (value) => new Intl.NumberFormat('zh-CN').format(Number(value || 0))

const orderStatus = {
  1: '待支付',
  2: '支付成功',
  3: '支付失败'
}

const orderStatusType = {
  1: 'warning',
  2: 'success',
  3: 'danger'
}

const renderChart = () => {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { right: 0 },
    grid: { top: 36, left: 12, right: 14, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: state.trend.map((item) => item.day)
    },
    yAxis: [{ type: 'value' }, { type: 'value' }],
    series: [
      {
        name: '会员数量',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: state.trend.map((item) => item.tenantNum),
        lineStyle: { width: 3, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59,130,246,0.26)' },
            { offset: 1, color: 'rgba(59,130,246,0.04)' }
          ])
        }
      },
      {
        name: '订单金额',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: state.trend.map((item) => item.orderMoney),
        lineStyle: { width: 3, color: '#f97316' },
        itemStyle: { color: '#f97316' }
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
  <div class="page-stack">
    <section class="hero-banner">
      <div>
        <p>APRIL 2026</p>
        <h2>经营状态、会员趋势和最新订单都集中到一个工作台里。</h2>
        <span>
          当前展示来自生产接口的经营数据。
        </span>
      </div>
      <div class="hero-badges">
        <div class="hero-badge hero-badge--plain">
          <span class="source-pill">真实接口</span>
          <el-button :icon="Refresh" link type="primary" @click="loadData">刷新</el-button>
        </div>
        <div class="hero-badge"><el-icon><Calendar /></el-icon>今日更新 4 次</div>
        <div class="hero-badge"><el-icon><DataBoard /></el-icon>模块已扩展为多页面</div>
      </div>
    </section>

    <section class="stat-grid">
      <article v-for="item in stats" :key="item.label" class="stat-card" :class="item.tint">
        <div class="stat-card__head">
          <div>
            <p>{{ item.label }}</p>
            <strong>{{ formatNumber(item.value) }} <span>{{ item.unit }}</span></strong>
          </div>
          <el-icon class="stat-card__icon"><component :is="item.icon" /></el-icon>
        </div>
      </article>
    </section>

    <section class="mini-stat-grid">
      <article v-for="item in dashboardCards" :key="item.label" class="mini-stat-card">
        <p>{{ item.label }}</p>
        <strong>{{ formatNumber(item.value) }}</strong>
      </article>
    </section>

    <div class="dashboard-grid">
      <PageBlock title="会员与订单金额走势" subtitle="趋势监控">
        <template #extra>
          <el-segmented v-model="trendType" :options="trendOptions" />
        </template>
        <div ref="chartRef" class="chart-box" />
      </PageBlock>

      <PageBlock title="最近动态" subtitle="运营提醒">
        <el-timeline>
          <el-timeline-item
            v-for="item in state.updates"
            :key="`${item.time}-${item.content}`"
            :timestamp="item.time"
            type="primary"
          >
            {{ item.content }}
          </el-timeline-item>
        </el-timeline>
      </PageBlock>
    </div>

    <div class="dashboard-grid">
      <PageBlock title="实时订单" subtitle="订单监控">
        <div class="table-meta">当前展示 {{ state.orders.length }} 条</div>
        <el-table :data="state.orders" empty-text="暂无实时订单">
          <el-table-column prop="orderId" label="订单号" min-width="150" />
          <el-table-column prop="tenantName" label="单位名称" min-width="180" />
          <el-table-column prop="status" label="订单状态" min-width="110">
            <template #default="{ row }">
              <el-tag :type="orderStatusType[row.status]">{{ orderStatus[row.status] || '未知状态' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="90">
            <template #default="{ row }">
              <el-button link type="primary">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </PageBlock>

      <PageBlock title="产品工艺" subtitle="工艺看板">
        <div class="table-meta">当前展示 {{ state.tenants.length }} 条</div>
        <el-table :data="state.tenants" empty-text="暂无工艺看板数据">
          <el-table-column prop="tenantName" label="工艺名称" min-width="150">
            <template #default="{ row }">{{ ['双面光膜', '四色印刷', '双面哑膜', '单色印刷'][row.id ? row.id % 4 : 0] }}</template>
          </el-table-column>
          <el-table-column prop="tenantName" label="单位名称" min-width="180" />
          <el-table-column label="工艺状态" min-width="110">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '已生产' : '待生产' }}</el-tag>
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

    <div class="dashboard-grid">
      <PageBlock title="待办事项" subtitle="快速处理">
        <div class="todo-grid">
          <button class="todo-card">订单审批</button>
          <button class="todo-card">产品工艺</button>
          <button class="todo-card">外协订单</button>
        </div>
      </PageBlock>

      <PageBlock title="快捷功能" subtitle="常用入口">
        <div class="todo-grid">
          <button class="todo-card">新建订单</button>
          <button class="todo-card">新建客户</button>
          <button class="todo-card">新建收款</button>
          <button class="todo-card">新建报销</button>
          <button class="todo-card">应收账款</button>
          <button class="todo-card">绩效统计</button>
        </div>
      </PageBlock>
    </div>
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  padding: 28px 30px;
  border-radius: 30px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background:
    radial-gradient(circle at right top, rgba(40, 90, 255, 0.2), transparent 24%),
    linear-gradient(135deg, #ffffff 0%, #eef4ff 42%, #fff7f0 100%);
  box-shadow: 0 20px 50px rgba(40, 56, 85, 0.08);
}

.hero-banner p,
.stat-card p {
  margin: 0;
}

.hero-banner p {
  color: #6f7a8f;
  letter-spacing: 0.2em;
  font-size: 12px;
}

.hero-banner h2 {
  margin: 10px 0 0;
  max-width: 760px;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.18;
}

.hero-banner span {
  display: block;
  margin-top: 12px;
  color: #627088;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
}

.hero-badge--plain {
  gap: 10px;
}

.source-pill {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eef4ff;
  color: #2558d8;
  font-size: 13px;
  font-weight: 600;
}

.stat-grid,
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.stat-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.mini-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.mini-stat-card {
  padding: 18px 20px;
  border-radius: 22px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: rgba(255, 255, 255, 0.9);
}

.mini-stat-card p,
.mini-stat-card strong {
  margin: 0;
}

.mini-stat-card p {
  color: #6f7a8f;
}

.mini-stat-card strong {
  display: block;
  margin-top: 10px;
  font-size: 28px;
  color: #111827;
}

.stat-card {
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 50px rgba(40, 56, 85, 0.08);
}

.stat-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.stat-card strong {
  display: block;
  margin-top: 10px;
  font-size: 34px;
}

.stat-card span {
  font-size: 14px;
  color: #6f7a8f;
}

.stat-card__icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  font-size: 24px;
}

.blue .stat-card__icon {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.orange .stat-card__icon {
  background: rgba(249, 115, 22, 0.12);
  color: #f97316;
}

.green .stat-card__icon {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.pink .stat-card__icon {
  background: rgba(236, 72, 153, 0.12);
  color: #db2777;
}

.chart-box {
  height: 320px;
}

.table-meta {
  margin-bottom: 12px;
  color: #77829a;
}

.todo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.todo-card {
  border: 0;
  padding: 18px 12px;
  border-radius: 18px;
  background: #f5f8fe;
  font-size: 18px;
  color: #1f2c44;
}

@media (max-width: 1080px) {
  .stat-grid,
  .mini-stat-grid,
  .dashboard-grid,
  .todo-grid {
    grid-template-columns: 1fr;
  }

  .hero-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
