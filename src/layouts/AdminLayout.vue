<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataBoard,
  DocumentCopy,
  Files,
  Fold,
  Goods,
  Histogram,
  List,
  Memo,
  OfficeBuilding,
  Setting,
  SwitchButton,
  Tickets,
  User,
  Van,
  Wallet,
  PieChart,
  Lock
} from '@element-plus/icons-vue'
import { editTenantLoginPassword, getTenantUserInfo } from '../api/tenant'
import { getAvatarUrl, getNameInitial } from '../utils/userProfile'

const route = useRoute()
const router = useRouter()
const allMenus = [
  { name: 'dashboard', label: '工作台', icon: DataBoard },
  { name: 'customers', label: '合作客户', icon: OfficeBuilding },
  { name: 'orders', label: '订单管理', icon: DocumentCopy },
  { name: 'productCrafts', label: '产品工艺', icon: Tickets },
  {
    label: '外协管理',
    icon: List,
    children: [
      { name: 'outsourceIncoming', label: '外协订单', icon: DocumentCopy },
      { name: 'productCraftsOutsource', label: '外协工艺', icon: Setting }
    ]
  },
  { name: 'deliveryNotes', label: '配送单', icon: Van },
  {
    label: '账务管理',
    icon: Wallet,
    children: [
      { name: 'receivableOrders', label: '应收账款', icon: Memo },
      { name: 'receipts', label: '收款信息', icon: Wallet },
      { name: 'reimbursements', label: '报销列表', icon: Memo },
      { name: 'accounts', label: '账户管理', icon: Wallet },
      { name: 'fundDetails', label: '资金明细', icon: Wallet }
    ]
  },
  {
    label: '耗材管理',
    icon: Goods,
    children: [
      { name: 'materialStock', label: '耗材库存', icon: Goods },
      { name: 'materialDetails', label: '耗材明细', icon: DocumentCopy },
      { name: 'materials', label: '耗材信息', icon: Goods }
    ]
  },
  { name: 'manualRecords', label: '手工记录', icon: Files },
  {
    label: '数据统计',
    icon: PieChart,
    children: [
      { name: 'craftPerformance', label: '工艺绩效', icon: Histogram },
      { name: 'craftStats', label: '工艺统计', icon: Histogram },
      { name: 'deliveryPerformance', label: '配送绩效', icon: Histogram },
      { name: 'billingPerformance', label: '开单绩效', icon: Histogram }
    ]
  },
  { name: 'crafts', label: '工艺管理', icon: Fold },
  {
    label: '系统管理',
    icon: Setting,
    children: [
      { name: 'staff', label: '人员管理', icon: User },
      { name: 'roles', label: '角色管理', icon: Tickets },
      { name: 'organization', label: '组织架构', icon: Fold }
    ]
  }
]

