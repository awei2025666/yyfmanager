<template>
	<view class="delivery-complete-page">
		<view class="nav-wrap">
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack">‹</view>
				<text>完成配送</text>
			</view>
		</view>

		<view class="form-section">
			<view class="field-block">
				<text class="label">备注</text>
				<textarea v-model="remark" class="remark" placeholder="请输入" placeholder-class="placeholder" />
			</view>

			<view class="field-block image-block">
				<text class="label">图片备注</text>
				<view class="image-row">
					<view v-if="images.length < maxImages" class="upload-box" @click="chooseImage">+</view>
					<view class="image-item" v-for="(item,index) in images" :key="item">
						<image :src="item" mode="aspectFill"></image>
						<view class="remove-image" @click.stop="removeImage(index)">×</view>
					</view>
					<view class="image-placeholder" v-for="item in imageSlots" :key="item"></view>
				</view>
			</view>
		</view>

		<view class="bottom-bar">
			<button class="confirm-btn" :disabled="submitting" @click="submit">{{ submitting ? '提交中...' : '确认完成' }}</button>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const deliveryId = ref('')
const remark = ref('')
const images = ref([])
const submitting = ref(false)
const maxImages = 1

const imageSlots = computed(() => Math.max(0, maxImages - images.value.length - (images.value.length < maxImages ? 1 : 0)))

const chooseImage = () => {
	uni.chooseImage({
		count: maxImages - images.value.length,
		success: res => {
			const paths = res.tempFilePaths || []
			images.value = images.value.concat(paths).slice(0, maxImages)
		}
	})
}

const removeImage = index => {
	images.value.splice(index, 1)
}

const uploadImages = async () => {
	if (!images.value.length) return ''
	const urls = []
	for (const filePath of images.value) {
		try {
			const result = await uni.$api.uploadFile(filePath)
			urls.push(typeof result === 'string' ? result : (result?.url || result?.fileUrl || result?.path || ''))
		} catch (e) {}
	}
	return urls.filter(Boolean).join(',')
}

const submit = async () => {
	if (!deliveryId.value || submitting.value) return
	submitting.value = true
	try {
		const imgRemark = await uploadImages()
		await uni.$api.completeDelivery({
			id: deliveryId.value,
			remark: remark.value,
			img: imgRemark,
			completeRemark: remark.value,
			completeImgRemark: imgRemark
		})
		uni.showToast({ title: '已完成', icon: 'none' })
		setTimeout(() => {
			goBack()
		}, 600)
	} catch (e) {
		uni.showToast({ title: e?.message || '完成配送失败', icon: 'none' })
	} finally {
		submitting.value = false
	}
}

const goTransit = () => {
	uni.redirectTo({
		url: '/pages/deliveryTransit/index',
		fail: () => {
			uni.reLaunch({ url: '/pages/deliveryTransit/index' })
		}
	})
}

const goBack = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		setTimeout(() => {
			if (typeof window !== 'undefined' && window.location.hash.includes('/pages/deliveryComplete/index')) {
				goTransit()
			}
		}, 300)
		return
	}
	goTransit()
}

onLoad(options => {
	deliveryId.value = options.id || ''
})
</script>

<style lang="scss" scoped>
.delivery-complete-page{
	min-height: 100vh;
	padding-bottom: 150rpx;
	background: #f7f7f7;
	color: #2d2d2d;
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
	}
}
.form-section{
	padding: 32rpx 30rpx 34rpx;
	background: #fff;
}
.field-block{
	margin-bottom: 46rpx;
}
.label{
	display: block;
	color: #333;
	font-size: 29rpx;
	line-height: 42rpx;
}
.remark{
	width: 100%;
	height: 96rpx;
	margin-top: 12rpx;
	color: #333;
	font-size: 28rpx;
	line-height: 40rpx;
}
.placeholder{
	color: #c9c9c9;
}
.image-block{
	margin-bottom: 0;
}
.image-row{
	display: flex;
	align-items: center;
	gap: 14rpx;
	margin-top: 18rpx;
}
.upload-box,
.image-placeholder,
.image-item{
	width: 108rpx;
	height: 108rpx;
	border-radius: 8rpx;
}
.upload-box{
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f7f7f7;
	color: #222;
	font-size: 42rpx;
	font-weight: 300;
}
.image-placeholder{
	background: #d8d8d8;
}
.image-item{
	position: relative;
	background: #d8d8d8;
	overflow: hidden;
	image{
		width: 100%;
		height: 100%;
	}
}
.remove-image{
	position: absolute;
	right: 4rpx;
	top: 4rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 30rpx;
	height: 30rpx;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.55);
	color: #fff;
	font-size: 26rpx;
	line-height: 30rpx;
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
	&::after{
		border: 0;
	}
	&[disabled]{
		opacity: .7;
	}
}
</style>
