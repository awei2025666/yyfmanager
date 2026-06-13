<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus, Search, Upload, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantConsumableDetail,
  deleteTenantConsumableDetail,
  editTenantConsumableDetail,
  getTenantConsumableDetail,
  getTenantConsumableDetailList, getTenantOrderListAll,
  searchTenantConsumables,
  uploadTenantFile
} from '../../api/tenant'

const route = useRoute()
const router = useRouter()

const typeOptions = [
  { label: '系统入库', value: '1' },
  { label: '手工出库', value: '2' },
  { label: '订单消耗', value: '3' }
]

const orderStatusMap = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回',
  8: '已转外协'
}

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  type: '',
  orderNo: ''
})

const state = reactive({
  loading: false,
  detailLoading: false,
  saving: false,
  uploading: false,
  total: 0
})

const rows = ref([])
const currentRow = ref(null)
const detailVisible = ref(false)
const formVisible = ref(false)
const orderPickerVisible = ref(false)
const consumableOptions = ref([])

const form = reactive({
  id: '',
  consumableId: '',
  consumableName: '',
  consumableUnit: '',
  consumableMoney: '',
  type: '1',
  num: '',
  fileId: '',
  fileUrl: '',
  remark: '',
  orderId: '',
  orderNo: '',
  orderCompanyName: '',
  orderTime: '',
  orderFiller: '',
  orderProductInfo: '',
  orderMoney: '',
  orderStatus: ''
})

const orderPicker = reactive({
  loading: false,
  pageNum: 1,
  pageSize: 10,
  total: 0,
  companyName: '',
  orderNo: '',
  records: []
})

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const typeText = (value) =>
  typeOptions.find((item) => String(item.value) === String(value))?.label || value || '-'

const productInfoText = (row = {}) => {
  if (row.productInfo) return row.productInfo
  if (row.productName) return row.productName
  const products = row.products || row.productList || row.productsList || []
  if (!Array.isArray(products)) return '-'
  return products.map((item) => item.productInfo || item.productName || item.name).filter(Boolean).join('、') || '-'
}

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.consumableDetailId,
  name: row.consumableName || row.name || '-',
  unit: row.unit || row.consumableUnit || row.unitName || '个',
  price: row.consumableMoney ?? row.price ?? row.unitPrice ?? row.consumablePrice ?? row.money ?? row.amount ?? 0,
  type: typeText(row.type),
  typeValue: String(row.type || ''),
  quantity: row.num ?? row.quantity ?? 0,
  orderNo: row.orderId || row.order?.orderId || '-',
  operator: row.createUserName || row.operator || '-',
  updatedAt: row.createTime || row.updatedAt || '-',
  imageRemark: row.imgRemark || row.img || row.imageRemark || row.picture || row.fileId || '',
  imageUrl: row.imgRemarkUrl || row.fileUrl || row.imageUrl || row.imgUrl || '',
  remark: row.remark || row.detailNote || ''
})

const normalizeOrderOption = (row = {}) => ({
  ...row,
  id: row.id || row.orderId || row.orderRecordId,
  orderNo: row.orderNo || row.orderId || '-',
  companyName: row.companyName || '-',
  orderTime: row.orderTime || row.createTime || '-',
  fillUserName: row.fillUserName || '-',
  productInfo: productInfoText(row),
  money: row.billMoney ?? row.totalMoney ?? 0,
  status: orderStatusMap[row.orderStatus || row.status] || row.orderStatus || row.status || '-'
})