const readCachedMenuTree = () => {
  try {
    const value = JSON.parse(localStorage.getItem('platform_menu_tree') || 'null')
    return Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

const cachedMenuTree = readCachedMenuTree()
const userState = reactive({
  name: localStorage.getItem('platform_account') || '',
  vipDay: localStorage.getItem('platform_vip_day') || '',
  avatar: localStorage.getItem('platform_avatar') || '',
  menuTree: cachedMenuTree,
  menuLoaded: Boolean(cachedMenuTree)
})
const passwordDialogVisible = ref(false)
const passwordSaving = ref(false)
const passwordForm = reactive({
  password: ''
})

const menuRouteAliases = {
  workbench: 'dashboard',
  工作台: 'dashboard',
  dashboard: 'dashboard',
  cooperativeClient: 'customers',
  cooperativeClientList: 'customers',
  合作客户: 'customers',
  customer: 'customers',
  customers: 'customers',
  order: 'orders',
  orderList: 'orders',
  订单管理: 'orders',
  orders: 'orders',
  productsCraft: 'productCrafts',
  产品工艺: 'productCrafts',
  productCrafts: 'productCrafts',
  craft: 'crafts',
  工艺管理: 'crafts',
  craftManage: 'crafts',
  outsourcing: 'outsourceIncoming',
  outsourceOrder: 'outsourceIncoming',
  外协订单: 'outsourceIncoming',
  intoOrder: 'outsourceIncoming',
  outOrder: 'outsourceIncoming',
  outsourceCraft: 'productCraftsOutsource',
  外协工艺: 'productCraftsOutsource',
  productsCraftOutsource: 'productCraftsOutsource',
  delivery: 'deliveryNotes',
  配送单: 'deliveryNotes',
  deliveryNotes: 'deliveryNotes',
  receivable: 'receivableOrders',
  应收账款: 'receivableOrders',
  receivableOrders: 'receivableOrders',
  receipt: 'receipts',
  收款信息: 'receipts',
  receipts: 'receipts',
  reimburse: 'reimbursements',
  报销列表: 'reimbursements',
  reimbursements: 'reimbursements',
  account: 'accounts',
  账户管理: 'accounts',
  accounts: 'accounts',
  financial: 'fundDetails',
  资金明细: 'fundDetails',
  fundDetails: 'fundDetails',
  consumableInventory: 'materialStock',
  耗材库存: 'materialStock',
  materialStock: 'materialStock',
  consumableDetail: 'materialDetails',
  耗材明细: 'materialDetails',
  materialDetails: 'materialDetails',
  consumable: 'materials',
  耗材信息: 'materials',
  materials: 'materials',
  handKept: 'manualRecords',
  手工记录: 'manualRecords',
  manualRecords: 'manualRecords',
  craftStatistics: 'craftPerformance',
  工艺绩效: 'craftPerformance',
  craftPerformance: 'craftPerformance',
  performance: 'craftStats',
  工艺统计: 'craftStats',
  craftStats: 'craftStats',
  driverPerformance: 'deliveryPerformance',
  配送绩效: 'deliveryPerformance',
  deliveryPerformance: 'deliveryPerformance',
  orderPerformance: 'billingPerformance',
  开单绩效: 'billingPerformance',
  billingPerformance: 'billingPerformance',
  user: 'staff',
  人员管理: 'staff',
  staff: 'staff',
  role: 'roles',
  角色管理: 'roles',
  roles: 'roles',
  dept: 'organization',
  组织架构: 'organization',
  organization: 'organization'
}

const flattenMenus = (items = []) =>
  items.flatMap((item) => (item.children ? [item, ...flattenMenus(item.children)] : [item]))

const menuMetaItems = flattenMenus(allMenus)
const menuMetaByName = new Map(menuMetaItems.filter((item) => item.name).map((item) => [item.name, item]))
const menuMetaByLabel = new Map(menuMetaItems.map((item) => [item.label, item]))

const normalizeMenuRouter = (value) => String(value || '').replace(/^#\/?/, '').replace(/^\/+/, '').split(/[/?#]/)[0]

const resolveRouteName = (item = {}) => {
  const routerName = normalizeMenuRouter(item.router)
  const aliasName = menuRouteAliases[routerName] || menuRouteAliases[item.name] || routerName
  if (aliasName && router.hasRoute(aliasName)) return aliasName
  if (routerName) {
    const resolved = router.resolve(`/${routerName}`)
    if (resolved?.name && resolved.matched.length) return resolved.name
  }
  return ''
}

const getMenuMeta = (routeName, label) => menuMetaByName.get(routeName) || menuMetaByLabel.get(label) || {}

const buildMenusFromTree = (tree = []) => {
  const convert = (item = {}) => {
    if (Number(item.type) === 3) return null
    const children = Array.isArray(item.children)
      ? item.children
          .slice()
          .sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0))
          .map(convert)
          .filter(Boolean)
      : []
    const routeName = resolveRouteName(item)
    const meta = getMenuMeta(routeName, item.name)
    const label = item.name || meta.label || routeName
    const icon = meta.icon || Setting

    if (children.length) {
      return { label, icon, children }
    }

    if (routeName && router.hasRoute(routeName)) {
      return { name: routeName, label, icon }
    }

    return null
  }

  return (Array.isArray(tree) ? tree : [])
    .slice()
    .sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0))
    .map(convert)
    .filter(Boolean)
}

const menus = computed(() => {
  if (!userState.menuLoaded) return []
  return buildMenusFromTree(userState.menuTree)
})
const flatMenus = computed(() => flattenMenus(menus.value).filter((item) => item.name))

