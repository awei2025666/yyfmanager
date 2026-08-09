<template>
	<view class="production-page">
		<view class="nav-wrap">
		
			<view class="nav-row">
				<view class="back" @tap.stop="goBack" @click.stop="goBack">‹</view>
				<text>一键生产</text>

			</view>
		</view>

		<view :class="['status-band', `status-${currentOrderStatus}`]">{{ orderStatusText }}</view>

		<view class="section">
			<view class="section-title"><view class="mark"></view><text>工艺信息</text></view>
			<view class="craft-card" v-for="item in craftList" :key="item.id">
				<view class="craft-head">
					<view class="craft-title-wrap">
						<text class="craft-name">{{ item.productInfo || item.productName || '-' }}</text>
						<text v-if="getOrderSourceText(item)" :class="['source-tag', getOrderSourceClass(item)]">{{ getOrderSourceText(item) }}</text>
					</view>
					<text :class="['pill', getCraftStatusClass(item)]">{{ statusMap[getCraftStatus(item)] || '待生产' }}</text>
				</view>
				<view class="craft-desc">
					{{ getCraftDesc(item) }}<text v-if="item.remark" class="danger">*{{ item.remark }}</text>
				</view>
				<view v-if="canOperateCraft(item)" class="craft-actions">
					<button class="complete-btn" :disabled="startSubmittingId === String(item.id)" @click="handleCraftAction(item)">
						{{ getCraftActionText(item) }}
					</button>
				</view>
			</view>
			<view v-if="!craftList.length" class="empty-state">暂无数据</view>
		</view>

		<view class="gap"></view>

		<view v-if="attachments.length" class="section attachment-section">
			<view class="section-title"><view class="mark"></view><text>附件</text></view>
			<view class="attachment-list">
				<view
					v-for="(item, index) in attachments"
					:key="item.fileId || item.id || item.url || index"
					class="attachment-item"
					@click="previewAttachment(item)"
				>
					<image class="attachment-image" :src="item.url" mode="aspectFill" />
				</view>
			</view>
		</view>

		<view v-if="attachments.length" class="gap"></view>

		<view class="section consumable-section">
			<view class="section-title"><view class="mark"></view><text>耗材记录</text></view>
			<view class="consumable-card" v-for="item in consumableList" :key="item.id">
				<view class="consumable-name">{{ item.consumableName || item.name || '-' }}*{{ item.num || 0 }}<text v-if="item.remark">*{{ item.remark }}</text></view>
				<view class="consumable-meta">{{ item.createUserName || '-' }}， {{ item.createTime || '-' }}</view>
			</view>
			<view v-if="!consumableList.length" class="empty-state">暂无数据</view>
		</view>

		<view class="bottom-bar">
			<button class="add-btn" @click="addConsumable">添加耗材消耗</button>
		</view>
	</view>
</template>

<script setup>
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const orderId = ref('')
const craftList = ref([])
const consumableList = ref([])
const attachments = ref([])
const startSubmittingId = ref('')
const orderInfo = ref({})
const orderStatusMap = {
	1: '待审批',
	2: '待生产',
	3: '生产中',
	4: '待配送',
	5: '配送中',
	6: '已完成',
	7: '已驳回',
	8: '差错',
	9: '暂停'
}
const statusMap = {
	1: '待生产',
	2: '已完成',
	3: '生产中'
}

const currentOrderStatus = computed(() => Number(
	orderInfo.value.status ?? orderInfo.value.orderStatus ?? orderInfo.value.auditStatus ?? 2
))
const orderStatusText = computed(() => orderStatusMap[currentOrderStatus.value] || '待生产')

const getCraftStatus = item => {
	const rawStatus = item?.craftStatus ?? item?.productionStatus ?? item?.status
	if (rawStatus === '已完成' || rawStatus === '已生产') return 2
	if (rawStatus === '生产中') return 3
	if (rawStatus === '待生产') return 1
	const status = Number(rawStatus)
	return [1, 2, 3].includes(status) ? status : 1
}

const isCraftDone = item => getCraftStatus(item) === 2
const isCraftPending = item => getCraftStatus(item) === 1
const isCraftProducing = item => getCraftStatus(item) === 3
const getCraftStatusClass = item => {
	const status = getCraftStatus(item)
	if (status === 2) return 'done'
	if (status === 3) return 'producing'
	return 'pending'
}

