<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import { getTenantCraftList } from '../api/tenant'

const router = useRouter()
const route = useRoute()

const sampleCrafts = [
  { id: 1, name: '双面光膜', priceBase: 10, unit: '千', sort: 1, remark: 'xxxxx', formatSize: 19, spotColors: '--', status: 1 },
  { id: 2, name: '四色印刷', priceBase: 0, unit: '千印', sort: 0, remark: 'xxxxx', formatSize: '--', spotColors: '--', status: 1 },
  { id: 3, name: '双面哑膜', priceBase: 10, unit: '千印', sort: 2, remark: 'xxxxx', formatSize: '--', spotColors: '--', status: 0 }
]

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
  unit: row.unit || '-',
  sort: row.sort ?? row.sortNum ?? 0,
  remark: row.remark || row.description || 'xxxxx',
  formatSize: row.formatSize ?? row.openCount ?? '--',
  spotColors: row.spotColors || row.spotColor || row.specialColor || '--',
  status: Number(row.status ?? 1)
})

const formatMoney = (value) => `¥${Number(value || 0).toFixed(2)}`

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
    state.records = rows.length ? rows.map(normalizeCraft) : sampleCrafts
    state.total = data?.total || state.records.length
  } catch {
    state.records = sampleCrafts.filter((row) =>
      (!filters.name || row.name.includes(filters.name)) &&
      (!filters.unit || row.unit.includes(filters.unit)) &&
      (filters.status === '' || Number(row.status) === Number(filters.status))
    )
    state.total = state.records.length
  } finally {
    state.loading = false
  }
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
    const next = normalizeCraft({ ...form, status: 1 }, state.records.length)
    if (isEdit.value) {
      state.records = state.records.map((item) => (item.id === form.id ? { ...item, ...next } : item))
    } else {
      state.records = [{ ...next, id: Date.now() }, ...state.records]
      state.total += 1
    }
    ElMessage.success('保存成功')
    closeForm()
  } finally {
    state.saving = false
  }
}

const toggleStatus = (row) => {
  row.status = Number(row.status) === 1 ? 0 : 1
  ElMessage.success('状态已更新')
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除工艺“${row.name}”吗？`, '删除确认', { type: 'warning' })
  state.records = state.records.filter((item) => item.id !== row.id)
  state.total = Math.max(0, state.total - 1)
  ElMessage.success('删除成功')
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
            <el-input v-model="filters.name" placeholder="请输入" />
          </label>
          <label>
            <span>单位</span>
            <el-input v-model="filters.unit" placeholder="请输入" />
          </label>
          <label>
            <span>状态</span>
            <el-select v-model="filters.status" placeholder="请选择" clearable>
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </label>
          <div class="craft-search-actions">
            <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
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
            <template #default="{ row }">{{ formatMoney(row.priceBase) }}</template>
          </el-table-column>
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
            :total="state.total || 1000"
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
            <el-input v-model="form.name" placeholder="输入" />
          </label>
          <label>
            <span><em>*</em>起价基数</span>
            <el-input v-model="form.priceBase" placeholder="输入" />
          </label>
          <label>
            <span><em>*</em>单位</span>
            <el-input v-model="form.unit" placeholder="输入" />
          </label>
          <label>
            <span>开数</span>
            <el-input v-model="form.formatSize" placeholder="输入" />
          </label>
          <label>
            <span>专色</span>
            <el-input v-model="form.spotColors" placeholder="输入" />
          </label>
          <label>
            <span>排序</span>
            <el-input v-model="form.sort" placeholder="输入" />
          </label>
          <label class="craft-form-remark">
            <span>描述</span>
            <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="输入" />
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
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  align-items: end;
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
  border: 0;
  border-radius: 6px;
  background: #f6f7f9;
  box-shadow: none;
}

.craft-form-card :deep(.el-input__wrapper),
.craft-form-card :deep(.el-textarea__inner) {
  border: 0;
  border-radius: 0;
  background: #f5f6f8;
  box-shadow: none;
}

.craft-search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  min-width: 216px;
}

.craft-search-actions :deep(.el-button) {
  min-width: 104px;
  height: 42px;
  padding: 0 20px;
  border-radius: 6px;
  font-size: 16px;
}

.craft-table-card :deep(.page-block__body) {
  min-height: 880px;
  padding: 34px 24px 28px;
}

.craft-toolbar {
  margin-bottom: 24px;
}

.craft-toolbar :deep(.el-button) {
  min-width: 116px;
  height: 48px;
  border-radius: 6px;
  font-size: 18px;
}

.craft-table {
  --el-table-header-bg-color: #f0f1f3;
  --el-table-border-color: #dedede;
  font-size: 19px;
}

.craft-table :deep(.el-table__header th) {
  height: 70px;
  background: #f0f1f3 !important;
  color: #111111;
  font-size: 20px;
  font-weight: 800;
}

.craft-table :deep(.el-table__body td) {
  height: 70px;
  color: #111111;
  font-size: 19px;
}

.craft-table :deep(.el-button.is-link) {
  color: #1165ff;
  font-size: 17px;
  font-weight: 700;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 500px;
}

.craft-form-card :deep(.page-block__body) {
  min-height: 1050px;
  padding: 32px 24px;
}

.craft-form-card h2 {
  margin: 0 0 30px;
  color: #111111;
  font-size: 24px;
  font-weight: 800;
}

.craft-form-grid {
  display: grid;
  grid-template-columns: 420px;
  gap: 24px;
}

.craft-form-grid em {
  color: #f04438;
  font-style: normal;
}

.craft-form-card :deep(.el-input) {
  --el-input-height: 48px;
  font-size: 18px;
}

.craft-form-card :deep(.el-textarea__inner) {
  width: 1080px;
  min-height: 98px !important;
  font-size: 18px;
}

.craft-form-remark {
  width: 1080px;
}

.craft-form-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 28px;
  margin: 0 -34px;
  padding: 22px 42px;
  border-top: 1px solid #eeeeee;
  background: #ffffff;
}

.craft-form-footer :deep(.el-button) {
  min-width: 126px;
  height: 48px;
  border-radius: 6px;
  font-size: 18px;
}
</style>
