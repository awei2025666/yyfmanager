<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, User } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import {
  addTenant,
  addTenantUser,
  changeTenantStatus,
  changeTenantUserStatus,
  deleteTenant,
  deleteTenantUser,
  editTenant,
  editTenantUser,
  getTenantDetail,
  getTenantList,
  getTenantUserList,
  getTenantUserMenus,
  rechargeTenant,
  resetTenantPassword,
  resetTenantUserPassword,
  uploadPlatformFile
} from '../api/platform'

const filters = reactive({
  pageNum: 1,
  pageSize: 10,
  tenantName: '',
  userName: '',
  userPhone: '',
  status: '',
  startTime: '',
  endTime: ''
})

const state = reactive({
  loading: false,
  records: [],
  total: 0,
  detail: null,
  tenantUsers: [],
  tenantMenus: [],
  currentTenantId: null
})

const dialogVisible = ref(false)
const detailVisible = ref(false)
const tenantUsersVisible = ref(false)
const rechargeVisible = ref(false)
const tenantUserFormVisible = ref(false)
const tenantMenuTreeRef = ref(null)

const form = reactive({
  id: null,
  tenantName: '',
  userName: '',
  userPhone: '',
  password: '',
  address: '',
  businessLicense: '',
  businessLicensePath: '',
  remark: ''
})

const rechargeForm = reactive({
  id: null,
  day: 30
})

const tenantUserForm = reactive({
  id: null,
  tenantId: null,
  name: '',
  phone: '',
  password: '',
  menuIdList: []
})

const tenantUserQuery = reactive({
  name: '',
  phone: ''
})

const isEdit = computed(() => Boolean(form.id))
const isTenantUserEdit = computed(() => Boolean(tenantUserForm.id))
const activeFilters = computed(() =>
  [
    { key: 'tenantName', label: '会员名称', value: filters.tenantName },
    { key: 'userName', label: '联系人', value: filters.userName },
    { key: 'userPhone', label: '手机号', value: filters.userPhone },
    { key: 'status', label: '状态', value: filters.status === '' ? '' : statusLabel[filters.status] },
    { key: 'startTime', label: '注册开始', value: filters.startTime },
    { key: 'endTime', label: '注册结束', value: filters.endTime }
  ].filter((item) => item.value !== '' && item.value !== null && item.value !== undefined)
)
const summaryCards = computed(() => [
  { label: '当前页会员', value: state.records.length },
  { label: '已启用', value: state.records.filter((item) => Number(item.status) === 1).length },
  { label: '已禁用', value: state.records.filter((item) => Number(item.status) === 0).length },
  { label: '会员剩余时长', value: `${state.records.reduce((sum, item) => sum + Number(item.vipDay || 0), 0)} 天` }
])

const statusLabel = { 0: '已禁用', 1: '已启用' }
const statusType = { 0: 'danger', 1: 'success' }
const orderStatus = { 1: '待支付', 2: '支付成功', 3: '支付失败' }

const loadTenants = async () => {
  state.loading = true
  try {
    const data = await getTenantList(filters)
    state.records = data.records || []
    state.total = data.total || 0
  } catch (error) {
    ElMessage.error(error?.message || '会员数据加载失败')
  } finally {
    state.loading = false
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    pageNum: 1,
    pageSize: 10,
    tenantName: '',
    userName: '',
    userPhone: '',
    status: '',
    startTime: '',
    endTime: ''
  })
  loadTenants()
}

const openCreate = () => {
  Object.assign(form, {
    id: null,
    tenantName: '',
    userName: '',
    userPhone: '',
    password: '',
    address: '',
    businessLicense: '',
    businessLicensePath: '',
    remark: ''
  })
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    tenantName: row.tenantName,
    userName: row.userName,
    userPhone: row.userPhone,
    password: '',
    address: row.address,
    businessLicense: row.businessLicense,
    businessLicensePath: row.businessLicensePath || '',
    remark: row.remark
  })
  dialogVisible.value = true
}

const submitTenant = async () => {
  const payload = {
    id: form.id,
    tenantName: form.tenantName,
    userName: form.userName,
    userPhone: form.userPhone,
    password: form.password,
    address: form.address,
    businessLicense: form.businessLicense,
    remark: form.remark
  }
  const request = isEdit.value ? editTenant : addTenant
  await request(payload)
  ElMessage.success(`${isEdit.value ? '编辑' : '新增'}会员成功`)
  dialogVisible.value = false
  loadTenants()
}

