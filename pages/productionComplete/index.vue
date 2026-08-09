<template>
	<view class="complete-page">
		<view class="nav-wrap">
		
			<view class="nav-row">
				<view class="back" @tap.stop.prevent="goBack" @click.stop.prevent="goBack" @touchend.stop.prevent="goBack">‹</view>
				<text>完成生产</text>

			</view>
		</view>

		<view class="form-section">
			<view class="machine-row" @click="openMachinePopup">
				<text class="label">机器类型</text>
				<view class="right-value">
					<text :class="form.machineName ? 'value' : 'placeholder'">{{ form.machineName || '请选择机器' }}</text>
					<text class="arrow">›</text>
				</view>
			</view>
			<view class="divider-line"></view>

			<view class="form-row">
				<text class="label">完成数量</text>
				<input v-model="form.num" class="num-field" type="number" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="divider-line"></view>

			<view class="form-row">
				<text class="label">是否过油</text>
				<radio-group class="fry-radio-group" @change="changeFry">
					<label class="fry-radio">
						<radio value="1" :checked="form.fry === 1" color="#1f7cff" />
						<text>是</text>
					</label>
					<label class="fry-radio">
						<radio value="0" :checked="form.fry === 0" color="#1f7cff" />
						<text>否</text>
					</label>
				</radio-group>
			</view>
			<view class="divider-line"></view>

			<view class="field-block">
				<text class="label">备注</text>
				<textarea v-model="form.completeRemark" class="remark" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="divider-line"></view>

			<view class="field-block">
				<text class="label">图片备注</text>
				<view class="image-row">
					<view v-if="images.length < maxImages" class="upload-box" @click="chooseImage">+</view>
					<view class="image-item" v-for="(item,index) in images" :key="item">
						<image :src="item" mode="aspectFill"></image>
						<view class="remove-image" @click.stop="removeImage(index)">×</view>
					</view>
					<view class="image-placeholder" v-for="item in imageSlots" :key="item"></view>
				</view>
			</view>
		</view>

		<view class="gap"></view>

		<view class="partner-section">
			<view class="section-title debugger-title">
				<view class="title-left"><view class="mark"></view><text>调试人</text></view>
				<view class="add-icon" @click="openDebuggerPopup">+</view>
			</view>
			<view v-if="debuggerUser.id" class="partner-card debugger-card">
				<view class="avatar"></view>
				<view class="partner-info">
					<view><text class="name">{{ debuggerUser.name }}</text><text class="phone">{{ debuggerUser.phone }}</text></view>
				</view>
				<view class="delete" @click="deleteDebugger">删</view>
			</view>

			<view class="section-title">
				<view class="title-left"><view class="mark"></view><text>合作人员</text></view>
				<view class="add-icon" @click="openPartnerPopup">+</view>
			</view>
			<view class="partner-card" v-for="item in partners" :key="item.id">
				<view class="avatar"></view>
				<view class="partner-info">
					<view><text class="name">{{ item.name }}</text><text class="phone">{{ item.phone }}</text></view>
				</view>
				<view class="delete" @click="deletePartner(item.id)">删</view>
			</view>
		</view>

		<view class="bottom-bar">
			<button class="confirm-btn" @click="submit">确认完成</button>
		</view>

		<view v-if="showDebuggerPopup" class="popup-mask" @click="closeDebuggerPopup">
			<view class="partner-popup" @click.stop>
				<view class="section-title popup-title">
					<view class="title-left"><view class="mark"></view><text>选择调试人</text></view>
				</view>
				<view class="search-box">
					<input
						v-model="debuggerKeyword"
						class="search-input"
						placeholder="搜索调试人"
						placeholder-class="placeholder"
						@input="handleDebuggerSearch"
					/>
				</view>
				<view class="select-user-card" v-for="item in debuggerOptions" :key="item.id" :class="{ selected: String(selectedDebuggerId) === String(item.id) }" @click="selectDebugger(item)">
					<view class="user-main">
						<view class="avatar user-avatar"></view>
						<view>
							<view class="select-name">{{ item.name }}</view>
							<view class="select-phone">{{ item.phone }}</view>
						</view>
					</view>
					<view v-if="String(selectedDebuggerId) === String(item.id)" class="check">✓</view>
				</view>
				<view v-if="!debuggerOptions.length" class="empty-state">{{ debuggerLoading ? '加载中...' : '暂无人员' }}</view>
				<button class="popup-confirm" @click="confirmDebugger">确认添加</button>
			</view>
		</view>

		<view v-if="showPartnerPopup" class="popup-mask" @click="closePartnerPopup">
			<view class="partner-popup" @click.stop>
				<view class="section-title popup-title">
					<view class="title-left"><view class="mark"></view><text>添加合作人员</text></view>
				</view>
				<view class="search-box">
					<input
						v-model="partnerKeyword"
						class="search-input"
						placeholder="搜索合作人员"
						placeholder-class="placeholder"
						@input="handlePartnerSearch"
					/>
				</view>
				<view class="select-user-card" v-for="item in userOptions" :key="item.id" :class="{ selected: String(selectedUserId) === String(item.id) }" @click="selectUser(item)">
					<view class="user-main">
						<view class="avatar user-avatar"></view>
						<view>
							<view class="select-name">{{ item.name }}</view>
							<view class="select-phone">{{ item.phone }}</view>
						</view>
					</view>
					<view v-if="String(selectedUserId) === String(item.id)" class="check">✓</view>
				</view>
				<view v-if="!userOptions.length" class="empty-state">{{ partnerLoading ? '加载中...' : '暂无人员' }}</view>
				<button class="popup-confirm" @click="confirmPartner">确认添加</button>
			</view>
		</view>

		<view v-if="showMachinePopup" class="popup-mask" @click="closeMachinePopup">
			<view class="machine-popup" @click.stop>
				<view class="section-title popup-title">
					<view class="title-left"><view class="mark"></view><text>选择机器</text></view>
				</view>
				<view class="machine-option" v-for="item in machineOptions" :key="item.id" @click="selectMachine(item)">
					<text>{{ item.name || '-' }}</text>
					<text v-if="String(form.machineId) === String(item.id)" class="check">✓</text>
				</view>
				<view v-if="!machineOptions.length" class="empty-state">暂无机器</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

