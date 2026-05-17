<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import { crudModuleConfigs } from '../config/crudModules'
import { loadSpecialModuleRows, persistSpecialModuleRow } from '../services/specialModuleData'

const props = defineProps({
  moduleKey: {
    type: String,
    required: true
  }
})

const profiles = {
  receipts: {
    title: '收款信息',
    subtitle: '收款登记、核销明细与回款追踪',
    createText: '新增收款',
    secondaryActionText: '导出收款单',
    theme: 'emerald',
    workflows: ['收款登记', '核销订单', '尾款跟踪'],
    rowActions: ['详情', '编辑', '打印'],
    detailActionText: '开始对接收款接口',
    dialogWidth: '980px',
    searchFields: [
      { key: 'receiptNo', label: '收款单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'collector', label: '收款人' },
      { key: 'account', label: '收款账户' }
    ],
    columns: [
      { key: 'receiptNo', label: '收款单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'collector', label: '收款人' },
      { key: 'account', label: '收款账户' },
      { key: 'linkedOrders', label: '核销订单数' },
      { key: 'amount', label: '收款金额' },
      { key: 'discount', label: '本次折让' },
      { key: 'updatedAt', label: '收款时间' }
    ],
    formFields: [
      { key: 'receiptNo', label: '收款单号', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'collector', label: '收款人', type: 'input' },
      { key: 'account', label: '收款账户', type: 'select', options: ['微信', '支付宝', '公账'] },
      { key: 'amount', label: '收款金额', type: 'input' },
      { key: 'discount', label: '本次折让', type: 'input' },
      { key: 'updatedAt', label: '收款时间', type: 'input' },
      { key: 'remark', label: '摘要说明', type: 'textarea' }
    ],
    sections: [
      {
        title: '收款单信息',
        type: 'grid',
        fields: [
          { key: 'receiptNo', label: '收款单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'collector', label: '收款人' },
          { key: 'account', label: '收款账户' },
          { key: 'amount', label: '收款金额' },
          { key: 'discount', label: '本次折让' },
          { key: 'remark', label: '摘要说明' },
          { key: 'operationTime', label: '操作时间' }
        ]
      },
      {
        title: '核销订单',
        type: 'table',
        dataKey: 'receiptOrders',
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'orderTime', label: '订单时间' },
          { key: 'filler', label: '填单员' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'receivableAmount', label: '应收金额' },
          { key: 'receivedAmount', label: '已收金额' },
          { key: 'arrearsAmount', label: '剩余尾款' },
          { key: 'currentAmount', label: '本次收款' },
          { key: 'currentDiscount', label: '本次折让' }
        ]
      }
    ],
    stats: (rows) => [
      { label: '收款单数', value: rows.length },
      { label: '收款合计', value: sumMoney(rows, 'amount') },
      { label: '折让合计', value: sumMoney(rows, 'discount') },
      { label: '关联订单数', value: rows.reduce((n, item) => n + (item.receiptOrders?.length || 0), 0) }
    ],
    tableHint: '按收款单、账户和核销订单追踪回款情况',
    spotlight: (rows) => ({
      title: '今日回款进度',
      desc: '聚焦收款单、尾款核销与折让控制。',
      items: [
        `待跟进客户 ${rows.filter((item) => item.remark?.includes('首付款')).length} 家`,
        `尾款收齐 ${rows.filter((item) => item.remark?.includes('尾款')).length} 单`,
        `平均每单 ${averageMoney(rows, 'amount')}`
      ]
    })
  },
  reimbursements: {
    title: '报销列表',
    subtitle: '费用申请、报销账户与审批结果',
    createText: '新增报销',
    secondaryActionText: '导出报销单',
    theme: 'rose',
    workflows: ['发起申请', '审批流转', '结果归档'],
    rowActions: ['详情', '编辑', '打印'],
    detailActionText: '开始对接报销接口',
    dialogWidth: '920px',
    searchFields: [
      { key: 'name', label: '报销单号' },
      { key: 'applicant', label: '报销人' },
      { key: 'account', label: '报销账户' },
      { key: 'status', label: '审批状态' }
    ],
    columns: [
      { key: 'name', label: '报销单号' },
      { key: 'applicant', label: '报销人' },
      { key: 'account', label: '报销账户' },
      { key: 'amount', label: '报销金额' },
      { key: 'discount', label: '折让金额' },
      { key: 'status', label: '审批状态', tag: true },
      { key: 'updatedAt', label: '报销时间' },
      { key: 'remark', label: '摘要说明' }
    ],
    formFields: [
      { key: 'name', label: '报销单号', type: 'input' },
      { key: 'applicant', label: '报销人', type: 'input' },
      { key: 'account', label: '报销账户', type: 'select', options: ['微信', '支付宝', '公账'] },
      { key: 'status', label: '审批状态', type: 'select', options: ['待审批', '已通过', '已驳回'] },
      { key: 'amount', label: '报销金额', type: 'input' },
      { key: 'discount', label: '折让金额', type: 'input' },
      { key: 'updatedAt', label: '报销时间', type: 'input' },
      { key: 'remark', label: '费用摘要', type: 'textarea' }
    ],
    sections: [
      {
        title: '报销信息',
        type: 'grid',
        fields: [
          { key: 'name', label: '报销单号' },
          { key: 'applicant', label: '报销人' },
          { key: 'account', label: '报销账户' },
          { key: 'status', label: '审批状态' },
          { key: 'amount', label: '报销金额' },
          { key: 'discount', label: '折让金额' },
          { key: 'remark', label: '费用摘要' },
          { key: 'updatedAt2', label: '操作时间' }
        ]
      },
      {
        title: '审批节点',
        type: 'timeline',
        dataKey: 'approvalTimeline'
      }
    ],
    stats: (rows) => [
      { label: '待审批', value: rows.filter((item) => item.status === '待审批').length },
      { label: '已通过', value: rows.filter((item) => item.status === '已通过').length },
      { label: '已驳回', value: rows.filter((item) => item.status === '已驳回').length },
      { label: '报销合计', value: sumMoney(rows, 'amount') }
    ],
    tableHint: '按报销单、审批状态和账户查看费用申请',
    spotlight: (rows) => ({
      title: '审批关注项',
      desc: '优先处理待审批单据，避免费用滞后。',
      items: [
        `待审批 ${rows.filter((item) => item.status === '待审批').length} 单`,
        `折让合计 ${sumMoney(rows, 'discount')}`,
        `大额报销 ${rows.filter((item) => money(item.amount) >= 1000).length} 单`
      ]
    })
  },
  deliveryNotes: {
    title: '配送单',
    subtitle: '司机安排、配送进度与订单批次',
    createText: '新增配送单',
    secondaryActionText: '导出配送单',
    theme: 'amber',
    workflows: ['司机排班', '订单分配', '配送签收'],
    rowActions: ['详情', '编辑', '打印'],
    detailActionText: '开始对接配送接口',
    dialogWidth: '1080px',
    searchFields: [
      { key: 'deliveryNo', label: '配送单号' },
      { key: 'driver', label: '配送员' },
      { key: 'status', label: '配送状态' },
      { key: 'filler', label: '填单员' }
    ],
    columns: [
      { key: 'deliveryNo', label: '配送单号' },
      { key: 'driver', label: '配送员' },
      { key: 'filler', label: '调度员' },
      { key: 'linkedOrders', label: '配送订单数' },
      { key: 'progress', label: '配送进度' },
      { key: 'status', label: '配送状态', tag: true },
      { key: 'createdAt', label: '创建时间' }
    ],
    formFields: [
      { key: 'deliveryNo', label: '配送单号', type: 'input' },
      { key: 'driver', label: '配送员', type: 'input' },
      { key: 'filler', label: '调度员', type: 'input' },
      { key: 'progress', label: '配送进度', type: 'input' },
      { key: 'status', label: '配送状态', type: 'select', options: ['待配送', '配送中', '已完成'] },
      { key: 'createdAt', label: '创建时间', type: 'input' },
      { key: 'orderInfo', label: '订单摘要', type: 'textarea' }
    ],
    sections: [
      {
        title: '司机信息',
        type: 'table',
        dataKey: 'driverRows',
        columns: [
          { key: 'name', label: '司机姓名' },
          { key: 'phone', label: '联系方式' },
          { key: 'department', label: '所在部门' },
          { key: 'roleText', label: '用户角色' }
        ]
      },
      {
        title: '配送订单',
        type: 'table',
        dataKey: 'deliveryOrders',
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '订单金额' },
          { key: 'orderStatus', label: '订单状态', tag: true },
          { key: 'status', label: '配送状态', tag: true }
        ]
      },
      {
        title: '配送记录',
        type: 'timeline',
        dataKey: 'deliveryTimeline'
      }
    ],
    stats: (rows) => [
      { label: '待配送', value: rows.filter((item) => item.status === '待配送').length },
      { label: '配送中', value: rows.filter((item) => item.status === '配送中').length },
      { label: '已完成', value: rows.filter((item) => item.status === '已完成').length },
      { label: '配送订单量', value: rows.reduce((n, item) => n + (item.deliveryOrders?.length || 0), 0) }
    ],
    tableHint: '按司机、进度和配送批次查看调度情况',
    spotlight: (rows) => ({
      title: '调度看板',
      desc: '关注司机排班、配送进度与剩余订单。',
      items: [
        `待发车 ${rows.filter((item) => item.status === '待配送').length} 单`,
        `在途司机 ${rows.filter((item) => item.status === '配送中').length} 人`,
        `已完成 ${rows.filter((item) => item.status === '已完成').length} 单`
      ]
    })
  },
  productCrafts: {
    title: '产品工艺',
    subtitle: '生产工艺、产品信息与工序状态',
    createText: '新增工艺',
    secondaryActionText: '导出工艺单',
    theme: 'indigo',
    workflows: ['工艺排产', '产品生产', '记录归档'],
    rowActions: ['详情', '编辑', '打印'],
    detailActionText: '开始对接工艺接口',
    dialogWidth: '1080px',
    searchFields: [
      { key: 'orderNo', label: '所属订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'productInfo', label: '产品信息' },
      { key: 'craftName', label: '工艺名称' }
    ],
    columns: [
      { key: 'orderNo', label: '所属订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'productInfo', label: '产品信息' },
      { key: 'craftName', label: '工艺名称' },
      { key: 'quantity', label: '产品数量' },
      { key: 'amount', label: '客户金额' },
      { key: 'status', label: '工艺状态', tag: true },
      { key: 'operator', label: '操作员' }
    ],
    formFields: [
      { key: 'orderNo', label: '所属订单号', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'productInfo', label: '产品信息', type: 'input' },
      { key: 'craftName', label: '工艺名称', type: 'input' },
      { key: 'quantity', label: '产品数量', type: 'input' },
      { key: 'amount', label: '客户金额', type: 'input' },
      { key: 'status', label: '工艺状态', type: 'select', options: ['待生产', '已生产'] },
      { key: 'operator', label: '操作员', type: 'input' },
      { key: 'productionRemark', label: '工艺说明', type: 'textarea' }
    ],
    sections: [
      {
        title: '工艺信息',
        type: 'table',
        dataKey: 'craftRows',
        columns: [
          { key: 'craftName', label: '工艺名称' },
          { key: 'specification', label: '规格' },
          { key: 'openCount', label: '开数' },
          { key: 'finishedCount', label: '成品数量' },
          { key: 'unitPrice', label: '工艺单价' },
          { key: 'amount', label: '客户金额' }
        ]
      },
      {
        title: '产品信息',
        type: 'table',
        dataKey: 'productRows',
        columns: [
          { key: 'productName', label: '产品名称' },
          { key: 'finishedSpec', label: '成品规格' },
          { key: 'orderQuantity', label: '订货数量' },
          { key: 'unit', label: '单位' },
          { key: 'amount', label: '金额' }
        ]
      },
      {
        title: '生产记录',
        type: 'grid',
        fields: [
          { key: 'operator', label: '操作员' },
          { key: 'productionTime', label: '操作时间' },
          { key: 'productionRemark', label: '记录说明' },
          { key: 'imageNote', label: '图片备注' }
        ]
      }
    ],
    stats: (rows) => [
      { label: '待生产', value: rows.filter((item) => item.status === '待生产').length },
      { label: '已生产', value: rows.filter((item) => item.status === '已生产').length },
      { label: '工艺产值', value: sumMoney(rows, 'amount') },
      { label: '产品数量', value: rows.reduce((n, item) => n + Number(item.quantity || 0), 0) }
    ],
    tableHint: '按订单、工艺和操作员追踪生产进度',
    spotlight: (rows) => ({
      title: '生产工艺看板',
      desc: '按订单、工艺和操作员跟踪生产进度。',
      items: [
        `待排产 ${rows.filter((item) => item.status === '待生产').length} 条`,
        `已完工 ${rows.filter((item) => item.status === '已生产').length} 条`,
        `平均产值 ${averageMoney(rows, 'amount')}`
      ]
    })
  },
  outsourceIncoming: {
    title: '外协订单-转入的',
    subtitle: '外协转入订单、接单单位与流转记录',
    createText: '新增转入单',
    secondaryActionText: '导出转入单',
    theme: 'cyan',
    workflows: ['接收入库', '生产流转', '配送完成'],
    rowActions: ['详情', '编辑', '打印'],
    detailActionText: '开始对接外协转入接口',
    dialogWidth: '1080px',
    searchFields: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'supplier', label: '接单单位' },
      { key: 'status', label: '订单状态' }
    ],
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'supplier', label: '接单单位' },
      { key: 'productInfo', label: '产品信息' },
      { key: 'amount', label: '订单金额' },
      { key: 'sales', label: '业务员' },
      { key: 'status', label: '流转状态', tag: true }
    ],
    formFields: [
      { key: 'orderNo', label: '订单号', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'supplier', label: '接单单位', type: 'input' },
      { key: 'productInfo', label: '产品信息', type: 'input' },
      { key: 'amount', label: '订单金额', type: 'input' },
      { key: 'sales', label: '业务员', type: 'input' },
      { key: 'status', label: '流转状态', type: 'select', options: ['待生产', '生产中', '待配送', '配送中', '已完成'] },
      { key: 'remark', label: '流转说明', type: 'textarea' }
    ],
    sections: [
      {
        title: '订单信息',
        type: 'table',
        dataKey: 'orderRows',
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'supplier', label: '接单单位' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '订单金额' },
          { key: 'status', label: '订单状态', tag: true }
        ]
      },
      {
        title: '单位信息',
        type: 'grid',
        fields: [
          { key: 'customer', label: '单位名称' },
          { key: 'contact', label: '联系人' },
          { key: 'phone', label: '联系方式' },
          { key: 'address', label: '单位地址' },
          { key: 'sales', label: '业务员' },
          { key: 'supplier', label: '接单单位' }
        ]
      },
      {
        title: '流转记录',
        type: 'timeline',
        dataKey: 'flowTimeline'
      }
    ],
    stats: outsourceStats,
    tableHint: '按接单单位和流转状态跟踪转入外协单',
    spotlight: outsourceSpotlight('转入')
  },
  outsourceOutgoing: {
    title: '外协订单-转出的',
    subtitle: '外协转出订单、转单单位与流转记录',
    createText: '新增转出单',
    secondaryActionText: '导出转出单',
    theme: 'violet',
    workflows: ['转出下单', '节点跟踪', '结果回传'],
    rowActions: ['详情', '编辑', '打印'],
    detailActionText: '开始对接外协转出接口',
    dialogWidth: '1080px',
    searchFields: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'supplier', label: '接单单位' },
      { key: 'status', label: '订单状态' }
    ],
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'supplier', label: '转出单位' },
      { key: 'productInfo', label: '产品信息' },
      { key: 'amount', label: '订单金额' },
      { key: 'sales', label: '业务员' },
      { key: 'status', label: '流转状态', tag: true }
    ],
    formFields: [
      { key: 'orderNo', label: '订单号', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'supplier', label: '转出单位', type: 'input' },
      { key: 'productInfo', label: '产品信息', type: 'input' },
      { key: 'amount', label: '订单金额', type: 'input' },
      { key: 'sales', label: '业务员', type: 'input' },
      { key: 'status', label: '流转状态', type: 'select', options: ['待生产', '生产中', '待配送', '配送中', '已完成'] },
      { key: 'remark', label: '流转说明', type: 'textarea' }
    ],
    sections: [
      {
        title: '订单信息',
        type: 'table',
        dataKey: 'orderRows',
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'supplier', label: '接单单位' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '订单金额' },
          { key: 'status', label: '订单状态', tag: true }
        ]
      },
      {
        title: '单位信息',
        type: 'grid',
        fields: [
          { key: 'customer', label: '单位名称' },
          { key: 'contact', label: '联系人' },
          { key: 'phone', label: '联系方式' },
          { key: 'address', label: '单位地址' },
          { key: 'sales', label: '业务员' },
          { key: 'supplier', label: '接单单位' }
        ]
      },
      {
        title: '流转记录',
        type: 'timeline',
        dataKey: 'flowTimeline'
      }
    ],
    stats: outsourceStats,
    tableHint: '按转出单位和流转状态跟踪外协转出单',
    spotlight: outsourceSpotlight('转出')
  }
}

