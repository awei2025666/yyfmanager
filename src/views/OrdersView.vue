<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Printer, Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import { getOrderList, getOrderTotal } from '../api/platform'

const route = useRoute()
const router = useRouter()

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  tenantName: '',
  userName: '',
  orderId: '',
  status: '',
  orderTime: ''
})

const autoApprove = ref(true)
const loading = ref(false)
const detailVisible = ref(false)
const editVisible = ref(false)
const approveVisible = ref(false)
const rejectVisible = ref(false)
const currentRecord = ref(null)
const approvalRemark = ref('')
const rejectRemark = ref('')
const viewMode = ref(route.query.mode === 'create' ? 'form' : 'list')
const currentStep = ref(1)

const formState = reactive({
  id: null,
  orderId: '',
  tenantName: '',
  userName: '',
  userPhone: '',
  createTime: '',
  deliveryType: '自提',
  address: '',
  productInfo: '',
  payMoney: 0,
  status: 1,
  printCode: '--',
  remark: ''
})

const statusMap = {
  1: { label: '待审批', type: 'danger' },
  2: { label: '待生产', type: 'warning' },
  3: { label: '生产中', type: 'warning' },
  4: { label: '待配送', type: 'primary' },
  5: { label: '配送中', type: 'primary' },
  6: { label: '已完成', type: 'success' },
  7: { label: '已驳回', type: 'danger' },
  8: { label: '已转外协', type: 'info' }
}

const rows = ref([])
const summary = reactive({
  orderTotal: 0,
  orderMoneyTotal: 0
})

const enrichOrderRow = (item = {}) => {
  const products = item.products?.length
    ? item.products
    : [
        {
          productName: item.vipName || '标准套餐',
          finishedSpec: '--',
          quantity: 1,
          unit: '份',
          amount: item.payMoney || 0
        }
      ]
  const crafts = item.crafts?.length
    ? item.crafts
    : [
        {
          productName: item.vipName || '标准套餐',
          craftName: '系统建单',
          spec: '--',
          openNum: 1,
          startPrice: '份',
          finishNum: 1,
          unit: '项',
          price: item.payMoney || 0,
          customerAmount: item.payMoney || 0,
          remark: item.remark || '来源于接口订单'
        }
      ]
  const timeline = item.timeline?.length
    ? item.timeline
    : [
        {
          date: item.createTime || '--',
          title: '创建订单',
          desc: `${item.userName || '系统'} 提交订单`
        }
      ]

  return {
    deliveryType: item.deliveryType || '系统下单',
    address: item.address || '--',
    productInfo: item.productInfo || item.vipName || '--',
    printCode: item.printCode || '--',
    remark: item.remark || '',
    ...item,
    products,
    crafts,
    timeline
  }
}

