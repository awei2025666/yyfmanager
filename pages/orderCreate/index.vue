<template>
	<view class="create-page">
		<view class="create-nav">
	
			<view class="nav-row">
				<view class="back" @click="goBack">‹</view>
				<text>一键开单</text>
		
			</view>
		</view>

		<view class="steps">
			<view :class="['step', currentStep >= 1 ? 'active' : '', currentStep > 1 ? 'done' : '']">
				<view class="dot"><text v-if="currentStep > 1">✓</text></view>
				<view class="label">第一步</view>
			</view>
			<view :class="['line', currentStep > 1 ? 'active-line' : '']"></view>
			<view :class="['step', currentStep >= 2 ? 'active' : '', currentStep > 2 ? 'done' : '']">
				<view class="dot"><text v-if="currentStep > 2">✓</text></view>
				<view class="label">第二步</view>
			</view>
			<view :class="['line', currentStep > 2 ? 'active-line' : '']"></view>
			<view :class="['step', currentStep >= 3 ? 'active' : '']">
				<view class="dot"></view>
				<view class="label">第三步</view>
			</view>
		</view>

		<view class="gap"></view>

		<view v-if="currentStep === 1" class="section">
			<view class="section-title">
				<view class="mark"></view>
				<text>订单信息</text>
			</view>

			<view class="form-row" @click="openClientPicker">
				<text class="label required">单位名称</text>
				<view class="value">
					<text>{{ form.companyName || '请选择' }}</text>
					<u-icon name="arrow-right" color="#333" size="30"></u-icon>
				</view>
			</view>

			<view class="form-row">
				<text class="label required">审批模式</text>
				<view class="radio-group">
					<view :class="['radio', form.approvalMode === 1 ? 'checked' : '']" @click="form.approvalMode = 1"></view>
					<text>人工审批</text>
					<view :class="['radio', form.approvalMode === 2 ? 'checked' : '']" @click="form.approvalMode = 2"></view>
					<text>自动审批</text>
				</view>
			</view>

			<view class="divider"></view>

			<picker mode="date" :value="deliveryDateValue" @change="handleDeliveryDateChange">
				<view class="form-row">
					<text class="label required">交货日期</text>
					<view class="value muted">
						<text>{{ form.deliveryDate || '请选择' }}</text>
						<u-icon name="arrow-right" color="#333" size="30"></u-icon>
					</view>
				</view>
			</picker>

			<view class="form-row" @click="openDeliveryTypePicker">
				<text class="label required">交货方式</text>
				<view class="value muted">
					<text>{{ deliveryTypeText || '请选择' }}</text>
					<u-icon name="arrow-right" color="#333" size="30"></u-icon>
				</view>
			</view>

			<view class="textarea-block">
				<text class="label">印刷要求</text>
				<textarea v-model="form.printingRequirements" placeholder="请输入" placeholder-class="placeholder" />
			</view>

			<view class="textarea-block">
				<text class="label">备注</text>
				<textarea v-model="form.remark" placeholder="请输入" placeholder-class="placeholder" />
			</view>
		</view>

		<view v-else-if="currentStep === 2" class="section product-section">
			<view class="section-title product-title">
				<view class="title-left">
					<view class="mark"></view>
					<text>产品信息</text>
				</view>
				<view class="add-dot" @click="addProduct">+</view>
			</view>

			<view class="product-card" v-for="(item,index) in products" :key="index">
				<view class="product-info">
					<view class="product-name">{{ item.name || '-' }}</view>
					<view class="product-spec">{{ formatProductCard(item) }}</view>
				</view>
				<view class="delete" @click="removeProduct(index)">
					<u-icon name="trash" color="#ff4d4f" size="30"></u-icon>
				</view>
			</view>

			<view class="form-row">
				<text class="label required">产品名称</text>
				<input v-model="productForm.name" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label">产品规格</text>
				<input v-model="productForm.trimmedSize" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label required">订货数量</text>
				<input v-model="productForm.orderQuantity" type="number" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label">单位</text>
				<input v-model="productForm.unit" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label required">金额</text>
				<input v-model="productForm.money" type="digit" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="inline-actions">
				<button class="save" @click="saveProduct">保存</button>
				<button class="ghost" @click="resetProduct">取消</button>
			</view>
		</view>

		<view v-else class="section product-section">
			<view class="section-title product-title">
				<view class="title-left">
					<view class="mark"></view>
					<text>工艺信息</text>
				</view>
				<view class="add-dot" @click="addCraft">+</view>
			</view>
			<view class="product-card" v-for="(item,index) in crafts" :key="index">
				<view class="product-info">
					<view class="product-name">{{ item.productName || '-' }}</view>
					<view class="product-spec">
						{{ formatCraftCard(item) }}<text v-if="item.remark" class="danger">{{ item.remark }}</text>
					</view>
				</view>
				<view class="delete" @click="removeCraft(index)">
					<u-icon name="trash" color="#ff4d4f" size="30"></u-icon>
				</view>
			</view>
			<view class="form-row" @click="openProductPicker">
				<text class="label required">产品名称</text>
				<view class="value muted">
					<text>{{ craftForm.productName || '请选择' }}</text>
					<u-icon name="arrow-right" color="#333" size="30"></u-icon>
				</view>
			</view>
			<view class="form-row" @click="openCraftPicker">
				<text class="label required">工艺名称</text>
				<view class="value muted">
					<text>{{ craftForm.name || '请选择' }}</text>
					<u-icon name="arrow-right" color="#333" size="30"></u-icon>
				</view>
			</view>
			<view class="form-row">
				<text class="label">规格</text>
				<input v-model="craftForm.specification" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label required">每版个数</text>
				<input v-model="craftForm.formatSize" type="number" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label">起价</text>
				<text class="default-text">{{ craftForm.priceBase || '默认带出' }}</text>
			</view>
			<view class="form-row">
				<text class="label required">成品数量</text>
				<input v-model="craftForm.orderQuantity" type="number" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label">单位</text>
				<text class="default-text">{{ craftForm.unit || '默认带出' }}</text>
			</view>
			<view class="form-row">
				<text class="label required">单价</text>
				<input v-model="craftForm.unitPrice" type="digit" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label required">客户金额</text>
				<input v-model="craftForm.customerMoney" type="digit" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="textarea-block compact">
				<text class="label">备注</text>
				<textarea v-model="craftForm.remark" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="inline-actions">
				<button class="save" @click="saveCraft">保存</button>
				<button class="ghost" @click="resetCraft">取消</button>
			</view>
		</view>

		<view class="footer">
			<button class="cancel" @click="handleBack">{{ currentStep === 1 ? '取消' : '上一步' }}</button>
			<button class="next" @click="handleNext">{{ currentStep === 3 ? '提交订单' : '下一步' }}</button>
		</view>

		<view v-if="showPicker" class="picker-mask" @click="closePicker">
			<view class="picker-panel" @click.stop>
				<view class="picker-head">
					<text>{{ pickerTitle }}</text>
					<text class="picker-close" @click="closePicker">×</text>
				</view>
				<scroll-view scroll-y class="picker-list">
					<view v-if="!pickerOptions.length" class="picker-empty">暂无数据</view>
					<view class="picker-item" v-for="item in pickerOptions" :key="item.key" @click="selectPickerItem(item)">
						<view class="picker-main">{{ item.label }}</view>
						<view v-if="item.subLabel" class="picker-sub">{{ item.subLabel }}</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const currentStep = ref(1)