const getOrderSource = item => Number(item?.orderSource ?? item?.source)
const getOrderSourceText = item => {
	const source = getOrderSource(item)
	if (source === 1) return '本厂'
	if (source === 2) return '外协'
	return ''
}
const getOrderSourceClass = item => getOrderSource(item) === 2 ? 'outsource' : 'factory'
const canOperateCraft = item => Number(item?.showStartButton) === 1
const getCraftActionText = item => isCraftPending(item) ? '开始生产' : '结束生产'

const formatMoney = value => {
	if (value === undefined || value === null || value === '') return ''
	const numberValue = Number(value)
	return Number.isFinite(numberValue) ? `¥${numberValue.toFixed(2)}` : `¥${value}`
}

const getCraftDesc = item => {
	const craftName = item.craftName || item.name || ''
	const quantity = item.orderQuantity || ''
	const unitPrice = formatMoney(item.unitPrice)
	const customerMoney = formatMoney(item.customerMoney)
	return [craftName, quantity, unitPrice, customerMoney].filter(value => value !== '').join('*')
}

const loadCrafts = async () => {
	try {
		if (orderId.value) {
			const data = await uni.$api.productsCraftInfo({ id: orderId.value })
			craftList.value = Array.isArray(data) ? data : []
			return
		}
		const data = await uni.$api.productsCraftList({ pageNum: 1, pageSize: 20 })
		const records = data?.records || data
		craftList.value = Array.isArray(records) ? records : []
	} catch (e) {
		craftList.value = []
	}
}

const loadOrderInfo = async () => {
	if (!orderId.value) return
	try {
		const data = await uni.$api.orderInfo({ id: orderId.value })
		orderInfo.value = data || {}
	} catch (e) {
		orderInfo.value = {}
	}
}

const loadConsumables = async () => {
	if (!orderId.value) {
		consumableList.value = []
		return
	}
	try {
		const data = await uni.$api.consumableInfo({ id: orderId.value })
		consumableList.value = Array.isArray(data) ? data : []
	} catch (e) {
		consumableList.value = []
	}
}

const loadAttachments = async () => {
	if (!orderId.value) {
		attachments.value = []
		return
	}
	try {
		const data = await uni.$api.orderFile({ id: orderId.value })
		attachments.value = Array.isArray(data) ? data.filter(item => item?.url) : []
	} catch (e) {
		attachments.value = []
	}
}

const previewAttachment = item => {
	const urls = attachments.value.map(file => file.url).filter(Boolean)
	if (!item?.url || !urls.length) return
	uni.previewImage({
		current: item.url,
		urls
	})
}

const handleStartProduction = async item => {
	if (!item?.id || startSubmittingId.value) return
	startSubmittingId.value = String(item.id)
	try {
		await uni.$api.startProduction({ id: item.id })
		uni.showToast({ title: '已开始生产', icon: 'none' })
		loadCrafts()
		loadConsumables()
	} catch (e) {
		uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
	} finally {
		startSubmittingId.value = ''
	}
}

const handleCraftAction = item => {
	if (isCraftPending(item)) {
		handleStartProduction(item)
		return
	}
	if (isCraftProducing(item)) {
		toComplete(item)
	}
}

const toComplete = item => {
	uni.navigateTo({
		url: `/pages/productionComplete/index?id=${item.id || ''}&orderId=${orderId.value || ''}`
	})
}

const addConsumable = () => {
	uni.navigateTo({
		url: `/pages/productionConsumableAdd/index?orderId=${orderId.value || ''}`
	})
}

const goBack = () => {
	uni.switchTab({
		url: '/pages/index/index',
		fail: () => {
			uni.reLaunch({ url: '/pages/index/index' })
		}
	})
}

onLoad(options => {
	orderId.value = options.id || options.orderId || ''
	loadOrderInfo()
	loadCrafts()
	loadAttachments()
	loadConsumables()
})

onShow(() => {
	if (orderId.value) {
		loadOrderInfo()
		loadCrafts()
		loadAttachments()
		loadConsumables()
	}
})
</script>

