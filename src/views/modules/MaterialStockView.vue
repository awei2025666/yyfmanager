<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import { getTenantConsumableInventoryList } from '../../api/tenant'

const router = useRouter()

const statusOptions = [
  { label: '充足', value: '充足' },
  { label: '预警', value: '预警' }
]

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  status: ''
})

const state = reactive({
  loading: false,
  total: 0
})

const rows = ref([])

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const stockStatus = (stock) => (Number(stock || 0) > 0 ? '充足' : '预警')

const normalizeRow = (row = {}) => {
  const stock = row.stock ?? row.inventory ?? row.num ?? 0
  const price = row.price ?? row.unitPrice ?? row.consumablePrice ?? row.money ?? 0
  return {
    ...row,
    id: row.id || row.consumableId,
    name: row.name || row.consumableName || '-',
    unit: row.unit || row.consumableUnit || '个',
    price,
    inbound: row.inbound ?? row.inNum ?? row.inboundNum ?? 0,
    outbound: row.outbound ?? row.outNum ?? row.outboundNum ?? 0,
    stock,
    cost: row.cost ?? Number((Number(stock || 0) * Number(price || 0)).toFixed(2)),
    status: row.statusText || row.status || stockStatus(stock)
  }
}

const queryPayload = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  name: filters.name || undefined,
  consumableName: filters.name || undefined,
  status: filters.status || undefined
})

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantConsumableInventoryList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '耗材库存加载失败')
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
    status: ''
  })
  loadData()
}

const openDetails = (row) => {
  router.push({
    name: 'materialDetails',
    query: {
      name: row.name === '-' ? '' : row.name
    }
  })
}

onMounted(loadData)
</script>

<template>
  <div class="module-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="耗材名称">
          <el-input v-model="filters.name" clearable placeholder="请输入耗材名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="请选择状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" :icon="Search" @click="searchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </PageBlock>

    <PageBlock>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="name" label="耗材名称" min-width="160" />
        <el-table-column prop="unit" label="单位" min-width="90" />
        <el-table-column prop="price" label="耗材价值" min-width="110" />
        <el-table-column prop="inbound" label="入库数量" min-width="110" />
        <el-table-column prop="outbound" label="出库数量" min-width="110" />
        <el-table-column prop="stock" label="当前库存" min-width="110" />
        <el-table-column prop="cost" label="耗材成本" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="100" />
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="openDetails(row)">明细</el-button>
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
</style>
