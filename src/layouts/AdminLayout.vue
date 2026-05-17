<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Coin,
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
  Wallet
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const menus = [
  { name: 'dashboard', label: '工作台', icon: DataBoard },
  { name: 'customers', label: '合作客户', icon: OfficeBuilding },
  { name: 'orders', label: '订单管理', icon: DocumentCopy },
  { name: 'productCrafts', label: '产品工艺', icon: Tickets },
  {
    label: '外协管理',
    icon: List,
    children: [
      { name: 'deliveryNotes', label: '配送单', icon: Van },
      { name: 'outsourceIncoming', label: '外协订单-转入的', icon: DocumentCopy },
      { name: 'outsourceOutgoing', label: '外协订单-转出的', icon: DocumentCopy },
      { name: 'productCraftsOutsource', label: '产品工艺-外协', icon: Setting }
    ]
  },
  {
    label: '账务管理',
    icon: Wallet,
    children: [
      { name: 'accounts', label: '账户列表', icon: Wallet },
      { name: 'fundDetails', label: '资金明细', icon: Wallet },
      { name: 'receivableOrders', label: '应收账款-订单明细', icon: Memo },
      { name: 'receivableUnits', label: '应收账款-单位明细', icon: Memo },
      { name: 'receipts', label: '收款信息', icon: Wallet },
      { name: 'reimbursements', label: '报销列表', icon: Memo }
    ]
  },
  {
    label: '耗材管理',
    icon: Goods,
    children: [
      { name: 'materials', label: '耗材信息', icon: Goods },
      { name: 'materialStock', label: '耗材库存', icon: Goods },
      { name: 'materialDetails', label: '耗材明细', icon: DocumentCopy }
    ]
  },
  { name: 'manualRecords', label: '手工记录', icon: Files },
  {
    label: '数据统计',
    icon: Histogram,
    children: [
      { name: 'craftStats', label: '工艺统计', icon: Histogram },
      { name: 'craftPerformance', label: '工艺绩效', icon: Histogram },
      { name: 'billingPerformance', label: '开单绩效', icon: Histogram },
      { name: 'deliveryPerformance', label: '配送绩效', icon: Histogram }
    ]
  },
  { name: 'crafts', label: '工艺管理', icon: Fold },
  {
    label: '系统管理',
    icon: Setting,
    children: [
      { name: 'staff', label: '人员管理', icon: User },
      { name: 'organization', label: '组织架构', icon: Fold },
      { name: 'roles', label: '角色管理', icon: Tickets },
      { name: 'tenants', label: '会员管理', icon: User },
      { name: 'packages', label: '套餐管理', icon: Files },
      { name: 'durationPurchases', label: '购买时长', icon: Coin }
    ]
  }
]

const flatMenus = computed(() => menus.flatMap((item) => item.children || [item]))

const activeTitle = computed(
  () => {
    if (route.name === 'orders' && route.query.mode === 'create') return '添加订单'
    if (route.name === 'orders' && route.query.mode === 'detail') return '订单详情'
    return flatMenus.value.find((item) => item.name === route.name)?.label || route.meta.title || '平台管理'
  }
)
const currentAccount = computed(() => localStorage.getItem('platform_account') || 'admin')

const logout = () => {
  localStorage.removeItem('platform_token')
  localStorage.removeItem('platform_account')
  router.push('/login')
}
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

      <nav class="nav-list">
        <template v-for="item in menus" :key="item.name || item.label">
          <router-link
            v-if="item.name"
            :to="{ name: item.name }"
            class="nav-item"
            :class="{ active: route.name === item.name }"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </router-link>
          <div v-else class="nav-group" :class="{ active: item.children?.some((child) => child.name === route.name) }">
            <div class="nav-item nav-item--group">
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
              <span class="nav-chevron">⌄</span>
            </div>
            <router-link
              v-for="child in item.children"
              :key="child.name"
              :to="{ name: child.name }"
              class="nav-subitem"
              :class="{ active: route.name === child.name }"
            >
              <el-icon><component :is="child.icon" /></el-icon>
              <span>{{ child.label }}</span>
            </router-link>
          </div>
        </template>
      </nav>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <el-button type="primary" class="visual-button">可视化大屏</el-button>
        <div class="topbar-account">
          <div class="expire-pill">剩余 <strong>280</strong> 天到期</div>
          <button class="avatar-button">{{ currentAccount === 'admin' ? '头像' : currentAccount.slice(0, 2) }}</button>
          <el-button :icon="SwitchButton" text @click="logout">退出</el-button>
        </div>
      </header>

      <div class="admin-tabs">
        <span class="collapse-icon">▸</span>
        <button class="tab muted">主页</button>
        <button class="tab active">{{ activeTitle }} <span>×</span></button>
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
  padding: 58px 34px 36px;
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
  padding: 0 0 54px;
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

.nav-list {
  display: grid;
  gap: 30px;
  overflow: auto;
  padding-right: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 28px;
  min-height: 56px;
  padding: 8px 0;
  border-radius: 0;
  color: #d4d4d4;
  text-decoration: none;
  transition: color 0.2s ease;
  font-size: 22px;
  font-weight: 600;
}

.nav-item .el-icon {
  width: 38px;
  font-size: 30px;
}

.nav-item.active,
.nav-item:hover {
  color: #fff;
  background: transparent;
  box-shadow: none;
}

.nav-group {
  display: grid;
  gap: 26px;
}

.nav-item--group {
  cursor: default;
}

.nav-group.active > .nav-item--group {
  color: #fff;
}

.nav-chevron {
  margin-left: auto;
  color: #d8d8d8;
  font-size: 32px;
  line-height: 1;
}

.nav-subitem {
  display: flex;
  align-items: center;
  gap: 22px;
  min-height: 48px;
  padding-left: 0;
  color: #d4d4d4;
  text-decoration: none;
  font-size: 20px;
  font-weight: 600;
}

.nav-subitem .el-icon {
  width: 38px;
  font-size: 24px;
}

.nav-subitem.active,
.nav-subitem:hover {
  color: #fff;
}

.admin-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 28px;
}

.admin-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  height: 84px;
  padding: 0 36px;
  background: #ffffff;
  border-bottom: 1px solid #e1e1e1;
}

.visual-button {
  min-width: 112px;
  height: 48px;
  font-size: 18px;
  font-weight: 600;
}

.topbar-account {
  display: flex;
  align-items: center;
  gap: 22px;
}

.expire-pill {
  height: 48px;
  display: inline-flex;
  align-items: center;
  padding: 0 28px;
  border-radius: 999px;
  background: #d9e5ff;
  font-size: 20px;
  font-weight: 700;
}

.expire-pill strong {
  color: #1764ff;
  font-size: 30px;
}

.avatar-button {
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 50%;
  background: #0f63ff;
  color: #0b1b3d;
  font-size: 17px;
}

.admin-tabs {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 36px 0;
}

.collapse-icon {
  font-size: 28px;
  line-height: 1;
}

.tab {
  height: 44px;
  padding: 0 18px;
  border-radius: 6px;
  border: 1px solid #cfcfcf;
  background: #ffffff;
  color: #111111;
  font-size: 18px;
}

.tab.muted {
  color: #a0a0a0;
}

.tab.active {
  font-weight: 700;
}

.tab span {
  margin-left: 10px;
  font-size: 24px;
  font-weight: 400;
}

.admin-main > :deep(.page-stack),
.admin-main > :deep(.special-stack) {
  padding: 0 36px;
}

@media (max-width: 1180px) {
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