const stats = computed(() => {
  const totalMoney = Number(summary.orderMoneyTotal || 0)
  const pendingCount = rows.value.filter((item) => item.status === 1).length
  return {
    orderTotal: Number(summary.orderTotal || 0),
    orderMoneyTotal: totalMoney,
    pendingCount
  }
})
const activeFilters = computed(() =>
  [
    { key: 'tenantName', label: '单位名称', value: filters.tenantName },
    { key: 'userName', label: '业务员', value: filters.userName },
    { key: 'orderId', label: '订单号', value: filters.orderId },
    { key: 'status', label: '订单状态', value: filters.status === '' ? '' : statusMap[filters.status]?.label },
    { key: 'orderTime', label: '订单时间', value: filters.orderTime }
  ].filter((item) => item.value !== '' && item.value !== null && item.value !== undefined)
)
const localCards = computed(() => [
  { label: '当前页订单', value: rows.value.length },
  { label: '已完成', value: rows.value.filter((item) => item.status === 6).length },
  { label: '已驳回', value: rows.value.filter((item) => item.status === 7).length }
])
const orderStepItems = computed(() => [
  { step: 1, label: '订单信息', done: currentStep.value > 1 },
  { step: 2, label: '产品信息', done: currentStep.value > 2 },
  { step: 3, label: '工艺信息', done: false }
])
const productRows = computed(() => currentRecord.value?.products?.length ? currentRecord.value.products : [
  {
    productName: formState.productInfo || '【颜色鲜艳】经汇-沃柑370*260、自带大度128克铜板345张',
    finishedSpec: '--',
    quantity: 2000,
    unit: '张',
    amount: 200
  },
  {
    productName: '国学经典智慧封面',
    finishedSpec: '--',
    quantity: 1000,
    unit: '张',
    amount: 200
  }
])
const craftRows = computed(() => currentRecord.value?.crafts?.length ? currentRecord.value.crafts : [
  {
    productName: '【颜色鲜艳】经汇-沃柑370*260、自带大度128克铜板345张',
    craftName: '四色印刷',
    spec: 'xxx',
    openNum: 2000,
    startPrice: '张',
    finishNum: 20,
    unit: '千印',
    price: 200,
    customerAmount: 1000,
    remark: '加急'
  },
  {
    productName: '国学经典智慧封面',
    craftName: '双面印刷',
    spec: 'xxx',
    openNum: 1000,
    startPrice: '张',
    finishNum: 10,
    unit: '千印',
    price: 100,
    customerAmount: 500,
    remark: '无'
  }
])
const detailInfo = computed(() => {
  const row = currentRecord.value || formState
  return [
    { label: '订单号', value: row.orderId || '20260329001' },
    { label: '单位名称', value: row.tenantName || '成都龙泉驿古月良品广告' },
    { label: '联系人', value: row.userName || '丽丽' },
    { label: '联系方式', value: row.userPhone || '1556246752' },
    { label: '送货地址', value: row.address || '四川省成都市龙泉驿区万源路317号', wide: true },
    { label: '交货日期', value: row.createTime || '2026-04-01 12:00:00' },
    { label: '交货方式', value: row.deliveryType || '自提' },
    { label: '印刷要求', value: row.remark || '无' },
    { label: '备注', value: row.remark || '无' }
  ]
})

const formatMoney = (value) => `¥${new Intl.NumberFormat('zh-CN').format(Number(value || 0).toFixed ? Number(value || 0) : value)}`

const setOrderMode = (mode) => {
  viewMode.value = mode
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }))
  const query = { ...route.query }
  if (mode === 'list') {
    delete query.mode
  } else {
    query.mode = mode === 'form' ? 'create' : mode
  }
  router.replace({ name: 'orders', query })
}

const resetFilters = () => {
  Object.assign(filters, {
    pageNum: 1,
    pageSize: 10,
    tenantName: '',
    userName: '',
    orderId: '',
    status: '',
    orderTime: ''
  })
  loadData()
}

const buildQuery = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  tenantName: filters.tenantName,
  userName: filters.userName,
  orderId: filters.orderId,
  status: filters.status,
  startTime: filters.orderTime || undefined,
  endTime: filters.orderTime || undefined
})

const loadData = async () => {
  loading.value = true
  try {
    const [list, total] = await Promise.all([
      getOrderList(buildQuery()),
      getOrderTotal()
    ])
    rows.value = (list.records || []).map(enrichOrderRow)
    summary.orderTotal = total.orderTotal || list.total || 0
    summary.orderMoneyTotal = total.orderMoneyTotal || 0
  } catch (error) {
    ElMessage.error(error?.message || '订单数据加载失败')
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  Object.assign(formState, {
    id: null,
    orderId: '',
    tenantName: '',
    userName: '',
    userPhone: '',
    createTime: '',
    deliveryType: '自提',
    address: '',
    productInfo: '',
    payMoney: 0,
    status: autoApprove.value ? 2 : 1,
    printCode: '--',
    remark: ''
  })
  currentStep.value = 1
  setOrderMode('form')
  editVisible.value = false
}

const openEdit = (row) => {
  Object.assign(formState, JSON.parse(JSON.stringify(row)))
  currentStep.value = 1
  setOrderMode('form')
  editVisible.value = false
}

const saveOrder = () => {
  if (formState.id) {
    const index = rows.value.findIndex((item) => item.id === formState.id)
    rows.value[index] = { ...rows.value[index], ...JSON.parse(JSON.stringify(formState)) }
  } else {
    rows.value.unshift({
      ...JSON.parse(JSON.stringify(formState)),
      id: Date.now(),
      orderId: formState.orderId || `20260421${rows.value.length + 1}`,
      createTime: formState.createTime || '2026-04-21 10:30',
      timeline: [{ date: '2026-04-21', title: '创建订单', desc: '当前账号 提交订单' }],
      products: [],
      crafts: []
    })
  }
  editVisible.value = false
  setOrderMode('list')
  ElMessage.success('订单已保存')
}

const openDetail = (row) => {
  currentRecord.value = JSON.parse(JSON.stringify(row))
  detailVisible.value = false
  setOrderMode('detail')
}

const printOrder = () => ElMessage.success('已发送到打印队列')

watch(currentStep, () => {
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }))
})

