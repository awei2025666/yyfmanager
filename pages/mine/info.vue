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
			<view class="avatar">头像</view>
			<view class="profile-main">
				<view class="name">{{ userName }}</view>
			</view>
		</view>

		<view class="info-list">
      <view class="info-row">
        <text>姓名</text>
        <text>{{ userInfo.realName || userInfo.name || '-' }}</text>
      </view>
			<view class="info-row">
				<text>姓名</text>
				<text>{{ userInfo.realName || userInfo.name || '-' }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const userInfo = ref({})
const userName = computed(() => (
	userInfo.value.name ||
	userInfo.value.nickname ||
	userInfo.value.nickName ||
	userInfo.value.userName ||
	userInfo.value.realName ||
	userInfo.value.account ||
	'-'
))
const loadInfo = async () => {
	try {
		userInfo.value = await uni.$api.selfInfo()
	} catch (e) {
		userInfo.value = {}
	}
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
}
.profile-main{ margin-left: 24rpx; }
.name{ font-size: 34rpx; line-height: 48rpx; }
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
