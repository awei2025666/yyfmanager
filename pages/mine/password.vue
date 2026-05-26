<template>
	<view class="sub-page">
		<view class="nav-wrap">
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack">‹</view>
				<text>修改密码</text>
				<view></view>
			</view>
		</view>

		<view class="form">
			<view class="form-row">
				<text class="label">原密码</text>
				<input v-model="form.oldPassword" password placeholder="请输入原密码" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label">新密码</text>
				<input v-model="form.newPassword" password placeholder="请输入新密码" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label">确认密码</text>
				<input v-model="form.confirmPassword" password placeholder="请再次输入新密码" placeholder-class="placeholder" />
			</view>
		</view>

		<view class="bottom-bar">
			<button class="confirm-btn" :disabled="loading" @click="submit">{{ loading ? '提交中...' : '确认修改' }}</button>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'

const loading = ref(false)
const form = reactive({
	oldPassword: '',
	newPassword: '',
	confirmPassword: ''
})

const submit = async () => {
	if (!form.oldPassword) {
		uni.showToast({ title: '请输入原密码', icon: 'none' })
		return
	}
	if (!form.newPassword) {
		uni.showToast({ title: '请输入新密码', icon: 'none' })
		return
	}
	if (form.newPassword !== form.confirmPassword) {
		uni.showToast({ title: '两次密码不一致', icon: 'none' })
		return
	}
	if (loading.value) return
	loading.value = true
	try {
		await uni.$api.editPassword({
			oldPassword: form.oldPassword,
			password: form.oldPassword,
			newPassword: form.newPassword,
			confirmPassword: form.confirmPassword
		})
		uni.showToast({ title: '修改成功', icon: 'none' })
		setTimeout(() => {
			uni.removeStorageSync('Authorization')
			uni.removeStorageSync('token')
			uni.reLaunch({ url: '/pages/login/index' })
		}, 600)
	} catch (e) {
		uni.showToast({ title: e?.message || '修改失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}

const goBack = () => {
	uni.navigateBack()
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
.form{
	margin-top: 16rpx;
	padding: 0 30rpx;
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
	flex: 0 0 150rpx;
	color: #333;
	font-size: 29rpx;
}
input{
	flex: 1;
	height: 100%;
	text-align: right;
	color: #333;
	font-size: 28rpx;
}
.placeholder{ color: #c9c9c9; }
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 34rpx;
	width: 100%;
	max-width: 390px;
	padding: 0 30rpx;
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
	&::after{ border: 0; }
	&[disabled]{ opacity: .7; }
}
</style>
