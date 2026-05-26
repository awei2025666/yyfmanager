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
	'未登录'
))
const userPhone = computed(() => userInfo.value.phone || userInfo.value.mobile || userInfo.value.tel || '-')

const getSelfInfo = async () => {
	try {
		userInfo.value = await uni.$api.selfInfo()
	} catch (e) {}
}

const logout = () => {
	uni.removeStorageSync('Authorization')
	uni.removeStorageSync('token')
	uni.showToast({
		title: '已退出登录',
		icon: 'none'
	})
	setTimeout(() => {
		uni.reLaunch({ url: '/pages/login/index' })
	}, 300)
}

onMounted(getSelfInfo)
</script>

<template>
	<view class="mine">
		<view class="top">
	
			<view class="nav">
				<view></view>
				<text>我的</text>
		
		
			</view>
			<view class="profile">
				<view class="avatar">
					<u-avatar size="large"></u-avatar>
				</view>
				<view class="user">
					<view class="nick">{{ userName }}</view>
					<view class="phone">{{ userPhone }}</view>
				</view>
			</view>
		</view>
		<view class="panel">
			<view class="section">
				<view class="left">
					<view class="icon-wrap blue"><u-icon name="account-fill" color="#1f7cff" size="36"></u-icon></view>
					<view class="title">个人信息</view>
				</view>
				<u-icon name="arrow-right" color="#b8b8b8" size="30"></u-icon>
			</view>

			<view class="section">
				<view class="left">
					<view class="icon-wrap green"><u-icon name="edit-pen-fill" color="#18b77a" size="36"></u-icon></view>
					<view class="title">修改密码</view>
				</view>
				<u-icon name="arrow-right" color="#b8b8b8" size="30"></u-icon>
			</view>

			<view class="section" @click="logout">
				<view class="left">
					<view class="icon-wrap red"><u-icon name="person-delete-fill" color="#ff4d4f" size="36"></u-icon></view>
					<view class="title">退出登录</view>
				</view>
				<u-icon name="arrow-right" color="#b8b8b8" size="30"></u-icon>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
.mine{
	min-height: 100vh;
	background: #f7f7f7;
	.section{
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 112rpx;
		background: #fff;
		border-bottom: 1rpx solid #f2f2f2;
		.left{
			display: flex;
			justify-content: start;
			align-items: center;
			gap: 20rpx;
			font-size: 29rpx;
			color: #252525;
			.icon-wrap{
				display: flex;
				align-items: center;
				justify-content: center;
				width: 58rpx;
				height: 58rpx;
				border-radius: 50%;
				&.blue{ background: #edf5ff; }
				&.green{ background: #eaf8f2; }
				&.red{ background: #fff1f0; }
			}
		}
	}
	.top{
		background: #00b9ff;
		padding: 34rpx 40rpx 110rpx;
		.fake-status{
			display: flex;
			justify-content: space-between;
			align-items: center;
			color: #fff;
			font-size: 30rpx;
			font-weight: 600;
			.status-icons{
				display: flex;
				align-items: center;
				gap: 8rpx;
				.signal{
					width: 30rpx;
					height: 22rpx;
					border-radius: 3rpx;
					background: #fff;
				}
				.wifi{
					width: 26rpx;
					height: 18rpx;
					border-top: 6rpx solid #fff;
					border-radius: 50%;
				}
				.battery{
					width: 42rpx;
					height: 20rpx;
					border: 3rpx solid #fff;
					border-radius: 5rpx;
				}
			}
		}
		.nav{
			display: grid;
			grid-template-columns: 1fr auto 1fr;
			align-items: center;
			margin-top: 44rpx;
			color: #fff;
			font-size: 34rpx;
			font-weight: 600;
			.capsule{
				justify-self: end;
				display: flex;
				align-items: center;
				justify-content: center;
				width: 174rpx;
				height: 64rpx;
				border-radius: 64rpx;
				background: rgba(255,255,255,.18);
				font-size: 32rpx;
				.divider{
					width: 1rpx;
					height: 36rpx;
					margin: 0 24rpx;
					background: rgba(255,255,255,.24);
				}
				.circle{
					width: 34rpx;
					height: 34rpx;
					border-radius: 50%;
					border: 7rpx solid #fff;
				}
			}
		}
		.profile{
			display: flex;
			align-items: center;
			gap: 24rpx;
			margin-top: 50rpx;
		}
		.user{
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: start;
			gap: 10rpx;
			color: #fff;
			.nick{
				font-size: 34rpx;
				font-weight: 400;
			}
			.phone{
				font-size: 25rpx;
			}
		}
	}
	.panel{
		margin: -62rpx 30rpx 0;
		padding: 0 28rpx;
		overflow: hidden;
		border-radius: 18rpx;
		background: #fff;
	}
}
</style>