const normalizeLinkedOrder = (record = {}) => {
  const order = record.order || {}
  return {
    id: order.id || record.orderId || '',
    orderNo: order.orderId || record.orderNo || record.orderNoText || record.orderCode || '-',
    companyName: order.companyName || record.companyName || '-',
    orderTime: order.orderTime || record.orderTime || '-',
    fillUserName: order.fillUserName || record.fillUserName || '-',
    productInfo: productInfoText(order.id ? order : record),
    money: order.totalMoney ?? order.billMoney ?? record.totalMoney ?? record.billMoney ?? 0,
    status: orderStatusMap[order.status || order.orderStatus || record.orderStatus || record.status] || order.status || order.orderStatus || record.orderStatus || record.status || '-'
  }
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    consumableId: '',
    consumableName: '',
    consumableUnit: '',
    consumableMoney: '',
    type: '1',
    num: '',
    fileId: '',
    fileUrl: '',
    remark: '',
    orderId: '',
    orderNo: '',
    orderCompanyName: '',
    orderTime: '',
    orderFiller: '',
    orderProductInfo: '',
    orderMoney: '',
    orderStatus: ''
  })
}

const fillFormFromRecord = (record = {}) => {
  const order = normalizeLinkedOrder(record)
  Object.assign(form, {
    id: record.id || '',
    consumableId: record.consumableId || '',
    consumableName: record.consumableName || '',
    consumableUnit: record.consumableUnit || record.unit || '',
    consumableMoney: record.consumableMoney ?? record.money ?? '',
    type: String(record.type || '1'),
    num: record.num ?? '',
    fileId: record.fileId || '',
    fileUrl: record.fileUrl || '',
    remark: record.remark || '',
    orderId: order.id || '',
    orderNo: order.orderNo === '-' ? '' : order.orderNo,
    orderCompanyName: order.companyName === '-' ? '' : order.companyName,
    orderTime: order.orderTime === '-' ? '' : order.orderTime,
    orderFiller: order.fillUserName === '-' ? '' : order.fillUserName,
    orderProductInfo: order.productInfo,
    orderMoney: order.money,
    orderStatus: order.status
  })
  if (form.consumableId && form.consumableName && !consumableOptions.value.some((item) => item.id === form.consumableId)) {
    consumableOptions.value.push({
      id: form.consumableId,
      name: form.consumableName,
      unit: form.consumableUnit,
      money: form.consumableMoney
    })
  }
}

const queryPayload = () => ({
  pageNum: filters.pageNum,
  pageSize: filters.pageSize,
  consumableName: filters.name || undefined,
  type: filters.type || undefined,
  orderId: filters.orderNo || undefined
})

const savePayload = () => ({
  id: form.id || undefined,
  consumableId: form.consumableId || undefined,
  type: form.type ? Number(form.type) : undefined,
  num: form.num === '' ? undefined : Number(form.num),
  fileId: form.fileId || undefined,
  remark: form.remark || undefined,
  orderId: form.type === '3' ? form.orderId || undefined : undefined
})

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantConsumableDetailList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '耗材明细加载失败')
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
    type: '',
    orderNo: ''
  })
  loadData()
}

const loadConsumables = async (name = '') => {
  try {
    consumableOptions.value = await searchTenantConsumables({ name })
  } catch (error) {
    ElMessage.error(error?.message || '耗材列表加载失败')
  }
}

const handleConsumableChange = (id) => {
  const consumable = consumableOptions.value.find((item) => item.id === id)
  form.consumableName = consumable?.name || ''
  form.consumableUnit = consumable?.unit || ''
  form.consumableMoney = consumable?.money ?? ''
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
    const data = await getTenantConsumableDetail(row.id)
    fillFormFromRecord(data)
  } catch (error) {
    ElMessage.error(error?.message || '编辑回显加载失败')
    formVisible.value = false
  } finally {
    state.detailLoading = false
  }
}

const uploadImage = async ({ file }) => {
  state.uploading = true
  try {
    const data = await uploadTenantFile(file)
    form.fileId = data?.id || data?.fileId || data
    form.fileUrl = data?.url || data?.fileUrl || URL.createObjectURL(file)
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error(error?.message || '上传失败')
  } finally {
    state.uploading = false
  }
}