const deliveryTypeMap = {
	1: '自提',
	2: '发货',
	3: '送货',
	4: '客运'
}
const deliveryTypeOptions = Object.entries(deliveryTypeMap).map(([value, label]) => ({
	key: value,
	value: Number(value),
	label
}))
const form = reactive({
	cooperativeClientId: '',
	companyName: '',
	linkman: '',
	phone: '',
	companyAddress: '',
	approvalMode: 1,
	deliveryDate: '',
	deliveryType: '',
	printingRequirements: '',
	remark: ''
})
const deliveryTypeText = computed(() => deliveryTypeMap[form.deliveryType])
const deliveryDateValue = computed(() => (form.deliveryDate || '').slice(0, 10))
const products = ref([])
const crafts = ref([])
const clientOptions = ref([])
const craftOptions = ref([])
const showPicker = ref(false)
const pickerType = ref('')
const pickerTitle = ref('')
const pickerOptions = ref([])
const productForm = reactive({
	name: '',
	trimmedSize: '',
	orderQuantity: '',
	unit: '',
	money: ''
})
const craftForm = reactive({
	productLocalId: '',
	productName: '',
	craftId: '',
	name: '',
	specification: '',
	formatSize: '',
	priceBase: '',
	unit: '',
	orderQuantity: '',
	unitPrice: '',
	customerMoney: '',
	remark: ''
})

const formatProductCard = item => {
	return [item.trimmedSize, item.orderQuantity, item.money ? `¥${item.money}` : ''].filter(Boolean).join('*') || '-'
}

