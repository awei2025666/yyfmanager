<template>
	<view class="pageTop">

		<view class="nav">
			<view></view>
			<text>首页</text>
		
		</view>
		<view class="quick-grid">
			<view class="item" @click="toPage('/pages/orderCreate/index')">
				<view class="quick-icon clipboard-icon">
					<view class="clip"></view>
					<view class="paper-lines"></view>
					<view class="check"></view>
				</view>
				<view class="desc">
					一键开单
				</view>
			</view>
			<view class="item" @click="scanTo('production')">
				<view class="quick-icon scan-icon">
					<view class="corner lt"></view>
					<view class="corner rt"></view>
					<view class="corner lb"></view>
					<view class="corner rb"></view>
				</view>
				<view class="desc">
					一键生产
				</view>
			</view>
			<view class="item" @click="scanTo('handRecord')">
				<view class="quick-icon scan-icon">
					<view class="corner lt"></view>
					<view class="corner rt"></view>
					<view class="corner lb"></view>
					<view class="corner rb"></view>
				</view>
				<view class="desc">
					手工记录
				</view>
			</view>
			<view class="item" @click="toPage('/pages/deliveryPending/index')">
				<image src="/static/home/nosent.png"></image>
				<view v-if="toBeDeliveredNum" class="badge">{{ toBeDeliveredNum }}</view>
				<view class="desc">
					待配送
				</view>
			</view>
			<view class="item" @click="toPage('/pages/deliveryTransit/index')">
				<image src="/static/home/sending.png"></image>
				<view v-if="inTransitNum" class="badge">{{ inTransitNum }}</view>
				<view class="desc">
					配送中
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
defineProps({
	toBeDeliveredNum: {
		type: Number,
		default: 0
	},
	inTransitNum: {
		type: Number,
		default: 0
	}
})

const toPage = url => {
	uni.navigateTo({ url })
}

const parseScanOrderId = result => {
	const text = String(result || '').trim()
	if (!text) return ''
	try {
		const url = new URL(text)
		return url.searchParams.get('orderId') || url.searchParams.get('id') || ''
	} catch (e) {}
	try {
		const data = JSON.parse(text)
		return data.orderId || data.id || data.orderNo || ''
	} catch (e) {}
	const match = text.match(/(?:orderId|id|orderNo)=([^&\s]+)/i)
	if (match?.[1]) return decodeURIComponent(match[1])
	return text
}

const openScannedPage = (type, result) => {
	const orderId = parseScanOrderId(result)
	if (!orderId) {
		uni.showToast({ title: '未识别到订单信息', icon: 'none' })
		return
	}
	const page = type === 'production' ? '/pages/production/index' : '/pages/handRecord/index'
	uni.navigateTo({
		url: `${page}?id=${encodeURIComponent(orderId)}`
	})
}

const scanTo = type => {
	uni.scanCode({
		onlyFromCamera: true,
		success: res => {
			openScannedPage(type, res.result)
		},
		fail: () => {
			uni.showToast({ title: '扫码失败', icon: 'none' })
		}
	})
}
</script>

<style lang="scss">
	.pageTop{
		background: #02b9ff;
		width: 100%;
		padding: 34rpx 24rpx 154rpx;
		.fake-status{
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 40rpx;
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
					opacity: .95;
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
		.quick-grid{
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-top: 66rpx;
		}
		.item{
			position: relative;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			gap: 24rpx;
			color: #fff;
			font-size: 27rpx;
			.quick-icon{
				position: relative;
				width: 60rpx;
				height: 60rpx;
			}
			.clipboard-icon{
				border: 6rpx solid #fff;
				border-radius: 8rpx;
				.clip{
					position: absolute;
					left: 15rpx;
					top: -10rpx;
					width: 26rpx;
					height: 16rpx;
					border: 5rpx solid #fff;
					border-radius: 8rpx;
					background: #02b9ff;
				}
				.paper-lines{
					position: absolute;
					left: 12rpx;
					top: 18rpx;
					width: 30rpx;
					height: 6rpx;
					border-top: 5rpx solid #fff;
					border-bottom: 5rpx solid #fff;
				}
				.check{
					position: absolute;
					right: -5rpx;
					bottom: 3rpx;
					width: 24rpx;
					height: 14rpx;
					border-left: 6rpx solid #fff;
					border-bottom: 6rpx solid #fff;
					transform: rotate(-45deg);
				}
			}
			.scan-icon{
				.corner{
					position: absolute;
					width: 22rpx;
					height: 22rpx;
					border-color: #fff;
					border-style: solid;
				}
				.lt{
					left: 0;
					top: 0;
					border-width: 5rpx 0 0 5rpx;
				}
				.rt{
					right: 0;
					top: 0;
					border-width: 5rpx 5rpx 0 0;
				}
				.lb{
					left: 0;
					bottom: 0;
					border-width: 0 0 5rpx 5rpx;
				}
				.rb{
					right: 0;
					bottom: 0;
					border-width: 0 5rpx 5rpx 0;
				}
			}
			image{
				width: 60rpx;
				height: 60rpx;
				object-fit: contain;
			}
			.badge{
				position: absolute;
				top: -12rpx;
				right: -12rpx;
				min-width: 30rpx;
				height: 30rpx;
				padding: 0 8rpx;
				border-radius: 30rpx;
				background: #ff4d4f;
				color: #fff;
				font-size: 20rpx;
				line-height: 30rpx;
				text-align: center;
			}
		}
	}
	
	
</style>
