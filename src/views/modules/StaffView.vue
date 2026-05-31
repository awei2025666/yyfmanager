<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus, Search } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantStaff,
  changeTenantStaffStatus,
  deleteTenantStaff,
  editTenantStaff,
  getTenantDepartmentOptions,
  getTenantRoleList,
  getTenantStaffList,
  resetTenantStaffPassword
} from '../../api/tenant'

const statusOptions = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' }
]

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  phone: '',
  status: '',
  deptId: ''
})

const form = reactive({
  id: '',
  name: '',
  gender: '男',
  age: '',
  phone: '',
  loginPassword: '',
  position: '',
  title: '',
  hireDate: '',
  deptId: '',
  jobNo: '',
  roleIdList: [],
  remark: '',
  status: '1'
})

const state = reactive({
  loading: false,
  optionLoading: false,
  saving: false,
  total: 0
})

const rows = ref([])
const departments = ref([])
const roles = ref([])
const formVisible = ref(false)
const treeRef = ref(null)

const isEdit = computed(() => Boolean(form.id))

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return payload?.records || payload?.list || payload?.rows || payload?.data?.records || payload?.data?.list || payload?.data?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? payload?.data?.total ?? normalizedRows.length) || 0
}

const statusText = (value) => {
  if (value === '启用' || value === true) return '启用'
  if (value === '禁用' || value === false) return '禁用'
  return Number(value) === 1 ? '启用' : '禁用'
}

const statusValue = (value) => (statusText(value) === '启用' ? '1' : '0')

const departmentNameMap = computed(() => new Map(departments.value.map((item) => [String(item.value), item.label])))
const roleNameMap = computed(() => new Map(roles.value.map((item) => [String(item.value), item.label])))

const normalizeStaff = (row = {}) => {
  const roleIds = Array.isArray(row.roleIdList)
    ? row.roleIdList
    : Array.isArray(row.menuIdList)
      ? row.menuIdList
      : row.roleId || row.roleIds
        ? String(row.roleId || row.roleIds).split(',')
        : []
  return {
    ...row,
    id: row.id || row.userId,
    userId: row.userId || row.id,
    name: row.name || row.userName || '-',
    gender: row.sex === 0 ? '女' : row.sex === 1 ? '男' : row.gender || '男',
    age: row.age ?? '',
    phone: row.phone || row.userPhone || '-',
    deptId: row.deptId || '',
    department: row.deptName || row.department || departmentNameMap.value.get(String(row.deptId || '')) || '-',
    position: row.job || row.position || '',
    title: row.jobTitle || row.title || '',
    jobNo: row.jobNumber || row.jobNo || '',
    hireDate: row.hiredate || row.hireDate || '',
    roleIdList: roleIds.map((item) => String(item)),
    roleText:
      row.roleText ||
      row.roleName ||
      row.menuName ||
      roleIds.map((id) => roleNameMap.value.get(String(id))).filter(Boolean).join('、') ||
      '-',
    remark: row.remark || '',
    status: statusText(row.status),
    statusValue: statusValue(row.status)
  }
}

const treeData = computed(() => [
  {
    id: '全部',
    label: '全部',
    children: departments.value.map((item) => ({
      id: item.value,
      label: item.label
    }))
  }
])

const queryPayload = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  name: filters.name || undefined,
  phone: filters.phone || undefined,
  status: filters.status || undefined,
  deptId: filters.deptId || undefined
})

const savePayload = () => {
  const payload = {
    id: form.id || undefined,
    name: form.name,
    phone: form.phone,
    age: form.age || undefined,
    sex: form.gender === '女' ? 0 : 1,
    job: form.position || undefined,
    jobTitle: form.title || undefined,
    hiredate: form.hireDate || undefined,
    deptId: form.deptId || undefined,
    jobNumber: form.jobNo || undefined,
    roleIdList: form.roleIdList,
    remark: form.remark,
    status: form.status
  }
  if (!form.id && form.loginPassword) payload.password = form.loginPassword
  return payload
}

const normalizeDepartmentOptions = (data = []) =>
  listRows(data)
    .map((item) => ({
      label: item.name || item.deptName || item.label,
      value: String(item.id || item.deptId || item.value || '')
    }))
    .filter((item) => item.label && item.value)

const normalizeRoleOptions = (data = []) =>
  listRows(data)
    .map((item) => ({
      label: item.name || item.roleName || item.label,
      value: String(item.id || item.roleId || item.value || '')
    }))
    .filter((item) => item.label && item.value)

const loadOptions = async () => {
  state.optionLoading = true
  try {
    const [deptData, roleData] = await Promise.all([
      getTenantDepartmentOptions({ name: '' }).catch(() => []),
      getTenantRoleList({ pageNum: 1, pageSize: 100 }).catch(() => [])
    ])
    departments.value = normalizeDepartmentOptions(deptData)
    roles.value = normalizeRoleOptions(roleData)
  } finally {
    state.optionLoading = false
  }
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantStaffList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeStaff)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '人员列表加载失败')
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
    phone: '',
    status: '',
    deptId: ''
  })
  treeRef.value?.setCurrentKey?.('全部')
  loadData()
}

