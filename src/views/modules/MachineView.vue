<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus, Search } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantMachine,
  deleteTenantMachine,
  editTenantMachine,
  getTenantMachineList
} from '../../api/tenant'

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: ''
})

const state = reactive({
  loading: false,
  saving: false,
  total: 0
})

const rows = ref([])
const formVisible = ref(false)
const form = reactive({
  id: '',
  name: ''
})

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows = []) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.machineId,
  name: row.name || row.machineName || '-'
})

const queryPayload = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  name: filters.name || undefined
})

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantMachineList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '机器列表加载失败')
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
    name: ''
  })
  loadData()
}

const resetForm = () => {
  form.id = ''
  form.name = ''
}

const openCreate = () => {
  resetForm()
  formVisible.value = true
}

const openEdit = (row) => {
  form.id = row.id || ''
  form.name = row.name === '-' ? '' : row.name || ''
  formVisible.value = true
}

const saveForm = async () => {
  if (!form.name) return ElMessage.warning('请输入机器名称')
  state.saving = true
  try {
    const payload = {
      id: form.id || undefined,
      name: form.name
    }
    if (form.id) {
      await editTenantMachine(payload)
    } else {
      await addTenantMachine(payload)
    }
    ElMessage.success(form.id ? '编辑成功' : '新增成功')
    formVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    state.saving = false
  }
}

const removeRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除机器 ${row.name} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantMachine(row.id)
    ElMessage.success('删除成功')
    searchData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="module-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="机器名称">
          <el-input v-model="filters.name" clearable placeholder="请输入机器名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" :icon="Search" @click="searchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </PageBlock>

    <PageBlock>
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">添加</el-button>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="name" label="机器名称" min-width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="formVisible" :title="form.id ? '编辑机器' : '添加机器'" width="520px">
      <el-form :model="form" label-width="86px">
        <el-form-item label="机器名称" required>
          <el-input v-model="form.name" clearable placeholder="请输入机器名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="state.saving" @click="saveForm">保存</el-button>
      </template>
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

.search-form :deep(.el-input) {
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
</style>