const removeOrder = async (row) => {
  await ElMessageBox.confirm(`确认删除订单 ${row.orderId} 吗？`, '删除确认', { type: 'warning' })
  rows.value = rows.value.filter((item) => item.id !== row.id)
  summary.orderTotal = Math.max(0, Number(summary.orderTotal || 0) - 1)
  ElMessage.success('删除成功')
}

const openApprove = (row) => {
  currentRecord.value = row
  approvalRemark.value = ''
  approveVisible.value = true
}

const confirmApprove = () => {
  currentRecord.value.status = 2
  currentRecord.value.timeline.unshift({
    date: '2026-04-21',
    title: '审批通过',
    desc: approvalRemark.value || '审批通过'
  })
  approveVisible.value = false
  detailVisible.value = false
  ElMessage.success('订单已通过')
}

const openReject = (row) => {
  currentRecord.value = row
  rejectRemark.value = ''
  rejectVisible.value = true
}

const confirmReject = () => {
  currentRecord.value.status = 7
  currentRecord.value.timeline.unshift({
    date: '2026-04-21',
    title: '驳回订单',
    desc: rejectRemark.value || '资料不完整'
  })
  rejectVisible.value = false
  detailVisible.value = false
  ElMessage.success('订单已驳回')
}

const reapplyOrder = (row) => {
  row.status = 1
  ElMessage.success('已重新提交审批')
}

const outsourceOrder = (row) => {
  row.status = 8
  ElMessage.success('订单已转外协')
}

const rowActions = (row) => {
  if (row.status === 1) return ['审批', '编辑', '删除']
  if (row.status === 7) return ['重新申请', '删除']
  if (row.status === 2) return ['详情', '转外协']
  if (row.status === 6 || row.status === 8) return ['详情', '返单']
  return ['详情']
}

const handleAction = (row, action) => {
  if (action === '审批') return openDetail(row)
  if (action === '编辑') return openEdit(row)
  if (action === '删除') return removeOrder(row)
  if (action === '重新申请') return reapplyOrder(row)
  if (action === '转外协') return outsourceOrder(row)
  if (action === '返单') return ElMessage.info('已触发返单流程')
  return openDetail(row)
}

onMounted(loadData)
</script>

