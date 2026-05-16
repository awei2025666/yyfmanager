<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Printer, Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import { getOrderList, getOrderTotal } from '../api/platform'

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

const formatMoney = (value) => `¥${new Intl.NumberFormat('zh-CN').format(Number(value || 0).toFixed ? Number(value || 0) : value)}`

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
  editVisible.value = true
}

const openEdit = (row) => {
  Object.assign(formState, JSON.parse(JSON.stringify(row)))
  editVisible.value = true
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
  ElMessage.success('订单已保存')
}

const openDetail = (row) => {
  currentRecord.value = JSON.parse(JSON.stringify(row))
  detailVisible.value = true
}

const printOrder = () => ElMessage.success('已发送到打印队列')

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
    <section class="summary-grid">
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

    <PageBlock title="订单管理" subtitle="按原稿细化后的订单中心">
      <template #extra>
        <div class="toolbar-actions">
          <span class="source-pill">真实接口</span>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openAdd">添加</el-button>
          <div class="auto-approve">
            <span>自动审批</span>
            <el-switch v-model="autoApprove" />
          </div>
        </div>
      </template>

      <div class="filter-grid">
        <el-input v-model="filters.tenantName" placeholder="单位名称" />
        <el-input v-model="filters.userName" placeholder="业务员" />
        <el-input v-model="filters.orderId" placeholder="订单号" />
        <el-select v-model="filters.status" placeholder="订单状态" clearable>
          <el-option v-for="(item, key) in statusMap" :key="key" :label="item.label" :value="Number(key)" />
        </el-select>
        <el-date-picker v-model="filters.orderTime" value-format="YYYY-MM-DD" placeholder="订单时间" />
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
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

    <el-dialog v-model="editVisible" :title="formState.id ? '编辑订单' : '添加订单'" width="840px">
      <div class="form-grid">
        <el-input v-model="formState.orderId" placeholder="订单号" />
        <el-input v-model="formState.tenantName" placeholder="单位名称" />
        <el-input v-model="formState.userName" placeholder="业务员" />
        <el-input v-model="formState.userPhone" placeholder="联系方式" />
        <el-input v-model="formState.createTime" placeholder="订单时间" />
        <el-input v-model="formState.deliveryType" placeholder="交货方式" />
        <el-input v-model="formState.address" placeholder="送货地址" class="full-span" />
        <el-input v-model="formState.productInfo" placeholder="产品信息" class="full-span" />
        <el-input-number v-model="formState.payMoney" :min="0" controls-position="right" />
        <el-input v-model="formState.printCode" placeholder="工单打印" />
      </div>
      <el-input v-model="formState.remark" type="textarea" :rows="3" placeholder="备注" />
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOrder">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="订单详情" width="1120px">
      <template v-if="currentRecord">
        <div class="status-banner">{{ statusMap[currentRecord.status].label }}</div>

        <PageBlock title="订单信息">
          <div class="detail-grid">
            <div><span>订单号：</span><strong>{{ currentRecord.orderId }}</strong></div>
            <div><span>单位名称：</span><strong>{{ currentRecord.tenantName }}</strong></div>
            <div><span>联系人：</span><strong>{{ currentRecord.userName }}</strong></div>
            <div><span>联系方式：</span><strong>{{ currentRecord.userPhone }}</strong></div>
            <div><span>送货地址：</span><strong>{{ currentRecord.address }}</strong></div>
            <div><span>交货方式：</span><strong>{{ currentRecord.deliveryType }}</strong></div>
            <div><span>订单时间：</span><strong>{{ currentRecord.createTime }}</strong></div>
            <div><span>印刷要求：</span><strong>{{ currentRecord.remark || '无' }}</strong></div>
          </div>
        </PageBlock>

        <PageBlock title="产品信息">
          <el-table :data="currentRecord.products">
            <el-table-column prop="productName" label="产品名称" min-width="220" />
            <el-table-column prop="finishedSpec" label="成品规格" min-width="120" />
            <el-table-column prop="quantity" label="订货数量" min-width="100" />
            <el-table-column prop="unit" label="单位" min-width="90" />
            <el-table-column prop="amount" label="金额" min-width="100" />
          </el-table>
        </PageBlock>

        <PageBlock title="工艺信息">
          <el-table :data="currentRecord.crafts">
            <el-table-column prop="productName" label="产品名称" min-width="180" />
            <el-table-column prop="craftName" label="工艺名称" min-width="120" />
            <el-table-column prop="spec" label="规格" min-width="100" />
            <el-table-column prop="openNum" label="开数" min-width="90" />
            <el-table-column prop="startPrice" label="起价" min-width="90" />
            <el-table-column prop="finishNum" label="成品数量" min-width="90" />
            <el-table-column prop="unit" label="单位" min-width="90" />
            <el-table-column prop="price" label="单价" min-width="90" />
            <el-table-column prop="customerAmount" label="客户金额" min-width="100" />
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

        <div class="detail-footer">
          <div class="detail-total">订单合计：{{ formatMoney(currentRecord.payMoney) }}</div>
          <div class="detail-actions">
            <el-button @click="detailVisible = false">返回</el-button>
            <el-button v-if="currentRecord.status === 1" type="danger" @click="openReject(currentRecord)">驳回</el-button>
            <el-button v-if="currentRecord.status === 1" type="primary" @click="openApprove(currentRecord)">通过</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

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
  grid-template-columns: repeat(6, minmax(0, 1fr));
  margin-bottom: 16px;
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

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-grid div {
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8faff;
}

.detail-grid span {
  color: #8a94a8;
}

.full-span {
  grid-column: 1 / -1;
}

.status-banner {
  margin-bottom: 16px;
  padding: 18px;
  border-radius: 18px;
  text-align: center;
  font-size: 30px;
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
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 1200px) {
  .summary-grid,
  .filter-grid,
  .form-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-footer,
  .toolbar-actions {
    flex-wrap: wrap;
  }
}
</style>
