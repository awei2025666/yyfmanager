<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTenantUserInfo, tenantLoginApi } from '../api/tenant'
import { getAvatarUrl } from '../utils/userProfile'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const form = reactive({
  account: '',
  password: '',
  token: localStorage.getItem('platform_token') || ''
})

const submit = async () => {
  loading.value = true
  try {
    const token = form.token.trim() || (await tenantLoginApi({ account: form.account, password: form.password }))
    localStorage.setItem('platform_token', token)
    const userInfo = await getTenantUserInfo()
    localStorage.setItem('platform_account', userInfo?.name || form.account)
    localStorage.setItem('platform_vip_day', String(userInfo?.vipDay ?? ''))
    localStorage.setItem('platform_menu_tree', JSON.stringify(Array.isArray(userInfo?.menuTree) ? userInfo.menuTree : []))
    const avatar = getAvatarUrl(userInfo)
    if (avatar) localStorage.setItem('platform_avatar', avatar)
    ElMessage.success('登录成功')
    router.push((route.query.redirect || '/dashboard').toString())
  } catch (error) {
    localStorage.removeItem('platform_token')
    localStorage.removeItem('platform_menu_tree')
    ElMessage.error(error?.message || '登录失败，请检查账号密码或接口服务')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-copy">
        <p>PRINTING PLATFORM</p>
        <h1>YYF 管理后台</h1>
        <span>按墨刀原型风格扩展为完整的 Vue3 + Element Plus 多页面后台。</span>
      </div>

      <el-form label-position="top" :model="form" class="login-form">
        <el-form-item label="账号">
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-button type="primary" class="login-button" :loading="loading" @click="submit">
          进入后台
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: min(1100px, 100%);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  overflow: hidden;
  border-radius: 36px;
  border: 1px solid rgba(220, 228, 242, 0.9);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 30px 80px rgba(30, 48, 90, 0.14);
}

.login-copy {
  padding: 52px;
  background:
    radial-gradient(circle at top left, rgba(57, 113, 255, 0.25), transparent 30%),
    linear-gradient(145deg, #101c34 0%, #1f315d 100%);
  color: #fff;
}

.login-copy p {
  margin: 0;
  letter-spacing: 0.22em;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.66);
}

.login-copy h1 {
  margin: 20px 0 12px;
  font-size: clamp(34px, 5vw, 54px);
  line-height: 1.05;
}

.login-copy span {
  display: block;
  max-width: 380px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.74);
}

.login-form {
  padding: 44px;
}

.login-button {
  width: 100%;
  height: 48px;
  margin-top: 6px;
}

@media (max-width: 900px) {
  .login-card {
    grid-template-columns: 1fr;
  }
}
</style>
