<template>
	<view class="sub-page">
		<view class="nav-wrap">
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack">‹</view>
				<text>个人信息</text>
				<view></view>
			</view>
		</view>

		<view class="profile-card">
			<view class="avatar" @click="chooseAvatar">
				<image v-if="avatarUrl" :src="avatarUrl" mode="aspectFill"></image>
				<text v-else>头像</text>
			</view>
			<view class="profile-main">
				<view class="name">{{ userName }}</view>
				<view class="dept">{{ deptName }}</view>
			</view>
		</view>

		<view class="info-list">
			<view class="info-row">
				<text>姓名</text>
				<text>{{ realName }}</text>
			</view>
			<view class="info-row">
				<text>电话</text>
				<text>{{ phone }}</text>
			</view>
			<view class="info-row">
				<text>职位</text>
				<text>{{ position }}</text>
			</view>
			<view class="info-row">
				<text>部门</text>
				<text>{{ deptName }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const userInfo = ref({})
const uploading = ref(false)
const userName = computed(() => (
	userInfo.value.name ||
	userInfo.value.nickname ||
	userInfo.value.nickName ||
	userInfo.value.userName ||
	userInfo.value.realName ||
	userInfo.value.account ||
	'-'
))
const avatarUrl = computed(() => userInfo.value.avatarUrl || userInfo.value.avatarURL || userInfo.value.headUrl || '')
const realName = computed(() => userInfo.value.realName || userInfo.value.name || userInfo.value.userName || '-')
const phone = computed(() => userInfo.value.phone || userInfo.value.mobile || userInfo.value.telephone || userInfo.value.tel || '-')
const position = computed(() => userInfo.value.position || userInfo.value.positionName || userInfo.value.postName || userInfo.value.jobName || userInfo.value.roleName || '-')
const deptName = computed(() => userInfo.value.deptName || userInfo.value.departmentName || userInfo.value.dept || '-')

const getUploadFileId = result => {
	if (typeof result === 'string') return result
	return result?.avatar || result?.fileId || result?.id || result?.fileID || result?.file?.id || ''
}

const loadInfo = async () => {
	try {
		userInfo.value = await uni.$api.selfInfo()
	} catch (e) {
		userInfo.value = {}
	}
}

const chooseAvatar = () => {
	if (uploading.value) return
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: async res => {
			const filePath = res.tempFilePaths?.[0]
			if (!filePath) return
			uploading.value = true
			try {
				const uploadResult = await uni.$api.uploadFile(filePath)
				const avatar = getUploadFileId(uploadResult)
				if (!avatar) {
					uni.showToast({ title: '上传失败', icon: 'none' })
					return
				}
				await uni.$api.editAvatar({ avatar })
				uni.showToast({ title: '修改成功', icon: 'none' })
				await loadInfo()
			} catch (e) {
				uni.showToast({ title: e?.message || '修改头像失败', icon: 'none' })
			} finally {
				uploading.value = false
			}
		}
	})
}

const goBack = () => {
	uni.switchTab({
		url: '/pages/mine/index',
		fail: () => uni.reLaunch({ url: '/pages/mine/index' })
	})
}

onMounted(loadInfo)
</script>

<style lang="scss" scoped>
.sub-page{ min-height: 100vh; background: #f7f7f7; color: #2d2d2d; }
.nav-wrap{ background: #fff; border-bottom: 1rpx solid #eeeeee; }
.nav-row{
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	height: 108rpx;
	padding: 0 24rpx;
	font-size: 34rpx;
	font-weight: 600;
	.back{ width: 72rpx; font-size: 66rpx; font-weight: 300; line-height: 1; }
}
.profile-card{
	display: flex;
	align-items: center;
	padding: 34rpx 32rpx;
	background: #1f7cff;
	color: #fff;
}
.avatar{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 118rpx;
	height: 118rpx;
	border: 4rpx solid #fff;
	border-radius: 50%;
	background: #3500a8;
	font-size: 28rpx;
	overflow: hidden;
	image{
		width: 100%;
		height: 100%;
	}
}
.profile-main{ margin-left: 24rpx; }
.name{ font-size: 34rpx; line-height: 48rpx; }
.dept{ margin-top: 8rpx; font-size: 26rpx; line-height: 36rpx; color: rgba(255,255,255,.82); }
.info-list{ margin-top: 16rpx; padding: 0 30rpx; background: #fff; }
.info-row{
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 104rpx;
	border-bottom: 1rpx solid #eeeeee;
	font-size: 29rpx;
	gap: 30rpx;
	text:first-child{ color: #999; }
	 
	text:last-child{ flex: 1; text-align: right; word-break: break-all; }
}
</style>
