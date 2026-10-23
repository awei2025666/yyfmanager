<template>
	<view class="page">
		<view class="nav"><text @click="goBack">‹</text><strong>一键生产</strong><i></i></view>
		<view class="card" v-for="item in crafts" :key="item.id">
			<view class="product">{{ item.productInfo || '-' }}</view>
			<view class="name">{{ item.craftName || item.name || '-' }}</view>
			<view class="info"><text>工艺单位：{{ item.unit || '-' }}</text><text>成品数量：{{ item.orderQuantity || '-' }}</text><text>开数：{{ item.formatSize || '-' }}</text><text>备注：{{ item.remark || '-' }}</text><text>单双面：{{ singleDoubleText(item.singleDouble) }}</text><text>颜色：{{ item.colour || '-' }}</text><text>规格：{{ item.formula || '-' }}</text><text>专色：{{ item.spotColors || '-' }}</text></view>
			<button v-if="status(item) === 1" class="start" @click="start(item)">开始生产</button>
			<button v-else-if="status(item) === 3" class="end" @click="end(item)">结束生产</button>
			<view v-else class="done">已完成</view>
		</view>
		<view v-if="!crafts.length" class="empty">暂无工艺</view>
	</view>
</template>
<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
const crafts = ref([])
const orderId = ref('')
const status = item => Number(item.craftStatus ?? item.productionStatus ?? item.status ?? 1)
const singleDoubleText = value => ({ 1: '单面', 2: '双面自翻', 3: '双面天地翻', 4: '双面扣板', 5: '双面' }[Number(value)] || '-')
const load = async ids => { try { const data = await uni.$api.productsCraftInfoByIds({ ids }); const list = Array.isArray(data) ? data : (data?.records || data?.data || []); crafts.value = Array.isArray(list) ? list : [] } catch (e) { crafts.value = [] } }
const openComplete = item => uni.navigateTo({ url: `/pages/productionComplete/index?id=${item.id}&ids=${item.id}&orderId=${orderId.value}` })
const start = async item => {
	try {
		await uni.$api.startProduction({ id: item.id })
		openComplete(item)
	} catch (e) {
		uni.showToast({ title: e?.message || '开始生产失败', icon: 'none' })
	}
}
const end = item => openComplete(item)
const goBack = () => uni.navigateBack()
onLoad(options => { orderId.value = options.orderId || ''; load((options.ids || options.id || '').split(',').filter(Boolean)) })
</script>
<style lang="scss" scoped>
.page{min-height:100vh;padding:0 24rpx;background:#f7f8fa}.nav{height:110rpx;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;background:#fff;font-size:34rpx}.nav text{font-size:66rpx;font-weight:300}.nav i{display:block}.card{margin-top:20rpx;padding:28rpx;border-radius:18rpx;background:#fff}.product{color:#8b93a0;font-size:24rpx}.name{margin-top:12rpx;color:#20242b;font-size:32rpx;font-weight:600}.info{margin:12rpx 0 22rpx;color:#9aa1ad;font-size:25rpx}.card button,.done{height:78rpx;border-radius:16rpx;font-size:28rpx;line-height:78rpx}.start{background:#ff3347;color:#fff}.end{background:#287df5;color:#fff}.done{background:#c9f0df;color:#18bf7b;text-align:center}.empty{text-align:center;color:#999;padding:80rpx}
</style>
