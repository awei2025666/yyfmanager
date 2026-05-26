<template>
	<div class="list">
		<u-search
			v-if="type === 0"
			class="search"
			placeholder="请输入订单号、单位名称、产品信息"
			v-model="keyword"
			:show-action="false"
			height="76"
			bg-color="#f8f8f8"
		></u-search>
		<div class="showList">
			<z-paging :fixed="false" ref="paging" v-model="dataList" @query="queryList">
					<!-- z-paging默认铺满全屏，此时页面所有view都应放在z-paging标签内，否则会被盖住 -->
					<!-- 需要固定在页面顶部的view请通过slot="top"插入，包括自定义的导航栏 -->
			        <view class="item" v-for="(item,index) in dataList" :key="item.id || index" @click="toDetail(item)">
			            <view class="item-title">
							<view class="title-left">
								<u-icon v-if="type === 0 || type === 3" name="order" color="#1f7cff" size="32"></u-icon>
								<text>{{ getTitle(item) }}</text>
							</view>
							<view class="title-right">
								<text v-if="getStatusText(item)" :class="['status', `status-${type}`]">{{ getStatusText(item) }}</text>
								<u-icon v-if="type === 0 || type === 2 || type === 3" name="arrow-right" color="#999999" size="28"></u-icon>
							</view>
						</view>
						<template v-if="type === 0">
							<view class="item-desc">{{ getOrderProducts(item) }}</view>
							<view class="item-company">{{ item.companyName || '-' }}</view>
							<view class="item-meta">{{ getMeta(item) }}</view>
						</template>
						<template v-else-if="type === 1">
							<!-- TODO -->
							<view class="item-desc">{{ item.productInfo || '-' }}</view>
							<view class="item-company">
								{{ item.craftName || '' }}{{ item.orderQuantity ? `*${item.orderQuantity}` : '' }}{{ item.unitPrice ? `*¥${item.unitPrice}` : '' }}{{ item.customerMoney ? `*¥${item.customerMoney}` : '' }}<text class="danger">{{ item.remark || '' }}</text>
							</view>
						</template>
						<template v-else-if="type === 2">
							<view class="delivery-orders" v-if="getDeliveryOrderLines(item).length">
								<view class="delivery-order-line" v-for="(order, orderIndex) in getDeliveryOrderLines(item)" :key="order.orderId || orderIndex">
									<text class="delivery-products">{{ order.products }}</text>
									<text :class="['delivery-order-status', order.statusClass]">{{ order.statusText }}</text>
								</view>
							</view>
							<view class="item-desc" v-else>-</view>
							<view class="item-meta">{{ getMeta(item) }}</view>
						</template>
						<template v-else-if="type === 3">
							<view class="item-desc">{{ getHandDesc(item) }}</view>
							<view class="item-company">{{ getHandCompany(item) }}</view>
							<view class="item-meta">{{ getMeta(item) }}</view>
						</template>
						<template v-else>
							<view class="item-desc">{{ getDesc(item) }}</view>
							<view class="item-meta">{{ getMeta(item) }}</view>
						</template>
			        </view>
			    </z-paging>
		</div>
	</div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps({
	type: {
		type: Number,
		default: 0
	}
})
const keyword = ref('')
const dataList = ref([])
const paging = ref()
const queryToken = ref(0)
const destroyed = ref(false)
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
const deliveryStatusMap = {
	1: '待配送',
	2: '配送中',
	3: '已完成'
}
const deliveryOrderStatusMap = {
	1: '配送中',
	2: '已完成'
}

const fetchers = [
	params => uni.$api.orderList({ ...params, searchName: keyword.value }),
	params => uni.$api.productsCraftList(params),
	params => uni.$api.deliveryList(params),
	params => uni.$api.handKeptList(params)
]

const queryList = async (pageNo, pageSize) => {
	const token = ++queryToken.value
	const queryType = props.type
	const fetcher = fetchers[queryType]
	if (!fetcher) {
		paging.value && paging.value.complete([])
		return
	}
	try {
		const data = await fetcher({
			pageNum: pageNo,
			pageSize
		})
		if (destroyed.value || token !== queryToken.value || queryType !== props.type) return
		const records = data?.records || data
		paging.value && paging.value.complete(Array.isArray(records) ? records : [])
	} catch (e) {
		if (destroyed.value || token !== queryToken.value || queryType !== props.type) return
		paging.value && paging.value.complete([])
	}
}

const refresh = () => {
	queryToken.value++
	dataList.value = []
	nextTick(() => {
		paging.value && paging.value.reload()
	})
}

const getOrderProducts = item => {
	if (!Array.isArray(item.products) || !item.products.length) return item.productInfo || '-'
	return item.products
		.map(product => {
			const name = product.name || product.productName || product.productInfo || ''
			const quantity = product.orderQuantity || product.quantity || product.num
			return `${name}${quantity ? `*${quantity}` : ''}`
		})
		.filter(Boolean)
		.join(',')
}

const getDeliveryOrders = item => Array.isArray(item.orders) ? item.orders : []

const getDeliveryOrderProducts = order => {
	if (Array.isArray(order.products) && order.products.length) {
		return order.products
			.map(product => {
				const name = product.name || product.productName || product.productInfo || ''
				const quantity = product.orderQuantity || product.quantity || product.num
				return `${name}${quantity ? `*${quantity}` : ''}`
			})
			.filter(Boolean)
			.join('、')
	}
	return order.productInfo || order.name || ''
}