<template>
  <div class="page-stack">
    <section v-if="viewMode === 'list'" class="summary-grid">
      <article class="summary-card">
        <p>订单数合计</p>
        <strong>{{ stats.orderTotal }}</strong>
      </article>
      <article class="summary-card">
        <p>金额合计</p>
        <strong>{{ formatMoney(stats.orderMoneyTotal) }}</strong>
      </article>
      <article class="summary-card">
        <p>待审批</p>
        <strong>{{ stats.pendingCount }}</strong>
      </article>
      <article v-for="card in localCards" :key="card.label" class="summary-card">
        <p>{{ card.label }}</p>
        <strong>{{ card.value }}</strong>
      </article>
    </section>

    <PageBlock v-if="viewMode === 'list'" class="filter-card">
      <div class="filter-grid">
        <label>
          <span>单位名称</span>
          <el-input v-model="filters.tenantName" placeholder="请输入" />
        </label>
        <label>
          <span>业务员</span>
          <el-input v-model="filters.userName" placeholder="请输入" />
        </label>
        <label>
          <span>订单号</span>
          <el-input v-model="filters.orderId" placeholder="请输入" />
        </label>
        <label>
          <span>订单状态</span>
          <el-select v-model="filters.status" placeholder="请选择" clearable>
            <el-option v-for="(item, key) in statusMap" :key="key" :label="item.label" :value="Number(key)" />
          </el-select>
        </label>
        <label>
          <span>订单时间</span>
          <el-date-picker v-model="filters.orderTime" value-format="YYYY-MM-DD" placeholder="请选择" />
        </label>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </PageBlock>

    <PageBlock v-if="viewMode === 'list'" class="table-card">
      <div class="list-actions">
        <el-button type="primary" :icon="Plus" @click="openAdd">添加</el-button>
        <div class="auto-approve">
          <span>自动审批</span>
          <el-switch v-model="autoApprove" />
        </div>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>

      <div v-if="activeFilters.length" class="filter-tags">
        <span class="filter-tags__label">当前筛选</span>
        <el-tag
          v-for="item in activeFilters"
          :key="item.key"
          closable
          effect="plain"
          @close="filters[item.key] = ''; loadData()"
        >
          {{ item.label }}：{{ item.value }}
        </el-tag>
      </div>

      <div class="table-meta">
        <span>共 {{ stats.orderTotal }} 条数据</span>
        <span>当前页 {{ rows.length }} 条</span>
        <el-button link @click="resetFilters">重置筛选</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" empty-text="当前筛选下暂无订单数据">
        <el-table-column prop="orderId" label="订单号" min-width="150" />
        <el-table-column prop="tenantName" label="单位名称" min-width="180" />
        <el-table-column prop="createTime" label="订单时间" min-width="160" />
        <el-table-column prop="userName" label="业务员" min-width="100" />
        <el-table-column prop="productInfo" label="产品信息" min-width="220" show-overflow-tooltip />
        <el-table-column prop="payMoney" label="订单金额" min-width="130">
          <template #default="{ row }">{{ formatMoney(row.payMoney) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" min-width="110">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status].type">{{ statusMap[row.status].label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220">
          <template #default="{ row }">
            <el-space wrap>
              <el-button
                v-for="action in rowActions(row)"
                :key="action"
                link
                :type="action === '删除' || action === '驳回' ? 'danger' : 'primary'"
                @click="handleAction(row, action)"
              >
                {{ action }}
              </el-button>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="工单打印" min-width="110" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" plain :icon="Printer" @click="printOrder(row)">打印</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="filters.pageNum"
          v-model:page-size="filters.pageSize"
          background
          layout="total, prev, pager, next, sizes"
          :page-sizes="[10, 20, 30, 50]"
          :total="stats.orderTotal"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </PageBlock>

    <section v-else-if="viewMode === 'form'" class="order-flow">
      <PageBlock class="step-card">
        <div class="steps-line">
          <div
            v-for="item in orderStepItems"
            :key="item.step"
            class="step-node"
            :class="{ active: currentStep === item.step, done: item.done }"
          >
            <span>{{ item.done ? '✓' : item.step }}</span>
            <strong>{{ item.label }}</strong>
          </div>
        </div>
      </PageBlock>

      <PageBlock class="form-panel">
        <template v-if="currentStep === 1">
          <h3>订单信息</h3>
          <div class="form-grid design-form-grid">
            <label><span>订单号</span><el-input v-model="formState.orderId" placeholder="请输入" /></label>
            <label><span>单位名称</span><el-input v-model="formState.tenantName" placeholder="请选择" /></label>
            <label><span>联系人</span><el-input v-model="formState.userName" placeholder="请输入" /></label>
            <label><span>联系方式</span><el-input v-model="formState.userPhone" placeholder="请输入" /></label>
            <label class="full-span"><span>送货地址</span><el-input v-model="formState.address" placeholder="请输入" /></label>
            <label><span>交货日期</span><el-input v-model="formState.createTime" placeholder="请输入" /></label>
            <label><span>交货方式</span><el-input v-model="formState.deliveryType" placeholder="请输入" /></label>
            <label class="full-span"><span>印刷要求</span><el-input v-model="formState.remark" type="textarea" :rows="4" placeholder="请输入" /></label>
          </div>
        </template>
        <template v-else-if="currentStep === 2">
          <el-button type="primary" class="flow-add-button">添加</el-button>
          <el-table :data="productRows" class="design-table">
            <el-table-column prop="productName" label="产品名称" min-width="520" />
            <el-table-column prop="finishedSpec" label="成品规格" min-width="170" />
            <el-table-column prop="quantity" label="订货数量" min-width="170" />
            <el-table-column prop="unit" label="单位" min-width="130" />
            <el-table-column prop="amount" label="金额" min-width="160">
              <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column label="操作" min-width="150">
              <template #default>删除</template>
            </el-table-column>
          </el-table>
        </template>
        <template v-else>
          <el-button type="primary" class="flow-add-button">添加</el-button>
          <el-table :data="craftRows" class="design-table">
            <el-table-column prop="productName" label="产品名称" min-width="320" />
            <el-table-column prop="craftName" label="工艺名称" min-width="160" />
            <el-table-column prop="spec" label="规格" min-width="120" />
            <el-table-column prop="openNum" label="开数" min-width="120" />
            <el-table-column prop="startPrice" label="起价" min-width="120" />
            <el-table-column prop="finishNum" label="成品数量" min-width="150" />
            <el-table-column prop="unit" label="单位" min-width="120" />
            <el-table-column prop="price" label="单价" min-width="120" />
            <el-table-column prop="customerAmount" label="客户金额" min-width="150" />
            <el-table-column prop="remark" label="备注" min-width="120" />
            <el-table-column label="操作" min-width="120">
              <template #default>删除</template>
            </el-table-column>
          </el-table>
        </template>
      </PageBlock>

      <div class="sticky-total">
        <strong>订单合计：<span>{{ formatMoney(formState.payMoney || 1200) }}</span></strong>
        <div>
          <el-button @click="setOrderMode('list')">取消</el-button>
          <el-button v-if="currentStep > 1" type="primary" @click="currentStep -= 1">上一步</el-button>
          <el-button v-if="currentStep < 3" type="primary" @click="currentStep += 1">下一步</el-button>
          <el-button v-else type="primary" @click="saveOrder">保存</el-button>
        </div>
      </div>
    </section>

    <section v-else-if="viewMode === 'detail' && currentRecord" class="order-detail-page">
      <div class="status-banner">{{ statusMap[currentRecord.status]?.label || '订单详情' }}</div>

      <PageBlock title="订单信息">
        <div class="detail-grid design-detail-grid">
          <div v-for="item in detailInfo" :key="item.label" :class="{ 'full-span': item.wide }">
            <span>{{ item.label }}：</span><strong>{{ item.value }}</strong>
          </div>
        </div>
      </PageBlock>

      <PageBlock title="产品信息">
        <el-table :data="productRows" class="design-table">
          <el-table-column prop="productName" label="产品名称" min-width="520" />
          <el-table-column prop="finishedSpec" label="成品规格" min-width="160" />
          <el-table-column prop="quantity" label="订货数量" min-width="150" />
          <el-table-column prop="unit" label="单位" min-width="120" />
          <el-table-column prop="amount" label="金额" min-width="150">
            <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
          </el-table-column>
        </el-table>
      </PageBlock>

      <PageBlock title="工艺信息">
        <el-table :data="craftRows" class="design-table">
          <el-table-column prop="productName" label="产品名称" min-width="320" />
          <el-table-column prop="craftName" label="工艺名称" min-width="150" />
          <el-table-column prop="spec" label="规格" min-width="110" />
          <el-table-column prop="openNum" label="开数" min-width="110" />
          <el-table-column prop="startPrice" label="起价" min-width="110" />
          <el-table-column prop="finishNum" label="成品数量" min-width="140" />
          <el-table-column prop="unit" label="单位" min-width="110" />
          <el-table-column prop="price" label="单价" min-width="110">
            <template #default="{ row }">{{ formatMoney(row.price) }}</template>
          </el-table-column>
          <el-table-column prop="customerAmount" label="客户金额" min-width="150">
            <template #default="{ row }">{{ formatMoney(row.customerAmount) }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="120" />
        </el-table>
      </PageBlock>

      <PageBlock title="订单记录">
        <div class="timeline-card" v-for="item in currentRecord.timeline" :key="`${item.date}-${item.title}`">
          <p>{{ item.date }}</p>
          <strong>{{ item.title }}</strong>
          <span>{{ item.desc }}</span>
        </div>
      </PageBlock>

      <div class="sticky-total">
        <strong>订单合计：<span>{{ formatMoney(currentRecord.payMoney || 1200) }}</span></strong>
        <div>
          <el-button @click="setOrderMode('list')">返回</el-button>
          <el-button v-if="currentRecord.status === 1" type="danger" @click="openReject(currentRecord)">驳回</el-button>
          <el-button v-if="currentRecord.status === 1" type="primary" @click="openApprove(currentRecord)">通过</el-button>
        </div>
      </div>
    </section>

    <el-dialog v-model="approveVisible" title="通过订单" width="620px">
      <el-input v-model="approvalRemark" type="textarea" :rows="5" placeholder="备注" />
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="驳回订单" width="620px">
      <el-input v-model="rejectRemark" type="textarea" :rows="5" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.summary-card {
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: rgba(255, 255, 255, 0.9);
}

