import { createRouter, createWebHistory } from 'vue-router'

const AdminLayout = () => import('../layouts/AdminLayout.vue')
const LoginView = () => import('../views/LoginView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const LargeScreenView = () => import('../views/LargeScreenView.vue')
const RecentUpdatesView = () => import('../views/RecentUpdatesView.vue')
const TenantsView = () => import('../views/TenantsView.vue')
const PackagesView = () => import('../views/PackagesView.vue')
const OrdersView = () => import('../views/OrdersView.vue')
const CraftsView = () => import('../views/CraftsView.vue')
const CustomersView = () => import('../views/modules/CustomersView.vue')
const StaffView = () => import('../views/modules/StaffView.vue')
const OrganizationView = () => import('../views/modules/OrganizationView.vue')
const RolesView = () => import('../views/modules/RolesView.vue')
const DurationPurchasesView = () => import('../views/modules/DurationPurchasesView.vue')
const MaterialsView = () => import('../views/modules/MaterialsView.vue')
const MaterialStockView = () => import('../views/modules/MaterialStockView.vue')
const MaterialDetailsView = () => import('../views/modules/MaterialDetailsView.vue')
const CraftStatsView = () => import('../views/modules/CraftStatsView.vue')
const CraftPerformanceView = () => import('../views/modules/CraftPerformanceView.vue')
const BillingPerformanceView = () => import('../views/modules/BillingPerformanceView.vue')
const DeliveryPerformanceView = () => import('../views/modules/DeliveryPerformanceView.vue')
const AccountsView = () => import('../views/modules/AccountsView.vue')
const FundDetailsView = () => import('../views/modules/FundDetailsView.vue')
const ReceivableOrdersView = () => import('../views/modules/ReceivableOrdersView.vue')
const ReceivableUnitsView = () => import('../views/modules/ReceivableUnitsView.vue')
const ManualRecordsView = () => import('../views/modules/ManualRecordsView.vue')
const ReimbursementsView = () => import('../views/modules/ReimbursementsView.vue')
const ReceiptsView = () => import('../views/modules/ReceiptsView.vue')
const ProductCraftsView = () => import('../views/modules/ProductCraftsView.vue')
const ProductCraftsOutsourceView = () => import('../views/modules/ProductCraftsOutsourceView.vue')
const OutsourceIncomingView = () => import('../views/modules/OutsourceIncomingView.vue')
const OutsourceOutgoingView = () => import('../views/modules/OutsourceOutgoingView.vue')
const DeliveryNotesView = () => import('../views/modules/DeliveryNotesView.vue')

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/large-screen',
    name: 'largeScreen',
    component: LargeScreenView,
    meta: { title: '可视化大屏' }
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { title: '工作台' }
      },
      {
        path: 'recent-updates',
        name: 'recentUpdates',
        component: RecentUpdatesView,
        meta: { title: '最近动态', parent: 'dashboard' }
      },
      {
        path: 'tenants',
        name: 'tenants',
        component: TenantsView,
        meta: { title: '会员管理' }
      },
      {
        path: 'packages',
        name: 'packages',
        component: PackagesView,
        meta: { title: '套餐管理' }
      },
      {
        path: 'orders',
        name: 'orders',
        component: OrdersView,
        meta: { title: '订单管理' }
      },
      {
        path: 'crafts',
        name: 'crafts',
        component: CraftsView,
        meta: { title: '工艺管理' }
      },
      { path: 'customers', name: 'customers', component: CustomersView, meta: { title: '合作客户' } },
      { path: 'staff', name: 'staff', component: StaffView, meta: { title: '人员管理' } },
      { path: 'organization', name: 'organization', component: OrganizationView, meta: { title: '组织架构' } },
      { path: 'roles', name: 'roles', component: RolesView, meta: { title: '角色管理' } },
      { path: 'duration-purchases', name: 'durationPurchases', component: DurationPurchasesView, meta: { title: '购买时长' } },
      { path: 'materials', name: 'materials', component: MaterialsView, meta: { title: '耗材信息' } },
      { path: 'material-stock', name: 'materialStock', component: MaterialStockView, meta: { title: '耗材库存' } },
      { path: 'material-details', name: 'materialDetails', component: MaterialDetailsView, meta: { title: '耗材明细' } },
      { path: 'craft-stats', name: 'craftStats', component: CraftStatsView, meta: { title: '工艺统计' } },
      { path: 'craft-performance', name: 'craftPerformance', component: CraftPerformanceView, meta: { title: '工艺绩效' } },
      { path: 'billing-performance', name: 'billingPerformance', component: BillingPerformanceView, meta: { title: '开单绩效' } },
      { path: 'delivery-performance', name: 'deliveryPerformance', component: DeliveryPerformanceView, meta: { title: '配送绩效' } },
      { path: 'accounts', name: 'accounts', component: AccountsView, meta: { title: '账户列表' } },
      { path: 'fund-details', name: 'fundDetails', component: FundDetailsView, meta: { title: '资金明细' } },
      { path: 'receivable-orders', name: 'receivableOrders', component: ReceivableOrdersView, meta: { title: '应收账款-订单明细' } },
      { path: 'receivable-units', name: 'receivableUnits', component: ReceivableUnitsView, meta: { title: '应收账款-单位明细' } },
      { path: 'manual-records', name: 'manualRecords', component: ManualRecordsView, meta: { title: '手工记录' } },
      { path: 'reimbursements', name: 'reimbursements', component: ReimbursementsView, meta: { title: '报销列表' } },
      { path: 'receipts', name: 'receipts', component: ReceiptsView, meta: { title: '收款信息' } },
      { path: 'product-crafts', name: 'productCrafts', component: ProductCraftsView, meta: { title: '产品工艺' } },
      { path: 'product-crafts-outsource', name: 'productCraftsOutsource', component: ProductCraftsOutsourceView, meta: { title: '产品工艺-外协' } },
      { path: 'outsource-incoming', name: 'outsourceIncoming', component: OutsourceIncomingView, meta: { title: '外协订单-转入的' } },
      { path: 'outsource-outgoing', name: 'outsourceOutgoing', component: OutsourceOutgoingView, meta: { title: '外协订单-转出的' } },
      { path: 'delivery-notes', name: 'deliveryNotes', component: DeliveryNotesView, meta: { title: '配送单' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const token = localStorage.getItem('platform_token')

  if (!to.meta.public && !token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && token) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
