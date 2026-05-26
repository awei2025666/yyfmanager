<template>
	<view class="sub-page">
		<view class="nav-wrap">
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack">‹</view>
				<text>退出登录</text>
				<view></view>
			</view>
		</view>

		<view class="logout-card">
			<view class="logout-icon">↪</view>
			<view class="title">确认退出当前账号？</view>
			<view class="desc">退出后需要重新登录才能继续使用印刷ERP小程序。</view>
		</view>

		<view class="bottom-bar">
			<button class="cancel-btn" @click="goBack">取消</button>
			<button class="logout-btn" @click="confirmLogout">确认退出</button>
		</view>
	</view>
</template>

<script setup>
const confirmLogout = () => {
	uni.removeStorageSync('Authorization')
	uni.removeStorageSync('token')
	uni.showToast({ title: '已退出登录', icon: 'none' })
	setTimeout(() => {
		uni.reLaunch({ url: '/pages/login/index' })
	}, 300)
}

const goBack = () => {
	uni.switchTab({
		url: '/pages/mine/index',
		fail: () => uni.reLaunch({ url: '/pages/mine/index' })
	})
}
</script>

<style lang="scss" scoped>
.sub-page{
	min-height: 100vh;
	padding-bottom: 150rpx;
	background: #f7f7f7;
	color: #2d2d2d;
}
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
.logout-card{
	margin: 32rpx 30rpx 0;
	padding: 58rpx 34rpx;
	border-radius: 12rpx;
	background: #fff;
	text-align: center;
}
.logout-icon{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 96rpx;
	height: 96rpx;
	margin: 0 auto 26rpx;
	border-radius: 50%;
	background: #eaf2ff;
	color: #1f7cff;
	font-size: 58rpx;
	font-weight: 700;
}
.title{
	color: #222;
	font-size: 34rpx;
	font-weight: 600;
	line-height: 48rpx;
}
.desc{
	margin-top: 18rpx;
	color: #999;
	font-size: 27rpx;
	line-height: 40rpx;
}
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 34rpx;
	display: flex;
	gap: 20rpx;
	width: 100%;
	max-width: 390px;
	padding: 0 30rpx;
	box-sizing: border-box;
	transform: translateX(-50%);
}
button{
	flex: 1;
	height: 82rpx;
	border: 0;
	border-radius: 12rpx;
	font-size: 30rpx;
	line-height: 82rpx;
	&::after{ border: 0; }
}
.cancel-btn{
	background: #dedede;
	color: #666;
}
.logout-btn{
	background: #1f7cff;
	color: #fff;
}
</style>