.summary-card p {
  margin: 0;
  color: #6f7a8f;
}

.summary-card strong {
  display: block;
  margin-top: 12px;
  font-size: 34px;
}

.toolbar-actions,
.detail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auto-approve {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #f6f8fc;
}

.source-pill {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: #eef4ff;
  color: #2558d8;
  font-size: 13px;
  font-weight: 600;
}

.filter-grid,
.form-grid,
.detail-grid {
  display: grid;
  gap: 12px;
}

.filter-grid {
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 26px 42px;
  align-items: end;
}

.filter-grid label,
.design-form-grid label {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-grid label span,
.design-form-grid label span {
  color: #9a9a9a;
  font-size: 20px;
  font-weight: 700;
}

.filter-actions {
  display: flex;
  gap: 18px;
}

.filter-grid :deep(.el-button),
.filter-actions :deep(.el-button) {
  width: 100%;
  height: 56px;
}

.filter-card :deep(.page-block__body) {
  padding: 40px 54px;
}

.table-card :deep(.page-block__body) {
  padding: 38px 54px 46px;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 34px;
}

.table-meta {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  color: #77829a;
}

.filter-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.filter-tags__label {
  color: #627088;
  font-size: 13px;
  font-weight: 600;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 16px;
}

.order-flow,
.order-detail-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.step-card :deep(.page-block__body) {
  padding: 104px 220px 100px;
}

.steps-line {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
}

.steps-line::before {
  position: absolute;
  top: 34px;
  left: 15%;
  right: 15%;
  height: 2px;
  background: #bdbdbd;
  content: "";
}

.step-node {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 28px;
  color: #b7b7b7;
  font-size: 30px;
  font-weight: 700;
}

.step-node span {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border: 6px solid #b7b7b7;
  border-radius: 50%;
  background: #fff;
  color: currentColor;
}

.step-node.active {
  color: #1764ff;
}

.step-node.active span {
  border-color: #1764ff;
}

.step-node.done {
  color: #5abc3c;
}

.step-node.done span {
  border-color: #5abc3c;
}

.form-panel {
  min-height: 560px;
}

.form-panel h3 {
  margin: 0 0 40px;
  font-size: 30px;
  line-height: 1.2;
}

.design-form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px 80px;
}

