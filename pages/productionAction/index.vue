<template>
	<view class="page">
		<view class="nav"><text @click="goBack">‹</text><strong>一键生产</strong><i></i></view>
		<view class="card" v-for="item in crafts" :key="item.id">
			<view class="product">{{ item.productInfo || '-' }}</view>
			<view class="name-line">
				<view class="name">{{ item.craftName || item.name || '-' }}</view><text
					:class="['status-tag', statusClass(item)]">{{ statusText(item) }}</text>
			</view>
			<view class="info"><text>成品数量：{{ item.orderQuantity || '-' }}{{ item.unit || '' }}</text><text>开数：{{
				item.formatSize || '-' }}</text><text>单双面：{{ singleDoubleText(item.singleDouble) }}</text><text
					>颜色：{{ item.colour || '-' }}</text><text>规格：{{ item.formula || '-'
					}}</text><text>专色：{{ item.spotColors || '-' }}</text><text class="color-info">备注：{{ item.remark || '-' }}</text></view>
			<button v-if="canOperate(item) && status(item) === 1" class="start" @click="start(item)">开始生产</button>
			<button v-else-if="canOperate(item) && status(item) === 3" class="end" @click="end(item)">结束生产</button>
		</view>
		<view v-if="!crafts.length" class="empty">暂无工艺</view>
	</view>
</template>
<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
const crafts = ref([])
const orderId = ref('')
const craftIds = ref([])
const status = item => Number(item.craftStatus ?? item.productionStatus ?? item.status ?? 1)
const canOperate = item => Number(item?.showStartButton) === 1
const statusText = item => ({ 1: '待生产', 2: '已完成', 3: '生产中' }[status(item)] || '待生产')
const statusClass = item => ({ 1: 'pending', 2: 'done', 3: 'producing' }[status(item)] || 'pending')
const singleDoubleText = value => ({ 1: '单面', 2: '双面自翻', 3: '双面天地翻', 4: '双面扣板', 5: '双面' }[Number(value)] || '-')
const load = async ids => { try { const data = await uni.$api.productsCraftInfoByIds({ ids }); const list = Array.isArray(data) ? data : (data?.records || data?.data || []); crafts.value = Array.isArray(list) ? list : [] } catch (e) { crafts.value = [] } }
const openComplete = item => uni.navigateTo({ url: `/pages/productionComplete/index?id=${item.id}&ids=${item.id}&orderId=${orderId.value}` })
const start = async item => {
	try {
		await uni.$api.startProduction({ id: item.id })
		uni.showToast({ title: '已开始生产', icon: 'none' })
		await load(crafts.value.map(craft => craft.id).filter(Boolean))
	} catch (e) {
		uni.showToast({ title: e?.message || '开始生产失败', icon: 'none' })
	}
}
const end = item => openComplete(item)
const goBack = () => uni.navigateBack()
onLoad(options => { orderId.value = options.orderId || ''; craftIds.value = (options.ids || options.id || '').split(',').filter(Boolean); load(craftIds.value) })
onShow(() => { if (craftIds.value.length) load(craftIds.value) })
</script>
<style lang="scss" scoped>
.page {
	min-height: 100vh;
	padding: 0 24rpx;
	background: #f7f8fa
}

.nav {
	height: 110rpx;
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	background: #fff;
	font-size: 34rpx
}

.nav text {
	font-size: 66rpx;
	font-weight: 300
}

.nav i {
	display: block
}

.card {
	margin-top: 20rpx;
	padding: 28rpx;
	border-radius: 18rpx;
	background: #fff
}

.product {
	color: #8b93a0;
	font-size: 24rpx
}

.name-line {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-top: 12rpx
}

.name {
	color: #20242b;
	font-size: 32rpx;
	font-weight: 600
}

.status-tag {
	padding: 8rpx 16rpx;
	border-radius: 24rpx;
	font-size: 22rpx;
	white-space: nowrap
}

.status-tag.pending {
	background: #ffd6df;
	color: #ff3347
}

.status-tag.producing {
	background: #d8e8ff;
	color: #287df5
}

.status-tag.done {
	background: #c9f0df;
	color: #18bf7b
}

.info {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12rpx 18rpx;
	margin: 18rpx 0 24rpx;
	color: #8d97a6;
	font-size: 25rpx;
	line-height: 34rpx
}

.color-info {
	color: #ff3347
}

.card button {
	height: 78rpx;
	border-radius: 16rpx;
	font-size: 28rpx;
	line-height: 78rpx
}

.start {
	background: #ff3347;
	color: #fff
}

.end {
	background: #287df5;
	color: #fff
}

.empty {
	text-align: center;
	color: #999;
	padding: 80rpx
}
</style>
