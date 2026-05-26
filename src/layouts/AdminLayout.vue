<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  PieChart
} from '@element-plus/icons-vue'
import { getTenantUserInfo } from '../api/tenant'
import { getAvatarUrl, getNameInitial } from '../utils/userProfile'

const route = useRoute()
const router = useRouter()
const userState = reactive({
  name: localStorage.getItem('platform_account') || '',
  vipDay: localStorage.getItem('platform_vip_day') || '',
  avatar: localStorage.getItem('platform_avatar') || ''
})

const menus = [
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

const flatMenus = computed(() => menus.flatMap((item) => item.children || [item]))

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
  menus
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

const logout = () => {
  localStorage.removeItem('platform_token')
  localStorage.removeItem('platform_account')
  localStorage.removeItem('platform_vip_day')
  localStorage.removeItem('platform_avatar')
  router.push('/login')
}

const loadUserInfo = async () => {
  try {
    const info = await getTenantUserInfo()
    userState.name = info?.name || userState.name
    userState.vipDay = info?.vipDay ?? ''
    userState.avatar = getAvatarUrl(info)
    localStorage.setItem('platform_account', userState.name)
    localStorage.setItem('platform_vip_day', String(userState.vipDay))
    if (userState.avatar) {
      localStorage.setItem('platform_avatar', userState.avatar)
    } else {
      localStorage.removeItem('platform_avatar')
    }
  } catch {
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
        background-color="#2f3032"
        text-color="#d7d9df"
        active-text-color="#ffffff"
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
        <button type="button" class="screen-button">可视化大屏</button>
        <div class="topbar-actions">
          <button type="button" class="vip-pill" @click="openDurationPurchase">剩余<strong>{{ vipDayText }}</strong>天到期</button>
          <button type="button" class="avatar-button" :title="currentAccount">
            <img v-if="userState.avatar" :src="userState.avatar" alt="头像" />
            <span v-else>{{ accountInitial }}</span>
          </button>
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
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0;
  padding: 0;
  background: #f5f5f5;
}

.admin-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100vh;
  padding: 28px 24px 32px;
  border-radius: 0;
  background: #2f3032;
  color: #e8e8e8;
  box-shadow: none;
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 0 28px;
  border-radius: 0;
  background: transparent;
}

.brand__mark {
  position: relative;
  width: 42px;
  height: 34px;
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
  color: #ffffff;
  font-size: 26px;
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
  height: 56px;
  margin: 4px 0;
  padding: 0 14px !important;
  border-radius: 8px;
  color: #d7d9df;
  font-size: 21px;
  font-weight: 700;
  transition: background 0.18s ease, color 0.18s ease;
}

.sidebar-menu :deep(.el-menu-item .el-icon),
.sidebar-menu :deep(.el-sub-menu__title .el-icon) {
  width: 34px;
  margin-right: 22px;
  font-size: 26px;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  height: 48px;
  margin: 2px 0 2px 14px;
  padding-left: 44px !important;
  border-radius: 8px;
  color: #bdc4d0;
  font-size: 17px;
  font-weight: 600;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item .el-icon) {
  width: 20px;
  margin-right: 12px;
  font-size: 17px;
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.sidebar-menu :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  background: rgba(255, 255, 255, 0.07);
  color: #ffffff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #1764ff !important;
  color: #ffffff !important;
}

.sidebar-menu :deep(.el-menu-item.is-active::after) {
  content: '';
  position: absolute;
  right: 10px;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  transform: translateY(-50%);
}

.sidebar-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.12);
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
  gap: 16px;
  padding-bottom: 28px;
}

.admin-topbar {
  height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 34px 0 38px;
  background: #ffffff;
}

.screen-button {
  height: 44px;
  padding: 0 24px;
  border: 0;
  border-radius: 5px;
  background: #1764ff;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.vip-pill {
  height: 46px;
  display: inline-flex;
  align-items: center;
  padding: 0 20px;
  border: 0;
  border-radius: 23px;
  background: #d8e8ff;
  color: #111111;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.vip-pill strong {
  margin: 0 2px;
  color: #1764ff;
  font-size: 28px;
  line-height: 1;
}

.avatar-button {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #1764ff 0%, #4b8cff 100%);
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  overflow: hidden;
  cursor: pointer;
}

.avatar-button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-tabs {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 36px;
}

.collapse-icon {
  font-size: 28px;
  line-height: 1;
}

.tab {
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border-radius: 6px;
  border: 1px solid #cfcfcf;
  background: #ffffff;
  color: #111111;
  font-size: 18px;
  text-decoration: none;
}

.tab.muted {
  color: #a0a0a0;
}

.tab.active {
  font-weight: 700;
}

.tab-close {
  margin-left: 10px;
  color: #111111;
  font-size: 24px;
  font-weight: 400;
  line-height: 1;
  text-decoration: none;
}

.admin-main > :deep(.page-stack),
.admin-main > :deep(.special-stack) {
  padding: 0 36px;
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
