<template>
	<view class="production-page">
		<view class="nav-wrap">
		
			<view class="nav-row">
				<view class="back" @tap.stop="goBack" @click.stop="goBack">‹</view>
				<text>一键生产</text>

			</view>
		</view>

		<view class="status-band">待生产</view>

		<view class="section">
			<view class="section-title"><view class="mark"></view><text>工艺信息</text></view>
			<view class="craft-card" v-for="item in craftList" :key="item.id">
				<view class="craft-head">
					<text class="craft-name">{{ item.productInfo || item.productName || '-' }}</text>
					<text :class="['pill', item.craftStatus === 2 ? 'done' : 'pending']">{{ statusMap[item.craftStatus] || '待生产' }}</text>
				</view>
				<view class="craft-desc">
					{{ getCraftDesc(item) }}<text v-if="item.remark" class="danger">*{{ item.remark }}</text>
				</view>
				<button class="complete-btn" @click="toComplete(item)">已完成生产</button>
			</view>
			<view v-if="!craftList.length" class="empty-state">暂无数据</view>
		</view>

		<view class="gap"></view>

		<view class="section consumable-section">
			<view class="section-title"><view class="mark"></view><text>耗材记录</text></view>
			<view class="consumable-card" v-for="item in consumableList" :key="item.id">
				<view class="consumable-name">{{ item.consumableName || item.name || '-' }}*{{ item.num || 0 }}<text v-if="item.remark">*{{ item.remark }}</text></view>
				<view class="consumable-meta">{{ item.createUserName || '-' }}， {{ item.createTime || '-' }}</view>
			</view>
			<view v-if="!consumableList.length" class="empty-state">暂无数据</view>
		</view>

		<view class="bottom-bar">
			<button class="add-btn" @click="addConsumable">添加耗材消耗</button>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'

const orderId = ref('')
const craftList = ref([])
const consumableList = ref([])
const statusMap = {
	1: '待生产',
	2: '已生产'
}

const formatMoney = value => {
	if (value === undefined || value === null || value === '') return ''
	const numberValue = Number(value)
	return Number.isFinite(numberValue) ? `¥${numberValue.toFixed(2)}` : `¥${value}`
}

const getCraftDesc = item => {
	const craftName = item.craftName || item.name || ''
	const quantity = item.orderQuantity || ''
	const unitPrice = formatMoney(item.unitPrice)
	const customerMoney = formatMoney(item.customerMoney)
	return [craftName, quantity, unitPrice, customerMoney].filter(value => value !== '').join('*')
}

const loadCrafts = async () => {
	try {
		if (orderId.value) {
			const data = await uni.$api.productsCraftInfo({ id: orderId.value })
			craftList.value = Array.isArray(data) ? data : []
			return
		}
		const data = await uni.$api.productsCraftList({ pageNum: 1, pageSize: 20 })
		const records = data?.records || data
		craftList.value = Array.isArray(records) ? records : []
	} catch (e) {
		craftList.value = []
	}
}

const loadConsumables = async () => {
	if (!orderId.value) {
		consumableList.value = []
		return
	}
	try {
		const data = await uni.$api.consumableInfo({ id: orderId.value })
		consumableList.value = Array.isArray(data) ? data : []
	} catch (e) {
		consumableList.value = []
	}
}

const toComplete = item => {
	uni.navigateTo({
		url: `/pages/productionComplete/index?id=${item.id || ''}&orderId=${orderId.value || ''}`
	})
}

const addConsumable = () => {
	uni.navigateTo({
		url: `/pages/productionConsumableAdd/index?orderId=${orderId.value || ''}`
	})
}

const goBack = () => {
	uni.switchTab({
		url: '/pages/index/index',
		fail: () => {
			uni.reLaunch({ url: '/pages/index/index' })
		}
	})
}

onLoad(options => {
	orderId.value = options.id || options.orderId || ''
	loadCrafts()
	loadConsumables()
})
</script>

