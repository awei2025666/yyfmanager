<template>
	<view class="binding-page">
		<view class="nav-wrap">
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack" @touchend.stop.prevent="goBack">‹</view>
				<text>配送绑定</text>
			</view>
		</view>

		<view class="hero">
			<view>
				<view class="hero-label">扫码配送绑定</view>
				<view class="hero-title">{{ orderNo || '请扫码获取订单' }}</view>
			</view>
			<view :class="['status-pill', canBind ? 'pending' : 'normal']">{{ statusText }}</view>
		</view>

		<view v-if="!orderId" class="scan-empty">
			<view class="scan-mark">
				<view class="corner lt"></view>
				<view class="corner rt"></view>
				<view class="corner lb"></view>
				<view class="corner rb"></view>
			</view>
			<view class="empty-title">请先扫码订单</view>
			<view class="empty-desc">扫码后会自动展示单位、地址、联系人和产品信息</view>
			<button class="secondary-btn" @click="scanOrder">扫码绑定</button>
		</view>

		<view v-else class="content">
			<view class="section">
				<view class="section-title"><view class="mark"></view><text>单位信息</text></view>
				<view class="info-card">
					<view class="info-row">
						<text class="label">单位名称</text>
						<text class="value">{{ companyInfo.companyName || '-' }}</text>
					</view>
					<view class="info-row">
						<text class="label">送货地址</text>
						<text class="value">{{ companyInfo.address || '-' }}</text>
					</view>
					<view class="info-row">
						<text class="label">联系电话</text>
						<text class="value">{{ companyInfo.phone || '-' }}</text>
					</view>
					<view class="info-row">
						<text class="label">联系人</text>
						<text class="value">{{ companyInfo.linkman || '-' }}</text>
					</view>
				</view>
			</view>

			<view class="section product-section">
				<view class="section-title"><view class="mark"></view><text>产品信息</text></view>
				<view v-if="!productList.length" class="empty-products">暂无产品信息</view>
				<view class="product-card" v-for="(item,index) in productList" :key="item.id || index">
					<view class="product-head">
						<view class="product-index">{{ index + 1 }}</view>
						<view class="product-name">{{ item.name || item.productName || item.productInfo || '-' }}</view>
					</view>
					<view class="product-desc">{{ getProductDesc(item) || '-' }}</view>
				</view>
			</view>
		</view>

		<view class="bottom-bar" v-if="orderId && canBind">
			<button class="bind-btn" :disabled="submitting" @click="bindOrder">{{ submitting ? '绑定中...' : '确认绑定' }}</button>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const orderId = ref('')
const detail = ref({})
const submitting = ref(false)
const orderStatusMap = {
	1: '待审批',
	2: '待生产',
	3: '生产中',
	4: '待配送',
	5: '配送中',
	6: '已完成',
	7: '已驳回'
}

const orderNo = computed(() => detail.value.orderId || detail.value.orderNo || detail.value.orderNum || orderId.value)
const status = computed(() => Number(detail.value.status || detail.value.orderStatus || 0))
const canBind = computed(() => status.value === 4)
const statusText = computed(() => {
	if (!orderId.value) return '未扫码'
	if (canBind.value) return '待配送'
	if (!status.value) return '订单详情'
	return detail.value.statusName || orderStatusMap[status.value] || '不可绑定'
})

const firstOrder = computed(() => {
	const list = detail.value.orderList || detail.value.orders || detail.value.deliveryOrders
	return Array.isArray(list) ? (list[0] || {}) : {}
})

const companyInfo = computed(() => {
	const source = firstOrder.value || {}
	return {
		companyName: detail.value.companyName || detail.value.cooperativeClientName || source.companyName || source.cooperativeClientName,
		address: detail.value.companyAddress || detail.value.deliveryAddress || detail.value.address || source.companyAddress || source.deliveryAddress || source.address,
		phone: detail.value.phone || detail.value.contactPhone || detail.value.linkPhone || source.phone || source.contactPhone || source.linkPhone,
		linkman: detail.value.linkman || detail.value.contactName || detail.value.contacts || source.linkman || source.contactName || source.contacts
	}
})

const productList = computed(() => {
	const list = detail.value.productList || detail.value.productsList || detail.value.products
	if (Array.isArray(list)) return list
	const orders = detail.value.orderList || detail.value.orders || detail.value.deliveryOrders
	if (Array.isArray(orders)) {
		return orders.reduce((result, order) => {
			const products = order.productList || order.productsList || order.products
			if (Array.isArray(products)) return result.concat(products)
			if (order.productInfo || order.productName || order.name) return result.concat(order)
			return result
		}, [])
	}
	if (detail.value.productInfo || detail.value.productName || detail.value.name) return [detail.value]
	return []
})

