<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  getTenantProductCraftDetail,
  getTenantProductCraftList,
  getTenantProductCraftStatistics
} from '../../api/tenant'

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  customer: '',
  productName: '',
  craftName: '',
  orderNo: '',
  orderTime: []
})

const state = reactive({
  loading: false,
  detailLoading: false,
  total: 0
})

const rows = ref([])
const currentRow = ref(null)
const detailVisible = ref(false)
const activeDetailTab = ref('crafts')
const statistics = reactive({
  pending: 0,
  completed: 0,
  amount: 0
})

const statusText = (value) => {
  if (value === '待生产' || value === '已生产') return value
  return Number(value) === 2 ? '已生产' : '待生产'
}

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

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.productsCraftId,
  orderNo: row.orderId || row.orderNo || '',
  customer: row.companyName || row.customer || '',
  orderTime: row.orderTime || row.createTime || '',
  productInfo: row.productInfo || row.productName || '',
  quantity: row.orderQuantity ?? row.quantity ?? '',
  craftName: row.craftName || row.name || '',
  remark: row.remark || '',
  unitPrice: row.unitPrice ?? 0,
  amount: row.customerMoney ?? row.amount ?? 0,
  status: statusText(row.craftStatus ?? row.status),
  operator: row.operator || row.createTenantUserName || ''
})

const queryPayload = () => {
  const [start, end] = filters.orderTime || []
  return {
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    companyName: filters.customer || undefined,
    productName: filters.productName || undefined,
    craftName: filters.craftName || undefined,
    orderId: filters.orderNo || undefined,
    orderCreateTimeStart: start || undefined,
    orderCreateTimeEnd: end || start || undefined
  }
}

const summaryText = computed(() =>
  `待生产：${statistics.pending}    已生产：${statistics.completed}    客户金额：${moneyText(statistics.amount)}`
)

const applyStatistics = (data = {}) => {
  statistics.pending = Number(data.pending ?? data.waitProduction ?? data.notProduced ?? data.waitCount ?? 0) || 0
  statistics.completed = Number(data.completed ?? data.produced ?? data.finishCount ?? data.doneCount ?? 0) || 0
  statistics.amount = Number(data.amount ?? data.customerMoney ?? data.totalMoney ?? data.money ?? 0) || 0
}

const loadStatistics = async () => {
  try {
    const data = await getTenantProductCraftStatistics()
    applyStatistics(data || {})
  } catch {
    statistics.pending = 0
    statistics.completed = 0
    statistics.amount = 0
  }
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantProductCraftList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '产品工艺列表加载失败')
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
    productName: '',
    craftName: '',
    orderNo: '',
    orderTime: []
  })
  loadData()
}

const normalizeDetail = (payload = {}, fallback = {}) => {
  const craft = payload.productsCraft || payload.craft || payload || {}
  const product = payload.products || payload.product || {}
  const order = payload.order || {}
  return {
    ...fallback,
    ...payload,
    orderNo: order.orderId || fallback.orderNo,
    customer: order.companyName || fallback.customer,
    contact: order.linkman || '',
    phone: order.phone || '',
    deliveryAddress: order.companyAddress || '',
    deliveryDate: order.deliveryDate || '',
    deliveryType: order.deliveryType || '',
    printRequirement: order.printingRequirements || '',
    remark: order.remark || craft.remark || fallback.remark || '',
    operator: craft.operator || fallback.operator || '',
    productRows: [
      {
        productName: product.name || fallback.productInfo || '',
        finishedSpec: product.trimmedSize || product.finishedSpec || '',
        orderQuantity: product.orderQuantity ?? fallback.quantity ?? '',
        unit: product.unit || '',
        amount: product.money ?? fallback.amount ?? 0
      }
    ],
    craftRows: [
      {
        craftName: craft.name || fallback.craftName || '',
        specification: craft.specification || '',
        openCount: craft.formatSize ?? '',
        basePrice: craft.priceBase ?? '',
        finishedCount: craft.orderQuantity ?? fallback.quantity ?? '',
        unit: craft.unit || '',
        unitPrice: craft.unitPrice ?? fallback.unitPrice ?? 0,
        amount: craft.customerMoney ?? fallback.amount ?? 0,
        remark: craft.remark || fallback.remark || ''
      }
    ],
    productionTime: craft.updateTime || craft.createTime || '',
    productionRemark: craft.remark || '',
    imageNote: craft.imageRemark || ''
  }
}

const openDetail = async (row) => {
  currentRow.value = row
  activeDetailTab.value = 'crafts'
  detailVisible.value = true
  if (!row.id) return
  state.detailLoading = true
  try {
    const data = await getTenantProductCraftDetail(row.id)
    currentRow.value = normalizeDetail(data, row)
  } catch (error) {
    ElMessage.error(error?.message || '产品工艺详情加载失败')
  } finally {
    state.detailLoading = false
  }
}
const deliveryTypeOptions = [
  { label: '自提', value: 1 },
  { label: '发货', value: 2 },
  { label: '送货', value: 3 },
  { label: '客运', value: 4 }
]
const deliveryTypeText = (value) =>
    deliveryTypeOptions.find((item) => String(item.value) === String(value))?.label || value || ''
