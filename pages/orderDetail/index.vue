<template>
	<div class="orderDetail" :class="{ 'delivery-mode': isDeliveryPending }">
		<view class="detail-nav">
		
			<view class="nav-row">
				<view class="back" @tap.stop="goBack" @click.stop="goBack">‹</view>
				<text>订单详情</text>

			</view>
		</view>
		<div class="detail-status" v-if="detailStatusText" :class="`status-${currentOrderStatus}`">{{ detailStatusText }}</div>
		<div class="orderInfo">
			<div class="bar">
				<div class="line"></div>
				<div class="info">订单信息</div>
			</div>
			<div class="inlineBar">
				<div class="left">订单号</div>
				<div class="info">{{ orderInfo.orderId || '-' }}</div>
			</div>
			<div class="inlineBar">
				<div class="left">单位名称</div>
				<div class="info">{{ orderInfo.companyName || '-' }}</div>
			</div>
			<div class="inlineBar">
				<div class="left">联系人</div>
				<div class="info">{{ orderInfo.linkman || '-' }}</div>
			</div>
			<div class="inlineBar">
				<div class="left">联系方式</div>
				<div class="info">{{ orderInfo.phone || '-' }}</div>
			</div>
			<div class="inlineBar">
				<div class="left">送货地址</div>
				<div class="info">{{ orderInfo.companyAddress || '-' }}</div>
			</div>
			<div class="inlineBar">
				<div class="left">交货日期</div>
				<div class="info">{{ orderInfo.deliveryDate || '-' }}</div>
			</div>
			<div class="inlineBar">
				<div class="left">印刷要求</div>
				<div class="info">{{ orderInfo.printingRequirements || '-' }}</div>
			</div>
			<div class="inlineBar">
				<div class="left">备注</div>
				<div class="info">{{ orderInfo.remark || '-' }}</div>
			</div>
		</div>
		<div class="lienBar"></div>
		<div class="proInfo">
			<div class="bar">
				<div class="line"></div>
				<div class="info">产品信息</div>
			</div>
			<div class="product-list">
				<div class="product-card" v-for="(item,index) in productList" :key="item.id || index">
					<div class="card-title">{{ item.name || item.productInfo || '-' }}</div>
					<div class="card-desc">{{ getProductDesc(item) }}</div>
				</div>
			</div>
		</div>
		<div class="lienBar"></div>
		<div class="proInfo">
			<div class="bar">
				<div class="line"></div>
				<div class="info">工艺信息</div>
			</div>
			<div class="craft-list">
				<div class="craft-card" v-for="(item,index) in craftList" :key="item.id || index">
					<div class="craft-head">
						<div class="card-title">{{ item.productInfo || item.name || item.craftName || '-' }}</div>
						<div :class="['craft-tag', Number(item.craftStatus) === 2 ? 'done' : 'pending']">{{ craftStatusMap[item.craftStatus] || '待生产' }}</div>
					</div>
					<div class="card-desc">
						{{ getCraftBaseDesc(item) }}<text v-if="item.remark" class="danger">*{{ item.remark }}</text>
					</div>
				</div>
			</div>
		</div>
		<div class="lienBar"></div>
		<div class="proInfo">
			<div class="bar">
				<div class="line"></div>
				<div class="info">订单记录</div>
			</div>
			<div class="record-list">
				<div class="record-item" v-for="(item,index) in processList" :key="item.id || index">
					<div class="record-check">✓</div>
					<div class="record-body">
						<div class="record-time">{{ formatRecordTime(item.createTime) }}</div>
						<div class="record-content">{{ item.content || '-' }}</div>
						<div class="record-user">
							<text>{{ item.tenantUserName || '-' }}</text>
							<text>{{ maskPhone(item.tenantUserPhone || item.phone) || '-' }}</text>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="delivery-bottom" v-if="isDeliveryPending">
			<button class="delivery-create" @click="createDelivery">创建配送单</button>
		</div>
		<div class="btn" v-else-if="orderId">
			<u-button type="primary" @click="cancelOrder">取消订单</u-button>
		</div>
		
	</div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const orderId = ref('')
