<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshLeft, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getWorkbenchRecentUpdates } from '../api/tenant'

const router = useRouter()
const loading = ref(false)
const rawUpdates = ref([])
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

const typeOptions = computed(() => {
  const types = [...new Set(updates.value.map((item) => item.type).filter((item) => item && item !== '-'))]
  return types.map((item) => ({ label: item, value: item }))
})

const filteredUpdates = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return updates.value.filter((item) => {
    const matchKeyword = !keyword || item.title.toLowerCase().includes(keyword)
    const matchType = !filters.type || item.type === filters.type
    return matchKeyword && matchType
  })
})

const pagedUpdates = computed(() => {
  const start = (pager.page - 1) * pager.pageSize
  return filteredUpdates.value.slice(start, start + pager.pageSize)
})

const loadUpdates = async () => {
  loading.value = true
  try {
    const data = await getWorkbenchRecentUpdates()
    rawUpdates.value = Array.isArray(data) ? data : data?.records || []
    pager.page = 1
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
}

const searchUpdates = () => {
  pager.page = 1
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
        <el-input v-model="filters.keyword" placeholder="请输入" clearable @keyup.enter="searchUpdates" />
      </label>
      <label>
        <span>动态类型</span>
        <el-select v-model="filters.type" placeholder="请选择" clearable>
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
          :total="filteredUpdates.length"
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
  grid-template-columns: minmax(240px, 1fr) minmax(240px, 1fr) auto;
  align-items: end;
  gap: 46px;
  min-height: 214px;
  padding: 42px 48px 40px;
}

.recent-filter label {
  display: grid;
  gap: 18px;
  color: #8f8f8f;
  font-size: 22px;
  font-weight: 700;
}

.recent-filter :deep(.el-input__wrapper),
.recent-filter :deep(.el-select__wrapper) {
  min-height: 56px;
  border-radius: 8px;
  background: #f5f6f8;
  box-shadow: none;
  font-size: 20px;
}

.recent-filter :deep(.el-input__inner),
.recent-filter :deep(.el-select__placeholder) {
  color: #9b9b9b;
  font-size: 20px;
}

.filter-actions {
  display: flex;
  gap: 30px;
  padding-bottom: 0;
}

.filter-actions :deep(.el-button) {
  width: 166px;
  height: 56px;
  border: 0;
  border-radius: 8px;
  font-size: 22px;
}

.filter-actions :deep(.el-button--default) {
  background: #f5f6f8;
  color: #5f6b7a;
}

.recent-table-card {
  min-height: 610px;
  padding: 68px 48px 34px;
}

.recent-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  color: #111111;
}

.recent-table th {
  height: 70px;
  padding: 0 34px;
  background: #f0f1f3;
  color: #111111;
  font-size: 22px;
  font-weight: 800;
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
  height: 74px;
  padding: 0 34px;
  border-bottom: 1px solid #dedede;
  font-size: 20px;
  vertical-align: middle;
}

.title-link,
.detail-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: #1764ff;
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
  padding-top: 300px;
}

.recent-pagination :deep(.el-pagination.is-background .btn-prev),
.recent-pagination :deep(.el-pagination.is-background .btn-next),
.recent-pagination :deep(.el-pagination.is-background .el-pager li) {
  min-width: 54px;
  height: 54px;
  border-radius: 8px;
  background: #f4f4f4;
  color: #111111;
  font-size: 22px;
}

.recent-pagination :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: #ffffff;
  color: #111111;
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