function money(value) {
  return Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0
}

function getFieldDefault(field) {
  if (field.type === 'checkbox') return []
  if (field.type === 'number') return 0
  return ''
}

function normalizeFieldOptions(options = []) {
  return options.map((option) =>
    typeof option === 'object' ? option : { label: option, value: option }
  )
}

function sumMoney(rows, key) {
  return `¥${rows.reduce((sum, item) => sum + money(item[key]), 0).toFixed(2)}`
}

function averageMoney(rows, key) {
  if (!rows.length) return '¥0.00'
  return `¥${(rows.reduce((sum, item) => sum + money(item[key]), 0) / rows.length).toFixed(2)}`
}

function outsourceStats(rows) {
  return [
    { label: '待生产', value: rows.filter((item) => item.status === '待生产').length },
    { label: '生产中', value: rows.filter((item) => item.status === '生产中').length },
    { label: '待配送', value: rows.filter((item) => item.status === '待配送').length },
    { label: '订单金额', value: sumMoney(rows, 'amount') }
  ]
}

function outsourceSpotlight(mode) {
  return (rows) => ({
    title: `外协${mode}关注`,
    desc: '跟踪单位、金额与流转节点。',
    items: [
      `流转中 ${rows.filter((item) => ['生产中', '待配送', '配送中'].includes(item.status)).length} 单`,
      `已完成 ${rows.filter((item) => item.status === '已完成').length} 单`,
      `订单均额 ${averageMoney(rows, 'amount')}`
    ]
  })
}

