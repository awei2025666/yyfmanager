<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import { crudModuleConfigs, crudModuleSeeds } from '../config/crudModules'

const props = defineProps({
  moduleKey: {
    type: String,
    required: true
  }
})

const config = crudModuleConfigs[props.moduleKey]
const seedRows = crudModuleSeeds[props.moduleKey] || []
const sequence = ref(seedRows.length + 1)
const dataset = ref(JSON.parse(JSON.stringify(seedRows)))
const dialogVisible = ref(false)
const detailVisible = ref(false)
const resetPasswordVisible = ref(false)
const pickerVisible = ref(false)
const currentDetail = ref(null)
const activeDetailTab = ref(config.detailTabs?.[0]?.key || '')
const currentTree = ref(config.treeData?.[0]?.value || '全部')
const treeKeyword = ref('')
const activePickerKey = ref('')
const activePickerFieldKey = ref('')
const pickerSingleSelection = ref(null)
const pickerMultipleSelection = ref([])
const formState = reactive({})
const resetPasswordState = reactive({
  password: '',
  confirmPassword: ''
})
const filters = reactive(
  Object.fromEntries((config.searchFields || []).map((field) => [field.key, '']))
)
const pickerFilters = reactive({})

const fieldDefaults = {
  input: '',
  textarea: '',
  select: '',
  radio: '',
  date: '',
  number: 0,
  checkbox: []
}

const normalizeForm = () => {
  Object.keys(formState).forEach((key) => delete formState[key])
  config.formFields.forEach((field) => {
    const baseValue = field.defaultValue ?? fieldDefaults[field.type] ?? ''
    formState[field.key] = Array.isArray(baseValue) ? [...baseValue] : baseValue
  })
  formState.id = null
}

normalizeForm()

const detailFields = computed(() => {
  if (config.detailFields) return config.detailFields
  if (config.detailSections?.length) return []
  return config.formFields
})
const detailTabs = computed(() => config.detailTabs || [])
const detailSections = computed(() => config.detailSections || [])
const detailDialogWidth = computed(() => config.detailDialogWidth || (detailTabs.value.length || detailSections.value.length ? '1180px' : '760px'))
const detailSummaryText = computed(() => config.detailSummaryText || '')
const footerHint = computed(() => config.footerHint || '')
const secondaryActionText = computed(() => config.secondaryActionText || '')
const summaryText = computed(() => config.summaryText || '')
const rowActions = computed(() => config.rowActions || ['详情', '编辑', '删除'])
const gridColumns = computed(() => Math.min(Math.max(config.searchFields.length, 2), 4))
const detailFooterActions = computed(() => config.detailFooterActions || ['编辑'])
const activePickerConfig = computed(() => config.pickers?.[activePickerKey.value] || null)
const pickerSelectionCount = computed(() => {
  if (!activePickerConfig.value) return 0
  return activePickerConfig.value.multiple ? pickerMultipleSelection.value.length : (pickerSingleSelection.value ? 1 : 0)
})
const pickerSelectionPreview = computed(() => {
  if (!activePickerConfig.value) return []
  if (activePickerConfig.value.multiple) {
    return pickerMultipleSelection.value.map((row) => resolvePickerDisplay(row, activePickerConfig.value, activePickerFieldKey.value))
  }
  return pickerSingleSelection.value ? [resolvePickerDisplay(pickerSingleSelection.value, activePickerConfig.value, activePickerFieldKey.value)] : []
})
const sourceRowsMap = computed(() => ({
  staff: crudModuleSeeds.staff || [],
  accounts: crudModuleSeeds.accounts || [],
  receivableOrders: (crudModuleSeeds.receivableOrders || []).map((item) => ({
    ...item,
    status: item.status || item.orderStatus
  }))
}))

const toNumber = (value) => Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0
const formatMoney = (value) => `¥${toNumber(value).toFixed(2)}`
const resolvePickerDisplay = (row, picker, fieldKey) => {
  if (!row) return ''
  const displayKey = picker?.displayKey || fieldKey
  return row[displayKey] ?? row.name ?? row.label ?? row[fieldKey] ?? ''
}

const pickerRows = computed(() => {
  const picker = activePickerConfig.value
  if (!picker) return []

  let rows = picker.rows || sourceRowsMap.value[picker.source] || []
  if (!rows.length && props.moduleKey === 'deliveryNotes') {
    if (activePickerKey.value === 'driver') {
      rows = sourceRowsMap.value.staff.filter((item) => {
        const roleText = normalizeForMatch(item.roleText)
        return roleText.includes('物流') || roleText.includes('配送')
      })
    }

    if (activePickerKey.value === 'deliveryOrder') {
      rows = sourceRowsMap.value.receivableOrders
    }
  }

  return rows.filter((row) =>
    (picker.searchable || []).every((field) => {
      const filterValue = pickerFilters[field.key]
      if (!filterValue) return true
      return normalizeForMatch(row[field.key]).includes(normalizeForMatch(filterValue))
    })
  )
})

