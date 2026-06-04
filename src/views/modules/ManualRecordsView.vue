<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Edit, Plus, Search, Upload, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantHandKept,
  deleteTenantHandKept,
  editTenantHandKept,
  exportTenantHandKept,
  getTenantHandKeptDetail,
  getTenantHandKeptList,
  getTenantReceivableOrderList,
  uploadTenantFile
} from '../../api/tenant'

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  orderNo: '',
  operator: ''
})

const form = reactive({
  id: '',
  name: '',
  orderId: '',
  orderNo: '',
  orderCustomer: '',
  orderTime: '',
  orderFiller: '',
  orderProductInfo: '',
  orderAmount: '',
  orderStatus: '',
  quantity: '',
  imageRemark: '',
  imageUrl: '',
  remark: ''
})

const orderPicker = reactive({
  loading: false,
  pageNum: 1,
  pageSize: 10,
  total: 0,
  companyName: '',
  orderId: '',
  records: []
})

const state = reactive({
  loading: false,
  saving: false,
  uploading: false,
  exporting: false,
  detailLoading: false,
  total: 0
})

const rows = ref([])
const currentRow = ref(null)
const formVisible = ref(false)
const detailVisible = ref(false)
const orderPickerVisible = ref(false)

const isEdit = computed(() => Boolean(form.id))
const selectedOrderRows = computed(() =>
  form.orderId
    ? [{
        id: form.orderId,
        orderNo: form.orderNo || '-',
        customer: form.orderCustomer || '-',
        orderTime: form.orderTime || '-',
        filler: form.orderFiller || '-',
        productInfo: form.orderProductInfo || '-',
        amount: form.orderAmount || 0,
        status: form.orderStatus || '-'
      }]
    : []
)

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.handKeptId,
  name: row.name || '-',
  quantity: row.num ?? row.quantity ?? 0,
  imageRemark: row.imgRemark || row.imageRemark || row.fileId || '',
  imageUrl: row.imgRemarkUrl || row.fileUrl || row.img || row.image || row.picture || row.proofImg || '',
  remark: row.remark || row.detailNote || '',
  orderNo: row.order?.orderId || row.orderNo || row.orderId || '-',
  orderId: row.order?.id || (typeof row.orderId === 'number' ? row.orderId : ''),
  operator: row.createUserName || row.operator || '-',
  updatedAt: row.createTime || row.updatedAt || '-'
})

const productInfoText = (row = {}) => {
  if (row.productInfo) return row.productInfo
  if (row.productName) return row.productName
  const products = row.products || row.productList || row.productsList || row.orderProductList || []
  if (!Array.isArray(products)) return '-'
  return products.map((item) => item.productInfo || item.productName || item.name).filter(Boolean).join('、') || '-'
}

const normalizeOrderOption = (row = {}) => ({
  ...row,
  id: row.id || row.orderId || row.orderRecordId || row.orderPrimaryId,
  orderNo: row.orderNo || row.orderId || '-',
  customer: row.companyName || row.customerName || '-',
  orderTime: row.orderTime || row.createTime || '-',
  filler: row.fillUserName || row.userName || '-',
  productInfo: productInfoText(row),
  amount: row.billMoney ?? row.totalMoney ?? row.payMoney ?? row.amount ?? 0,
  status: row.orderStatus || row.status || '-'
})

const fillFormFromRecord = (record = {}) => {
  const order = record.order || {}
  Object.assign(form, {
    id: record.id || '',
    name: record.name === '-' ? '' : record.name || '',
    orderId: record.orderId || order.id || '',
    orderNo: order.orderId || record.orderNo || '',
    orderCustomer: order.companyName || '',
    orderTime: order.orderTime || '',
    orderFiller: order.fillUserName || '',
    orderProductInfo: productInfoText(order),
    orderAmount: order.totalMoney ?? order.billMoney ?? 0,
    orderStatus: order.status || order.orderStatus || '',
    quantity: record.num ?? record.quantity ?? '',
    imageRemark: record.imgRemark || record.imageRemark || '',
    imageUrl: record.imgRemarkUrl || record.imageUrl || '',
    remark: record.remark || ''
  })
}

const queryPayload = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  name: filters.name || undefined,
  orderId: filters.orderNo || undefined,
  createUserName: filters.operator || undefined
})

const savePayload = () => ({
  id: form.id || undefined,
  name: form.name,
  orderId: form.orderId || undefined,
  num: form.quantity,
  remark: form.remark,
  imgRemark: form.imageRemark || undefined
})

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantHandKeptList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '手工记录加载失败')
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
    orderNo: '',
    operator: ''
  })
  loadData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    name: '',
    orderId: '',
    orderNo: '',
    orderCustomer: '',
    orderTime: '',
    orderFiller: '',
    orderProductInfo: '',
    orderAmount: '',
    orderStatus: '',
    quantity: '',
    imageRemark: '',
    imageUrl: '',
    remark: ''
  })
}