const createConfigProfile = (moduleKey, overrides = {}) => {
  const config = crudModuleConfigs[moduleKey]
  if (!config) return null

  return {
    title: config.title,
    subtitle: config.subtitle,
    createText: config.createText || '新增',
    secondaryActionText: config.secondaryActionText || '导出',
    theme: overrides.theme || config.theme || 'slate',
    workflows: overrides.workflows || config.workflows || [],
    rowActions: overrides.rowActions || config.rowActions || ['详情', '编辑', '打印'],
    detailActionText: overrides.detailActionText || `开始对接${config.title}接口`,
    panels: overrides.panels || [],
    detailHighlights: overrides.detailHighlights || [],
    summaryText: overrides.summaryText || config.summaryText || '',
    dialogWidth: config.dialogWidth || '920px',
    searchFields: (config.searchFields || []).map((field) => ({
      ...field,
      key: field.key,
      label: field.label
    })),
    columns: config.columns || [],
    formFields: (config.formFields || []).map((field) => ({
      ...field,
      type: field.type === 'picker' ? 'input' : field.type
    })),
    sections:
      overrides.sections ||
      (config.detailSections?.length
        ? config.detailSections.map((section) => ({
            title: section.title,
            type: section.fields ? 'grid' : section.timelineKey ? 'timeline' : 'table',
            dataKey: section.dataKey || section.timelineKey,
            fields: section.fields,
            columns: section.columns
          }))
        : [
            {
              title: `${config.title}信息`,
              type: 'grid',
              fields: (config.detailFields || config.formFields || []).slice(0, 8)
            }
          ]),
    stats: overrides.stats || ((rows) => [
      { label: '当前条数', value: rows.length },
      { label: '总条数', value: rows.length },
      { label: '最近更新', value: rows[0]?.updatedAt || rows[0]?.createTime || '-' },
      { label: '模块名称', value: config.title }
    ]),
    tableHint: overrides.tableHint || `按${config.title}核心字段查看当前模块数据`,
    spotlight:
      overrides.spotlight ||
      ((rows) => ({
        title: `${config.title}概览`,
        desc: config.subtitle || '当前模块数据概览',
        items: [
          `搜索字段 ${config.searchFields?.length || 0} 项`,
          `表格字段 ${config.columns?.length || 0} 项`,
          `当前记录 ${rows.length} 条`
        ]
      }))
  }
}

const buildFallbackProfile = (moduleKey) => {
  return createConfigProfile(moduleKey)
}