const orderNo = ref('')
const routeStatus = ref('')
const isDeliveryPending = ref(false)
const orderInfo = ref({})
const processList = ref([])
const orderStatusMap = {
	1: '待审批',
	2: '待生产',
	3: '生产中',
	4: '待配送',
	5: '配送中',
	6: '已完成',
	7: '已驳回'
}
const craftStatusMap = {
	1: '待生产',
	2: '已生产'
}
const currentOrderStatus = computed(() => Number(
	isDeliveryPending.value ? 4 :
	orderInfo.value.status ||
	orderInfo.value.orderStatus ||
	orderInfo.value.auditStatus ||
	routeStatus.value ||
	0
))
const detailStatusText = computed(() => {
	if (isDeliveryPending.value) return '待配送'
	return orderStatusMap[currentOrderStatus.value] || ''
})
const productList = computed(() => orderInfo.value.productList || orderInfo.value.productsList || [])
const craftList = computed(() => {
	const fromProduct = productList.value.reduce((list, item) => {
		return list.concat(item.craftList || item.productsCraftList || [])
	}, [])
	return orderInfo.value.craftList || orderInfo.value.productsCraftList || fromProduct
})

const formatMoney = value => {
	if (value === undefined || value === null || value === '') return ''
	const numberValue = Number(value)
	return Number.isFinite(numberValue) ? `¥${numberValue.toFixed(2)}` : `¥${value}`
}

const getProductDesc = item => {
	const spec = item.trimmedSize || item.specification || ''
	const quantity = item.orderQuantity || item.num || ''
	const money = formatMoney(item.money || item.customerMoney || item.unitPrice)
	return [spec, quantity, money].filter(value => value !== '').join('*')
}

const getCraftBaseDesc = item => {
	const name = item.craftName || item.name || ''
	const quantity = item.orderQuantity || ''
	const unitPrice = formatMoney(item.unitPrice)
	const customerMoney = formatMoney(item.customerMoney)
	return [name, quantity, unitPrice, customerMoney].filter(value => value !== '').join('*')
}

const formatRecordTime = time => {
	if (!time) return '-'
	return String(time).replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1.$2.$3').slice(0, 16)
}

const maskPhone = phone => String(phone || '').replace(/^(\d{3})\d{4}(\d+)/, '$1****$2')

const resolveOrderId = async () => {
	if (orderId.value || !orderNo.value) return orderId.value
	const data = await uni.$api.orderList({
		pageNum: 1,
		pageSize: 10,
		searchName: orderNo.value
	})
	const records = data?.records || []
	const target = records.find(item => item.orderId === orderNo.value) || records[0]
	orderId.value = target?.id || ''
	return orderId.value
}

const loadDetail = async () => {
	try {
		await resolveOrderId()
		if (!orderId.value) throw { code: 1002 }
		const detailApi = uni.$api.orderInfo
		const [info, process] = await Promise.all([
			detailApi({ id: orderId.value }),
			uni.$api.orderProcessInfo({ id: orderId.value })
		])
		orderInfo.value = info || {}
		const records = Array.isArray(process) ? process : []
		processList.value = records
	} catch (e) {
		orderInfo.value = orderNo.value ? { orderId: orderNo.value } : {}
		processList.value = []
	}
}

const cancelOrder = () => {
	uni.showModal({
		title: '提示',
		content: '确认取消该订单吗？',
		success: async res => {
			if (!res.confirm) return
			try {
				await uni.$api.orderDel({ id: orderId.value })
				uni.showToast({
					title: '已取消',
					icon: 'none'
				})
				setTimeout(() => {
					uni.navigateBack()
				}, 600)
			} catch (e) {}
		}
	})
}

const createDelivery = () => {
	uni.navigateTo({ url: `/pages/deliveryCreate/index?id=${orderId.value}` })
}

const goBack = () => {
	uni.switchTab({
		url: '/pages/index/index',
		fail: () => {
			uni.reLaunch({
				url: '/pages/index/index',
				fail: () => {
					// H5 direct-entry fallback: there may be no mini-program page stack to pop.
					if (typeof window !== 'undefined') {
						window.location.hash = '#/pages/index/index'
					}
				}
			})
		}
	})
}

onLoad(options => {
	orderId.value = options.id || ''
	orderNo.value = options.orderId ? decodeURIComponent(options.orderId) : ''
	routeStatus.value = options.status || ''
	isDeliveryPending.value = options.from === 'deliveryPending' || options.deliveryStatus === 'pending'
	loadDetail()
})
</script>