const craftId = ref('')
const orderId = ref('')
const form = ref({
	machineId: '',
	machineName: '',
	num: '',
	fry: 0,
	completeRemark: '',
	completeImgRemark: ''
})
const images = ref([])
const maxImages = 1
const partners = ref([])
const debuggerUser = ref({})
const machineOptions = ref([])
const showMachinePopup = ref(false)
const showPartnerPopup = ref(false)
const showDebuggerPopup = ref(false)
const debuggerOptions = ref([])
const selectedDebuggerId = ref('')
const debuggerKeyword = ref('')
const debuggerLoading = ref(false)
const userOptions = ref([])
const selectedUserId = ref('')
const partnerKeyword = ref('')
const partnerLoading = ref(false)
let debuggerSearchTimer = null
let partnerSearchTimer = null

const imageSlots = computed(() => Math.max(0, maxImages - images.value.length - (images.value.length < maxImages ? 1 : 0)))

const chooseImage = () => {
	uni.chooseImage({
		count: maxImages - images.value.length,
		sizeType: ['compressed'],
		success: res => {
			const paths = res.tempFilePaths || []
			images.value = images.value.concat(paths).slice(0, maxImages)
		}
	})
}

const removeImage = index => {
	images.value.splice(index, 1)
}

const changeFry = e => {
	form.value.fry = Number(e.detail.value)
}

const getUploadFileId = result => {
	if (typeof result === 'string' || typeof result === 'number') return String(result)
	return result?.fileId || result?.id || result?.fileID || result?.file?.id || ''
}

const uploadImage = async () => {
	if (!images.value.length) return ''
	const result = await uni.$api.uploadFile(images.value[0])
	return getUploadFileId(result)
}