const configProfiles = {
  customers: createConfigProfile('customers', {
    theme: 'sky',
    workflows: ['客户建档', '往来跟踪', '记录汇总'],
    rowActions: ['详情', '编辑', '打印'],
    panels: (rows) => [
      { title: '重点业务员', value: rows[0]?.sales || '未分配', helper: '最近活跃客户归属' },
      { title: '客户类型焦点', value: rows[0]?.customerType || '-', helper: '默认展示当前筛选首条记录' },
      { title: '往来提醒', value: `${rows.filter((item) => item.remark).length} 条`, helper: '已登记备注或往来说明' }
    ],
    detailHighlights: (row) => [
      { title: '客户类型', value: row.customerType || '-', helper: '当前单位类型' },
      { title: '业务员', value: row.sales || '-', helper: '主跟进人' },
      { title: '收款账户', value: row.payAccount || '-', helper: '默认结算方式' }
    ],
    sections: [
      { title: '客户信息', type: 'grid', fields: crudModuleConfigs.customers.detailFields.slice(0, 8) },
      { title: '工艺记录', type: 'table', dataKey: 'craftRecords', columns: crudModuleConfigs.customers.detailTabs[1].columns },
      { title: '订单记录', type: 'table', dataKey: 'orderRecords', columns: crudModuleConfigs.customers.detailTabs[0].columns },
      { title: '收款记录', type: 'table', dataKey: 'receiptRecords', columns: crudModuleConfigs.customers.detailTabs[2].columns }
    ],
    spotlight: (rows) => ({
      title: '客户往来概况',
      desc: '聚焦单位档案、业务员归属与往来记录。',
      items: [
        `现有客户 ${rows.length} 家`,
        `供应商 ${rows.filter((item) => item.customerType === '供应商').length} 家`,
        `月结客户 ${rows.filter((item) => item.customerType === '月结客户').length} 家`
      ]
    })
  }),
  staff: createConfigProfile('staff', {
    theme: 'teal',
    workflows: ['新增账号', '岗位配置', '权限维护'],
    rowActions: ['详情', '编辑', '重置密码'],
    panels: (rows) => [
      { title: '部门焦点', value: rows[0]?.department || '全部', helper: '当前列表默认部门' },
      { title: '角色密度', value: `${rows.filter((item) => item.roleText).length} 人`, helper: '已配置岗位角色账号' },
      { title: '待维护账号', value: `${rows.filter((item) => !item.remark).length} 个`, helper: '备注为空的账号可继续完善' }
    ],
    detailHighlights: (row) => [
      { title: '所在部门', value: row.department || '-', helper: '员工归属部门' },
      { title: '角色', value: row.roleText || '-', helper: '当前岗位角色' },
      { title: '账号状态', value: row.status === true ? '启用' : row.status === false ? '禁用' : '-', helper: '当前登录状态' }
    ],
    sections: [
      { title: '账号信息', type: 'grid', fields: crudModuleConfigs.staff.formFields.slice(0, 8) },
      { title: '岗位信息', type: 'grid', fields: crudModuleConfigs.staff.formFields.slice(8, 11) },
      { title: '备注信息', type: 'grid', fields: [{ key: 'remark', label: '备注' }] }
    ],
    stats: (rows) => [
      { label: '员工总数', value: rows.length },
      { label: '启用账号', value: rows.filter((item) => item.status === true).length },
      { label: '禁用账号', value: rows.filter((item) => item.status === false).length },
      { label: '物流人员', value: rows.filter((item) => String(item.roleText || '').includes('物流')).length }
    ]
  }),
  organization: createConfigProfile('organization', {
    theme: 'slate',
    workflows: ['部门维护', '层级调整', '状态同步'],
    sections: [
      { title: '部门信息', type: 'grid', fields: crudModuleConfigs.organization.formFields },
      { title: '层级状态', type: 'grid', fields: [{ key: 'group', label: '所属分组' }, { key: 'statusText', label: '当前状态' }] }
    ],
    spotlight: (rows) => ({
      title: '组织概览',
      desc: '查看部门启用情况与架构分组。',
      items: [
        `部门总数 ${rows.length} 个`,
        `启用部门 ${rows.filter((item) => item.status === true).length} 个`,
        `禁用部门 ${rows.filter((item) => item.status === false).length} 个`
      ]
    })
  }),
  roles: createConfigProfile('roles', {
    theme: 'fuchsia',
    workflows: ['创建角色', '权限配置', '菜单授权'],
    sections: [
      { title: '角色信息', type: 'grid', fields: crudModuleConfigs.roles.formFields },
      { title: '权限说明', type: 'grid', fields: [{ key: 'name', label: '角色名称' }, { key: 'remark', label: '权限说明' }] }
    ],
    spotlight: (rows) => ({
      title: '权限角色概览',
      desc: '按角色控制各业务模块操作权限。',
      items: [`角色总数 ${rows.length} 个`, `系统角色 ${rows.filter((item) => String(item.name).includes('总')).length} 个`, `业务角色 ${rows.filter((item) => String(item.name).includes('业务')).length} 个`]
    })
  }),
  durationPurchases: createConfigProfile('durationPurchases', {
    theme: 'lime',
    workflows: ['选择套餐', '登记购买', '时长生效'],
    sections: [
      { title: '购买信息', type: 'grid', fields: crudModuleConfigs.durationPurchases.formFields.slice(0, 6) },
      { title: '补充说明', type: 'grid', fields: [{ key: 'remark', label: '备注' }] }
    ],
    stats: (rows) => [
      { label: '购买记录', value: rows.length },
      { label: '支付金额', value: sumMoney(rows, 'amount') },
      { label: '原价金额', value: sumMoney(rows, 'originPrice') },
      { label: '年度套餐', value: rows.filter((item) => String(item.planName).includes('年')).length }
    ]
  }),
  materials: createConfigProfile('materials', {
    theme: 'orange',
    workflows: ['新增耗材', '价值维护', '状态控制'],
    panels: (rows) => [
      { title: '高价值耗材', value: rows[0]?.name || '-', helper: '当前筛选首条耗材' },
      { title: '单位分布', value: rows[0]?.unit || '-', helper: '常用耗材单位' },
      { title: '档案说明', value: `${rows.filter((item) => item.detailNote).length} 条`, helper: '已补充耗材说明数' }
    ],
    detailHighlights: (row) => [
      { title: '耗材名称', value: row.name || '-', helper: '当前档案名称' },
      { title: '单位', value: row.unit || '-', helper: '耗材计量方式' },
      { title: '状态', value: row.status === true ? '启用' : row.status === false ? '禁用' : row.status || '-', helper: '档案启停状态' }
    ],
    sections: [
      { title: '耗材档案', type: 'grid', fields: crudModuleConfigs.materials.formFields.slice(0, 5) },
      { title: '补充说明', type: 'grid', fields: [{ key: 'detailNote', label: '补充说明' }] }
    ],
    spotlight: (rows) => ({
      title: '耗材档案概况',
      desc: '按耗材名称、单位和状态维护基础档案。',
      items: [
        `耗材总数 ${rows.length} 项`,
        `启用耗材 ${rows.filter((item) => item.status === true).length} 项`,
        `禁用耗材 ${rows.filter((item) => item.status === false).length} 项`
      ]
    })
  }),
  materialStock: createConfigProfile('materialStock', {
    theme: 'yellow',
    workflows: ['库存录入', '库存盘点', '预警跟踪'],
    panels: (rows) => [
      { title: '库存焦点', value: rows[0]?.name || '-', helper: '当前列表首条耗材' },
      { title: '预警数量', value: `${rows.filter((item) => item.status === '预警').length} 项`, helper: '需要优先补货的库存' },
      { title: '库存总量', value: rows.reduce((sum, item) => sum + Number(item.stock || 0), 0), helper: '当前筛选库存合计' }
    ],
    detailHighlights: (row) => [
      { title: '当前库存', value: row.stock || 0, helper: '可用库存数量' },
      { title: '入库数量', value: row.inbound || 0, helper: '累计入库' },
      { title: '出库数量', value: row.outbound || 0, helper: '累计出库' }
    ],
    sections: [
      { title: '库存信息', type: 'grid', fields: crudModuleConfigs.materialStock.formFields.slice(0, 8) }
    ],
    stats: (rows) => [
      { label: '库存条目', value: rows.length },
      { label: '预警条目', value: rows.filter((item) => item.status === '预警').length },
      { label: '总库存', value: rows.reduce((sum, item) => sum + Number(item.stock || 0), 0) },
      { label: '总成本', value: sumMoney(rows, 'cost') }
    ]
  }),
  materialDetails: createConfigProfile('materialDetails', {
    theme: 'yellow',
    workflows: ['入库登记', '出库登记', '来源追踪'],
    panels: (rows) => [
      { title: '最新明细', value: rows[0]?.name || '-', helper: '当前筛选第一条耗材明细' },
      { title: '明细类型', value: rows[0]?.type || '-', helper: '当前列表默认明细类型' },
      { title: '关联订单', value: `${rows.filter((item) => item.orderNo && item.orderNo !== '--').length} 条`, helper: '已关联订单的明细记录' }
    ],
    detailHighlights: (row) => [
      { title: '明细类型', value: row.type || row.status || '-', helper: '当前明细方向' },
      { title: '数量', value: row.quantity || 0, helper: '本次出入库数量' },
      { title: '操作员', value: row.operator || '-', helper: '执行本次记录的人员' }
    ],
    sections: [
      { title: '出入库明细', type: 'grid', fields: crudModuleConfigs.materialDetails.formFields.slice(0, 8) },
      { title: '补充说明', type: 'grid', fields: [{ key: 'detailNote', label: '补充说明' }] }
    ],
    stats: (rows) => [
      { label: '明细条数', value: rows.length },
      { label: '系统入库', value: rows.filter((item) => item.status === '系统入库').length },
      { label: '手工出库', value: rows.filter((item) => item.status === '手工出库').length },
      { label: '订单消耗', value: rows.filter((item) => item.status === '订单消耗').length }
    ]
  }),
  craftStats: createConfigProfile('craftStats', {
    theme: 'indigo',
    workflows: ['工艺汇总', '产量统计', '状态分析'],
    sections: [
      { title: '工艺统计信息', type: 'grid', fields: crudModuleConfigs.craftStats.formFields }
    ],
    stats: (rows) => [
      { label: '工艺数', value: rows.length },
      { label: '累计生产', value: rows.reduce((sum, item) => sum + Number(item.count || 0), 0) },
      { label: '待生产', value: rows.reduce((sum, item) => sum + Number(item.pending || 0), 0) },
      { label: '已生产', value: rows.reduce((sum, item) => sum + Number(item.completed || 0), 0) }
    ]
  }),
  craftPerformance: createConfigProfile('craftPerformance', {
    theme: 'indigo',
    workflows: ['绩效汇总', '部门拆解', '产能复盘'],
    sections: [
      { title: '绩效信息', type: 'grid', fields: crudModuleConfigs.craftPerformance.formFields.slice(0, 5) },
      { title: '工艺产出', type: 'grid', fields: crudModuleConfigs.craftPerformance.formFields.slice(5) }
    ],
    spotlight: (rows) => ({
      title: '绩效维度',
      desc: '从客户、产品和工艺维度拆解产能。',
      items: [
        `统计人员 ${rows.length} 人`,
        `生产部 ${rows.filter((item) => item.department === '生产部').length} 人`,
        `后道部 ${rows.filter((item) => item.department === '后道部').length} 人`
      ]
    })
  }),
  billingPerformance: createConfigProfile('billingPerformance', {
    theme: 'cyan',
    workflows: ['开单统计', '金额汇总', '人员对比'],
    sections: [
      { title: '开单绩效信息', type: 'grid', fields: crudModuleConfigs.billingPerformance.formFields }
    ],
    stats: (rows) => [
      { label: '统计人员', value: rows.length },
      { label: '已完成订单数', value: rows.reduce((sum, item) => sum + Number(item.completedOrders || 0), 0) },
      { label: '订单金额', value: sumMoney(rows, 'amount') },
      { label: '最高金额', value: averageMoney([...rows].sort((a, b) => money(b.amount) - money(a.amount)).slice(0, 1), 'amount') }
    ]
  }),
  deliveryPerformance: createConfigProfile('deliveryPerformance', {
    theme: 'amber',
    workflows: ['配送统计', '司机对比', '订单分析'],
    sections: [
      { title: '配送绩效信息', type: 'grid', fields: crudModuleConfigs.deliveryPerformance.formFields }
    ],
    stats: (rows) => [
      { label: '统计人员', value: rows.length },
      { label: '待配送订单', value: rows.reduce((sum, item) => sum + Number(item.pendingOrders || 0), 0) },
      { label: '已配送订单', value: rows.reduce((sum, item) => sum + Number(item.completedOrders || 0), 0) },
      { label: '配送人员', value: rows.length }
    ]
  }),
  accounts: createConfigProfile('accounts', {
    theme: 'emerald',
    workflows: ['账户建档', '余额查看', '状态控制'],
    panels: (rows) => [
      { title: '主账户', value: rows[0]?.name || '-', helper: '当前列表优先账户' },
      { title: '开户行', value: rows[0]?.bank || '-', helper: '用于快速校对收支账户' },
      { title: '余额提醒', value: rows.length ? `¥${rows.reduce((sum, item) => sum + Number(item.balance || 0), 0).toFixed(2)}` : '¥0.00', helper: '当前页面账户余额合计' }
    ],
    detailHighlights: (row) => [
      { title: '账户名称', value: row.name || '-', helper: '账户主名称' },
      { title: '开户行', value: row.bank || '-', helper: '银行信息' },
      { title: '账户余额', value: row.balance ? `¥${Number(row.balance).toFixed(2)}` : '¥0.00', helper: '当前账户余额' }
    ],
    sections: [
      { title: '账户信息', type: 'grid', fields: crudModuleConfigs.accounts.formFields.slice(0, 6) },
      { title: '备注信息', type: 'grid', fields: [{ key: 'remark', label: '备注' }] }
    ],
    stats: (rows) => [
      { label: '账户数量', value: rows.length },
      { label: '启用账户', value: rows.filter((item) => item.status === true).length },
      { label: '冻结账户', value: rows.filter((item) => item.status === false).length },
      { label: '账户余额', value: `¥${rows.reduce((sum, item) => sum + Number(item.balance || 0), 0).toFixed(2)}` }
    ]
  }),
  fundDetails: createConfigProfile('fundDetails', {
    theme: 'emerald',
    workflows: ['流水查询', '收支对账', '余额核对'],
    panels: (rows) => [
      { title: '最新流水', value: rows[0]?.bizNo || '-', helper: '当前列表第一条业务编号' },
      { title: '收入方向', value: rows.filter((item) => Number(item.income || 0) > 0).length + ' 条', helper: '当前列表入账记录数' },
      { title: '支出方向', value: rows.filter((item) => Number(item.expense || 0) > 0).length + ' 条', helper: '当前列表出账记录数' }
    ],
    detailHighlights: (row) => [
      { title: '业务编号', value: row.bizNo || '-', helper: '当前流水单号' },
      { title: '收入金额', value: row.income ? `¥${Number(row.income).toFixed(2)}` : '¥0.00', helper: '本笔收入' },
      { title: '支出金额', value: row.expense ? `¥${Number(row.expense).toFixed(2)}` : '¥0.00', helper: '本笔支出' }
    ],
    sections: [
      { title: '资金流水', type: 'grid', fields: crudModuleConfigs.fundDetails.formFields.slice(0, 8) },
      { title: '金额信息', type: 'grid', fields: crudModuleConfigs.fundDetails.formFields.slice(8) }
    ],
    stats: (rows) => [
      { label: '流水条数', value: rows.length },
      { label: '收入合计', value: sumMoney(rows, 'income') },
      { label: '支出合计', value: sumMoney(rows, 'expense') },
      { label: '结余', value: sumMoney(rows, 'balance') }
    ]
  }),
  receivableOrders: createConfigProfile('receivableOrders', {
    theme: 'rose',
    workflows: ['订单账款', '已收跟踪', '尾款追踪'],
    panels: (rows) => [
      { title: '最新订单', value: rows[0]?.orderNo || '-', helper: '当前筛选首条订单' },
      { title: '尾款订单', value: `${rows.filter((item) => Number(item.unpaid || 0) > 0).length} 单`, helper: '仍有尾款的订单数' },
      { title: '账单总额', value: sumMoney(rows, 'amount'), helper: '当前筛选订单账单合计' }
    ],
    detailHighlights: (row) => [
      { title: '订单号', value: row.orderNo || '-', helper: '当前应收订单' },
      { title: '已收金额', value: row.received ? `¥${Number(row.received).toFixed(2)}` : '¥0.00', helper: '已收款项' },
      { title: '剩余尾款', value: row.unpaid ? `¥${Number(row.unpaid).toFixed(2)}` : '¥0.00', helper: '待继续跟进金额' }
    ],
    sections: [
      { title: '订单账款信息', type: 'grid', fields: crudModuleConfigs.receivableOrders.formFields.slice(0, 8) },
      { title: '补充说明', type: 'grid', fields: [{ key: 'remark', label: '备注' }] }
    ],
    stats: (rows) => [
      { label: '订单条数', value: rows.length },
      { label: '账单金额', value: sumMoney(rows, 'amount') },
      { label: '已收金额', value: sumMoney(rows, 'received') },
      { label: '剩余尾款', value: sumMoney(rows, 'unpaid') }
    ]
  }),
  receivableUnits: createConfigProfile('receivableUnits', {
    theme: 'rose',
    workflows: ['单位账款', '联系人跟进', '余额汇总'],
    panels: (rows) => [
      { title: '重点单位', value: rows[0]?.customer || '-', helper: '当前筛选首条单位' },
      { title: '未清单位', value: `${rows.filter((item) => Number(item.unpaid || 0) > 0).length} 家`, helper: '仍有未收尾款的单位数' },
      { title: '尾款总额', value: sumMoney(rows, 'unpaid'), helper: '单位维度剩余尾款' }
    ],
    detailHighlights: (row) => [
      { title: '单位名称', value: row.customer || '-', helper: '当前应收单位' },
      { title: '联系人', value: row.contact || '-', helper: '默认联系人' },
      { title: '剩余尾款', value: row.unpaid ? `¥${Number(row.unpaid).toFixed(2)}` : '¥0.00', helper: '当前单位待收金额' }
    ],
    sections: [
      { title: '单位账款信息', type: 'grid', fields: crudModuleConfigs.receivableUnits.formFields }
    ],
    stats: (rows) => [
      { label: '单位数', value: rows.length },
      { label: '账单金额', value: sumMoney(rows, 'amount') },
      { label: '已收金额', value: sumMoney(rows, 'received') },
      { label: '剩余尾款', value: sumMoney(rows, 'unpaid') }
    ]
  }),
  manualRecords: createConfigProfile('manualRecords', {
    theme: 'stone',
    workflows: ['手工补录', '异常登记', '操作留痕'],
    panels: (rows) => [
      { title: '最近补录', value: rows[0]?.name || '-', helper: '当前列表最新一条手工记录' },
      { title: '关联订单', value: rows.filter((item) => item.orderNo && item.orderNo !== '--').length + ' 条', helper: '已绑定订单的手工记录' },
      { title: '补录人员', value: rows[0]?.operator || '-', helper: '最近一次补录操作人' }
    ],
    detailHighlights: (row) => [
      { title: '记录名称', value: row.name || '-', helper: '手工记录主题' },
      { title: '关联订单', value: row.orderNo || '-', helper: '关联订单编号' },
      { title: '操作员', value: row.operator || '-', helper: '补录人信息' }
    ],
    sections: [
      { title: '手工记录信息', type: 'grid', fields: crudModuleConfigs.manualRecords.formFields }
    ],
    spotlight: (rows) => ({
      title: '手工补录概况',
      desc: '主要用于异常补录和非系统自动产生记录。',
      items: [
        `补录条数 ${rows.length} 条`,
        `关联订单 ${rows.filter((item) => item.orderNo && item.orderNo !== '--').length} 条`,
        `独立记录 ${rows.filter((item) => !item.orderNo || item.orderNo === '--').length} 条`
      ]
    })
  }),
  productCraftsOutsource: createConfigProfile('productCraftsOutsource', {
    theme: 'violet',
    workflows: ['外协工艺', '产品匹配', '生产回传'],
    sections: [
      { title: '外协工艺信息', type: 'table', dataKey: 'craftRows', columns: crudModuleConfigs.productCraftsOutsource.detailSections[0].columns },
      { title: '产品信息', type: 'table', dataKey: 'productRows', columns: crudModuleConfigs.productCraftsOutsource.detailSections[1].columns },
      { title: '订单信息', type: 'grid', fields: crudModuleConfigs.productCraftsOutsource.detailSections[2].fields },
      { title: '生产记录', type: 'grid', fields: crudModuleConfigs.productCraftsOutsource.detailSections[3].fields }
    ],
    spotlight: (rows) => ({
      title: '外协工艺概况',
      desc: '查看转单单位、工艺状态与外协产值。',
      items: [
        `待生产 ${rows.filter((item) => item.status === '待生产').length} 条`,
        `已生产 ${rows.filter((item) => item.status === '已生产').length} 条`,
        `外协产值 ${sumMoney(rows, 'amount')}`
      ]
    })
  })
}

