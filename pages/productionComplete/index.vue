<template>
	<view class="complete-page">
		<view class="nav-wrap">
		
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack" @touchend.stop.prevent="goBack">‹</view>
				<text>完成生产</text>

			</view>
		</view>

		<view class="form-section">
			<view class="machine-row">
				<text class="label">机器类型</text>
				<view class="radio-group">
					<view class="radio-item" @click="form.machineType = 1">
						<view :class="['radio', form.machineType === 1 ? 'active' : '']"></view>
						<text>大机器</text>
					</view>
					<view class="radio-item" @click="form.machineType = 2">
						<view :class="['radio', form.machineType === 2 ? 'active' : '']"></view>
						<text>小机器</text>
					</view>
				</view>
			</view>
			<view class="divider-line"></view>

			<view class="field-block">
				<text class="label">备注</text>
				<textarea v-model="form.completeRemark" class="remark" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="divider-line"></view>

			<view class="field-block">
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

		<view class="gap"></view>

		<view class="partner-section">
			<view class="section-title">
				<view class="title-left"><view class="mark"></view><text>合作人员</text></view>
				<view class="add-icon" @click="openPartnerPopup">+</view>
			</view>
			<view class="partner-card" v-for="item in partners" :key="item.id">
				<view class="avatar"></view>
				<view class="partner-info">
					<view><text class="name">{{ item.name }}</text><text class="phone">{{ item.phone }}</text></view>
					<view class="num">合作数量： {{ item.num }}</view>
				</view>
				<view class="delete" @click="deletePartner(item.id)">删</view>
			</view>
		</view>

		<view class="bottom-bar">
			<button class="confirm-btn" @click="submit">确认完成</button>
		</view>

		<view v-if="showPartnerPopup" class="popup-mask" @click="closePartnerPopup">
			<view class="partner-popup" @click.stop>
				<view class="section-title popup-title">
					<view class="title-left"><view class="mark"></view><text>添加合作人员</text></view>
				</view>
				<view class="select-user-card" v-for="item in userOptions" :key="item.id" :class="{ selected: selectedUserId === item.id }" @click="selectUser(item)">
					<view class="user-main">
						<view class="avatar user-avatar"></view>
						<view>
							<view class="select-name">{{ item.name }}</view>
							<view v-if="selectedUserId !== item.id" class="select-phone">{{ item.phone }}</view>
						</view>
					</view>
					<view v-if="selectedUserId === item.id" class="check">✓</view>
					<input
						v-if="selectedUserId === item.id"
						v-model="selectedNum"
						class="num-input"
						type="number"
						placeholder="请输入合作数量"
						placeholder-class="placeholder"
						@click.stop
					/>
				</view>
				<button class="popup-confirm" @click="confirmPartner">确认添加</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const craftId = ref('')
const orderId = ref('')
const form = ref({
	machineType: 1,
	completeRemark: '',
	completeImgRemark: ''
})
const images = ref([])
const maxImages = 1
const partners = ref([])
const showPartnerPopup = ref(false)
const userOptions = ref([])
const selectedUserId = ref('')
const selectedNum = ref('')

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

const openPartnerPopup = async () => {
	showPartnerPopup.value = true
	selectedUserId.value = ''
	selectedNum.value = ''
	try {
		const users = await uni.$api.productionUserList()
		userOptions.value = Array.isArray(users) ? users : []
	} catch (e) {
		userOptions.value = []
	}
}

const closePartnerPopup = () => {
	showPartnerPopup.value = false
}

const selectUser = item => {
	selectedUserId.value = item.id
	selectedNum.value = ''
}

const confirmPartner = () => {
	const user = userOptions.value.find(item => item.id === selectedUserId.value)
	if (!user) {
		uni.showToast({ title: '请选择合作人员', icon: 'none' })
		return
	}
	const num = Number(selectedNum.value)
	if (!num) {
		uni.showToast({ title: '请输入合作数量', icon: 'none' })
		return
	}
	const exists = partners.value.find(item => item.id === user.id)
	if (exists) {
		exists.num = num
	} else {
		partners.value.push({ ...user, num })
	}
	closePartnerPopup()
}

const deletePartner = id => {
	partners.value = partners.value.filter(item => item.id !== id)
}

const submit = async () => {
	try {
		const fileId = await uploadImage()
		await uni.$api.completeProduction({
			id: craftId.value,
			orderId: orderId.value,
			machineType: form.value.machineType,
			completeRemark: form.value.completeRemark,
			completeImgRemark: fileId || form.value.completeImgRemark,
			fileId,
			userList: partners.value.map(item => ({ id: item.id, num: item.num }))
		})
		uni.showToast({ title: '已完成', icon: 'none' })
		setTimeout(() => {
			returnAfterComplete()
		}, 700)
	} catch (e) {
		uni.showToast({ title: e?.message || '完成生产失败', icon: 'none' })
	}
}

const goProduction = () => {
	const url = `/pages/production/index${orderId.value ? `?orderId=${orderId.value}` : ''}`
	uni.redirectTo({
		url,
		fail: () => {
			uni.reLaunch({ url })
		}
	})
}