const parseScanOrderId = result => {
	const raw = typeof result === 'object' && result
		? (result.result || result.path || result.rawData || result.scanResult || '')
		: result
	const text = String(raw || '').trim()
	if (!text) return ''
	if (/^\d+$/.test(text)) return text
	const findOrderNo = value => {
		const source = String(value || '')
		const labeled = source.match(/(?:orderId|id|orderNo|orderNum|订单号)[:=：\s]+([^&\s]+)/i)
		if (labeled?.[1]) return decodeURIComponent(labeled[1])
		const number = source.match(/\d{10,}/)
		return number?.[0] || ''
	}
	try {
		const url = new URL(text)
		const params = url.searchParams
		const hashParams = new URLSearchParams((url.hash || '').replace(/^#\/?[^?]*\??/, ''))
		return (
			params.get('orderId') ||
			params.get('id') ||
			params.get('orderNo') ||
			params.get('orderNum') ||
			hashParams.get('orderId') ||
			hashParams.get('id') ||
			hashParams.get('orderNo') ||
			hashParams.get('orderNum') ||
			findOrderNo(text) ||
			text
		)
	} catch (e) {}
	try {
		const data = JSON.parse(text)
		if (typeof data === 'string' || typeof data === 'number') return String(data)
		return data.orderId || data.id || data.orderNo || data.orderNum || ''
	} catch (e) {}
	const match = text.match(/(?:orderId|id|orderNo|orderNum)=([^&\s]+)/i)
	if (match?.[1]) return decodeURIComponent(match[1])
	return findOrderNo(text) || text
}

const formatMoney = value => {
	if (value === undefined || value === null || value === '') return ''
	const numberValue = Number(value)
	return Number.isFinite(numberValue) ? `¥${numberValue.toFixed(2)}` : `¥${value}`
}

const getProductDesc = item => {
	const spec = item.trimmedSize || item.specification || item.size || ''
	const quantity = item.orderQuantity || item.quantity || item.num || ''
	const money = formatMoney(item.money || item.customerMoney || item.unitPrice)
	return [spec, quantity, money].filter(value => value !== '').join(' / ')
}

const loadDetail = async () => {
	if (!orderId.value) return
	try {
		const info = await uni.$api.deliveryBindingInfo({ id: orderId.value })
		detail.value = info || {}
	} catch (e) {
		detail.value = {}
		uni.showToast({ title: e?.message || '获取订单详情失败', icon: 'none' })
	}
}

const scanOrder = () => {
	uni.scanCode({
		onlyFromCamera: true,
		success: res => {
			const id = parseScanOrderId(res)
			if (!id) {
				uni.showToast({ title: '未识别到订单信息', icon: 'none' })
				return
			}
			orderId.value = id
			loadDetail()
		},
		fail: err => {
			const message = String(err?.errMsg || err?.message || '')
			if (/cancel|取消/i.test(message)) return
			uni.showToast({ title: '扫码失败', icon: 'none' })
		}
	})
}

const bindOrder = () => {
	if (!orderId.value || submitting.value) return
	uni.showModal({
		title: '确认绑定',
		content: '确认绑定该配送订单吗？',
		success: async res => {
			if (!res.confirm) return
			try {
				submitting.value = true
				await uni.$api.deliveryBinding({ id: orderId.value })
				uni.showToast({ title: '绑定成功', icon: 'none' })
				setTimeout(goIndex, 700)
			} catch (e) {
				uni.showToast({ title: e?.message || '绑定失败', icon: 'none' })
			} finally {
				submitting.value = false
			}
		}
	})
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
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		return
	}
	goIndex()
}

onLoad(options => {
	orderId.value = options.id ? decodeURIComponent(options.id) : ''
	loadDetail()
})
</script>

<style lang="scss" scoped>
.binding-page{
	min-height: 100vh;
	padding-bottom: 150rpx;
	background: #f6f8fb;
	color: #2d2d2d;
}
.nav-wrap{
	background: #fff;
	border-bottom: 1rpx solid #edf0f5;
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
}
.hero{
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20rpx;
	margin: 24rpx 30rpx 0;
	padding: 30rpx;
	border-radius: 18rpx;
	background: linear-gradient(135deg, #1f7cff, #02b9ff);
	color: #fff;
	box-shadow: 0 14rpx 34rpx rgba(31, 124, 255, .2);
}
.hero-label{
	opacity: .82;
	font-size: 24rpx;
	line-height: 34rpx;
}
.hero-title{
	margin-top: 10rpx;
	font-size: 34rpx;
	font-weight: 700;
	line-height: 44rpx;
	word-break: break-all;
}
.status-pill{
	flex: 0 0 auto;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, .22);
	font-size: 24rpx;
	line-height: 34rpx;
	&.pending{
		background: #fff3d8;
		color: #d98a00;
	}
}
.content{
	padding: 8rpx 30rpx 0;
}
.section{
	margin-top: 24rpx;
}
.section-title{
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 16rpx;
	color: #222;
	font-size: 30rpx;
	font-weight: 600;
	line-height: 42rpx;
}
.mark{
	width: 8rpx;
	height: 30rpx;
	border-radius: 8rpx;
	background: #1f7cff;
}
.info-card,
.product-card{
	border-radius: 16rpx;
	background: #fff;
	box-shadow: 0 8rpx 24rpx rgba(24, 39, 75, .05);
}
.info-card{
	padding: 4rpx 26rpx;
}
.info-row{
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 28rpx;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #edf0f5;
	&:last-child{
		border-bottom: 0;
	}
	.label{
		flex: 0 0 150rpx;
		color: #8a8f99;
		font-size: 27rpx;
		line-height: 38rpx;
	}
	.value{
		flex: 1;
		color: #222;
		font-size: 28rpx;
		line-height: 40rpx;
		text-align: right;
		word-break: break-all;
	}
}
.product-section{
	padding-bottom: 16rpx;
}
.product-card{
	margin-top: 16rpx;
	padding: 24rpx 26rpx;
}
.product-head{
	display: flex;
	align-items: center;
	gap: 14rpx;
}
.product-index{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 38rpx;
	height: 38rpx;
	border-radius: 50%;
	background: #e8f2ff;
	color: #1f7cff;
	font-size: 24rpx;
	font-weight: 700;
}
.product-name{
	flex: 1;
	color: #222;
	font-size: 30rpx;
	font-weight: 600;
	line-height: 42rpx;
	word-break: break-all;
}
.product-desc{
	margin-top: 14rpx;
	padding-left: 52rpx;
	color: #8a8f99;
	font-size: 26rpx;
	line-height: 38rpx;
	word-break: break-all;
}
.empty-products{
	padding: 48rpx 0;
	border-radius: 16rpx;
	background: #fff;
	color: #a7adb8;
	font-size: 28rpx;
	text-align: center;
}
.scan-empty{
	margin: 54rpx 30rpx 0;
	padding: 70rpx 34rpx 46rpx;
	border-radius: 20rpx;
	background: #fff;
	text-align: center;
	box-shadow: 0 8rpx 24rpx rgba(24, 39, 75, .05);
}
.scan-mark{
	position: relative;
	width: 116rpx;
	height: 116rpx;
	margin: 0 auto;
	.corner{
		position: absolute;
		width: 38rpx;
		height: 38rpx;
		border-color: #1f7cff;
		border-style: solid;
	}
	.lt{ left: 0; top: 0; border-width: 7rpx 0 0 7rpx; }
	.rt{ right: 0; top: 0; border-width: 7rpx 7rpx 0 0; }
	.lb{ left: 0; bottom: 0; border-width: 0 0 7rpx 7rpx; }
	.rb{ right: 0; bottom: 0; border-width: 0 7rpx 7rpx 0; }
}
.empty-title{
	margin-top: 32rpx;
	color: #222;
	font-size: 32rpx;
	font-weight: 600;
	line-height: 44rpx;
}
.empty-desc{
	margin-top: 12rpx;
	color: #8a8f99;
	font-size: 26rpx;
	line-height: 38rpx;
}
.secondary-btn{
	width: 260rpx;
	height: 76rpx;
	margin-top: 42rpx;
	border: 0;
	border-radius: 12rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 29rpx;
	line-height: 76rpx;
	&::after{ border: 0; }
}
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 34rpx;
	width: 100%;
	max-width: 390px;
	padding: 0 34rpx;
	transform: translateX(-50%);
	box-sizing: border-box;
}
.bind-btn{
	width: 100%;
	height: 82rpx;
	border: 0;
	border-radius: 14rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 30rpx;
	line-height: 82rpx;
	box-shadow: 0 10rpx 24rpx rgba(31, 124, 255, .24);
	&::after{ border: 0; }
	&[disabled]{
		opacity: .72;
	}
}
</style>
