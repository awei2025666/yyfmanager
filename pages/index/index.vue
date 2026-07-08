<template>
  <view class="content">
	  <pageHeader
		:toBeDeliveredNum="deliveryCount.toBeDeliveredNum"
		:inTransitNum="deliveryCount.inTransitNum"
	  ></pageHeader>
	 <view class="page_content">
	 	<div class="topBar">
			<div class="left">
				<div class="top"></div>
				我的业绩（{{ userName }}）
			</div>
			<div class="right">
				<view class="segment">
					<view
						v-for="(item,index) in list"
						:key="item"
						:class="['segment-item', performanceType === index + 1 ? 'active' : '']"
						@click="changePerformanceType(index)"
					>{{ item }}</view>
				</view>
			</div>
		</div>
		<div class="tj">
			<div class="item" v-for="(item,index) in showList" :key="index">
				<div class="title">{{item.num}}</div>
				<div class="desc">{{item.title}}</div>
			</div>
		</div>
		<view class="tabbar">
			<view
				v-for="(item,index) in tabList"
				:key="item.name"
				:class="['tab-item', currentTab === index ? 'active' : '']"
				@click="click(index)"
			>
				{{ item.name }}
			</view>
		</view>
		<listViews ref="listRef" :key="currentTab" :type="currentTab"></listViews>
	 </view>
  </view>
</template>

<script setup>
import pageHeader from './component/header.vue'
import listViews from './component/list.vue'
import { computed, nextTick, ref } from 'vue'
import {onShow} from "@dcloudio/uni-app";
const list = ref(['今日','累计'])
const currentTab = ref(0)
const listRef = ref()
const performanceType = ref(1)
const userInfo = ref({})
const deliveryCount = ref({
	toBeDeliveredNum: 0,
	inTransitNum: 0
})
const userName = computed(() => (
	userInfo.value.name ||
	userInfo.value.nickname ||
	userInfo.value.nickName ||
	userInfo.value.userName ||
	userInfo.value.realName ||
	userInfo.value.account ||
	'-'
))
const performance = ref({
	orderNum: 0,
	productionNum: 0,
	handKeptNum: 0,
	dispatchNum: 0,
	deliveryNum: 0
})
const emptyPerformance = {
	orderNum: 0,
	productionNum: 0,
	handKeptNum: 0,
	dispatchNum: 0,
	deliveryNum: 0
}
const tabList = ref([
	{ name: '历史订单' },  
    { name: '历史工艺' },  
    { name: '历史配送单' },  
    { name: '历史手工' }])

const showList = computed(() => [
	{ num: performance.value.orderNum || 0, title: '订单数' },
	{ num: performance.value.productionNum || 0, title: '生产数' },
	{ num: performance.value.handKeptNum || 0, title: '手工数' },
	{ num: performance.value.deliveryNum || 0, title: '配送数' }
])
	
const click = e =>{
	currentTab.value = typeof e === 'number' ? e : e.index
}

const changePerformanceType = index => {
	performanceType.value = index + 1
	getPerformance()
}

const getPerformance = async () => {
	try {
		const data = await uni.$api.performance({ type: performanceType.value })
		performance.value = data || { ...emptyPerformance }
	} catch (e) {
		performance.value = { ...emptyPerformance }
	}
}

const initPage = async () => {
	try {
		const [info, count] = await Promise.all([
			uni.$api.selfInfo(),
			uni.$api.deliveryUnprocessed()
		])
		userInfo.value = info || {}
		deliveryCount.value = count || deliveryCount.value
	} catch (e) {
		userInfo.value = {}
		deliveryCount.value = {
			toBeDeliveredNum: 0,
			inTransitNum: 0
		}
	}
	getPerformance()
}

onShow(() => {
	initPage()
	nextTick(() => {
		listRef.value && listRef.value.refresh()
	})
})
</script>

<style lang="scss">
.tabbar{
	position: relative;
	z-index: 5;
	margin-top: 62rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	.tab-item{
		position: relative;
		padding-bottom: 18rpx;
		color: #999;
		font-size: 30rpx;
		white-space: nowrap;
		&.active{
			color: #222;
			font-weight: 600;
			&::after{
				content: "";
				position: absolute;
				left: 50%;
				bottom: 0;
				width: 96rpx;
				height: 6rpx;
				border-radius: 6rpx;
				background: #1f7cff;
				transform: translateX(-50%);
			}
		}
	}
}
.page_content{
	border-top-right-radius: 30rpx;
	border-top-left-radius: 30rpx;
	background: #fff;
	transform: translateY(-100rpx);
	min-height: calc(100vh - 250rpx);
	width: 100%;
	padding: 32rpx 30rpx 0;
	.tj{
		display: flex;
		justify-content: space-around;
		align-items: center;
		margin-top: 54rpx;
		.item{
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			.title{
				font-size: 46rpx;
				font-weight: 700;
				color: #2c2c2c;
			}
			.desc{
				margin-top: 14rpx;
				color: #999;
				font-size: 24rpx;
			}
		}
		
	}
	.topBar{
		display: flex;
		justify-content: space-between;
		align-items: center;
		.left{
			display: flex;
			justify-content: start;
			align-items: center;
			gap: 15rpx;
			color: #2f2f2f;
			font-size: 30rpx;
		}
		.right{
			display: flex;
			justify-content: end;
			align-items: center;
			gap: 15rpx;
			.segment{
				display: flex;
				padding: 0;
				overflow: hidden;
				border-radius: 18rpx;
				background: #f1f1f1;
				.segment-item{
					min-width: 96rpx;
					height: 58rpx;
					line-height: 58rpx;
					text-align: center;
					color: #666;
					font-size: 26rpx;
					&.active{
						background: #1f7cff;
						color: #fff;
					}
				}
			}
		}
	}
	.top{
		
		width: 8rpx;
		height: 30rpx;
		background: #02b9ff;
		border-radius: 10rpx;
	}
}

</style>
