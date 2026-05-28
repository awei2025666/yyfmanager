<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Printer, Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const filters = reactive({
  pageNum: 1,
  pageSize: 10
})

const state = reactive({
  loading: false,
  exporting: false,
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

const applyDefaultFilters = () => {
  props.config.searchFields.forEach((field) => {
    filters[field.key] = field.defaultValue ?? (field.type === 'daterange' ? [] : '')
  })
}

const queryPayload = () => props.config.toQuery({ ...filters })

const loadData = async () => {
  state.loading = true
  try {
    const data = await props.config.listApi(queryPayload())
    const normalizedRows = listRows(data).map((row) => props.config.normalize(row))
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || `${props.config.title}加载失败`)
  } finally {
    state.loading = false
  }
}

const searchData = () => {
  filters.pageNum = 1
  loadData()
}

const resetFilters = () => {
  filters.pageNum = 1
  filters.pageSize = 10
  applyDefaultFilters()
  loadData()
}

const openDetail = async (row) => {
  currentRow.value = row
  detailVisible.value = true
  if (!props.config.detailApi || !row.id) return
  state.detailLoading = true
  try {
    const data = await props.config.detailApi(row.id)
    currentRow.value = props.config.normalizeDetail ? props.config.normalizeDetail(data, row) : props.config.normalize({ ...row, ...data })
  } catch (error) {
    ElMessage.error(error?.message || '详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

const removeRow = async (row) => {
  if (!props.config.deleteApi || !row.id) return
  try {
    await ElMessageBox.confirm(`确认删除${props.config.title} ${row.name || row.receiptNo || ''} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await props.config.deleteApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const printRow = async (row) => {
  if (!props.config.printApi || !row.id) return
  try {
    const url = await props.config.printApi(row.id)
    if (url) window.open(url, '_blank')
  } catch (error) {
    ElMessage.error(error?.message || '打印失败')
  }
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const exportData = async () => {
  state.exporting = true
  try {
    const blob = await props.config.exportApi(queryPayload())
    downloadBlob(blob, `${props.config.title}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    state.exporting = false
  }
}

applyDefaultFilters()
onMounted(loadData)
</script>

<template>
  <div class="module-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" :label-width="config.labelWidth || '86px'">
        <el-form-item v-for="field in config.searchFields" :key="field.key" :label="field.label">
          <el-date-picker
            v-if="field.type === 'daterange'"
            v-model="filters[field.key]"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
          <el-select
            v-else-if="field.type === 'select'"
            v-model="filters[field.key]"
            clearable
            :placeholder="field.placeholder || `请选择${field.label}`"
          >
            <el-option v-for="item in field.options || []" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-input
            v-else
            v-model="filters[field.key]"
            clearable
            :placeholder="field.placeholder || `请输入${field.label}`"
            @keyup.enter="searchData"
          />
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" :icon="Search" @click="searchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </PageBlock>

    <PageBlock>
      <div class="table-toolbar">
        <el-button :icon="Download" :loading="state.exporting" @click="exportData">导出</el-button>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column
          v-for="column in config.columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="column.minWidth || 120"
          show-overflow-tooltip
        />
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button v-if="config.printApi" type="primary" link :icon="Printer" @click="printRow(row)">打印</el-button>
            <el-button type="primary" link :icon="View" @click="openDetail(row)">详情</el-button>
            <el-button v-if="config.deleteApi" type="danger" link @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="detailVisible" :title="`${config.title}详情`" width="1080px">
      <div v-loading="state.detailLoading">
        <dl v-if="currentRow" class="detail-grid">
          <div v-for="field in config.detailFields" :key="field.prop">
            <dt>{{ field.label }}</dt>
            <dd>{{ currentRow[field.prop] || '-' }}</dd>
          </div>
        </dl>
        <el-table v-if="config.detailTable && currentRow?.[config.detailTable.key]?.length" :data="currentRow[config.detailTable.key]" border>
          <el-table-column
            v-for="column in config.detailTable.columns"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            :min-width="column.minWidth || 120"
            show-overflow-tooltip
          />
        </el-table>
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
.search-form :deep(.el-select),
.search-form :deep(.el-date-editor.el-input),
.search-form :deep(.el-date-editor--daterange) {
  width: 100%;
}

.search-actions {
  grid-column: 1 / -1;
  justify-self: end;
}

.table-toolbar {
  display: flex;
  margin-bottom: 12px;
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
