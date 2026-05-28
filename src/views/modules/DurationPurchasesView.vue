<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageBlock from '../../components/PageBlock.vue'
import { createTenantVipOrder, getTenantVipList } from '../../api/tenant'

const state = reactive({
  loading: false,
  creating: false
})

const plans = ref([])
const selectedPlanKey = ref('')
const payInfo = ref(null)
const agreement = ref(true)

const moneyText = (value) =>
  `¥${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

const listRows = (payload) => {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.list || payload?.rows || []
}

const normalizePlan = (item = {}) => {
  const id = item.id || item.vipId || item.packageId || item.key || item.name
  const day = item.day ?? item.days ?? item.vipDay ?? item.durationDay ?? item.duration
  const currentPrice = item.currentPrice ?? item.price ?? item.amount ?? item.payMoney ?? 0
  const oldPrice = item.oldPrice ?? item.originPrice ?? item.originalPrice ?? item.marketPrice
  return {
    ...item,
    key: String(id),
    id,
    name: item.name || item.vipName || item.packageName || '-',
    days: day ? `有效时长${day}天` : item.durationLabel || '有效时长-',
    currentPrice,
    oldPrice,
    price: moneyText(currentPrice),
    original: oldPrice === undefined || oldPrice === null || oldPrice === '' ? '' : moneyText(oldPrice)
  }
}

const selectedPlan = computed(() => plans.value.find((item) => item.key === selectedPlanKey.value))
const payQr = computed(() => payInfo.value?.qrCode || payInfo.value?.payUrl || payInfo.value?.codeUrl || payInfo.value?.url || '')
const payAmount = computed(() => payInfo.value?.amount || payInfo.value?.payMoney || selectedPlan.value?.currentPrice || 0)

const loadPlans = async () => {
  state.loading = true
  try {
    const data = await getTenantVipList()
    plans.value = listRows(data).map(normalizePlan)
    selectedPlanKey.value = plans.value[0]?.key || ''
  } catch (error) {
    plans.value = []
    selectedPlanKey.value = ''
    ElMessage.error(error?.message || '套餐加载失败')
  } finally {
    state.loading = false
  }
}

const selectPlan = (plan) => {
  selectedPlanKey.value = plan.key
  payInfo.value = null
}

const createOrder = async () => {
  if (!selectedPlan.value) return ElMessage.warning('请选择套餐')
  if (!agreement.value) return ElMessage.warning('请先勾选服务协议')
  state.creating = true
  try {
    payInfo.value = await createTenantVipOrder({
      vipId: selectedPlan.value.id,
      packageId: selectedPlan.value.id
    })
    ElMessage.success('二维码已生成')
  } catch (error) {
    ElMessage.error(error?.message || '生成二维码失败')
  } finally {
    state.creating = false
  }
}

onMounted(loadPlans)
</script>

<template>
  <div class="duration-page">
    <PageBlock>
      <div v-loading="state.loading" class="duration-layout">
        <section class="plan-grid">
          <el-empty v-if="!state.loading && !plans.length" description="暂无可购买套餐" />
          <button
            v-for="plan in plans"
            :key="plan.key"
            type="button"
            class="plan-card"
            :class="{ active: selectedPlanKey === plan.key }"
            @click="selectPlan(plan)"
          >
            <span class="plan-card__mark"></span>
            <strong>{{ plan.name }}</strong>
            <em>{{ plan.days }}</em>
            <b>{{ plan.price }}</b>
            <del v-if="plan.original">{{ plan.original }}</del>
          </button>
        </section>

        <aside class="pay-panel">
          <div class="pay-tabs">
            <button type="button" class="active">微</button>
            <button type="button">支</button>
          </div>
          <span>扫码支付</span>
          <div class="qr-box" :class="{ empty: !payQr }">
            <img v-if="payQr" :src="payQr" alt="支付二维码" />
            <span v-else>{{ state.creating ? '生成中' : '请先生成二维码' }}</span>
          </div>
          <strong>{{ moneyText(payAmount) }}</strong>
          <del v-if="selectedPlan?.original">{{ selectedPlan.original }}</del>
          <el-checkbox v-model="agreement">服务协议</el-checkbox>
          <el-button type="primary" :loading="state.creating" :disabled="!selectedPlan" @click="createOrder">
            生成支付二维码
          </el-button>
        </aside>
      </div>
    </PageBlock>
  </div>
</template>

<style scoped>
.duration-page {
  padding: 0 20px;
}

.duration-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  min-height: 360px;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 16px;
}

.plan-card {
  min-height: 280px;
  padding: 30px 18px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #ffffff;
  color: #111111;
  cursor: pointer;
}

.plan-card.active {
  border-color: #1f6bff;
  background: #eaf2ff;
}

.plan-card__mark {
  display: block;
  width: 42px;
  height: 42px;
  margin: 0 auto 24px;
  border-radius: 50%;
  background: #555555;
}

.plan-card strong,
.plan-card em,
.plan-card b,
.plan-card del {
  display: block;
  text-align: center;
}

.plan-card strong {
  color: #1f6bff;
  font-size: 20px;
}

.plan-card em {
  margin-top: 16px;
  color: #909399;
  font-style: normal;
}

.plan-card b {
  margin-top: 34px;
  font-size: 28px;
}

.plan-card del {
  margin-top: 10px;
  color: #c0c4cc;
}

.pay-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-left: 28px;
  border-left: 1px solid #e4e7ed;
}

.pay-tabs {
  display: flex;
  gap: 12px;
}

.pay-tabs button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: #606266;
  color: #ffffff;
  font-weight: 700;
}

.pay-tabs .active {
  background: #1f6bff;
}

.qr-box {
  display: grid;
  place-items: center;
  width: 150px;
  height: 150px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #909399;
}

.qr-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pay-panel strong {
  font-size: 26px;
}

.pay-panel del {
  color: #c0c4cc;
}
</style>
