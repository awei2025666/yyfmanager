<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshLeft, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getWorkbenchRecentUpdates } from '../api/tenant'

const router = useRouter()
const loading = ref(false)
const rawUpdates = ref([])
const total = ref(0)
const filters = reactive({
  keyword: '',
  type: ''
})
const pager = reactive({
  page: 1,
  pageSize: 10
})

const typeLabels = {
  1: '订单',
  2: '工艺',
  3: '收款',
  4: '报销',
  5: '客户',
  order: '订单',
  craft: '工艺',
  receipt: '收款',
  reimbursement: '报销',
  customer: '客户'
}

const typeOptions = [
  { label: '订单', value: 1 },
  { label: '工艺', value: 2 },
  { label: '收款', value: 3 },
  { label: '报销', value: 4 },
  { label: '客户', value: 5 }
]

const inferType = (item) => {
  const source = `${item.typeName || item.dynamicTypeName || item.category || item.type || ''}`
  const content = `${item.content || item.title || item.dynamicTitle || ''}`
  const value = source || content
  if (/订单/.test(value)) return '订单'
  if (/工艺/.test(value)) return '工艺'
  if (/收款/.test(value)) return '收款'
  if (/报销/.test(value)) return '报销'
  if (/客户/.test(value)) return '客户'
  return typeLabels[item.type] || typeLabels[source] || source || '-'
}

const normalizeUpdate = (item, index) => ({
  id: item.id || item.dynamicId || `${item.time || item.createTime || index}-${index}`,
  title: item.content || item.title || item.dynamicTitle || item.name || '-',
  type: inferType(item),
  time: item.time || item.createTime || item.updateTime || item.dynamicTime || '-',
  raw: item
})

const updates = computed(() => rawUpdates.value.map(normalizeUpdate))
const pagedUpdates = computed(() => updates.value)

const loadUpdates = async () => {
  loading.value = true
  try {
    const data = await getWorkbenchRecentUpdates({
      pageNum: pager.page,
      pageSize: pager.pageSize,
      content: filters.keyword || undefined,
      type: filters.type || undefined
    })
    rawUpdates.value = Array.isArray(data) ? data : data?.records || data?.list || data?.rows || []
    total.value = Array.isArray(data) ? data.length : data?.total || rawUpdates.value.length
  } catch (error) {
    ElMessage.error(error?.message || '最近动态加载失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.keyword = ''
  filters.type = ''
  pager.page = 1
  loadUpdates()
}

const searchUpdates = () => {
  pager.page = 1
  loadUpdates()
}

const openDetail = (item) => {
  const typeRoutes = {
    订单: 'orders',
    工艺: 'productCrafts',
    收款: 'receipts',
    报销: 'reimbursements',
    客户: 'customers'
  }
  const name = typeRoutes[item.type]
  if (!name) return
  router.push({ name, query: { id: item.raw.id || item.raw.bizId || item.raw.relationId || undefined } })
}

onMounted(loadUpdates)
</script>

<template>
  <div class="recent-page">
    <section class="recent-filter">
      <label>
        <span>动态标题</span>
        <el-input v-model="filters.keyword" placeholder="请输入关键词" clearable @keyup.enter="searchUpdates" />
      </label>
      <label>
        <span>动态类型</span>
        <el-select v-model="filters.type" placeholder="请选择类型" clearable>
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </label>
      <div class="filter-actions">
        <el-button type="primary" size="large" :icon="Search" @click="searchUpdates">查询</el-button>
        <el-button size="large" :icon="RefreshLeft" @click="resetFilters">重置</el-button>
      </div>
    </section>

    <section class="recent-table-card" v-loading="loading">
      <table class="recent-table">
        <thead>
          <tr>
            <th>动态标题</th>
            <th>动态类型</th>
            <th>动态时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedUpdates" :key="item.id">
            <td>
              <button type="button" class="title-link" @click="openDetail(item)">{{ item.title }}</button>
            </td>
            <td>{{ item.type }}</td>
            <td>{{ item.time }}</td>
            <td>
              <button type="button" class="detail-link" @click="openDetail(item)">详情</button>
            </td>
          </tr>
          <tr v-if="!pagedUpdates.length">
            <td class="empty-cell" colspan="4">暂无动态数据</td>
          </tr>
        </tbody>
      </table>

      <div class="recent-pagination">
        <el-pagination
          v-model:current-page="pager.page"
          v-model:page-size="pager.pageSize"
          background
          layout="prev, pager, next"
          :total="total"
          @current-change="loadUpdates"
          @size-change="loadUpdates"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.recent-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.recent-filter,
.recent-table-card {
  border-radius: 6px;
  background: #ffffff;
}

.recent-filter {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  align-items: start;
  gap: 18px 28px;
  min-height: 0;
  padding: 24px 28px 22px;
}

.recent-filter label {
  display: grid;
  gap: 8px;
  color: #8f8f8f;
  font-size: 15px;
  font-weight: 700;
}

.recent-filter :deep(.el-input__wrapper),
.recent-filter :deep(.el-select__wrapper) {
  min-height: 42px;
  border-radius: 6px;
  background: #f5f6f8;
  box-shadow: none;
  font-size: 15px;
}

.recent-filter :deep(.el-input__inner),
.recent-filter :deep(.el-select__placeholder) {
  color: #9b9b9b;
  font-size: 15px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  grid-column: 1 / -1;
  padding-bottom: 0;
}

.filter-actions :deep(.el-button) {
  min-width: 76px;
  height: 32px;
  border: 0;
  border-radius: 4px;
  font-size: 14px;
}

.filter-actions :deep(.el-button--default) {
  background: #f5f6f8;
  color: #5f6b7a;
}

.recent-table-card {
  min-height: 0;
  padding: 16px;
}

.recent-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  color: #606266;
}

.recent-table th {
  height: 46px;
  padding: 0 16px;
  background: #f8fafc;
  color: #303133;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
}

.recent-table th:first-child,
.recent-table td:first-child {
  width: 62%;
}

.recent-table th:nth-child(2),
.recent-table td:nth-child(2) {
  width: 12%;
}

.recent-table th:nth-child(3),
.recent-table td:nth-child(3) {
  width: 18%;
}

.recent-table th:last-child,
.recent-table td:last-child {
  width: 8%;
}

.recent-table td {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  vertical-align: middle;
}

.title-link,
.detail-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: #409eff;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.title-link {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-link {
  white-space: nowrap;
}

.empty-cell {
  height: 240px !important;
  color: #9a9a9a;
  text-align: center !important;
}

.recent-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

.recent-pagination :deep(.el-pagination.is-background .btn-prev),
.recent-pagination :deep(.el-pagination.is-background .btn-next),
.recent-pagination :deep(.el-pagination.is-background .el-pager li) {
  min-width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #ffffff;
  color: #606266;
  font-size: 14px;
}

.recent-pagination :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: #409eff;
  color: #ffffff;
}

@media (max-width: 1180px) {
  .recent-filter {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    flex-wrap: wrap;
  }

  .recent-table {
    min-width: 980px;
  }

  .recent-table-card {
    overflow-x: auto;
  }
}
</style>