const selectDepartment = (node) => {
  filters.pageNum = 1
  filters.deptId = node.id === '全部' ? '' : node.id
  loadData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    name: '',
    gender: '男',
    age: '',
    phone: '',
    loginPassword: '',
    position: '',
    title: '',
    hireDate: '',
    deptId: '',
    jobNo: '',
    roleIdList: [],
    remark: '',
    status: '1'
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
    gender: row.gender || '男',
    age: row.age,
    phone: row.phone === '-' ? '' : row.phone,
    loginPassword: '',
    position: row.position,
    title: row.title,
    hireDate: row.hireDate,
    deptId: String(row.deptId || ''),
    jobNo: row.jobNo,
    roleIdList: row.roleIdList || [],
    remark: row.remark,
    status: row.statusValue
  })
  formVisible.value = true
}

const submitForm = async () => {
  if (!form.name) return ElMessage.warning('请输入姓名')
  if (!form.phone) return ElMessage.warning('请输入联系方式')
  if (!form.id && !form.loginPassword) return ElMessage.warning('请输入登录密码')
  state.saving = true
  try {
    if (form.id) {
      await editTenantStaff(savePayload())
    } else {
      await addTenantStaff(savePayload())
    }
    formVisible.value = false
    ElMessage.success(form.id ? '编辑成功' : '新增成功')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    state.saving = false
  }
}

const removeRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除人员 ${row.name} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantStaff(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const resetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(`确认重置 ${row.name} 的密码吗？`, '重置密码', { type: 'warning' })
  } catch {
    return
  }
  try {
    await resetTenantStaffPassword(row.id)
    ElMessage.success('重置成功')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '重置失败')
  }
}

const toggleStatus = async (row, value) => {
  try {
    await changeTenantStaffStatus({ id: row.id, status: value })
    ElMessage.success('状态已更新')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '状态更新失败')
  }
}

onMounted(async () => {
  await loadOptions()
  loadData()
})
</script>

<template>
  <div class="staff-page">
    <PageBlock>
      <div class="content-layout">
        <aside class="tree-panel" v-loading="state.optionLoading">
          <div class="tree-title">部门名称</div>
          <el-tree
            ref="treeRef"
            node-key="id"
            :data="treeData"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            @node-click="selectDepartment"
          />
        </aside>

        <main class="list-panel">
          <el-form class="search-form" :model="filters" label-width="86px">
            <el-form-item label="人员姓名">
              <el-input v-model="filters.name" clearable placeholder="请输入人员姓名" @keyup.enter="searchData" />
            </el-form-item>
            <el-form-item label="联系方式">
              <el-input v-model="filters.phone" clearable placeholder="请输入联系方式" @keyup.enter="searchData" />
            </el-form-item>
            <el-form-item label="用户状态">
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
            <el-table-column prop="userId" label="用户id" min-width="100" />
            <el-table-column prop="name" label="用户姓名" min-width="110" />
            <el-table-column prop="phone" label="联系方式（账号）" min-width="150" />
            <el-table-column prop="department" label="所在部门" min-width="130" />
            <el-table-column prop="roleText" label="用户角色" min-width="180" show-overflow-tooltip />
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
            <el-table-column label="操作" width="230" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="resetPassword(row)">重置密码</el-button>
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
        </main>
      </div>
    </PageBlock>

    <el-dialog v-model="formVisible" :title="isEdit ? '编辑人员' : '添加人员'" width="980px">
      <el-form class="edit-form" :model="form" label-width="120px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input v-model="form.age" placeholder="请输入年龄" />
        </el-form-item>
        <el-form-item label="联系方式（账号）" required>
          <el-input v-model="form.phone" placeholder="请输入联系方式" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="登录密码" required>
          <el-input v-model="form.loginPassword" show-password placeholder="请输入登录密码" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="form.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="职称">
          <el-input v-model="form.title" placeholder="请输入职称" />
        </el-form-item>
        <el-form-item label="入职日期">
          <el-date-picker v-model="form.hireDate" value-format="YYYY-MM-DD" placeholder="请选择入职日期" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-select v-model="form.deptId" clearable placeholder="请选择所属部门">
            <el-option v-for="item in departments" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="form.jobNo" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" class="full">
          <el-select
            v-model="form.roleIdList"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            :loading="state.optionLoading"
            placeholder="请选择角色"
          >
            <el-option v-for="item in roles" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" class="full">
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
.staff-page {
  padding: 0 20px;
}

.content-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 18px;
}

.tree-panel {
  min-height: 560px;
  padding-right: 18px;
  border-right: 1px solid #e4e7ed;
}

.tree-title {
  margin-bottom: 16px;
  color: #111111;
  font-size: 16px;
  font-weight: 700;
}

.tree-panel :deep(.el-tree-node__content) {
  height: 42px;
  border-radius: 4px;
}

.tree-panel :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: #e8f1ff;
  color: #1f6bff;
  font-weight: 700;
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

.edit-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
}

.edit-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.edit-form :deep(.el-input),
.edit-form :deep(.el-select),
.edit-form :deep(.el-date-editor.el-input) {
  width: 100%;
}

.edit-form .full {
  grid-column: 1 / -1;
}
</style>