const returnAfterComplete = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack({
			delta: 1,
			fail: goProduction
		})
		return
	}
	goProduction()
}

const goBack = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		setTimeout(() => {
			if (typeof window !== 'undefined' && window.location.hash.includes('/pages/productionComplete/index')) {
				goProduction()
			}
		}, 300)
		return
	}
	goProduction()
}

onLoad(options => {
	craftId.value = options.id || ''
	orderId.value = options.orderId || ''
})
</script>

<style lang="scss" scoped>
.complete-page{
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
.form-section,
.partner-section{
	background: #fff;
	padding: 32rpx 34rpx 38rpx;
}
.machine-row{
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 76rpx;
}
.label{
	color: #333;
	font-size: 30rpx;
	line-height: 42rpx;
}
.radio-group{
	display: flex;
	align-items: center;
	gap: 34rpx;
}
.radio-item{
	display: flex;
	align-items: center;
	gap: 10rpx;
	color: #333;
	font-size: 30rpx;
}
.radio{
	position: relative;
	width: 32rpx;
	height: 32rpx;
	border: 3rpx solid #e6e6e6;
	border-radius: 50%;
	box-sizing: border-box;
}
.radio.active{
	border-color: #1f7cff;
}
.radio.active::after{
	content: '';
	position: absolute;
	left: 6rpx;
	top: 6rpx;
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	background: #1f7cff;
}
.divider-line{
	height: 1rpx;
	margin: 28rpx 0 34rpx;
	background: #eeeeee;
}
.field-block{
	display: flex;
	flex-direction: column;
}
.remark{
	width: 100%;
	height: 86rpx;
	margin-top: 22rpx;
	color: #333;
	font-size: 28rpx;
	line-height: 38rpx;
}
.placeholder{
	color: #c9c9c9;
}
.image-row{
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-top: 14rpx;
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
.gap{
	height: 16rpx;
	background: #f7f7f7;
}
.section-title{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}
.title-left{
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 34rpx;
	line-height: 48rpx;
}
.mark{
	width: 8rpx;
	height: 30rpx;
	border-radius: 8rpx;
	background: #1f7cff;
}
.add-icon{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	background: #1f7cff;
	color: #fff;
	font-size: 28rpx;
	line-height: 28rpx;
}
.partner-card{
	position: relative;
	display: flex;
	align-items: flex-start;
	min-height: 96rpx;
	margin-top: 16rpx;
	padding: 24rpx 64rpx 22rpx 24rpx;
	border-radius: 12rpx;
	background: #f7f7f7;
}
.avatar{
	width: 42rpx;
	height: 42rpx;
	margin-top: 6rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6d89b8, #f3c0c5);
}
.partner-info{
	flex: 1;
	margin-left: 12rpx;
}
.name{
	color: #333;
	font-size: 29rpx;
}
.phone,
.num{
	color: #a4a4a4;
	font-size: 28rpx;
}
.phone{
	margin-left: 10rpx;
}
.num{
	margin-top: 12rpx;
}
.delete{
	position: absolute;
	right: 24rpx;
	top: 28rpx;
	color: #ff3347;
	font-size: 26rpx;
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
.popup-mask{
	position: fixed;
	left: 50%;
	top: 0;
	z-index: 30;
	width: 100%;
	max-width: 390px;
	height: 100vh;
	transform: translateX(-50%);
	background: rgba(0, 0, 0, .38);
}
.partner-popup{
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	max-height: 86vh;
	padding: 34rpx 34rpx 100rpx;
	border-radius: 28rpx 28rpx 0 0;
	background: #fff;
	box-sizing: border-box;
	overflow-y: auto;
}
.popup-title{
	margin-bottom: 26rpx;
}
.select-user-card{
	position: relative;
	min-height: 92rpx;
	margin-top: 16rpx;
	padding: 24rpx;
	border: 2rpx solid transparent;
	border-radius: 14rpx;
	background: #f7f7f7;
	box-sizing: border-box;
}
.select-user-card.selected{
	background: #e7f1ff;
	border-color: #1f7cff;
}
.user-main{
	display: flex;
	align-items: center;
}
.user-avatar{
	flex: 0 0 auto;
	margin-right: 16rpx;
}
.select-name{
	color: #333;
	font-size: 30rpx;
	line-height: 42rpx;
}
.select-phone{
	margin-top: 10rpx;
	color: #9a9a9a;
	font-size: 28rpx;
	line-height: 38rpx;
}
.check{
	position: absolute;
	right: 28rpx;
	top: 28rpx;
	color: #1f7cff;
	font-size: 36rpx;
	line-height: 1;
}
.num-input{
	width: 100%;
	height: 64rpx;
	margin-top: 20rpx;
	padding: 0 24rpx;
	border-radius: 8rpx;
	background: #fff;
	color: #333;
	font-size: 28rpx;
	box-sizing: border-box;
}
.popup-confirm{
	width: 100%;
	height: 78rpx;
	margin-top: 48rpx;
	border: 0;
	border-radius: 12rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 30rpx;
	line-height: 78rpx;
	&::after{ border: 0; }
}
</style>
