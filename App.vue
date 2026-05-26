<script>
	export default {
		onLaunch: function() {},
		onShow: function() {},
		onHide: function() {}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import "./uni_modules/vk-uview-ui/index.scss";

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
