<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Printer, Refresh, Search, Switch, View } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  getTenantProductCraftDetail,
  getTenantProductCraftList,
  getTenantProductCraftOutsourcePrintUrl,
  getTenantProductCraftStatistics,
  getTenantOutsourceTenants,
  outsourceTenantProductCraft,
  searchTenantClients
} from '../../api/tenant'

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  customer: '',
  productName: '',
  craftName: '',
  orderNo: '',
  orderTime: []
})

const state = reactive({
  loading: false,
  detailLoading: false,
  clientLoading: false,
  outsourceLoading: false,
  outsourceSaving: false,
  total: 0
})

const rows = ref([])
const allClientOptions = ref([])
const clientOptions = ref([])
const currentRow = ref(null)
const detailVisible = ref(false)
const outsourceVisible = ref(false)
const activeDetailTab = ref('crafts')
const outsourceOptions = ref([])
const statistics = reactive({
  pending: 0,
  completed: 0,
  amount: 0
})
const outsourceFilters = reactive({
  memberName: ''
})
const outsourceForm = reactive({
  id: '',
  outTenantId: '',
  outTenantName: '',
  outContact: '',
  outNum: '',
  outMoney: '',
  outRemark: ''
})

const statusText = (value) => {
  if (value === '待生产' || value === '已生产') return value
  return Number(value) === 2 ? '已生产' : '待生产'
}

const statusClass = (value) => (statusText(value) === '已生产' ? 'status-success' : 'status-warning')
const orderSourceText = (value) => (Number(value) === 2 ? '外协' : '本厂')
const orderSourceClass = (value) => (Number(value) === 2 ? 'source-outsourced' : 'source-local')

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return payload?.records || payload?.list || payload?.rows || payload?.data?.records || payload?.data?.list || []
}

const listTotal = (payload, normalizedRows) => {
  if (Array.isArray(payload)) return normalizedRows.length
  return Number(payload?.total ?? normalizedRows.length) || 0
}