const normalizeForMatch = (value) => {
  if (Array.isArray(value)) return value.join('、')
  if (typeof value === 'boolean') return value ? '启用' : '禁用'
  return String(value ?? '')
}

const filteredTreeData = computed(() => {
  if (!config.treeData) return []
  const keyword = treeKeyword.value.trim()
  if (!keyword) return config.treeData

  const walk = (nodes) =>
    nodes
      .map((node) => {
        const children = node.children ? walk(node.children) : []
        const matched = node.label.includes(keyword)
        if (matched || children.length) return { ...node, children }
        return null
      })
      .filter(Boolean)

  return walk(config.treeData)
})

const filteredRows = computed(() =>
  dataset.value.filter((item) => {
    if (config.treeKey && currentTree.value && currentTree.value !== '全部' && item[config.treeKey] !== currentTree.value) {
      return false
    }

    return (config.searchFields || []).every((field) => {
      const filterValue = filters[field.key]
      if (filterValue === '' || filterValue === undefined || filterValue === null) return true
      return normalizeForMatch(item[field.key]).includes(normalizeForMatch(filterValue))
    })
  })
)

const activeFilterList = computed(() => {
  const items = (config.searchFields || [])
    .filter((field) => filters[field.key] !== '' && filters[field.key] !== undefined && filters[field.key] !== null)
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: normalizeForMatch(filters[field.key])
    }))

  if (config.treeKey && currentTree.value && currentTree.value !== '全部') {
    items.unshift({
      key: '__tree__',
      label: config.treeTitle || '分类',
      value: currentTree.value
    })
  }

  return items
})

const metricCards = computed(() => {
  const rows = filteredRows.value
  return [
    { label: '当前条数', value: rows.length },
    { label: '总条数', value: dataset.value.length },
    { label: '最近更新', value: rows[0]?.updatedAt || '-' }
  ]
})
const resultCountText = computed(() => `共 ${filteredRows.value.length} 条数据`)

const optionLabel = (option) => (typeof option === 'object' ? option.label : option)
const optionValue = (option) => (typeof option === 'object' ? option.value : option)
const actionTone = (action) => {
  if (action === '删除') return 'danger'
  if (action === '编辑') return 'warning'
  if (action === '打印') return 'success'
  return 'primary'
}
const sectionCountText = (section, detail) => {
  if (!detail) return ''
  if (section.columns) return `共 ${(detail[section.dataKey] || []).length} 条`
  if (section.timelineKey) return `共 ${(detail[section.timelineKey] || []).length} 条`
  if (section.fields) return `共 ${section.fields.length} 项`
  return ''
}

const renderValue = (value) => {
  if (Array.isArray(value)) return value.join('、') || '-'
  if (typeof value === 'boolean') return value ? '启用' : '禁用'
  return value || '-'
}

const bannerType = (value) => {
  if (['已生产', '已完成', '已配送'].includes(value)) return 'success'
  if (['待生产', '待配送'].includes(value)) return 'danger'
  if (['配送中', '生产中'].includes(value)) return 'warning'
  return 'info'
}

const tagType = (value) => {
  if (['启用', '已通过', '已生产', '已接收', '已转出', '已完成'].includes(value)) return 'success'
  if (['禁用', '已驳回'].includes(value)) return 'danger'
  if (['待审批', '待接收', '待转出', '待生产', '待配送'].includes(value)) return 'warning'
  if (['配送中', '系统入库', '收入'].includes(value)) return 'primary'
  return 'info'
}

const syncRowStatus = (row) => {
  if (typeof row.status === 'boolean') {
    row.updatedAt = '2026-04-21 15:30'
    ElMessage.success(`状态已${row.status ? '启用' : '禁用'}`)
  }
}

const resetFilters = () => {
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
}

const resetPickerState = () => {
  pickerSingleSelection.value = null
  pickerMultipleSelection.value = []
  Object.keys(pickerFilters).forEach((key) => {
    pickerFilters[key] = ''
  })
}

const openPicker = (field) => {
  const pickerKey = field.picker
  const picker = config.pickers?.[pickerKey]
  if (!picker) return

  activePickerKey.value = pickerKey
  activePickerFieldKey.value = field.key
  resetPickerState()

  const currentValue = formState[field.key]
  if (picker.multiple) {
    const relationKey = picker.dataKey || `${field.key}Rows`
    pickerMultipleSelection.value = Array.isArray(formState[relationKey])
      ? JSON.parse(JSON.stringify(formState[relationKey]))
      : []
  } else if (currentValue) {
    const matchedRow = pickerRows.value.find((item) => normalizeForMatch(resolvePickerDisplay(item, picker, field.key)).includes(normalizeForMatch(currentValue)))
    pickerSingleSelection.value = matchedRow || null
  } else if (!picker.multiple && picker.dataKey && formState[picker.dataKey]) {
    pickerSingleSelection.value = JSON.parse(JSON.stringify(formState[picker.dataKey]))
  }

  ;(picker.searchable || []).forEach((searchField) => {
    pickerFilters[searchField.key] = ''
  })

  pickerVisible.value = true
}

