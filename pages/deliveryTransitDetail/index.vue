<template>
	<view class="transit-detail">
		<view class="nav-wrap">
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack">‹</view>
				<text>配送单详情</text>
			</view>
		</view>

    <view :class="['status-band', detail.status === 2 ? 'done' : 'active']">{{ deliveryStatusText }}</view>

		<view class="section order-section">
			<view class="section-title"><view class="mark"></view><text>订单信息</text></view>
			<view class="order-card" v-for="order in orderList" :key="order.id || order.orderId">
				<view class="order-title">
					<u-icon name="order" color="#1f7cff" size="30"></u-icon>
					<text>{{ order.orderNum || '-' }}（订单号）</text>
				</view>
				<view class="product">{{ getOrderProducts(order) || '-' }}</view>
			</view>
		</view>

		<view class="gap"></view>

		<view class="section">
			<view class="section-title"><view class="mark"></view><text>单位信息</text></view>
			<view class="info-list">
				<view class="info-row"><text>单位名称</text><text>{{ companyInfo.companyName || '-' }}</text></view>
				<view class="info-row"><text>联系人</text><text>{{ companyInfo.linkman || '-' }}</text></view>
				<view class="info-row"><text>联系方式</text><text>{{ companyInfo.phone || '-' }}</text></view>
				<view class="info-row"><text>送货地址</text><text>{{ companyInfo.address || '-' }}</text></view>
				<view class="info-row"><text>交货日期</text><text>{{ companyInfo.deliveryDate || '-' }}</text></view>
			</view>
		</view>

		<view class="bottom-bar" v-if="detail.status === 1">
			<button class="complete-btn" @click="toComplete">已完成配送</button>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const deliveryId = ref('')
const detail = ref({})
const processList = ref([])

const asArray = value => Array.isArray(value) ? value : []
const firstOrder = computed(() => orderList.value[0] || {})
const orderList = computed(() => {
	const list = detail.value.orderList || detail.value.orders || detail.value.deliveryOrders
	if (Array.isArray(list)) return list
	const order = detail.value.order || detail.value.orderInfo
	if (order) return [order]
	if (detail.value.orderId || detail.value.productInfo || Array.isArray(detail.value.products)) return [detail.value]
	return []
})

const companyInfo = computed(() => {
	const source = firstOrder.value || {}
	return {
		companyName: detail.value.companyName || detail.value.cooperativeClientName || source.companyName || source.cooperativeClientName,
		linkman: detail.value.linkman || detail.value.contactName || source.linkman || source.contactName,
		phone: detail.value.phone || detail.value.contactPhone || source.phone || source.contactPhone,
		address: detail.value.companyAddress || detail.value.deliveryAddress || detail.value.address || source.companyAddress || source.deliveryAddress || source.address,
		deliveryDate: detail.value.deliveryDate || source.deliveryDate || detail.value.orderTime || source.orderTime
	}
})

const driverName = computed(() => detail.value.driverName || detail.value.deliveryTenantUserName || detail.value.tenantUserName || '')
const driverPhone = computed(() => detail.value.driverPhone || detail.value.deliveryTenantUserPhone || detail.value.tenantUserPhone || '')
const deliveryStatusText = computed(() => detail.value.status === 2 ? '已完成' : '配送中')

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

const formatTime = time => {
	if (!time) return '-'
	return String(time).replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1.$2.$3').slice(0, 16)
}

const normalizeImages = value => {
	if (Array.isArray(value)) return value.filter(Boolean)
	if (!value) return []
	return String(value).split(',').map(item => item.trim()).filter(Boolean)
}

const getImages = item => normalizeImages(item.img || item.images || item.imageList || item.imgList || item.pictureList || item.imgRemark || item.completeImgRemark)
const maskPhone = phone => String(phone || '').replace(/^(\d{3})\d{4}(\d+)/, '$1****$2')
const getRecordRemark = item => item.remark || item.completeRemark || ''

const getProcessFromDetail = info => {
	const list = info.processList || info.processInfo || info.records || info.deliveryProcessList
	return asArray(list)
}

const loadDetail = async () => {
	if (!deliveryId.value) return
	try {
		const [info, process] = await Promise.all([
			uni.$api.deliveryOrderDetail({ id: deliveryId.value }),
			uni.$api.deliveryProcessInfo({ id: deliveryId.value })
		])
		detail.value = info || {}
		const records = process?.records || process
		processList.value = asArray(records).length ? asArray(records) : getProcessFromDetail(info || {})
	} catch (e) {
		detail.value = {}
		processList.value = []
	}
}

