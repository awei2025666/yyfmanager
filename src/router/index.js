import { createRouter, createWebHistory } from 'vue-router'

const AdminLayout = () => import('../layouts/AdminLayout.vue')
const LoginView = () => import('../views/LoginView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const RecentUpdatesView = () => import('../views/RecentUpdatesView.vue')
const TenantsView = () => import('../views/TenantsView.vue')
const PackagesView = () => import('../views/PackagesView.vue')
const OrdersView = () => import('../views/OrdersView.vue')
const CraftsView = () => import('../views/CraftsView.vue')
const SpecialModuleView = () => import('../views/SpecialModuleView.vue')
import { crudRoutes } from '../config/crudModules'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true }
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
      ...crudRoutes.map((item) => ({
        path: item.path,
        name: item.name,
        component: SpecialModuleView,
        props: { moduleKey: item.key },
        meta: { title: item.title }
      }))
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