onMounted(() => {
  loadStatistics()
  loadData()
})
</script>

<template>
  <div class="module-page">
    <PageBlock class="search-card">
      <el-form class="search-form" :model="filters" label-width="96px">
        <el-form-item label="单位名称">
          <el-input v-model="filters.customer" clearable placeholder="请输入单位名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="filters.productName" clearable placeholder="请输入产品名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="工艺名称">
          <el-input v-model="filters.craftName" clearable placeholder="请输入工艺名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="所属订单号">
          <el-input v-model="filters.orderNo" clearable placeholder="请输入订单号" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="起始时间">
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
        <strong>{{ summaryText }}</strong>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="orderNo" label="订单号" min-width="130" />
        <el-table-column prop="customer" label="单位名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="orderTime" label="订单时间" min-width="160" />
        <el-table-column prop="productInfo" label="产品信息" min-width="170" show-overflow-tooltip />
        <el-table-column prop="quantity" label="产品数量" min-width="100" />
        <el-table-column prop="craftName" label="工艺名称" min-width="120" />
        <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip />
        <el-table-column prop="unitPrice" label="产品单价" min-width="110" />
        <el-table-column label="客户金额" min-width="120">
          <template #default="{ row }">{{ moneyText(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="工艺状态" min-width="110" />
        <el-table-column prop="operator" label="操作员" min-width="100" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="openDetail(row)">详情</el-button>
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

    <el-dialog v-model="detailVisible" title="产品工艺详情" width="1080px">
      <div v-loading="state.detailLoading" class="detail-wrap">
        <dl v-if="currentRow" class="detail-grid">
          <div><dt>订单号</dt><dd>{{ currentRow.orderNo }}</dd></div>
          <div><dt>单位名称</dt><dd>{{ currentRow.customer }}</dd></div>
          <div><dt>联系人</dt><dd>{{ currentRow.contact || '' }}</dd></div>
          <div><dt>联系方式</dt><dd>{{ currentRow.phone || '' }}</dd></div>
          <div><dt>送货地址</dt><dd>{{ currentRow.deliveryAddress || '' }}</dd></div>
          <div><dt>交货日期</dt><dd>{{ currentRow.deliveryDate || '' }}</dd></div>
          <div><dt>交货方式</dt><dd>{{ deliveryTypeText(currentRow.deliveryType) || '' }}</dd></div>
          <div><dt>印刷要求</dt><dd>{{ currentRow.printRequirement || '' }}</dd></div>
          <div><dt>备注</dt><dd>{{ currentRow.remark || '' }}</dd></div>
        </dl>
        <el-tabs v-model="activeDetailTab">
          <el-tab-pane label="工艺信息" name="crafts">
            <el-table :data="currentRow?.craftRows || []" border>
              <el-table-column prop="craftName" label="工艺名称" />
              <el-table-column prop="specification" label="规格" />
              <el-table-column prop="openCount" label="开数" />
              <el-table-column prop="basePrice" label="起价" />
              <el-table-column prop="finishedCount" label="成品数量" />
              <el-table-column prop="unit" label="单位" />
              <el-table-column prop="unitPrice" label="单价" />
              <el-table-column prop="amount" label="客户金额" />
              <el-table-column prop="remark" label="备注" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="产品信息" name="products">
            <el-table :data="currentRow?.productRows || []" border>
              <el-table-column prop="productName" label="产品名称" />
              <el-table-column prop="finishedSpec" label="成品规格" />
              <el-table-column prop="orderQuantity" label="订货数量" />
              <el-table-column prop="unit" label="单位" />
              <el-table-column prop="amount" label="金额" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="生产记录" name="production">
            <dl class="detail-grid detail-grid--small">
              <div><dt>操作员</dt><dd>{{ currentRow?.operator || '' }}</dd></div>
              <div><dt>操作时间</dt><dd>{{ currentRow?.completedTime || '' }}</dd></div>
              <div><dt>备注</dt><dd>{{ currentRow?.completeRemark || '' }}</dd></div>
              <div><dt>图片备注</dt><dd>
                <el-image
                    v-if="currentRow?.completeImgRemarkUrl"
                    class="detail-image"
                    :src="currentRow.completeImgRemarkUrl"
                    :preview-src-list="[currentRow.completeImgRemarkUrl]"
                    fit="cover"
                    preview-teleported
                />
                <span v-else>-</span>
              </dd></div>
            </dl>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.module-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 20px;
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
  justify-content: flex-end;
  margin-bottom: 12px;
  color: #303133;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
  margin: 0 0 18px;
  padding: 18px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
}

.detail-grid--small {
  margin-top: 8px;
}

.detail-grid div {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 10px;
  min-width: 0;
}

.detail-grid dt {
  color: #8a93a3;
  font-weight: 700;
}

.detail-grid dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #111111;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