const loadOrderOptions = async () => {
  orderPicker.loading = true
  try {
    const data = await getTenantReceivableOrderList({
      pageNum: orderPicker.pageNum,
      pageSize: orderPicker.pageSize,
      companyName: orderPicker.companyName || undefined,
      orderNo: orderPicker.orderId || undefined
    })
    const normalizedRows = listRows(data).map(normalizeOrderOption)
    orderPicker.records = normalizedRows
    orderPicker.total = listTotal(data, normalizedRows)
  } catch (error) {
    orderPicker.records = []
    orderPicker.total = 0
    ElMessage.error(error?.message || '订单列表加载失败')
  } finally {
    orderPicker.loading = false
  }
}

const openOrderPicker = () => {
  orderPickerVisible.value = true
  orderPicker.pageNum = 1
  loadOrderOptions()
}

const searchOrderOptions = () => {
  orderPicker.pageNum = 1
  loadOrderOptions()
}

const selectOrder = (row) => {
  form.orderId = row.id || ''
  form.orderNo = row.orderNo || ''
  form.orderCustomer = row.customer || ''
  form.orderTime = row.orderTime || ''
  form.orderFiller = row.filler || ''
  form.orderProductInfo = row.productInfo || ''
  form.orderAmount = row.amount || 0
  form.orderStatus = row.status || ''
  orderPickerVisible.value = false
}

const uploadImage = async ({ file }) => {
  state.uploading = true
  try {
    const fileId = await uploadTenantFile(file)
    form.imageRemark = fileId
    form.imageUrl = URL.createObjectURL(file)
    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error(error?.message || '图片上传失败')
  } finally {
    state.uploading = false
  }
}

const removeImage = () => {
  form.imageRemark = ''
  form.imageUrl = ''
}

const openCreate = () => {
  resetForm()
  formVisible.value = true
}

const openEdit = async (row) => {
  resetForm()
  formVisible.value = true
  if (!row.id) return
  state.detailLoading = true
  try {
    const data = await getTenantHandKeptDetail(row.id)
    fillFormFromRecord(data)
  } catch (error) {
    ElMessage.error(error?.message || '编辑回显加载失败')
    formVisible.value = false
  } finally {
    state.detailLoading = false
  }
}

