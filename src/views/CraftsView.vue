<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import {
  addCraft,
  changeCraftStatus,
  deleteCraft,
  editCraft,
  getCraftList
} from '../api/platform'

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  unit: '',
  status: ''
})

const state = reactive({
  loading: false,
  records: [],
  total: 0
})

const dialogVisible = ref(false)
const form = reactive({
  id: null,
  name: '',
  unit: '',
  formatSize: 0,
  remark: '',
  priceBase: 0,
  spotColors: '',
  sort: 0
})

const isEdit = computed(() => Boolean(form.id))
const formatBase = (value) => Number(value || 0)
const activeFilters = computed(() =>
  [
    { key: 'name', label: '工艺名称', value: filters.name },
    { key: 'unit', label: '单位', value: filters.unit },
    { key: 'status', label: '状态', value: filters.status === '' ? '' : filters.status === 1 ? '已启用' : '已禁用' }
  ].filter((item) => item.value !== '' && item.value !== null && item.value !== undefined)
)
const summaryCards = computed(() => [
  { label: '当前页工艺', value: state.records.length },
  { label: '已启用', value: state.records.filter((item) => Number(item.status) === 1).length },
  { label: '已禁用', value: state.records.filter((item) => Number(item.status) === 0).length },
  { label: '起价基数合计', value: state.records.reduce((sum, item) => sum + Number(item.priceBase || 0), 0) }
])

const loadData = async () => {
  state.loading = true
  try {
    const data = await getCraftList(filters)
    state.records = data.records || []
    state.total = data.total || 0
  } catch (error) {
    ElMessage.error(error?.message || '工艺数据加载失败')
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

const openCreate = () => {
  Object.assign(form, {
    id: null,
    name: '',
    unit: '',
    formatSize: 0,
    remark: '',
    priceBase: 0,
    spotColors: '',
    sort: 0
  })
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const submit = async () => {
  await (isEdit.value ? editCraft : addCraft)({ ...form })
  ElMessage.success(`${isEdit.value ? '编辑' : '新增'}工艺成功`)
  dialogVisible.value = false
  loadData()
}

const toggleStatus = async (row) => {
  await changeCraftStatus({ id: row.id, status: row.status === 1 ? 0 : 1 })
  ElMessage.success('状态已更新')
  loadData()
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除工艺“${row.name}”吗？`, '删除确认', { type: 'warning' })
  await deleteCraft(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page-stack">
    <section class="summary-grid">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <p>{{ card.label }}</p>
        <strong>{{ card.value }}</strong>
      </article>
    </section>

    <PageBlock title="工艺管理" subtitle="生产参数与报价配置">
      <template #extra>
        <div class="toolbar-actions">
          <span class="source-pill">真实接口</span>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增工艺</el-button>
        </div>
      </template>

      <div class="filter-grid">
        <el-input v-model="filters.name" placeholder="工艺名称" />
        <el-input v-model="filters.unit" placeholder="单位" />
        <el-select v-model="filters.status" placeholder="状态" clearable>
          <el-option label="已启用" :value="1" />
          <el-option label="已禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <div v-if="activeFilters.length" class="filter-tags">
        <span class="filter-tags__label">当前筛选</span>
        <el-tag
          v-for="item in activeFilters"
          :key="item.key"
          closable
          effect="plain"
          @close="filters[item.key] = ''; loadData()"
        >
          {{ item.label }}：{{ item.value }}
        </el-tag>
      </div>

      <div class="table-meta">
        <span>共 {{ state.total }} 条数据</span>
        <span>当前页 {{ state.records.length }} 条</span>
      </div>

      <el-table v-loading="state.loading" :data="state.records" empty-text="当前筛选下暂无工艺数据">
        <el-table-column prop="name" label="工艺名称" min-width="140" />
        <el-table-column prop="unit" label="单位" min-width="90" />
        <el-table-column prop="formatSize" label="开数" min-width="90" />
        <el-table-column prop="priceBase" label="起价基数" min-width="110">
          <template #default="{ row }">{{ formatBase(row.priceBase) }}</template>
        </el-table-column>
        <el-table-column prop="spotColors" label="专色" min-width="140" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" min-width="90" />
        <el-table-column prop="remark" label="描述" min-width="160" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '已启用' : '已禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220">
          <template #default="{ row }">
            <el-space wrap>
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="filters.pageNum"
          v-model:page-size="filters.pageSize"
          background
          layout="total, prev, pager, next, sizes"
          :page-sizes="[10, 20, 30, 50]"
          :total="state.total"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </PageBlock>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工艺' : '新增工艺'" width="620px">
      <div class="form-grid">
        <div class="field-block">
          <label>工艺名称</label>
          <el-input v-model="form.name" placeholder="请输入工艺名称" />
        </div>
        <div class="field-block">
          <label>工艺单位</label>
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </div>
        <div class="field-block">
          <label>开数</label>
          <el-input-number v-model="form.formatSize" :min="0" controls-position="right" />
        </div>
        <div class="field-block">
          <label>起价基数</label>
          <el-input-number v-model="form.priceBase" :min="0" controls-position="right" />
        </div>
        <div class="field-block">
          <label>专色</label>
          <el-input v-model="form.spotColors" placeholder="请输入专色" />
        </div>
        <div class="field-block">
          <label>排序</label>
          <el-input-number v-model="form.sort" :min="0" controls-position="right" />
        </div>
      </div>
      <div class="field-block">
        <label>描述</label>
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入描述" />
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.summary-card {
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: rgba(255, 255, 255, 0.9);
}

.summary-card p {
  margin: 0;
  color: #6f7a8f;
}

.summary-card strong {
  display: block;
  margin-top: 12px;
  font-size: 30px;
}

.toolbar-actions,
.filter-grid,
.form-grid {
  display: flex;
  gap: 12px;
}

.source-pill {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: #eef4ff;
  color: #2558d8;
  font-size: 13px;
  font-weight: 600;
}

.filter-grid {
  margin-bottom: 16px;
}

.table-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  color: #77829a;
}

.filter-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.filter-tags__label {
  color: #627088;
  font-size: 13px;
  font-weight: 600;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-block label {
  color: #627088;
  font-size: 13px;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
</style>
