<template>
	<view class="delivery-detail">
		<view class="nav-wrap">
		
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack">‹</view>
				<text>配送单详情</text>

			</view>
		</view>

		<view :class="['status-band', isDeliveryDone ? 'done' : 'active']">{{ deliveryStatusText }}</view>

		<view class="section">
			<view class="section-title"><view class="mark"></view><text>订单信息</text></view>
			<view class="order-card" v-for="order in orderList" :key="order.id || order.orderId">
				<view class="card-head">
					<view class="order-title">
						<u-icon name="order" color="#1f7cff" size="32"></u-icon>
						<text>{{ order.orderId || '-' }}（订单号）</text>
					</view>
					<text :class="['pill', isOrderDone(order) ? 'done' : 'active']">{{ isOrderDone(order) ? '已完成' : '配送中' }}</text>
				</view>
				<view class="product">{{ getOrderProducts(order) || '-' }}</view>
				<view class="time">{{ order.orderTime || order.createTime || '-' }}</view>
				<button v-if="canCompleteOrder(order)" class="card-complete-btn" @click.stop="toCompleteDelivery">已完成配送</button>
			</view>
			<view v-if="!orderList.length" class="empty-state">暂无数据</view>
		</view>

		<view class="gap"></view>

		<view class="section driver-section">
			<view class="section-title"><view class="mark"></view><text>司机信息</text></view>
			<view class="driver-card">
				<view>{{ driver.name || '-' }}</view>
				<view class="driver-phone">{{ driver.phone || '-' }}</view>
			</view>
		</view>

		<view class="gap"></view>

		<view class="section record-section">
			<view class="section-title"><view class="mark"></view><text>配送记录</text></view>
			<view class="timeline">
				<view class="record-item" v-for="(item,index) in processList" :key="item.id || index">
					<view class="record-time">{{ formatTime(item.createTime) }}</view>
					<view class="record-content">{{ item.content || '-' }}</view>
					<view v-if="hasImages(item)" class="thumbs">
						<image v-for="(image, imageIndex) in getImages(item)" :key="imageIndex" :src="image" mode="aspectFill"></image>
					</view>
					<view class="record-user">
						<text>{{ item.tenantUserName || driver.name || '-' }}</text>
						<text>{{ maskPhone(item.tenantUserPhone || item.phone || driver.phone) || '-' }}</text>
					</view>
				</view>
				<view v-if="!processList.length" class="empty-state">暂无数据</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const deliveryId = ref('')
const fromPage = ref('')
const detail = ref({})
const processList = ref([])
const hasDetail = computed(() => Object.keys(detail.value || {}).length > 0)

const deliveryStatus = computed(() => Number(detail.value.status || detail.value.deliveryStatus || 2))
const isDeliveryDone = computed(() => deliveryStatus.value === 3 || detail.value.statusName === '已完成')
const deliveryStatusText = computed(() => isDeliveryDone.value ? '已完成' : '配送中')
const driver = computed(() => {
	const firstOrder = detail.value.orderList?.[0] || {}
	return {
		name: detail.value.driverName || detail.value.deliveryTenantUserName || detail.value.tenantUserName || firstOrder.driverName || firstOrder.deliveryTenantUserName || firstOrder.tenantUserName,
		phone: detail.value.driverPhone || detail.value.deliveryTenantUserPhone || detail.value.tenantUserPhone || firstOrder.driverPhone || firstOrder.deliveryTenantUserPhone || firstOrder.tenantUserPhone
	}
})
const orderList = computed(() => {
	const list = detail.value.orderList || detail.value.orders || []
	return list
})

const formatTime = time => {
	if (!time) return '-'
	return String(time).replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1.$2.$3').slice(0, 16)
}
const maskPhone = phone => String(phone || '').replace(/^(\d{3})\d{4}(\d+)/, '$1****$2')
const isOrderDone = order => {
	const status = Number(order.deliveryStatus || order.status || 1)
	return status === 2 || status === 3 || order.statusName === '已完成'
}
const canCompleteOrder = order => deliveryId.value && hasDetail.value && !isDeliveryDone.value && !isOrderDone(order)
const getOrderProducts = order => {
	if (Array.isArray(order.products) && order.products.length) {
		return order.products
			.map(item => {
				const name = item.name || item.productName || item.productInfo || ''
				const quantity = item.orderQuantity || item.quantity || item.num
				return `${name}${quantity ? `*${quantity}` : ''}`
			})
			.filter(Boolean)
			.join('\n')
	}
	return order.productInfo || order.name || ''
}
const normalizeImages = value => {
	if (Array.isArray(value)) return value.filter(Boolean)
	if (!value) return []
	return String(value).split(',').map(item => item.trim()).filter(Boolean)
}
const getImages = item => normalizeImages(item.images || item.imageList || item.imgList || item.pictureList || item.imgRemark)
const hasImages = item => getImages(item).length > 0

