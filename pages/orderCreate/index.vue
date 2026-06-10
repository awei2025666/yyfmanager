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
				<text class="default-text">{{ productFormAmountText }}</text>
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
				<input v-model="craftForm.priceBase" type="digit" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label required">成品数量</text>
				<input v-model="craftForm.orderQuantity" type="number" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label">单位</text>
				<input v-model="craftForm.unit" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label required">单价</text>
				<input v-model="craftForm.unitPrice" type="digit" placeholder="请输入" placeholder-class="placeholder" />
			</view>
			<view class="form-row">
				<text class="label required">客户金额</text>
				<text class="default-text">{{ craftFormCustomerMoneyText }}</text>
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
					<view class="picker-actions">
						<text v-if="pickerType === 'client'" class="picker-add" @click.stop="openClientCreate">新增</text>
						<text class="picker-close" @click="closePicker">×</text>
					</view>
				</view>
				<view v-if="pickerType === 'client'" class="picker-search">
					<input v-model="pickerSearchKeyword" placeholder="请输入单位名称、联系人、电话" placeholder-class="placeholder" />
				</view>
				<scroll-view scroll-y class="picker-list">
					<view v-if="!filteredPickerOptions.length" class="picker-empty">暂无数据</view>
					<view class="picker-item" v-for="item in filteredPickerOptions" :key="item.key" @click="selectPickerItem(item)">
						<view class="picker-main">{{ item.label }}</view>
						<view v-if="item.subLabel" class="picker-sub">{{ item.subLabel }}</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<view v-if="showClientCreate" class="dialog-mask" @click="closeClientCreate">
			<view class="client-dialog" @click.stop>
				<view class="dialog-head">
					<text>新增单位</text>
					<text class="dialog-close" @click="closeClientCreate">×</text>
				</view>
				<scroll-view scroll-y class="dialog-body">
					<view class="dialog-row">
						<text class="label required">单位名称</text>
						<input v-model="clientForm.name" placeholder="请输入单位名称" placeholder-class="placeholder" />
					</view>
					<view class="dialog-row">
						<text class="label required">联系人</text>
						<input v-model="clientForm.contact" placeholder="请输入联系人" placeholder-class="placeholder" />
					</view>
					<view class="dialog-row">
						<text class="label required">联系方式</text>
						<input v-model="clientForm.phone" placeholder="请输入联系方式" placeholder-class="placeholder" />
					</view>
					<view class="dialog-row">
						<text class="label">客户类型</text>
						<picker :range="customerTypes" range-key="label" :value="clientTypeIndex" @change="handleClientTypeChange">
							<view class="dialog-value">{{ clientTypeText || '请选择' }}</view>
						</picker>
					</view>
					<view class="dialog-row">
						<text class="label">业务员</text>
						<picker :range="salesOptions" range-key="label" :value="salesIndex" @change="handleSalesChange">
							<view class="dialog-value">{{ salesText || '请选择' }}</view>
						</picker>
					</view>
					<view class="dialog-row">
						<text class="label">单位地址</text>
						<input v-model="clientForm.address" placeholder="请输入单位地址" placeholder-class="placeholder" />
					</view>
					<view class="dialog-textarea">
						<text class="label">备注</text>
						<textarea v-model="clientForm.remark" placeholder="请输入备注" placeholder-class="placeholder" />
					</view>
				</scroll-view>
				<view class="dialog-footer">
					<button class="dialog-cancel" @click="closeClientCreate">取消</button>
					<button class="dialog-submit" :disabled="clientSaving" @click="submitClientCreate">{{ clientSaving ? '保存中...' : '保存' }}</button>
				</view>
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
const customerTypes = [
	{ label: '月结客户', value: '1' },
	{ label: '现结客户', value: '2' },
	{ label: '供应商', value: '3' },
	{ label: '货运站代收', value: '4' }
]
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
const salesOptions = ref([])
const craftOptions = ref([])
const showPicker = ref(false)
const showClientCreate = ref(false)
const clientSaving = ref(false)
const pickerType = ref('')
const pickerTitle = ref('')
const pickerOptions = ref([])
const pickerSearchKeyword = ref('')
const productForm = reactive({
	name: '',
	trimmedSize: '',
	orderQuantity: '',
	unit: ''
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
const clientForm = reactive({
	name: '',
	contact: '',
	phone: '',
	customerType: '',
	sales: '',
	address: '',
	remark: ''
})
const zeroIfEmpty = value => (value === '' || value === null || value === undefined ? 0 : value)
const toFixed4Number = value => Number(Number(value || 0).toFixed(4))
const computedCraftCustomerAmount = (craft = {}) => {
	const finishNum = Number(zeroIfEmpty(craft.finishNum ?? craft.orderQuantity))
	const price = Number(zeroIfEmpty(craft.price ?? craft.unitPrice))
	const startPrice = Number(zeroIfEmpty(craft.startPrice ?? craft.priceBase))
	return toFixed4Number(Math.max(finishNum * price, startPrice))
}
const isCraftOfProduct = (craft = {}, product = {}) => {
	const productValues = [product.localId, product.id, product.productId, product.name, product.productName]
		.map(value => String(value || ''))
		.filter(Boolean)
	const craftValues = [craft.productLocalId, craft.productId, craft.productName, craft.name]
		.map(value => String(value || ''))
		.filter(Boolean)
	return craftValues.some(value => productValues.includes(value))
}
const productCraftAmount = product => crafts.value
	.filter(craft => isCraftOfProduct(craft, product))
	.reduce((sum, craft) => sum + computedCraftCustomerAmount(craft), 0)
const productFormAmountText = computed(() => '自动计算')
const craftFormCustomerMoney = computed(() => computedCraftCustomerAmount(craftForm))
const craftFormCustomerMoneyText = computed(() => craftFormCustomerMoney.value ? craftFormCustomerMoney.value : '自动计算')
const filteredPickerOptions = computed(() => {
	if (pickerType.value !== 'client') return pickerOptions.value
	const keyword = pickerSearchKeyword.value.trim().toLowerCase()
	if (!keyword) return pickerOptions.value
	return pickerOptions.value.filter(item => {
		const text = [
			item.label,
			item.subLabel,
			item.value?.companyName,
			item.value?.name,
			item.value?.linkman,
			item.value?.phone
		].filter(Boolean).join(' ').toLowerCase()
		return text.includes(keyword)
	})
})
const clientTypeIndex = computed(() => Math.max(0, customerTypes.findIndex(item => item.value === clientForm.customerType)))
const clientTypeText = computed(() => customerTypes.find(item => item.value === clientForm.customerType)?.label || '')
const salesIndex = computed(() => Math.max(0, salesOptions.value.findIndex(item => String(item.value) === String(clientForm.sales))))
const salesText = computed(() => salesOptions.value.find(item => String(item.value) === String(clientForm.sales))?.label || '')

const formatProductCard = item => {
	return [item.trimmedSize, item.orderQuantity, productCraftAmount(item) ? `¥${productCraftAmount(item)}` : ''].filter(Boolean).join('*') || '-'
}

const formatCraftCard = item => {
	return [
		item.name,
		item.orderQuantity,
		item.unitPrice ? `¥${item.unitPrice}` : '',
		computedCraftCustomerAmount(item) ? `¥${computedCraftCustomerAmount(item)}` : ''
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
	pickerSearchKeyword.value = ''
	showPicker.value = true
}

const closePicker = () => {
	showPicker.value = false
}

const resetClientForm = () => {
	clientForm.name = ''
	clientForm.contact = ''
	clientForm.phone = ''
	clientForm.customerType = ''
	clientForm.sales = ''
	clientForm.address = ''
	clientForm.remark = ''
}

const getUserRecords = data => {
	const records = data?.records || data?.list || data
	return Array.isArray(records) ? records : []
}

const loadSalesOptions = async () => {
	try {
		const data = await uni.$api.userAll({ name: '' })
		salesOptions.value = getUserRecords(data).map(item => ({
			label: item.name || item.userName || item.nickname || '-',
			value: String(item.id || item.userId || item.name || '')
		})).filter(item => item.value)
	} catch (e) {
		salesOptions.value = []
	}
}

const openClientCreate = async () => {
	resetClientForm()
	showClientCreate.value = true
	if (!salesOptions.value.length) await loadSalesOptions()
}

const closeClientCreate = () => {
	if (clientSaving.value) return
	showClientCreate.value = false
}

const handleClientTypeChange = event => {
	const item = customerTypes[Number(event.detail.value)]
	clientForm.customerType = item?.value || ''
}

const handleSalesChange = event => {
	const item = salesOptions.value[Number(event.detail.value)]
	clientForm.sales = item?.value || ''
}

const fillClientForm = client => {
	form.cooperativeClientId = client.id
	form.companyName = client.companyName || client.name || ''
	form.linkman = client.linkman || client.contact || ''
	form.phone = client.phone || ''
	form.companyAddress = client.companyAddress || client.address || ''
}

const submitClientCreate = async () => {
	if (!clientForm.name) return uni.showToast({ title: '请输入单位名称', icon: 'none' })
	if (!clientForm.contact) return uni.showToast({ title: '请输入联系人', icon: 'none' })
	if (!clientForm.phone) return uni.showToast({ title: '请输入联系方式', icon: 'none' })
	if (clientSaving.value) return
	clientSaving.value = true
	try {
		const payload = {
			companyName: clientForm.name,
			userId: clientForm.sales || undefined,
			type: clientForm.customerType || undefined,
			linkman: clientForm.contact,
			phone: clientForm.phone,
			companyAddress: clientForm.address,
			remark: clientForm.remark
		}
		const created = await uni.$api.cooperativeClientAdd(payload)
		const createdId = typeof created === 'string' || typeof created === 'number'
			? created
			: (created?.id || created?.cooperativeClientId || '')
		const latest = getRecords(await uni.$api.cooperativeClientAll({ companyName: '' }))
		clientOptions.value = latest
		const selected = latest.find(item => String(item.id) === String(createdId))
			|| latest.find(item => item.companyName === payload.companyName && item.phone === payload.phone)
			|| {
				...payload,
				id: createdId,
				companyName: payload.companyName
			}
		fillClientForm(selected)
		uni.showToast({ title: '新增成功', icon: 'none' })
		showClientCreate.value = false
		closePicker()
	} catch (e) {
		uni.showToast({ title: e?.message || '新增失败', icon: 'none' })
	} finally {
		clientSaving.value = false
	}
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
	form.deliveryDate = date
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
		money: 0
	})
	resetProduct()
}

const resetProduct = () => {
	productForm.name = ''
	productForm.trimmedSize = ''
	productForm.orderQuantity = ''
	productForm.unit = ''
}

const removeProduct = index => {
	const product = products.value[index]
	products.value.splice(index, 1)
	if (!product) return
	crafts.value = crafts.value.filter(craft => !isCraftOfProduct(craft, product))
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
		fillClientForm(client)
	}
	if (pickerType.value === 'deliveryType') {
		form.deliveryType = item.value
	}
	if (pickerType.value === 'product') {
		const product = item.value || {}
		craftForm.productLocalId = product.localId || ''
		craftForm.productName = product.name || ''
	}
	if (pickerType.value === 'craft') {
		const craft = item.value || {}
		craftForm.craftId = craft.id
		craftForm.name = craft.name || craft.craftName || ''
		craftForm.specification = craft.spec || craft.specification || craft.formatSize || craftForm.specification || ''
		craftForm.priceBase = zeroIfEmpty(craft.startPrice ?? craft.priceBase ?? craft.basePrice ?? craft.startingPrice)
		craftForm.unit = craft.unit || craftForm.unit || ''
		craftForm.formatSize = craft.openNum ?? craft.openCount ?? craft.formatSize ?? craft.numberPerEdition ?? craftForm.formatSize
		craftForm.unitPrice = zeroIfEmpty(craft.price ?? craft.unitPrice ?? craftForm.unitPrice)
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
		customerMoney: craftFormCustomerMoney.value,
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

const buildCraftPayload = craft => ({
	craftId: craft.craftId || undefined,
	productName: craft.productName,
	unit: craft.unit,
	priceBase: Number(craft.priceBase || 0),
	startPrice: Number(craft.priceBase || 0),
	formatSize: Number(craft.formatSize || 0),
	openNum: Number(craft.formatSize || 0),
	name: craft.name,
	craftName: craft.name,
	orderQuantity: Number(craft.orderQuantity || 0),
	finishNum: Number(craft.orderQuantity || 0),
	remark: craft.remark,
	specification: craft.specification,
	spec: craft.specification,
	unitPrice: Number(craft.unitPrice || 0),
	price: Number(craft.unitPrice || 0),
	customerMoney: computedCraftCustomerAmount(craft),
	customerAmount: computedCraftCustomerAmount(craft)
})

const orderTotalAmount = () => products.value.reduce((sum, product) => sum + productCraftAmount(product), 0)

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
	payMoney: orderTotalAmount(),
	totalMoney: orderTotalAmount(),
	productList: products.value.map(product => ({
		amount: productCraftAmount(product),
		money: productCraftAmount(product),
		name: product.name,
		productName: product.name,
		orderQuantity: Number(product.orderQuantity || 0),
		quantity: Number(product.orderQuantity || 0),
		trimmedSize: product.trimmedSize,
		finishedSpec: product.trimmedSize,
		unit: product.unit,
		craftList: crafts.value
			.filter(craft => craft.productLocalId === product.localId || craft.productName === product.name)
			.map(buildCraftPayload)
	})),
	craftList: crafts.value.map(buildCraftPayload)
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
.picker-actions{
	display: flex;
	align-items: center;
	gap: 28rpx;
}
.picker-add{
	color: #1f7cff;
	font-size: 28rpx;
	font-weight: 500;
	line-height: 1;
}
.picker-search{
	padding: 20rpx 32rpx;
	border-bottom: 1rpx solid #eeeeee;
	input{
		width: 100%;
		height: 72rpx;
		padding: 0 22rpx;
		border: 1rpx solid #d8d8d8;
		border-radius: 8rpx;
		background: #fff;
		color: #222;
		font-size: 28rpx;
		box-sizing: border-box;
	}
}
.picker-list{
	max-height: 48vh;
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
.dialog-mask{
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 120;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 32rpx;
	background: rgba(0, 0, 0, 0.38);
	box-sizing: border-box;
}
.client-dialog{
	width: 100%;
	max-width: 360px;
	max-height: 82vh;
	border-radius: 18rpx;
	background: #fff;
	overflow: hidden;
}
.dialog-head{
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 92rpx;
	padding: 0 28rpx;
	border-bottom: 1rpx solid #eeeeee;
	color: #222;
	font-size: 31rpx;
	font-weight: 600;
}
.dialog-close{
	color: #999;
	font-size: 42rpx;
	font-weight: 300;
	line-height: 1;
}
.dialog-body{
	max-height: 56vh;
	padding: 0 28rpx;
	box-sizing: border-box;
}
.dialog-row{
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 96rpx;
	border-bottom: 1rpx solid #eeeeee;
	gap: 24rpx;
	.label{
		flex: 0 0 auto;
		color: #333;
		font-size: 28rpx;
	}
	input,
	picker{
		flex: 1;
		min-width: 0;
		text-align: right;
		color: #222;
		font-size: 28rpx;
	}
}
.dialog-value{
	color: #999;
	text-align: right;
	font-size: 28rpx;
	line-height: 96rpx;
}
.dialog-textarea{
	padding: 24rpx 0;
	.label{
		display: block;
		margin-bottom: 16rpx;
		color: #333;
		font-size: 28rpx;
	}
	textarea{
		width: 100%;
		height: 132rpx;
		color: #222;
		font-size: 28rpx;
		box-sizing: border-box;
	}
}
.dialog-footer{
	display: flex;
	gap: 20rpx;
	padding: 22rpx 28rpx 28rpx;
	border-top: 1rpx solid #eeeeee;
	button{
		flex: 1;
		height: 76rpx;
		border-radius: 8rpx;
		color: #fff;
		font-size: 28rpx;
		line-height: 76rpx;
	}
	.dialog-cancel{
		background: #cfcfcf;
	}
	.dialog-submit{
		background: #1f7cff;
	}
}
</style>