const submitForm = async () => {
  if (!form.name) return ElMessage.warning('请输入手工名称')
  if (!form.orderId) return ElMessage.warning('请选择关联订单')
  state.saving = true
  try {
    if (form.id) {
      await editTenantHandKept(savePayload())
    } else {
      await addTenantHandKept(savePayload())
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

const openDetail = async (row) => {
  currentRow.value = row
  detailVisible.value = true
  if (!row.id) return
  state.detailLoading = true
  try {
    const data = await getTenantHandKeptDetail(row.id)
    currentRow.value = normalizeRow({ ...row, ...data })
  } catch (error) {
    ElMessage.error(error?.message || '手工记录详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

const removeRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除手工记录 ${row.name} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantHandKept(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
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
    const blob = await exportTenantHandKept(queryPayload())
    downloadBlob(blob, '手工记录.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    state.exporting = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="module-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="手工名称">
          <el-input v-model="filters.name" clearable placeholder="请输入手工名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="关联订单">
          <el-input v-model="filters.orderNo" clearable placeholder="请输入关联订单" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="操作员">
          <el-input v-model="filters.operator" clearable placeholder="请输入操作员" @keyup.enter="searchData" />
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
        <el-table-column prop="name" label="手工名称" min-width="140" />
        <el-table-column prop="quantity" label="数量" min-width="90" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="orderNo" label="关联订单" min-width="140" />
        <el-table-column prop="operator" label="操作员" min-width="110" />
        <el-table-column prop="updatedAt" label="操作时间" min-width="170" />
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

    <el-dialog v-model="formVisible" :title="isEdit ? '编辑手工记录' : '添加手工记录'" width="1080px">
      <div v-loading="state.detailLoading">
        <el-form class="manual-form" :model="form" label-position="top">
          <el-form-item label="手工名称" required>
            <el-input v-model="form.name" placeholder="请输入手工名称" />
          </el-form-item>
          <el-form-item label="数量">
            <el-input v-model="form.quantity" placeholder="请输入数量" />
          </el-form-item>
          <el-form-item label="图片备注" class="full">
            <div class="image-upload">
              <el-upload accept="image/*" :show-file-list="false" :http-request="uploadImage">
                <el-button size="small" :loading="state.uploading">选择文件</el-button>
              </el-upload>
              <span class="upload-tip">{{ form.imageRemark ? `文件ID：${form.imageRemark}` : '未选择任何文件' }}</span>
              <el-image v-if="form.imageUrl" :src="form.imageUrl" :preview-src-list="[form.imageUrl]" fit="cover" preview-teleported />
              <el-button v-if="form.imageUrl" link type="danger" @click="removeImage">删除图片</el-button>
            </div>
          </el-form-item>
          <el-form-item label="备注" class="full">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="输入" />
          </el-form-item>
        </el-form>
        <section class="selected-order-section">
          <div class="selected-order-head">
            <h3>订单信息</h3>
            <el-button type="primary" :icon="Search" @click="openOrderPicker">
              {{ form.orderId ? '更换订单' : '选择订单' }}
            </el-button>
          </div>
          <el-table :data="selectedOrderRows" border>
            <el-table-column prop="orderNo" label="订单号" min-width="150" />
            <el-table-column prop="customer" label="单位名称" min-width="160" />
            <el-table-column prop="orderTime" label="订单时间" min-width="160" />
            <el-table-column prop="filler" label="填单员" min-width="110" />
            <el-table-column prop="productInfo" label="产品信息" min-width="220" show-overflow-tooltip />
            <el-table-column prop="amount" label="订单金额" min-width="110" />
            <el-table-column prop="status" label="订单状态" min-width="110" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default>
                <el-button type="primary" link @click="openOrderPicker">{{ form.orderId ? '更换' : '选择' }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="state.saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="orderPickerVisible" title="选择订单" width="980px">
      <div class="picker-head">
        <el-input v-model="orderPicker.companyName" clearable placeholder="单位名称" @keyup.enter="searchOrderOptions" />
        <el-input v-model="orderPicker.orderId" clearable placeholder="订单号" @keyup.enter="searchOrderOptions" />
        <el-button type="primary" :icon="Search" @click="searchOrderOptions">查询</el-button>
      </div>
      <el-table v-loading="orderPicker.loading" :data="orderPicker.records" border>
        <el-table-column prop="orderNo" label="订单号" min-width="150" />
        <el-table-column prop="customer" label="单位名称" min-width="150" />
        <el-table-column prop="orderTime" label="订单时间" min-width="160" />
        <el-table-column prop="filler" label="填单员" min-width="100" />
        <el-table-column prop="productInfo" label="产品信息" min-width="180" show-overflow-tooltip />
        <el-table-column prop="amount" label="订单金额" min-width="110" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="selectOrder(row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="orderPicker.pageNum"
          v-model:page-size="orderPicker.pageSize"
          background
          small
          layout="total, prev, pager, next"
          :total="orderPicker.total"
          @current-change="loadOrderOptions"
        />
      </div>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="手工记录详情" width="760px">
      <div v-loading="state.detailLoading">
        <dl v-if="currentRow" class="detail-grid">
          <div><dt>手工名称</dt><dd>{{ currentRow.name }}</dd></div>
          <div><dt>数量</dt><dd>{{ currentRow.quantity }}</dd></div>
          <div><dt>关联订单</dt><dd>{{ currentRow.orderNo }}</dd></div>
          <div><dt>操作员</dt><dd>{{ currentRow.operator }}</dd></div>
          <div><dt>操作时间</dt><dd>{{ currentRow.updatedAt }}</dd></div>
          <div><dt>图片备注</dt><dd>{{ currentRow.imageRemark || '-' }}</dd></div>
          <div v-if="currentRow.imageUrl" class="full"><dt>图片</dt><dd><el-image class="detail-image" :src="currentRow.imageUrl" :preview-src-list="[currentRow.imageUrl]" fit="cover" preview-teleported /></dd></div>
          <div class="full"><dt>备注</dt><dd>{{ currentRow.remark || '-' }}</dd></div>
        </dl>
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

.manual-form {
  display: grid;
  grid-template-columns: 260px 260px minmax(260px, 1fr);
  gap: 14px 22px;
}

.manual-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.manual-form .full {
  grid-column: 1 / -1;
}

.manual-form :deep(.el-input),
.manual-form :deep(.el-textarea) {
  max-width: 620px;
}

.selected-order-section {
  margin-top: 22px;
}

.selected-order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.selected-order-head h3 {
  margin: 0;
  font-size: 16px;
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-tip {
  color: #8a93a3;
}

.image-upload :deep(.el-image),
.detail-image {
  width: 80px;
  height: 80px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.picker-head {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.picker-head :deep(.el-input) {
  width: 220px;
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