const formatCraftCard = item => {
	return [
		item.name,
		item.orderQuantity,
		item.unitPrice ? `¥${item.unitPrice}` : '',
		item.customerMoney ? `¥${item.customerMoney}` : ''
	].filter(Boolean).join('*') || '-'
}

const getRecords = data => {
	const records = data?.records || data?.list || data
	return Array.isArray(records) ? records : []
}

const openPicker = (type, title, options) => {
	pickerType.value = type
	pickerTitle.value = title
	pickerOptions.value = options
	showPicker.value = true
}

const closePicker = () => {
	showPicker.value = false
}

const openClientPicker = async () => {
	try {
		if (!clientOptions.value.length) {
			clientOptions.value = getRecords(await uni.$api.cooperativeClientAll({ companyName: '' }))
		}
		openPicker('client', '选择单位名称', clientOptions.value.map(item => ({
			key: item.id,
			value: item,
			label: item.companyName || item.name || '-',
			subLabel: [item.linkman, item.phone].filter(Boolean).join('  ')
		})))
	} catch (e) {
		openPicker('client', '选择单位名称', [])
	}
}

const handleDeliveryDateChange = event => {
	const date = event.detail.value
	const time = (form.deliveryDate || '').slice(11) || '20:22:20'
	form.deliveryDate = `${date} ${time}`
}

const openDeliveryTypePicker = () => {
	openPicker('deliveryType', '选择交货方式', deliveryTypeOptions)
}

const addProduct = () => {
	resetProduct()
}

const saveProduct = () => {
	const localId = Date.now()
	products.value.push({
		localId,
		name: productForm.name,
		trimmedSize: productForm.trimmedSize,
		orderQuantity: Number(productForm.orderQuantity || 0),
		unit: productForm.unit,
		money: Number(productForm.money || 0)
	})
	resetProduct()
}

const resetProduct = () => {
	productForm.name = ''
	productForm.trimmedSize = ''
	productForm.orderQuantity = ''
	productForm.unit = ''
	productForm.money = ''
}

const removeProduct = index => {
	products.value.splice(index, 1)
}

const openCraftPicker = async () => {
	try {
		if (!craftOptions.value.length) {
			craftOptions.value = getRecords(await uni.$api.craftAll({ name: '' }))
		}
		openPicker('craft', '选择工艺名称', craftOptions.value.map(item => ({
			key: item.id,
			value: item,
			label: item.name || item.craftName || '-',
			subLabel: [item.unit ? `单位：${item.unit}` : '', item.priceBase ? `起价：${item.priceBase}` : ''].filter(Boolean).join('  ')
		})))
	} catch (e) {
		openPicker('craft', '选择工艺名称', [])
	}
}

const openProductPicker = () => {
	if (!products.value.length) {
		uni.showToast({ title: '请先添加产品信息', icon: 'none' })
		return
	}
	openPicker('product', '选择产品名称', products.value.map(item => ({
		key: item.localId,
		value: item,
		label: item.name || '-',
		subLabel: formatProductCard(item)
	})))
}

const selectPickerItem = item => {
	if (pickerType.value === 'client') {
		const client = item.value || {}
		form.cooperativeClientId = client.id
		form.companyName = client.companyName || client.name || ''
		form.linkman = client.linkman || ''
		form.phone = client.phone || ''
		form.companyAddress = client.companyAddress || ''
	}
	if (pickerType.value === 'deliveryType') {
		form.deliveryType = item.value
	}
	if (pickerType.value === 'product') {
		const product = item.value || {}
		craftForm.productLocalId = product.localId || ''
		craftForm.productName = product.name || ''
		craftForm.orderQuantity = product.orderQuantity || ''
		craftForm.unit = craftForm.unit || product.unit || ''
	}
	if (pickerType.value === 'craft') {
		const craft = item.value || {}
		craftForm.craftId = craft.id
		craftForm.name = craft.name || craft.craftName || ''
		craftForm.priceBase = craft.priceBase || craft.startingPrice || ''
		craftForm.unit = craft.unit || craftForm.unit || ''
		craftForm.formatSize = craft.formatSize || craft.numberPerEdition || ''
	}
	closePicker()
}

const addCraft = () => {
	resetCraft()
}

