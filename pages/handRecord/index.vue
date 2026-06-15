<template>
	<view class="hand-page">
		<view class="nav-wrap">

			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack" @touchend.stop.prevent="goBack">‹</view>
				<text>添加手工记录</text>

			</view>
		</view>

		<view class="form">
			<view class="form-row">
				<text class="label required">产品名称</text>
				<input v-model="form.name" class="input" placeholder="请输入" placeholder-class="placeholder" />
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
			<button class="confirm-btn" @click="submit">确认添加</button>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'

const orderId = ref('')
const images = ref([])
const maxImages = 1
const form = reactive({
	name: '',
	num: '',
	remark: '',
	imgRemark: ''
})

const imageSlots = computed(() => Math.max(0, maxImages - images.value.length - (images.value.length < maxImages ? 1 : 0)))

const chooseImage = () => {
	uni.chooseImage({
		count: maxImages - images.value.length,
		sizeType: ['compressed'],
		success: res => {
			const paths = res.tempFilePaths || []
			images.value = images.value.concat(paths).slice(0, maxImages)
		}
	})
}

const removeImage = index => {
	images.value.splice(index, 1)
}

const getUploadFileId = result => {
	if (typeof result === 'string' || typeof result === 'number') return String(result)
	return result?.fileId || result?.id || result?.fileID || result?.file?.id || ''
}

const uploadImage = async () => {
	if (!images.value.length) return ''
	const result = await uni.$api.uploadFile(images.value[0])
	return getUploadFileId(result)
}

const submit = async () => {
	if (!form.name) {
		uni.showToast({ title: '请输入产品名称', icon: 'none' })
		return
	}
	if (!form.num) {
		uni.showToast({ title: '请输入数量', icon: 'none' })
		return
	}
	try {
		const fileId = await uploadImage()
		await uni.$api.handKeptAdd({
			name: form.name,
			orderId: orderId.value,
			num: Number(form.num),
			remark: form.remark,
			imgRemark: fileId || form.imgRemark,
			fileId
		})
		uni.showToast({ title: '已添加', icon: 'none' })
		setTimeout(() => {
			goBack()
		}, 600)
	} catch (e) {}
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
			if (typeof window !== 'undefined' && window.location.hash.includes('/pages/handRecord/index')) {
				goIndex()
			}
		}, 300)
		return
	}
	goIndex()
}

onLoad(options => {
	orderId.value = options.orderId || options.id || ''
})
</script>

<style lang="scss" scoped>
.hand-page{
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
	padding: 0 32rpx 40rpx;
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
.input{
	flex: 1;
	height: 100%;
	text-align: right;
	color: #333;
	font-size: 28rpx;
}
.placeholder{
	color: #c9c9c9;
}
.field-block{
	padding-top: 38rpx;
	border-bottom: 1rpx solid #eeeeee;
}
.remark{
	width: 100%;
	height: 112rpx;
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
.image-item,
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
.image-item{
	position: relative;
	overflow: hidden;
	background: #f2f2f2;
	image{
		width: 100%;
		height: 100%;
		display: block;
	}
}
.remove-image{
	position: absolute;
	right: 0;
	top: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36rpx;
	height: 36rpx;
	border-bottom-left-radius: 8rpx;
	background: rgba(0, 0, 0, .55);
	color: #fff;
	font-size: 28rpx;
	line-height: 1;
}
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 34rpx;
	width: 100%;
	max-width: 390px;
	padding: 0 32rpx;
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
</style>