const moneyText = (value) =>
  `¥${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

const normalizeClientOptions = (data) =>
  listRows(data)
    .map((item) => ({
      ...item,
      id: item.id || item.cooperativeClientId || item.clientId || item.companyName,
      companyName: item.companyName || item.name || '',
      companyNamePinyin: item.companyNamePinyin || item.pinyin || ''
    }))
    .filter((item) => item.id && item.companyName)

const clientMatchesKeyword = (client = {}, keyword = '') => {
  const text = String(keyword || '').trim().toLowerCase()
  if (!text) return true
  return [client.companyName, client.companyNamePinyin]
    .some((value) => String(value || '').toLowerCase().includes(text))
}

const filterClientOptions = (keyword = '') => {
  clientOptions.value = allClientOptions.value
    .filter((item) => clientMatchesKeyword(item, keyword))
    .slice(0, 50)
}

const loadClientOptions = async () => {
  state.clientLoading = true
  try {
    const data = await searchTenantClients({ companyName: '' })
    allClientOptions.value = normalizeClientOptions(data)
    filterClientOptions(filters.customer)
  } catch (error) {
    ElMessage.error(error?.message || '单位列表加载失败')
  } finally {
    state.clientLoading = false
  }
}

const handleClientDropdownVisible = (visible) => {
  if (!visible) return
  if (!allClientOptions.value.length) {
    loadClientOptions()
  } else {
    filterClientOptions('')
  }
}

const normalizeOutsourceOptions = (data) =>
  listRows(data)
    .map((item) => ({
      ...item,
      memberId: item.memberId || item.id || item.tenantId || '',
      tenantName: item.tenantName || item.memberName || item.companyName || item.name || '',
      contact: item.contact || item.userName || item.linkman || ''
    }))
    .filter((item) => item.memberId && item.tenantName)

const loadOutsourceUnits = async () => {
  state.outsourceLoading = true
  try {
    const data = await getTenantOutsourceTenants({ tenantName: outsourceFilters.memberName || undefined })
    outsourceOptions.value = normalizeOutsourceOptions(data)
  } catch (error) {
    outsourceOptions.value = []
    ElMessage.error(error?.message || '外协单位加载失败')
  } finally {
    state.outsourceLoading = false
  }
}

const resetOutsourceFields = () => {
  Object.assign(outsourceForm, {
    id: '',
    outTenantId: '',
    outTenantName: '',
    outContact: '',
    outNum: '',
    outMoney: '',
    outRemark: ''
  })
}

const openOutsource = (row) => {
  resetOutsourceFields()
  currentRow.value = row
  outsourceForm.id = row.id
  outsourceForm.outNum = row.quantity || ''
  outsourceVisible.value = true
  if (!outsourceOptions.value.length) loadOutsourceUnits()
}

const selectOutsourceUnit = (row) => {
  outsourceForm.outTenantId = row.memberId
  outsourceForm.outTenantName = row.tenantName
  outsourceForm.outContact = row.contact || ''
}

const submitOutsource = async () => {
  if (!outsourceForm.id) return ElMessage.error('缺少工艺ID，无法转外协')
  if (!outsourceForm.outTenantId) return ElMessage.warning('请选择外协单位')
  state.outsourceSaving = true
  try {
    await outsourceTenantProductCraft({
      id: outsourceForm.id,
      outTenantId: outsourceForm.outTenantId,
      outNum: outsourceForm.outNum === '' ? undefined : Number(outsourceForm.outNum),
      outMoney: outsourceForm.outMoney === '' ? undefined : Number(outsourceForm.outMoney),
      outRemark: outsourceForm.outRemark || undefined
    })
    outsourceVisible.value = false
    ElMessage.success('已转外协')
    await Promise.all([loadData(), loadStatistics()])
  } catch (error) {
    ElMessage.error(error?.message || '转外协失败')
  } finally {
    state.outsourceSaving = false
  }
}

const normalizeRow = (row = {}) => ({
  ...row,
  id: row.id || row.productsCraftId,
  orderNo: row.orderId || row.orderNo || '',
  customer: row.companyName || row.customer || '',
  orderTime: row.orderTime || row.createTime || '',
  productInfo: row.productInfo || row.productName || '',
  quantity: row.orderQuantity ?? row.quantity ?? '',
  craftName: row.craftName || row.name || '',
  remark: row.remark || '',
  unitPrice: row.unitPrice ?? 0,
  amount: row.customerMoney ?? row.amount ?? 0,
  status: statusText(row.craftStatus ?? row.status),
  orderSource: row.orderSource ?? 1,
  operator: row.operator || row.createTenantUserName || ''
})

const queryPayload = () => {
  const [start, end] = filters.orderTime || []
  return {
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    companyName: filters.customer || undefined,
    productName: filters.productName || undefined,
    craftName: filters.craftName || undefined,
    orderId: filters.orderNo || undefined,
    orderCreateTimeStart: start || undefined,
    orderCreateTimeEnd: end || start || undefined
  }
}

const summaryText = computed(() =>
  `待生产：${statistics.pending}    已生产：${statistics.completed}    客户金额：${moneyText(statistics.amount)}`
)

const applyStatistics = (data = {}) => {
  statistics.pending = Number(data.pending ?? data.waitProduction ?? data.notProduced ?? data.waitCount ?? 0) || 0
  statistics.completed = Number(data.completed ?? data.produced ?? data.finishCount ?? data.doneCount ?? 0) || 0
  statistics.amount = Number(data.amount ?? data.customerMoney ?? data.totalMoney ?? data.money ?? 0) || 0
}

const loadStatistics = async () => {
  try {
    const data = await getTenantProductCraftStatistics()
    applyStatistics(data || {})
  } catch {
    statistics.pending = 0
    statistics.completed = 0
    statistics.amount = 0
  }
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantProductCraftList(queryPayload())
    const normalizedRows = listRows(data).map(normalizeRow)
    rows.value = normalizedRows
    state.total = listTotal(data, normalizedRows)
  } catch (error) {
    rows.value = []
    state.total = 0
    ElMessage.error(error?.message || '产品工艺列表加载失败')
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
    customer: '',
    productName: '',
    craftName: '',
    orderNo: '',
    orderTime: []
  })
  loadData()
}

const normalizeDetail = (payload = {}, fallback = {}) => {
  const craft = payload.productsCraft || payload.craft || payload || {}
  const product = payload.products || payload.product || {}
  const order = payload.order || {}
  return {
    ...fallback,
    ...payload,
    orderNo: order.orderId || fallback.orderNo,
    customer: order.companyName || fallback.customer,
    contact: order.linkman || '',
    phone: order.phone || '',
    deliveryAddress: order.companyAddress || '',
    deliveryDate: order.deliveryDate || '',
    deliveryType: order.deliveryType || '',
    printRequirement: order.printingRequirements || '',
    remark: order.remark || craft.remark || fallback.remark || '',
    operator: craft.operator || fallback.operator || '',
    productRows: [
      {
        productName: product.name || fallback.productInfo || '',
        finishedSpec: product.trimmedSize || product.finishedSpec || '',
        orderQuantity: product.orderQuantity ?? fallback.quantity ?? '',
        unit: product.unit || '',
        amount: product.money ?? fallback.amount ?? 0
      }
    ],
    craftRows: [
      {
        craftName: craft.name || fallback.craftName || '',
        specification: craft.specification || '',
        openCount: craft.formatSize ?? '',
        basePrice: craft.priceBase ?? '',
        finishedCount: craft.orderQuantity ?? fallback.quantity ?? '',
        unit: craft.unit || '',
        unitPrice: craft.unitPrice ?? fallback.unitPrice ?? 0,
        amount: craft.customerMoney ?? fallback.amount ?? 0,
        remark: craft.remark || fallback.remark || ''
      }
    ],
    productionTime: craft.updateTime || craft.createTime || '',
    productionRemark: craft.remark || '',
    imageNote: craft.imageRemark || ''
  }
}

const openDetail = async (row) => {
  currentRow.value = row
  activeDetailTab.value = 'crafts'
  detailVisible.value = true
  if (!row.id) return
  state.detailLoading = true
  try {
    const data = await getTenantProductCraftDetail(row.id)
    currentRow.value = normalizeDetail(data, row)
  } catch (error) {
    ElMessage.error(error?.message || '产品工艺详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

const printOutsource = async (row) => {
  if (!row?.id) return ElMessage.warning('缺少工艺ID，无法打印')
  try {
    const data = await getTenantProductCraftOutsourcePrintUrl(row.id)
    const url = data?.url || data?.printUrl || data
    if (!url) {
      ElMessage.warning('暂无打印地址')
      return
    }
    window.open(url, '_blank')
  } catch (error) {
    ElMessage.error(error?.message || '打印地址获取失败')
  }
}
const deliveryTypeOptions = [
  { label: '自提', value: 1 },
  { label: '发货', value: 2 },
  { label: '送货', value: 3 },
  { label: '客运', value: 4 }
]
const deliveryTypeText = (value) =>
    deliveryTypeOptions.find((item) => String(item.value) === String(value))?.label || value || ''
onMounted(() => {
  loadClientOptions()
  loadStatistics()
  loadData()
})
</script>

<template>
  <div class="module-page">
    <PageBlock class="search-card">
      <el-form class="search-form" :model="filters" label-width="96px">
        <el-form-item label="单位名称">
          <el-select
            v-model="filters.customer"
            clearable
            filterable
            remote
            reserve-keyword
            placeholder="请输入单位名称"
            :remote-method="filterClientOptions"
            :loading="state.clientLoading"
            @visible-change="handleClientDropdownVisible"
          >
            <el-option
              v-for="item in clientOptions"
              :key="item.id"
              :label="item.companyName"
              :value="item.companyName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="filters.productName" clearable placeholder="请输入产品名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="工艺名称">
          <el-input v-model="filters.craftName" clearable placeholder="请输入工艺名称" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="所属订单号">
          <el-input v-model="filters.orderNo" clearable placeholder="请输入订单号" @keyup.enter="searchData" />
        </el-form-item>
        <el-form-item label="起始时间">
          <el-date-picker
            v-model="filters.orderTime"
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
        <strong>{{ summaryText }}</strong>
      </div>
      <el-table v-loading="state.loading" :data="rows" border>
        <el-table-column prop="orderNo" label="订单号" min-width="130" />
        <el-table-column prop="customer" label="单位名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="orderTime" label="订单时间" min-width="160" />
        <el-table-column prop="productInfo" label="产品信息" min-width="170" show-overflow-tooltip />
        <el-table-column prop="quantity" label="产品数量" min-width="100" />
        <el-table-column prop="craftName" label="工艺名称" min-width="120" />
        <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip />
        <el-table-column prop="unitPrice" label="产品单价" min-width="110" />
        <el-table-column label="客户金额" min-width="120">
          <template #default="{ row }">{{ moneyText(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="工艺状态" min-width="110">
          <template #default="{ row }">
            <span :class="statusClass(row.status)">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" min-width="110">
          <template #default="{ row }">
            <span :class="orderSourceClass(row.orderSource)">{{ orderSourceText(row.orderSource) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="outTenantName" label="外协单位" min-width="110" />
        <el-table-column prop="outNum" label="外协数量" min-width="110" />
        <el-table-column prop="outMoney" label="外协金额" min-width="110" />
        <el-table-column prop="outRemark" label="外协备注" min-width="110" />

        <el-table-column prop="operator" label="操作员" min-width="100" />
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-space wrap>
              <el-button type="primary" link :icon="View" @click="openDetail(row)">详情</el-button>
              <el-button
                v-if="Number(row.orderSource) !== 2"
                type="warning"
                link
                :icon="Switch"
                @click="openOutsource(row)"
              >
                转外协
              </el-button>
              <el-button
                v-if="Number(row.orderSource) === 2"
                type="primary"
                link
                :icon="Printer"
                @click="printOutsource(row)"
              >
                打印
              </el-button>
            </el-space>
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

    <el-dialog
      v-model="outsourceVisible"
      title="转外协"
      width="920px"
      class="craft-outsource-dialog"
      :close-on-click-modal="false"
    >
      <div class="outsource-layout">
        <section class="outsource-card">
          <div class="outsource-card__title">
            <strong>选择外协单位</strong>
            <span>{{ outsourceForm.outTenantName || '未选择' }}</span>
          </div>
          <div class="outsource-search">
            <el-input
              v-model="outsourceFilters.memberName"
              clearable
              placeholder="请输入会员名称"
              @keyup.enter="loadOutsourceUnits"
            />
            <el-button type="primary" :icon="Search" @click="loadOutsourceUnits">查询</el-button>
            <el-button :icon="Refresh" @click="outsourceFilters.memberName = ''; loadOutsourceUnits()">重置</el-button>
          </div>
          <el-table
            v-loading="state.outsourceLoading"
            :data="outsourceOptions"
            border
            height="260"
            empty-text="暂无外协单位"
            @row-click="selectOutsourceUnit"
          >
            <el-table-column width="60">
              <template #default="{ row }">
                <el-radio
                  :model-value="outsourceForm.outTenantId"
                  :label="row.memberId"
                  @change="selectOutsourceUnit(row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="tenantName" label="会员名称" min-width="260" show-overflow-tooltip />
            <el-table-column prop="contact" label="联系人" min-width="160" show-overflow-tooltip />
          </el-table>
        </section>

        <section class="outsource-card outsource-form-card">
          <div class="outsource-card__title">
            <strong>外协信息</strong>
            <span>{{ currentRow?.craftName || '-' }}</span>
          </div>
          <el-form label-position="top">
            <el-form-item label="外协单位">
              <el-input v-model="outsourceForm.outTenantName" disabled placeholder="请先选择外协单位" />
            </el-form-item>
            <el-form-item label="外协数量">
              <el-input-number
                v-model="outsourceForm.outNum"
                :min="0"
                :precision="0"
                controls-position="right"
                placeholder="请输入外协数量"
              />
            </el-form-item>
            <el-form-item label="外协金额">
              <el-input-number
                v-model="outsourceForm.outMoney"
                :min="0"
                :precision="2"
                controls-position="right"
                placeholder="请输入外协金额"
              />
            </el-form-item>
            <el-form-item label="外协备注">
              <el-input
                v-model="outsourceForm.outRemark"
                type="textarea"
                :rows="4"
                maxlength="300"
                show-word-limit
                placeholder="请输入外协备注"
              />
            </el-form-item>
          </el-form>
        </section>
      </div>
      <template #footer>
        <el-button @click="outsourceVisible = false">取消</el-button>
        <el-button type="primary" :loading="state.outsourceSaving" @click="submitOutsource">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="产品工艺详情" width="1080px">
      <div v-loading="state.detailLoading" class="detail-wrap">
        <dl v-if="currentRow" class="detail-grid">
          <div><dt>订单号</dt><dd>{{ currentRow.orderNo }}</dd></div>
          <div><dt>单位名称</dt><dd>{{ currentRow.customer }}</dd></div>
          <div><dt>联系人</dt><dd>{{ currentRow.contact || '' }}</dd></div>
          <div><dt>联系方式</dt><dd>{{ currentRow.phone || '' }}</dd></div>
          <div><dt>送货地址</dt><dd>{{ currentRow.deliveryAddress || '' }}</dd></div>
          <div><dt>交货日期</dt><dd>{{ currentRow.deliveryDate || '' }}</dd></div>
          <div><dt>交货方式</dt><dd>{{ deliveryTypeText(currentRow.deliveryType) || '' }}</dd></div>
          <div><dt>印刷要求</dt><dd>{{ currentRow.printRequirement || '' }}</dd></div>
          <div><dt>备注</dt><dd>{{ currentRow.remark || '' }}</dd></div>
        </dl>
        <el-tabs v-model="activeDetailTab">
          <el-tab-pane label="工艺信息" name="crafts">
            <el-table :data="currentRow?.craftRows || []" border>
              <el-table-column prop="craftName" label="工艺名称" />
              <el-table-column prop="specification" label="规格" />
              <el-table-column prop="openCount" label="开数" />
              <el-table-column prop="basePrice" label="起价" />
              <el-table-column prop="finishedCount" label="成品数量" />
              <el-table-column prop="unit" label="单位" />
              <el-table-column prop="unitPrice" label="单价" />
              <el-table-column prop="amount" label="客户金额" />
              <el-table-column prop="remark" label="备注" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="产品信息" name="products">
            <el-table :data="currentRow?.productRows || []" border>
              <el-table-column prop="productName" label="产品名称" />
              <el-table-column prop="finishedSpec" label="成品规格" />
              <el-table-column prop="orderQuantity" label="订货数量" />
              <el-table-column prop="unit" label="单位" />
              <el-table-column prop="amount" label="金额" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="生产记录" name="production">
            <dl class="detail-grid detail-grid--small">
              <div><dt>操作员</dt><dd>{{ currentRow?.operator || '' }}</dd></div>
              <div><dt>操作时间</dt><dd>{{ currentRow?.completedTime || '' }}</dd></div>
              <div><dt>备注</dt><dd>{{ currentRow?.completeRemark || '' }}</dd></div>
              <div><dt>图片备注</dt><dd>
                <el-image
                    v-if="currentRow?.completeImgRemarkUrl"
                    class="detail-image"
                    :src="currentRow.completeImgRemarkUrl"
                    :preview-src-list="[currentRow.completeImgRemarkUrl]"
                    fit="cover"
                    preview-teleported
                />
                <span v-else>-</span>
              </dd></div>
            </dl>
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
.search-form :deep(.el-date-editor.el-input) {
  width: 100%;
}

.search-actions {
  grid-column: 1 / -1;
  justify-self: end;
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
  color: #303133;
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
  margin: 0 0 18px;
  padding: 18px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
}

.detail-grid--small {
  margin-top: 8px;
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

.outsource-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.8fr);
  gap: 16px;
}

.outsource-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #ffffff;
}

.outsource-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.outsource-card__title strong {
  color: #303133;
  font-size: 16px;
}

.outsource-card__title span {
  min-width: 0;
  overflow: hidden;
  color: #909399;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outsource-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 10px;
  margin-bottom: 12px;
}

.outsource-form-card :deep(.el-input-number) {
  width: 100%;
}

.craft-outsource-dialog :deep(.el-dialog__body) {
  background: #f5f7fa;
}

.status-warning {
  color: #ff9f1a;
  font-weight: 700;
}

.status-success {
  color: #22c55e;
  font-weight: 700;
}

.source-local {
  color: #1677ff;
  font-weight: 700;
}

.source-outsourced {
  color: #722ed1;
  font-weight: 700;
}
</style>