const uploadLicense = async ({ file }) => {
  try {
    const fileId = await uploadPlatformFile(file)
    form.businessLicense = fileId
    form.businessLicensePath = URL.createObjectURL(file)
    ElMessage.success('营业执照上传成功')
  } catch (error) {
    ElMessage.error(error?.message || '营业执照上传失败')
  }
}

const openDetail = async (row) => {
  try {
    state.detail = await getTenantDetail(row.id)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error?.message || '会员详情加载失败')
  }
}

const openRecharge = (row) => {
  rechargeForm.id = row.id
  rechargeForm.day = 30
  rechargeVisible.value = true
}

const submitRecharge = async () => {
  await rechargeTenant(rechargeForm)
  ElMessage.success('充值时长成功')
  rechargeVisible.value = false
  loadTenants()
}

const toggleStatus = async (row) => {
  await changeTenantStatus({
    id: row.id,
    status: row.status === 1 ? 0 : 1
  })
  ElMessage.success('状态已更新')
  loadTenants()
}

const handleResetPassword = async (row) => {
  await resetTenantPassword(row.id)
  ElMessage.success(`已重置 ${row.tenantName} 的密码`)
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确认删除会员“${row.tenantName}”吗？`, '删除确认', { type: 'warning' })
  await deleteTenant(row.id)
  ElMessage.success('删除成功')
  loadTenants()
}

const loadTenantUsers = async () => {
  const data = await getTenantUserList({
    tenantId: state.currentTenantId,
    ...tenantUserQuery
  })
  state.tenantUsers = data.records || data || []
}

const openTenantUsers = async (row) => {
  state.currentTenantId = row.id
  tenantUserQuery.name = ''
  tenantUserQuery.phone = ''
  try {
    state.tenantMenus = await getTenantUserMenus()
    await loadTenantUsers()
    tenantUsersVisible.value = true
  } catch (error) {
    ElMessage.error(error?.message || '子账号数据加载失败')
  }
}

const openTenantUserCreate = () => {
  Object.assign(tenantUserForm, {
    id: null,
    tenantId: state.currentTenantId,
    name: '',
    phone: '',
    password: '',
    menuIdList: []
  })
  tenantUserFormVisible.value = true
  nextTick(() => tenantMenuTreeRef.value?.setCheckedKeys([]))
}

const openTenantUserEdit = (row) => {
  Object.assign(tenantUserForm, {
    id: row.id,
    tenantId: state.currentTenantId,
    name: row.name,
    phone: row.phone,
    password: '',
    menuIdList: [...(row.menuIdList || [])]
  })
  tenantUserFormVisible.value = true
  nextTick(() => tenantMenuTreeRef.value?.setCheckedKeys(tenantUserForm.menuIdList))
}

const submitTenantUser = async () => {
  tenantUserForm.menuIdList = tenantMenuTreeRef.value?.getCheckedKeys?.() || tenantUserForm.menuIdList
  const request = isTenantUserEdit.value ? editTenantUser : addTenantUser
  await request({ ...tenantUserForm })
  ElMessage.success(`${isTenantUserEdit.value ? '编辑' : '新增'}子账号成功`)
  tenantUserFormVisible.value = false
  loadTenantUsers()
}

const toggleTenantUserStatus = async (row) => {
  await changeTenantUserStatus({
    id: row.id,
    tenantId: state.currentTenantId,
    status: row.status === 1 ? 0 : 1
  })
  ElMessage.success('子账号状态已更新')
  loadTenantUsers()
}

const handleTenantUserResetPassword = async (row) => {
  await resetTenantUserPassword(row.id)
  ElMessage.success(`已重置 ${row.name} 的密码`)
}

const handleTenantUserDelete = async (row) => {
  await ElMessageBox.confirm(`确认删除子账号“${row.name}”吗？`, '删除确认', { type: 'warning' })
  await deleteTenantUser(row.id)
  ElMessage.success('子账号已删除')
  loadTenantUsers()
}

onMounted(loadTenants)
</script>

<template>
  <div class="page-stack">
    <section class="summary-grid">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <p>{{ card.label }}</p>
        <strong>{{ card.value }}</strong>
      </article>
    </section>

    <PageBlock title="会员列表" subtitle="成员与企业管理">
      <template #extra>
        <div class="toolbar-actions">
          <span class="source-pill">真实接口</span>
          <el-button :icon="Refresh" @click="loadTenants">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增会员</el-button>
        </div>
      </template>

      <div class="filter-grid">
        <el-input v-model="filters.tenantName" placeholder="会员名称" :prefix-icon="Search" />
        <el-input v-model="filters.userName" placeholder="联系人" />
        <el-input v-model="filters.userPhone" placeholder="手机号" />
        <el-select v-model="filters.status" placeholder="状态" clearable>
          <el-option label="已启用" :value="1" />
          <el-option label="已禁用" :value="0" />
        </el-select>
        <el-date-picker v-model="filters.startTime" value-format="YYYY-MM-DD" placeholder="注册开始时间" />
        <el-date-picker v-model="filters.endTime" value-format="YYYY-MM-DD" placeholder="注册结束时间" />
        <el-button type="primary" @click="loadTenants">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <div v-if="activeFilters.length" class="filter-tags">
        <span class="filter-tags__label">当前筛选</span>
        <el-tag
          v-for="item in activeFilters"
          :key="item.key"
          closable
          effect="plain"
          @close="filters[item.key] = ''; loadTenants()"
        >
          {{ item.label }}：{{ item.value }}
        </el-tag>
      </div>

      <div class="table-meta">
        <span>共 {{ state.total }} 条数据</span>
        <span>当前页 {{ state.records.length }} 条</span>
      </div>

      <el-table v-loading="state.loading" :data="state.records" empty-text="当前筛选下暂无会员数据">
        <el-table-column prop="tenantName" label="会员名称" min-width="150" />
        <el-table-column prop="userName" label="联系人" min-width="100" />
        <el-table-column prop="userPhone" label="手机号" min-width="130" />
        <el-table-column prop="address" label="详细地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" label="注册时间" min-width="160" />
        <el-table-column prop="vipDay" label="会员时长" min-width="100">
          <template #default="{ row }">{{ row.vipDay }} 天</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusLabel[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="340" fixed="right">
          <template #default="{ row }">
            <el-space wrap>
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="primary" @click="openTenantUsers(row)">子账号</el-button>
              <el-button link type="warning" @click="openRecharge(row)">充值</el-button>
              <el-button link @click="toggleStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
              <el-button link @click="handleResetPassword(row)">重置密码</el-button>
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
          @current-change="loadTenants"
          @size-change="loadTenants"
        />
      </div>
    </PageBlock>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑会员' : '新增会员'" width="640px">
      <div class="form-grid">
        <div class="field-block">
          <label>会员名称</label>
          <el-input v-model="form.tenantName" placeholder="请输入会员名称" />
        </div>
        <div class="field-block">
          <label>联系人</label>
          <el-input v-model="form.userName" placeholder="请输入联系人" />
        </div>
        <div class="field-block">
          <label>联系人手机号(账号)</label>
          <el-input v-model="form.userPhone" placeholder="请输入联系人手机号" />
        </div>
        <div class="field-block">
          <label>登录密码</label>
          <el-input v-model="form.password" placeholder="新增时请输入密码，编辑可留空" />
        </div>
        <div class="field-block full-span">
          <label>营业执照</label>
          <div class="upload-panel">
            <el-upload
              :show-file-list="false"
              accept="image/*"
              :http-request="uploadLicense"
            >
              <el-button type="primary" plain>上传营业执照</el-button>
            </el-upload>
            <span class="upload-tip">{{ form.businessLicense ? `文件ID：${form.businessLicense}` : '支持上传图片，接口返回 fileId' }}</span>
          </div>
          <img v-if="form.businessLicensePath" class="license-preview" :src="form.businessLicensePath" alt="营业执照预览" />
        </div>
        <div class="field-block full-span">
          <label>详细地址</label>
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </div>
      </div>
      <div class="field-block">
        <label>备注</label>
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTenant">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rechargeVisible" title="充值会员时长" width="420px">
      <el-input-number v-model="rechargeForm.day" :min="1" :step="30" />
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRecharge">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="会员详情" width="880px">
      <template v-if="state.detail">
        <div class="detail-grid">
          <div>
            <p class="muted">会员名称</p>
            <strong>{{ state.detail.tenantName }}</strong>
          </div>
          <div>
            <p class="muted">联系人</p>
            <strong>{{ state.detail.userName }}</strong>
          </div>
          <div>
            <p class="muted">手机号</p>
            <strong>{{ state.detail.userPhone }}</strong>
          </div>
          <div>
            <p class="muted">注册时间</p>
            <strong>{{ state.detail.createTime }}</strong>
          </div>
          <div>
            <p class="muted">会员时长</p>
            <strong>{{ state.detail.vipDay || 0 }} 天</strong>
          </div>
          <div>
            <p class="muted">状态</p>
            <strong>{{ statusLabel[state.detail.status] }}</strong>
          </div>
          <div class="full-span">
            <p class="muted">详细地址</p>
            <strong>{{ state.detail.address || '--' }}</strong>
          </div>
          <div class="full-span">
            <p class="muted">备注</p>
            <strong>{{ state.detail.remark || '--' }}</strong>
          </div>
        </div>

        <p class="section-title">营业执照</p>
        <img class="license-image" :src="state.detail.businessLicensePath" alt="营业执照" />

        <p class="section-title">订单记录</p>
        <el-table :data="state.detail.vipOrderList || []">
          <el-table-column prop="orderId" label="订单号" min-width="140" />
          <el-table-column prop="vipName" label="商品" min-width="120" />
          <el-table-column prop="payMoney" label="金额" min-width="90" />
          <el-table-column prop="createTime" label="支付时间" min-width="160" />
          <el-table-column prop="status" label="状态" min-width="110">
            <template #default="{ row }">{{ orderStatus[row.status] }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

    <el-dialog v-model="tenantUsersVisible" title="子账号管理" width="980px">
      <div class="toolbar-row">
        <div class="filter-grid filter-grid--drawer">
          <el-input v-model="tenantUserQuery.name" placeholder="姓名" />
          <el-input v-model="tenantUserQuery.phone" placeholder="手机号" />
          <el-button type="primary" @click="loadTenantUsers">查询</el-button>
        </div>
        <el-button type="primary" :icon="User" @click="openTenantUserCreate">新增子账号</el-button>
      </div>

      <el-table :data="state.tenantUsers" empty-text="当前会员暂无子账号数据">
        <el-table-column prop="name" label="用户姓名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column prop="createTime" label="创建时间" min-width="160" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusLabel[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="240">
          <template #default="{ row }">
            <el-space wrap>
              <el-button link type="primary" @click="openTenantUserEdit(row)">编辑</el-button>
              <el-button link @click="toggleTenantUserStatus(row)">
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button link @click="handleTenantUserResetPassword(row)">重置密码</el-button>
              <el-button link type="danger" @click="handleTenantUserDelete(row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="tenantUserFormVisible" :title="isTenantUserEdit ? '编辑子账号' : '新增子账号'" width="640px">
      <div class="form-grid">
        <el-input v-model="tenantUserForm.name" placeholder="用户姓名" />
        <el-input v-model="tenantUserForm.phone" placeholder="手机号" />
        <el-input v-if="!isTenantUserEdit" v-model="tenantUserForm.password" placeholder="登录密码" />
      </div>
      <div class="tree-wrap">
        <p class="muted">菜单权限</p>
        <el-tree
          ref="tenantMenuTreeRef"
          :data="state.tenantMenus"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="{ label: 'name', children: 'children' }"
          @check="(_, checked) => (tenantUserForm.menuIdList = checked.checkedKeys)"
        />
      </div>
      <template #footer>
        <el-button @click="tenantUserFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTenantUser">保存</el-button>
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
.toolbar-row {
  display: flex;
  align-items: center;
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

.toolbar-row {
  justify-content: space-between;
  margin-bottom: 16px;
}

.filter-grid,
.form-grid,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 14px;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 18px;
}

.filter-grid--drawer {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  flex: 1;
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

.muted {
  margin: 0 0 6px;
  color: #73809a;
  font-size: 12px;
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

.section-title {
  margin: 20px 0 12px;
  font-weight: 700;
}

.license-image {
  width: 100%;
  border-radius: 18px;
  border: 1px solid #e3e8f4;
}

.tree-wrap {
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: #f8faff;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.upload-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-tip {
  color: #7c879d;
  font-size: 12px;
}

.license-preview {
  width: 100%;
  max-height: 220px;
  margin-top: 12px;
  object-fit: contain;
  border-radius: 16px;
  border: 1px solid #e3e8f4;
  background: #fff;
}

@media (max-width: 1080px) {
  .summary-grid,
  .filter-grid,
  .toolbar-row,
  .detail-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
