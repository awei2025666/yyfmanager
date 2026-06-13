<template>
	<view class="login-page">


		<view class="login-head">
			<view class="brand-mark">
				<u-icon name="order" color="#ffffff" size="54"></u-icon>
			</view>
			<view class="title">印刷ERP</view>
			<view class="subtitle">账号登录</view>
		</view>

		<view class="form-panel">
			<view class="field">
				<u-icon name="account" color="#1f7cff" size="34"></u-icon>
				<input
					v-model="form.account"
					class="input"
					placeholder="请输入账号"
					placeholder-class="placeholder"
					confirm-type="next"
				/>
			</view>
			<view class="field">
				<u-icon name="lock" color="#1f7cff" size="34"></u-icon>
				<input
					v-model="form.password"
					class="input"
					password
					placeholder="请输入密码"
					placeholder-class="placeholder"
					confirm-type="done"
					@confirm="submit"
				/>
			</view>

			<view class="privacy-row" @click="togglePrivacy">
				<view :class="['privacy-check', privacyAccepted ? 'checked' : '']">
					<text v-if="privacyAccepted">✓</text>
				</view>
				<text class="privacy-text">我已阅读并同意</text>
				<text class="privacy-link" @click.stop="openPrivacy">《用户隐私保护指引》</text>
			</view>

			<button class="login-btn" :disabled="loading" @click="submit">
				{{ loading ? '登录中...' : '登录' }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { reactive, ref } from 'vue'

const loading = ref(false)
const privacyAccepted = ref(false)
const form = reactive({
	account: '',
	password: ''
})

const getTokenValue = data => {
	if (typeof data === 'string') return data
	return data?.token || data?.accessToken || data?.Authorization || data?.authorization || ''
}

const goHome = () => {
	uni.switchTab({
		url: '/pages/index/index',
		fail: () => uni.reLaunch({ url: '/pages/index/index' })
	})
}

const togglePrivacy = () => {
	privacyAccepted.value = !privacyAccepted.value
}

const openPrivacy = () => {
	uni.navigateTo({
		url: '/pages/privacy/index'
	})
}

const submit = async () => {
	if (!form.account.trim()) {
		uni.showToast({ title: '请输入账号', icon: 'none' })
		return
	}
	if (!form.password) {
		uni.showToast({ title: '请输入密码', icon: 'none' })
		return
	}
	if (!privacyAccepted.value) {
		uni.showToast({ title: '请先勾选用户隐私保护指引', icon: 'none' })
		return
	}
	if (loading.value) return
	loading.value = true
	try {
		const data = await uni.$api.login({
			account: form.account.trim(),
			password: form.password
		})
		const token = getTokenValue(data)
		if (!token) {
			uni.showToast({ title: '登录失败，未返回令牌', icon: 'none' })
			return
		}
		uni.setStorageSync('Authorization', token)
		uni.setStorageSync('token', token)
		uni.showToast({ title: '登录成功', icon: 'none' })
		setTimeout(goHome, 400)
	} catch (e) {
		uni.showToast({ title: e?.message || '登录失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}

onLoad(() => {
	const token = uni.getStorageSync('Authorization') || uni.getStorageSync('token')
	if (token) goHome()
})
</script>

<style lang="scss" scoped>
.login-page{
	min-height: 100vh;
	padding: 34rpx 44rpx 70rpx;
	box-sizing: border-box;
	background: linear-gradient(180deg, #00b9ff 0%, #1f7cff 38%, #f7f8fb 38%, #f7f8fb 100%);
	color: #222;
}
.fake-status{
	display: flex;
	align-items: center;
	justify-content: space-between;
	color: #fff;
	font-size: 30rpx;
	font-weight: 600;
}
.status-icons{
	display: flex;
	align-items: center;
	gap: 8rpx;
	.signal{ width: 30rpx; height: 22rpx; border-radius: 3rpx; background: #fff; }
	.wifi{ width: 26rpx; height: 18rpx; border-top: 6rpx solid #fff; border-radius: 50%; }
	.battery{ width: 42rpx; height: 20rpx; border: 3rpx solid #fff; border-radius: 5rpx; }
}
.login-head{
	padding: 108rpx 0 70rpx;
	color: #fff;
}
.brand-mark{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 104rpx;
	height: 104rpx;
	margin-bottom: 30rpx;
	border-radius: 26rpx;
	background: rgba(255,255,255,.18);
}
.title{
	font-size: 46rpx;
	font-weight: 700;
	line-height: 64rpx;
}
.subtitle{
	margin-top: 10rpx;
	font-size: 28rpx;
	opacity: .88;
}
.form-panel{
	padding: 46rpx 34rpx 38rpx;
	border-radius: 18rpx;
	background: #fff;
	box-shadow: 0 20rpx 60rpx rgba(20, 73, 140, .12);
}
.field{
	display: flex;
	align-items: center;
	gap: 18rpx;
	height: 104rpx;
	border-bottom: 1rpx solid #eeeeee;
}
.input{
	flex: 1;
	height: 100%;
	color: #222;
	font-size: 30rpx;
}
.placeholder{
	color: #c4c4c4;
}
.privacy-row{
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8rpx;
	margin-top: 34rpx;
	color: #8b8b8b;
	font-size: 24rpx;
	line-height: 34rpx;
}
.privacy-check{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 30rpx;
	height: 30rpx;
	margin-right: 4rpx;
	border: 2rpx solid #c7c7c7;
	border-radius: 50%;
	box-sizing: border-box;
	color: #fff;
	font-size: 22rpx;
	line-height: 1;
}
.privacy-check.checked{
	border-color: #1f7cff;
	background: #1f7cff;
}
.privacy-link{
	color: #1f7cff;
}
.login-btn{
	height: 92rpx;
	margin-top: 28rpx;
	border-radius: 14rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 32rpx;
	line-height: 92rpx;
}
.login-btn[disabled]{
	background: #8fbdff;
	color: #fff;
}
</style>