<style lang="scss" scoped>
.production-page{
	min-height: 100vh;
	padding-bottom: 150rpx;
	background: #fff;
	color: #2d2d2d;
}
.nav-wrap{
	background: #fff;
	border-bottom: 1rpx solid #eeeeee;
}
.fake-status{
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 34rpx 40rpx 0;
	color: #222;
	font-size: 30rpx;
	font-weight: 600;
}
.status-icons{
	display: flex;
	align-items: center;
	gap: 8rpx;
	.signal{ width: 30rpx; height: 22rpx; border-radius: 3rpx; background: #333; }
	.wifi{ width: 26rpx; height: 18rpx; border-top: 6rpx solid #333; border-radius: 50%; }
	.battery{ width: 42rpx; height: 20rpx; border: 3rpx solid #333; border-radius: 5rpx; }
}
.nav-row{
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	height: 108rpx;
	padding: 0 24rpx;
	font-size: 34rpx;
	font-weight: 600;
	.back{
		display: flex;
		align-items: center;
		justify-content: center;
		width: 72rpx;
		height: 72rpx;
		font-size: 66rpx;
		font-weight: 300;
		line-height: 1;
	}
	.capsule{
		justify-self: end;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 174rpx;
		height: 64rpx;
		border: 1rpx solid #e8e8e8;
		border-radius: 64rpx;
		font-size: 32rpx;
		.divider{ width: 1rpx; height: 36rpx; margin: 0 24rpx; background: #e8e8e8; }
		.circle{ width: 34rpx; height: 34rpx; border-radius: 50%; border: 7rpx solid #333; }
	}
}
.status-band{
	height: 64rpx;
	color: #fff;
	font-size: 31rpx;
	line-height: 64rpx;
	text-align: center;
	background: #ff9f18;
}
.section{
	padding: 38rpx 30rpx 34rpx;
	background: #fff;
}
.empty-state{
	padding: 54rpx 0;
	color: #b8b8b8;
	font-size: 28rpx;
	text-align: center;
}
.section-title{
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 24rpx;
	font-size: 34rpx;
	line-height: 48rpx;
	.mark{
		width: 8rpx;
		height: 28rpx;
		border-radius: 8rpx;
		background: #1f7cff;
	}
}
.craft-card,
.consumable-card{
	margin-top: 20rpx;
	padding: 26rpx 24rpx;
	border-radius: 14rpx;
	background: #f7f7f7;
}
.craft-card:first-of-type,
.consumable-card:first-of-type{
	margin-top: 0;
}
.craft-head{
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}
.craft-name{
	flex: 1;
	color: #333;
	font-size: 30rpx;
	line-height: 42rpx;
	word-break: break-all;
}
.pill{
	flex: 0 0 auto;
	min-width: 108rpx;
	height: 40rpx;
	padding: 0 18rpx;
	border-radius: 40rpx;
	font-size: 23rpx;
	line-height: 40rpx;
	text-align: center;
}
.pending{
	background: #ffd3dc;
	color: #ff3347;
}
.done{
	background: #c9f0df;
	color: #18bf7b;
}
.craft-desc{
	margin-top: 14rpx;
	color: #9a9a9a;
	font-size: 26rpx;
	line-height: 36rpx;
	word-break: break-all;
}
.danger{
	color: #ff3347;
}
.complete-btn{
	height: 48rpx;
	margin-top: 18rpx;
	border: 0;
	border-radius: 48rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 26rpx;
	line-height: 48rpx;
	&::after{ border: 0; }
}
.gap{
	height: 16rpx;
	background: #f7f7f7;
}
.consumable-section{
	padding-bottom: 20rpx;
}
.consumable-name{
	color: #333;
	font-size: 30rpx;
	line-height: 42rpx;
}
.consumable-meta{
	margin-top: 16rpx;
	color: #999;
	font-size: 26rpx;
	line-height: 36rpx;
	letter-spacing: 2rpx;
}
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 34rpx;
	width: 100%;
	max-width: 390px;
	padding: 0 30rpx;
	transform: translateX(-50%);
	box-sizing: border-box;
	background: transparent;
}
.add-btn{
	width: 100%;
	height: 78rpx;
	border: 0;
	border-radius: 12rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 30rpx;
	line-height: 78rpx;
	&::after{ border: 0; }
}
</style>
