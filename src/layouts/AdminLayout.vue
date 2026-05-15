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
  Key,
  List,
  Memo,
  OfficeBuilding,
  Setting,
  ShoppingCart,
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
  { name: 'tenants', label: '会员管理', icon: OfficeBuilding },
  { name: 'packages', label: '套餐管理', icon: Files },
  { name: 'orders', label: '订单管理', icon: ShoppingCart },
  { name: 'crafts', label: '工艺管理', icon: Setting },
  { name: 'customers', label: '合作客户', icon: User },
  { name: 'staff', label: '人员管理', icon: User },
  { name: 'organization', label: '组织架构', icon: Fold },
  { name: 'roles', label: '角色管理', icon: Tickets },
  { name: 'durationPurchases', label: '购买时长', icon: Coin },
  { name: 'materials', label: '耗材信息', icon: Goods },
  { name: 'materialStock', label: '耗材库存', icon: Goods },
  { name: 'materialDetails', label: '耗材明细', icon: DocumentCopy },
  { name: 'craftStats', label: '工艺统计', icon: Histogram },
  { name: 'craftPerformance', label: '工艺绩效', icon: Histogram },
  { name: 'billingPerformance', label: '开单绩效', icon: Histogram },
  { name: 'deliveryPerformance', label: '配送绩效', icon: Histogram },
  { name: 'accounts', label: '账户列表', icon: Wallet },
  { name: 'fundDetails', label: '资金明细', icon: Wallet },
  { name: 'receivableOrders', label: '应收账款-订单明细', icon: Memo },
  { name: 'receivableUnits', label: '应收账款-单位明细', icon: Memo },
  { name: 'manualRecords', label: '手工记录', icon: List },
  { name: 'reimbursements', label: '报销列表', icon: Memo },
  { name: 'receipts', label: '收款信息', icon: Wallet },
  { name: 'productCrafts', label: '产品工艺', icon: Setting },
  { name: 'productCraftsOutsource', label: '产品工艺-外协', icon: Setting },
  { name: 'outsourceIncoming', label: '外协订单-转入的', icon: DocumentCopy },
  { name: 'outsourceOutgoing', label: '外协订单-转出的', icon: DocumentCopy },
  { name: 'deliveryNotes', label: '配送单', icon: Van }
]

const activeTitle = computed(
  () => menus.find((item) => item.name === route.name)?.label || route.meta.title || '平台管理'
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
        <div class="brand__mark">Y</div>
        <div>
          <strong>印刷ERP</strong>
          <p>会员版管理后台</p>
        </div>
      </div>

      <nav class="nav-list">
        <router-link
          v-for="item in menus"
          :key="item.name"
          :to="{ name: item.name }"
          class="nav-item"
          :class="{ active: route.name === item.name }"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-panel">
        <p>当前账号</p>
        <strong>{{ currentAccount }}</strong>
        <el-button :icon="Key" plain @click="router.push('/login')">更换 Token</el-button>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <div>
          <p class="admin-topbar__eyebrow">PRINT ERP ADMIN</p>
          <h1>{{ activeTitle }}</h1>
        </div>
        <el-button :icon="SwitchButton" @click="logout">退出登录</el-button>
      </header>

      <router-view :key="route.fullPath" />
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 24px;
  padding: 24px;
}

.admin-sidebar {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: calc(100vh - 48px);
  padding: 20px;
  border-radius: 28px;
  background: linear-gradient(180deg, #111d37 0%, #192543 100%);
  color: #fff;
  box-shadow: 0 24px 60px rgba(17, 29, 55, 0.3);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
}

.brand__mark {
  width: 48px;
  height: 48px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #4f8cff, #78b4ff);
  font-size: 24px;
  font-weight: 700;
}

.brand p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}

.nav-list {
  display: grid;
  gap: 10px;
  overflow: auto;
  padding-right: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  transition: 0.2s ease;
}

.nav-item.active,
.nav-item:hover {
  color: #fff;
  background: linear-gradient(135deg, rgba(79, 140, 255, 0.9), rgba(43, 99, 255, 0.75));
  box-shadow: 0 12px 30px rgba(61, 110, 255, 0.25);
}

.sidebar-panel {
  margin-top: auto;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
}

.sidebar-panel p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.sidebar-panel strong {
  display: block;
  margin: 6px 0 14px;
}

.admin-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.admin-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.admin-topbar__eyebrow {
  margin: 0;
  color: #4a74f3;
  font-size: 12px;
  letter-spacing: 0.15em;
}

.admin-topbar h1 {
  margin: 6px 0 0;
  font-size: clamp(28px, 3vw, 38px);
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
