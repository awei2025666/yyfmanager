<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import PageBlock from '../../components/PageBlock.vue'
import { createTenantVipPay, getTenantVipList, getTenantVipPayStatus } from '../../api/tenant'

const state = reactive({
  loading: false,
  creating: false,
  checking: false
})

const plans = ref([])
const selectedPlanKey = ref('')
const payInfo = ref(null)
const payType = ref(1)
const wechatQr = ref('')
const agreement = ref(true)
let statusTimer = null

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
const payOrderId = computed(() => getPayOrderId(payInfo.value))
const payContent = computed(() => getPayContent(payInfo.value))
const payAmount = computed(() => payInfo.value?.amount || payInfo.value?.payMoney || selectedPlan.value?.currentPrice || 0)
const payButtonText = computed(() => (payType.value === 1 ? '生成支付二维码' : '生成支付宝支付'))

const clearStatusTimer = () => {
  if (!statusTimer) return
  clearTimeout(statusTimer)
  statusTimer = null
}

const resetPayResult = () => {
  clearStatusTimer()
  payInfo.value = null
  wechatQr.value = ''
}

const getPayOrderId = (payload) => {
  if (!payload || typeof payload !== 'object') return ''
  return payload.id || payload.orderId || payload.payId || payload.vipOrderId || ''
}

const getPayContent = (payload) => {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  return (
    payload.payInfo ||
    payload.payString ||
    payload.pay ||
    payload.payContent ||
    payload.content ||
    payload.html ||
    payload.qr ||
    payload.qrCode ||
    payload.codeUrl ||
    payload.payUrl ||
    payload.url ||
    payload.data ||
    ''
  )
}

const getPayStatusValue = (payload) => {
  if (payload === 2 || payload === 3) return payload
  if (typeof payload === 'string') return Number(payload)
  return Number(payload?.status ?? payload?.payStatus ?? payload?.state ?? payload?.code)
}

const loadPlans = async () => {
  state.loading = true
  try {
    const data = await getTenantVipList()
    plans.value = listRows(data).map(normalizePlan)
    selectedPlanKey.value = plans.value[0]?.key || ''
    resetPayResult()
  } catch (error) {
    plans.value = []
    selectedPlanKey.value = ''
    ElMessage.error(error?.message || '套餐加载失败')
  } finally {
    state.loading = false
  }
}

const selectPlan = (plan) => {
  if (selectedPlanKey.value === plan.key) return
  selectedPlanKey.value = plan.key
  resetPayResult()
}

const selectPayType = (type) => {
  if (payType.value === type) return
  payType.value = type
  resetPayResult()
}

const schedulePayStatusCheck = () => {
  clearStatusTimer()
  if (!payOrderId.value) return
  statusTimer = setTimeout(checkPayStatus, 10000)
}

const checkPayStatus = async () => {
  if (!payOrderId.value) return
  state.checking = true
  try {
    const data = await getTenantVipPayStatus(payOrderId.value)
    const status = getPayStatusValue(data)
    if (status === 2) {
      clearStatusTimer()
      ElMessage.success('支付成功，正在刷新会员时长')
      setTimeout(()=>{
        window.location.reload()
      },3000)
      return
    }
    if (status === 3) {
      clearStatusTimer()
      ElMessage.error('支付失败，请重新生成二维码支付')
      setTimeout(()=>{
        window.location.reload()
      },3000)
      return
    }
    schedulePayStatusCheck()
  } catch (error) {
    ElMessage.error(error?.message || '支付状态查询失败')
    schedulePayStatusCheck()
  } finally {
    state.checking = false
  }
}

const createOrder = async () => {
  if (!selectedPlan.value) return ElMessage.warning('请选择套餐')
  if (!agreement.value) return ElMessage.warning('请先勾选服务协议')
  if (state.creating) return
  resetPayResult()
  state.creating = true
  try {
    const data = await createTenantVipPay({
      type: payType.value,
      vipPackageId: selectedPlan.value.id
    })
    payInfo.value = data && typeof data === 'object' ? data : { payInfo: data }
    if (payType.value === 1) {
      wechatQr.value = await QRCode.toDataURL(payContent.value, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M'
      })
    }
    ElMessage.success(payType.value === 1 ? '二维码已生成' : '支付宝支付页面已生成')
    schedulePayStatusCheck()
  } catch (error) {
    ElMessage.error(error?.message || '生成二维码失败')
  } finally {
    state.creating = false
  }
}

onMounted(loadPlans)
onBeforeUnmount(clearStatusTimer)
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
            <button type="button" :class="{ active: payType === 1 }" @click="selectPayType(1)">微</button>
            <button type="button" :class="{ active: payType === 2 }" @click="selectPayType(2)">支</button>
          </div>
          <span>扫码支付</span>
          <div class="qr-box" :class="{ empty: payType === 1 ? !wechatQr : !payContent }">
            <img v-if="payType === 1 && wechatQr" :src="wechatQr" alt="微信支付二维码" />
            <iframe v-else-if="payType === 2 && payContent" title="支付宝支付" :srcdoc="payContent"></iframe>
            <span v-else>{{ state.creating ? '生成中' : '请先生成二维码' }}</span>
          </div>
          <strong>{{ moneyText(payAmount) }}</strong>
          <del v-if="selectedPlan?.original">{{ selectedPlan.original }}</del>
          <el-checkbox v-model="agreement">服务协议</el-checkbox>
          <el-button type="primary" :loading="state.creating" :disabled="!selectedPlan" @click="createOrder">
            {{ payButtonText }}
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

.qr-box iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: #ffffff;
}

.pay-panel strong {
  font-size: 26px;
}

.pay-panel del {
  color: #c0c4cc;
}
</style>
