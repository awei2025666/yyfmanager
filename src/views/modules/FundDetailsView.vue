<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import { exportTenantFinancial, getTenantFinancialList, searchTenantAccounts } from '../../api/tenant'

const typeOptions = [
  { label: '收入', value: '1' },
  { label: '支出', value: '2' }
]

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  accountId: '',
  accountName: '',
  card: '',
  openingBank: '',
  type: '',
  time: []
})

const state = reactive({
  loading: false,
  exporting: false,
  total: 0
})

const rows = ref([])
const currentRow = ref(null)
const detailVisible = ref(false)
const accountOptions = ref([])

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const typeText = (value) => {
  if (value === '收入' || value === '支出' || value === '收款' || value === '报销') return value
  if (Number(value) === 1) return '收入'
  if (Number(value) === 2) return '支出'
  return value || '-'
}

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.orderId || row.bizNo,
  time: row.time || row.createTime || row.updatedAt || '-',
  bizNo: row.orderId || row.bizNo || row.code || '-',
  type: typeText(row.type),
  remark: row.digest || row.remark || '',
  account: row.accountName || row.account || '-',
  accountNo: row.card || row.accountNo || row.cardNo || '',
  bank: row.openingBank || row.bank || '',
  money: row.money,
  income: Number(row.type) === 1 ? row.money : row.income,
  expense: Number(row.type) === 2 ? row.money : row.expense,
  balance: row.balance ?? row.surplusMoney ?? ''
})

const queryPayload = () => {
  const [start, end] = filters.time || []
  return {
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    accountId: filters.accountId || undefined,
    accountName: filters.accountName || undefined,
    card: filters.card || undefined,
    openingBank: filters.openingBank || undefined,
    type: filters.type || undefined,
    createTimeStart: start || undefined,
    createTimeEnd: end || start || undefined
  }
}

const loadAccounts = async (name = '') => {
  try {
    accountOptions.value = await searchTenantAccounts({ name })
  } catch (error) {
    ElMessage.error(error?.message || '账户加载失败')
  }
}

const handleAccountChange = (id) => {
  const account = accountOptions.value.find((item) => item.id === id)
  filters.accountName = account?.name || ''
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantFinancialList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '资金明细加载失败')
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
    accountId: '',
    accountName: '',
    card: '',
    openingBank: '',
    type: '',
    time: []
  })
  loadData()
}

const openDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
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
    const blob = await exportTenantFinancial(queryPayload())
    downloadBlob(blob, '资金明细.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    state.exporting = false
  }
}

onMounted(() => {
  loadAccounts()
  loadData()
})
</script>

<template>
  <div class="module-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="账户名称">
          <el-select
            v-model="filters.accountId"
            clearable
            filterable
            remote
            reserve-keyword
            placeholder="请选择账户"
            :remote-method="loadAccounts"
            @change="handleAccountChange"
          >
            <el-option v-for="item in accountOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="卡号">
          <el-input v-model="filters.card" clearable placeholder="请输入卡号" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="开户行">
          <el-input v-model="filters.openingBank" clearable placeholder="请输入开户行" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" clearable placeholder="请选择类型">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="起始时间">
          <el-date-picker
            v-model="filters.time"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="请选择开始日期"
            end-placeholder="请选择结束日期"
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
        <el-table-column prop="time" label="时间" min-width="170" />
        <el-table-column prop="bizNo" label="单号" min-width="150" />
        <el-table-column prop="remark" label="摘要" min-width="180" show-overflow-tooltip />
        <el-table-column prop="account" label="账户名称" min-width="140" />
        <el-table-column prop="type" label="类型" min-width="100" />
        <el-table-column prop="money" label="金额" min-width="120" />
        <el-table-column label="操作" width="90" fixed="right">
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

    <el-dialog v-model="detailVisible" title="资金明细详情" width="760px">
      <dl v-if="currentRow" class="detail-grid">
        <div><dt>时间</dt><dd>{{ currentRow.time }}</dd></div>
        <div><dt>单号</dt><dd>{{ currentRow.bizNo }}</dd></div>
        <div><dt>账户名称</dt><dd>{{ currentRow.account }}</dd></div>
        <div><dt>卡号</dt><dd>{{ currentRow.accountNo || '-' }}</dd></div>
        <div><dt>开户行</dt><dd>{{ currentRow.bank || '-' }}</dd></div>
        <div><dt>类型</dt><dd>{{ currentRow.type }}</dd></div>
        <div><dt>金额</dt><dd>{{ currentRow.money ?? '-' }}</dd></div>
        <div class="full"><dt>摘要</dt><dd>{{ currentRow.remark || '-' }}</dd></div>
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