const profile = profiles[props.moduleKey] || configProfiles[props.moduleKey] || buildFallbackProfile(props.moduleKey)
const filters = reactive(Object.fromEntries(profile.searchFields.map((field) => [field.key, ''])))
const detailVisible = ref(false)
const currentRow = ref(null)
const dialogVisible = ref(false)
const formState = reactive({})
const sequence = ref(1)
const state = reactive({
  loading: false,
  pageNum: 1,
  pageSize: 10
})
const dataset = ref([])

const normalizeForm = () => {
  Object.keys(formState).forEach((key) => delete formState[key])
  ;(profile.formFields || []).forEach((field) => {
    formState[field.key] = getFieldDefault(field)
  })
  formState.id = null
}

normalizeForm()

const rows = computed(() => {
  return dataset.value
})

const filteredRows = computed(() =>
  rows.value.filter((row) =>
    profile.searchFields.every((field) => {
      const value = filters[field.key]
      if (!value) return true
      return String(row[field.key] ?? '').includes(String(value))
    })
  )
)
const pagedRows = computed(() => {
  const start = (state.pageNum - 1) * state.pageSize
  return filteredRows.value.slice(start, start + state.pageSize)
})

const statCards = computed(() => profile.stats(filteredRows.value))
const spotlight = computed(() => profile.spotlight(filteredRows.value))
const overviewPanels = computed(() => {
  if (typeof profile.panels === 'function') return profile.panels(filteredRows.value)
  return profile.panels || []
})
const detailHighlights = computed(() => {
  if (!currentRow.value) return []
  if (typeof profile.detailHighlights === 'function') return profile.detailHighlights(currentRow.value)
  return profile.detailHighlights || []
})
const activeFilters = computed(() =>
  profile.searchFields
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: filters[field.key]
    }))
    .filter((item) => item.value !== '' && item.value !== null && item.value !== undefined)
)

