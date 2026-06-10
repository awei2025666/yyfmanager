<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import {
  addVip,
  changeVipStatus,
  deleteVip,
  editVip,
  getVipList,
  getVipTotal
} from '../api/platform'

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  status: ''
})

const state = reactive({
  loading: false,
  saving: false,
  records: [],
  total: 0,
  stats: { orderTotal: 0, orderMoneyTotal: 0 }
})

const dialogVisible = ref(false)
const form = reactive({
  id: null,
  name: '',
  oldPrice: 0,
  currentPrice: 0,
  day: 30,
  remark: ''
})

const isEdit = computed(() => Boolean(form.id))
const formatMoney = (value) => `¥ ${new Intl.NumberFormat('zh-CN').format(Number(value || 0))}`
const activeFilters = computed(() =>
  [
    { key: 'name', label: '套餐名称', value: filters.name },
    { key: 'status', label: '状态', value: filters.status === '' ? '' : filters.status === 1 ? '已启用' : '已禁用' }
  ].filter((item) => item.value !== '' && item.value !== null && item.value !== undefined)
)
const localSummaryCards = computed(() => [
  { label: '当前页套餐', value: state.records.length },
  { label: '已启用', value: state.records.filter((item) => Number(item.status) === 1).length },
  { label: '已禁用', value: state.records.filter((item) => Number(item.status) === 0).length },
  { label: '当前页成交额', value: formatMoney(state.records.reduce((sum, item) => sum + Number(item.totalOrderMoney || 0), 0)) }
])

const loadData = async () => {
  state.loading = true
  try {
    const [list, stats] = await Promise.all([
      getVipList(filters),
      getVipTotal()
    ])
    state.records = list.records || []
    state.total = list.total || 0
    state.stats = stats
  } catch (error) {
    ElMessage.error(error?.message || '套餐数据加载失败')
  } finally {
    state.loading = false
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    pageNum: 1,
    pageSize: 10,
    name: '',
    status: ''
  })
  loadData()
}

const openCreate = () => {
  Object.assign(form, { id: null, name: '', oldPrice: 0, currentPrice: 0, day: 30, remark: '' })
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const submit = async () => {
  if (state.saving) return
  state.saving = true
  try {
    await (isEdit.value ? editVip : addVip)({ ...form })
    ElMessage.success(`${isEdit.value ? '编辑' : '新增'}套餐成功`)
    dialogVisible.value = false
    loadData()
  } finally {
    state.saving = false
  }
}

const toggleStatus = async (row) => {
  await changeVipStatus({ id: row.id, status: row.status === 1 ? 0 : 1 })
  ElMessage.success('状态已更新')
  loadData()
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除套餐“${row.name}”吗？`, '删除确认', { type: 'warning' })
  await deleteVip(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page-stack">
    <section class="summary-grid">
      <article class="summary-card">
        <p>总订单数</p>
        <strong>{{ state.stats.orderTotal }}</strong>
      </article>
      <article class="summary-card">
        <p>总订单金额</p>
        <strong>{{ formatMoney(state.stats.orderMoneyTotal) }}</strong>
      </article>
      <article v-for="card in localSummaryCards" :key="card.label" class="summary-card">
        <p>{{ card.label }}</p>
        <strong>{{ card.value }}</strong>
      </article>
    </section>

    <PageBlock title="套餐管理" subtitle="产品订阅配置">
      <template #extra>
        <div class="toolbar-actions">
          <span class="source-pill">真实接口</span>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增套餐</el-button>
        </div>
      </template>

      <div class="filter-grid">
        <el-input v-model="filters.name" placeholder="请输入套餐名称" />
        <el-select v-model="filters.status" placeholder="请选择状态" clearable>
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

      <el-table v-loading="state.loading" :data="state.records" empty-text="当前筛选下暂无套餐数据">
        <el-table-column prop="name" label="套餐名称" min-width="140" />
        <el-table-column prop="day" label="天数" min-width="90" />
        <el-table-column prop="oldPrice" label="原价" min-width="100">
          <template #default="{ row }">{{ formatMoney(row.oldPrice) }}</template>
        </el-table-column>
        <el-table-column prop="currentPrice" label="现价" min-width="100">
          <template #default="{ row }">{{ formatMoney(row.currentPrice) }}</template>
        </el-table-column>
        <el-table-column prop="totalOrderNum" label="订单数" min-width="100" />
        <el-table-column prop="totalOrderMoney" label="订单金额" min-width="120">
          <template #default="{ row }">{{ formatMoney(row.totalOrderMoney) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '已启用' : '已禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑套餐' : '新增套餐'" width="560px">
      <div class="form-grid">
        <div class="field-block">
          <label>套餐名称</label>
          <el-input v-model="form.name" placeholder="请输入套餐名称" />
        </div>
        <div class="field-block">
          <label>天数</label>
          <el-input-number v-model="form.day" :min="1" controls-position="right" />
        </div>
        <div class="field-block">
          <label>原价</label>
          <el-input-number v-model="form.oldPrice" :min="0" controls-position="right" />
        </div>
        <div class="field-block">
          <label>现价</label>
          <el-input-number v-model="form.currentPrice" :min="0" controls-position="right" />
        </div>
      </div>
      <div class="field-block">
        <label>备注</label>
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </div>
      <template #footer>
        <el-button :disabled="state.saving" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="state.saving" @click="submit">保存</el-button>
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  font-size: 34px;
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