const loadMachines = async () => {
	try {
		const data = await uni.$api.selfMachine()
		const records = data?.records || data
		machineOptions.value = Array.isArray(records) ? records : []
		if (!form.value.machineId && machineOptions.value.length === 1) {
			selectMachine(machineOptions.value[0], false)
		}
	} catch (e) {
		machineOptions.value = []
	}
}

const openMachinePopup = async () => {
	showMachinePopup.value = true
	if (!machineOptions.value.length) {
		loadMachines()
	}
}

const closeMachinePopup = () => {
	showMachinePopup.value = false
}

const selectMachine = (item, close = true) => {
	form.value.machineId = item.id
	form.value.machineName = item.name || ''
	if (close) closeMachinePopup()
}

const normalizeUser = item => ({
	...item,
	id: item.id ?? item.userId ?? item.tenantUserId,
	name: item.name || item.tenantUserName || item.userName || '-',
	phone: item.phone || item.tenantUserPhone || item.mobile || ''
})

const openDebuggerPopup = async () => {
	showDebuggerPopup.value = true
	selectedDebuggerId.value = debuggerUser.value.id || ''
	debuggerKeyword.value = ''
	loadDebuggerUsers()
}

const loadDebuggerUsers = async () => {
	debuggerLoading.value = true
	try {
		const users = await uni.$api.userAll({ name: debuggerKeyword.value })
		const records = users?.records || users
		debuggerOptions.value = Array.isArray(records) ? records.map(normalizeUser) : []
	} catch (e) {
		debuggerOptions.value = []
	} finally {
		debuggerLoading.value = false
	}
}

const closeDebuggerPopup = () => {
	showDebuggerPopup.value = false
}

const selectDebugger = item => {
	selectedDebuggerId.value = item.id
}

const handleDebuggerSearch = () => {
	if (debuggerSearchTimer) clearTimeout(debuggerSearchTimer)
	debuggerSearchTimer = setTimeout(() => {
		selectedDebuggerId.value = ''
		loadDebuggerUsers()
	}, 300)
}

const confirmDebugger = () => {
	const user = debuggerOptions.value.find(item => String(item.id) === String(selectedDebuggerId.value))
	if (!user) {
		uni.showToast({ title: '请选择调试人', icon: 'none' })
		return
	}
	debuggerUser.value = { ...user }
	closeDebuggerPopup()
}

const deleteDebugger = () => {
	debuggerUser.value = {}
}

const openPartnerPopup = async () => {
	showPartnerPopup.value = true
	selectedUserId.value = ''
	partnerKeyword.value = ''
	loadPartnerUsers()
}

const loadPartnerUsers = async () => {
	partnerLoading.value = true
	try {
		const users = await uni.$api.selfDeptUser({ name: partnerKeyword.value })
		const records = users?.records || users
		userOptions.value = Array.isArray(records) ? records.map(normalizeUser) : []
	} catch (e) {
		userOptions.value = []
	} finally {
		partnerLoading.value = false
	}
}

const closePartnerPopup = () => {
	showPartnerPopup.value = false
}

const selectUser = item => {
	selectedUserId.value = item.id
}

const handlePartnerSearch = () => {
	if (partnerSearchTimer) clearTimeout(partnerSearchTimer)
	partnerSearchTimer = setTimeout(() => {
		selectedUserId.value = ''
		loadPartnerUsers()
	}, 300)
}

const confirmPartner = () => {
	const user = userOptions.value.find(item => String(item.id) === String(selectedUserId.value))
	if (!user) {
		uni.showToast({ title: '请选择合作人员', icon: 'none' })
		return
	}
	const exists = partners.value.find(item => String(item.id) === String(user.id))
	if (!exists) {
		partners.value.push({ ...user })
	}
	closePartnerPopup()
}

const deletePartner = id => {
	partners.value = partners.value.filter(item => item.id !== id)
}

