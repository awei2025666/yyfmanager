<template>
	<view class="transit-detail">
		<view class="nav-wrap">
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack">‹</view>
				<text>配送单详情</text>
			</view>
		</view>

    <view :class="['status-band', deliveryStatus === 2 ? 'done' : 'active']">{{ deliveryStatusText }}</view>

		<view class="section order-section">
			<view class="section-title"><view class="mark"></view><text>订单信息</text></view>
			<view class="order-card" v-for="order in orderList" :key="order.id || order.orderId">
				<view class="order-title">
					<u-icon name="order" color="#1f7cff" size="30"></u-icon>
					<text>{{ order.orderNum || '-' }}（订单号）</text>
				</view>
				<view class="product">{{ getOrderProducts(order) || '-' }}</view>
				<view class="shipping-info">
					<view class="shipping-row"><text>联系人</text><text>{{ getShippingInfo(order).linkman || '-' }}</text></view>
					<view class="shipping-row"><text>联系电话</text><text>{{ getShippingInfo(order).phone || '-' }}</text></view>
					<view class="shipping-row"><text>配送地址</text><text>{{ getShippingInfo(order).companyAddress || '-' }}</text></view>
					<view class="shipping-edit" @click.stop="openShippingEditor(order)">编辑配送信息</view>
				</view>
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

		<view class="gap"></view>

		<view class="section record-section">
			<view class="section-title"><view class="mark"></view><text>配送记录</text></view>
			<view class="timeline">
				<view class="record-item" v-for="(item,index) in processList" :key="item.id || index">
					<view class="dot"></view>
					<view class="record-card">
						<view class="record-time">{{ formatTime(item.createTime) }}</view>
						<view class="record-content">{{ item.content || '-' }}</view>
						<view v-if="getRecordRemark(item)" class="record-remark">{{ getRecordRemark(item) }}</view>
						<view v-if="getImages(item).length" class="thumbs">
							<image v-for="(image, imageIndex) in getImages(item)" :key="imageIndex" :src="image" mode="aspectFill"></image>
						</view>
						<view v-if="getVideos(item).length" class="videos">
							<video v-for="(video, videoIndex) in getVideos(item)" :key="videoIndex" :src="video" controls></video>
						</view>
						<view class="record-user">
							<text>{{ item.tenantUserName || driverName || '-' }}</text>
							<text>{{ maskPhone(item.tenantUserPhone || item.phone || driverPhone) || '-' }}</text>
						</view>
					</view>
				</view>
				<view v-if="!processList.length" class="empty-state">暂无数据</view>
			</view>
		</view>

		<view class="bottom-bar" v-if="deliveryStatus === 1">
			<button class="complete-btn" @click="toComplete">已完成配送</button>
		</view>

		<view v-if="showShippingEditor" class="popup-mask" @click="closeShippingEditor">
			<view class="shipping-popup" @click.stop>
				<view class="popup-title">编辑配送信息</view>
				<view class="popup-row">
					<text>联系人</text>
					<input v-model="shippingForm.linkman" placeholder="请输入联系人" placeholder-class="placeholder" />
				</view>
				<view class="popup-row">
					<text>联系电话</text>
					<input v-model="shippingForm.phone" type="number" placeholder="请输入联系电话" placeholder-class="placeholder" />
				</view>
				<view class="popup-block">
					<text>配送地址</text>
					<textarea v-model="shippingForm.companyAddress" placeholder="请输入配送地址" placeholder-class="placeholder" />
				</view>
				<view class="popup-actions">
					<button class="cancel-btn" @click="closeShippingEditor">取消</button>
					<button class="save-btn" @click="saveShippingInfo">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

const deliveryId = ref('')
const detail = ref({})
const processList = ref([])
const showShippingEditor = ref(false)
const shippingForm = ref({
	orderId: '',
	linkman: '',
	phone: '',
	companyAddress: ''
})

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
const deliveryStatus = computed(() => Number(detail.value.deliveryStatus ?? detail.value.status ?? 1))
const deliveryStatusText = computed(() => deliveryStatus.value === 2 ? '已完成' : '配送中')

