<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Plus, Search, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantDelivery,
  editTenantDelivery,
  getTenantDeliveryDetail,
  getTenantDeliveryList,
  getTenantDeliveryProcess,
  getTenantProductionUsers
} from '../../api/tenant'

const statusOptions = [
  { label: '待配送', value: '1' },
  { label: '配送中', value: '2' },
  { label: '已完成', value: '3' }
]

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  deliveryNo: '',
  filler: '',
  orderInfo: '',
  driver: '',
  status: '',
  createdAt: []
})

const form = reactive({
  id: '',
  driverId: '',
  orderIds: ''
})

const state = reactive({
  loading: false,
  optionLoading: false,
  saving: false,
  detailLoading: false,
  total: 0
})

const rows = ref([])
const drivers = ref([])
const currentRow = ref(null)
const formVisible = ref(false)
const detailVisible = ref(false)

const isEdit = computed(() => Boolean(form.id))

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const statusText = (value) =>
  statusOptions.find((item) => String(item.value) === String(value))?.label || value || '-'

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.deliveryId,
  deliveryNo: row.deliveryOrderId || row.deliveryNo || '-',
  createdAt: row.createTime || row.createdAt || '-',
  filler: row.fillUserName || row.filler || '-',
  orderInfo: row.orderInfo || row.orderNo || row.orderId || '-',
  driver: row.deliveryUserName || row.driver || '-',
  driverId: row.deliveryTenantUserId || row.deliveryUserId || '',
  progress: row.deliveryProgress || row.progress || '-',
  status: statusText(row.status),
  rawStatus: row.status
})

const orderStatusMap = {
  1: '待审批',
  2: '待生产',
  3: '生产中',
  4: '待配送',
  5: '配送中',
  6: '已完成',
  7: '已驳回'
}

const deliveryOrderStatusMap = {
  1: '配送中',
  2: '已完成'
}

const normalizeOrderRow = (row = {}) => ({
  ...row,
  id: row.id || row.orderId,
  orderNo: row.orderId || row.orderNo || '-',
  customer: row.companyName || row.customer || '-',
  orderTime: row.orderTime || row.createTime || '-',
  filler: row.fillUserName || row.filler || '-',
  productInfo: row.productInfo || row.productName || '-',
  amount: row.totalMoney ?? row.amount ?? 0,
  orderStatus: orderStatusMap[Number(row.orderStatus || row.status)] || row.orderStatus || row.status || '-',
  status: deliveryOrderStatusMap[Number(row.deliveryStatus)] || row.deliveryStatus || '-'
})

const queryPayload = () => {
  const [start, end] = filters.createdAt || []
  return {
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    deliveryOrderId: filters.deliveryNo || undefined,
    deliveryUserName: filters.driver || undefined,
    fillUserName: filters.filler || undefined,
    orderInfo: filters.orderInfo || undefined,
    status: filters.status || undefined,
    createTimeStart: start || undefined,
    createTimeEnd: end || start || undefined
  }
}

const loadDrivers = async () => {
  state.optionLoading = true
  try {
    const data = await getTenantProductionUsers({ pageNum: 1, pageSize: 50 })
    drivers.value = listRows(data).map((item) => ({
      label: item.name || item.userName || '-',
      value: String(item.id || item.userId || '')
    })).filter((item) => item.value)
  } finally {
    state.optionLoading = false
  }
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantDeliveryList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '配送单加载失败')
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
    deliveryNo: '',
    filler: '',
    orderInfo: '',
    driver: '',
    status: '',
    createdAt: []
  })
  loadData()
}

const resetForm = () => {
  Object.assign(form, {
    id: '',
    driverId: '',
    orderIds: ''
  })
}

const openCreate = () => {
  resetForm()
  formVisible.value = true
}

const openEdit = async (row) => {
  resetForm()
  form.id = row.id
  form.driverId = String(row.driverId || '')
  formVisible.value = true
  if (!row.id) return
  try {
    const data = await getTenantDeliveryDetail(row.id)
    const orderIds = listRows(data.orderList).map((item) => item.id || item.orderId).filter(Boolean)
    form.orderIds = orderIds.join(',')
    form.driverId = String(data.deliveryUser?.id || row.driverId || '')
  } catch {
    form.orderIds = ''
  }
}

const savePayload = () => ({
  id: form.id || undefined,
  deliveryTenantUserId: form.driverId || undefined,
  orderIdList: String(form.orderIds || '')
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
})