const submit = async () => {
	if (!form.value.machineId) {
		uni.showToast({ title: '请选择机器', icon: 'none' })
		return
	}
	if (!form.value.num) {
		uni.showToast({ title: '请输入完成数量', icon: 'none' })
		return
	}
	try {
		const fileId = await uploadImage()
		await uni.$api.completeProduction({
			id: craftId.value,
			orderId: orderId.value,
			machineId: form.value.machineId,
			num: Number(form.value.num),
			fry: form.value.fry,
			completeRemark: form.value.completeRemark,
			completeImgRemark: fileId || form.value.completeImgRemark,
			fileId,
			debugger: debuggerUser.value.id || '',
			userList: partners.value.map(item => ({ id: item.id }))
		})
		uni.showToast({ title: '已完成', icon: 'none' })
		setTimeout(() => {
			returnAfterComplete()
		}, 700)
	} catch (e) {
		uni.showToast({ title: e?.message || '完成生产失败', icon: 'none' })
	}
}

const goProduction = () => {
	const url = `/pages/production/index${orderId.value ? `?orderId=${orderId.value}` : ''}`
	uni.redirectTo({
		url,
		fail: () => {
			uni.reLaunch({ url })
		}
	})
}

const returnAfterComplete = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack({
			delta: 1,
			fail: goProduction
		})
		return
	}
	goProduction()
}

const goBack = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		setTimeout(() => {
			if (typeof window !== 'undefined' && window.location.hash.includes('/pages/productionComplete/index')) {
				goProduction()
			}
		}, 300)
		return
	}
	goProduction()
}

onLoad(options => {
	craftId.value = options.id || ''
	orderId.value = options.orderId || ''
	loadMachines()
})
</script>

