<script>
	export default {
		onLaunch: function() {
			// #ifdef MP-WEIXIN
			const updateManager = uni.getUpdateManager()
			updateManager.onCheckForUpdate(() => {})
			updateManager.onUpdateReady(() => {
				uni.showModal({
					title: '发现新版本',
					content: '新版本已准备好，是否立即重启更新？',
					confirmText: '立即更新',
					cancelText: '稍后再说',
					success: result => {
						if (result.confirm) updateManager.applyUpdate()
					}
				})
			})
			updateManager.onUpdateFailed(() => {
				uni.showToast({ title: '新版本下载失败，请稍后重试', icon: 'none' })
			})
			// #endif
		},
		onShow: function() {},
		onHide: function() {}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import "./uni_modules/vk-uview-ui/index.scss";

	.nav-wrap,
	.create-nav,
	.detail-nav {
		padding-top: calc(20rpx + constant(safe-area-inset-top)) !important;
		padding-top: calc(20rpx + env(safe-area-inset-top)) !important;
		box-sizing: border-box;
	}

	.pageTop {
		padding-top: calc(34rpx + constant(safe-area-inset-top)) !important;
		padding-top: calc(34rpx + env(safe-area-inset-top)) !important;
		box-sizing: border-box;
	}

	/* H5 preview is constrained to the mini-program artboard width for Figma parity. */
	/* #ifdef H5 */
	html,
	body,
	#app,
	uni-page-body {
		width: 390px;
		max-width: 390px;
		min-height: 100vh;
		margin: 0 auto;
		overflow-x: hidden;
		// background: #000;
	}
	uni-page-body {
		background: #fff;
	}
	uni-tabbar.uni-tabbar-bottom,
	uni-tabbar.uni-tabbar-bottom .uni-tabbar,
	uni-tabbar.uni-tabbar-bottom .uni-tabbar-border,
	uni-tabbar.uni-tabbar-bottom .uni-placeholder {
		left: 50% !important;
		width: 390px !important;
		max-width: 390px !important;
		transform: translateX(-50%) !important;
	}
	uni-tabbar.uni-tabbar-bottom .uni-tabbar__item {
		width: 50% !important;
	}
	/* #endif */
</style>