const resetFilters = () => {
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
  state.pageNum = 1
  loadRows()
}

const clearFilter = (key) => {
  filters[key] = ''
  state.pageNum = 1
  loadRows()
}

const openDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
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

const save = () => {
  return submitSave()
}

const sectionMeta = (section) => {
  if (!currentRow.value) return ''
  if (section.type === 'grid') return `${section.fields.length} 项`
  return `${(currentRow.value[section.dataKey] || []).length} 条`
}

const tagType = (value) => {
  if (['已通过', '已完成', '已生产'].includes(value)) return 'success'
  if (['待审批', '待配送', '待生产'].includes(value)) return 'warning'
  if (['已驳回'].includes(value)) return 'danger'
  if (['配送中', '生产中'].includes(value)) return 'primary'
  return 'info'
}

const notify = (message) => ElMessage.success(message)
const isEdit = computed(() => Boolean(formState.id))
const formDialogTitle = computed(() => {
  if (isEdit.value) return `编辑${profile.title}`
  if (profile.title === '合作客户') return '添加客户'
  if (profile.title === '工艺管理') return '添加工艺'
  return profile.createText || `添加${profile.title}`
})
const detailDialogTitle = computed(() => {
  if (profile.title === '合作客户') return '客户详情'
  return `${profile.title}详情`
})
const formDialogWidth = computed(() => {
  if (profile.title === '合作客户') return '1120px'
  if (profile.title === '工艺管理') return '1040px'
  return profile.dialogWidth || '1040px'
})
const themeClass = computed(() => `theme-${profile.theme || 'slate'}`)
const rowActions = computed(() => profile.rowActions || ['详情', '编辑', '打印'])
const searchOptions = (field) => normalizeFieldOptions(field.options || [])
const formOptions = (field) => normalizeFieldOptions(field.options || [])
const summaryText = computed(() =>
  typeof profile.summaryText === 'function' ? profile.summaryText(filteredRows.value) : profile.summaryText
)

const formatCell = (column, row) => {
  const value = row[column.key]
  if (value === undefined || value === null || value === '') return '-'
  if (column.switch) {
    return value === true || value === '启用' || Number(value) === 1 ? '启用' : '禁用'
  }
  if (Array.isArray(value)) return value.join('、')
  const label = `${column.label || ''}${column.key || ''}`.toLowerCase()
  if (/金额|尾款|折让|价|money|amount|income|expense|balance/.test(label) && !String(value).startsWith('¥')) {
    return `¥${Number(value || 0).toFixed(2)}`
  }
  return value
}

const handleRowAction = (row, action) => {
  if (action === '详情') return openDetail(row)
  if (action === '编辑') return openEdit(row)
  if (action === '打印') return notify('打印模板已预留')
  if (action === '重置密码') return notify(`已为 ${row.name || row.customer || row.orderNo || '当前记录'} 预留重置密码流程`)
  return notify(`${action} 功能已预留`)
}

const loadRows = async () => {
  state.loading = true
  try {
    const result = await loadSpecialModuleRows(props.moduleKey, filters)
    dataset.value = result.rows
    sequence.value = Math.max(...[0, ...result.rows.map((item) => Number(item.id) || 0)]) + 1
    if ((state.pageNum - 1) * state.pageSize >= result.rows.length) {
      state.pageNum = 1
    }
  } catch (error) {
    dataset.value = []
    ElMessage.error(error?.message || '模块接口未配置')
  } finally {
    state.loading = false
  }
}

const submitSave = async () => {
  const payload = JSON.parse(JSON.stringify(formState))
  if (!payload.id) {
    payload.id = sequence.value
    sequence.value += 1
  }
  try {
    await persistSpecialModuleRow(props.moduleKey, payload)
    dialogVisible.value = false
    ElMessage.success('保存成功')
    loadRows()
  } catch (error) {
    ElMessage.error(error?.message || '保存接口未配置')
  }
}

onMounted(loadRows)
</script>

