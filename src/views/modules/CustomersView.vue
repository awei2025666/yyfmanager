<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Edit, Plus, Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantClient,
  deleteTenantClient,
  editTenantClient,
  exportTenantClient,
  getTenantClientList,
  getTenantClientUsers,
  getTenantOrderList,
  getTenantProductCraftList,
  getTenantReceiptList
} from '../../api/tenant'

const customerTypes = [
  { label: '月结客户', value: '1' },
  { label: '现结客户', value: '2' },
  { label: '供应商', value: '3' },
  { label: '货运站代收', value: '4' }
]

const orderStatusLabels = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回'
}

const craftStatusLabels = {
  1: '待生产',
  2: '已生产'
}

const typeText = (value) =>
  customerTypes.find((item) => String(item.value) === String(value))?.label || value || '-'

const orderStatusText = (value) => orderStatusLabels[Number(value)] || value || '-'
const craftStatusText = (value) => craftStatusLabels[Number(value)] || value || '-'

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, rows) => {
  if (Array.isArray(payload)) return rows.length
  return Number(payload?.total ?? rows.length) || 0
}

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  sales: '',
  customerType: '',
  contact: '',
  phone: '',
  createTimeRange: []
})

const form = reactive({
  id: '',
  name: '',
  contact: '',
  phone: '',
  address: '',
  customerType: '',
  sales: '',
  remark: ''
})

const state = reactive({
  loading: false,
  exporting: false,
  saving: false,
  detailLoading: false,
  total: 0
})

const rows = ref([])
const salesOptions = ref([])
const formVisible = ref(false)
const detailVisible = ref(false)
const activeTab = ref('orders')
const currentRow = ref(null)
const detailData = reactive({
  orders: [],
  crafts: [],
  receipts: []
})

const isEdit = computed(() => Boolean(form.id))

const salesNameById = computed(() => {
  const map = new Map()
  salesOptions.value.forEach((item) => map.set(String(item.value), item.label))
  return map
})

const normalizeCustomer = (row = {}) => ({
  ...row,
  id: row.id,
  name: row.companyName || row.name || '-',
  contact: row.linkman || row.contact || '-',
  phone: row.phone || '-',
  address: row.companyAddress || row.address || '-',
  customerType: typeText(row.type || row.customerType),
  customerTypeValue: String(row.type || row.customerType || ''),
  sales: row.userName || row.salesName || salesNameById.value.get(String(row.userId || '')) || '-',
  salesId: row.userId || row.sales || '',
  createdAt: row.createTime || row.createdAt || '-',
  operator: row.createTenantUserName || row.operator || '-',
  operationTime: row.updateTime || row.createTime || '-',
  remark: row.remark || ''
})

const queryPayload = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  companyName: filters.name || undefined,
  salesman: filters.sales ? salesNameById.value.get(String(filters.sales)) || filters.sales : undefined,
  type: filters.customerType || undefined,
  linkman: filters.contact || undefined,
  phone: filters.phone || undefined,
  createTimeStart: filters.createTimeRange?.[0] || undefined,
  createTimeEnd: filters.createTimeRange?.[1] || undefined
})

const loadSalesOptions = async () => {
  const data = await getTenantClientUsers({ name: '' }).catch(() => [])
  salesOptions.value = listRows(data).map((item) => ({
    label: item.name || item.userName || item.nickname || '-',
    value: String(item.id || item.userId || item.name)
  }))
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantClientList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeCustomer)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '客户列表加载失败')
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
    sales: '',
    customerType: '',
    contact: '',
    phone: '',
    createTimeRange: []
  })
  loadData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    name: '',
    contact: '',
    phone: '',
    address: '',
    customerType: '',
    sales: '',
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
    contact: row.contact === '-' ? '' : row.contact,
    phone: row.phone === '-' ? '' : row.phone,
    address: row.address === '-' ? '' : row.address,
    customerType: row.customerTypeValue || customerTypes.find((item) => item.label === row.customerType)?.value || '',
    sales: String(row.salesId || ''),
    remark: row.remark || ''
  })
  formVisible.value = true
}