const resetPickerFilters = () => {
  Object.keys(pickerFilters).forEach((key) => {
    pickerFilters[key] = ''
  })
}

const removePickerSelection = (index) => {
  if (!activePickerConfig.value) return
  if (activePickerConfig.value.multiple) {
    pickerMultipleSelection.value.splice(index, 1)
  } else {
    pickerSingleSelection.value = null
  }
}

const clearFilter = (key) => {
  if (key === '__tree__') {
    currentTree.value = '全部'
    return
  }
  filters[key] = ''
}

const isPickerRowSelected = (row) => {
  const picker = activePickerConfig.value
  if (!picker) return false
  if (picker.multiple) {
    return pickerMultipleSelection.value.some((item) => item.id === row.id)
  }
  return pickerSingleSelection.value?.id === row.id
}

const togglePickerRow = (row) => {
  const picker = activePickerConfig.value
  if (!picker) return

  if (picker.multiple) {
    const index = pickerMultipleSelection.value.findIndex((item) => item.id === row.id)
    if (index >= 0) {
      pickerMultipleSelection.value.splice(index, 1)
    } else {
      pickerMultipleSelection.value.push(JSON.parse(JSON.stringify(row)))
    }
    return
  }

  pickerSingleSelection.value = row
}

const confirmPicker = () => {
  const picker = activePickerConfig.value
  const fieldKey = activePickerFieldKey.value
  if (!picker || !fieldKey) return

  if (activePickerKey.value === 'driver') {
    if (!pickerSingleSelection.value) {
      ElMessage.warning('请选择司机')
      return
    }

    formState[fieldKey] = pickerSingleSelection.value.name
    formState.driverRows = [JSON.parse(JSON.stringify(pickerSingleSelection.value))]
  }

  if (activePickerKey.value === 'deliveryOrder') {
    if (!pickerMultipleSelection.value.length) {
      ElMessage.warning('请选择订单')
      return
    }

    const selectedRows = JSON.parse(JSON.stringify(pickerMultipleSelection.value))
    formState[fieldKey] = selectedRows.map((item) => item.productInfo).join('、')
    formState.deliveryOrders = selectedRows.map((item) => ({
      id: item.id,
      orderNo: item.orderNo,
      customer: item.customer,
      orderTime: item.orderTime,
      filler: item.filler,
      productInfo: item.productInfo,
      amount: item.amount,
      orderStatus: item.status,
      status: '待配送'
    }))
    formState.progress = `0/${selectedRows.length}`
    if (!formState.filler) {
      formState.filler = selectedRows[0]?.filler || ''
    }
  }

  if (activePickerKey.value === 'applicant' || activePickerKey.value === 'collector') {
    if (!pickerSingleSelection.value) {
      ElMessage.warning(`请选择${activePickerConfig.value.title.replace('选择', '')}`)
      return
    }

    formState[fieldKey] = pickerSingleSelection.value.name
    formState[picker.dataKey || `${fieldKey}Row`] = JSON.parse(JSON.stringify(pickerSingleSelection.value))
  }

  if (activePickerKey.value === 'account') {
    if (!pickerSingleSelection.value) {
      ElMessage.warning('请选择账户')
      return
    }

    formState[fieldKey] = pickerSingleSelection.value.name
    formState[picker.dataKey || `${fieldKey}Row`] = JSON.parse(JSON.stringify(pickerSingleSelection.value))
  }

  if (activePickerKey.value === 'receiptOrder') {
    if (!pickerMultipleSelection.value.length) {
      ElMessage.warning('请选择订单')
      return
    }

    const selectedRows = JSON.parse(JSON.stringify(pickerMultipleSelection.value))
    const customers = [...new Set(selectedRows.map((item) => item.customer))]
    formState[fieldKey] = selectedRows.map((item) => item.productInfo).join('、')
    formState.customer = customers.join('、')
    formState.receiptOrders = selectedRows.map((item) => ({
      id: item.id,
      orderNo: item.orderNo,
      orderTime: item.orderTime,
      filler: item.filler,
      productInfo: item.productInfo,
      receivableAmount: item.amount,
      receivedAmount: item.received,
      arrearsAmount: item.unpaid,
      status: item.status,
      currentAmount: item.unpaid,
      currentDiscount: '¥0.00'
    }))
    formState.amount = selectedRows.reduce((total, item) => total + toNumber(item.unpaid), 0)
    if (!formState.discount) {
      formState.discount = 0
    }
  }

  pickerVisible.value = false
}

const openCreate = () => {
  normalizeForm()
  dialogVisible.value = true
}

const openEdit = (row) => {
  normalizeForm()
  Object.assign(formState, JSON.parse(JSON.stringify(row)))
  dialogVisible.value = true
}

const openDetail = (row) => {
  currentDetail.value = JSON.parse(JSON.stringify(row))
  activeDetailTab.value = detailTabs.value[0]?.key || ''
  detailVisible.value = true
}

