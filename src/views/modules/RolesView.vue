<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import PageBlock from '../../components/PageBlock.vue'
import {
  addTenantTenantRole,
  deleteTenantTenantRole,
  editTenantTenantRole,
  getTenantRoleMenuById,
  getTenantRoleMenus,
  getTenantTenantRoleList,
  updateTenantRoleMenus
} from '../../api/tenant'

const roles = ref([])
const menuTree = ref([])
const activeRoleId = ref('')
const roleLoading = ref(false)
const menuLoading = ref(false)
const savingMenus = ref(false)
const roleDialogVisible = ref(false)
const roleSaving = ref(false)
const menuTreeRef = ref()
const form = reactive({ id: '', name: '' })

const activeRole = computed(() => roles.value.find((item) => String(item.id) === String(activeRoleId.value)) || null)
const roleDialogTitle = computed(() => (form.id ? '编辑角色' : '新增角色'))

const listRows = (payload) => Array.isArray(payload) ? payload : payload?.records || payload?.list || payload?.rows || []
const normalizeRole = (item = {}) => ({ id: item.id ?? item.roleId, name: item.name || item.roleName || '' })
const normalizeMenus = (items = []) => (items || []).map((item) => ({
  ...item,
  id: String(item.id),
  children: normalizeMenus(item.children || [])
}))
const flattenMenuIds = (items = []) => items.flatMap((item) => [String(item.id), ...flattenMenuIds(item.children || [])])

const loadRoleMenus = async (id) => {
  if (!id) return
  menuLoading.value = true
  try {
    const selectedMenus = await getTenantRoleMenuById(id)
    const selectedIds = flattenMenuIds(listRows(selectedMenus))
    await nextTick()
    menuTreeRef.value?.setCheckedKeys(selectedIds)
  } catch (error) {
    menuTreeRef.value?.setCheckedKeys([])
    ElMessage.error(error?.message || '角色菜单加载失败')
  } finally {
    menuLoading.value = false
  }
}

const selectRole = async (role) => {
  const id = role?.id
  if (!id || String(id) === String(activeRoleId.value)) return
  activeRoleId.value = id
  await loadRoleMenus(id)
}

const loadData = async () => {
  roleLoading.value = true
  try {
    const data = await getTenantTenantRoleList()
    roles.value = listRows(data).map(normalizeRole).filter((item) => item.id !== undefined && item.id !== null)
    const current = roles.value.find((item) => String(item.id) === String(activeRoleId.value)) || roles.value[0]
    activeRoleId.value = current?.id || ''
    if (current) await loadRoleMenus(current.id)
    else menuTreeRef.value?.setCheckedKeys([])
  } catch (error) {
    roles.value = []
    activeRoleId.value = ''
    ElMessage.error(error?.message || '角色列表加载失败')
  } finally {
    roleLoading.value = false
  }
}

const openAdd = () => {
  form.id = ''
  form.name = ''
  roleDialogVisible.value = true
}

const openEdit = (role) => {
  form.id = role.id
  form.name = role.name
  roleDialogVisible.value = true
}

const saveRole = async () => {
  const name = form.name.trim()
  if (!name) return ElMessage.warning('请输入角色名称')
  roleSaving.value = true
  try {
    if (form.id) await editTenantTenantRole({ id: form.id, name })
    else await addTenantTenantRole({ name })
    roleDialogVisible.value = false
    ElMessage.success(form.id ? '角色已更新' : '角色已新增')
    await loadData()
  } catch (error) {
    ElMessage.error(error?.message || '角色保存失败')
  } finally {
    roleSaving.value = false
  }
}

const removeRole = async (role) => {
  try {
    await ElMessageBox.confirm(`确认删除角色“${role.name}”吗？`, '删除角色', { type: 'warning' })
    await deleteTenantTenantRole(role.id)
    if (String(activeRoleId.value) === String(role.id)) activeRoleId.value = ''
    ElMessage.success('角色已删除')
    await loadData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '角色删除失败')
  }
}

