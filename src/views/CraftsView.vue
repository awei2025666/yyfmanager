<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import {
  addTenantCraft,
  changeTenantCraftStatus,
  deleteTenantCraft,
  editTenantCraft,
  getTenantCraftList
} from '../api/tenant'

const router = useRouter()
const route = useRoute()

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  unit: '',
  status: ''
})

const state = reactive({
  loading: false,
  saving: false,
  records: [],
  total: 0
})

const formPageVisible = ref(false)
const form = reactive({
  id: null,
  name: '',
  unit: '',
  priceBase: '',
  foilingStartingPrice: '',
  formatSize: '',
  spotColors: '',
  sort: '',
  remark: ''
})

const isEdit = computed(() => Boolean(form.id))

const normalizeCraft = (row = {}, index = 0) => ({
  id: row.id || row.craftId || index + 1,
  name: row.name || row.craftName || '-',
  priceBase: row.priceBase ?? row.basePrice ?? 0,
  foilingStartingPrice: row.foilingStartingPrice ?? null,
  unit: row.unit || '-',
  sort: row.sort ?? row.sortNum ?? 0,
  remark: row.remark || row.description || '',
  formatSize: row.formatSize ?? row.openCount ?? '--',
  spotColors: row.spotColors || row.spotColor || row.specialColor || '--',
  status: Number(row.status ?? 1)
})

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return value || 0
  return String(Math.trunc(number))
}

const loadData = async () => {
  state.loading = true
  try {
    const data = await getTenantCraftList({
      pageNum: filters.pageNum,
      pageSize: filters.pageSize,
      name: filters.name || undefined,
      unit: filters.unit || undefined,
      status: filters.status === '' ? undefined : filters.status
    })
    const rows = data?.records || data?.list || data?.rows || []
    state.records = rows.map(normalizeCraft)
    state.total = data?.total || state.records.length
  } catch (error) {
    state.records = []
    state.total = 0
    ElMessage.error(error?.message || '工艺列表加载失败')
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
    unit: '',
    status: ''
  })
  loadData()
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    unit: '',
    priceBase: '',
    foilingStartingPrice: '',
    formatSize: '',
    spotColors: '',
    sort: '',
    remark: ''
  })
}

const openCreate = () => {
  resetForm()
  formPageVisible.value = true
  router.push({ name: 'crafts', query: { mode: 'create' } })
}

const openEdit = (row) => {
  Object.assign(form, {
    ...row,
    priceBase: row.priceBase === 0 ? 0 : row.priceBase || '',
    foilingStartingPrice: row.foilingStartingPrice ?? '',
    formatSize: row.formatSize === '--' ? '' : row.formatSize,
    spotColors: row.spotColors === '--' ? '' : row.spotColors
  })
  formPageVisible.value = true
  router.push({ name: 'crafts', query: { mode: 'edit', id: row.id } })
}

const closeForm = () => {
  formPageVisible.value = false
  router.push({ name: 'crafts' })
}

const submit = async () => {
  if (state.saving) return
  if (!form.name) return ElMessage.error('请填写工艺名称')
  if (form.priceBase === '') return ElMessage.error('请填写起价基数')
  if (!form.unit) return ElMessage.error('请填写单位')
  state.saving = true
  try {
    const payload = {
      id: form.id || undefined,
      name: form.name,
      unit: form.unit,
      priceBase: form.priceBase,
      foilingStartingPrice: form.foilingStartingPrice === '' ? null : form.foilingStartingPrice,
      formatSize: form.formatSize,
      spotColors: form.spotColors,
      sort: form.sort,
      remark: form.remark
    }
    await (isEdit.value ? editTenantCraft(payload) : addTenantCraft(payload))
    ElMessage.success('保存成功')
    closeForm()
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    state.saving = false
  }
}