.flow-add-button {
  min-width: 224px;
  height: 90px;
  margin-bottom: 36px;
  font-size: 32px;
}

.design-table {
  width: 100%;
}

.design-table :deep(.el-table__header th) {
  background: #f0f1f3;
}

.sticky-total {
  position: sticky;
  bottom: 0;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  min-height: 126px;
  margin: 0 -36px -28px;
  padding: 24px 48px;
  background: #ffffff;
  border-top: 1px solid #efefef;
}

.sticky-total strong {
  font-size: 32px;
}

.sticky-total strong span {
  color: #ff9200;
}

.sticky-total > div {
  display: flex;
  gap: 26px;
}

.sticky-total :deep(.el-button) {
  min-width: 170px;
  height: 72px;
  font-size: 26px;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-grid div {
  padding: 0;
  border-radius: 0;
  background: transparent;
}

.detail-grid span {
  color: #9a9a9a;
  font-size: 24px;
  font-weight: 700;
}

.detail-grid strong {
  color: #111;
  font-size: 24px;
}

.design-detail-grid {
  gap: 34px 120px;
  padding: 22px 0 12px;
}

.full-span {
  grid-column: 1 / -1;
}

.status-banner {
  margin-bottom: 0;
  padding: 34px;
  border-radius: 6px;
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  background: #ff3058;
}

.timeline-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #e6ebf5;
  margin-bottom: 10px;
}

.timeline-card p,
.timeline-card strong,
.timeline-card span {
  display: block;
}

.timeline-card p {
  margin: 0 0 8px;
  color: #97a0b2;
}

.detail-footer {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.detail-total {
  font-size: 22px;
  font-weight: 700;
  color: #d48806;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 36px;
}

@media (max-width: 1200px) {
  .summary-grid,
  .filter-grid,
  .form-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-footer,
  .toolbar-actions,
  .sticky-total {
    flex-wrap: wrap;
  }

  .step-card :deep(.page-block__body) {
    padding: 54px 28px;
  }
}
</style>
