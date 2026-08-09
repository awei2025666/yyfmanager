<template>
	<view class="pack-page">
		<view class="nav-wrap">
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack" @touchend.stop.prevent="goBack">‹</view>
				<text>打包</text>
			</view>
		</view>

		<view class="content">
			<view v-if="productList.length" class="product-summary">
				<view class="product-summary-title">订单产品</view>
				<view v-for="(item, index) in productList" :key="item.id || item.productId || index" :class="['product-item', { first: index === 0 }]">
					<text class="product-name">{{ item.name || item.productName || '-' }}</text>
					<text class="product-quantity">订货数量：{{ item.orderQuantity || 0 }}{{ item.unit ? ` ${item.unit}` : '' }}</text>
				</view>
			</view>

			<view class="section-head">
				<view class="section-title"><view class="title-mark"></view><text>打包明细</text></view>
				<text class="group-count">共 {{ packs.length }} 组</text>
			</view>

			<view class="pack-card" v-for="(item,index) in packs" :key="item.key">
				<view class="card-head">
					<text class="card-title">第 {{ index + 1 }} 组</text>
					<view
						class="remove"
						:class="{ disabled: packs.length <= 1 }"
						@click="removePack(index)"
					>×</view>
				</view>
				<view class="field-row">
					<view class="field">
						<text class="field-label">包数</text>
						<view class="input-wrap">
							<input v-model="item.packets" type="number" class="input" placeholder="请输入" placeholder-class="placeholder" />
							<text class="input-unit">包</text>
						</view>
					</view>
					<view class="field">
						<text class="field-label">每包数量</text>
						<view class="input-wrap">
							<input v-model="item.quantity" type="number" class="input" placeholder="请输入" placeholder-class="placeholder" />
						</view>
					</view>
				</view>
			</view>

			<view v-if="isPackQuantityExceeded" class="quantity-warning">注意填写的打包数量超过了订货数量</view>
			<button class="add-btn" @click="addPack"><text class="add-icon">+</text><text>新增一组</text></button>
		</view>

		<view class="bottom-bar">
			<button class="save-btn" :disabled="submitting" @click="submit">保存</button>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const orderId = ref('')
const packs = ref([])
const submitting = ref(false)
const productInfo = ref([])

const productList = computed(() => {
	if (Array.isArray(productInfo.value)) return productInfo.value
	if (Array.isArray(productInfo.value?.records)) return productInfo.value.records
	if (Array.isArray(productInfo.value?.productList)) return productInfo.value.productList
	return productInfo.value && typeof productInfo.value === 'object' ? [productInfo.value] : []
})

const totalPackQuantity = computed(() => packs.value.reduce((total, item) => {
	const packets = Number(item.packets)
	const quantity = Number(item.quantity)
	return total + (Number.isFinite(packets) && Number.isFinite(quantity) ? packets * quantity : 0)
}, 0))

const totalOrderQuantity = computed(() => productList.value.reduce((total, item) => {
	const quantity = Number(item.orderQuantity)
	return total + (Number.isFinite(quantity) ? quantity : 0)
}, 0))

const isPackQuantityExceeded = computed(() => totalOrderQuantity.value > 0 && totalPackQuantity.value > totalOrderQuantity.value)

const createPack = item => ({
	key: `${Date.now()}-${Math.random()}`,
	packets: item?.packets ?? '',
	quantity: item?.quantity ?? ''
})

const ensurePack = () => {
	if (!packs.value.length) packs.value = [createPack()]
}

const loadPackInfo = async () => {
	if (!orderId.value) {
		ensurePack()
		return
	}
	try {
		const data = await uni.$api.packInfo({ id: orderId.value })
		packs.value = Array.isArray(data) ? data.map(createPack) : []
	} catch (e) {
		packs.value = []
	} finally {
		ensurePack()
	}
}

const loadProductInfo = async () => {
	if (!orderId.value) {
		productInfo.value = []
		return
	}
	try {
		productInfo.value = await uni.$api.productInfo({ id: orderId.value })
	} catch (e) {
		productInfo.value = []
	}
}

const addPack = () => {
	packs.value.push(createPack())
}

const removePack = index => {
	if (packs.value.length <= 1) return
	packs.value.splice(index, 1)
}

const normalizePacks = () => packs.value
	.map(item => ({
		packets: Number(item.packets),
		quantity: Number(item.quantity)
	}))
	.filter(item => Number.isFinite(item.packets) && Number.isFinite(item.quantity) && item.packets > 0 && item.quantity > 0)