const toComplete = () => {
	if (!deliveryId.value) return
	uni.navigateTo({ url: `/pages/deliveryComplete/index?id=${deliveryId.value}` })
}

const goBack = () => {
	uni.redirectTo({
		url: '/pages/deliveryTransit/index',
		fail: () => uni.reLaunch({ url: '/pages/deliveryTransit/index' })
	})
}

onLoad(options => {
	deliveryId.value = options.id || ''
	loadDetail()
})
</script>

<style lang="scss" scoped>
.transit-detail{
	min-height: 100vh;
	padding-bottom: 150rpx;
	background: #fff;
	color: #2d2d2d;
}
.nav-wrap{ background: #fff; border-bottom: 1rpx solid #eeeeee; }
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
}
.status-band{
	height: 52rpx;
	background: #ff9f18;
	color: #fff;
	font-size: 25rpx;
	line-height: 52rpx;
	text-align: center;
  &.active{
    background: #ff9f18;
  }
  &.done{
    background: #18bf7b;
  }
}
.section{
	padding: 28rpx 30rpx;
	background: #fff;
}
.order-section{
	min-height: 250rpx;
}
.section-title{
	display: flex;
	align-items: center;
	gap: 10rpx;
	color: #333;
	font-size: 29rpx;
	line-height: 40rpx;
	.mark{ width: 7rpx; height: 28rpx; border-radius: 8rpx; background: #1f7cff; }
}
.gap{ height: 16rpx; background: #f7f7f7; }
.order-card{
	margin-top: 18rpx;
	padding: 20rpx 22rpx;
	border-radius: 10rpx;
	background: #f8f8f8;
}
.order-title{
	display: flex;
	align-items: center;
	gap: 8rpx;
	color: #333;
	font-size: 27rpx;
	line-height: 38rpx;
}
.product{
	margin-top: 12rpx;
	color: #333;
	font-size: 27rpx;
	line-height: 40rpx;
	white-space: pre-line;
	word-break: break-all;
}
.time{
	margin-top: 8rpx;
	color: #c8c8c8;
	font-size: 24rpx;
	line-height: 34rpx;
}
.info-list{ margin-top: 20rpx; }
.info-row{
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 24rpx;
	min-height: 46rpx;
	color: #999;
	font-size: 25rpx;
	line-height: 40rpx;
	text:first-child{ flex: 0 0 140rpx; }
	text:last-child{ flex: 1; color: #666; text-align: right; word-break: break-all; }
}
.record-section{ padding-bottom: 30rpx; }
.timeline{
	position: relative;
	margin-top: 22rpx;
	padding-left: 26rpx;
	&::before{
		content: "";
		position: absolute;
		left: 7rpx;
		top: 10rpx;
		bottom: 20rpx;
		width: 1rpx;
		background: #d8efe5;
	}
}
.record-item{
	position: relative;
	margin-bottom: 20rpx;
	.dot{
		position: absolute;
		left: -26rpx;
		top: 12rpx;
		width: 16rpx;
		height: 16rpx;
		border: 4rpx solid #dbfff0;
		border-radius: 50%;
		background: #16c983;
		box-sizing: border-box;
	}
}
.record-card{
	padding: 18rpx 20rpx;
	border: 1rpx solid #eeeeee;
	border-radius: 6rpx;
	background: #fff;
}
.record-time{
	color: #222;
	font-size: 26rpx;
	font-weight: 600;
	line-height: 36rpx;
}
.record-content{
	margin-top: 4rpx;
	color: #555;
	font-size: 24rpx;
	line-height: 34rpx;
}
.record-remark{
	margin-top: 8rpx;
	color: #666;
	font-size: 24rpx;
	line-height: 34rpx;
	word-break: break-all;
}
.thumbs{
	display: flex;
	gap: 8rpx;
	margin-top: 12rpx;
	image{ width: 78rpx; height: 78rpx; border-radius: 8rpx; background: #d9d9d9; }
}
.record-user{
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
	margin-top: 10rpx;
	color: #bbb;
	font-size: 23rpx;
	line-height: 32rpx;
}
.empty-state{
	padding: 52rpx 0;
	color: #b8b8b8;
	font-size: 26rpx;
	text-align: center;
}
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 34rpx;
	width: 100%;
	max-width: 390px;
	padding: 0 30rpx;
	box-sizing: border-box;
	transform: translateX(-50%);
}
.complete-btn{
	width: 100%;
	height: 78rpx;
	border: 0;
	border-radius: 10rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 29rpx;
	line-height: 78rpx;
	&::after{ border: 0; }
}
</style>