const openResetPassword = (row) => {
  currentDetail.value = row
  resetPasswordState.password = ''
  resetPasswordState.confirmPassword = ''
  resetPasswordVisible.value = true
}

const save = () => {
  const payload = JSON.parse(JSON.stringify(formState))
  payload.updatedAt = '2026-04-21 15:30'

  if (Array.isArray(payload.role)) {
    payload.roleText = payload.role.join('、')
  }

  ;['amount', 'discount', 'originPrice', 'unitPrice', 'price'].forEach((key) => {
    if (typeof payload[key] === 'number' && !Number.isNaN(payload[key])) {
      payload[key] = formatMoney(payload[key])
    }
  })

  if (typeof payload.status === 'boolean') {
    payload.statusText = payload.status ? '启用' : '禁用'
  }

  if (payload.id) {
    const index = dataset.value.findIndex((item) => item.id === payload.id)
    dataset.value[index] = { ...dataset.value[index], ...payload }
  } else {
    payload.id = sequence.value
    if (payload.userId === undefined && props.moduleKey === 'staff') {
      payload.userId = 8000 + sequence.value
    }
    sequence.value += 1
    dataset.value.unshift(payload)
  }

  dialogVisible.value = false
  ElMessage.success('保存成功')
}

const saveResetPassword = () => {
  if (!resetPasswordState.password || !resetPasswordState.confirmPassword) {
    ElMessage.warning('请填写完整密码信息')
    return
  }

  if (resetPasswordState.password !== resetPasswordState.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  if (currentDetail.value) {
    currentDetail.value.loginPassword = resetPasswordState.password
  }
  resetPasswordVisible.value = false
  ElMessage.success('密码已重置')
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除“${row[config.columns[0].key]}”吗？`, '删除确认', {
    type: 'warning'
  })
  dataset.value = dataset.value.filter((item) => item.id !== row.id)
  ElMessage.success('删除成功')
}

const handleAction = (row, action) => {
  if (action === '详情') return openDetail(row)
  if (action === '编辑') return openEdit(row)
  if (action === '删除') return remove(row)
  if (action === '重置密码') return openResetPassword(row)
  if (action === '打印') return ElMessage.success('已发送到打印队列')
  if (action === '返单') return ElMessage.success('已触发返单流程')
  return null
}

const handleTreeClick = (node) => {
  currentTree.value = node.value
}

const mainRowClassName = ({ rowIndex }) => (rowIndex % 2 === 1 ? 'table-row--striped' : '')
const pickerRowClassName = ({ row }) => (isPickerRowSelected(row) ? 'table-row--selected' : '')
</script>

<template>
  <div class="page-stack">
    <section class="summary-grid">
      <article v-for="item in metricCards" :key="item.label" class="summary-card">
        <p>{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <div v-if="config.treeData" class="module-layout">
      <PageBlock class="side-panel" :title="config.treeTitle || '分类'">
        <el-input v-model="treeKeyword" placeholder="请输入" :prefix-icon="Search" />
        <el-tree
          class="module-tree"
          :data="filteredTreeData"
          node-key="value"
          :expand-on-click-node="false"
          default-expand-all
          @node-click="handleTreeClick"
        >
          <template #default="{ data }">
            <span class="tree-label" :class="{ active: currentTree === data.value }">{{ data.label }}</span>
          </template>
        </el-tree>
      </PageBlock>

      <PageBlock class="content-panel" :title="config.title" :subtitle="config.subtitle">
        <div class="filter-grid" :style="{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }">
          <div v-for="field in config.searchFields" :key="field.key" class="field-stack">
            <p class="field-stack__label">{{ field.label }}</p>
            <el-input
              v-if="field.type === 'input'"
              v-model="filters[field.key]"
              :placeholder="field.placeholder || `请输入${field.label}`"
            />
            <el-select
              v-else
              v-model="filters[field.key]"
              :placeholder="field.placeholder || `请选择${field.label}`"
              clearable
            >
              <el-option
                v-for="option in field.options"
                :key="`${field.key}-${optionValue(option)}`"
                :label="optionLabel(option)"
                :value="optionValue(option)"
              />
            </el-select>
          </div>
        </div>

        <div class="action-row">
          <div class="action-row__left">
            <el-button type="primary" :icon="Plus" @click="openCreate">{{ config.createText }}</el-button>
            <el-button v-if="secondaryActionText" plain>{{ secondaryActionText }}</el-button>
          </div>
          <div class="action-row__right">
            <el-button type="primary" :icon="Search">查询</el-button>
            <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
          </div>
        </div>

        <div v-if="summaryText || footerHint" class="tips-row">
          <div v-if="summaryText" class="summary-text">{{ summaryText }}</div>
          <div v-if="footerHint" class="footer-hint">{{ footerHint }}</div>
        </div>

        <div v-if="activeFilterList.length" class="filter-tags">
          <span class="filter-tags__label">当前筛选</span>
          <el-tag
            v-for="item in activeFilterList"
            :key="item.key"
            closable
            effect="plain"
            @close="clearFilter(item.key)"
          >
            {{ item.label }}：{{ item.value }}
          </el-tag>
        </div>

        <div class="table-toolbar">
          <strong>{{ resultCountText }}</strong>
        </div>

        <el-table :data="filteredRows" :row-class-name="mainRowClassName">
          <template #empty>
            <div class="table-empty table-empty--main">
              <strong>暂无数据</strong>
              <p>可以调整筛选条件，或先新增一条内容</p>
            </div>
          </template>
          <el-table-column
            v-for="column in config.columns"
            :key="column.key"
            :prop="column.key"
            :label="column.label"
            min-width="120"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <el-tag v-if="column.tag" :type="tagType(renderValue(row[column.key]))">{{ renderValue(row[column.key]) }}</el-tag>
              <el-switch
                v-else-if="column.switch"
                v-model="row[column.key]"
                inline-prompt
                active-text="开"
                inactive-text="关"
                @change="syncRowStatus(row)"
              />
              <span v-else>{{ renderValue(row[column.key]) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="240" fixed="right">
            <template #default="{ row }">
              <el-space wrap>
                <el-button
                  v-for="action in rowActions"
                  :key="action"
                  link
                  class="row-action"
                  :class="`row-action--${actionTone(action)}`"
                  :type="actionTone(action)"
                  @click="handleAction(row, action)"
                >
                  {{ action }}
                </el-button>
              </el-space>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager-mock">
          <el-button text class="pager-mock__btn"><</el-button>
          <el-button type="primary" plain class="pager-mock__btn pager-mock__btn--active">1</el-button>
          <el-button text class="pager-mock__btn">2</el-button>
          <el-button text class="pager-mock__btn">3</el-button>
          <el-button text class="pager-mock__btn">4</el-button>
          <el-button text class="pager-mock__btn">5</el-button>
          <span>...</span>
          <el-button text class="pager-mock__btn">100</el-button>
          <el-button text class="pager-mock__btn">></el-button>
        </div>
      </PageBlock>
    </div>

    <PageBlock v-else :title="config.title" :subtitle="config.subtitle">
      <div class="filter-grid" :style="{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }">
        <div v-for="field in config.searchFields" :key="field.key" class="field-stack">
          <p class="field-stack__label">{{ field.label }}</p>
          <el-input
            v-if="field.type === 'input'"
            v-model="filters[field.key]"
            :placeholder="field.placeholder || `请输入${field.label}`"
          />
          <el-select
            v-else
            v-model="filters[field.key]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            clearable
          >
            <el-option
              v-for="option in field.options"
              :key="`${field.key}-${optionValue(option)}`"
              :label="optionLabel(option)"
              :value="optionValue(option)"
            />
          </el-select>
        </div>
      </div>

      <div class="action-row">
        <div class="action-row__left">
          <el-button type="primary" :icon="Plus" @click="openCreate">{{ config.createText }}</el-button>
          <el-button v-if="secondaryActionText" plain>{{ secondaryActionText }}</el-button>
        </div>
        <div class="action-row__right">
          <el-button type="primary" :icon="Search">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        </div>
      </div>

      <div v-if="summaryText || footerHint" class="tips-row">
        <div v-if="summaryText" class="summary-text">{{ summaryText }}</div>
        <div v-if="footerHint" class="footer-hint">{{ footerHint }}</div>
      </div>

      <div v-if="activeFilterList.length" class="filter-tags">
        <span class="filter-tags__label">当前筛选</span>
        <el-tag
          v-for="item in activeFilterList"
          :key="item.key"
          closable
          effect="plain"
          @close="clearFilter(item.key)"
        >
          {{ item.label }}：{{ item.value }}
        </el-tag>
      </div>

      <div class="table-toolbar">
        <strong>{{ resultCountText }}</strong>
      </div>

      <el-table :data="filteredRows" :row-class-name="mainRowClassName">
        <template #empty>
          <div class="table-empty table-empty--main">
            <strong>暂无数据</strong>
            <p>可以调整筛选条件，或先新增一条内容</p>
          </div>
        </template>
        <el-table-column
          v-for="column in config.columns"
          :key="column.key"
          :prop="column.key"
          :label="column.label"
          min-width="120"
          show-overflow-tooltip
          >
          <template #default="{ row }">
            <el-tag v-if="column.tag" :type="tagType(renderValue(row[column.key]))">{{ renderValue(row[column.key]) }}</el-tag>
            <el-switch
              v-else-if="column.switch"
              v-model="row[column.key]"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="syncRowStatus(row)"
            />
            <span v-else>{{ renderValue(row[column.key]) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220" fixed="right">
          <template #default="{ row }">
            <el-space wrap>
              <el-button
                v-for="action in rowActions"
                :key="action"
                link
                class="row-action"
                :class="`row-action--${actionTone(action)}`"
                :type="actionTone(action)"
                @click="handleAction(row, action)"
              >
                {{ action }}
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

    </PageBlock>

    <el-dialog
      v-model="dialogVisible"
      :title="formState.id ? `编辑${config.title}` : config.createText + config.title.replace('管理', '')"
      :width="config.dialogWidth || '760px'"
      class="module-dialog"
    >
      <div class="form-grid" :class="{ wide: config.dialogWidth === '1080px' }">
        <div
          v-for="field in config.formFields"
          :key="field.key"
          class="field-stack"
          :class="{ 'form-grid__full': field.type === 'textarea' || field.type === 'checkbox' }"
        >
          <p class="field-stack__label field-stack__label--dark">{{ field.label }}</p>
          <el-input
            v-if="field.type === 'input'"
            v-model="formState[field.key]"
            :placeholder="field.placeholder || `请输入${field.label}`"
          />
          <div v-else-if="field.type === 'picker'" class="picker-field">
            <el-input
              :model-value="formState[field.key]"
              :placeholder="field.placeholder || `请选择${field.label}`"
              readonly
            />
            <el-button type="primary" plain @click="openPicker(field)">选择</el-button>
          </div>
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="formState[field.key]"
            :min="0"
            controls-position="right"
          />
          <el-select
            v-else-if="field.type === 'select'"
            v-model="formState[field.key]"
            :placeholder="field.placeholder || `请选择${field.label}`"
          >
            <el-option
              v-for="option in field.options"
              :key="`${field.key}-${optionValue(option)}`"
              :label="optionLabel(option)"
              :value="optionValue(option)"
            />
          </el-select>
          <el-radio-group v-else-if="field.type === 'radio'" v-model="formState[field.key]" class="radio-group">
            <el-radio v-for="option in field.options" :key="option" :label="option">{{ option }}</el-radio>
          </el-radio-group>
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="formState[field.key]"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="年/月/日"
          />
          <el-checkbox-group v-else-if="field.type === 'checkbox'" v-model="formState[field.key]" class="checkbox-group">
            <el-checkbox v-for="option in field.options" :key="option" :label="option">{{ option }}</el-checkbox>
          </el-checkbox-group>
          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="formState[field.key]"
            :rows="4"
            type="textarea"
            :placeholder="field.placeholder || `请输入${field.label}`"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" :title="`${config.title}详情`" :width="detailDialogWidth" class="module-dialog module-dialog--detail">
      <template v-if="currentDetail">
        <div
          v-if="config.detailStatusKey && currentDetail[config.detailStatusKey]"
          class="detail-banner"
          :class="`detail-banner--${bannerType(renderValue(currentDetail[config.detailStatusKey]))}`"
        >
          {{ renderValue(currentDetail[config.detailStatusKey]) }}
        </div>

        <div class="detail-grid">
          <div v-for="field in detailFields" :key="field.key" class="detail-item">
            <p>{{ field.label }}</p>
            <strong>{{ renderValue(currentDetail[field.key]) }}</strong>
          </div>
        </div>

        <div v-if="detailSections.length" class="detail-section-stack">
          <section v-for="section in detailSections" :key="section.title" class="detail-section">
            <div class="detail-section__head">
              <h4>{{ section.title }}</h4>
              <span class="detail-section__meta">{{ sectionCountText(section, currentDetail) }}</span>
            </div>

            <div v-if="section.fields" class="detail-grid">
              <div v-for="field in section.fields" :key="`${section.title}-${field.key}`" class="detail-item">
                <p>{{ field.label }}</p>
                <strong>{{ renderValue(currentDetail[field.key]) }}</strong>
              </div>
            </div>

            <el-table v-else-if="section.columns" :data="currentDetail[section.dataKey] || []">
              <template #empty>
                <div class="table-empty">
                  <strong>暂无记录</strong>
                  <p>当前模块还没有相关明细</p>
                </div>
              </template>
              <el-table-column
                v-for="column in section.columns"
                :key="`${section.title}-${column.key}`"
                :prop="column.key"
                :label="column.label"
                min-width="130"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <el-tag v-if="column.tag" :type="tagType(renderValue(row[column.key]))">{{ renderValue(row[column.key]) }}</el-tag>
                  <span v-else>{{ renderValue(row[column.key]) }}</span>
                </template>
              </el-table-column>
            </el-table>

            <div v-else-if="section.timelineKey" class="timeline-stack">
              <div v-for="(item, index) in currentDetail[section.timelineKey] || []" :key="`${section.timelineKey}-${index}`" class="timeline-item">
                <div class="timeline-date">{{ item.date }}</div>
                <div class="timeline-card">
                  <h5>{{ item.title }}</h5>
                  <p>{{ item.description }}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div v-if="detailSummaryText" class="detail-summary">
          {{ detailSummaryText }}
        </div>

        <el-tabs v-if="detailTabs.length" v-model="activeDetailTab" class="detail-tabs">
          <el-tab-pane v-for="tab in detailTabs" :key="tab.key" :label="tab.label" :name="tab.key">
            <el-table :data="currentDetail[tab.key] || []">
              <template #empty>
                <div class="table-empty">
                  <strong>暂无记录</strong>
                  <p>当前标签页还没有明细数据</p>
                </div>
              </template>
              <el-table-column
                v-for="column in tab.columns"
                :key="column.key"
                :prop="column.key"
                :label="column.label"
                min-width="130"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <el-tag v-if="column.tag" :type="tagType(renderValue(row[column.key]))">{{ renderValue(row[column.key]) }}</el-tag>
                  <span v-else>{{ renderValue(row[column.key]) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">返回</el-button>
        <el-button
          v-for="action in detailFooterActions"
          :key="`detail-${action}`"
          type="primary"
          plain
          @click="handleAction(currentDetail, action)"
        >
          {{ action }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetPasswordVisible" title="重置密码" width="620px" class="module-dialog">
      <div class="form-grid single-column">
        <template v-for="field in config.resetPasswordFields || []" :key="field.key">
          <el-input v-model="resetPasswordState[field.key]" :placeholder="field.label" show-password />
        </template>
      </div>
      <template #footer>
        <el-button @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" @click="saveResetPassword">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pickerVisible" :title="activePickerConfig?.title || '选择'" width="1180px" class="module-dialog module-dialog--picker">
      <template v-if="activePickerConfig">
        <div class="picker-toolbar">
          <div>
            <p class="picker-toolbar__label">已选内容</p>
            <strong class="picker-toolbar__value">已选择 {{ pickerSelectionCount }} 项</strong>
          </div>
          <div v-if="pickerSelectionPreview.length" class="picker-tags">
            <el-tag
              v-for="(item, index) in pickerSelectionPreview"
              :key="`${item}-${index}`"
              closable
              effect="plain"
              @close="removePickerSelection(index)"
            >
              {{ item }}
            </el-tag>
          </div>
        </div>

        <div
          class="filter-grid"
          :style="{ gridTemplateColumns: `repeat(${Math.min(Math.max(activePickerConfig.searchable?.length || 1, 2), 4)}, minmax(0, 1fr))` }"
        >
          <div v-for="field in activePickerConfig.searchable || []" :key="field.key" class="field-stack">
            <p class="field-stack__label">{{ field.label }}</p>
            <el-input v-model="pickerFilters[field.key]" :placeholder="field.placeholder || '请输入'" />
          </div>
        </div>

        <div class="action-row">
          <div class="action-row__left" />
          <div class="action-row__right">
            <el-button type="primary" :icon="Search">查询</el-button>
            <el-button :icon="Refresh" @click="resetPickerFilters">重置</el-button>
          </div>
        </div>

        <el-table :data="pickerRows" :row-class-name="pickerRowClassName" @row-click="togglePickerRow">
          <template #empty>
            <div class="table-empty">
              <strong>暂无匹配数据</strong>
              <p>可以调整搜索条件后再试一次</p>
            </div>
          </template>
          <el-table-column v-if="activePickerConfig.multiple" width="64" align="center">
            <template #default="{ row }">
              <el-checkbox :model-value="isPickerRowSelected(row)" @click.stop @change="togglePickerRow(row)" />
            </template>
          </el-table-column>
          <el-table-column v-else width="64" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="togglePickerRow(row)">
                {{ isPickerRowSelected(row) ? '已选' : '选择' }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            v-for="column in activePickerConfig.columns"
            :key="`${activePickerKey}-${column.key}`"
            :prop="column.key"
            :label="column.label"
            min-width="130"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <el-tag v-if="column.tag" :type="tagType(renderValue(row[column.key]))">{{ renderValue(row[column.key]) }}</el-tag>
              <span v-else>{{ renderValue(row[column.key]) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template #footer>
        <el-button @click="pickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPicker">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.summary-card {
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: rgba(255, 255, 255, 0.9);
}

.summary-card p {
  margin: 0;
  color: #6f7a8f;
}

.summary-card strong {
  display: block;
  margin-top: 12px;
  font-size: 28px;
}

.module-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
}

.side-panel,
.content-panel {
  min-height: 100%;
}

.module-tree {
  margin-top: 16px;
}

.tree-label {
  color: #50607d;
}

.tree-label.active {
  color: #2563eb;
  font-weight: 700;
}

.filter-grid,
.form-grid,
.detail-grid {
  display: grid;
  gap: 12px;
}

.filter-grid {
  margin-bottom: 16px;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid.wide {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-grid.single-column {
  grid-template-columns: 1fr;
}

.form-grid :deep(.el-input-number),
.form-grid :deep(.el-select),
.form-grid :deep(.el-date-editor),
.filter-grid :deep(.el-select),
.radio-group,
.checkbox-group,
.picker-field {
  width: 100%;
}

.picker-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.picker-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
  border: 1px solid rgba(191, 219, 254, 0.9);
}

.picker-toolbar__label {
  margin: 0 0 6px;
  color: #6f7a8f;
  font-size: 13px;
}

.picker-toolbar__value {
  color: #111827;
  font-size: 18px;
}

.picker-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.table-empty {
  padding: 28px 0;
  text-align: center;
  color: #6f7a8f;
}

.table-empty--main {
  padding: 42px 0;
}

.table-empty strong {
  display: block;
  margin-bottom: 6px;
  color: #111827;
  font-size: 16px;
}

.table-empty p {
  margin: 0;
}

.form-grid__full {
  grid-column: 1 / -1;
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-stack__label {
  margin: 0;
  color: #98a2b3;
  font-size: 14px;
  font-weight: 600;
}

.field-stack__label--dark {
  color: #475467;
}

.action-row,
.tips-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.action-row {
  margin-bottom: 18px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 12px;
}

.table-toolbar strong {
  color: #111827;
  font-size: 14px;
}

.row-action {
  padding: 4px 10px;
  border-radius: 999px;
}

.row-action--primary {
  background: rgba(59, 130, 246, 0.08);
}

.row-action--warning {
  background: rgba(245, 158, 11, 0.12);
}

.row-action--success {
  background: rgba(34, 197, 94, 0.12);
}

.row-action--danger {
  background: rgba(239, 68, 68, 0.1);
}

.action-row__left,
.action-row__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tips-row {
  margin: 0 0 18px;
}

.filter-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0 0 18px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid rgba(219, 234, 254, 0.95);
}

.filter-tags__label {
  color: #6f7a8f;
  font-size: 13px;
  font-weight: 700;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 18px;
}

.detail-banner {
  margin-bottom: 18px;
  padding: 18px 24px;
  border-radius: 18px;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.detail-banner--danger {
  background: #ff3158;
}

.detail-banner--success {
  background: #38c457;
}

.detail-banner--warning {
  background: #f59e0b;
}

.detail-banner--info {
  background: #64748b;
}

.detail-item {
  padding: 14px 16px;
  border-radius: 16px;
  background: #f7f9fd;
}

.detail-item p {
  margin: 0 0 8px;
  color: #6f7a8f;
  font-size: 12px;
}

.detail-tabs {
  margin-top: 12px;
}

.detail-section-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-section {
  padding: 18px;
  border-radius: 18px;
  background: #fbfcff;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.detail-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-section h4 {
  margin: 0;
  font-size: 18px;
  color: #111827;
}

.detail-section__meta {
  color: #6f7a8f;
  font-size: 13px;
  font-weight: 700;
}

.detail-summary {
  margin-top: 18px;
  text-align: right;
  font-size: 18px;
  font-weight: 700;
  color: #f59e0b;
}

.timeline-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.timeline-date {
  color: #98a2b3;
  font-size: 15px;
  line-height: 1.8;
}

.timeline-card {
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: #fff;
}

.timeline-card h5 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #111827;
}

.timeline-card p {
  margin: 0;
  color: #667085;
  line-height: 1.7;
}

.summary-text {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.footer-hint {
  font-size: 15px;
  font-weight: 700;
  color: #ef4444;
  white-space: pre-wrap;
}

.pager-mock {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  color: #6f7a8f;
  padding: 12px 14px;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.pager-mock__btn {
  min-width: 34px;
  height: 34px;
  border-radius: 10px;
}

.pager-mock__btn--active {
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.14);
}

.filter-grid :deep(.el-input__wrapper),
.filter-grid :deep(.el-select__wrapper),
.form-grid :deep(.el-input__wrapper),
.form-grid :deep(.el-select__wrapper),
.form-grid :deep(.el-textarea__inner),
.form-grid :deep(.el-input-number),
.form-grid :deep(.el-date-editor.el-input),
.form-grid :deep(.el-date-editor.el-input__wrapper) {
  border-radius: 16px;
}

.module-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

.module-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 22px 28px 18px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.module-dialog :deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.module-dialog :deep(.el-dialog__body) {
  padding: 24px 28px;
  background: #fcfdff;
}

.module-dialog :deep(.el-dialog__footer) {
  padding: 16px 28px 22px;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  background: #fff;
}

.module-dialog :deep(.el-dialog__footer .el-button + .el-button) {
  margin-left: 10px;
}

:deep(.el-table) {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

:deep(.el-table td.el-table__cell) {
  border-bottom-color: rgba(241, 245, 249, 0.95);
}

:deep(.el-table th.el-table__cell) {
  background: #f8fbff;
  color: #475467;
  font-weight: 700;
}

:deep(.el-table .table-row--striped td.el-table__cell) {
  background: #fcfdff;
}

:deep(.el-table .table-row--selected td.el-table__cell) {
  background: #eef4ff;
}

@media (max-width: 1280px) {
  .module-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1080px) {
  .summary-grid,
  .filter-grid,
  .detail-grid,
  .form-grid,
  .form-grid.wide {
    grid-template-columns: 1fr;
  }

  .picker-toolbar {
    flex-direction: column;
  }

  .picker-tags {
    justify-content: flex-start;
  }

  .timeline-item {
    grid-template-columns: 1fr;
  }
}
</style>
