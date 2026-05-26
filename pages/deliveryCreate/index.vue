<template>
	<view class="delivery-create-page">
		<view class="nav-wrap">
	
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack">‹</view>
				<text>新建配送单</text>

			</view>
		</view>

		<view class="section orders-section">
			<view class="section-head">
				<view class="section-title"><view class="mark"></view><text>订单信息</text></view>
				<text class="link" @click="showOrderPicker = true">+添加其他订单</text>
			</view>
			<view class="order-card" v-for="item in selectedOrders" :key="item.id">
				<view class="card-head">
					<view class="order-title">
						<u-icon name="order" color="#1f7cff" size="32"></u-icon>
						<text>{{ item.orderId || '-' }}（订单号）</text>
					</view>
					<view class="card-actions">
						<text class="pill">待配送</text>
						<view class="delete-btn" @tap.stop.prevent="removeOrder(item)" @click.stop.prevent="removeOrder(item)">
							<u-icon name="trash" color="#ff3447" size="40"></u-icon>
						</view>
					</view>
				</view>
				<view class="product">{{ getOrderProducts(item) }}</view>
				<view class="time">{{ item.orderTime || item.createTime || '-' }}</view>
			</view>
			<view v-if="!selectedOrders.length" class="empty-state">暂无数据</view>
		</view>

		<view class="gap"></view>

		<view class="section driver-section">
			<view class="section-head">
				<view class="section-title"><view class="mark"></view><text>司机信息</text></view>
			</view>
			<view class="driver-card" @click="showDriverPicker = true" v-if="selectedDriver.id || selectedDriver.name">
				<view>{{ selectedDriver.name || '-' }}</view>
				<view class="driver-phone">{{ selectedDriver.phone || '-' }}</view>
			</view>
			<view class="driver-card empty-driver" @click="showDriverPicker = true" v-else>请选择司机</view>
		</view>

		<view class="bottom-bar">
			<button class="confirm-btn" @click="submit">确认创建配送单</button>
		</view>

		<view class="sheet-mask" v-if="showOrderPicker" @click="showOrderPicker = false">
			<view class="sheet" @click.stop>
				<view class="sheet-title">添加其他订单</view>
				<view class="sheet-card" v-for="item in availableOrders" :key="item.id" @click="addOrder(item)">
					<view>{{ item.orderId || '-' }}（订单号）</view>
					<view class="sheet-desc">{{ getOrderProducts(item) }}</view>
					<view class="sheet-time">{{ item.orderTime || item.createTime || '-' }}</view>
				</view>
				<view v-if="!availableOrders.length" class="sheet-empty">暂无数据</view>
			</view>
		</view>

		<view class="sheet-mask" v-if="showDriverPicker" @click="showDriverPicker = false">
			<view class="sheet" @click.stop>
				<view class="sheet-title">选择司机</view>
				<view class="driver-option" v-for="item in drivers" :key="item.id" @click="selectDriver(item)">
					<view>{{ item.name || item.driverName || '-' }}</view>
					<view class="sheet-time">{{ item.phone || item.driverPhone || '-' }}</view>
				</view>
				<view v-if="!drivers.length" class="sheet-empty">暂无数据</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const selectedOrders = ref([])
const orderPool = ref([])
const drivers = ref([])
const selectedDriver = ref({})
const showOrderPicker = ref(false)
const showDriverPicker = ref(false)
const initialId = ref('')

const availableOrders = computed(() => {
	const ids = selectedOrders.value.map(item => String(item.id))
	return orderPool.value.filter(item => !ids.includes(String(item.id)))
})

const getRecords = data => {
	const records = data?.records || data?.list || data
	return Array.isArray(records) ? records : []
}

const mergeOrderByPool = order => {
	const latest = orderPool.value.find(item => String(item.id) === String(order.id))
	return latest ? { ...order, ...latest } : order
}

const syncStoredOrders = () => {
	uni.setStorageSync('deliveryCreateOrders', selectedOrders.value)
}

const normalizeProductLine = product => {
	const name = product.name || product.productName || product.productInfo || product.title || ''
	const quantity = product.orderQuantity || product.quantity || product.num || product.count || ''
	if (!name) return ''
	return `${name}${quantity ? `*${quantity}` : ''}`
}

const getOrderProducts = order => {
	const productList = order.products || order.productList || order.productsList || order.orderProducts || []
	if (Array.isArray(productList) && productList.length) {
		const text = productList.map(normalizeProductLine).filter(Boolean).join('\n')
		if (text) return text
	}
	const productInfo = order.productInfo || order.productName || order.name || ''
	if (productInfo && productInfo !== '-') {
		const quantity = order.orderQuantity || order.quantity || order.num || ''
		return `${productInfo}${quantity ? `*${quantity}` : ''}`
	}
	return '-'
}

const normalizeDriver = item => ({
	...item,
	name: item.name || item.driverName || item.tenantUserName,
	phone: item.phone || item.driverPhone || item.tenantUserPhone
})

const loadOrders = async () => {
	const storedOrders = uni.getStorageSync('deliveryCreateOrders')
	if (Array.isArray(storedOrders) && storedOrders.length) {
		selectedOrders.value = storedOrders
	}
	try {
		const data = await uni.$api.deliveryOrderList({ pageNum: 1, pageSize: 50 })
		const list = getRecords(data)
		orderPool.value = list
		if (selectedOrders.value.length) {
			selectedOrders.value = selectedOrders.value.map(mergeOrderByPool)
			syncStoredOrders()
		}
		if (!selectedOrders.value.length && initialId.value) {
			selectedOrders.value = list.filter(item => String(item.id) === String(initialId.value))
			syncStoredOrders()
		}
	} catch (e) {
		orderPool.value = []
	}
}