<template>
  <div class="special-stack">
    <section class="hero-grid" :class="themeClass">
      <article v-for="card in statCards" :key="card.label" class="hero-card">
        <p>{{ card.label }}</p>
        <strong>{{ card.value }}</strong>
      </article>
      <article class="hero-card hero-card--spotlight">
        <p>{{ spotlight.title }}</p>
        <strong>{{ spotlight.desc }}</strong>
        <ul>
          <li v-for="item in spotlight.items" :key="item">{{ item }}</li>
        </ul>
      </article>
    </section>

    <section v-if="profile.workflows?.length" class="workflow-strip" :class="themeClass">
      <article v-for="item in profile.workflows" :key="item" class="workflow-chip">
        <span>{{ item }}</span>
      </article>
    </section>

    <section v-if="overviewPanels.length" class="overview-panels" :class="themeClass">
      <article v-for="panel in overviewPanels" :key="panel.title" class="overview-panel">
        <p>{{ panel.title }}</p>
        <strong>{{ panel.value }}</strong>
        <span>{{ panel.helper }}</span>
      </article>
    </section>

    <PageBlock class="search-card">
      <div class="search-grid">
        <label v-for="field in profile.searchFields" :key="field.key" class="search-item">
          <span>{{ field.label }}</span>
          <el-select
            v-if="field.type === 'select'"
            v-model="filters[field.key]"
            clearable
            :placeholder="`请选择${field.label}`"
          >
            <el-option
              v-for="option in searchOptions(field)"
              :key="`${field.key}-${option.value}`"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="filters[field.key]"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="`请选择${field.label}`"
          />
          <el-input v-else v-model="filters[field.key]" :placeholder="`请输入${field.label}`" />
        </label>
      </div>

      <div class="toolbar search-toolbar">
        <div class="toolbar__right">
          <el-button type="primary" :icon="Search" @click="loadRows">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </PageBlock>

    <PageBlock class="table-card">
      <div class="toolbar list-toolbar">
        <div class="toolbar__left">
          <el-button type="primary" :icon="Plus" @click="openCreate">
            {{ profile.createText }}
          </el-button>
          <el-button v-if="profile.secondaryActionText" plain @click="notify('已准备导出模板')">{{ profile.secondaryActionText }}</el-button>
        </div>
      </div>

      <div class="result-bar">
        <strong>共 {{ filteredRows.length }} 条数据</strong>
        <span>{{ profile.tableHint }} ｜ 当前数据源：真实接口</span>
        <div v-if="profile.workflows?.length" class="result-pills">
          <em v-for="item in profile.workflows" :key="item">{{ item }}</em>
        </div>
      </div>

      <div v-if="activeFilters.length" class="filter-tags">
        <span class="filter-tags__label">当前筛选</span>
        <el-tag
          v-for="item in activeFilters"
          :key="item.key"
          closable
          effect="plain"
          @close="clearFilter(item.key)"
        >
          {{ item.label }}：{{ item.value }}
        </el-tag>
      </div>

      <div v-if="summaryText" class="summary-band" :class="themeClass">
        {{ summaryText }}
      </div>

      <el-table v-loading="state.loading" :data="pagedRows" class="special-table" empty-text="当前筛选下暂无数据">
        <el-table-column
          v-for="column in profile.columns"
          :key="column.key"
          :prop="column.key"
          :label="column.label"
          min-width="132"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag v-if="column.tag" :type="tagType(row[column.key])">{{ row[column.key] }}</el-tag>
            <el-tag v-else-if="column.switch" :type="formatCell(column, row) === '启用' ? 'success' : 'danger'">
              {{ formatCell(column, row) }}
            </el-tag>
            <span v-else>{{ formatCell(column, row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="180">
          <template #default="{ row }">
            <el-button
              v-for="action in rowActions"
              :key="action"
              link
              :type="action === '编辑' ? 'warning' : action === '打印' ? 'success' : 'primary'"
              @click="handleRowAction(row, action)"
            >
              {{ action }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="state.pageNum"
          v-model:page-size="state.pageSize"
          background
          layout="total, prev, pager, next, sizes"
          :page-sizes="[10, 20, 30, 50]"
          :total="filteredRows.length"
        />
      </div>
    </PageBlock>

    <el-dialog
      v-model="dialogVisible"
      :title="formDialogTitle"
      :width="formDialogWidth"
      class="special-dialog special-form-dialog"
      :close-on-click-modal="false"
    >
      <div class="form-grid">
        <div v-for="field in profile.formFields" :key="field.key" class="form-item" :class="{ 'form-item--full': field.type === 'textarea' }">
          <p>{{ field.label }}</p>
          <el-select v-if="field.type === 'select'" v-model="formState[field.key]" :placeholder="`请选择${field.label}`">
            <el-option
              v-for="option in formOptions(field)"
              :key="`${field.key}-${option.value}`"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="formState[field.key]"
            :min="0"
            controls-position="right"
          />
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="formState[field.key]"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="`请选择${field.label}`"
          />
          <el-radio-group v-else-if="field.type === 'radio'" v-model="formState[field.key]">
            <el-radio
              v-for="option in formOptions(field)"
              :key="`${field.key}-${option.value}`"
              :label="option.value"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>
          <el-checkbox-group v-else-if="field.type === 'checkbox'" v-model="formState[field.key]">
            <el-checkbox
              v-for="option in formOptions(field)"
              :key="`${field.key}-${option.value}`"
              :label="option.value"
            >
              {{ option.label }}
            </el-checkbox>
          </el-checkbox-group>
          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="formState[field.key]"
            type="textarea"
            :rows="4"
            :placeholder="`请输入${field.label}`"
          />
          <el-input v-else v-model="formState[field.key]" :placeholder="`请输入${field.label}`" />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      :title="detailDialogTitle"
      width="1280px"
      class="special-dialog special-detail-dialog"
      :close-on-click-modal="false"
    >
      <template v-if="currentRow">
        <div class="section-stack">
          <section v-if="detailHighlights.length" class="detail-highlights" :class="themeClass">
            <article v-for="item in detailHighlights" :key="item.title" class="detail-highlight">
              <p>{{ item.title }}</p>
              <strong>{{ item.value }}</strong>
              <span>{{ item.helper }}</span>
            </article>
          </section>

          <section v-for="section in profile.sections" :key="section.title" class="detail-section">
            <div class="detail-section__head">
              <h4>{{ section.title }}</h4>
              <span>{{ sectionMeta(section) }}</span>
            </div>

            <div v-if="section.type === 'grid'" class="detail-grid">
              <div v-for="field in section.fields" :key="field.key" class="detail-item">
                <p>{{ field.label }}</p>
                <strong>{{ formatCell(field, currentRow) }}</strong>
              </div>
            </div>

            <el-table v-else-if="section.type === 'table'" :data="currentRow[section.dataKey] || []">
              <el-table-column
                v-for="column in section.columns"
                :key="column.key"
                :prop="column.key"
                :label="column.label"
                min-width="130"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <el-tag v-if="column.tag" :type="tagType(row[column.key])">{{ row[column.key] }}</el-tag>
                  <el-tag v-else-if="column.switch" :type="formatCell(column, row) === '启用' ? 'success' : 'danger'">
                    {{ formatCell(column, row) }}
                  </el-tag>
                  <span v-else>{{ formatCell(column, row) }}</span>
                </template>
              </el-table-column>
            </el-table>

            <div v-else class="timeline-stack">
              <article v-for="(item, index) in currentRow[section.dataKey] || []" :key="`${section.dataKey}-${index}`" class="timeline-card">
                <span>{{ item.date }}</span>
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
              </article>
            </div>
          </section>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">返回</el-button>
        <el-button type="primary" @click="openEdit(currentRow); detailVisible = false">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.special-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-grid {
  display: none;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.workflow-strip {
  display: none;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.workflow-chip {
  padding: 16px 18px;
  border-radius: 22px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: #fff;
  color: #17305f;
  font-weight: 700;
}

.overview-panels {
  display: none;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.overview-panel {
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: #fff;
}

.overview-panel p {
  margin: 0;
  color: #6f7a8f;
  font-size: 13px;
}

.overview-panel strong {
  display: block;
  margin-top: 10px;
  color: #111827;
  font-size: 24px;
}

.overview-panel span {
  display: block;
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
}

.hero-card {
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: rgba(255, 255, 255, 0.92);
}

.hero-card p {
  margin: 0;
  color: #6f7a8f;
}

.hero-card strong {
  display: block;
  margin-top: 12px;
  color: #111827;
  font-size: 28px;
}

.hero-card--spotlight {
  background: linear-gradient(135deg, #17305f 0%, #214180 100%);
  color: #fff;
}

.hero-card--spotlight p,
.hero-card--spotlight strong,
.hero-card--spotlight li {
  color: #fff;
}

.hero-card--spotlight ul {
  margin: 16px 0 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
}

.theme-emerald .hero-card--spotlight {
  background: linear-gradient(135deg, #0f766e 0%, #0f9b8e 100%);
}

.theme-rose .hero-card--spotlight {
  background: linear-gradient(135deg, #9f1239 0%, #e11d48 100%);
}

.theme-amber .hero-card--spotlight {
  background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%);
}

.theme-indigo .hero-card--spotlight {
  background: linear-gradient(135deg, #312e81 0%, #4f46e5 100%);
}

.theme-cyan .hero-card--spotlight {
  background: linear-gradient(135deg, #155e75 0%, #0891b2 100%);
}

.theme-violet .hero-card--spotlight {
  background: linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%);
}

.theme-sky .hero-card--spotlight {
  background: linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%);
}

.theme-teal .hero-card--spotlight {
  background: linear-gradient(135deg, #134e4a 0%, #14b8a6 100%);
}

.theme-fuchsia .hero-card--spotlight {
  background: linear-gradient(135deg, #86198f 0%, #d946ef 100%);
}

.theme-lime .hero-card--spotlight {
  background: linear-gradient(135deg, #3f6212 0%, #84cc16 100%);
}

.theme-yellow .hero-card--spotlight {
  background: linear-gradient(135deg, #854d0e 0%, #eab308 100%);
}

.theme-stone .hero-card--spotlight {
  background: linear-gradient(135deg, #44403c 0%, #78716c 100%);
}

.theme-emerald .workflow-chip {
  background: linear-gradient(135deg, #effdf8 0%, #d1fae5 100%);
}

.theme-rose .workflow-chip {
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
}

.theme-amber .workflow-chip {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.theme-indigo .workflow-chip {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
}

.theme-cyan .workflow-chip {
  background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
}

.theme-violet .workflow-chip {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
}

.theme-sky .workflow-chip {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.theme-teal .workflow-chip {
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
}

.theme-fuchsia .workflow-chip {
  background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%);
}

.theme-lime .workflow-chip {
  background: linear-gradient(135deg, #f7fee7 0%, #ecfccb 100%);
}

.theme-yellow .workflow-chip {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
}

.theme-stone .workflow-chip {
  background: linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%);
}

.theme-sky .overview-panel {
  background: linear-gradient(135deg, #f8fcff 0%, #eef8ff 100%);
}

.theme-teal .overview-panel {
  background: linear-gradient(135deg, #f4fffd 0%, #e6fffb 100%);
}

.theme-orange .overview-panel {
  background: linear-gradient(135deg, #fff9f5 0%, #fff1e8 100%);
}

.theme-emerald .overview-panel {
  background: linear-gradient(135deg, #f4fffb 0%, #e6fff4 100%);
}

.theme-stone .overview-panel {
  background: linear-gradient(135deg, #fcfcfb 0%, #f7f6f4 100%);
}

.theme-sky .detail-highlight {
  background: linear-gradient(135deg, #f8fcff 0%, #eef8ff 100%);
}

.theme-teal .detail-highlight {
  background: linear-gradient(135deg, #f4fffd 0%, #e6fffb 100%);
}

.theme-orange .detail-highlight {
  background: linear-gradient(135deg, #fff9f5 0%, #fff1e8 100%);
}

.theme-emerald .detail-highlight {
  background: linear-gradient(135deg, #f4fffb 0%, #e6fff4 100%);
}

.theme-stone .detail-highlight {
  background: linear-gradient(135deg, #fcfcfb 0%, #f7f6f4 100%);
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 26px 42px;
  margin-bottom: 28px;
}

.search-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-item span {
  font-size: 18px;
  font-weight: 700;
  color: #9a9a9a;
}

.toolbar,
.result-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar {
  margin-bottom: 34px;
}

.search-card :deep(.page-block__body) {
  padding: 40px 54px;
}

.table-card :deep(.page-block__body) {
  padding: 38px 54px 46px;
}

.search-toolbar {
  justify-content: flex-start;
  margin-bottom: 0;
}

.search-toolbar .toolbar__right {
  margin-left: 0;
}

.list-toolbar {
  justify-content: flex-start;
}

.toolbar__left,
.toolbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.result-bar {
  display: none;
}

.result-bar strong {
  color: #111827;
}

.result-bar span {
  color: #6f7a8f;
  font-size: 13px;
}

.result-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result-pills em {
  padding: 4px 10px;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  font-style: normal;
  font-size: 12px;
}

.summary-band {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: #fff;
  color: #334155;
  font-weight: 600;
}

.filter-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.filter-tags__label {
  color: #6f7a8f;
  font-size: 13px;
  font-weight: 700;
}

.theme-rose .summary-band,
.theme-emerald .summary-band,
.theme-yellow .summary-band,
.theme-cyan .summary-band,
.theme-amber .summary-band,
.theme-indigo .summary-band,
.theme-violet .summary-band,
.theme-sky .summary-band,
.theme-teal .summary-band,
.theme-orange .summary-band,
.theme-stone .summary-band,
.theme-fuchsia .summary-band,
.theme-lime .summary-band {
  background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%);
}

.special-table :deep(.el-table) {
  border-radius: 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 36px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: 0;
}

:deep(.special-dialog.el-dialog) {
  margin-top: 4vh !important;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
}

:deep(.special-dialog .el-dialog__header) {
  padding: 24px 36px 18px;
  margin: 0;
  border-bottom: 1px solid #eeeeee;
}

:deep(.special-dialog .el-dialog__title) {
  color: #111111;
  font-size: 24px;
  font-weight: 700;
}

:deep(.special-dialog .el-dialog__body) {
  max-height: calc(92vh - 182px);
  padding: 26px 42px 30px;
  overflow: auto;
  background: #ffffff;
}

:deep(.special-dialog .el-dialog__footer) {
  padding: 20px 42px 24px;
  border-top: 1px solid #eeeeee;
}

:deep(.special-dialog .el-dialog__footer .el-button) {
  min-width: 140px;
  height: 52px;
  font-size: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 48px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item p {
  margin: 0;
  color: #40516b;
  font-size: 19px;
  font-weight: 700;
}

.form-item--full {
  grid-column: 1 / -1;
}

:deep(.special-form-dialog .el-input),
:deep(.special-form-dialog .el-select),
:deep(.special-form-dialog .el-date-editor.el-input) {
  --el-input-height: 56px;
  font-size: 18px;
}

:deep(.special-form-dialog .el-input-number) {
  width: 100%;
}

:deep(.special-form-dialog .el-textarea__inner) {
  min-height: 108px !important;
  border: 0;
  border-radius: 6px;
  background: #f6f7f9;
  box-shadow: none;
  font-size: 18px;
}

:deep(.special-form-dialog .el-select__wrapper),
:deep(.special-form-dialog .el-input__wrapper) {
  min-height: 56px;
  background: #f6f7f9;
}

:deep(.special-detail-dialog .el-dialog__body) {
  padding-top: 28px;
}

.section-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-highlights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.detail-highlight {
  padding: 18px 20px;
  border-radius: 22px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: #fff;
}

.detail-highlight p {
  margin: 0;
  color: #6f7a8f;
  font-size: 13px;
}

.detail-highlight strong {
  display: block;
  margin-top: 10px;
  color: #111827;
  font-size: 22px;
}

.detail-highlight span {
  display: block;
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
}

.detail-section {
  padding: 24px 0;
  border-radius: 0;
  border: 0;
  border-bottom: 1px solid #eeeeee;
  background: #ffffff;
}

.detail-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-section__head h4 {
  margin: 0;
  font-size: 26px;
  color: #111111;
}

.detail-section__head span {
  color: #6f7a8f;
  font-size: 13px;
  font-weight: 700;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 26px 64px;
}

.detail-item {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 0;
  border-radius: 0;
  background: transparent;
}

.detail-item p {
  min-width: 126px;
  margin: 0;
  color: #9a9a9a;
  font-size: 20px;
  font-weight: 700;
}

.detail-item strong {
  color: #111111;
  font-size: 20px;
}

.timeline-stack {
  display: grid;
  gap: 12px;
}

.timeline-card {
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid rgba(220, 228, 242, 0.92);
  background: #fff;
}

.timeline-card span {
  display: block;
  color: #98a2b3;
  font-size: 13px;
}

.timeline-card strong {
  display: block;
  margin: 6px 0 8px;
}

.timeline-card p {
  margin: 0;
  color: #667085;
}

@media (max-width: 1180px) {
  .hero-grid,
  .workflow-strip,
  .overview-panels,
  .detail-highlights,
  .search-grid,
  .detail-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
