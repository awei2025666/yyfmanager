<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus, Search } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantDepartment,
  changeTenantDepartmentStatus,
  deleteTenantDepartment,
  editTenantDepartment,
  getTenantDepartmentList
} from '../../api/tenant'

const statusOptions = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' }
]

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  status: ''
})

const form = reactive({
  id: '',
  name: '',
  status: '1',
  remark: ''
})

const state = reactive({
  loading: false,
  saving: false,
  total: 0
})

const rows = ref([])
const formVisible = ref(false)

const isEdit = computed(() => Boolean(form.id))

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const statusText = (value) => {
  if (value === '启用' || value === true) return '启用'
  if (value === '禁用' || value === false) return '禁用'
  return Number(value) === 1 ? '启用' : '禁用'
}

const statusValue = (value) => (statusText(value) === '启用' ? '1' : '0')

const normalizeRow = (row = {}) => {
  const name = row.name || row.deptName || row.departmentName || row.title || '-'
  return {
    ...row,
    id: row.id || row.deptId || row.departmentId || name,
    name,
    remark: row.remark || row.description || '无',
    status: statusText(row.status ?? row.state ?? row.enable),
    statusValue: statusValue(row.status ?? row.state ?? row.enable),
    parentName: row.parentName || row.parentDeptName || row.group || ''
  }
}

const queryPayload = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  name: filters.name || undefined,
  deptName: filters.name || undefined,
  status: filters.status || undefined
})

const savePayload = () => ({
  id: form.id || undefined,
  name: form.name,
  deptName: form.name,
  status: form.status,
  remark: form.remark
})

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantDepartmentList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '部门列表加载失败')
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

const resetForm = () => {
  Object.assign(form, {
    id: '',
    name: '',
    status: '1',
    remark: ''
  })
}

const openCreate = () => {
  resetForm()
  formVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name === '-' ? '' : row.name,
    status: row.statusValue,
    remark: row.remark === '无' ? '' : row.remark
  })
  formVisible.value = true
}

const submitForm = async () => {
  if (!form.name) return ElMessage.warning('请输入部门名称')
  state.saving = true
  try {
    if (form.id) {
      await editTenantDepartment(savePayload())
    } else {
      await addTenantDepartment(savePayload())
    }
    formVisible.value = false
    ElMessage.success(form.id ? '编辑成功' : '新增成功')
    await loadData()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    state.saving = false
  }
}

const removeRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除部门 ${row.name} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantDepartment(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const toggleStatus = async (row, value) => {
  try {
    await changeTenantDepartmentStatus({ id: row.id, status: value })
    ElMessage.success('状态已更新')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '状态更新失败')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="organization-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="76px">
        <el-form-item label="部门名称">
          <el-input v-model="filters.name" clearable placeholder="请输入部门名称" @keyup.enter="searchData" />
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

      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">添加</el-button>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="name" label="部门名称" min-width="180" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.statusValue"
              active-value="1"
              inactive-value="0"
              @change="(value) => toggleStatus(row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
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

    <el-dialog v-model="formVisible" :title="isEdit ? '编辑部门' : '添加部门'" width="620px">
      <el-form class="edit-form" :model="form" label-width="86px">
        <el-form-item label="部门名称" required>
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="state.saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.organization-page {
  padding: 0 20px;
}

.search-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px 20px;
  margin-bottom: 18px;
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

.table-toolbar {
  display: flex;
  margin-bottom: 12px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.edit-form :deep(.el-select) {
  width: 100%;
}
</style>