const getDeliveryOrderLines = item => getDeliveryOrders(item)
	.map(order => {
		const status = Number(order.status)
		return {
			orderId: order.orderId,
			products: getDeliveryOrderProducts(order),
			statusText: deliveryOrderStatusMap[status] || '',
			statusClass: status === 2 ? 'is-done' : 'is-transit'
		}
	})
	.filter(order => order.products)

const getHandName = item => item.name || item.productName || item.productInfo || item.handKeptName || '-'

const getHandDesc = item => {
	const quantity = item.num || item.quantity || item.orderQuantity
	return `${getHandName(item)}${quantity ? `*${quantity}` : ''}`
}

const getHandCompany = item => item.companyName || item.clientName || item.customerName || '-'

const getTitle = item => {
	if (props.type === 0) return item.orderId ? `${item.orderId}（订单号）` : (item.companyName || '-')
	if (props.type === 1) return item.productInfo || item.craftName || '-'
	if (props.type === 2) {
		const orders = getDeliveryOrders(item)
		const doneCount = orders.filter(order => Number(order.status) === 2).length
		return item.deliveryOrderId ? `${item.deliveryOrderId}(${doneCount}/${orders.length || 0})` : '-'
	}
	if (props.type === 3) return item.orderId ? `${item.orderId}（订单号）` : '-'
	return item.name || item.orderId || '-'
}

const getDesc = item => {
	if (props.type === 0) return `${item.companyName || ''} ${item.productInfo || ''}`.trim()
	if (props.type === 1) return `${item.craftName || ''}${item.orderQuantity ? `*${item.orderQuantity}` : ''}${item.unitPrice ? `*¥${item.unitPrice}` : ''}${item.customerMoney ? `*¥${item.customerMoney}` : ''}${item.remark ? `*${item.remark}` : ''}`
	if (props.type === 2) return getDeliveryOrderLines(item).map(order => `${order.products}${order.statusText}`).join('；')
	return `${item.companyName || item.orderId || ''}${item.num ? ` * ${item.num}` : ''}`.trim()
}

const getMeta = item => item.orderTime || item.createTime || ''

const getStatusText = item => {
	if (props.type === 0) return orderStatusMap[item.status] || ''
	if (props.type === 1) return craftStatusMap[item.craftStatus] || ''
	if (props.type === 2) return deliveryStatusMap[item.status] || ''
	return ''
}

const toDetail = item => {
	if (!item.id) return
	if (props.type === 0) {
		uni.navigateTo({
			url: `/pages/orderDetail/index?id=${item.id}&status=${item.status || ''}`
		})
		return
	}
	if (props.type === 2) {
		uni.navigateTo({
			url: `/pages/deliveryDetail/index?id=${item.id}`
		})
		return
	}
	if (props.type === 3 && item.orderId) {
		uni.navigateTo({
			url: `/pages/orderDetail/index?orderId=${encodeURIComponent(item.orderId)}`
		})
	}
}

watch(() => props.type, refresh)
watch(keyword, refresh)

onBeforeUnmount(() => {
	destroyed.value = true
	queryToken.value++
})
</script>

<style lang="scss">
	.list{
		padding-top: 25rpx;
	}
	.search{
		margin-bottom: 20rpx;
	}
	.showList{
		height: calc(100vh - 770rpx);
	}
	.item{
		margin-top: 20rpx;
		padding: 26rpx 24rpx;
		border-radius: 12rpx;
		background: #f8f8f8;
		.item-title{
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 16rpx;
			font-size: 28rpx;
			color: #222;
			.title-left,
			.title-right{
				display: flex;
				align-items: center;
				gap: 10rpx;
			}
			.title-left{
				min-width: 0;
				flex: 1;
				text{
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
			}
			.status{
				padding: 8rpx 22rpx;
				border-radius: 30rpx;
				background: #ffe9c8;
				color: #ff9800;
				font-size: 22rpx;
			}
			.status-1,
			.status-2{
				background: #bdeedc;
				color: #18b77a;
			}
		}
		.item-desc{
			margin-top: 16rpx;
			color: #333;
			font-size: 27rpx;
			line-height: 1.45;
		}
		.delivery-orders{
			margin-top: 16rpx;
			display: flex;
			flex-direction: column;
			gap: 6rpx;
		}
		.delivery-order-line{
			display: flex;
			align-items: flex-start;
			color: #333;
			font-size: 27rpx;
			line-height: 1.45;
		}
		.delivery-products{
			min-width: 0;
			flex: 1;
			word-break: break-all;
		}
		.delivery-order-status{
			margin-left: 6rpx;
			white-space: nowrap;
			font-size: 25rpx;
			&.is-transit{
				color: #ff9800;
			}
			&.is-done{
				color: #18b77a;
			}
		}
		.item-company{
			margin-top: 10rpx;
			color: #999;
			font-size: 25rpx;
			line-height: 1.45;
			.danger{
				color: #ff3b30;
			}
		}
		.item-meta{
			margin-top: 12rpx;
			color: #c5c5c5;
			font-size: 24rpx;
		}
	}
</style>
