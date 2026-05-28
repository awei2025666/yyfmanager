<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import { getTenantConsumableDetail, getTenantConsumableDetailList } from '../../api/tenant'

const route = useRoute()

const typeOptions = [
  { label: '系统入库', value: '1' },
  { label: '手工出库', value: '2' },
  { label: '订单消耗', value: '3' }
]

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  type: '',
  orderNo: ''
})

const state = reactive({
  loading: false,
  detailLoading: false,
  total: 0
})

const rows = ref([])
const currentRow = ref(null)
const detailVisible = ref(false)

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const typeText = (value) =>
  typeOptions.find((item) => String(item.value) === String(value))?.label || value || '-'

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.consumableDetailId,
  name: row.consumableName || row.name || '-',
  unit: row.unit || row.consumableUnit || row.unitName || '个',
  price: row.price ?? row.unitPrice ?? row.consumablePrice ?? row.money ?? row.amount ?? 0,
  type: typeText(row.type),
  typeValue: String(row.type || ''),
  quantity: row.num ?? row.quantity ?? 0,
  orderNo: row.orderId || row.order?.orderId || '-',
  operator: row.createUserName || row.operator || '-',
  updatedAt: row.createTime || row.updatedAt || '-',
  imageRemark: row.img || row.imageRemark || row.picture || '',
  remark: row.remark || row.detailNote || ''
})

const queryPayload = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  consumableName: filters.name || undefined,
  type: filters.type || undefined,
  orderId: filters.orderNo || undefined
})

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantConsumableDetailList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '耗材明细加载失败')
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
    name: '',
    type: '',
    orderNo: ''
  })
  loadData()
}

const openDetail = async (row) => {
  currentRow.value = row
  detailVisible.value = true
  if (!row.id) return
  state.detailLoading = true
  try {
    const data = await getTenantConsumableDetail(row.id)
    currentRow.value = normalizeRow({ ...row, ...data })
  } catch (error) {
    ElMessage.error(error?.message || '耗材明细详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

watch(
  () => route.query.name,
  (name) => {
    if (name === undefined) return
    filters.name = String(name || '')
    filters.pageNum = 1
    loadData()
  }
)

onMounted(() => {
  filters.name = String(route.query.name || '')
  loadData()
})
</script>

<template>
  <div class="module-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="耗材名称">
          <el-input v-model="filters.name" clearable placeholder="请输入耗材名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.type" clearable placeholder="请选择状态">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联订单">
          <el-input v-model="filters.orderNo" clearable placeholder="请输入关联订单" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" :icon="Search" @click="searchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </PageBlock>

    <PageBlock>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="name" label="耗材名称" min-width="150" />
        <el-table-column prop="type" label="明细类型" min-width="110" />
        <el-table-column prop="quantity" label="数量" min-width="90" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="orderNo" label="关联订单" min-width="150" />
        <el-table-column prop="operator" label="操作员" min-width="110" />
        <el-table-column prop="updatedAt" label="操作时间" min-width="170" />
        <el-table-column label="操作" width="110" fixed="right">
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

    <el-dialog v-model="detailVisible" title="耗材明细详情" width="760px">
      <div v-loading="state.detailLoading">
        <dl v-if="currentRow" class="detail-grid">
          <div><dt>耗材名称</dt><dd>{{ currentRow.name }}</dd></div>
          <div><dt>耗材单位</dt><dd>{{ currentRow.unit }}</dd></div>
          <div><dt>耗材价值</dt><dd>{{ currentRow.price }}</dd></div>
          <div><dt>明细类型</dt><dd>{{ currentRow.type }}</dd></div>
          <div><dt>数量</dt><dd>{{ currentRow.quantity }}</dd></div>
          <div><dt>关联订单</dt><dd>{{ currentRow.orderNo }}</dd></div>
          <div><dt>操作员</dt><dd>{{ currentRow.operator }}</dd></div>
          <div><dt>操作时间</dt><dd>{{ currentRow.updatedAt }}</dd></div>
          <div class="full"><dt>图片备注</dt><dd>{{ currentRow.imageRemark || '-' }}</dd></div>
          <div class="full"><dt>备注</dt><dd>{{ currentRow.remark || '-' }}</dd></div>
        </dl>
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
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px 20px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-input),
.search-form :deep(.el-select) {
  width: 100%;
}

.search-actions {
  grid-column: 1 / -1;
  justify-self: end;
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
  margin: 0;
  padding: 18px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
}

.detail-grid div {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 10px;
  min-width: 0;
}

.detail-grid .full {
  grid-column: 1 / -1;
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