const saveCraft = () => {
	const product = products.value.find(item => item.localId === craftForm.productLocalId) || products.value[0]
	crafts.value.push({
		productLocalId: product?.localId || '',
		productName: craftForm.productName || product?.name || '',
		craftId: craftForm.craftId,
		name: craftForm.name,
		specification: craftForm.specification,
		formatSize: Number(craftForm.formatSize || 0),
		priceBase: Number(craftForm.priceBase || 0),
		unit: craftForm.unit || '',
		orderQuantity: Number(craftForm.orderQuantity || 0),
		unitPrice: Number(craftForm.unitPrice || 0),
		customerMoney: Number(craftForm.customerMoney || 0),
		remark: craftForm.remark || ''
	})
	resetCraft()
}

const resetCraft = () => {
	craftForm.productLocalId = ''
	craftForm.productName = ''
	craftForm.craftId = ''
	craftForm.name = ''
	craftForm.specification = ''
	craftForm.formatSize = ''
	craftForm.priceBase = ''
	craftForm.unit = ''
	craftForm.orderQuantity = ''
	craftForm.unitPrice = ''
	craftForm.customerMoney = ''
	craftForm.remark = ''
}

const removeCraft = index => {
	crafts.value.splice(index, 1)
}

const handleBack = () => {
	if (currentStep.value === 1) {
		goBack()
		return
	}
	currentStep.value -= 1
}

const handleNext = async () => {
	if (currentStep.value < 3) {
		currentStep.value += 1
		return
	}
	try {
		await uni.$api.orderAdd(buildOrderPayload())
		uni.showToast({ title: '已提交', icon: 'none' })
		setTimeout(() => uni.navigateBack(), 600)
	} catch (e) {}
}

const buildOrderPayload = () => ({
	cooperativeClientId: form.cooperativeClientId,
	companyName: form.companyName,
	linkman: form.linkman,
	phone: form.phone,
	companyAddress: form.companyAddress,
	deliveryDate: form.deliveryDate,
	deliveryType: form.deliveryType,
	printingRequirements: form.printingRequirements,
	remark: form.remark,
	productList: products.value.map(product => ({
		money: Number(product.money || 0),
		name: product.name,
		orderQuantity: Number(product.orderQuantity || 0),
		trimmedSize: product.trimmedSize,
		unit: product.unit,
		craftList: crafts.value
			.filter(craft => craft.productLocalId === product.localId || craft.productName === product.name)
			.map(craft => ({
				craftId: craft.craftId,
				unit: craft.unit,
				priceBase: Number(craft.priceBase || 0),
				formatSize: Number(craft.formatSize || 0),
				name: craft.name,
				orderQuantity: Number(craft.orderQuantity || 0),
				remark: craft.remark,
				specification: craft.specification,
				unitPrice: Number(craft.unitPrice || 0),
				customerMoney: Number(craft.customerMoney || 0)
			}))
	}))
})