const toggleStatus = async (row) => {
  const nextStatus = Number(row.status) === 1 ? 0 : 1
  try {
    await changeTenantCraftStatus({ id: row.id, status: nextStatus })
    ElMessage.success('状态已更新')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '状态更新失败')
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除工艺“${row.name}”吗？`, '删除确认', { type: 'warning' })
  try {
    await deleteTenantCraft(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    ElMessage.error(error?.message || '删除失败')
  }
}

watch(
  () => route.query.mode,
  (mode) => {
    if (!mode) formPageVisible.value = false
  }
)

onMounted(() => {
  formPageVisible.value = ['create', 'edit'].includes(route.query.mode)
  loadData()
})
</script>

<template>
  <div class="crafts-page">
    <template v-if="!formPageVisible">
      <PageBlock class="craft-search-card">
        <div class="craft-search-grid">
          <label>
            <span>工艺名称</span>
            <el-input v-model="filters.name" placeholder="请输入工艺名称" />
          </label>
          <label>
            <span>单位</span>
            <el-input v-model="filters.unit" placeholder="请输入单位" />
          </label>
          <label>
            <span>状态</span>
            <el-select v-model="filters.status" placeholder="请选择状态" clearable>
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </label>
          <div class="craft-search-actions">
            <el-button type="primary" :icon="Search" @click="searchData">查询</el-button>
            <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
          </div>
        </div>
      </PageBlock>

      <PageBlock class="craft-table-card">
        <div class="craft-toolbar">
          <el-button type="primary" @click="openCreate">添加</el-button>
        </div>

        <el-table v-loading="state.loading" :data="state.records" class="craft-table" empty-text="当前筛选下暂无工艺数据">
          <el-table-column prop="name" label="工艺名称" min-width="130" />
          <el-table-column prop="priceBase" label="起价基数" min-width="120">
            <template #default="{ row }">{{ formatNumber(row.priceBase) }}</template>
          </el-table-column>
          <el-table-column prop="foilingStartingPrice" label="烫金起价" min-width="120"/>
          <el-table-column prop="unit" label="单位" min-width="100" />
          <el-table-column prop="sort" label="排序" min-width="100" />
          <el-table-column prop="remark" label="描述" min-width="190" show-overflow-tooltip />
          <el-table-column prop="formatSize" label="开数" min-width="100" />
          <el-table-column prop="spotColors" label="专色" min-width="100" />
          <el-table-column prop="status" label="状态" min-width="120">
            <template #default="{ row }">
              <el-switch
                :model-value="Number(row.status) === 1"
                active-color="#10c469"
                inactive-color="#dcdfe6"
                @change="() => toggleStatus(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="primary" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="filters.pageNum"
            background
            layout="prev, pager, next"
            :total="state.total"
            @current-change="loadData"
          />
        </div>
      </PageBlock>
    </template>

    <template v-else>
      <PageBlock class="craft-form-card">
        <h2>{{ isEdit ? '编辑工艺' : '添加工艺' }}</h2>
        <div class="craft-form-grid">
          <label>
            <span><em>*</em>工艺名称</span>
            <el-input v-model="form.name" placeholder="请输入工艺名称" />
          </label>
          <label>
            <span><em>*</em>起价基数</span>
            <el-input v-model="form.priceBase" placeholder="请输入起步价" />
          </label>
          <label>
            <span>烫金起价</span>
            <el-input v-model="form.foilingStartingPrice" placeholder="请输入烫金起价" />
          </label>
          <label>
            <span><em>*</em>单位</span>
            <el-input v-model="form.unit" placeholder="请输入单位" />
          </label>
          <label>
            <span>开数</span>
            <el-input v-model="form.formatSize" placeholder="请输入成品规格" />
          </label>
          <label>
            <span>专色</span>
            <el-input v-model="form.spotColors" placeholder="请输入专色" />
          </label>
          <label>
            <span>排序</span>
            <el-input v-model="form.sort" placeholder="请输入排序" />
          </label>
          <label class="craft-form-remark">
            <span>描述</span>
            <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注" />
          </label>
        </div>
      </PageBlock>

      <div class="craft-form-footer">
        <el-button :disabled="state.saving" @click="closeForm">取消</el-button>
        <el-button type="primary" :loading="state.saving" @click="submit">保存</el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.crafts-page {
  display: grid;
  gap: 14px;
  padding: 0 34px;
}

.craft-search-card :deep(.page-block__body) {
  min-height: 146px;
  padding: 24px 28px 22px;
}

.craft-search-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  align-items: start;
  gap: 18px 28px;
}

.craft-search-grid label,
.craft-form-grid label {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.craft-search-grid span,
.craft-form-grid span {
  color: #8b8f99;
  font-size: 15px;
  font-weight: 600;
}

.craft-search-card :deep(.el-input),
.craft-search-card :deep(.el-select) {
  --el-input-height: 42px;
  width: 100%;
  font-size: 15px;
}

.craft-search-card :deep(.el-input__wrapper),
.craft-search-card :deep(.el-select__wrapper) {
  min-height: 42px;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 0 0 1px var(--el-input-border-color, #dcdfe6) inset;
}

.craft-form-card :deep(.el-input__wrapper),
.craft-form-card :deep(.el-textarea__inner) {
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 0 0 1px var(--el-input-border-color, #dcdfe6) inset;
}

.craft-search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  grid-column: 1 / -1;
  min-width: 216px;
}

.craft-search-actions :deep(.el-button) {
  min-width: 76px;
  height: 32px;
  padding: 0 20px;
  border-radius: 4px;
  font-size: 14px;
}

.craft-table-card :deep(.page-block__body) {
  min-height: 0;
  padding: 16px;
}

.craft-toolbar {
  margin-bottom: 12px;
}

.craft-toolbar :deep(.el-button) {
  min-width: 76px;
  height: 32px;
  border-radius: 4px;
  font-size: 14px;
}

.craft-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-border-color: #ebeef5;
  font-size: 14px;
}

.craft-table :deep(.el-table__header th) {
  height: 46px;
  background: #f8fafc !important;
  color: #303133;
  font-size: 14px;
  font-weight: 700;
}

.craft-table :deep(.el-table__body td) {
  height: 48px;
  color: #606266;
  font-size: 14px;
}

.craft-table :deep(.el-button.is-link) {
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.craft-form-card :deep(.page-block__body) {
  min-height: 0;
  padding: 16px;
}

.craft-form-card h2 {
  margin: 0 0 16px;
  color: #303133;
  font-size: 18px;
  font-weight: 700;
}

.craft-form-grid {
  display: grid;
  grid-template-columns: 420px;
  gap: 12px;
}

.craft-form-grid em {
  color: #f04438;
  font-style: normal;
}

.craft-form-card :deep(.el-input) {
  --el-input-height: 32px;
  font-size: 14px;
}

.craft-form-card :deep(.el-textarea__inner) {
  width: 1080px;
  min-height: 72px !important;
  font-size: 14px;
}

.craft-form-remark {
  width: 1080px;
}

.craft-form-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin: 0 -16px;
  padding: 16px;
  border-top: 1px solid #ebeef5;
  background: #ffffff;
}

.craft-form-footer :deep(.el-button) {
  min-width: 88px;
  height: 32px;
  border-radius: 4px;
  font-size: 14px;
}
</style>