const submitForm = async () => {
  if (!form.driverId) return ElMessage.warning('请选择配送员')
  if (!form.orderIds) return ElMessage.warning('请输入订单ID')
  state.saving = true
  try {
    if (form.id) {
      await editTenantDelivery(savePayload())
    } else {
      await addTenantDelivery(savePayload())
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
  currentRow.value = {
    ...row,
    driverRows: [],
    deliveryOrders: [],
    deliveryTimeline: []
  }
  detailVisible.value = true
  if (!row.id) return
  state.detailLoading = true
  try {
    const [detail, processList] = await Promise.all([
      getTenantDeliveryDetail(row.id),
      getTenantDeliveryProcess(row.id).catch(() => [])
    ])
    const deliveryUser = detail.deliveryUser || {}
    currentRow.value = {
      ...row,
      ...detail,
      deliveryNo: detail.deliveryOrderId || row.deliveryNo,
      status: statusText(detail.status || row.rawStatus),
      driver: deliveryUser.name || row.driver || '-',
      driverRows: deliveryUser.id
        ? [{
            id: deliveryUser.id,
            name: deliveryUser.name || '-',
            phone: deliveryUser.phone || '-',
            department: deliveryUser.deptName || '-',
            roleText: deliveryUser.roleName || '-'
          }]
        : [],
      deliveryOrders: listRows(detail.orderList).map(normalizeOrderRow),
      deliveryTimeline: listRows(processList).map((item) => ({
        date: item.createTime || '-',
        title: item.content || '配送记录',
        description: item.tenantUserName || item.createUserName || ''
      }))
    }
  } catch (error) {
    ElMessage.error(error?.message || '配送单详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

onMounted(() => {
  loadDrivers()
  loadData()
})
</script>

<template>
  <div class="module-page">
    <PageBlock>
      <el-form class="search-form" :model="filters" label-width="86px">
        <el-form-item label="配送单号">
          <el-input v-model="filters.deliveryNo" clearable placeholder="请输入配送单号" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="填单员">
          <el-input v-model="filters.filler" clearable placeholder="请输入填单员" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="订单信息">
          <el-input v-model="filters.orderInfo" clearable placeholder="请输入订单信息" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="配送员">
          <el-input v-model="filters.driver" clearable placeholder="请输入配送员" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="配送状态">
          <el-select v-model="filters.status" clearable placeholder="请选择配送状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="filters.createdAt"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
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
        <el-button type="primary" :icon="Plus" @click="openCreate">添加</el-button>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="deliveryNo" label="配送单号" min-width="140" />
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
        <el-table-column prop="filler" label="填单员" min-width="100" />
        <el-table-column prop="orderInfo" label="订单信息" min-width="180" show-overflow-tooltip />
        <el-table-column prop="driver" label="配送员" min-width="110" />
        <el-table-column prop="progress" label="配送进度" min-width="120" />
        <el-table-column prop="status" label="配送状态" min-width="110" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="openDetail(row)">详情</el-button>
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
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

    <el-dialog v-model="formVisible" :title="isEdit ? '编辑配送单' : '添加配送单'" width="680px">
      <el-form class="edit-form" :model="form" label-width="96px" v-loading="state.optionLoading">
        <el-form-item label="配送员" required>
          <el-select v-model="form.driverId" filterable clearable placeholder="请选择配送员">
            <el-option v-for="item in drivers" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单ID" required>
          <el-input v-model="form.orderIds" placeholder="多个订单ID用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="state.saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="配送单详情" width="1080px">
      <div v-loading="state.detailLoading">
        <el-table :data="currentRow?.deliveryOrders || []" border>
          <el-table-column prop="orderNo" label="订单号" />
          <el-table-column prop="customer" label="单位名称" />
          <el-table-column prop="orderTime" label="订单时间" />
          <el-table-column prop="filler" label="填单员" />
          <el-table-column prop="productInfo" label="产品信息" show-overflow-tooltip />
          <el-table-column prop="amount" label="订单金额" />
          <el-table-column prop="orderStatus" label="订单状态" />
          <el-table-column prop="status" label="配送状态" />
        </el-table>
        <el-table class="detail-section" :data="currentRow?.driverRows || []" border>
          <el-table-column prop="name" label="用户姓名" />
          <el-table-column prop="phone" label="联系方式" />
          <el-table-column prop="department" label="所在部门" />
          <el-table-column prop="roleText" label="用户角色" />
        </el-table>
        <el-timeline class="detail-section">
          <el-timeline-item
            v-for="(item, index) in currentRow?.deliveryTimeline || []"
            :key="index"
            :timestamp="item.date"
          >
            {{ item.title }} {{ item.description }}
          </el-timeline-item>
        </el-timeline>
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

.edit-form :deep(.el-select) {
  width: 100%;
}

.detail-section {
  margin-top: 16px;
}
</style>
