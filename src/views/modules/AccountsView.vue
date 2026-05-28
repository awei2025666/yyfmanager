<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus, Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantAccount,
  changeTenantAccountStatus,
  deleteTenantAccount,
  editTenantAccount,
  getTenantAccountList
} from '../../api/tenant'

const accountTypes = [
  { label: '微信', value: '1' },
  { label: '支付宝', value: '2' },
  { label: '公账', value: '3' }
]

const statusOptions = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' }
]

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  accountNo: '',
  bank: '',
  status: ''
})

const form = reactive({
  id: '',
  name: '',
  accountNo: '',
  bank: '',
  type: '',
  balance: '',
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
const detailVisible = ref(false)
const currentRow = ref(null)

const isEdit = computed(() => Boolean(form.id))

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const typeText = (value) =>
  accountTypes.find((item) => String(item.value) === String(value))?.label || value || '-'

const statusText = (value) =>
  statusOptions.find((item) => String(item.value) === String(value))?.label || value || '-'

const statusValue = (value) => {
  if (value === '启用') return '1'
  if (value === '禁用') return '0'
  return String(value ?? '0')
}

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id,
  name: row.name || row.accountName || '-',
  accountNo: row.cardNo || row.accountNo || row.bankNo || '-',
  bank: row.bankName || row.bank || '-',
  type: typeText(row.type),
  typeValue: String(row.type || ''),
  balance: row.money ?? row.balance ?? row.amount ?? 0,
  status: statusText(row.status),
  statusValue: statusValue(row.status),
  remark: row.remark || '',
  createdAt: row.createTime || '-'
})

const queryPayload = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  name: filters.name || undefined,
  accountName: filters.name || undefined,
  cardNo: filters.accountNo || undefined,
  bankName: filters.bank || undefined,
  status: filters.status || undefined
})

const savePayload = () => ({
  id: form.id || undefined,
  name: form.name,
  accountName: form.name,
  cardNo: form.accountNo,
  bankName: form.bank,
  type: form.type || undefined,
  money: form.balance === '' ? undefined : form.balance,
  status: form.status,
  remark: form.remark
})

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantAccountList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '账户列表加载失败')
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
    accountNo: '',
    bank: '',
    status: ''
  })
  loadData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    name: '',
    accountNo: '',
    bank: '',
    type: '',
    balance: '',
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
    accountNo: row.accountNo === '-' ? '' : row.accountNo,
    bank: row.bank === '-' ? '' : row.bank,
    type: row.typeValue,
    balance: row.balance ?? '',
    status: row.statusValue,
    remark: row.remark || ''
  })
  formVisible.value = true
}

const openDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const submitForm = async () => {
  if (!form.name) return ElMessage.warning('请输入账户名称')
  if (!form.accountNo) return ElMessage.warning('请输入卡号')
  state.saving = true
  try {
    if (form.id) {
      await editTenantAccount(savePayload())
    } else {
      await addTenantAccount(savePayload())
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
    await ElMessageBox.confirm(`确认删除账户 ${row.name} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantAccount(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const toggleStatus = async (row, value) => {
  try {
    await changeTenantAccountStatus({ id: row.id, status: value })
    ElMessage.success('状态已更新')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '状态更新失败')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="module-page">
    <PageBlock class="search-card">
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="账户名称">
          <el-input v-model="filters.name" clearable placeholder="请输入账户名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="卡号">
          <el-input v-model="filters.accountNo" clearable placeholder="请输入卡号" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="开户行">
          <el-input v-model="filters.bank" clearable placeholder="请输入开户行" @keyup.enter="searchData" />
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
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">添加</el-button>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="name" label="账户名称" min-width="140" />
        <el-table-column prop="accountNo" label="卡号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="bank" label="开户行" min-width="150" show-overflow-tooltip />
        <el-table-column prop="type" label="账户类型" min-width="110" />
        <el-table-column prop="balance" label="账户余额" min-width="120" />
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
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="openDetail(row)">详情</el-button>
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

    <el-dialog v-model="formVisible" :title="isEdit ? '编辑账户' : '添加账户'" width="720px">
      <el-form class="edit-form" :model="form" label-width="92px">
        <el-form-item label="账户名称" required>
          <el-input v-model="form.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="卡号" required>
          <el-input v-model="form.accountNo" placeholder="请输入卡号" />
        </el-form-item>
        <el-form-item label="开户行">
          <el-input v-model="form.bank" placeholder="请输入开户行" />
        </el-form-item>
        <el-form-item label="账户类型">
          <el-select v-model="form.type" clearable placeholder="请选择账户类型">
            <el-option v-for="item in accountTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="账户余额">
          <el-input v-model="form.balance" placeholder="请输入账户余额" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
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

    <el-dialog v-model="detailVisible" title="账户详情" width="760px">
      <dl v-if="currentRow" class="detail-grid">
        <div><dt>账户名称</dt><dd>{{ currentRow.name }}</dd></div>
        <div><dt>卡号</dt><dd>{{ currentRow.accountNo }}</dd></div>
        <div><dt>开户行</dt><dd>{{ currentRow.bank }}</dd></div>
        <div><dt>账户类型</dt><dd>{{ currentRow.type }}</dd></div>
        <div><dt>账户余额</dt><dd>{{ currentRow.balance }}</dd></div>
        <div><dt>状态</dt><dd>{{ currentRow.status }}</dd></div>
        <div><dt>创建时间</dt><dd>{{ currentRow.createdAt }}</dd></div>
        <div><dt>备注</dt><dd>{{ currentRow.remark || '-' }}</dd></div>
      </dl>
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
.search-form :deep(.el-select) {
  width: 100%;
}

.search-actions {
  grid-column: 1 / -1;
  justify-self: end;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
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

.edit-form :deep(.el-select) {
  width: 100%;
}

.edit-form .full {
  grid-column: 1 / -1;
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