const getOrderId = order => order.orderId || order.id || ''
const getShippingInfo = order => ({
	linkman: order.linkman || order.contactName || '',
	phone: order.phone || order.contactPhone || '',
	companyAddress: order.companyAddress || order.deliveryAddress || order.address || ''
})

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
const getVideos = item => normalizeImages(item.video || item.videos || item.videoUrl || item.videoRemark)
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

const openShippingEditor = order => {
	const shippingInfo = getShippingInfo(order)
	shippingForm.value = {
		orderId: getOrderId(order),
		linkman: shippingInfo.linkman,
		phone: shippingInfo.phone,
		companyAddress: shippingInfo.companyAddress
	}
	showShippingEditor.value = true
}

const closeShippingEditor = () => {
	showShippingEditor.value = false
}

const saveShippingInfo = async () => {
	if (!shippingForm.value.orderId) {
		uni.showToast({ title: '缺少订单信息', icon: 'none' })
		return
	}
	try {
		await uni.$api.editShippingInformation({
			orderId: shippingForm.value.orderId,
			linkman: shippingForm.value.linkman,
			phone: shippingForm.value.phone,
			companyAddress: shippingForm.value.companyAddress
		})
		uni.showToast({ title: '已保存', icon: 'none' })
		showShippingEditor.value = false
		loadDetail()
	} catch (e) {}
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
onShow(loadDetail)
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
.shipping-info{
	margin-top: 14rpx;
	padding-top: 12rpx;
	border-top: 1rpx solid #eeeeee;
}
.shipping-row{
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
	margin-top: 8rpx;
	color: #999;
	font-size: 23rpx;
	line-height: 32rpx;
	text:first-child{
		flex: 0 0 112rpx;
	}
	text:last-child{
		flex: 1;
		color: #666;
		text-align: right;
		word-break: break-all;
	}
}
.shipping-edit{
	margin-top: 12rpx;
	color: #1f7cff;
	font-size: 23rpx;
	line-height: 32rpx;
	text-align: right;
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
.videos{
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	margin-top: 12rpx;
	video{
		width: 260rpx;
		height: 146rpx;
		border-radius: 8rpx;
		background: #d9d9d9;
		overflow: hidden;
	}
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
.popup-mask{
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 99;
	display: flex;
	align-items: flex-end;
	background: rgba(0, 0, 0, .45);
}
.shipping-popup{
	width: 100%;
	padding: 34rpx 34rpx calc(34rpx + env(safe-area-inset-bottom));
	border-radius: 24rpx 24rpx 0 0;
	background: #fff;
	box-sizing: border-box;
}
.popup-title{
	margin-bottom: 24rpx;
	color: #222;
	font-size: 32rpx;
	font-weight: 600;
	line-height: 44rpx;
}
.popup-row{
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 92rpx;
	border-bottom: 1rpx solid #eeeeee;
	text{
		color: #333;
		font-size: 28rpx;
	}
	input{
		flex: 1;
		height: 100%;
		color: #333;
		font-size: 28rpx;
		text-align: right;
	}
}
.popup-block{
	padding: 24rpx 0;
	border-bottom: 1rpx solid #eeeeee;
	text{
		color: #333;
		font-size: 28rpx;
		line-height: 40rpx;
	}
	textarea{
		width: 100%;
		height: 120rpx;
		margin-top: 18rpx;
		color: #333;
		font-size: 28rpx;
		line-height: 40rpx;
	}
}
.placeholder{
	color: #c8c8c8;
}
.popup-actions{
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20rpx;
	margin-top: 30rpx;
	button{
		height: 78rpx;
		border: 0;
		border-radius: 10rpx;
		font-size: 28rpx;
		line-height: 78rpx;
		&::after{ border: 0; }
	}
	.cancel-btn{
		background: #eeeeee;
		color: #555;
	}
	.save-btn{
		background: #1f7cff;
		color: #fff;
	}
}
</style>
