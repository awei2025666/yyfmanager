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
			<view class="field-block users-block">
				<text class="label required">人员及数量</text>
				<view class="user-row" v-for="(item,index) in userRows" :key="index">
					<input v-model="item.keyword" class="user-input" placeholder="搜索人员" placeholder-class="placeholder" @input="searchUsers(index)" />
					<input v-model="item.num" type="number" class="user-num" placeholder="数量" placeholder-class="placeholder" />
					<text v-if="userRows.length > 1" class="user-remove" @click="removeUser(index)">×</text>
					<view v-if="item.options.length" class="user-options"><view v-for="user in item.options" :key="user.id" class="user-option" @click="selectUser(index,user)">{{ user.name || user.realName }}</view></view>
				</view>
				<view class="add-user" @click="addUser">+ 添加人员</view>
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
	remark: '',
	imgRemark: ''
})
const userRows = ref([{ keyword: '', id: '', num: '', options: [] }])
const allUsers = ref([])
const usersLoading = ref(false)
const addUser = () => userRows.value.push({ keyword: '', id: '', num: '', options: [] })
const removeUser = index => userRows.value.splice(index, 1)
const normalizeUser = user => ({ ...user, id: user.id || user.tenantUserId || user.userId, name: user.name || user.realName || user.userName || user.nickname || '' })
const loadUsers = async () => {
	if (usersLoading.value || allUsers.value.length) return
	usersLoading.value = true
	try {
		const result = await uni.$api.byDeptUser({ name: '' })
		const list = result?.records || result?.data?.records || result?.data || result || []
		const seen = new Set()
		allUsers.value = (Array.isArray(list) ? list : []).map(normalizeUser).filter(user => {
			const key = String(user.id || user.name)
			if (!user.name || seen.has(key)) return false
			seen.add(key)
			return true
		})
		userRows.value.forEach((_, index) => searchUsers(index))
	} catch (e) { allUsers.value = [] } finally { usersLoading.value = false }
}
const searchUsers = index => {
	const row = userRows.value[index]
	row.id = ''
	const keyword = row.keyword.trim().toLowerCase()
	row.options = allUsers.value.filter(user => !keyword || user.name.toLowerCase().includes(keyword)).slice(0, 20)
}
const selectUser = (index, user) => { const row=userRows.value[index]; row.id=user.id || user.tenantUserId; row.keyword=user.name || user.realName || ''; row.options=[] }

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
	const userMap = new Map()
	userRows.value.filter(item => item.id && item.num).forEach(item => userMap.set(String(item.id), { tenantUserId: item.id, num: Number(item.num) }))
	const userList = [...userMap.values()]
	if (!userList.length) {
		uni.showToast({ title: '请添加人员和数量', icon: 'none' })
		return
	}
	try {
		const fileId = await uploadImage()
		await uni.$api.handKeptAdd({
			name: form.name,
			orderId: orderId.value,
			userList,
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
	loadUsers()
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
.users-block{padding:30rpx 0 24rpx}
.user-row{position:relative;display:flex;align-items:center;gap:12rpx;margin-top:18rpx;padding:14rpx 16rpx;border:1rpx solid #edf0f5;border-radius:12rpx;background:#fafbfc}
.user-input{flex:1;min-width:0;height:64rpx;padding:0 14rpx;border-radius:8rpx;background:#fff;color:#333;font-size:27rpx}
.user-num{width:120rpx;height:64rpx;padding:0 12rpx;border-radius:8rpx;background:#fff;color:#333;font-size:27rpx;text-align:center}
.user-remove{width:42rpx;height:42rpx;color:#aab2bd;font-size:38rpx;line-height:38rpx;text-align:center}
.user-options{position:absolute;left:16rpx;right:170rpx;top:84rpx;z-index:10;max-height:240rpx;overflow-y:auto;border:1rpx solid #e5eaf1;border-radius:10rpx;background:#fff;box-shadow:0 8rpx 24rpx rgba(30,50,80,.12)}
.user-option{padding:18rpx 20rpx;border-bottom:1rpx solid #f0f2f5;color:#333;font-size:27rpx}
.add-user{margin-top:18rpx;padding:16rpx 0;color:#287df5;font-size:27rpx;text-align:center}
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
