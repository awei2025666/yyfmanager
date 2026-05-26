<template>
	<view class="pending-page">
		<view class="nav-wrap">
		
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack" @touchend.stop.prevent="goBack">‹</view>
				<text>待配送</text>

			</view>
		</view>

		<view class="list">
			<view v-if="!list.length" class="empty-state">暂无数据</view>
			<view class="order-card" v-for="item in list" :key="item.id" @click="handleCardClick(item)">
				<view class="card-head">
					<view class="order-title">
						<view v-if="selectMode" :class="['check-box', isSelected(item) ? 'checked' : '']">
							<text v-if="isSelected(item)">✓</text>
						</view>
						<u-icon v-else name="order" color="#1f7cff" size="32"></u-icon>
						<text>{{ item.orderId || '-' }}（订单号）</text>
					</view>
					<view class="right">
						<text class="pill">待配送</text>
						<text class="arrow" v-if="!selectMode">›</text>
					</view>
				</view>
				<view class="product">{{ getProducts(item) || '-' }}</view>
				<view class="time">{{ item.orderTime || item.createTime || '-' }}</view>
			</view>
		</view>

		<view class="bottom-bar">
			<button class="create-btn" @click="selectMode ? nextStep() : startCreate()">{{ selectMode ? '下一步' : '新建配送单' }}</button>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'

const list = ref([])
const selectMode = ref(false)
const selectedOrders = ref([])

const formatProduct = product => {
	const name = product.name || product.productName || product.productInfo || ''
	const quantity = product.orderQuantity || product.quantity || product.num
	return `${name}${quantity ? `*${quantity}` : ''}`
}

const getProducts = item => {
	if (Array.isArray(item.products) && item.products.length) {
		return item.products.map(formatProduct).filter(Boolean).join('\n')
	}
	return item.productInfo || item.productName || item.name || ''
}

const loadList = async () => {
	try {
		const data = await uni.$api.deliveryOrderList({ pageNum: 1, pageSize: 20 })
		const records = data?.records || data
		list.value = Array.isArray(records) ? records : []
		restoreSelection()
	} catch (e) {
		list.value = []
		restoreSelection()
	}
}

const restoreSelection = () => {
	const storedOrders = uni.getStorageSync('deliveryCreateOrders')
	if (!Array.isArray(storedOrders) || !storedOrders.length) return
	const ids = storedOrders.map(item => String(item.id))
	selectedOrders.value = list.value.filter(item => ids.includes(String(item.id)))
}

const toOrderDetail = item => {
	if (!item.id) return
	uni.navigateTo({ url: `/pages/orderDetail/index?id=${item.id}&from=deliveryPending` })
}

const isSelected = item => selectedOrders.value.some(order => String(order.id) === String(item.id))

const toggleOrder = item => {
	if (isSelected(item)) {
		selectedOrders.value = selectedOrders.value.filter(order => String(order.id) !== String(item.id))
		return
	}
	selectedOrders.value.push(item)
}

const handleCardClick = item => {
	if (selectMode.value) {
		toggleOrder(item)
		return
	}
	toOrderDetail(item)
}

const startCreate = () => {
	selectMode.value = true
	selectedOrders.value = list.value.slice(0, 2)
	uni.setStorageSync('deliveryCreateOrders', selectedOrders.value)
}

const nextStep = () => {
	if (!selectedOrders.value.length) {
		uni.showToast({ title: '请选择订单', icon: 'none' })
		return
	}
	uni.setStorageSync('deliveryCreateOrders', selectedOrders.value)
	uni.navigateTo({ url: '/pages/deliveryCreate/index' })
}

const goIndex = () => {
	uni.switchTab({
		url: '/pages/index/index',
		fail: () => {
			uni.reLaunch({ url: '/pages/index/index' })
		}
	})
}

const goBack = () => {
	if (selectMode.value) {
		selectMode.value = false
		selectedOrders.value = []
		return
	}
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		setTimeout(() => {
			if (typeof window !== 'undefined' && window.location.hash.includes('/pages/deliveryPending/index')) {
				goIndex()
			}
		}, 300)
		return
	}
	goIndex()
}

onMounted(loadList)
onLoad(options => {
	if (options.mode === 'select') {
		selectMode.value = true
	}
})
</script>

<style lang="scss" scoped>
.pending-page{
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
.list{
	padding: 26rpx 30rpx 0;
}
.empty-state{
	padding: 120rpx 0;
	color: #b8b8b8;
	font-size: 28rpx;
	text-align: center;
}
.order-card{
	margin-bottom: 16rpx;
	padding: 24rpx 24rpx 28rpx;
	border-radius: 12rpx;
	background: #f7f7f7;
}
.card-head{
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.order-title{
	display: flex;
	align-items: center;
	gap: 8rpx;
	color: #333;
	font-size: 28rpx;
	line-height: 40rpx;
}
.check-box{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32rpx;
	height: 32rpx;
	border: 2rpx solid #d7d7d7;
	border-radius: 4rpx;
	background: #fff;
	color: #fff;
	font-size: 26rpx;
	line-height: 32rpx;
	box-sizing: border-box;
}
.check-box.checked{
	border-color: #1f7cff;
	background: #1f7cff;
}
.right{
	display: flex;
	align-items: center;
	gap: 14rpx;
}
.pill{
	min-width: 92rpx;
	height: 40rpx;
	padding: 0 18rpx;
	border-radius: 40rpx;
	background: #cfe0ff;
	color: #1f7cff;
	font-size: 23rpx;
	line-height: 40rpx;
	text-align: center;
}
.arrow{
	color: #999;
	font-size: 52rpx;
	font-weight: 300;
	line-height: 1;
}
.product{
	margin-top: 16rpx;
	color: #333;
	font-size: 29rpx;
	line-height: 42rpx;
	white-space: pre-line;
	word-break: break-all;
}
.time{
	margin-top: 8rpx;
	color: #c9c9c9;
	font-size: 24rpx;
	line-height: 34rpx;
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
}
.create-btn{
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