const loadOrderOptions = async () => {
  orderPicker.loading = true
  try {
    const data = await getTenantOrderListAll({
      pageNum: orderPicker.pageNum,
      pageSize: orderPicker.pageSize,
      companyName: orderPicker.companyName || undefined,
      orderId: orderPicker.orderNo || undefined
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
  form.orderCompanyName = row.companyName || ''
  form.orderTime = row.orderTime || ''
  form.orderFiller = row.fillUserName || ''
  form.orderProductInfo = row.productInfo || ''
  form.orderMoney = row.money ?? ''
  form.orderStatus = row.status || ''
  orderPickerVisible.value = false
}

const openOrderDetail = (order) => {
  const detailId = order?.id || order?.orderId || order?.orderNo
  if (!detailId) {
    ElMessage.warning('缺少订单ID，无法查看详情')
    return
  }
  router.push({ name: 'orders', query: { detailId } })
}

const openCurrentRowOrderDetail = () => {
  openOrderDetail(currentRow.value?.linkedOrder)
}

const closeDetail = () => {
  detailVisible.value = false
  currentRow.value = null
}

const submitForm = async () => {
  if (!form.consumableId) return ElMessage.warning('请选择耗材名称')
  if (!form.num) return ElMessage.warning('请输入数量')
  state.saving = true
  const editId = form.id
  try {
    if (editId) {
      await editTenantConsumableDetail(savePayload())
    } else {
      await addTenantConsumableDetail(savePayload())
    }
    ElMessage.success(editId ? '编辑成功' : '新增成功')
    formVisible.value = false
    await loadData()
    if (editId && detailVisible.value) {
      await openDetail({ ...(currentRow.value || {}), id: editId })
    }
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    state.saving = false
  }
}

const removeRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除耗材明细 ${row.name} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteTenantConsumableDetail(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const openDetail = async (row) => {
  currentRow.value = row
  detailVisible.value = true
  if (!row.id) return
  state.detailLoading = true
  try {
    const data = await getTenantConsumableDetail(row.id)
    currentRow.value = {
      ...normalizeRow({ ...row, ...data }),
      linkedOrder: normalizeLinkedOrder(data)
    }
  } catch (error) {
    ElMessage.error(error?.message || '耗材明细详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

watch(
  () => form.type,
  (type) => {
    if (String(type) !== '3') {
      Object.assign(form, {
        orderId: '',
        orderNo: '',
        orderCompanyName: '',
        orderTime: '',
        orderFiller: '',
        orderProductInfo: '',
        orderMoney: '',
        orderStatus: ''
      })
    }
  }
)

watch(
  () => route.query.name,
  (name) => {
    if (name === undefined) return
    filters.name = String(name || '')
    filters.pageNum = 1
    loadData()
  }
)

onMounted(() => {
  filters.name = String(route.query.name || '')
  loadConsumables()
  loadData()
})
</script>

<template>
  <div class="module-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="耗材名称">
          <el-input v-model="filters.name" clearable placeholder="请输入耗材名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.type" clearable placeholder="请选择状态">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联订单">
          <el-input v-model="filters.orderNo" clearable placeholder="请输入关联订单" @keyup.enter="searchData" />
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
        <el-table-column prop="name" label="耗材名称" min-width="150" />
        <el-table-column prop="type" label="明细类型" min-width="110" />
        <el-table-column prop="quantity" label="数量" min-width="90" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="orderNo" label="关联订单" min-width="150" />
        <el-table-column prop="operator" label="操作员" min-width="110" />
        <el-table-column prop="updatedAt" label="操作时间" min-width="170" />
        <el-table-column label="操作" width="110" fixed="right">
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

    <el-dialog v-model="formVisible" :title="form.id ? '编辑耗材明细' : '添加耗材明细'" width="1080px">
      <div v-loading="state.detailLoading">
        <el-form class="detail-form" :model="form" label-position="top">
          <el-form-item label="耗材名称" required class="full">
            <el-select
              v-model="form.consumableId"
              clearable
              filterable
              remote
              reserve-keyword
              placeholder="请选择耗材"
              :remote-method="loadConsumables"
              @change="handleConsumableChange"
            >
              <el-option v-for="item in consumableOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="耗材单位">
            <el-input v-model="form.consumableUnit" disabled placeholder="请输入耗材单位" />
          </el-form-item>
          <el-form-item label="耗材价值">
            <el-input v-model="form.consumableMoney" disabled placeholder="请输入耗材金额">
              <template #append>元</template>
            </el-input>
          </el-form-item>
          <el-form-item label="明细类型" required class="full">
            <el-radio-group v-model="form.type">
              <el-radio v-for="item in typeOptions" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="数量" required>
            <el-input v-model="form.num" placeholder="请输入数量" />
          </el-form-item>
          <el-form-item label="图片备注" class="full">
            <div class="image-upload">
              <el-upload action="#" accept="image/*" :show-file-list="false" :http-request="uploadImage">
                <el-button size="small" :loading="state.uploading" :icon="Upload">选择文件</el-button>
              </el-upload>
              <span class="upload-tip">{{ form.fileId ? `` : '未选择任何文件' }}</span>
              <el-image v-if="form.fileUrl" class="preview-image" :src="form.fileUrl" :preview-src-list="[form.fileUrl]" fit="cover" preview-teleported />
            </div>
          </el-form-item>
          <el-form-item label="备注" class="full">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
          </el-form-item>
        </el-form>

        <section v-if="form.type === '3'" class="selected-order-section">
          <div class="selected-order-head">
            <h3>订单信息</h3>
            <el-button v-if="!form.orderId" type="primary" :icon="Search" @click="openOrderPicker">
              {{ form.orderId ? '更换订单' : '选择订单' }}
            </el-button>
          </div>
          <el-table :data="form.orderId ? [form] : []" border>
            <el-table-column prop="orderNo" label="订单号" min-width="150" />
            <el-table-column prop="orderCompanyName" label="单位名称" min-width="160" />
            <el-table-column prop="orderTime" label="订单时间" min-width="160" />
            <el-table-column prop="orderFiller" label="填单员" min-width="110" />
            <el-table-column prop="orderProductInfo" label="产品信息" min-width="220" show-overflow-tooltip />
            <el-table-column prop="orderMoney" label="订单金额" min-width="110" />
            <el-table-column prop="orderStatus" label="订单状态" min-width="110" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default>
                <el-button type="primary" link @click="openOrderPicker">更换</el-button>
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

    <el-dialog v-model="detailVisible" title="耗材明细详情" width="1280px">
      <div v-loading="state.detailLoading" class="material-detail-dialog">
        <PageBlock title="耗材信息">
          <div class="material-detail-card">
            <div class="material-detail-grid">
              <div class="detail-field">
                <span>耗材名称：</span>
                <strong>{{ currentRow?.name || '-' }}</strong>
              </div>
              <div class="detail-field">
                <span>耗材单位：</span>
                <strong>{{ currentRow?.unit || '-' }}</strong>
              </div>
              <div class="detail-field">
                <span>耗材价值：</span>
                <strong>¥{{ Number(currentRow?.price || 0).toFixed(2) }}</strong>
              </div>
              <div class="detail-field">
                <span>明细类型：</span>
                <strong>{{ currentRow?.type || '-' }}</strong>
              </div>
              <div class="detail-field">
                <span>数量：</span>
                <strong>{{ currentRow?.quantity ?? '-' }}</strong>
              </div>
              <div class="detail-field full">
                <span>图片备注：</span>
                <div class="detail-images">
                  <el-image
                    v-if="currentRow?.imageUrl"
                    class="detail-image"
                    :src="currentRow.imageUrl"
                    :preview-src-list="[currentRow.imageUrl]"
                    fit="cover"
                    preview-teleported
                  />
                  <span v-else>-</span>
                </div>
              </div>
              <div class="detail-field">
                <span>备注：</span>
                <strong>{{ currentRow?.remark || '-' }}</strong>
              </div>
              <div class="detail-field">
                <span>操作员：</span>
                <strong>{{ currentRow?.operator || '-' }}</strong>
              </div>
              <div class="detail-field">
                <span>操作时间：</span>
                <strong>{{ currentRow?.updatedAt || '-' }}</strong>
              </div>
            </div>
          </div>
        </PageBlock>

        <PageBlock title="订单信息">
          <el-table :data="currentRow?.linkedOrder?.id ? [currentRow.linkedOrder] : []" border>
            <el-table-column prop="orderNo" label="订单号" min-width="150" />
            <el-table-column prop="companyName" label="单位名称" min-width="180" />
            <el-table-column prop="orderTime" label="订单时间" min-width="160" />
            <el-table-column prop="fillUserName" label="填单员" min-width="110" />
            <el-table-column prop="productInfo" label="产品信息" min-width="260" show-overflow-tooltip />
            <el-table-column prop="money" label="订单金额" min-width="120">
              <template #default="{ row }">¥{{ Number(row.money || 0).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="订单状态" min-width="110" />
          </el-table>
        </PageBlock>
      </div>
      <template #footer>
        <el-button @click="closeDetail">返回</el-button>
        <el-button type="primary" @click="openEdit(currentRow)">编辑</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="orderPickerVisible" title="选择订单" width="980px">
      <div class="picker-head">
        <el-input v-model="orderPicker.companyName" clearable placeholder="请输入单位名称" @keyup.enter="searchOrderOptions" />
        <el-input v-model="orderPicker.orderNo" clearable placeholder="请输入订单号" @keyup.enter="searchOrderOptions" />
        <el-button type="primary" :icon="Search" @click="searchOrderOptions">查询</el-button>
      </div>
      <el-table v-loading="orderPicker.loading" :data="orderPicker.records" border>
        <el-table-column prop="orderNo" label="订单号" min-width="150" />
        <el-table-column prop="companyName" label="单位名称" min-width="150" />
        <el-table-column prop="orderTime" label="订单时间" min-width="160" />
        <el-table-column prop="fillUserName" label="填单员" min-width="100" />
        <el-table-column prop="productInfo" label="产品信息" min-width="180" show-overflow-tooltip />
        <el-table-column prop="money" label="订单金额" min-width="110" />
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
  margin-bottom: 12px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.detail-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 24px;
}

.detail-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.detail-form :deep(.el-select),
.detail-form :deep(.el-input) {
  width: 100%;
}

.detail-form .full {
  grid-column: 1 / -1;
}

.image-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-tip {
  color: #8a93a3;
}

.preview-image {
  width: 64px;
  height: 64px;
  border-radius: 4px;
}

.selected-order-section {
  margin-top: 18px;
}

.selected-order-head,
.picker-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.selected-order-head {
  justify-content: space-between;
}

.selected-order-head h3 {
  margin: 0;
}

.picker-head .el-input {
  width: 220px;
}

.material-detail-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 70vh;
  overflow: auto;
  padding-right: 4px;
}

.material-detail-card {
  min-height: 320px;
}

.material-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 80px;
  padding: 6px 0 14px;
}

.detail-field {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  align-items: start;
  gap: 14px;
  min-width: 0;
  color: #111111;
  font-size: 16px;
}

.detail-field.full {
  grid-column: 1 / -1;
}

.detail-field span {
  color: #8a93a3;
  font-weight: 700;
}

.detail-field strong {
  min-width: 0;
  color: #111111;
  font-weight: 700;
  word-break: break-all;
}

.detail-images {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 72px;
}

.detail-image {
  width: 88px;
  height: 88px;
  border-radius: 4px;
  background: #eeeeee;
}

</style>