const activeTitle = computed(
  () => {
    if (route.name === 'orders' && route.query.mode === 'create') return '添加订单'
    if (route.name === 'orders' && route.query.mode === 'detail') return '订单详情'
    if (route.name === 'crafts' && route.query.mode === 'create') return '添加工艺'
    if (route.name === 'crafts' && route.query.mode === 'edit') return '编辑工艺'
    if (route.name === 'staff' && route.query.mode === 'create') return '添加人员'
    if (route.name === 'staff' && route.query.mode === 'edit') return '编辑人员'
    if (route.name === 'organization' && route.query.mode === 'create') return '添加部门'
    if (route.name === 'organization' && route.query.mode === 'edit') return '编辑部门'
    if (['outsourceIncoming', 'outsourceOutgoing'].includes(route.name)) return '外协订单'
    if (['receivableOrders', 'receivableUnits'].includes(route.name)) return '应收账款'
    return flatMenus.value.find((item) => item.name === route.name)?.label || route.meta.title || '平台管理'
  }
)
const currentAccount = computed(() => userState.name || localStorage.getItem('platform_account') || 'admin')
const activeMenuName = computed(() => {
  if (route.name === 'receivableUnits') return 'receivableOrders'
  return route.meta.parent || route.name
})
const openGroupIndexes = computed(() =>
  menus.value
    .filter((item) => item.children?.some((child) => child.name === activeMenuName.value))
    .map((item) => item.label)
)
const vipDayText = computed(() => (userState.vipDay === '' || userState.vipDay === null ? '-' : userState.vipDay))
const accountInitial = computed(() => getNameInitial(currentAccount.value))

const handleMenuSelect = (name) => {
  if (!name || name === route.name) return
  router.push({ name })
}

const openDurationPurchase = () => {
  if (route.name === 'durationPurchases') return
  router.push({ name: 'durationPurchases' })
}

const openLargeScreen = () => {
  router.push({ name: 'largeScreen' })
}

const logout = () => {
  localStorage.removeItem('platform_token')
  localStorage.removeItem('platform_account')
  localStorage.removeItem('platform_vip_day')
  localStorage.removeItem('platform_avatar')
  localStorage.removeItem('platform_menu_tree')
  router.push('/login')
}

const openPasswordDialog = () => {
  passwordForm.password = ''
  passwordDialogVisible.value = true
}

const submitPassword = async () => {
  const password = passwordForm.password.trim()
  if (!password) {
    ElMessage.warning('请输入新密码')
    return
  }
  passwordSaving.value = true
  try {
    await editTenantLoginPassword({ password })
    passwordDialogVisible.value = false
    ElMessage.success('密码修改成功')
  } catch (error) {
    ElMessage.error(error?.message || '密码修改失败')
  } finally {
    passwordSaving.value = false
  }
}

const loadUserInfo = async () => {
  try {
    const info = await getTenantUserInfo()
    userState.name = info?.name || userState.name
    userState.vipDay = info?.vipDay ?? ''
    userState.avatar = getAvatarUrl(info)
    userState.menuTree = Array.isArray(info?.menuTree) ? info.menuTree : []
    userState.menuLoaded = true
    localStorage.setItem('platform_account', userState.name)
    localStorage.setItem('platform_vip_day', String(userState.vipDay))
    localStorage.setItem('platform_menu_tree', JSON.stringify(userState.menuTree))
    if (userState.avatar) {
      localStorage.setItem('platform_avatar', userState.avatar)
    } else {
      localStorage.removeItem('platform_avatar')
    }
  } catch {
    userState.menuLoaded = true
    if (route.name !== 'login') router.push({ name: 'login', query: { redirect: route.fullPath } })
  }
}

onMounted(loadUserInfo)
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="brand">
        <div class="brand__mark"><span></span><i></i></div>
        <div>
          <strong>印刷ERP</strong>
        </div>
      </div>

      <el-menu
        class="sidebar-menu"
        :default-active="activeMenuName"
        :default-openeds="openGroupIndexes"
        background-color="#ffffff"
        text-color="#606266"
        active-text-color="#409eff"
        @select="handleMenuSelect"
      >
        <template v-for="item in menus" :key="item.name || item.label">
          <el-menu-item v-if="item.name" :index="item.name">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
          <el-sub-menu v-else :index="item.label">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.name" :index="child.name">
              <el-icon><component :is="child.icon" /></el-icon>
              <span>{{ child.label }}</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <button type="button" class="screen-button" @click="openLargeScreen">可视化大屏</button>
        <div class="topbar-actions">
          <button type="button" class="vip-pill" @click="openDurationPurchase">剩余<strong>{{ vipDayText }}</strong>天到期</button>
          <el-dropdown trigger="click" popper-class="avatar-dropdown" @command="(command) => command === 'password' ? openPasswordDialog() : logout()">
            <button type="button" class="avatar-button" :title="currentAccount">
              <img v-if="userState.avatar" :src="userState.avatar" alt="头像" />
              <span v-else>{{ accountInitial }}</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <div class="admin-tabs">
        <span class="collapse-icon">▸</span>
        <a class="tab muted" href="/dashboard">主页</a>
        <span class="tab active">
          {{ activeTitle }}
          <a v-if="route.name !== 'dashboard'" class="tab-close" href="/dashboard">×</a>
        </span>
      </div>

      <router-view :key="route.name" />
    </div>

    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="420px"
      class="password-dialog"
      append-to-body
    >
      <label class="password-field">
        <span>新密码</span>
        <el-input
          v-model="passwordForm.password"
          type="password"
          show-password
          placeholder="请输入新密码"
          @keyup.enter="submitPassword"
        />
      </label>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordSaving" @click="submitPassword">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0;
  padding: 0;
  background: #f5f7fa;
}