<style lang="scss" scoped>
	.orderDetail{
		min-height: 100vh;
		background: #fff;
		color: #262626;
	}
	.orderDetail.delivery-mode{
		padding-bottom: 148rpx;
	}
	.detail-nav{
		background: #fff;
		border-bottom: 1rpx solid #eeeeee;
		.fake-status{
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 34rpx 40rpx 0;
			color: #222;
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
					background: #333;
				}
				.wifi{
					width: 26rpx;
					height: 18rpx;
					border-top: 6rpx solid #333;
					border-radius: 50%;
				}
				.battery{
					width: 42rpx;
					height: 20rpx;
					border: 3rpx solid #333;
					border-radius: 5rpx;
				}
			}
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
			.capsule{
				justify-self: end;
				display: flex;
				align-items: center;
				justify-content: center;
				width: 174rpx;
				height: 64rpx;
				border: 1rpx solid #e8e8e8;
				border-radius: 64rpx;
				font-size: 32rpx;
				.divider{
					width: 1rpx;
					height: 36rpx;
					margin: 0 24rpx;
					background: #e8e8e8;
				}
				.circle{
					width: 34rpx;
					height: 34rpx;
					border-radius: 50%;
					border: 7rpx solid #333;
				}
			}
		}
	}
	.btn{
		margin-top: 30rpx;
		padding: 0 30rpx;
	}
	.detail-status{
		height: 64rpx;
		background: #ff9800;
		color: #fff;
		font-size: 30rpx;
		line-height: 64rpx;
		text-align: center;
		&.status-2,
		&.status-6{
			background: #18bf7b;
		}
		&.status-3,
		&.status-4{
			background: #1f7cff;
		}
		&.status-7{
			background: #ff4d5f;
		}
	}
	.delivery-bottom{
		position: fixed;
		left: 50%;
		bottom: 34rpx;
		z-index: 20;
		width: 100%;
		max-width: 390px;
		padding: 0 30rpx;
		box-sizing: border-box;
		transform: translateX(-50%);
	}
	.delivery-create{
		width: 100%;
		height: 78rpx;
		border: 0;
		border-radius: 12rpx;
		background: #1f7cff;
		color: #fff;
		font-size: 30rpx;
		line-height: 78rpx;
	}
	.delivery-create::after{
		border: 0;
	}
	.lienBar{
		background: #f8f8f8;
		height: 16rpx;
		
	}
	.proInfo{
		padding: 38rpx 30rpx 34rpx;
	}
	.orderInfo{
		padding: 30rpx;
		.inlineBar{
			margin-top: 15rpx;
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 24rpx;
			.left{
				color: #b2b2b2;
				flex: 0 0 150rpx;
			}
			.info{
				flex: 1;
				text-align: right;
				word-break: break-all;
			}
		}
	}
	.bar{
		display: flex;
		justify-content: start;
		align-items: center;
		gap:10rpx;
		margin-bottom: 28rpx;
		.info{
			font-size: 34rpx;
			color: #2d2d2d;
		}
		.line{
			width: 10rpx;
			height: 30rpx;
			border-radius: 10rpx;
			background: #1777ff;
		}
	}
	.product-list,
	.craft-list{
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}
	.product-card,
	.craft-card{
		min-height: 110rpx;
		padding: 26rpx 24rpx;
		border-radius: 14rpx;
		background: #f7f7f7;
	}
	.product-card + .product-card,
	.craft-card + .craft-card{
		margin-top: 0;
	}
	.card-title{
		max-width: 520rpx;
		color: #2f2f2f;
		font-size: 30rpx;
		line-height: 42rpx;
		word-break: break-all;
	}
	.card-desc{
		margin-top: 14rpx;
		color: #9d9d9d;
		font-size: 25rpx;
		line-height: 34rpx;
		word-break: break-all;
	}
	.craft-head{
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}
	.craft-tag{
		flex: 0 0 auto;
		min-width: 108rpx;
		height: 40rpx;
		padding: 0 20rpx;
		border-radius: 40rpx;
		background: #c9f0df;
		color: #18bf7b;
		font-size: 23rpx;
		line-height: 40rpx;
		text-align: center;
		&.done{
			background: #e8f1ff;
			color: #1f7cff;
		}
		&.pending{
			background: #c9f0df;
			color: #18bf7b;
		}
	}
	.danger{
		color: #ff3347;
	}
	.record-list{
		padding-left: 74rpx;
	}
	.record-item{
		position: relative;
		padding-bottom: 50rpx;
	}
	.record-item:last-child{
		padding-bottom: 8rpx;
	}
	.record-check{
		position: absolute;
		left: -54rpx;
		top: 2rpx;
		color: #ffd5df;
		font-size: 24rpx;
		line-height: 1;
	}
	.record-time{
		color: #262626;
		font-size: 30rpx;
		font-weight: 700;
		line-height: 42rpx;
	}
	.record-content{
		margin-top: 6rpx;
		color: #333;
		font-size: 26rpx;
		line-height: 36rpx;
	}
	.record-user{
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 26rpx;
		padding-right: 14rpx;
		color: #a1a1a1;
		font-size: 26rpx;
		line-height: 36rpx;
	}
</style>