const submitForm = async () => {
  if (!form.name) return ElMessage.warning('请输入单位名称')
  if (!form.contact) return ElMessage.warning('请输入联系人')
  if (!form.phone) return ElMessage.warning('请输入联系方式')
  if (!form.address) return ElMessage.warning('请输入单位地址')
  state.saving = true
  try {
    const payload = {
      id: form.id || undefined,
      companyName: form.name,
      userId: form.sales || undefined,
      type: form.customerType || undefined,
      linkman: form.contact,
      phone: form.phone,
      companyAddress: form.address,
      remark: form.remark
    }
    if (form.id) {
      await editTenantClient(payload)
    } else {
      await addTenantClient(payload)
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
    await ElMessageBox.confirm(`确认删除客户 ${row.name} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantClient(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const orderProductInfoText = (row = {}) => {
  if (row.productInfo) return row.productInfo
  if (row.productName) return row.productName
  const products = row.products || row.productList || row.productsList || row.orderProductList || []
  if (!Array.isArray(products)) return '-'
  return products.map((item) => item.productInfo || item.productName || item.name).filter(Boolean).join('、') || '-'
}

const normalizeOrderRecord = (row = {}) => ({
  orderNo: row.orderId || row.orderNo || '-',
  orderTime: row.orderTime || row.createTime || '-',
  filler: row.fillUserName || row.userName || '-',
  productInfo: orderProductInfoText(row),
  amount: row.totalMoney ?? row.payMoney ?? row.amount ?? 0,
  status: orderStatusText(row.status ?? row.orderStatus)
})

const normalizeCraftRecord = (row = {}) => ({
  craftName: row.craftName || '-',
  productName: row.productInfo || row.productName || '-',
  quantity: row.orderQuantity ?? row.quantity ?? 0,
  status: craftStatusText(row.craftStatus ?? row.status)
})

const normalizeReceiptRecord = (row = {}) => ({
  receiptNo: row.receiptNo || row.orderId || row.orderNo || '-',
  receiptTime: row.collectionTime || row.createTime || '-',
  account: row.accountName || row.account || '-',
  amount: row.money ?? row.amount ?? 0,
  operator: row.createTenantUserName || row.operator || '-'
})

const openDetail = async (row) => {
  currentRow.value = row
  activeTab.value = 'orders'
  detailVisible.value = true
  state.detailLoading = true
  try {
    const basePayload = {
      pageNum: 1,
      pageSize: 10,
      cooperativeClientId: row.id,
      companyName: row.name
    }
    const [orders, crafts, receipts] = await Promise.all([
      getTenantOrderList(basePayload).catch(() => []),
      getTenantProductCraftList(basePayload).catch(() => []),
      getTenantReceiptList(basePayload).catch(() => [])
    ])
    detailData.orders = listRows(orders).map(normalizeOrderRecord)
    detailData.crafts = listRows(crafts).map(normalizeCraftRecord)
    detailData.receipts = listRows(receipts).map(normalizeReceiptRecord)
  } catch (error) {
    ElMessage.error(error?.message || '客户详情加载失败')
  } finally {
    state.detailLoading = false
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
    const blob = await exportTenantClient(queryPayload())
    downloadBlob(blob, '合作客户.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    state.exporting = false
  }
}

onMounted(async () => {
  await loadSalesOptions()
  loadData()
})
</script>

<template>
  <div class="module-page">
    <PageBlock class="search-card">
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="单位名称">
          <el-input v-model="filters.name" clearable placeholder="请输入单位名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="业务员">
          <el-select v-model="filters.sales" clearable filterable placeholder="请选择业务员">
            <el-option v-for="item in salesOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="filters.customerType" clearable placeholder="请选择客户类型">
            <el-option v-for="item in customerTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="filters.contact" clearable placeholder="请输入联系人" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="filters.phone" clearable placeholder="请输入联系方式" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="创建时间" class="date-range-item">
          <el-date-picker
            v-model="filters.createTimeRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="请选择开始时间"
            end-placeholder="请选择结束时间"
            range-separator="至"
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
        <div>
          <el-button type="primary" :icon="Plus" @click="openCreate">添加</el-button>
          <el-button :icon="Download" :loading="state.exporting" @click="exportData">导出</el-button>
        </div>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="name" label="单位名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系人" min-width="110" />
        <el-table-column prop="phone" label="联系方式" min-width="130" />
        <el-table-column prop="address" label="单位地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="customerType" label="客户类型" min-width="110" />
        <el-table-column prop="sales" label="业务员" min-width="110" />
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

    <el-dialog v-model="formVisible" :title="isEdit ? '编辑客户' : '添加客户'" width="760px">
      <el-form class="edit-form" :model="form" label-width="96px">
        <el-form-item label="单位名称" required>
          <el-input v-model="form.name" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="联系人" required>
          <el-input v-model="form.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系方式" required>
          <el-input v-model="form.phone" placeholder="请输入联系方式" />
        </el-form-item>
        <el-form-item label="单位地址" required>
          <el-input v-model="form.address" placeholder="请输入单位地址" />
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="form.customerType" placeholder="请选择客户类型">
            <el-option v-for="item in customerTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务员">
          <el-select v-model="form.sales" filterable clearable placeholder="请选择业务员">
            <el-option v-for="item in salesOptions" :key="item.value" :label="item.label" :value="item.value" />
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

    <el-dialog v-model="detailVisible" title="客户详情" width="980px">
      <div v-loading="state.detailLoading" class="customer-detail">
        <dl v-if="currentRow" class="detail-grid">
          <div><dt>单位名称</dt><dd>{{ currentRow.name }}</dd></div>
          <div><dt>客户类型</dt><dd>{{ currentRow.customerType }}</dd></div>
          <div><dt>联系人</dt><dd>{{ currentRow.contact }}</dd></div>
          <div><dt>联系方式</dt><dd>{{ currentRow.phone }}</dd></div>
          <div><dt>业务员</dt><dd>{{ currentRow.sales }}</dd></div>
          <div><dt>单位地址</dt><dd>{{ currentRow.address }}</dd></div>
          <div><dt>备注</dt><dd>{{ currentRow.remark || '-' }}</dd></div>
          <div><dt>操作时间</dt><dd>{{ currentRow.operationTime }}</dd></div>
        </dl>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="订单记录" name="orders">
            <el-table :data="detailData.orders" border>
              <el-table-column prop="orderNo" label="订单号" />
              <el-table-column prop="orderTime" label="订单时间" />
              <el-table-column prop="filler" label="填单员" />
              <el-table-column prop="productInfo" label="产品信息" show-overflow-tooltip />
              <el-table-column prop="amount" label="订单金额" />
              <el-table-column prop="status" label="订单状态" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="工艺记录" name="crafts">
            <el-table :data="detailData.crafts" border>
              <el-table-column prop="craftName" label="工艺名称" />
              <el-table-column prop="productName" label="产品名称" />
              <el-table-column prop="quantity" label="数量" />
              <el-table-column prop="status" label="工艺状态" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="收款记录" name="receipts">
            <el-table :data="detailData.receipts" border>
              <el-table-column prop="receiptNo" label="收款单号" />
              <el-table-column prop="receiptTime" label="收款时间" />
              <el-table-column prop="account" label="收款账户" />
              <el-table-column prop="amount" label="收款金额" />
              <el-table-column prop="operator" label="操作人" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
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
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 12px 20px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-input),
.search-form :deep(.el-select),
.search-form :deep(.el-date-editor) {
  width: 100%;
}

.date-range-item {
  grid-column: span 2;
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

.edit-form .full {
  grid-column: 1 / -1;
}

.edit-form :deep(.el-select) {
  width: 100%;
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
