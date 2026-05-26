<template>
	<view class="consumable-add-page">
		<view class="nav-wrap">
		
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack" @touchend.stop.prevent="goBack">‹</view>
				<text>添加耗材消耗</text>

			</view>
		</view>

		<view class="form">
			<view class="form-row" @click="openConsumablePicker">
				<text class="label required">耗材名称</text>
				<view class="right-value">
					<text :class="form.consumableName ? 'value' : 'placeholder'">{{ form.consumableName || '请选择' }}</text>
					<text class="arrow">›</text>
				</view>
			</view>
			<view class="form-row">
				<text class="label required">数量</text>
				<input v-model="form.num" type="number" class="input" placeholder="请输入" placeholder-class="placeholder" />
			</view>

			<view class="field-block">
				<text class="label">备注</text>
				<textarea v-model="form.remark" class="remark" placeholder="请输入" placeholder-class="placeholder" />
			</view>

			<view class="field-block image-block">
				<text class="label">图片备注</text>
				<view class="image-row">
					<view class="upload-box" @click="chooseImage">+</view>
					<view class="image-placeholder" v-for="item in imageSlots" :key="item"></view>
				</view>
			</view>
		</view>

		<view class="bottom-bar">
			<button class="confirm-btn" @click="submit">确认添加</button>
		</view>

		<view v-if="showPicker" class="picker-mask" @click="showPicker = false">
			<view class="picker-panel" @click.stop>
				<view class="picker-title">选择耗材</view>
				<view class="picker-item" v-for="item in consumableOptions" :key="item.id" @click="selectConsumable(item)">
					<text>{{ item.name }}</text>
					<text v-if="form.consumableId === item.id" class="check">✓</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const orderId = ref('')
const showPicker = ref(false)
const consumableOptions = ref([])
const images = ref([])
const form = ref({
	consumableId: '',
	consumableName: '',
	num: '',
	remark: ''
})

const imageSlots = computed(() => Math.max(0, 3 - images.value.length))

const openConsumablePicker = async () => {
	showPicker.value = true
	try {
		const data = await uni.$api.consumableAll({ name: '' })
		consumableOptions.value = Array.isArray(data) ? data : []
	} catch (e) {
		consumableOptions.value = []
	}
}

const selectConsumable = item => {
	form.value.consumableId = item.id
	form.value.consumableName = item.name
	showPicker.value = false
}

const chooseImage = () => {
	uni.chooseImage({
		count: 1,
		success: res => {
			const filePath = res.tempFilePaths?.[0]
			if (filePath) images.value.push(filePath)
		}
	})
}

const submit = async () => {
	if (!form.value.consumableId) {
		uni.showToast({ title: '请选择耗材', icon: 'none' })
		return
	}
	if (!form.value.num) {
		uni.showToast({ title: '请输入数量', icon: 'none' })
		return
	}
	try {
		await uni.$api.consumableAdd({
			orderId: orderId.value,
			consumableId: form.value.consumableId,
			num: Number(form.value.num),
			remark: form.value.remark,
			fileId: ''
		})
		uni.showToast({ title: '已添加', icon: 'none' })
		setTimeout(() => {
			goBack()
		}, 600)
	} catch (e) {}
}

const goProduction = () => {
	uni.redirectTo({
		url: `/pages/production/index?orderId=${orderId.value || ''}`,
		fail: () => {
			uni.reLaunch({ url: '/pages/production/index' })
		}
	})
}

const goBack = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		setTimeout(() => {
			if (typeof window !== 'undefined' && window.location.hash.includes('/pages/productionConsumableAdd/index')) {
				goProduction()
			}
		}, 300)
		return
	}
	goProduction()
}

onLoad(options => {
	orderId.value = options.orderId || ''
})
</script>

<style lang="scss" scoped>
.consumable-add-page{
	min-height: 100vh;
	padding-bottom: 150rpx;
	background: #f7f7f7;
	color: #2c2c2c;
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
.form{
	padding: 0 34rpx 40rpx;
	background: #fff;
}
.form-row{
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 108rpx;
	border-bottom: 1rpx solid #eeeeee;
}
.label{
	color: #333;
	font-size: 29rpx;
	line-height: 40rpx;
}
.required::before{
	content: '*';
}
.right-value{
	display: flex;
	align-items: center;
	gap: 16rpx;
}
.value{
	color: #333;
	font-size: 28rpx;
}
.placeholder{
	color: #c9c9c9;
}
.arrow{
	color: #333;
	font-size: 52rpx;
	font-weight: 300;
	line-height: 1;
}
.input{
	flex: 1;
	height: 100%;
	text-align: right;
	color: #333;
	font-size: 28rpx;
}
.field-block{
	padding-top: 38rpx;
	border-bottom: 1rpx solid #eeeeee;
}
.remark{
	width: 100%;
	height: 98rpx;
	margin-top: 24rpx;
	color: #333;
	font-size: 28rpx;
	line-height: 38rpx;
}
.image-block{
	border-bottom: 0;
}
.image-row{
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-top: 16rpx;
}
.upload-box,
.image-placeholder{
	width: 132rpx;
	height: 132rpx;
	border-radius: 8rpx;
}
.upload-box{
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f7f7f7;
	color: #222;
	font-size: 52rpx;
	font-weight: 300;
}
.image-placeholder{
	background: #d8d8d8;
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
.confirm-btn{
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
.picker-mask{
	position: fixed;
	left: 50%;
	top: 0;
	z-index: 20;
	width: 100%;
	max-width: 390px;
	height: 100vh;
	transform: translateX(-50%);
	background: rgba(0, 0, 0, .35);
}
.picker-panel{
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 28rpx 34rpx 60rpx;
	border-radius: 28rpx 28rpx 0 0;
	background: #fff;
}
.picker-title{
	margin-bottom: 16rpx;
	font-size: 32rpx;
	font-weight: 600;
}
.picker-item{
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 92rpx;
	border-bottom: 1rpx solid #eeeeee;
	color: #333;
	font-size: 29rpx;
}
.check{
	color: #1f7cff;
	font-size: 32rpx;
}
</style>