<style lang="scss" scoped>
.production-page{
	min-height: 100vh;
	padding-bottom: 150rpx;
	background: #fff;
	color: #2d2d2d;
}
.nav-wrap{
	background: #fff;
	border-bottom: 1rpx solid #eeeeee;
}
.fake-status{
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 34rpx 40rpx 0;
	color: #222;
	font-size: 30rpx;
	font-weight: 600;
}
.status-icons{
	display: flex;
	align-items: center;
	gap: 8rpx;
	.signal{ width: 30rpx; height: 22rpx; border-radius: 3rpx; background: #333; }
	.wifi{ width: 26rpx; height: 18rpx; border-top: 6rpx solid #333; border-radius: 50%; }
	.battery{ width: 42rpx; height: 20rpx; border: 3rpx solid #333; border-radius: 5rpx; }
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
		.divider{ width: 1rpx; height: 36rpx; margin: 0 24rpx; background: #e8e8e8; }
		.circle{ width: 34rpx; height: 34rpx; border-radius: 50%; border: 7rpx solid #333; }
	}
}
.status-band{
	height: 64rpx;
	color: #fff;
	font-size: 31rpx;
	line-height: 64rpx;
	text-align: center;
	background: #ff9f18;
	&.status-3{ background: #2782f8; }
	&.status-4{ background: #22a06b; }
	&.status-5{ background: #4c8df6; }
	&.status-6{ background: #6d7989; }
	&.status-8{ background: #ef5965; }
	&.status-9{ background: #8993a1; }
}
.section{
	padding: 38rpx 30rpx 34rpx;
	background: #fff;
}
.empty-state{
	padding: 54rpx 0;
	color: #b8b8b8;
	font-size: 28rpx;
	text-align: center;
}
.section-title{
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 24rpx;
	font-size: 34rpx;
	line-height: 48rpx;
	.mark{
		width: 8rpx;
		height: 28rpx;
		border-radius: 8rpx;
		background: #1f7cff;
	}
}
.craft-card,
.consumable-card{
	margin-top: 20rpx;
	padding: 26rpx 24rpx;
	border-radius: 14rpx;
	background: #f7f7f7;
}
.craft-card:first-of-type,
.consumable-card:first-of-type{
	margin-top: 0;
}
.craft-head{
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}
.craft-name{
	color: #333;
	font-size: 30rpx;
	line-height: 42rpx;
	word-break: break-all;
}
.craft-title-wrap{
	flex: 1;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10rpx;
	min-width: 0;
}
.source-tag{
	flex: 0 0 auto;
	height: 34rpx;
	padding: 0 14rpx;
	border-radius: 34rpx;
	font-size: 21rpx;
	line-height: 34rpx;
}
.source-tag.factory{
	background: #e8f2ff;
	color: #1f7cff;
}
.source-tag.outsource{
	background: #fff0d9;
	color: #ff9f18;
}
.pill{
	flex: 0 0 auto;
	min-width: 108rpx;
	height: 40rpx;
	padding: 0 18rpx;
	border-radius: 40rpx;
	font-size: 23rpx;
	line-height: 40rpx;
	text-align: center;
}
.pending{
	background: #ffd3dc;
	color: #ff3347;
}
.done{
	background: #c9f0df;
	color: #18bf7b;
}
.producing{
	background: #d8e8ff;
	color: #1f7cff;
}
.craft-desc{
	margin-top: 14rpx;
	color: #9a9a9a;
	font-size: 26rpx;
	line-height: 36rpx;
	word-break: break-all;
}
.danger{
	color: #ff3347;
}
.craft-actions{
	margin-top: 18rpx;
}
.complete-btn{
	width: 100%;
	height: 64rpx;
	border: 0;
	border-radius: 64rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 28rpx;
	line-height: 64rpx;
	&::after{ border: 0; }
	&[disabled]{
		opacity: .65;
	}
}
.gap{
	height: 16rpx;
	background: #f7f7f7;
}
.attachment-section{
	padding-bottom: 38rpx;
}
.attachment-list{
	display: flex;
	flex-wrap: wrap;
	gap: 18rpx;
}
.attachment-item{
	width: 200rpx;
	height: 200rpx;
	overflow: hidden;
	border: 1rpx solid #e8ebf0;
	border-radius: 10rpx;
	background: #f7f7f7;
	box-sizing: border-box;
}
.attachment-image{
	width: 100%;
	height: 100%;
}
.consumable-section{
	padding-bottom: 20rpx;
}
.consumable-name{
	color: #333;
	font-size: 30rpx;
	line-height: 42rpx;
}
.consumable-meta{
	margin-top: 16rpx;
	color: #999;
	font-size: 26rpx;
	line-height: 36rpx;
	letter-spacing: 2rpx;
}
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 34rpx;
	width: 100%;
	max-width: 390px;
	padding: 0 30rpx;
	transform: translateX(-50%);
	box-sizing: border-box;
	background: transparent;
}
.add-btn{
	width: 100%;
	height: 78rpx;
	border: 0;
	border-radius: 12rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 30rpx;
	line-height: 78rpx;
	&::after{ border: 0; }
}
</style>