const loadDrivers = async () => {
	try {
		const data = await uni.$api.deliveryDriver()
		const list = getRecords(data)
		drivers.value = list.map(normalizeDriver)
	} catch (e) {
		drivers.value = []
	}
}

const addOrder = item => {
	if (!selectedOrders.value.some(order => String(order.id) === String(item.id))) {
		selectedOrders.value.push(item)
		syncStoredOrders()
	}
	showOrderPicker.value = false
}

const removeOrder = item => {
	selectedOrders.value = selectedOrders.value.filter(order => String(order.id) !== String(item.id))
	syncStoredOrders()
}

const selectDriver = item => {
	selectedDriver.value = normalizeDriver(item)
	showDriverPicker.value = false
}

const submit = async () => {
	showOrderPicker.value = false
	showDriverPicker.value = false
	if (!selectedOrders.value.length) {
		uni.showToast({ title: '请添加订单', icon: 'none' })
		return
	}
	if (!selectedDriver.value.id) {
		uni.showToast({ title: '请选择司机', icon: 'none' })
		return
	}
	try {
		await uni.$api.deliveryAdd({
			deliveryTenantUserId: selectedDriver.value.id,
			orderIds: selectedOrders.value.map(item => item.id),
			orderIdList: selectedOrders.value.map(item => item.id)
		})
		uni.showToast({ title: '创建成功', icon: 'none' })
		setTimeout(() => {
			uni.redirectTo({ url: '/pages/deliveryTransit/index' })
		}, 500)
	} catch (e) {
		uni.showToast({
			title: e?.code === 1002 ? '请先登录后再创建' : (e?.message || '创建配送单失败'),
			icon: 'none'
		})
	}
}

const goBack = () => {
	uni.removeStorageSync('deliveryCreateOrders')
	uni.redirectTo({ url: '/pages/deliveryPending/index' })
}

onLoad(options => {
	initialId.value = options.id || ''
	loadOrders()
	loadDrivers()
})
</script>

<style lang="scss" scoped>
.delivery-create-page{
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
.section{
	padding: 36rpx 26rpx 32rpx;
}
.section-head{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}
.section-title{
	display: flex;
	align-items: center;
	gap: 10rpx;
	color: #2d2d2d;
	font-size: 34rpx;
	line-height: 46rpx;
	.mark{
		width: 8rpx;
		height: 28rpx;
		border-radius: 8rpx;
		background: #1f7cff;
	}
}
.link{
	color: #1f7cff;
	font-size: 28rpx;
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
	gap: 14rpx;
}
.order-title{
	display: flex;
	align-items: center;
	gap: 8rpx;
	flex: 1;
	min-width: 0;
	color: #333;
	font-size: 28rpx;
	line-height: 40rpx;
	text{
		min-width: 0;
		word-break: break-all;
	}
}
.card-actions{
	display: flex;
	align-items: center;
	flex: 0 0 auto;
	gap: 20rpx;
}
.pill{
	height: 42rpx;
	min-width: 92rpx;
	padding: 0 18rpx;
	border-radius: 42rpx;
	background: #cfe0ff;
	color: #1f7cff;
	font-size: 24rpx;
	line-height: 42rpx;
	text-align: center;
	white-space: nowrap;
}
.delete-btn{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
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
	margin-top: 6rpx;
	color: #c7c7c7;
	font-size: 24rpx;
	line-height: 34rpx;
}
.gap{
	height: 16rpx;
	background: #f7f7f7;
}
.empty-state{
	padding: 70rpx 0 36rpx;
	color: #b8b8b8;
	font-size: 28rpx;
	text-align: center;
}
.driver-card{
	padding: 28rpx 72rpx 28rpx;
	border-radius: 12rpx;
	background: #f7f7f7;
	color: #333;
	font-size: 30rpx;
	line-height: 42rpx;
}
.empty-driver{
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 90rpx;
	padding: 24rpx;
	color: #1f7cff;
	text-align: center;
}
.driver-phone{
	margin-top: 22rpx;
	color: #9d9d9d;
}
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 34rpx;
	width: 100%;
	max-width: 390px;
	padding: 0 26rpx;
	box-sizing: border-box;
	transform: translateX(-50%);
}
.confirm-btn{
	width: 100%;
	height: 82rpx;
	border: 0;
	border-radius: 12rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 30rpx;
	line-height: 82rpx;
	&::after{ border: 0; }
}
.sheet-mask{
	position: fixed;
	inset: 0;
	z-index: 50;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	background: rgba(0,0,0,.42);
}
.sheet{
	width: 100%;
	max-width: 390px;
	max-height: 70vh;
	padding: 34rpx 26rpx 50rpx;
	border-radius: 28rpx 28rpx 0 0;
	background: #fff;
	overflow-y: auto;
	box-sizing: border-box;
}
.sheet-title{
	margin-bottom: 22rpx;
	font-size: 32rpx;
	font-weight: 600;
}
.sheet-empty{
	padding: 48rpx 0;
	color: #b8b8b8;
	font-size: 28rpx;
	text-align: center;
}
.sheet-card,
.driver-option{
	margin-top: 16rpx;
	padding: 24rpx;
	border-radius: 12rpx;
	background: #f7f7f7;
	font-size: 28rpx;
}
.sheet-desc{
	margin-top: 10rpx;
	line-height: 38rpx;
	white-space: pre-line;
}
.sheet-time{
	margin-top: 10rpx;
	color: #999;
	font-size: 25rpx;
}
</style>