<style lang="scss" scoped>
.complete-page{
	min-height: 100vh;
	padding-bottom: 150rpx;
	background: #f7f7f7;
	color: #2c2c2c;
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
.form-section,
.partner-section{
	background: #fff;
	padding: 32rpx 34rpx 38rpx;
}
.machine-row{
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 76rpx;
}
.form-row{
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 76rpx;
}
.label{
	color: #333;
	font-size: 30rpx;
	line-height: 42rpx;
}
.right-value{
	display: flex;
	align-items: center;
	gap: 10rpx;
	min-width: 0;
	color: #c9c9c9;
	font-size: 28rpx;
	.value{
		color: #333;
	}
	.arrow{
		color: #333;
		font-size: 42rpx;
		font-weight: 300;
		line-height: 1;
	}
}
.num-field{
	flex: 1;
	height: 76rpx;
	color: #333;
	font-size: 28rpx;
	text-align: right;
}
.fry-radio-group{
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 42rpx;
	flex: 1;
}
.fry-radio{
	display: flex;
	align-items: center;
	gap: 10rpx;
	color: #333;
	font-size: 28rpx;
	line-height: 40rpx;
}
.divider-line{
	height: 1rpx;
	margin: 28rpx 0 34rpx;
	background: #eeeeee;
}
.field-block{
	display: flex;
	flex-direction: column;
}
.remark{
	width: 100%;
	height: 86rpx;
	margin-top: 22rpx;
	color: #333;
	font-size: 28rpx;
	line-height: 38rpx;
}
.placeholder{
	color: #c9c9c9;
}
.image-row{
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-top: 14rpx;
}
.upload-box,
.image-item,
.image-placeholder{
	width: 132rpx;
	height: 132rpx;
	border-radius: 8rpx;
}
.upload-box{
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f7f7f7;
	color: #222;
	font-size: 52rpx;
	font-weight: 300;
}
.image-placeholder{
	background: #d8d8d8;
}
.image-item{
	position: relative;
	overflow: hidden;
	background: #f2f2f2;
	image{
		width: 100%;
		height: 100%;
		display: block;
	}
}
.remove-image{
	position: absolute;
	right: 0;
	top: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36rpx;
	height: 36rpx;
	border-bottom-left-radius: 8rpx;
	background: rgba(0, 0, 0, .55);
	color: #fff;
	font-size: 28rpx;
	line-height: 1;
}
.gap{
	height: 16rpx;
	background: #f7f7f7;
}
.section-title{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}
.debugger-title{
	margin-bottom: 16rpx;
}
.debugger-card{
	margin-bottom: 34rpx;
}
.title-left{
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 34rpx;
	line-height: 48rpx;
}
.mark{
	width: 8rpx;
	height: 30rpx;
	border-radius: 8rpx;
	background: #1f7cff;
}
.add-icon{
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28rpx;
	height: 28rpx;
	border-radius: 50%;
	background: #1f7cff;
	color: #fff;
	font-size: 28rpx;
	line-height: 28rpx;
}
.partner-card{
	position: relative;
	display: flex;
	align-items: flex-start;
	min-height: 96rpx;
	margin-top: 16rpx;
	padding: 24rpx 64rpx 22rpx 24rpx;
	border-radius: 12rpx;
	background: #f7f7f7;
}
.avatar{
	width: 42rpx;
	height: 42rpx;
	margin-top: 6rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #6d89b8, #f3c0c5);
}
.partner-info{
	flex: 1;
	margin-left: 12rpx;
}
.name{
	color: #333;
	font-size: 29rpx;
}
.phone,
.num{
	color: #a4a4a4;
	font-size: 28rpx;
}
.phone{
	margin-left: 10rpx;
}
.num{
	margin-top: 12rpx;
}
.delete{
	position: absolute;
	right: 24rpx;
	top: 28rpx;
	color: #ff3347;
	font-size: 26rpx;
}
.machine-popup{
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100%;
	max-height: 76vh;
	padding: 34rpx 34rpx calc(42rpx + env(safe-area-inset-bottom));
	border-radius: 24rpx 24rpx 0 0;
	background: #fff;
	box-sizing: border-box;
	overflow-y: auto;
}
.machine-option{
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 92rpx;
	border-bottom: 1rpx solid #eeeeee;
	color: #333;
	font-size: 29rpx;
	line-height: 42rpx;
}
.empty-state{
	padding: 50rpx 0;
	color: #b8b8b8;
	font-size: 28rpx;
	text-align: center;
}
.bottom-bar{
	position: fixed;
	left: 50%;
	bottom: 34rpx;
	width: 100%;
	max-width: 390px;
	padding: 0 34rpx;
	transform: translateX(-50%);
	box-sizing: border-box;
}
.confirm-btn{
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
.popup-mask{
	position: fixed;
	left: 50%;
	top: 0;
	z-index: 30;
	width: 100%;
	max-width: 390px;
	height: 100vh;
	transform: translateX(-50%);
	background: rgba(0, 0, 0, .38);
}
.partner-popup{
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	max-height: 86vh;
	padding: 34rpx 34rpx 100rpx;
	border-radius: 28rpx 28rpx 0 0;
	background: #fff;
	box-sizing: border-box;
	overflow-y: auto;
}
.popup-title{
	margin-bottom: 26rpx;
}
.search-box{
	margin-bottom: 22rpx;
	padding: 0 24rpx;
	border-radius: 12rpx;
	background: #f5f5f5;
}
.search-input{
	width: 100%;
	height: 72rpx;
	color: #333;
	font-size: 28rpx;
	line-height: 72rpx;
}
.select-user-card{
	position: relative;
	min-height: 92rpx;
	margin-top: 16rpx;
	padding: 24rpx;
	border: 2rpx solid transparent;
	border-radius: 14rpx;
	background: #f7f7f7;
	box-sizing: border-box;
}
.select-user-card.selected{
	background: #e7f1ff;
	border-color: #1f7cff;
}
.user-main{
	display: flex;
	align-items: center;
}
.user-avatar{
	flex: 0 0 auto;
	margin-right: 16rpx;
}
.select-name{
	color: #333;
	font-size: 30rpx;
	line-height: 42rpx;
}
.select-phone{
	margin-top: 10rpx;
	color: #9a9a9a;
	font-size: 28rpx;
	line-height: 38rpx;
}
.check{
	position: absolute;
	right: 28rpx;
	top: 28rpx;
	color: #1f7cff;
	font-size: 36rpx;
	line-height: 1;
}
.popup-confirm{
	width: 100%;
	height: 78rpx;
	margin-top: 48rpx;
	border: 0;
	border-radius: 12rpx;
	background: #1f7cff;
	color: #fff;
	font-size: 30rpx;
	line-height: 78rpx;
	&::after{ border: 0; }
}
</style>