const goBack = () => {
	uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.create-page{
	height: 100vh;
	background: #f7f7f7;
	padding-bottom: 150rpx;
	overflow-y: auto;
	box-sizing: border-box;
	color: #262626;
}
.create-nav{
	background: #fff;
	border-bottom: 1rpx solid #e8e8e8;
	.fake-status{
		display: flex;
		align-items: center;
		justify-content: space-between;
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
			color: #333;
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
			color: #333;
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
.steps{
	display: flex;
	align-items: flex-start;
	padding: 48rpx 110rpx 44rpx;
	background: #fff;
	.step{
		display: flex;
		flex-direction: column;
		align-items: center;
		color: #c7c7c7;
		font-size: 27rpx;
		.dot{
			width: 34rpx;
			height: 34rpx;
			border-radius: 50%;
			background: #cfcfcf;
			border: 10rpx solid #cfcfcf;
		}
		.label{
			margin-top: 24rpx;
			white-space: nowrap;
		}
		&.active{
			color: #222;
			.dot{
				background: #fff;
				border-color: #1f7cff;
			}
		}
		&.done{
			.dot{
				display: flex;
				align-items: center;
				justify-content: center;
				background: #1f7cff;
				border-color: #1f7cff;
				color: #fff;
				font-size: 20rpx;
				font-weight: 700;
			}
		}
	}
	.line{
		flex: 1;
		height: 2rpx;
		margin-top: 16rpx;
		background: #e5e5e5;
		&.active-line{
			background: #1f7cff;
		}
	}
}
.gap{
	height: 16rpx;
	background: #f7f7f7;
}
.section{
	background: #fff;
	padding: 42rpx 30rpx 20rpx;
	.section-title{
		display: flex;
		align-items: center;
		gap: 14rpx;
		margin-bottom: 28rpx;
		font-size: 32rpx;
		.mark{
			width: 9rpx;
			height: 34rpx;
			border-radius: 8rpx;
			background: #1f7cff;
		}
	}
}
.product-title{
	justify-content: space-between;
	.title-left{
		display: flex;
		align-items: center;
		gap: 14rpx;
	}
	.add-dot{
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28rpx;
		height: 28rpx;
		border-radius: 50%;
		background: #1f7cff;
		color: #fff;
		font-size: 27rpx;
		line-height: 28rpx;
	}
}
.product-section{
	padding-top: 42rpx;
}
.product-card{
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 32rpx;
	padding: 26rpx 24rpx;
	border-radius: 12rpx;
	background: #f7f7f7;
	.product-name{
		color: #333;
		font-size: 29rpx;
		line-height: 1.45;
	}
	.product-spec{
		margin-top: 14rpx;
		color: #999;
		font-size: 25rpx;
		line-height: 1.45;
		.danger{
			color: #ff3b30;
		}
	}
	.delete{
		display: flex;
		align-items: center;
		justify-content: center;
		padding-left: 20rpx;
	}
}
.form-row{
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 112rpx;
	font-size: 29rpx;
	border-bottom: 1rpx solid #eeeeee;
	.label{
		color: #333;
	}
	.required::before{
		content: "*";
	}
	.value{
		display: flex;
		align-items: center;
		gap: 10rpx;
		color: #c8c8c8;
	}
	input{
		flex: 1;
		text-align: right;
		color: #333;
		font-size: 28rpx;
	}
	.default-text{
		color: #999;
		font-size: 28rpx;
	}
	.radio-group{
		display: flex;
		align-items: center;
		gap: 12rpx;
		color: #333;
		.radio{
			width: 32rpx;
			height: 32rpx;
			border-radius: 50%;
			border: 2rpx solid #e5e5e5;
			&.checked{
				border: 8rpx solid #1f7cff;
			}
		}
	}
}
picker{
	display: block;
}
.divider{
	height: 1rpx;
	background: #e8e8e8;
}
.textarea-block{
	padding-top: 34rpx;
	font-size: 29rpx;
	textarea{
		width: 100%;
		height: 130rpx;
		margin-top: 24rpx;
		color: #333;
		font-size: 28rpx;
	}
	&.compact textarea{
		height: 100rpx;
	}
}
.placeholder{
	color: #c8c8c8;
}
.inline-actions{
	display: flex;
	gap: 20rpx;
	margin-top: 28rpx;
	button{
		flex: 1;
		height: 74rpx;
		border: 0;
		border-radius: 12rpx;
		font-size: 29rpx;
		line-height: 74rpx;
		&::after{
			border: 0;
		}
	}
	.save{
		background: #1f7cff;
		color: #fff;
	}
	.ghost{
		background: #f7f7f7;
		color: #666;
	}
}
.footer{
	position: fixed;
	left: 50%;
	bottom: 0;
	width: 390px;
	transform: translateX(-50%);
	display: flex;
	gap: 20rpx;
	padding: 20rpx 30rpx 38rpx;
	background: #f7f7f7;
	button{
		flex: 1;
		height: 88rpx;
		border: 0;
		border-radius: 14rpx;
		color: #fff;
		font-size: 31rpx;
		line-height: 88rpx;
		&::after{
			border: 0;
		}
	}
	.cancel{
		background: #cfcfcf;
	}
	.next{
		background: #1f7cff;
	}
}
.picker-mask{
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 90;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	background: rgba(0, 0, 0, 0.35);
}
.picker-panel{
	width: 100%;
	max-width: 390px;
	max-height: 72vh;
	border-radius: 22rpx 22rpx 0 0;
	background: #fff;
	overflow: hidden;
}
.picker-head{
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 96rpx;
	padding: 0 32rpx;
	border-bottom: 1rpx solid #eeeeee;
	color: #222;
	font-size: 31rpx;
	font-weight: 600;
}
.picker-close{
	color: #999;
	font-size: 42rpx;
	font-weight: 300;
	line-height: 1;
}
.picker-list{
	max-height: 56vh;
}
.picker-item{
	padding: 24rpx 32rpx;
	border-bottom: 1rpx solid #f0f0f0;
}
.picker-main{
	color: #333;
	font-size: 29rpx;
	line-height: 42rpx;
	word-break: break-all;
}
.picker-sub{
	margin-top: 6rpx;
	color: #999;
	font-size: 25rpx;
	line-height: 34rpx;
	word-break: break-all;
}
.picker-empty{
	padding: 72rpx 0;
	color: #999;
	font-size: 28rpx;
	text-align: center;
}
</style>