const submit = async () => {
	if (!orderId.value) {
		uni.showToast({ title: '缺少订单信息', icon: 'none' })
		return
	}
	const validPacks = normalizePacks()
	if (!validPacks.length) {
		uni.showToast({ title: '请输入打包信息', icon: 'none' })
		return
	}
	if (submitting.value) return
	submitting.value = true
	try {
		await uni.$api.pack({
			id: orderId.value,
			packs: validPacks
		})
		uni.showToast({ title: '已保存', icon: 'none' })
		setTimeout(goBack, 600)
	} catch (e) {
		uni.showToast({ title: e?.message || '保存失败', icon: 'none' })
	} finally {
		submitting.value = false
	}
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
		setTimeout(() => {
			if (typeof window !== 'undefined' && window.location.hash.includes('/pages/pack/index')) {
				goIndex()
			}
		}, 300)
		return
	}
	goIndex()
}

onLoad(options => {
	orderId.value = options.orderId || options.id || ''
	loadProductInfo()
	loadPackInfo()
})
</script>

<style lang="scss" scoped>
.pack-page{
	min-height: 100vh;
	padding-bottom: 184rpx;
	background: #f5f7fa;
	color: #252a34;
}
.nav-wrap{
	background: #fff;
	border-bottom: 1rpx solid #eeeeee;
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
		color: #30343b;
	}
}
.content{
	padding: 36rpx 28rpx 20rpx;
}
.product-summary{
	margin-bottom: 28rpx;
	padding: 24rpx 26rpx;
	border: 1rpx solid #e6edf8;
	border-radius: 12rpx;
	background: #fff;
	box-shadow: 0 6rpx 22rpx rgba(31, 50, 75, .04);
}
.product-summary-title{
	margin-bottom: 14rpx;
	color: #68717e;
	font-size: 24rpx;
}
.product-item{
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	padding-top: 14rpx;
	border-top: 1rpx solid #f0f2f5;
}
.product-item.first{
	padding-top: 0;
	border-top: 0;
}
.product-name{
	min-width: 0;
	flex: 1;
	overflow: hidden;
	color: #29303b;
	font-size: 29rpx;
	font-weight: 600;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.product-quantity{
	flex: 0 0 auto;
	color: #677180;
	font-size: 24rpx;
}
.section-head{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}
.section-title{
	display: flex;
	align-items: center;
	font-size: 32rpx;
	font-weight: 600;
	color: #252a34;
}
.title-mark{
	width: 8rpx;
	height: 32rpx;
	margin-right: 14rpx;
	border-radius: 4rpx;
	background: #2782f8;
}
.group-count{
	color: #8b929e;
	font-size: 24rpx;
}
.pack-card{
	margin-bottom: 22rpx;
	padding: 28rpx;
	border: 1rpx solid #edf0f4;
	border-radius: 12rpx;
	background: #fff;
	box-shadow: 0 6rpx 22rpx rgba(31, 50, 75, .05);
}
.card-head{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}
.card-title{
	font-size: 28rpx;
	font-weight: 600;
	color: #303641;
}
.remove{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: #fff1f2;
	color: #ed5965;
	font-size: 36rpx;
	font-weight: 300;
	line-height: 1;
}
.remove.disabled{
	background: #f3f4f6;
	color: #c7cbd1;
}
.field-row{
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	gap: 20rpx;
}
.field{
	min-width: 0;
}
.field-label{
	display: block;
	margin-bottom: 12rpx;
	color: #626a76;
	font-size: 25rpx;
}
.input-wrap{
	display: flex;
	align-items: center;
	height: 76rpx;
	padding: 0 22rpx;
	border: 1rpx solid #dfe4eb;
	border-radius: 8rpx;
	background: #f8fafc;
	box-sizing: border-box;
}
.input{
	min-width: 0;
	height: 74rpx;
	flex: 1;
	color: #252a34;
	font-size: 28rpx;
	line-height: 74rpx;
}
.placeholder{
	color: #b6bcc6;
}
.input-unit{
	margin-left: 8rpx;
	color: #858d99;
	font-size: 24rpx;
}
.add-btn{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 82rpx;
	margin-top: 8rpx;
	border: 2rpx dashed #8ebcf8;
	border-radius: 10rpx;
	background: #f1f7ff;
	color: #2782f8;
	font-size: 28rpx;
	line-height: 78rpx;
	&::after{ border: 0; }
}
.quantity-warning{
	margin: 4rpx 0 18rpx;
	color: #ef5965;
	font-size: 24rpx;
	line-height: 34rpx;
}
.add-icon{
	margin-right: 10rpx;
	font-size: 36rpx;
	font-weight: 300;
}
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 0;
	width: 100%;
	max-width: 390px;
	padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
	transform: translateX(-50%);
	box-sizing: border-box;
	border-top: 1rpx solid #edf0f4;
	background: rgba(255, 255, 255, .96);
}
.save-btn{
	width: 100%;
	height: 88rpx;
	border: 0;
	border-radius: 8rpx;
	background: #2782f8;
	color: #fff;
	font-size: 30rpx;
	font-weight: 500;
	line-height: 88rpx;
	box-shadow: 0 8rpx 20rpx rgba(39, 130, 248, .22);
	&::after{ border: 0; }
	&[disabled]{
		background: #a9c9f2;
		box-shadow: none;
	}
}
</style>
