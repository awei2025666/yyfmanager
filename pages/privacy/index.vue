<template>
	<view class="privacy-page">
		<view class="nav-wrap">
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack">‹</view>
				<text>用户隐私保护指引</text>
			</view>
		</view>

		<scroll-view class="content" scroll-y>
			<view class="title">用户隐私保护指引</view>
			<view class="meta">生效日期：2026年06月13日</view>
			<view class="meta">主体：风行猫科技有限公司</view>

			<view class="section">
				<view class="section-title">一、我们如何收集和使用信息</view>
				<view class="paragraph">为向您提供印刷ERP小程序的账号登录、订单管理、生产记录、配送记录、图片上传等功能，我们可能会根据业务需要收集您的账号信息、姓名、手机号、部门、职位、操作记录、订单相关信息以及您主动上传的图片和备注内容。</view>
			</view>

			<view class="section">
				<view class="section-title">二、设备和日志信息</view>
				<view class="paragraph">为保障服务稳定运行和账号安全，我们可能会收集必要的设备信息、网络状态、接口访问日志、错误日志等信息，用于问题排查、安全审计和服务优化。</view>
			</view>

			<view class="section">
				<view class="section-title">三、图片和文件信息</view>
				<view class="paragraph">当您使用头像上传、生产图片备注、配送图片备注、耗材图片备注等功能时，我们会处理您主动选择上传的图片或文件。请勿上传与业务无关或包含他人敏感个人信息的内容。</view>
			</view>

			<view class="section">
				<view class="section-title">四、我们如何保存和保护信息</view>
				<view class="paragraph">我们会在实现业务目的所必需的期限内保存相关信息，并采取合理的安全措施保护您的个人信息，防止未经授权访问、公开披露、使用、修改、损坏或丢失。</view>
			</view>

			<view class="section">
				<view class="section-title">五、信息共享</view>
				<view class="paragraph">未经您同意，我们不会向无关第三方共享您的个人信息。法律法规另有规定、监管机关依法要求或为保障系统安全和业务履行所必需的除外。</view>
			</view>

			<view class="section">
				<view class="section-title">六、您的权利</view>
				<view class="paragraph">您可以在小程序内查看个人信息，或联系管理员处理信息更正、删除、账号注销等请求。我们会在符合法律法规和业务管理要求的范围内处理您的申请。</view>
			</view>

			<view class="section">
				<view class="section-title">七、未成年人保护</view>
				<view class="paragraph">本小程序主要面向企业内部及业务协作人员使用。如您为未成年人，请在监护人同意和指导下使用相关服务。</view>
			</view>

			<view class="section">
				<view class="section-title">八、联系我们</view>
				<view class="paragraph">如您对本指引或个人信息保护有疑问，可通过小程序所属企业管理员联系风行猫科技有限公司。</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
const goBack = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		return
	}
	uni.reLaunch({ url: '/pages/login/index' })
}
</script>

<style lang="scss" scoped>
.privacy-page{
	min-height: 100vh;
	background: #f7f8fb;
	color: #2d2d2d;
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
}
.content{
	height: calc(100vh - 108rpx);
	padding: 36rpx 34rpx 60rpx;
	box-sizing: border-box;
	background: #fff;
}
.title{
	margin-bottom: 18rpx;
	color: #111;
	font-size: 38rpx;
	font-weight: 700;
	line-height: 54rpx;
}
.meta{
	margin-bottom: 8rpx;
	color: #8b8b8b;
	font-size: 26rpx;
	line-height: 38rpx;
}
.section{
	margin-top: 34rpx;
}
.section-title{
	margin-bottom: 12rpx;
	color: #222;
	font-size: 30rpx;
	font-weight: 600;
	line-height: 44rpx;
}
.paragraph{
	color: #555;
	font-size: 28rpx;
	line-height: 48rpx;
	text-align: justify;
}
</style>