const loadDetail = async () => {
	if (!deliveryId.value) return
	try {
		const [info, process] = await Promise.all([
			uni.$api.deliveryDetail({ id: deliveryId.value }),
			uni.$api.deliveryProcessInfo({ id: deliveryId.value })
		])
		detail.value = info || {}
		const records = process?.records || process
		processList.value = Array.isArray(records) ? records : []
	} catch (e) {
		detail.value = {}
		processList.value = []
	}
}

const toCompleteDelivery = () => {
	if (!deliveryId.value) return
	uni.navigateTo({ url: `/pages/deliveryComplete/index?id=${deliveryId.value}` })
}

const goBack = () => {
	if (fromPage.value === 'index') {
		uni.switchTab({
			url: '/pages/index/index',
			fail: () => uni.reLaunch({ url: '/pages/index/index' })
		})
		return
	}
	if (fromPage.value === 'transit') {
		uni.redirectTo({
			url: '/pages/deliveryTransit/index',
			fail: () => uni.reLaunch({ url: '/pages/deliveryTransit/index' })
		})
		return
	}
	uni.redirectTo({
		url: '/pages/deliveryTransit/index',
		fail: () => uni.switchTab({ url: '/pages/index/index' })
	})
}

onLoad(options => {
	deliveryId.value = options.id || ''
	fromPage.value = options.from || ''
	loadDetail()
})
</script>

<style lang="scss" scoped>
.delivery-detail{
	min-height: 100vh;
	padding-bottom: 48rpx;
	background: #fff;
	color: #262626;
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
	font-size: 30rpx;
	line-height: 64rpx;
	text-align: center;
	&.active{
		background: #ff9f18;
	}
	&.done{
		background: #18bf7b;
	}
}
.section{
	padding: 38rpx 24rpx 34rpx;
	background: #fff;
}
.empty-state{
	padding: 54rpx 0;
	color: #b8b8b8;
	font-size: 28rpx;
	text-align: center;
}
.gap{
	height: 16rpx;
	background: #f7f7f7;
}
.section-title{
	display: flex;
	align-items: center;
	gap: 10rpx;
	margin-bottom: 30rpx;
	color: #2d2d2d;
	font-size: 34rpx;
	line-height: 46rpx;
	.mark{ width: 8rpx; height: 28rpx; border-radius: 8rpx; background: #1f7cff; }
}
.driver-section{
	padding-bottom: 26rpx;
}
.driver-card{
	padding: 24rpx 28rpx;
	border-radius: 10rpx;
	background: #f7f7f7;
	color: #333;
	font-size: 29rpx;
	line-height: 42rpx;
}
.driver-phone{
	margin-top: 6rpx;
	color: #999;
	font-size: 27rpx;
}
.order-card{
	margin-top: 16rpx;
	padding: 26rpx 24rpx 28rpx;
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
.time{
	margin-top: 8rpx;
	color: #c8c8c8;
	font-size: 24rpx;
	line-height: 34rpx;
}
.card-complete-btn{
	width: 100%;
	height: 48rpx;
	margin-top: 10rpx;
	border: 0;
	border-radius: 48rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 25rpx;
	line-height: 48rpx;
	&::after{ border: 0; }
}
.record-section{
	padding-right: 30rpx;
}
.timeline{
	padding: 18rpx 16rpx 0 64rpx;
}
.record-item{
	margin-bottom: 52rpx;
}
.record-time{
	color: #222;
	font-size: 30rpx;
	font-weight: 700;
	line-height: 42rpx;
}
.record-content{
	margin-top: 8rpx;
	color: #333;
	font-size: 26rpx;
	line-height: 38rpx;
}
.thumbs{
	display: flex;
	gap: 8rpx;
	margin-top: 16rpx;
	image{ width: 96rpx; height: 96rpx; border-radius: 14rpx; background: #d9d9d9; }
}
.record-user{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 18rpx;
	color: #999;
	font-size: 25rpx;
	line-height: 36rpx;
}
</style>
