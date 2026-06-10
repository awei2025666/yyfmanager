<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Plus, Printer, Refresh, Search, Upload } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantReimburse,
  deleteTenantReimburse,
  editTenantReimburse,
  exportTenantReimburse,
  getTenantReimburseDetail,
  getTenantReimburseList,
  getTenantReimbursePrintUrl,
  getTenantReimburseTotal,
  searchTenantAccounts,
  uploadTenantFile
} from '../../api/tenant'

const route = useRoute()

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  orderId: '',
  collectionUserName: '',
  accountId: '',
  createTime: []
})

const state = reactive({
  loading: false,
  exporting: false,
  saving: false,
  detailLoading: false,
  total: 0
})

const rows = ref([])
const accountOptions = ref([])
const formVisible = ref(false)
const formMode = ref('create')
const detailVisible = ref(false)
const detailData = ref(null)

const form = reactive({
  id: '',
  collectionTime: '',
  accountId: '',
  accountName: '',
  money: '',
  allowanceMoney: '',
  digest: '',
  proofImg: '',
  proofImgName: ''
})

const totals = reactive({
  moneyTotal: 0,
  allowanceMoneyTotal: 0
})

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows = []) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const moneyValue = (value) => Number(value || 0)

const formatMoney = (value) =>
  `￥${moneyValue(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatTime = (value) => String(value || '-').replace('T', ' ')

const nowString = () => {
  const pad = (value) => String(value).padStart(2, '0')
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.reimburseId,
  orderId: row.orderId || row.reimburseNo || row.reimbursementNo || '-',
  collectionTime: formatTime(row.collectionTime || row.createTime || row.reimburseTime),
  collectionUserName: row.collectionUserName || row.createTenantUserName || '-',
  accountId: row.accountId,
  accountName: row.accountName || '-',
  money: moneyValue(row.money),
  allowanceMoney: moneyValue(row.allowanceMoney),
  digest: row.digest || ''
})

const queryPayload = () => {
  const [start, end] = Array.isArray(filters.createTime) ? filters.createTime : []
  return {
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    orderId: filters.orderId || undefined,
    collectionUserName: filters.collectionUserName || undefined,
    accountId: filters.accountId || undefined,
    createTimeStart: start || undefined,
    createTimeEnd: end || undefined
  }
}

const loadAccounts = async (name = '') => {
  try {
    accountOptions.value = await searchTenantAccounts({ name })
  } catch (error) {
    ElMessage.error(error?.message || '报销账户加载失败')
  }
}

const ensureAccountOption = (id, name) => {
  if (!id || !name) return
  if (!accountOptions.value.some((item) => item.id === id)) {
    accountOptions.value.push({ id, name })
  }
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantReimburseList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '报销列表加载失败')
  } finally {
    state.loading = false
  }
}

const loadTotals = async () => {
  try {
    const data = await getTenantReimburseTotal()
    totals.moneyTotal = moneyValue(data?.moneyTotal)
    totals.allowanceMoneyTotal = moneyValue(data?.allowanceMoneyTotal)
  } catch {
    totals.moneyTotal = 0
    totals.allowanceMoneyTotal = 0
  }
}

const refreshAll = async () => {
  await Promise.all([loadData(), loadTotals()])
}

const searchData = () => {
  filters.pageNum = 1
  refreshAll()
}

const resetFilters = () => {
  filters.pageNum = 1
  filters.pageSize = 10
  filters.orderId = ''
  filters.collectionUserName = ''
  filters.accountId = ''
  filters.createTime = []
  refreshAll()
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
    const blob = await exportTenantReimburse(queryPayload())
    downloadBlob(blob, '报销列表.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    state.exporting = false
  }
}

const resetForm = () => {
  form.id = ''
  form.collectionTime = nowString()
  form.accountId = ''
  form.accountName = ''
  form.money = ''
  form.allowanceMoney = ''
  form.digest = ''
  form.proofImg = ''
  form.proofImgName = ''
}

const openCreate = () => {
  formMode.value = 'create'
  resetForm()
  formVisible.value = true
}

const openEdit = async (row) => {
  formMode.value = 'edit'
  resetForm()
  formVisible.value = true
  state.detailLoading = true
  try {
    const data = await getTenantReimburseDetail(row.id)
    form.id = data?.id || row.id
    form.collectionTime = formatTime(data?.collectionTime)
    form.accountId = data?.accountId || ''
    form.accountName = data?.accountName || ''
    form.money = data?.money ?? ''
    form.allowanceMoney = data?.allowanceMoney ?? ''
    form.digest = data?.digest || ''
    form.proofImg = data?.proofImg || ''
    form.proofImgName = data?.proofImg ? '已上传凭证' : ''
    ensureAccountOption(form.accountId, form.accountName)
  } catch (error) {
    ElMessage.error(error?.message || '编辑回显加载失败')
    formVisible.value = false
  } finally {
    state.detailLoading = false
  }
}

const handleAccountChange = (id) => {
  const account = accountOptions.value.find((item) => item.id === id)
  form.accountName = account?.name || ''
}

const uploadProof = async ({ file }) => {
  try {
    const data = await uploadTenantFile(file)
    form.proofImg = data?.url || data?.path || data?.fileUrl || data?.id || data || ''
    form.proofImgName = file.name
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error(error?.message || '上传失败')
  }
}

const formPayload = () => ({
  id: formMode.value === 'edit' ? form.id : undefined,
  accountId: form.accountId,
  allowanceMoney: moneyValue(form.allowanceMoney),
  collectionTime: form.collectionTime,
  digest: form.digest,
  money: moneyValue(form.money),
  proofImg: form.proofImg
})

const saveForm = async () => {
  if (!form.collectionTime) {
    ElMessage.warning('请选择报销时间')
    return
  }
  if (!form.accountId) {
    ElMessage.warning('请选择报销账户')
    return
  }
  state.saving = true
  try {
    if (formMode.value === 'edit') {
      await editTenantReimburse(formPayload())
    } else {
      await addTenantReimburse(formPayload())
    }
    ElMessage.success('保存成功')
    formVisible.value = false
    refreshAll()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    state.saving = false
  }
}

const removeRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除报销单 ${row.orderId || ''} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantReimburse(row.id)
    ElMessage.success('删除成功')
    refreshAll()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const printRow = async (row) => {
  try {
    const data = await getTenantReimbursePrintUrl(row.id)
    const url = data?.url || data
    if (url) {
      window.open(url, '_blank')
    } else {
      ElMessage.warning('未获取到打印地址')
    }
  } catch (error) {
    ElMessage.error(error?.message || '打印失败')
  }
}

const openDetail = async (row) => {
  detailVisible.value = true
  detailData.value = null
  state.detailLoading = true
  try {
    const data = await getTenantReimburseDetail(row.id)
    detailData.value = normalizeRow(data)
  } catch (error) {
    ElMessage.error(error?.message || '详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

onMounted(() => {
  loadAccounts()
  refreshAll()
  if (route.query.mode === 'create') {
    openCreate()
  }
})
</script>

<template>
  <div class="module-page reimbursements-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="82px">
        <el-form-item label="报销单号">
          <el-input v-model="filters.orderId" clearable placeholder="请输入报销单号" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="报销人">
          <el-input v-model="filters.collectionUserName" clearable placeholder="请输入报销人" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="报销账户">
          <el-select
            v-model="filters.accountId"
            clearable
            filterable
            remote
            reserve-keyword
            placeholder="请选择报销账户"
            :remote-method="loadAccounts"
          >
            <el-option v-for="item in accountOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起始时间">
          <el-date-picker
            v-model="filters.createTime"
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
        <div class="toolbar-actions">
          <el-button type="primary" :icon="Plus" @click="openCreate">添加</el-button>
          <el-button :icon="Download" :loading="state.exporting" @click="exportData">导出</el-button>
        </div>
        <div class="summary-bar">
          <span>报销合计：<strong>{{ formatMoney(totals.moneyTotal) }}</strong></span>
          <span>折让合计：<strong>{{ formatMoney(totals.allowanceMoneyTotal) }}</strong></span>
        </div>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="orderId" label="报销单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="collectionTime" label="时间" min-width="170" />
        <el-table-column prop="collectionUserName" label="报销人" min-width="120" />
        <el-table-column prop="accountName" label="报销账户" min-width="130" />
        <el-table-column label="金额" min-width="120">
          <template #default="{ row }">{{ formatMoney(row.money) }}</template>
        </el-table-column>
        <el-table-column label="折让" min-width="120">
          <template #default="{ row }">{{ formatMoney(row.allowanceMoney) }}</template>
        </el-table-column>
        <el-table-column prop="digest" label="摘要" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Printer" @click="printRow(row)">打印</el-button>
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
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

    <el-dialog v-model="formVisible" :title="formMode === 'edit' ? '编辑报销' : '添加报销'" width="76%" class="reimburse-form-dialog">
      <div v-loading="state.detailLoading">
        <el-form class="reimburse-form" :model="form" label-position="top">
          <el-form-item label="报销时间（默认当前时间）" required>
            <el-date-picker
              v-model="form.collectionTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择报销时间"
            />
          </el-form-item>
          <el-form-item label="报销账户" required>
            <el-select
              v-model="form.accountId"
              clearable
              filterable
              remote
              reserve-keyword
              placeholder="请选择报销账户"
              :remote-method="loadAccounts"
              @change="handleAccountChange"
            >
              <el-option v-for="item in accountOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="报销金额" required>
            <el-input-number v-model="form.money" :min="0" :precision="2" controls-position="right" />
          </el-form-item>
          <el-form-item label="折让金额">
            <el-input-number v-model="form.allowanceMoney" :min="0" :precision="2" controls-position="right" />
          </el-form-item>
          <el-form-item label="摘要" class="wide">
            <el-input v-model="form.digest" type="textarea" :rows="4" placeholder="请输入摘要" />
          </el-form-item>
          <el-form-item label="报销凭证" class="wide">
            <el-upload action="#" accept="image/*" :show-file-list="false" :http-request="uploadProof">
              <el-button :icon="Upload">选择文件</el-button>
              <span v-if="form.proofImgName" class="upload-name">{{ form.proofImgName }}</span>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="form-footer">
          <div class="form-total">
            报销合计：<strong>{{ formatMoney(form.money) }}</strong>
            <span>折让合计：<strong>{{ formatMoney(form.allowanceMoney) }}</strong></span>
          </div>
          <div>
            <el-button @click="formVisible = false">取消</el-button>
            <el-button type="primary" :loading="state.saving" @click="saveForm">保存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="报销详情" width="760px" destroy-on-close>
      <div v-loading="state.detailLoading">
        <dl v-if="detailData" class="detail-grid">
          <div><dt>报销单号</dt><dd>{{ detailData.orderId }}</dd></div>
          <div><dt>报销时间</dt><dd>{{ detailData.collectionTime }}</dd></div>
          <div><dt>报销人</dt><dd>{{ detailData.collectionUserName }}</dd></div>
          <div><dt>报销账户</dt><dd>{{ detailData.accountName }}</dd></div>
          <div><dt>报销金额</dt><dd>{{ formatMoney(detailData.money) }}</dd></div>
          <div><dt>折让金额</dt><dd>{{ formatMoney(detailData.allowanceMoney) }}</dd></div>
          <div class="wide"><dt>摘要</dt><dd>{{ detailData.digest || '-' }}</dd></div>
        </dl>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.reimbursements-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 20px;
}

.search-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 14px 24px;
}

.search-form :deep(.el-form-item),
.reimburse-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-input),
.search-form :deep(.el-select),
.search-form :deep(.el-date-editor--daterange),
.reimburse-form :deep(.el-input),
.reimburse-form :deep(.el-select),
.reimburse-form :deep(.el-date-editor.el-input),
.reimburse-form :deep(.el-input-number) {
  width: 100%;
}

.search-actions {
  grid-column: 1 / -1;
  justify-self: end;
}

.table-toolbar,
.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.toolbar-actions,
.summary-bar,
.form-total {
  display: flex;
  align-items: center;
  gap: 18px;
}

.summary-bar strong,
.form-total strong {
  color: #ff3b59;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.reimburse-form-dialog :deep(.el-dialog__body) {
  max-height: 68vh;
  overflow: auto;
}

.reimburse-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 18px 32px;
  min-height: 460px;
}

.reimburse-form .wide {
  grid-column: 1 / -1;
}

.upload-name {
  margin-left: 12px;
  color: #606266;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 14px 20px;
  margin: 0;
}

.detail-grid div {
  display: flex;
  gap: 10px;
}

.detail-grid .wide {
  grid-column: 1 / -1;
}

.detail-grid dt {
  color: #909399;
}

.detail-grid dd {
  margin: 0;
  font-weight: 600;
}

@media (max-width: 1100px) {
  .search-form,
  .reimburse-form {
    grid-template-columns: 1fr;
  }

  .search-actions {
    justify-self: start;
  }

  .table-toolbar,
  .form-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