.admin-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100vh;
  padding: 0 0 16px;
  border-radius: 0;
  background: #ffffff;
  color: #303133;
  box-shadow: 1px 0 4px rgb(0 21 41 / 8%);
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  border-radius: 0;
  background: transparent;
  border-bottom: 1px solid #f0f2f5;
}

.brand__mark {
  position: relative;
  width: 30px;
  height: 24px;
}

.brand__mark span,
.brand__mark i {
  position: absolute;
  inset: 6px 12px 6px 0;
  border-radius: 10px;
  transform: rotate(-45deg);
}

.brand__mark span {
  background: #15d0af;
}

.brand__mark i {
  inset: 6px 0 6px 12px;
  background: #1764ff;
}

.brand strong {
  color: #303133;
  font-size: 18px;
  line-height: 1;
}

.sidebar-menu {
  flex: 1;
  overflow: auto;
  border-right: 0;
  background: transparent;
}

.sidebar-menu :deep(.el-menu) {
  border-right: 0;
  background: transparent;
}

.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  position: relative;
  height: 46px;
  margin: 0;
  padding: 0 18px !important;
  border-radius: 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.18s ease, color 0.18s ease;
}

.sidebar-menu :deep(.el-menu-item .el-icon),
.sidebar-menu :deep(.el-sub-menu__title .el-icon) {
  width: 18px;
  margin-right: 10px;
  font-size: 17px;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  height: 42px;
  margin: 0;
  padding-left: 42px !important;
  border-radius: 0;
  color: #606266;
  font-size: 14px;
  font-weight: 400;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item .el-icon) {
  width: 20px;
  margin-right: 12px;
  font-size: 17px;
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background: #e6f4ff;
  color: #409eff;
}

.sidebar-menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  background: #ffffff;
  color: #409eff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #e6f4ff !important;
  color: #409eff !important;
  font-weight: 700;
}

.sidebar-menu :deep(.el-menu-item.is-active::after) {
  content: '';
  position: absolute;
  right: 0;
  top: 8px;
  width: 3px;
  height: 26px;
  border-radius: 2px 0 0 2px;
  background: #409eff;
}

.sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #409eff !important;
  background: #ffffff;
}

.sidebar-menu :deep(.el-sub-menu__icon-arrow) {
  right: 16px;
  color: currentColor;
  font-size: 16px;
}

.admin-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 28px;
}

.admin-topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgb(0 21 41 / 8%);
}

.screen-button {
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 4px;
  background: #409eff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.vip-pill {
  height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border: 0;
  border-radius: 16px;
  background: #e6f4ff;
  color: #303133;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.vip-pill strong {
  margin: 0 2px;
  color: #409eff;
  font-size: 18px;
  line-height: 1;
}

.avatar-button {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #409eff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  cursor: pointer;
}

.avatar-button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-button:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: 3px;
}

.password-field {
  display: grid;
  gap: 10px;
  padding: 8px 0 18px;
}

.password-field span {
  color: #4b5870;
  font-size: 16px;
  font-weight: 700;
}

.password-field :deep(.el-input) {
  --el-input-height: 44px;
  font-size: 16px;
}

.password-field :deep(.el-input__wrapper) {
  border-radius: 6px;
}

.admin-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
}

.collapse-icon {
  font-size: 18px;
  line-height: 1;
}

.tab {
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  color: #303133;
  font-size: 14px;
  text-decoration: none;
}

.tab.muted {
  color: #a0a0a0;
}

.tab.active {
  font-weight: 700;
}

.tab-close {
  margin-left: 8px;
  color: #606266;
  font-size: 16px;
  font-weight: 400;
  line-height: 1;
  text-decoration: none;
}

.admin-main > :deep(.page-stack),
.admin-main > :deep(.special-stack) {
  padding: 0 20px;
}

@media (max-width: 640px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    position: relative;
    top: 0;
    height: auto;
  }
}
</style>
