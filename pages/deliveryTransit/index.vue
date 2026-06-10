<template>
	<view class="transit-page">
		<view class="nav-wrap">
			
			<view class="nav-row">
        <view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack" @touchend.stop.prevent="goBack">‹</view>
				<text>配送中</text>

			</view>
		</view>

		<view class="list">
			<view v-if="!list.length" class="empty-state">暂无数据</view>
			<view class="order-card" v-for="item in list" :key="item.id" @click="toDetail(item)">
				<view class="card-head">
					<view class="order-title">
						<u-icon name="order" color="#1f7cff" size="32"></u-icon>
						<text>{{ item.orderNum || '-' }}（订单号）</text>
					</view>
					<text :class="['pill', isDone(item) ? 'done' : 'active']">{{ isDone(item) ? '已完成' : '配送中' }}</text>
				</view>
				<view class="product">{{ getProducts(item) || '-' }}</view>
				<view class="company">{{ item.companyName || item.clientName || '-' }}</view>
				<view class="time">{{ item.orderTime || item.createTime || '-' }}</view>
				<button v-if="!isDone(item)" class="complete-btn" @click.stop="toComplete(item)">已完成配送</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const list = ref([])

const normalizeStatus = item => Number(item.deliveryStatus ?? item.status ?? 1)
const isDone = item => normalizeStatus(item) === 2
const formatProduct = product => {
	const name = product.name || product.productName || product.productInfo || ''
	const quantity = product.orderQuantity || product.quantity || product.num
	return `${name}${quantity ? `*${quantity}` : ''}`
}

const getOrderProducts = order => {
	if (Array.isArray(order.products) && order.products.length) {
		return order.products.map(formatProduct).filter(Boolean).join('\n')
	}
	return order.productInfo || order.productName || order.name || ''
}

const getProducts = item => {
	if (Array.isArray(item.products) && item.products.length) {
		return item.products.map(formatProduct).filter(Boolean).join('\n')
	}
	const orders = item.orders || item.orderList || []
	const text = orders.map(getOrderProducts).filter(Boolean).join('\n')
	return item.productInfo || text
}

const loadList = async () => {
	try {
		const data = await uni.$api.deliveryInTransitList({ pageNum: 1, pageSize: 20 })
		const records = data?.records || data
		list.value = Array.isArray(records) ? records : []
	} catch (e) {
		list.value = []
	}
}

const toComplete = item => {
	if (!item.id) return
	uni.navigateTo({ url: `/pages/deliveryComplete/index?id=${item.id}` })
}

const toDetail = item => {
	if (!item.id) return
	uni.navigateTo({ url: `/pages/deliveryTransitDetail/index?id=${item.id}` })
}

const goBack = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		return
	}
	uni.switchTab({
		url: '/pages/index/index',
		fail: () => uni.reLaunch({ url: '/pages/index/index' })
	})
}

onShow(loadList)
</script>

<style lang="scss" scoped>
.transit-page{
	min-height: 100vh;
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
.list{
	padding: 32rpx 34rpx 0;
}
.empty-state{
	padding: 120rpx 0;
	color: #b8b8b8;
	font-size: 28rpx;
	text-align: center;
}
.order-card{
	margin-bottom: 18rpx;
	padding: 28rpx 24rpx 24rpx;
	border-radius: 12rpx;
	background: #f7f7f7;
}
.card-head{
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}
.order-title{
	display: flex;
	align-items: center;
	gap: 8rpx;
	min-width: 0;
	color: #333;
	font-size: 28rpx;
	line-height: 40rpx;
}
.pill{
	flex: 0 0 auto;
	min-width: 94rpx;
	height: 42rpx;
	padding: 0 22rpx;
	border-radius: 42rpx;
	font-size: 24rpx;
	line-height: 42rpx;
	text-align: center;
}
.pill.active{
	background: #cfe0ff;
	color: #1f7cff;
}
.pill.done{
	background: #eeeeee;
	color: #999;
}
.product{
	margin-top: 16rpx;
	color: #333;
	font-size: 30rpx;
	line-height: 44rpx;
	white-space: pre-line;
	word-break: break-all;
}
.company{
	margin-top: 8rpx;
	color: #999;
	font-size: 26rpx;
	line-height: 36rpx;
}
.time{
	margin-top: 8rpx;
	color: #c8c8c8;
	font-size: 24rpx;
	line-height: 34rpx;
}
.complete-btn{
	width: 100%;
	height: 48rpx;
	margin-top: 8rpx;
	border: 0;
	border-radius: 48rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 26rpx;
	line-height: 48rpx;
	&::after{ border: 0; }
}
</style>