const saveMenus = async () => {
  if (!activeRole.value) return ElMessage.warning('请先选择角色')
  savingMenus.value = true
  try {
    const menuIds = menuTreeRef.value?.getCheckedKeys(false) || []
    await updateTenantRoleMenus({ id: activeRole.value.id, menuIds })
    ElMessage.success('菜单权限已保存')
  } catch (error) {
    ElMessage.error(error?.message || '菜单权限保存失败')
  } finally {
    savingMenus.value = false
  }
}

onMounted(async () => {
  try {
    const menus = await getTenantRoleMenus()
    menuTree.value = normalizeMenus(listRows(menus))
  } catch (error) {
    ElMessage.error(error?.message || '全部菜单加载失败')
  }
  await loadData()
})
</script>

<template>
  <div class="role-page">
    <PageBlock class="role-panel role-list-panel">
      <div class="panel-heading">
        <div>
          <h2>角色管理</h2>
          <p>新增角色后，可在右侧配置可访问菜单。</p>
        </div>
        <el-button type="primary" :icon="Plus" @click="openAdd">新增角色</el-button>
      </div>

      <div v-loading="roleLoading" class="role-list">
        <button
          v-for="role in roles"
          :key="role.id"
          type="button"
          class="role-item"
          :class="{ 'is-active': String(activeRoleId) === String(role.id) }"
          @click="selectRole(role)"
        >
          <span>{{ role.name }}</span>
          <span class="role-item__actions" @click.stop>
            <el-button link type="primary" :icon="Edit" @click="openEdit(role)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="removeRole(role)">删除</el-button>
          </span>
        </button>
        <el-empty v-if="!roleLoading && !roles.length" description="暂无角色，请先新增" :image-size="92" />
      </div>
    </PageBlock>

    <PageBlock class="role-panel permission-panel">
      <div class="panel-heading">
        <div>
          <h2>菜单权限</h2>
          <p>{{ activeRole ? `正在配置：${activeRole.name}` : '请先从左侧选择角色' }}</p>
        </div>
        <el-button type="primary" :loading="savingMenus" :disabled="!activeRole" @click="saveMenus">保存权限</el-button>
      </div>

      <div v-loading="menuLoading" class="permission-tree">
        <el-tree
          ref="menuTreeRef"
          :data="menuTree"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="{ label: 'name', children: 'children', disabled: () => !activeRole }"
          :expand-on-click-node="false"
          :check-on-click-node="true"
          empty-text="暂无菜单数据"
        />
      </div>
    </PageBlock>

    <el-dialog v-model="roleDialogVisible" :title="roleDialogTitle" width="420px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.name" maxlength="30" show-word-limit placeholder="请输入角色名称" @keyup.enter="saveRole" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleSaving" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.role-page {
  display: grid;
  grid-template-columns: minmax(320px, 0.8fr) minmax(520px, 1.2fr);
  gap: 16px;
  padding: 0 20px;
}

.role-panel {
  min-height: calc(100vh - 142px);
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
}

.panel-heading h2 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  line-height: 1.5;
}

.panel-heading p {
  margin: 5px 0 0;
  color: #909399;
  font-size: 13px;
}

.role-list {
  display: grid;
  align-content: start;
  gap: 6px;
  min-height: 360px;
}

.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  color: #303133;
  background: #f7f8fa;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.role-item:hover {
  background: #edf4ff;
}

.role-item.is-active {
  color: #1677ff;
  background: #e8f3ff;
  font-weight: 700;
}

.role-item__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
}

.permission-tree {
  min-height: 360px;
  padding: 8px 4px;
}

.permission-tree :deep(.el-tree) {
  --el-tree-node-hover-bg-color: #f0f7ff;
  color: #303133;
  background: transparent;
}

.permission-tree :deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 4px;
}

@media (max-width: 900px) {
  .role-page {
    grid-template-columns: 1fr;
  }

  .role-panel {
    min-height: auto;
  }
}
</style>
