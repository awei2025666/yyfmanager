<template>
	<view class="mine-page">
		<view class="nav-wrap">
			<view class="nav-row">
				<view></view>
				<text>我的</text>
				<view></view>
			</view>
		</view>

		<view class="profile-band" @click="toPage('/pages/mine/info')">
			<view class="avatar">头像</view>
			<view class="profile-main">
				<view class="nickname">{{ userName }}</view>
			</view>
			<view class="profile-arrow">›</view>
		</view>

		<view class="menu-list">
			<view class="menu-item" @click="toPage('/pages/mine/info')">
				<view class="menu-left">
					<view class="menu-icon info-icon">
						<view class="icon-paper"></view>
						<view class="icon-pen"></view>
					</view>
					<text>个人信息</text>
				</view>
				<text class="arrow">›</text>
			</view>
			<view class="menu-item" @click="toPage('/pages/mine/password')">
				<view class="menu-left">
					<view class="menu-icon shield-icon">✓</view>
					<text>修改密码</text>
				</view>
				<text class="arrow">›</text>
			</view>
			<view class="menu-item" @click="toPage('/pages/mine/logout')">
				<view class="menu-left">
					<view class="menu-icon logout-icon">
						<view class="logout-door"></view>
						<view class="logout-arrow">›</view>
					</view>
					<text>退出登录</text>
				</view>
				<text class="arrow">›</text>
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
	'微信昵称'
))

const getSelfInfo = async () => {
	try {
		userInfo.value = await uni.$api.selfInfo()
	} catch (e) {
		userInfo.value = {}
	}
}

const toPage = url => {
	uni.navigateTo({ url })
}

onMounted(getSelfInfo)
</script>

<style lang="scss" scoped>
.mine-page{
	min-height: 100vh;
	background: #fff;
	color: #282828;
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
	font-weight: 500;
}
.profile-band{
	display: flex;
	align-items: center;
	height: 224rpx;
	padding: 0 56rpx 0 32rpx;
	background: #1f7cff;
	color: #fff;
	box-sizing: border-box;
}
.avatar{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 128rpx;
	height: 128rpx;
	border: 4rpx solid #fff;
	border-radius: 50%;
	background: #3500a8;
	color: #fff;
	font-size: 28rpx;
	box-sizing: border-box;
}
.profile-main{
	min-width: 0;
	flex: 1;
	margin-left: 26rpx;
}
.nickname{
	font-size: 34rpx;
	line-height: 48rpx;
	word-break: break-all;
}
.profile-arrow{
	margin-left: 20rpx;
	font-size: 68rpx;
	font-weight: 200;
	line-height: 1;
}
.menu-list{
	padding: 24rpx 32rpx 0;
	background: #fff;
}
.menu-item{
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 110rpx;
	border-bottom: 1rpx solid #eeeeee;
}
.menu-left{
	display: flex;
	align-items: center;
	gap: 18rpx;
	color: #4a4a4a;
	font-size: 31rpx;
	line-height: 44rpx;
}
.menu-icon{
	position: relative;
	flex: 0 0 auto;
	width: 42rpx;
	height: 42rpx;
	color: #1f7cff;
}
.info-icon{
	.icon-paper{
		position: absolute;
		left: 4rpx;
		top: 2rpx;
		width: 24rpx;
		height: 34rpx;
		border-left: 7rpx solid #1f7cff;
		border-top: 5rpx solid #1f7cff;
		border-bottom: 5rpx solid #1f7cff;
		box-sizing: border-box;
	}
	.icon-paper::before,
	.icon-paper::after{
		content: '';
		position: absolute;
		left: 8rpx;
		width: 18rpx;
		height: 4rpx;
		background: #1f7cff;
	}
	.icon-paper::before{ top: 8rpx; }
	.icon-paper::after{ top: 18rpx; }
	.icon-pen{
		position: absolute;
		right: 2rpx;
		bottom: 2rpx;
		width: 25rpx;
		height: 8rpx;
		border-radius: 8rpx;
		background: #1f7cff;
		transform: rotate(-45deg);
	}
}
.shield-icon{
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8rpx 8rpx 18rpx 18rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 30rpx;
	font-weight: 700;
}
.shield-icon::before{
	content: '';
	position: absolute;
	left: 0;
	top: -5rpx;
	width: 42rpx;
	height: 18rpx;
	border-radius: 50% 50% 0 0;
	background: #1f7cff;
}
.logout-icon{
	.logout-door{
		position: absolute;
		left: 2rpx;
		top: 4rpx;
		width: 27rpx;
		height: 34rpx;
		border-radius: 4rpx;
		background: #1f7cff;
	}
	.logout-door::before{
		content: '';
		position: absolute;
		right: -9rpx;
		top: 0;
		width: 10rpx;
		height: 8rpx;
		background: #fff;
	}
	.logout-arrow{
		position: absolute;
		right: 0;
		top: 7rpx;
		color: #1f7cff;
		font-size: 44rpx;
		font-weight: 700;
		line-height: 28rpx;
	}
}
.arrow{
	color: #222;
	font-size: 60rpx;
	font-weight: 200;
	line-height: 1;
}
</style>
