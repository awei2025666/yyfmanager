<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Plus, Refresh, Search } from '@element-plus/icons-vue'
import PageBlock from '../components/PageBlock.vue'
import { crudModuleConfigs } from '../config/crudModules'
import {
  executeSpecialModuleAction,
  loadSpecialModuleFormOptions,
  loadSpecialModuleRows,
  persistSpecialModuleRow
} from '../services/specialModuleData'
import { getTenantOutsourceTenants } from '../api/tenant'

const props = defineProps({
  moduleKey: {
    type: String,
    required: true
  }
})
const router = useRouter()
const route = useRoute()
const durationPackages = [
  { key: 'monthly', name: '月卡', days: '有效时长30天', price: '¥100.00', original: '¥999.00' },
  { key: 'quarterly', name: '季卡', days: '有效时长120天', price: '¥300.00', original: '¥999.00' },
  { key: 'yearly', name: '年卡', days: '有效时长365天', price: '¥700.00', original: '¥999.00' }
]
const selectedDurationPackage = ref('monthly')
const selectedPayment = ref('wechat')
const durationAgreement = ref(true)

const profiles = {
  receipts: {
    title: '收款信息',
    subtitle: '收款登记、核销明细与回款追踪',
    createText: '添加',
    secondaryActionText: '导出',
    summaryText: (rows) => `收款合计：${sumMoney(rows, 'amount')}    折让合计：${sumMoney(rows, 'discount')}`,
    theme: 'emerald',
    workflows: ['收款登记', '核销订单', '尾款跟踪'],
    rowActions: ['打印', '编辑', '详情', '删除'],
    detailActionText: '收款详情',
    dialogWidth: '1280px',
    searchFields: [
      { key: 'receiptNo', label: '收款单号', placeholder: '边输边搜' },
      { key: 'customer', label: '单位名称', placeholder: '边输边搜' },
      { key: 'collector', label: '收款人', placeholder: '边输边搜' },
      { key: 'accountId', label: '收款账户', type: 'select', placeholder: '请选择' },
      { key: 'updatedAt', label: '收款时间', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    columns: [
      { key: 'receiptNo', label: '收款单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'updatedAt', label: '收款时间' },
      { key: 'collector', label: '收款人' },
      { key: 'account', label: '收款账户' },
      { key: 'amount', label: '收款金额' },
      { key: 'discount', label: '折让' },
      { key: 'remark', label: '摘要' }
    ],
    formFields: [
      { key: 'cooperativeClientId', label: '单位名称', type: 'select' },
      { key: 'collectionTime', label: '收款时间', type: 'date' },
      { key: 'accountId', label: '收款账户', type: 'select' },
      { key: 'amount', label: '收款金额', type: 'input' },
      { key: 'discount', label: '折让金额', type: 'input' },
      { key: 'remark', label: '摘要', type: 'textarea' },
      { key: 'proofImg', label: '收款凭证', type: 'input' }
    ],
    sections: [
      {
        title: '收款信息',
        type: 'grid',
        fields: [
          { key: 'receiptNo', label: '收款单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'collectionTime', label: '收款时间' },
          { key: 'account', label: '收款账户' },
          { key: 'amount', label: '收款金额' },
          { key: 'discount', label: '折让金额' },
          { key: 'remark', label: '摘要' },
          { key: 'proofImg', label: '收款凭证' },
          { key: 'operator', label: '操作员' },
          { key: 'operationTime', label: '操作时间' }
        ]
      },
      {
        title: '收款明细',
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
          { key: 'status', label: '订单状态', tag: true },
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
    createText: '添加',
    secondaryActionText: '导出',
    summaryText: (rows) => `报销合计：${sumMoney(rows, 'amount')}    折让合计：${sumMoney(rows, 'discount')}`,
    theme: 'rose',
    workflows: ['发起申请', '审批流转', '结果归档'],
    rowActions: ['打印', '编辑', '详情', '删除'],
    detailActionText: '报销详情',
    dialogWidth: '1280px',
    searchFields: [
      { key: 'name', label: '报销单号', placeholder: '边输边搜' },
      { key: 'applicant', label: '报销人', placeholder: '边输边搜' },
      { key: 'accountId', label: '报销账户', type: 'select', placeholder: '请选择' },
      { key: 'status', label: '报销状态', type: 'select', placeholder: '请选择', options: ['待审批', '已通过', '已驳回'] },
      { key: 'updatedAt', label: '起始时间', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    columns: [
      { key: 'name', label: '报销单号' },
      { key: 'applicant', label: '报销人' },
      { key: 'updatedAt', label: '报销时间' },
      { key: 'account', label: '报销账户' },
      { key: 'amount', label: '金额' },
      { key: 'discount', label: '折让' },
      { key: 'remark', label: '摘要' }
    ],
    formFields: [
      { key: 'reimburseTime', label: '报销时间', type: 'date' },
      { key: 'accountId', label: '报销账户', type: 'select' },
      { key: 'amount', label: '报销金额', type: 'number' },
      { key: 'discount', label: '折让金额', type: 'number' },
      { key: 'remark', label: '摘要', type: 'textarea' },
      { key: 'proofImg', label: '报销凭证', type: 'input' }
    ],
    sections: [
      {
        title: '报销信息',
        type: 'grid',
        fields: [
          { key: 'name', label: '报销单号' },
          { key: 'updatedAt', label: '报销时间' },
          { key: 'account', label: '报销账户' },
          { key: 'amount', label: '报销金额' },
          { key: 'discount', label: '折让金额' },
          { key: 'remark', label: '摘要' },
          { key: 'proofImg', label: '报销凭证' },
          { key: 'applicant', label: '操作员' },
          { key: 'operationTime', label: '操作时间' }
        ]
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
    createText: '添加',
    summaryText: (rows) =>
      `待配送量：${rows.filter((item) => item.status === '待配送').length}    已配送量：${rows.filter((item) => item.status === '已完成').length}`,
    theme: 'amber',
    workflows: ['司机排班', '订单分配', '配送签收'],
    rowActions: ['详情', '编辑', '删除'],
    detailActionText: '开始对接配送接口',
    dialogWidth: '1080px',
    searchFields: [
      { key: 'deliveryNo', label: '配送单号', placeholder: '请输入' },
      { key: 'filler', label: '填单员', placeholder: '请输入' },
      { key: 'orderInfo', label: '订单信息', placeholder: '请输入' },
      { key: 'driver', label: '配送员', placeholder: '请输入' },
      { key: 'status', label: '配送状态', type: 'select', placeholder: '请选择', options: ['待配送', '配送中', '已完成'] },
      { key: 'createdAt', label: '创建时间', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    columns: [
      { key: 'deliveryNo', label: '配送单号' },
      { key: 'createdAt', label: '创建时间' },
      { key: 'filler', label: '填单员' },
      { key: 'orderInfo', label: '订单信息' },
      { key: 'driver', label: '配送员' },
      { key: 'progress', label: '配送进度' },
      { key: 'status', label: '配送状态', tag: true }
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
        title: '订单信息',
        type: 'table',
        dataKey: 'deliveryOrders',
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'orderTime', label: '订单时间' },
          { key: 'filler', label: '填单员' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '订单金额' },
          { key: 'orderStatus', label: '订单状态', tag: true },
          { key: 'status', label: '配送状态', tag: true }
        ]
      },
      {
        title: '用户信息',
        type: 'table',
        dataKey: 'driverRows',
        columns: [
          { key: 'name', label: '用户姓名' },
          { key: 'phone', label: '联系方式' },
          { key: 'department', label: '所在部门' },
          { key: 'roleText', label: '用户角色' }
        ]
      },
      {
        title: '订单记录',
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
    createText: '',
    secondaryActionText: '导出',
    summaryText: (rows) =>
      `待生产：${rows.filter((item) => item.status === '待生产').length}    已生产：${rows.filter((item) => item.status === '已生产').length}    客户金额：${sumMoney(rows, 'amount')}`,
    theme: 'indigo',
    workflows: ['工艺排产', '产品生产', '记录归档'],
    rowActions: ['详情'],
    detailActionText: '开始对接工艺接口',
    dialogWidth: '1080px',
    searchFields: [
      { key: 'customer', label: '单位名称', placeholder: '边输边搜' },
      { key: 'productName', label: '产品名称', placeholder: '边输边搜' },
      { key: 'craftName', label: '工艺名称', placeholder: '边输边搜' },
      { key: 'orderNo', label: '所属订单号', placeholder: '请输入' },
      { key: 'orderTime', label: '起始时间', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    columns: [
      { key: 'orderNo', label: '所属订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'orderTime', label: '订单时间' },
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
          { key: 'basePrice', label: '起价' },
          { key: 'finishedCount', label: '成品数量' },
          { key: 'unit', label: '单位' },
          { key: 'unitPrice', label: '单价' },
          { key: 'amount', label: '客户金额' },
          { key: 'remark', label: '备注' }
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
        title: '订单信息',
        type: 'grid',
        fields: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'contact', label: '联系人' },
          { key: 'phone', label: '联系方式' },
          { key: 'deliveryAddress', label: '送货地址' },
          { key: 'deliveryDate', label: '交货日期' },
          { key: 'deliveryType', label: '交货方式' },
          { key: 'printRequirement', label: '印刷要求' },
          { key: 'remark', label: '备注' }
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
    title: '外协订单',
    subtitle: '外协转入订单、接单单位与流转记录',
    createText: '',
    secondaryActionText: '',
    theme: 'cyan',
    workflows: ['接收入库', '生产流转', '配送完成'],
    rowActions: ['详情'],
    detailActionText: '开始对接外协转入接口',
    dialogWidth: '1080px',
    searchFields: [
      { key: 'customer', label: '单位名称', placeholder: '请输入' },
      { key: 'supplier', label: '转单单位', placeholder: '请输入' },
      { key: 'sales', label: '业务员', placeholder: '请输入' },
      { key: 'orderNo', label: '订单号', placeholder: '请输入' },
      { key: 'status', label: '订单状态', type: 'select', options: ['待审批', '待生产', '生产中', '待配送', '配送中', '已完成', '已驳回'] },
      { key: 'updatedAt', label: '订单时间', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'updatedAt', label: '订单时间' },
      { key: 'supplier', label: '转单单位' },
      { key: 'productInfo', label: '产品信息' },
      { key: 'amount', label: '订单金额' },
      { key: 'status', label: '订单状态', tag: true },
      { key: 'printAction', label: '工单打印', action: '打印' }
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
    title: '外协订单',
    subtitle: '外协转出订单、接单单位与流转记录',
    createText: '',
    secondaryActionText: '',
    theme: 'violet',
    workflows: ['转出下单', '节点跟踪', '结果回传'],
    rowActions: ['详情'],
    detailActionText: '开始对接外协转出接口',
    dialogWidth: '1080px',
    searchFields: [
      { key: 'customer', label: '单位名称', placeholder: '请输入' },
      { key: 'supplier', label: '接单单位', placeholder: '请输入' },
      { key: 'sales', label: '业务员', placeholder: '请输入' },
      { key: 'orderNo', label: '订单号', placeholder: '请输入' },
      { key: 'status', label: '订单状态', type: 'select', options: ['待审批', '待生产', '生产中', '待配送', '配送中', '已完成', '已驳回'] },
      { key: 'updatedAt', label: '订单时间', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'updatedAt', label: '订单时间' },
      { key: 'sales', label: '业务员' },
      { key: 'supplier', label: '接单单位' },
      { key: 'productInfo', label: '产品信息' },
      { key: 'amount', label: '订单金额' },
      { key: 'status', label: '订单状态', tag: true }
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
    tableHint: '按接单单位和流转状态跟踪外协转出单',
    spotlight: outsourceSpotlight('转出')
  }
}

function money(value) {
  return Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0
}

function getFieldDefault(field) {
  if (field.defaultValue !== undefined) return field.defaultValue
  if (field.type === 'checkbox') return []
  if (field.type === 'number') return null
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
    createText: overrides.createText ?? config.createText ?? '新增',
    secondaryActionText: overrides.secondaryActionText ?? config.secondaryActionText ?? '',
    theme: overrides.theme || config.theme || 'slate',
    workflows: overrides.workflows || config.workflows || [],
    rowActions: overrides.rowActions || config.rowActions || ['详情', '编辑', '打印'],
    detailActionText: overrides.detailActionText || `开始对接${config.title}接口`,
    panels: overrides.panels || [],
    detailHighlights: overrides.detailHighlights || [],
    summaryText: overrides.summaryText || config.summaryText || '',
    footerHint: overrides.footerHint || config.footerHint || '',
    dialogWidth: config.dialogWidth || '920px',
    treeKey: config.treeKey,
    treeTitle: config.treeTitle,
    treeData: config.treeData || [],
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
      {
        title: '客户信息',
        type: 'grid',
        fields: [
          'name',
          'customerType',
          'fullName',
          'payAccount',
          'contact',
          'phone',
          'sales',
          'address',
          'remark',
          'operator',
          'operationTime'
        ]
          .map((key) => crudModuleConfigs.customers.detailFields.find((field) => field.key === key))
          .filter(Boolean)
      },
      { title: '订单记录', type: 'table', dataKey: 'orderRecords', columns: crudModuleConfigs.customers.detailTabs[0].columns },
      { title: '工艺记录', type: 'table', dataKey: 'craftRecords', columns: crudModuleConfigs.customers.detailTabs[1].columns },
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
    rowActions: ['重置密码', '编辑', '删除'],
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
    workflows: [],
    panels: () => [],
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
      title: '耗材库存概况',
      desc: '按耗材明细汇总入库、出库与当前库存。',
      items: [
        `耗材总数 ${rows.length} 项`,
        `库存充足 ${rows.filter((item) => item.status === '充足').length} 项`,
        `库存预警 ${rows.filter((item) => item.status === '预警').length} 项`
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
      {
        title: '订单信息',
        type: 'table',
        dataKey: 'orderRows',
        showWhen: (row) => row.type === '订单消耗' || row.status === '订单消耗',
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'orderTime', label: '订单时间' },
          { key: 'filler', label: '填单员' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '订单金额' },
          { key: 'status', label: '订单状态', tag: true },
          { key: 'orderDetail', label: '操作', action: '订单详情' }
        ]
      },
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
    title: '账户列表',
    theme: 'emerald',
    dialogWidth: '1280px',
    workflows: [],
    rowActions: ['编辑', '删除'],
    searchFields: [
      { key: 'name', label: '账户名称', type: 'input', placeholder: '请输入' },
      { key: 'accountNo', label: '卡号', type: 'input', placeholder: '请输入' },
      { key: 'bank', label: '开户行', type: 'input', placeholder: '请输入' },
      { key: 'status', label: '状态', type: 'select', placeholder: '请选择', options: ['启用', '禁用'] }
    ],
    formFields: [
      { key: 'name', label: '账户名称', type: 'input' },
      { key: 'accountNo', label: '卡号', type: 'input' },
      { key: 'bank', label: '开户行', type: 'input' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'name', label: '账户名称' },
      { key: 'accountNo', label: '卡号' },
      { key: 'bank', label: '开户行' },
      { key: 'balance', label: '账户金额' },
      { key: 'status', label: '状态', switch: true }
    ],
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
      { title: '账户信息', type: 'grid', fields: [
        { key: 'name', label: '账户名称' },
        { key: 'accountNo', label: '卡号' },
        { key: 'bank', label: '开户行' },
        { key: 'balance', label: '账户金额' },
        { key: 'status', label: '状态' }
      ] },
      { title: '备注信息', type: 'grid', fields: [{ key: 'remark', label: '备注' }] }
    ],
    stats: (rows) => [
      { label: '账户数量', value: rows.length },
      { label: '启用账户', value: rows.filter((item) => item.status === '启用').length },
      { label: '冻结账户', value: rows.filter((item) => item.status === '禁用').length },
      { label: '账户余额', value: `¥${rows.reduce((sum, item) => sum + Number(item.balance || 0), 0).toFixed(2)}` }
    ]
  }),
  fundDetails: createConfigProfile('fundDetails', {
    theme: 'emerald',
    createText: '',
    rowActions: [],
    workflows: [],
    summaryText: (rows) => `收入合计：${sumMoney(rows, 'income')}    支出合计：${sumMoney(rows, 'expense')}`,
    searchFields: [
      { key: 'account', label: '账户名称', type: 'input', placeholder: '请输入' },
      { key: 'accountType', label: '账户类型', type: 'select', placeholder: '请选择', options: ['微信', '支付宝', '公账'] },
      { key: 'accountNo', label: '卡号', type: 'input', placeholder: '请输入' },
      { key: 'bank', label: '开户行', type: 'input', placeholder: '请输入' },
      { key: 'status', label: '状态', type: 'select', placeholder: '请选择', options: ['收款', '报销'] },
      { key: 'time', label: '起始时间', type: 'input', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    columns: [
      { key: 'time', label: '时间' },
      { key: 'bizNo', label: '单号' },
      { key: 'type', label: '类型' },
      { key: 'remark', label: '摘要' },
      { key: 'account', label: '账户名称' },
      { key: 'income', label: '收入金额' },
      { key: 'expense', label: '支出金额' },
      { key: 'balance', label: '余额' }
    ],
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
    createText: '',
    secondaryActionText: '',
    summaryText: (rows) => `账单金额：${sumMoney(rows, 'amount')}    已收金额：${sumMoney(rows, 'received')}    剩余尾款：${sumMoney(rows, 'unpaid')}`,
    rowActions: [],
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
    createText: '',
    secondaryActionText: '',
    summaryText: (rows) => `账单金额：${sumMoney(rows, 'amount')}    已收金额：${sumMoney(rows, 'received')}    剩余尾款：${sumMoney(rows, 'unpaid')}`,
    rowActions: [],
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
    summaryText: (rows) =>
      `待生产：${rows.filter((item) => item.status === '待生产').length}    已生产：${rows.filter((item) => item.status === '已生产').length}    客户金额：${sumMoney(rows, 'amount')}`,
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
    }),
    stats: (rows) => [
      { label: '待生产', value: rows.filter((item) => item.status === '待生产').length },
      { label: '已生产', value: rows.filter((item) => item.status === '已生产').length },
      { label: '客户金额', value: sumMoney(rows, 'amount') },
      { label: '外协工艺', value: rows.length }
    ]
  })
}

const profile = profiles[props.moduleKey] || configProfiles[props.moduleKey] || buildFallbackProfile(props.moduleKey)
const filters = reactive(Object.fromEntries(profile.searchFields.map((field) => [field.key, ''])))
const detailVisible = ref(false)
const currentRow = ref(null)
const dialogVisible = ref(false)
const rowDetailVisible = ref(false)
const rowDetailTitle = ref('')
const rowDetailItems = ref([])
const routeDetailToken = ref('')
const outsourceTransferVisible = ref(false)
const outsourceTransferRow = ref(null)
const outsourceTransferTenantId = ref('')
const outsourceTransferKeyword = ref('')
const outsourceTransferOptions = ref([])
const outsourceTransferLoading = ref(false)
const outsourceTransferSaving = ref(false)
const activeCustomerDetailTab = ref('orderRecords')
const resetPasswordVisible = ref(false)
const resetPasswordForm = reactive({
  password: ''
})
const treeSearch = ref('')
const staffTenantOptions = ref([])
const staffMenuOptions = ref([])
const staffDepartmentRemoteOptions = ref([])
const staffFallbackRoleOptions = [
  { label: '业务员', value: '业务员' },
  { label: '业务员（自动审批）', value: '业务员（自动审批）' },
  { label: '生产员', value: '生产员' },
  { label: '耗材记录员', value: '耗材记录员' },
  { label: '物流调度员', value: '物流调度员' },
  { label: '物流司机', value: '物流司机' }
]
const customerSalesOptions = ref([])
const deliveryOrderPickerVisible = ref(false)
const deliveryDriverPickerVisible = ref(false)
const deliveryOrderOptions = ref([])
const deliveryDriverOptions = ref([])
const deliveryOrderFilters = reactive({
  orderNo: '',
  productInfo: ''
})
const deliveryDriverFilters = reactive({
  name: '',
  phone: ''
})
const deliverySelectedOrderIds = ref([])
const deliverySelectedDriverId = ref('')
const deliveryOptionsLoading = ref(false)
const materialOrderPickerVisible = ref(false)
const materialOrderOptions = ref([])
const materialOrderFilters = reactive({
  orderNo: '',
  productInfo: ''
})
const materialOrderOptionsLoading = ref(false)
const materialSelectedOrderId = ref('')
const craftPerformanceChecksReady = ref(false)
const craftPerformanceChecks = reactive({
  people: [],
  machines: [],
  crafts: []
})
const craftPerformanceMachineKeys = ['bigMachine', 'smallMachine']
const craftPerformanceFixedColumnKeys = ['name', 'customer', 'productName', 'total']
const receiptAccountOptions = ref([])
const receiptCustomerOptions = ref([])
const receiptOrderPickerVisible = ref(false)
const receiptOrderOptions = ref([])
const receiptOrderFilters = reactive({
  orderNo: '',
  productInfo: ''
})
const receiptSelectedOrderIds = ref([])
const receiptOptionsLoading = ref(false)
const reimbursementAccountOptions = ref([])
const formState = reactive({})
const sequence = ref(1)
const state = reactive({
  loading: false,
  detailLoading: false,
  saving: false,
  exporting: false,
  resetPasswordSaving: false,
  pageNum: 1,
  pageSize: 10
})
const dataset = ref([])
const staffDepartmentCache = ref(new Set())

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

const craftPerformanceMetricColumns = computed(() =>
  (crudModuleConfigs.craftPerformance?.columns || []).filter((column) =>
    !craftPerformanceFixedColumnKeys.includes(column.key)
  )
)
const craftPerformanceMachineOptions = computed(() =>
  craftPerformanceMetricColumns.value
    .filter((column) => craftPerformanceMachineKeys.includes(column.key))
    .map((column) => ({ label: column.label, value: column.key }))
)
const craftPerformanceCraftOptions = computed(() =>
  craftPerformanceMetricColumns.value
    .filter((column) => !craftPerformanceMachineKeys.includes(column.key))
    .map((column) => ({ label: column.label, value: column.key }))
)
const craftPerformancePeopleOptions = computed(() => {
  const names = Array.from(new Set(rows.value.map((row) => row.name).filter((name) => name && name !== '-')))
  return names.map((name) => ({ label: name, value: name }))
})
const craftPerformanceFilterGroups = computed(() => [
  { key: 'people', label: '人员姓名', options: craftPerformancePeopleOptions.value },
  { key: 'machines', label: '机器类型', options: craftPerformanceMachineOptions.value },
  { key: 'crafts', label: '工艺名称', options: craftPerformanceCraftOptions.value }
])
const syncCraftPerformanceChecks = () => {
  if (!isCraftPerformanceModule.value) return
  craftPerformanceFilterGroups.value.forEach((group) => {
    const optionValues = group.options.map((option) => option.value)
    const previous = craftPerformanceChecks[group.key] || []
    const next = craftPerformanceChecksReady.value
      ? previous.filter((value) => optionValues.includes(value))
      : optionValues
    craftPerformanceChecks[group.key] = next.length || previous.length === 0 ? next : optionValues
  })
  craftPerformanceChecksReady.value = true
}
const craftPerformanceSelectedMetricKeys = computed(() => [
  ...craftPerformanceChecks.machines,
  ...craftPerformanceChecks.crafts
])
const tableColumns = computed(() => {
  if (!isCraftPerformanceModule.value) return profile.columns
  return profile.columns.filter((column) =>
    craftPerformanceFixedColumnKeys.includes(column.key) ||
    craftPerformanceSelectedMetricKeys.value.includes(column.key)
  )
})

const staffRoleOptions = computed(() => staffFallbackRoleOptions)
const staffConfiguredDepartmentOptions = computed(() => {
  const departmentField = (crudModuleConfigs.staff?.formFields || []).find((field) => field.key === 'department')
  return normalizeFieldOptions(departmentField?.options || [])
})
const staffDepartmentOptions = computed(() => {
  const optionsMap = new Map()
  staffDepartmentRemoteOptions.value.forEach((item) => {
    if (item.value && !optionsMap.has(item.value)) optionsMap.set(item.value, item)
  })
  dataset.value.forEach((row) => {
    const value = row.department || row.deptName
    if (!value || value === '-') return
    if (!optionsMap.has(value)) optionsMap.set(value, { label: value, value })
  })
  return Array.from(optionsMap.values())
})

const rememberStaffDepartments = (rows = []) => {
  if (!isStaffModule.value) return
  const next = new Set(staffDepartmentCache.value)
  rows.forEach((row) => {
    const value = row?.department || row?.deptName
    if (value && value !== '-') next.add(value)
  })
  if (next.size !== staffDepartmentCache.value.size) {
    staffDepartmentCache.value = next
  }
}

const materialDetailNameOptions = computed(() => {
  const options = new Map()
  dataset.value.forEach((item) => {
    if (!item.name || item.name === '-') return
    options.set(item.name, {
      label: item.name,
      value: item.name,
      raw: item
    })
  })
  return Array.from(options.values())
})

const matchesTreeFilter = (row) => {
  if (!hasTreePanel.value) return true
  const value = filters[profile.treeKey]
  if (!value) return true
  return String(row[profile.treeKey] ?? '').includes(String(value))
}
const matchesCraftPerformanceChecks = (row) => {
  if (!isCraftPerformanceModule.value) return true
  if (!craftPerformanceChecks.people.length) return false
  return craftPerformanceChecks.people.includes(row.name)
}

const filteredRows = computed(() =>
  rows.value.filter((row) =>
    matchesTreeFilter(row) &&
    matchesCraftPerformanceChecks(row) &&
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
const hasTreePanel = computed(() => Boolean(profile.treeData?.length && profile.treeKey))
const currentTreeValue = computed(() => filters[profile.treeKey] || '全部')
const staffTreeData = computed(() => {
  const baseChildren = staffDepartmentOptions.value
  const childrenMap = new Map(baseChildren.map((item) => [item.value, { ...item }]))
  return [
    {
      label: '全部',
      value: '全部',
      children: Array.from(childrenMap.values())
    }
  ]
})
const organizationTreeData = computed(() => {
  const childrenMap = new Map()
  rows.value.forEach((row) => {
    const parentName = row.group || row.parentName || row.parentDeptName || row.parentDepartmentName || ''
    if (parentName && parentName !== '-' && parentName !== '全部') {
      childrenMap.set(parentName, { label: parentName, value: parentName })
      return
    }
    if (row.name && row.name !== '-') {
      childrenMap.set(row.name, { label: row.name, value: row.name })
    }
  })
  return [
    {
      label: '全部',
      value: '全部',
      children: Array.from(childrenMap.values())
    }
  ]
})
const treeDataSource = computed(() => {
  if (isStaffModule.value) return staffTreeData.value
  if (isOrganizationModule.value) return organizationTreeData.value
  return profile.treeData || []
})
const visibleTreeNodes = computed(() => {
  const keyword = treeSearch.value.trim()
  if (!keyword) return treeDataSource.value

  const matchNode = (node) => {
    const selfMatched = String(node.label || '').includes(keyword)
    const children = (node.children || []).filter(matchNode)
    if (selfMatched || children.length) {
      return { ...node, children }
    }
    return null
  }

  return treeDataSource.value.map(matchNode).filter(Boolean)
})

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

const setStaffFormMode = (mode) => {
  if (!isStaffModule.value && !isOrganizationModule.value) return
  router.replace({
    name: props.moduleKey,
    query: {
      ...route.query,
      mode
    }
  })
}

const closeStaffForm = () => {
  dialogVisible.value = false
  if ((!isStaffModule.value && !isOrganizationModule.value) || !route.query.mode) return
  const query = { ...route.query }
  delete query.mode
  router.replace({ name: props.moduleKey, query })
}

const selectTreeNode = (node) => {
  filters[profile.treeKey] = node.value === '全部' ? '' : node.value
  state.pageNum = 1
  loadRows()
}

const openDetail = async (row) => {
  currentRow.value = row
  activeCustomerDetailTab.value = 'orderRecords'
  detailVisible.value = true
  const shouldLoadRemoteDetail = ['productCrafts', 'productCraftsOutsource', 'deliveryNotes', 'materialDetails', 'manualRecords', 'receipts', 'reimbursements'].includes(props.moduleKey) || isOutsourceModule.value
  if (!shouldLoadRemoteDetail) return

  state.detailLoading = true
  try {
    currentRow.value = await executeSpecialModuleAction(props.moduleKey, 'detail', row)
  } catch (error) {
    ElMessage.error(error?.message || '详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

const openCreate = () => {
  if (isDeliveryNotesModule.value) return openDeliveryCreate()
  normalizeForm()
  if (isReceiptsModule.value) {
    formState.collectionTime = defaultDateTime()
    formState.receiptOrders = []
  }
  if (isReimbursementsModule.value) {
    formState.reimburseTime = defaultDateTime()
    formState.updatedAt = formState.reimburseTime
    formState.amount = 0
    formState.discount = 0
    formState.status = '待审批'
  }
  if (isAccountsModule.value) {
    formState.status = '启用'
    formState.balance = 0
  }
  loadFormOptions()
  if (isStaffModule.value || isOrganizationModule.value) setStaffFormMode('create')
  dialogVisible.value = true
}

const openEdit = async (row) => {
  if (isDeliveryNotesModule.value) return openDeliveryEdit(row)
  normalizeForm()
  if (isReceiptsModule.value) {
    state.detailLoading = true
    try {
      const detail = await executeSpecialModuleAction(props.moduleKey, 'detail', row)
      Object.assign(formState, JSON.parse(JSON.stringify(detail)))
      formState.collectionTime = detail.collectionTime || detail.updatedAt || defaultDateTime()
      formState.receiptOrders = detail.receiptOrders || []
    } catch (error) {
      Object.assign(formState, JSON.parse(JSON.stringify(row)))
      formState.receiptOrders = row.receiptOrders || []
      ElMessage.error(error?.message || '收款详情加载失败')
    } finally {
      state.detailLoading = false
    }
  } else if (isReimbursementsModule.value) {
    state.detailLoading = true
    try {
      const detail = await executeSpecialModuleAction(props.moduleKey, 'detail', row)
      Object.assign(formState, JSON.parse(JSON.stringify(detail)))
      formState.reimburseTime = detail.reimburseTime || detail.updatedAt || defaultDateTime()
      formState.amount = money(detail.amount)
      formState.discount = money(detail.discount)
      formState.status = detail.status || '待审批'
    } catch (error) {
      Object.assign(formState, JSON.parse(JSON.stringify(row)))
      formState.reimburseTime = row.reimburseTime || row.updatedAt || defaultDateTime()
      formState.amount = money(row.amount)
      formState.discount = money(row.discount)
      formState.status = row.status || '待审批'
      ElMessage.error(error?.message || '报销详情加载失败')
    } finally {
      state.detailLoading = false
    }
  } else if (isMaterialDetailsModule.value) {
    state.detailLoading = true
    try {
      const detail = await executeSpecialModuleAction(props.moduleKey, 'detail', row)
      Object.assign(formState, JSON.parse(JSON.stringify(detail)))
    } catch (error) {
      Object.assign(formState, JSON.parse(JSON.stringify(row)))
      ElMessage.error(error?.message || '耗材明细详情加载失败')
    } finally {
      state.detailLoading = false
    }
  } else if (isManualRecordsModule.value) {
    state.detailLoading = true
    try {
      const detail = await executeSpecialModuleAction(props.moduleKey, 'detail', row)
      Object.assign(formState, JSON.parse(JSON.stringify(detail)))
    } catch (error) {
      Object.assign(formState, JSON.parse(JSON.stringify(row)))
      ElMessage.error(error?.message || '手工记录详情加载失败')
    } finally {
      state.detailLoading = false
    }
  } else {
    Object.assign(formState, JSON.parse(JSON.stringify(row)))
  }
  await loadFormOptions()
  if (isStaffModule.value || isOrganizationModule.value) setStaffFormMode('edit')
  dialogVisible.value = true
}

const loadFormOptions = async () => {
  if (!isStaffModule.value && !isCustomerModule.value && !isReceiptsModule.value && !isReimbursementsModule.value) return
  if (isStaffModule.value && staffMenuOptions.value.length && staffDepartmentRemoteOptions.value.length) return
  if (isCustomerModule.value && customerSalesOptions.value.length) return
  if (isReceiptsModule.value && receiptAccountOptions.value.length && receiptCustomerOptions.value.length) return
  if (isReimbursementsModule.value && reimbursementAccountOptions.value.length) return
  try {
    const options = await loadSpecialModuleFormOptions(props.moduleKey)
    if (isStaffModule.value) {
      staffTenantOptions.value = options.tenants || []
      staffMenuOptions.value = options.menus || []
      staffDepartmentRemoteOptions.value = options.departments || []
    }
    if (isCustomerModule.value) {
      customerSalesOptions.value = options.sales || []
    }
    if (isReceiptsModule.value) {
      receiptAccountOptions.value = options.accounts || []
      receiptCustomerOptions.value = options.customers || []
    }
    if (isReimbursementsModule.value) {
      reimbursementAccountOptions.value = options.accounts || []
    }
  } catch (error) {
    if (isStaffModule.value) {
      staffMenuOptions.value = staffFallbackRoleOptions
      staffDepartmentRemoteOptions.value = []
      return
    }
    ElMessage.error(error?.message || '表单选项加载失败')
  }
}

const deliveryOrderRowId = (row) => String(row.orderPrimaryId || row.id || row.orderNo || '')
const deliveryDriverRowId = (row) => String(row.id || row.userId || '')

const loadDeliveryOptions = async () => {
  deliveryOptionsLoading.value = true
  try {
    const options = await loadSpecialModuleFormOptions('deliveryNotes')
    deliveryOrderOptions.value = options.deliveryOrders || []
    deliveryDriverOptions.value = options.drivers || []
  } catch (error) {
    ElMessage.error(error?.message || '配送单选项加载失败')
    deliveryOrderOptions.value = []
    deliveryDriverOptions.value = []
  } finally {
    deliveryOptionsLoading.value = false
  }
}

const defaultDateTime = () => {
  const pad = (value) => String(value).padStart(2, '0')
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const receiptOrderRowId = (row) => String(row.orderPrimaryId || row.orderId || row.id || row.orderNo || '')
const receiptOrderIsSelected = (row) => receiptSelectedOrderIds.value.includes(receiptOrderRowId(row))
const receiptAmountTotal = computed(() =>
  (formState.receiptOrders || []).reduce((total, row) => total + (Number(row.currentAmount) || 0), 0)
)
const receiptDiscountTotal = computed(() =>
  (formState.receiptOrders || []).reduce((total, row) => total + (Number(row.currentDiscount) || 0), 0)
)
const receiptAmountTotalText = computed(() => `¥${receiptAmountTotal.value.toFixed(2)}`)
const receiptDiscountTotalText = computed(() => `¥${receiptDiscountTotal.value.toFixed(2)}`)
const reimbursementAmountText = computed(() => `¥${money(formState.amount).toFixed(2)}`)
const reimbursementDiscountText = computed(() => `¥${money(formState.discount).toFixed(2)}`)
const currentReceiptAmountText = computed(() => {
  const rows = currentRow.value?.receiptOrders || []
  const total = rows.reduce((sum, row) => sum + (Number(row.currentAmount) || 0), 0)
  return `¥${total.toFixed(2)}`
})
const currentReceiptDiscountText = computed(() => {
  const rows = currentRow.value?.receiptOrders || []
  const total = rows.reduce((sum, row) => sum + (Number(row.currentDiscount) || 0), 0)
  return `¥${total.toFixed(2)}`
})
const currentReimbursementAmountText = computed(() => `¥${money(currentRow.value?.amount).toFixed(2)}`)
const currentReimbursementDiscountText = computed(() => `¥${money(currentRow.value?.discount).toFixed(2)}`)

const handleReceiptCustomerChange = (value) => {
  const option = receiptCustomerOptions.value.find((item) => String(item.value) === String(value))
  formState.customer = option?.label || ''
  formState.cooperativeClientId = value
  formState.receiptOrders = []
}

const loadReceiptOrderOptions = async () => {
  receiptOptionsLoading.value = true
  try {
    receiptOrderOptions.value = await executeSpecialModuleAction('receipts', 'receiptOrders', {
      pageNum: 1,
      pageSize: 999,
      cooperativeClientId: formState.cooperativeClientId,
      orderNo: receiptOrderFilters.orderNo || undefined,
      productInfo: receiptOrderFilters.productInfo || undefined
    })
  } catch (error) {
    receiptOrderOptions.value = []
    ElMessage.error(error?.message || '订单列表加载失败')
  } finally {
    receiptOptionsLoading.value = false
  }
}

const openReceiptOrderPicker = async () => {
  receiptSelectedOrderIds.value = (formState.receiptOrders || []).map(receiptOrderRowId).filter(Boolean)
  receiptOrderPickerVisible.value = true
  await loadReceiptOrderOptions()
}

const clearReceiptOrderFilters = () => {
  receiptOrderFilters.orderNo = ''
  receiptOrderFilters.productInfo = ''
  loadReceiptOrderOptions()
}

const confirmReceiptOrders = () => {
  const existing = new Map((formState.receiptOrders || []).map((row) => [receiptOrderRowId(row), row]))
  formState.receiptOrders = receiptOrderOptions.value
    .filter((row) => receiptSelectedOrderIds.value.includes(receiptOrderRowId(row)))
    .map((row) => ({
      ...row,
      currentAmount: existing.get(receiptOrderRowId(row))?.currentAmount ?? row.currentAmount ?? row.arrearsAmount ?? 0,
      currentDiscount: existing.get(receiptOrderRowId(row))?.currentDiscount ?? row.currentDiscount ?? 0
    }))
  receiptOrderPickerVisible.value = false
}

const toggleReceiptOrder = (row, checked) => {
  const id = receiptOrderRowId(row)
  receiptSelectedOrderIds.value = checked
    ? Array.from(new Set([...receiptSelectedOrderIds.value, id]))
    : receiptSelectedOrderIds.value.filter((item) => item !== id)
  if (checked) {
    row.currentAmount = row.currentAmount || row.arrearsAmount || 0
    row.currentDiscount = row.currentDiscount || 0
  }
}

const removeReceiptOrder = (row) => {
  const id = receiptOrderRowId(row)
  formState.receiptOrders = (formState.receiptOrders || []).filter((item) => receiptOrderRowId(item) !== id)
}

const resetDeliveryDraft = () => {
  normalizeForm()
  formState.deliveryOrders = []
  formState.driverRows = []
  formState.orderIdList = []
  formState.deliveryTenantUserId = ''
  deliverySelectedOrderIds.value = []
  deliverySelectedDriverId.value = ''
  deliveryOrderFilters.orderNo = ''
  deliveryOrderFilters.productInfo = ''
  deliveryDriverFilters.name = ''
  deliveryDriverFilters.phone = ''
}

const openDeliveryCreate = async () => {
  resetDeliveryDraft()
  dialogVisible.value = true
  await loadDeliveryOptions()
}

const openDeliveryEdit = async (row) => {
  resetDeliveryDraft()
  dialogVisible.value = true
  state.detailLoading = true
  try {
    const detail = await executeSpecialModuleAction('deliveryNotes', 'detail', row)
    Object.assign(formState, detail)
    formState.deliveryOrders = detail.deliveryOrders || []
    formState.driverRows = detail.driverRows || []
    formState.orderIdList = formState.deliveryOrders.map((item) => item.orderPrimaryId || item.id).filter(Boolean)
    formState.deliveryTenantUserId = formState.driverRows[0]?.id || ''
    deliverySelectedOrderIds.value = formState.deliveryOrders.map(deliveryOrderRowId).filter(Boolean)
    deliverySelectedDriverId.value = formState.deliveryTenantUserId ? String(formState.deliveryTenantUserId) : ''
    await loadDeliveryOptions()
  } catch (error) {
    ElMessage.error(error?.message || '配送单详情加载失败')
  } finally {
    state.detailLoading = false
  }
}

const filteredDeliveryOrderOptions = computed(() =>
  deliveryOrderOptions.value.filter((item) => {
    const orderNo = deliveryOrderFilters.orderNo.trim()
    const productInfo = deliveryOrderFilters.productInfo.trim()
    return (!orderNo || String(item.orderNo || '').includes(orderNo)) &&
      (!productInfo || String(item.productInfo || '').includes(productInfo))
  })
)

const filteredDeliveryDriverOptions = computed(() =>
  deliveryDriverOptions.value.filter((item) => {
    const name = deliveryDriverFilters.name.trim()
    const phone = deliveryDriverFilters.phone.trim()
    return (!name || String(item.name || '').includes(name)) &&
      (!phone || String(item.phone || '').includes(phone))
  })
)

const syncDeliverySelectedOrderIds = () => {
  deliverySelectedOrderIds.value = (formState.deliveryOrders || []).map(deliveryOrderRowId).filter(Boolean)
}

const openDeliveryOrderPicker = () => {
  syncDeliverySelectedOrderIds()
  deliveryOrderPickerVisible.value = true
}

const confirmDeliveryOrders = () => {
  const selected = deliveryOrderOptions.value.filter((item) => deliverySelectedOrderIds.value.includes(deliveryOrderRowId(item)))
  formState.deliveryOrders = selected
  formState.orderIdList = selected.map((item) => item.orderPrimaryId || item.id).filter(Boolean)
  deliveryOrderPickerVisible.value = false
}

const removeDeliveryOrder = (row) => {
  const id = deliveryOrderRowId(row)
  formState.deliveryOrders = (formState.deliveryOrders || []).filter((item) => deliveryOrderRowId(item) !== id)
  formState.orderIdList = formState.deliveryOrders.map((item) => item.orderPrimaryId || item.id).filter(Boolean)
  syncDeliverySelectedOrderIds()
}

const materialDetailIsOrderConsumption = computed(() => isMaterialDetailsModule.value && formState.type === '订单消耗')
const linkedOrderSectionVisible = computed(() => materialDetailIsOrderConsumption.value || isManualRecordsModule.value)
const materialDetailSelectedOrderRows = computed(() => {
  if (!linkedOrderSectionVisible.value) return []
  if (Array.isArray(formState.orderRows) && formState.orderRows.length) return formState.orderRows
  if (!formState.orderNo || ['-', '--'].includes(String(formState.orderNo))) return []
  return [{
    orderNo: formState.orderNo,
    orderPrimaryId: formState.orderId,
    id: formState.orderId,
    customer: formState.customer || '-',
    orderTime: formState.orderTime || '-',
    filler: formState.filler || '-',
    productInfo: formState.productInfo || '-',
    amount: formState.amount,
    status: formState.orderStatus || '-'
  }]
})
const materialOrderRowId = (row) => String(row.orderPrimaryId || row.orderId || row.id || row.orderNo || '')

const loadMaterialOrderOptions = async () => {
  materialOrderOptionsLoading.value = true
  try {
    materialOrderOptions.value = await executeSpecialModuleAction('materialDetails', 'orderOptions', {
      orderNo: materialOrderFilters.orderNo,
      productInfo: materialOrderFilters.productInfo
    })
  } catch (error) {
    ElMessage.error(error?.message || '订单列表加载失败')
    materialOrderOptions.value = []
  } finally {
    materialOrderOptionsLoading.value = false
  }
}

const openMaterialOrderPicker = async () => {
  if (!materialOrderOptions.value.length) await loadMaterialOrderOptions()
  materialSelectedOrderId.value = materialOrderRowId(materialDetailSelectedOrderRows.value[0] || {})
  materialOrderPickerVisible.value = true
}

const selectMaterialOrder = (row) => {
  formState.orderRows = [row]
  formState.orderId = row.orderPrimaryId || row.id
  formState.orderNo = row.orderNo
  formState.customer = row.customer
  formState.orderTime = row.orderTime
  formState.filler = row.filler
  formState.productInfo = row.productInfo
  formState.amount = row.amount
  formState.orderStatus = row.status
  materialOrderPickerVisible.value = false
}

const confirmMaterialOrder = () => {
  const selected = materialOrderOptions.value.find((item) => materialOrderRowId(item) === String(materialSelectedOrderId.value))
  if (!selected) {
    ElMessage.error('请选择订单')
    return
  }
  selectMaterialOrder(selected)
}

const clearMaterialOrder = () => {
  formState.orderRows = []
  formState.orderId = ''
  formState.orderNo = ''
  formState.customer = ''
  formState.orderTime = ''
  formState.filler = ''
  formState.productInfo = ''
  formState.amount = ''
  formState.orderStatus = ''
  materialSelectedOrderId.value = ''
}

const clearMaterialOrderFilters = () => {
  materialOrderFilters.orderNo = ''
  materialOrderFilters.productInfo = ''
  loadMaterialOrderOptions()
}

const openDeliveryDriverPicker = () => {
  deliverySelectedDriverId.value = formState.driverRows?.[0]?.id ? String(formState.driverRows[0].id) : ''
  deliveryDriverPickerVisible.value = true
}

const confirmDeliveryDriver = () => {
  const selected = deliveryDriverOptions.value.find((item) => deliveryDriverRowId(item) === String(deliverySelectedDriverId.value))
  if (!selected) {
    ElMessage.error('请选择司机')
    return
  }
  formState.driverRows = [selected]
  formState.deliveryTenantUserId = selected.id
  formState.driver = selected.name
  deliveryDriverPickerVisible.value = false
}

const clearDeliveryOrderFilters = () => {
  deliveryOrderFilters.orderNo = ''
  deliveryOrderFilters.productInfo = ''
}

const clearDeliveryDriverFilters = () => {
  deliveryDriverFilters.name = ''
  deliveryDriverFilters.phone = ''
}

const openResetPassword = (row) => {
  currentRow.value = row
  resetPasswordForm.password = ''
  resetPasswordVisible.value = true
}

const save = () => {
  return submitSave()
}

const confirmResetPassword = async () => {
  if (!resetPasswordForm.password) {
    ElMessage.error('请输入新密码')
    return
  }
  if (state.resetPasswordSaving) return
  state.resetPasswordSaving = true
  try {
    await executeSpecialModuleAction(props.moduleKey, 'resetPassword', {
      ...currentRow.value,
      password: resetPasswordForm.password
    })
    resetPasswordVisible.value = false
    ElMessage.success('重置密码成功')
  } catch (error) {
    ElMessage.error(error?.message || '重置密码接口未配置')
  } finally {
    state.resetPasswordSaving = false
  }
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
  if (isEdit.value && profile.title === '配送单') return '编辑配送'
  if (isEdit.value && profile.title === '合作客户') return '编辑客户'
  if (isEdit.value && profile.title === '人员管理') return '编辑人员'
  if (isEdit.value && profile.title === '工艺管理') return '编辑工艺'
  if (isEdit.value && profile.title === '组织架构') return '编辑部门'
  if (isEdit.value && profile.title === '收款信息') return '编辑收款'
  if (isEdit.value && profile.title === '报销列表') return '编辑报销'
  if (isEdit.value && profile.title === '账户列表') return '编辑账户'
  if (isEdit.value && profile.title === '手工记录') return '编辑手工记录'
  if (isEdit.value) return `编辑${profile.title}`
  if (profile.title === '合作客户') return '添加客户'
  if (profile.title === '人员管理') return '添加人员'
  if (profile.title === '工艺管理') return '添加工艺'
  if (profile.title === '组织架构') return '添加部门'
  if (profile.title === '配送单') return '添加配送'
  if (profile.title === '收款信息') return '添加收款'
  if (profile.title === '报销列表') return '添加报销'
  if (profile.title === '账户列表') return '添加账户'
  if (profile.title === '手工记录') return '添加手工记录'
  return profile.createText || `添加${profile.title}`
})
const detailDialogTitle = computed(() => {
  if (profile.title === '合作客户') return '客户详情'
  if (props.moduleKey === 'productCrafts') return '工艺详情'
  if (props.moduleKey === 'productCraftsOutsource') return '外协工艺详情'
  if (props.moduleKey === 'reimbursements') return '报销详情'
  return `${profile.title}详情`
})
const formDialogWidth = computed(() => {
  if (profile.title === '合作客户') return '1280px'
  if (profile.title === '人员管理') return '1280px'
  if (profile.title === '工艺管理') return '1040px'
  if (profile.title === '组织架构') return '1280px'
  if (profile.title === '配送单') return '1280px'
  if (profile.title === '手工记录') return '1280px'
  return profile.dialogWidth || '1040px'
})
const isCustomerModule = computed(() => props.moduleKey === 'customers')
const isStaffModule = computed(() => props.moduleKey === 'staff')
const isOrganizationModule = computed(() => props.moduleKey === 'organization')
const isRolesModule = computed(() => props.moduleKey === 'roles')
const isProductCraftsModule = computed(() => props.moduleKey === 'productCrafts')
const isProductCraftDetailModule = computed(() => ['productCrafts', 'productCraftsOutsource'].includes(props.moduleKey))
const isDeliveryNotesModule = computed(() => props.moduleKey === 'deliveryNotes')
const isBillingPerformanceModule = computed(() => props.moduleKey === 'billingPerformance')
const isPerformanceModule = computed(() => ['billingPerformance', 'deliveryPerformance', 'craftPerformance', 'craftStats'].includes(props.moduleKey))
const isOutsourceModule = computed(() => ['outsourceIncoming', 'outsourceOutgoing'].includes(props.moduleKey))
const isReceivableModule = computed(() => ['receivableOrders', 'receivableUnits'].includes(props.moduleKey))
const isAccountsModule = computed(() => props.moduleKey === 'accounts')
const isReceiptsModule = computed(() => props.moduleKey === 'receipts')
const isReimbursementsModule = computed(() => props.moduleKey === 'reimbursements')
const isMaterialDetailsModule = computed(() => props.moduleKey === 'materialDetails')
const isManualRecordsModule = computed(() => props.moduleKey === 'manualRecords')
const isCraftStatsModule = computed(() => props.moduleKey === 'craftStats')
const isCraftPerformanceModule = computed(() => props.moduleKey === 'craftPerformance')
const isDurationPurchaseModule = computed(() => props.moduleKey === 'durationPurchases')
const designListModules = ['productCrafts', 'productCraftsOutsource', 'accounts', 'reimbursements', 'deliveryNotes', 'materials', 'materialStock', 'materialDetails', 'fundDetails', 'receivableOrders', 'receivableUnits']
const isDesignListModule = computed(() => designListModules.includes(props.moduleKey))
const isSwitchModule = computed(() => isStaffModule.value || isOrganizationModule.value || props.moduleKey === 'materials')
const formDialogClass = computed(() => [
  'special-dialog',
  'special-form-dialog',
  isCustomerModule.value ? 'customer-form-dialog' : '',
  isStaffModule.value ? 'staff-form-dialog' : '',
  isOrganizationModule.value ? 'organization-form-dialog' : '',
  isAccountsModule.value ? 'account-form-dialog' : '',
  isDeliveryNotesModule.value ? 'delivery-form-dialog' : '',
  isReceiptsModule.value ? 'receipt-form-dialog' : '',
  isReimbursementsModule.value ? 'reimbursement-form-dialog' : '',
  isManualRecordsModule.value ? 'manual-record-form-dialog' : ''
])
const detailDialogClass = computed(() => [
  'special-dialog',
  'special-detail-dialog',
  isProductCraftDetailModule.value ? 'product-craft-detail-dialog' : '',
  isOutsourceModule.value ? 'outsource-detail-dialog' : '',
  isCustomerModule.value ? 'customer-detail-dialog' : '',
  isReceiptsModule.value ? 'receipt-detail-dialog' : '',
  isReimbursementsModule.value ? 'reimbursement-detail-dialog' : '',
  isManualRecordsModule.value ? 'manual-record-detail-dialog' : ''
])
const moduleClass = computed(() => [
  `special-stack--${props.moduleKey}`,
  isReceivableModule.value ? 'special-stack--receivable' : '',
  isDurationPurchaseModule.value ? 'special-stack--duration' : ''
])
const themeClass = computed(() => `theme-${profile.theme || 'slate'}`)
const rowActions = computed(() => profile.rowActions || ['详情', '编辑', '打印'])
const visibleRowActions = (row) => {
  if (isDeliveryNotesModule.value) {
    const actions = ['详情']
    if (row.status === '待配送') actions.push('编辑', '删除')
    return actions
  }
  if (!isOutsourceModule.value) return rowActions.value
  const actions = ['详情']
  if (row.status === '已完成') actions.push('返单', '删除')
  return actions
}
const hasRowActions = computed(() => !isRolesModule.value && rowActions.value.length > 0)
const hasListToolbar = computed(() => !isRolesModule.value && !isOutsourceModule.value && (Boolean(profile.createText) || hasSecondaryAction.value))
const hasSecondaryAction = computed(() => Boolean(profile.secondaryActionText) && !isOrganizationModule.value && !isPerformanceModule.value)
const tableColumnMinWidth = (column) => {
  if (isBillingPerformanceModule.value) {
    if (column.key === 'name') return 160
    if (column.key === 'phone') return 260
    return 220
  }
  if (props.moduleKey === 'deliveryPerformance') {
    if (column.key === 'name') return 160
    if (column.key === 'phone') return 260
    return 220
  }
  if (isCraftStatsModule.value) {
    if (['craftId', 'unit'].includes(column.key)) return 120
    if (column.key === 'name') return 190
    return 170
  }
  if (isCraftPerformanceModule.value) {
    if (column.key === 'customer') return 170
    if (column.key === 'productName') return 210
    if (column.key === 'total') return 136
    return 118
  }
  if (isStaffModule.value) return 160
  if (isOrganizationModule.value) return column.key === 'name' ? 82 : 46
  if (isOutsourceModule.value) {
    if (column.key === 'productInfo') return 78
    if (column.key === 'updatedAt') return 88
    if (['customer', 'orderNo'].includes(column.key)) return 82
    if (column.key === 'supplier') return 74
    if (column.key === 'amount') return 78
    if (column.key === 'sales') return 54
    if (column.key === 'status') return 72
    return 72
  }
  if (isDesignListModule.value) {
    if (['orderInfo', 'remark', 'detailNote', 'productInfo'].includes(column.key)) return 90
    if (['name', 'deliveryNo', 'accountNo', 'bizNo'].includes(column.key)) return 82
    if (['createdAt', 'updatedAt', 'time'].includes(column.key)) return 88
    if (['amount', 'balance', 'income', 'expense'].includes(column.key)) return 74
    if (['account'].includes(column.key)) return 72
    if (['discount', 'applicant', 'driver', 'filler'].includes(column.key)) return 64
    if (['status', 'progress'].includes(column.key)) return 72
    return 72
  }
  return 132
}
const actionColumnMinWidth = computed(() => {
  if (isStaffModule.value) return 220
  if (isOrganizationModule.value) return 60
  if (isOutsourceModule.value) return 54
  if (isDesignListModule.value) return 84
  return 180
})
const paginationLayout = computed(() => (
  isOrganizationModule.value || isRolesModule.value || isPerformanceModule.value || props.moduleKey === 'receipts'
    || props.moduleKey === 'manualRecords' || isOutsourceModule.value || isDesignListModule.value
    ? 'prev, pager, next'
    : 'total, prev, pager, next, sizes'
))
const switchOutsourceModule = (moduleKey) => {
  if (props.moduleKey === moduleKey) return
  router.push({ name: moduleKey })
}
const switchReceivableModule = (moduleKey) => {
  if (props.moduleKey === moduleKey) return
  router.push({ name: moduleKey })
}

const routeValue = (key) => {
  const value = route.query[key]
  return Array.isArray(value) ? value[0] : value
}

const applyRouteQuery = () => {
  Object.keys(filters).forEach((key) => {
    const value = routeValue(key)
    if (value !== undefined) filters[key] = String(value)
  })
  const orderId = routeValue('orderId')
  if (orderId && Object.prototype.hasOwnProperty.call(filters, 'orderNo')) {
    filters.orderNo = String(orderId)
  }
}

const rowIdentityValues = (row = {}) => [
  row.id,
  row.orderRecordId,
  row.orderDbId,
  row.orderPrimaryId,
  row.orderId,
  row.orderNo,
  row.productsId,
  row.craftId,
  row.consumableId,
  row.handKeptId
].filter((value) => value !== undefined && value !== null && value !== '')

const openRouteDetailIfNeeded = async () => {
  const detailId = routeValue('detailId')
  if (!detailId) return
  const token = `${props.moduleKey}:${detailId}:${route.fullPath}`
  if (routeDetailToken.value === token) return
  const row = dataset.value.find((item) =>
    rowIdentityValues(item).some((value) => String(value) === String(detailId))
  )
  routeDetailToken.value = token
  await openDetail(row || {
    id: detailId,
    orderNo: routeValue('orderId') || ''
  })
}

const openLinkedModuleDetail = (moduleName, row = {}) => {
  const detailId = row.id || row.productsCraftId || row.consumableDetailId || row.handKeptId
  const orderId = row.orderId || currentRow.value?.orderNo || currentRow.value?.orderId
  detailVisible.value = false
  router.push({
    name: moduleName,
    query: {
      ...(detailId ? { detailId } : {}),
      ...(orderId ? { orderId } : {})
    }
  })
}

const outsourceRowDetailFields = {
  craft: {
    title: '工艺详情',
    fields: [
      { key: 'productName', label: '产品名称' },
      { key: 'craftName', label: '工艺名称' },
      { key: 'specification', label: '规格' },
      { key: 'openCount', label: '开数' },
      { key: 'basePrice', label: '起价' },
      { key: 'finishedCount', label: '成品数量' },
      { key: 'unit', label: '单位' },
      { key: 'unitPrice', label: '单价', money: true },
      { key: 'amount', label: '客户金额', money: true },
      { key: 'remark', label: '备注' },
      { key: 'status', label: '工艺状态' },
      { key: 'operator', label: '操作员' }
    ]
  },
  consumable: {
    title: '耗材详情',
    fields: [
      { key: 'consumableName', label: '耗材名称' },
      { key: 'typeText', label: '明细类型' },
      { key: 'quantity', label: '数量' },
      { key: 'remark', label: '备注' },
      { key: 'operator', label: '操作员' },
      { key: 'operationTime', label: '操作时间' }
    ]
  },
  hand: {
    title: '手工详情',
    fields: [
      { key: 'name', label: '手工名称' },
      { key: 'quantity', label: '数量' },
      { key: 'remark', label: '备注' },
      { key: 'operator', label: '操作员' },
      { key: 'operationTime', label: '操作时间' }
    ]
  }
}

const openOutsourceRowDetail = (type, row = {}) => {
  const config = outsourceRowDetailFields[type]
  if (!config) return
  rowDetailTitle.value = config.title
  rowDetailItems.value = config.fields.map((field) => ({
    label: field.label,
    value: field.money ? formatCell({ key: field.key, label: field.label }, row) : (row[field.key] ?? '-')
  }))
  rowDetailVisible.value = true
}

const outsourceStatus = computed(() => currentRow.value?.status || '')
const productCraftCanOutsource = computed(() =>
  isProductCraftsModule.value && currentRow.value && currentRow.value.status !== '已生产'
)
const outsourceShowsCraftMeta = computed(() => !['待审批', '已驳回'].includes(outsourceStatus.value))
const outsourceShowsConsumables = computed(() => ['生产中', '待配送'].includes(outsourceStatus.value))
const outsourceShowsHandRecords = computed(() => ['生产中', '待配送'].includes(outsourceStatus.value))
const outsourceFooterActions = computed(() => {
  const status = outsourceStatus.value
  if (status === '待审批') return ['驳回', '通过']
  if (status === '待配送') return ['创建配送单']
  if (status === '配送中') return ['查看配送单']
  if (status === '已驳回') return ['重新申请']
  return []
})
const outsourceCraftActions = (row = {}) => {
  if (!outsourceShowsCraftMeta.value) return []
  const actions = ['详情']
  if (row.status !== '已生产' && !['配送中', '已完成'].includes(outsourceStatus.value)) actions.push('转外协')
  return actions
}

const loadOutsourceTransferOptions = async () => {
  outsourceTransferLoading.value = true
  try {
    const result = await getTenantOutsourceTenants({
      tenantName: outsourceTransferKeyword.value || undefined
    })
    const rows = Array.isArray(result) ? result : result?.records || []
    outsourceTransferOptions.value = rows.map((item) => ({
      label: item.tenantName || item.name || '-',
      value: String(item.id),
      contact: item.userName || item.contact || ''
    }))
  } catch (error) {
    ElMessage.error(error?.message || '外协单位加载失败')
    outsourceTransferOptions.value = []
  } finally {
    outsourceTransferLoading.value = false
  }
}

const openOutsourceTransferDialog = (row = currentRow.value) => {
  outsourceTransferRow.value = row
  outsourceTransferTenantId.value = ''
  outsourceTransferKeyword.value = ''
  outsourceTransferVisible.value = true
  loadOutsourceTransferOptions()
}

const confirmOutsourceTransfer = async () => {
  if (!outsourceTransferTenantId.value) {
    ElMessage.error('请选择外协单位')
    return
  }
  if (outsourceTransferSaving.value) return
  outsourceTransferSaving.value = true
  try {
    await executeSpecialModuleAction(props.moduleKey, 'outsource', {
      ...(outsourceTransferRow.value || {}),
      tenantId: outsourceTransferTenantId.value
    })
    ElMessage.success('转外协成功')
    outsourceTransferVisible.value = false
    detailVisible.value = false
    loadRows()
  } catch (error) {
    ElMessage.error(error?.message || '转外协失败')
  } finally {
    outsourceTransferSaving.value = false
  }
}

const handleOutsourceCraftAction = (action, row) => {
  if (action === '详情') return openLinkedModuleDetail('productCrafts', row)
  if (action === '转外协') return openOutsourceTransferDialog(currentRow.value)
}
const handleOutsourceFooterAction = (action) => {
  if (action === '驳回') return notify('驳回接口待外协订单文档补充')
  if (action === '通过') return notify('通过接口待外协订单文档补充')
  if (action === '创建配送单') return notify('创建配送单接口需要先选择配送员')
  if (action === '查看配送单') return notify('配送单详情接口待接入')
  if (action === '重新申请') return notify('重新申请接口待外协订单文档补充')
}
const searchOptions = (field) => {
  if (isCustomerModule.value && field.key === 'sales') return customerSalesOptions.value
  if (isReceiptsModule.value && ['accountId', 'account'].includes(field.key)) return receiptAccountOptions.value
  if (isReimbursementsModule.value && ['accountId', 'account'].includes(field.key)) return reimbursementAccountOptions.value
  return normalizeFieldOptions(field.options || [])
}
const searchPlaceholder = (field) => {
  if (field.placeholder) return field.placeholder
  if (isOutsourceModule.value || isDesignListModule.value) return field.type === 'select' ? '请选择' : '请输入'
  if (isOrganizationModule.value || isRolesModule.value) return field.type === 'select' ? '请选择' : '请输入'
  return `${field.type === 'select' ? '请选择' : '请输入'}${field.label}`
}
const plainStatusClass = (value) => {
  if (['待生产', '生产中', '配送中'].includes(value)) return 'plain-status--orange'
  if (['待配送'].includes(value)) return 'plain-status--blue'
  if (['已生产', '已通过', '启用'].includes(value)) return 'plain-status--green'
  if (['已完成'].includes(value)) return 'plain-status--muted'
  if (['已驳回', '禁用'].includes(value)) return 'plain-status--red'
  if (value === '待审批') return 'plain-status--red'
  return 'plain-status--muted'
}
const listCellClass = (column) => {
  if (!isOutsourceModule.value && !isDesignListModule.value) return ''
  if (['amount', 'balance', 'income', 'expense', 'discount'].includes(column.key)) return 'design-money'
  if (['productInfo', 'orderInfo', 'remark', 'detailNote'].includes(column.key)) return 'design-long-text'
  return ''
}
const tableColumnClassName = (column) => {
  if (isCraftPerformanceModule.value && column.key === 'total') return 'craft-performance-total-column'
  if (isBillingPerformanceModule.value && column.key === 'completedOrders') return 'performance-blue-column'
  if (isBillingPerformanceModule.value && column.key === 'amount') return 'performance-orange-column'
  if (props.moduleKey === 'deliveryPerformance' && column.key === 'completedOrders') return 'performance-blue-column'
  return ''
}
const formOptions = (field) => {
  if (isMaterialDetailsModule.value && field.key === 'name') return materialDetailNameOptions.value
  if (isCustomerModule.value && field.key === 'sales') return customerSalesOptions.value
  if (isStaffModule.value && field.key === 'tenantId') return staffTenantOptions.value
  if (isStaffModule.value && field.key === 'department') return staffDepartmentOptions.value
  if (isStaffModule.value && field.key === 'menuIdList') return staffRoleOptions.value
  if (isReceiptsModule.value && ['accountId', 'account'].includes(field.key)) return receiptAccountOptions.value
  if (isReceiptsModule.value && ['cooperativeClientId', 'customer'].includes(field.key)) return receiptCustomerOptions.value
  if (isReimbursementsModule.value && ['accountId', 'account'].includes(field.key)) return reimbursementAccountOptions.value
  return normalizeFieldOptions(field.options || [])
}

const handleFormSelectChange = (field, value) => {
  if (isMaterialDetailsModule.value && field.key === 'name') {
    const option = materialDetailNameOptions.value.find((item) => item.value === value)
    if (!option?.raw) return
    formState.unit = option.raw.unit || formState.unit
    formState.price = option.raw.price || formState.price
  }
  if (isMaterialDetailsModule.value && field.key === 'type' && value !== '订单消耗') {
    clearMaterialOrder()
  }
}
const customerRequiredFields = ['name', 'contact', 'phone', 'address', 'customerType']
const customerFormOrder = ['name', 'customerType', 'contact', 'phone', 'sales', 'address', 'remark']
const requiredFieldMap = {
  customers: customerRequiredFields,
  staff: ['name', 'phone', 'loginPassword', 'department', 'menuIdList'],
  organization: ['name'],
  accounts: ['name', 'accountNo'],
  receipts: ['cooperativeClientId', 'collectionTime', 'accountId'],
  reimbursements: ['reimburseTime', 'accountId', 'amount'],
  materialDetails: ['name', 'type', 'quantity'],
  manualRecords: ['name', 'quantity']
}
const displayFormFields = computed(() => {
  if (!isCustomerModule.value) return profile.formFields
  const fieldsByKey = new Map(profile.formFields.map((field) => [field.key, field]))
  return customerFormOrder.map((key) => fieldsByKey.get(key)).filter(Boolean)
})
const isRequiredField = (field) => {
  if (isStaffModule.value && isEdit.value && field.key === 'loginPassword') return false
  return (requiredFieldMap[props.moduleKey] || []).includes(field.key)
}
const isQuantityNumberField = (field) =>
  field.type === 'number' && (field.key === 'quantity' || /数量/.test(field.label || ''))
const formPlaceholder = (field) => {
  if (isOrganizationModule.value) return field.type === 'select' ? '请选择' : '输入'
  if (isAccountsModule.value) return field.type === 'select' ? '请选择' : '输入'
  if (!isCustomerModule.value && !isStaffModule.value) return `${field.type === 'select' ? '请选择' : '请输入'}${field.label}`
  if (field.type === 'select') {
    if (field.key === 'sales') return '请选择（边输边搜）'
    return '请选择'
  }
  if (field.type === 'date') return '年/月/日'
  return '输入'
}
const uploadFileList = (field) => {
  const value = formState[field.key]
  return value ? [{ name: String(value) }] : []
}
const handleFileFieldChange = (field, file) => {
  formState[field.key] = file?.name || file?.raw?.name || ''
}
const handleFileFieldRemove = (field) => {
  formState[field.key] = ''
}
const customerDetailTabs = computed(() => {
  if (!isCustomerModule.value) return []
  return (profile.sections || []).filter((section) => section.type === 'table')
})
const activeCustomerDetailSection = computed(() =>
  customerDetailTabs.value.find((section) => section.dataKey === activeCustomerDetailTab.value) || customerDetailTabs.value[0]
)
const visibleDetailSections = computed(() =>
  (profile.sections || []).filter((section) => typeof section.showWhen !== 'function' || section.showWhen(currentRow.value || {}))
)
const summaryText = computed(() =>
  typeof profile.summaryText === 'function' ? profile.summaryText(filteredRows.value) : profile.summaryText
)
const summaryParts = computed(() => {
  if (!summaryText.value) return []
  return String(summaryText.value)
    .split(/(¥[\d,]+(?:\.\d+)?|\b\d+(?:,\d{3})*(?:\.\d+)?\b)/g)
    .filter(Boolean)
    .map((text) => ({
      text,
      highlight: /^(¥[\d,]+(?:\.\d+)?|\d+(?:,\d{3})*(?:\.\d+)?)$/.test(text)
    }))
})

const formatCell = (column, row) => {
  if (isCustomerModule.value && column.key === 'sales') {
    return row.salesName || row.userName || row.sales || '-'
  }
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

const removeRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除“${row.name || row.userId || row.id}”吗？`, '删除确认', { type: 'warning' })
    await executeSpecialModuleAction(props.moduleKey, 'delete', row)
    ElMessage.success('删除成功')
    loadRows()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '删除接口未配置')
  }
}

const changeSwitchStatus = async (row, value) => {
  const previous = value === '启用' ? '禁用' : '启用'
  try {
    await executeSpecialModuleAction(props.moduleKey, 'changeStatus', {
      ...row,
      status: value
    })
    ElMessage.success('状态已更新')
  } catch (error) {
    row.status = previous
    ElMessage.error(error?.message || '状态接口未配置')
  }
}

const handleRowAction = (row, action) => {
  if (action === '详情') return openDetail(row)
  if (action === '明细' && ['materials', 'materialStock'].includes(props.moduleKey)) {
    return router.push({ name: 'materialDetails', query: { name: row.name || '' } })
  }
  if (action === '编辑') return openEdit(row)
  if (action === '打印') return printRow(row)
  if (action === '返单') return returnOutsourceOrder(row)
  if (action === '重置密码') return openResetPassword(row)
  if (action === '删除') return removeRow(row)
  return notify(`${action} 功能已预留`)
}

const handleDetailTableAction = (row, action) => {
  if (action === '订单详情') {
    const orderId = row.orderPrimaryId || row.orderId || row.id || row.orderNo
    if (!orderId || orderId === '-') return ElMessage.warning('当前记录未关联订单')
    detailVisible.value = false
    return router.push({ name: 'orders', query: { detailId: orderId } })
  }
  return notify(`${action} 功能已预留`)
}

const materialDetailImages = (row = currentRow.value || {}) => {
  const value = row.imageRemark || row.img || row.picture || row.proofImg || ''
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value || '')
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter((item) => item && !['-', '--'].includes(item))
}

const materialDetailOrderRows = computed(() => {
  const row = currentRow.value || {}
  if (Array.isArray(row.orderRows) && row.orderRows.length) return row.orderRows
  if (!row.orderNo || ['-', '--'].includes(String(row.orderNo))) return []
  return [{
    orderNo: row.orderNo,
    orderPrimaryId: row.orderId,
    id: row.orderId,
    customer: row.customer || '-',
    orderTime: row.orderTime || '-',
    filler: row.filler || '-',
    productInfo: row.productInfo || '-',
    amount: row.amount,
    status: row.orderStatus || '-'
  }]
})

const exportFileName = () => {
  const raw = `${profile.title || props.moduleKey}-${new Date().toISOString().slice(0, 10)}`
  return raw.replace(/[\\/:*?"<>|]/g, '_')
}

const normalizeExportValue = (value) => {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(normalizeExportValue).join('、')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const downloadUrl = (url, filename) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const tryDownloadExportResult = (result, filename) => {
  if (!result) return false
  if (result instanceof Blob) {
    downloadBlob(result, filename)
    return true
  }
  if (result instanceof ArrayBuffer) {
    downloadBlob(new Blob([result]), filename)
    return true
  }
  if (typeof result === 'string') {
    if (/^(https?:)?\/\//.test(result) || result.startsWith('/')) {
      downloadUrl(result, filename)
      return true
    }
    downloadBlob(new Blob([result], { type: 'text/csv;charset=utf-8;' }), filename)
    return true
  }
  const url = result.url || result.fileUrl || result.downloadUrl || result.path
  if (url) {
    downloadUrl(url, filename)
    return true
  }
  const content = result.content || result.data
  if (typeof content === 'string') {
    downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8;' }), filename)
    return true
  }
  return false
}

const rowsForExport = (rows = []) =>
  rows.filter((row) =>
    matchesTreeFilter(row) &&
    matchesCraftPerformanceChecks(row) &&
    profile.searchFields.every((field) => {
      const value = filters[field.key]
      if (!value) return true
      return String(row[field.key] ?? '').includes(String(value))
    })
  )

const escapeHtml = (value) =>
  normalizeExportValue(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const exportRowsToSpreadsheet = (rows = []) => {
  const columns = (tableColumns.value || []).filter((column) => column.key && column.label)
  const widthForColumn = (column) => {
    if (['phone', 'contact', 'accountNo', 'orderNo', 'receiptNo', 'bizNo'].includes(column.key)) return 180
    if (['createdAt', 'updatedAt', 'orderTime', 'time', 'collectionTime', 'reimburseTime'].includes(column.key)) return 220
    if (['address', 'productInfo', 'remark', 'detailNote'].includes(column.key)) return 280
    return Math.max(120, String(column.label || '').length * 28)
  }
  const colgroup = columns.map((column) => `<col style="width:${widthForColumn(column)}px">`).join('')
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
  const body = rows.map((row) =>
    `<tr>${columns.map((column) => `<td style="mso-number-format:'\\@';">${escapeHtml(row[column.key])}</td>`).join('')}</tr>`
  ).join('')
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    table { border-collapse: collapse; font-family: Arial, "Microsoft YaHei", sans-serif; }
    th, td { border: 1px solid #d9d9d9; padding: 6px 8px; white-space: nowrap; mso-number-format:'\\@'; }
    th { background: #f0f0f0; font-weight: 700; }
  </style>
</head>
<body>
  <table>
    <colgroup>${colgroup}</colgroup>
    <thead><tr>${header}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`
  downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), `${exportFileName()}.xls`)
}

const handleExport = async () => {
  if (state.exporting) return
  state.exporting = true
  const payload = {
    ...filters,
    pageNum: 1,
    pageSize: 999
  }
  try {
    try {
      const result = await executeSpecialModuleAction(props.moduleKey, 'export', payload)
      if (tryDownloadExportResult(result, `${exportFileName()}.xlsx`)) {
        ElMessage.success('导出成功')
        return
      }
    } catch (error) {
      if (!String(error?.message || '').includes('missing export api')) {
        console.warn('export api unavailable, fallback to csv', error)
      }
    }

    const result = await loadSpecialModuleRows(props.moduleKey, payload)
    exportRowsToSpreadsheet(rowsForExport(result.rows))
    ElMessage.success('已导出当前筛选数据')
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    state.exporting = false
  }
}

const printRow = async (row) => {
  if (!isOutsourceModule.value && !isReceiptsModule.value && !isReimbursementsModule.value) return notify('打印模板已预留')
  try {
    const result = await executeSpecialModuleAction(props.moduleKey, 'print', row)
    if (result?.url) window.open(result.url, '_blank')
  } catch (error) {
    ElMessage.error(error?.message || '打印地址获取失败')
  }
}

const returnOutsourceOrder = async (row) => {
  try {
    await executeSpecialModuleAction(props.moduleKey, 'returnOrder', row)
    ElMessage.success('返单成功')
    loadRows()
  } catch (error) {
    ElMessage.error(error?.message || '返单失败')
  }
}

const loadRows = async () => {
  state.loading = true
  try {
    const result = await loadSpecialModuleRows(props.moduleKey, filters)
    dataset.value = result.rows
    rememberStaffDepartments(result.rows)
    syncCraftPerformanceChecks()
    sequence.value = Math.max(...[0, ...result.rows.map((item) => Number(item.id) || 0)]) + 1
    if ((state.pageNum - 1) * state.pageSize >= result.rows.length) {
      state.pageNum = 1
    }
    await openRouteDetailIfNeeded()
  } catch (error) {
    dataset.value = []
    if (!String(error?.message || '').startsWith('missing list api for')) {
      ElMessage.error(error?.message || '模块接口未配置')
    }
    await openRouteDetailIfNeeded()
  } finally {
    state.loading = false
  }
}

const submitSave = async () => {
  if (state.saving) return
  const payload = JSON.parse(JSON.stringify(formState))
  if (isDeliveryNotesModule.value) {
    payload.orderIdList = (payload.deliveryOrders || []).map((item) => item.orderPrimaryId || item.id).filter(Boolean)
    payload.deliveryTenantUserId = payload.deliveryTenantUserId || payload.driverRows?.[0]?.id
    if (!payload.orderIdList.length) {
      ElMessage.error('请选择订单')
      return
    }
    if (!payload.deliveryTenantUserId) {
      ElMessage.error('请选择司机')
      return
    }
  }
  if (isReceiptsModule.value) {
    payload.amount = receiptAmountTotal.value
    payload.discount = receiptDiscountTotal.value
    if (!payload.cooperativeClientId) {
      ElMessage.error('请选择单位名称')
      return
    }
    if (!payload.accountId) {
      ElMessage.error('请选择收款账户')
      return
    }
    if (!payload.collectionTime) {
      ElMessage.error('请选择收款时间')
      return
    }
    if (!(payload.receiptOrders || []).length) {
      ElMessage.error('请关联订单')
      return
    }
  }
  if (isReimbursementsModule.value) {
    payload.updatedAt = payload.reimburseTime || payload.updatedAt
    payload.status = payload.status || '待审批'
    if (!payload.reimburseTime && !payload.updatedAt) {
      ElMessage.error('请选择报销时间')
      return
    }
    if (!payload.accountId) {
      ElMessage.error('请选择报销账户')
      return
    }
    if (!money(payload.amount)) {
      ElMessage.error('请输入报销金额')
      return
    }
  }
  if (isMaterialDetailsModule.value && payload.type === '订单消耗' && !payload.orderNo) {
    ElMessage.error('请选择订单')
    return
  }
  if (isCustomerModule.value && !payload.fullName) {
    payload.fullName = payload.name || ''
  }
  const missingField = displayFormFields.value.find((field) => {
    if (!isRequiredField(field)) return false
    const value = payload[field.key]
    if (Array.isArray(value)) return value.length === 0
    return value === '' || value === null || value === undefined
  })
  if (missingField) {
    ElMessage.error(`请填写${missingField.label}`)
    return
  }
  if (!payload.id && props.moduleKey !== 'staff' && !isCustomerModule.value && !isReceiptsModule.value && !isReimbursementsModule.value) {
    payload.id = sequence.value
    sequence.value += 1
  }
  state.saving = true
  try {
    await persistSpecialModuleRow(props.moduleKey, payload)
    if (isStaffModule.value || isOrganizationModule.value) {
      filters[profile.treeKey] = payload[profile.treeKey] || ''
      state.pageNum = 1
      closeStaffForm()
    } else {
      dialogVisible.value = false
    }
    ElMessage.success('保存成功')
    loadRows()
  } catch (error) {
    ElMessage.error(error?.message || '保存接口未配置')
  } finally {
    state.saving = false
  }
}

onMounted(() => {
  applyRouteQuery()
  loadRows()
  loadFormOptions()
})

watch(
  () => route.fullPath,
  () => {
    applyRouteQuery()
    loadRows()
  }
)

watch(
  () => [
    craftPerformanceChecks.people.join('|'),
    craftPerformanceChecks.machines.join('|'),
    craftPerformanceChecks.crafts.join('|')
  ],
  () => {
    if (isCraftPerformanceModule.value) state.pageNum = 1
  }
)
</script>

<template>
  <div class="special-stack" :class="moduleClass">
    <section v-if="!isDurationPurchaseModule" class="hero-grid" :class="themeClass">
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

    <section v-if="!isDurationPurchaseModule && profile.workflows?.length" class="workflow-strip" :class="themeClass">
      <article v-for="item in profile.workflows" :key="item" class="workflow-chip">
        <span>{{ item }}</span>
      </article>
    </section>

    <section v-if="!isDurationPurchaseModule && overviewPanels.length" class="overview-panels" :class="themeClass">
      <article v-for="panel in overviewPanels" :key="panel.title" class="overview-panel">
        <p>{{ panel.title }}</p>
        <strong>{{ panel.value }}</strong>
        <span>{{ panel.helper }}</span>
      </article>
    </section>

    <section v-if="isDurationPurchaseModule" class="duration-purchase-shell">
      <div class="duration-purchase-card">
        <header class="duration-purchase-head">
          <h2>购买时长</h2>
        </header>
        <div class="duration-purchase-body">
          <div class="duration-plan-grid">
            <button
              v-for="item in durationPackages"
              :key="item.key"
              type="button"
              class="duration-plan-card"
              :class="{ active: selectedDurationPackage === item.key }"
              @click="selectedDurationPackage = item.key"
            >
              <span class="duration-plan-card__mark"></span>
              <strong>{{ item.name }}</strong>
              <em>{{ item.days }}</em>
              <b>{{ item.price }}</b>
              <del>{{ item.original }}</del>
            </button>
          </div>
          <aside class="duration-payment-panel">
            <div class="duration-payment-tabs">
              <button type="button" :class="{ active: selectedPayment === 'wechat' }" @click="selectedPayment = 'wechat'">微</button>
              <button type="button" :class="{ active: selectedPayment === 'alipay' }" @click="selectedPayment = 'alipay'">支</button>
            </div>
            <span>扫码支付</span>
            <div class="duration-qr">支付二维码</div>
            <strong>{{ durationPackages.find((item) => item.key === selectedDurationPackage)?.price }}</strong>
            <del>¥999.00</del>
            <label class="duration-agreement">
              <input v-model="durationAgreement" type="checkbox" />
              <span>服务协议</span>
            </label>
          </aside>
        </div>
      </div>
    </section>

    <section v-else-if="isStaffModule && dialogVisible" class="staff-full-form">
      <PageBlock class="staff-full-form__card">
        <h2>{{ isEdit ? '编辑人员' : '添加人员' }}</h2>
        <div class="staff-full-form__grid">
          <label class="staff-form-field">
            <p><span class="required-star">*</span>姓名</p>
            <el-input v-model="formState.name" placeholder="输入" />
          </label>
          <label class="staff-form-field staff-form-field--plain">
            <p>性别</p>
            <el-radio-group v-model="formState.gender">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </label>
          <label class="staff-form-field">
            <p>年龄</p>
            <el-input v-model="formState.age" placeholder="输入" />
          </label>

          <label class="staff-form-field">
            <p><span class="required-star">*</span>联系方式（账号）</p>
            <el-input v-model="formState.phone" placeholder="输入" />
          </label>
          <label class="staff-form-field">
            <p><span v-if="!isEdit" class="required-star">*</span>登录密码</p>
            <el-input v-model="formState.loginPassword" placeholder="输入" />
          </label>
          <span class="staff-form-field staff-form-field--empty"></span>

          <label class="staff-form-field">
            <p>职位</p>
            <el-input v-model="formState.position" placeholder="输入" />
          </label>
          <label class="staff-form-field">
            <p>职称</p>
            <el-input v-model="formState.title" placeholder="输入" />
          </label>
          <span class="staff-form-field staff-form-field--empty"></span>

          <label class="staff-form-field">
            <p>工号</p>
            <el-input v-model="formState.jobNo" placeholder="输入" />
          </label>
          <label class="staff-form-field">
            <p>入职日期</p>
            <el-date-picker
              v-model="formState.hireDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="年/月/日"
            />
          </label>
          <label class="staff-form-field">
            <p><span class="required-star">*</span>所属部门</p>
            <el-select v-model="formState.department" placeholder="请选择">
              <el-option
                v-for="option in staffDepartmentOptions"
                :key="`staff-dept-${option.value}`"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </label>

          <label class="staff-form-field staff-form-field--roles">
            <p><span class="required-star">*</span>角色</p>
            <el-checkbox-group v-model="formState.menuIdList">
              <el-checkbox
                v-for="option in staffRoleOptions"
                :key="`staff-role-${option.value}`"
                :label="option.value"
              >
                {{ option.label }}
              </el-checkbox>
            </el-checkbox-group>
          </label>

          <label class="staff-form-field staff-form-field--remark">
            <p>备注</p>
            <el-input v-model="formState.remark" type="textarea" :rows="4" placeholder="输入" />
          </label>
        </div>
      </PageBlock>
      <footer class="staff-full-form__footer">
        <el-button :disabled="state.saving" @click="closeStaffForm">取消</el-button>
        <el-button type="primary" :loading="state.saving" @click="save">保存</el-button>
      </footer>
    </section>

    <section v-else-if="isOrganizationModule && dialogVisible" class="organization-full-form">
      <PageBlock class="organization-full-form__card">
        <h2>{{ isEdit ? '编辑部门' : '添加部门' }}</h2>
        <div class="organization-full-form__grid">
          <label class="organization-form-field">
            <p><span class="required-star">*</span>部门名称</p>
            <el-input v-model="formState.name" placeholder="输入" />
          </label>
          <label class="organization-form-field organization-form-field--remark">
            <p>备注</p>
            <el-input v-model="formState.remark" type="textarea" :rows="4" placeholder="输入" />
          </label>
        </div>
      </PageBlock>
      <footer class="organization-full-form__footer">
        <el-button :disabled="state.saving" @click="closeStaffForm">取消</el-button>
        <el-button type="primary" :loading="state.saving" @click="save">保存</el-button>
      </footer>
    </section>

    <div v-else class="module-grid" :class="{ 'module-grid--tree': hasTreePanel }">
      <PageBlock v-if="hasTreePanel" class="tree-card">
        <div class="tree-search">
          <strong>{{ profile.treeTitle || '部门名称' }}</strong>
          <el-input v-model="treeSearch" placeholder="请输入" :suffix-icon="Search" />
        </div>
        <div class="tree-list">
          <div v-for="node in visibleTreeNodes" :key="node.value" class="tree-node">
            <button
              type="button"
              class="tree-node__label"
              :class="{ active: currentTreeValue === node.value }"
              @click="selectTreeNode(node)"
            >
              <span>▶</span>{{ node.label }}
              <em v-if="node.children?.length">⌃</em>
            </button>
            <button
              v-for="child in node.children || []"
              :key="child.value"
              type="button"
              class="tree-node__child"
              :class="{ active: currentTreeValue === child.value }"
              @click="selectTreeNode(child)"
            >
              {{ child.label }}
            </button>
          </div>
        </div>
      </PageBlock>

      <div class="module-main">
        <PageBlock class="search-card">
          <div v-if="isOutsourceModule" class="outsource-tabs">
            <button
              type="button"
              :class="{ active: props.moduleKey === 'outsourceIncoming' }"
              @click="switchOutsourceModule('outsourceIncoming')"
            >
              转入订单
            </button>
            <button
              type="button"
              :class="{ active: props.moduleKey === 'outsourceOutgoing' }"
              @click="switchOutsourceModule('outsourceOutgoing')"
            >
              转出订单
            </button>
          </div>
          <div v-if="isReceivableModule" class="receivable-tabs">
            <button
              type="button"
              :class="{ active: props.moduleKey === 'receivableOrders' }"
              @click="switchReceivableModule('receivableOrders')"
            >
              订单明细
            </button>
            <button
              type="button"
              :class="{ active: props.moduleKey === 'receivableUnits' }"
              @click="switchReceivableModule('receivableUnits')"
            >
              单位明细
            </button>
          </div>
          <div class="search-grid">
            <label v-for="field in profile.searchFields" :key="field.key" class="search-item">
              <span>{{ field.label }}</span>
              <el-select
                v-if="field.type === 'select'"
                v-model="filters[field.key]"
                clearable
                :filterable="field.key === 'sales'"
                :placeholder="searchPlaceholder(field)"
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
                :placeholder="searchPlaceholder(field)"
              />
              <el-input v-else v-model="filters[field.key]" :placeholder="searchPlaceholder(field)" />
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
          <div v-if="isCraftPerformanceModule" class="craft-performance-options">
            <div
              v-for="group in craftPerformanceFilterGroups"
              :key="group.key"
              class="craft-performance-option-row"
            >
              <strong>{{ group.label }}：</strong>
              <el-checkbox-group v-model="craftPerformanceChecks[group.key]" size="large">
                <el-checkbox
                  v-for="(option, index) in group.options"
                  :key="`${group.key}-${typeof option === 'string' ? option : option.value}-${index}`"
                  :value="typeof option === 'string' ? option : option.value"
                >
                  {{ typeof option === 'string' ? option : option.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <el-button class="craft-performance-export" :loading="state.exporting" @click="handleExport">导出</el-button>
          </div>

          <div v-if="hasListToolbar && !isCraftPerformanceModule" class="toolbar list-toolbar">
            <div class="toolbar__left">
              <el-button
                v-if="profile.createText"
                :type="profile.createText === '导出' ? 'default' : 'primary'"
                :icon="profile.createText === '导出' ? undefined : Plus"
                :loading="profile.createText === '导出' && state.exporting"
                @click="profile.createText === '导出' ? handleExport() : openCreate()"
              >
                {{ profile.createText }}
              </el-button>
              <el-button v-if="hasSecondaryAction" plain :loading="state.exporting" @click="handleExport">{{ profile.secondaryActionText }}</el-button>
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
            <span
              v-for="(part, index) in summaryParts"
              :key="`${part.text}-${index}`"
              :class="{ 'summary-band__highlight': part.highlight }"
            >
              {{ part.text }}
            </span>
          </div>

          <el-table v-loading="state.loading" :data="pagedRows" class="special-table" empty-text="当前筛选下暂无数据">
            <el-table-column
              v-for="column in tableColumns"
              :key="column.key"
              :prop="column.key"
              :label="column.label"
              :min-width="tableColumnMinWidth(column)"
              :class-name="tableColumnClassName(column)"
              :label-class-name="tableColumnClassName(column)"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <el-button
                  v-if="column.action"
                  type="primary"
                  @click="handleRowAction(row, column.action)"
                >
                  {{ column.action }}
                </el-button>
                <el-switch
                  v-else-if="column.switch && isSwitchModule"
                  v-model="row[column.key]"
                  active-value="启用"
                  inactive-value="禁用"
                  @change="(value) => changeSwitchStatus(row, value)"
                />
                <span
                  v-else-if="column.tag && (isOutsourceModule || isDesignListModule)"
                  class="plain-status"
                  :class="plainStatusClass(row[column.key])"
                >
                  {{ formatCell(column, row) }}
                </span>
                <el-tag v-else-if="column.tag" :type="tagType(row[column.key])">{{ row[column.key] }}</el-tag>
                <el-tag v-else-if="column.switch" :type="formatCell(column, row) === '启用' ? 'success' : 'danger'">
                  {{ formatCell(column, row) }}
                </el-tag>
                <span v-else :class="listCellClass(column)">{{ formatCell(column, row) }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="hasRowActions" label="操作" :fixed="isOrganizationModule || isOutsourceModule || isDesignListModule ? false : 'right'" :min-width="actionColumnMinWidth">
              <template #default="{ row }">
                <el-button
                  v-for="action in visibleRowActions(row)"
                  :key="action"
                  link
                  :type="isStaffModule ? 'primary' : action === '编辑' ? 'warning' : action === '打印' ? 'success' : 'primary'"
                  @click="handleRowAction(row, action)"
                >
                  {{ action }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="filteredRows.length" class="pagination-wrap">
            <el-pagination
              v-model:current-page="state.pageNum"
              v-model:page-size="state.pageSize"
              background
              :layout="paginationLayout"
              :page-sizes="[10, 20, 30, 50]"
              :total="filteredRows.length"
            />
          </div>
        </PageBlock>
      </div>
    </div>

    <el-dialog
      v-if="!isStaffModule && !isOrganizationModule"
      v-model="dialogVisible"
      :title="formDialogTitle"
      :width="formDialogWidth"
      :class="formDialogClass"
      :close-on-click-modal="false"
    >
      <div v-if="isReimbursementsModule" v-loading="state.detailLoading" class="reimbursement-form-stack">
        <section class="reimbursement-form-section">
          <h3>{{ formDialogTitle }}</h3>
          <div class="reimbursement-form-grid">
            <label class="reimbursement-form-item">
              <p><span class="required-star">*</span>报销时间（默认当前时间）</p>
              <el-date-picker
                v-model="formState.reimburseTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="年/月/日 时:分"
              />
            </label>
            <label class="reimbursement-form-item">
              <p><span class="required-star">*</span>报销账户</p>
              <el-select v-model="formState.accountId" filterable placeholder="边输边搜">
                <el-option
                  v-for="option in reimbursementAccountOptions"
                  :key="`reimbursement-account-${option.value}`"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </label>
            <label class="reimbursement-form-item">
              <p><span class="required-star">*</span>报销金额</p>
              <el-input-number v-model="formState.amount" :min="0" controls-position="right" placeholder="输入" />
              <span class="reimbursement-input-suffix">元</span>
            </label>
            <label class="reimbursement-form-item">
              <p>折让金额</p>
              <el-input-number v-model="formState.discount" :min="0" controls-position="right" placeholder="输入" />
              <span class="reimbursement-input-suffix">元</span>
            </label>
            <label class="reimbursement-form-item reimbursement-form-item--full">
              <p>摘要</p>
              <el-input v-model="formState.remark" type="textarea" :rows="4" placeholder="输入" />
            </label>
            <label class="reimbursement-form-item reimbursement-form-item--full">
              <p>报销凭证</p>
              <input class="reimbursement-file-input" type="file" @change="(event) => { formState.proofImg = event.target.files?.[0]?.name || formState.proofImg || '' }">
            </label>
          </div>
        </section>
      </div>

      <div v-else-if="isReceiptsModule" v-loading="state.detailLoading" class="receipt-form-stack">
        <section class="receipt-form-section">
          <h3>收款信息</h3>
          <div class="receipt-form-grid">
            <label class="receipt-form-item receipt-form-item--full">
              <p><span class="required-star">*</span>单位名称</p>
              <el-select
                v-model="formState.cooperativeClientId"
                filterable
                placeholder="边输边搜"
                @change="handleReceiptCustomerChange"
              >
                <el-option
                  v-for="option in receiptCustomerOptions"
                  :key="`receipt-customer-${option.value}`"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </label>
            <label class="receipt-form-item">
              <p><span class="required-star">*</span>收款时间（默认当前时间）</p>
              <el-date-picker
                v-model="formState.collectionTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="年/月/日 时:分"
              />
            </label>
            <label class="receipt-form-item">
              <p><span class="required-star">*</span>收款账户</p>
              <el-select v-model="formState.accountId" filterable placeholder="边输边搜">
                <el-option
                  v-for="option in receiptAccountOptions"
                  :key="`receipt-account-${option.value}`"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </label>
            <label class="receipt-form-item">
              <p><span class="required-star">*</span>收款金额</p>
              <el-input :model-value="receiptAmountTotalText" disabled placeholder="根据收款明细自动计算" />
            </label>
            <label class="receipt-form-item">
              <p><span class="required-star">*</span>折让金额</p>
              <el-input :model-value="receiptDiscountTotalText" disabled placeholder="根据收款明细自动计算" />
            </label>
            <label class="receipt-form-item receipt-form-item--full">
              <p>摘要</p>
              <el-input v-model="formState.remark" type="textarea" :rows="3" placeholder="输入" />
            </label>
            <label class="receipt-form-item receipt-form-item--full">
              <p>收款凭证</p>
              <input class="receipt-file-input" type="file" @change="(event) => { formState.proofImg = event.target.files?.[0]?.name || formState.proofImg || '' }">
            </label>
          </div>
        </section>

        <section class="receipt-form-section">
          <h3>收款明细</h3>
          <el-button type="primary" @click="openReceiptOrderPicker">关联订单</el-button>
          <el-table :data="formState.receiptOrders || []" class="receipt-form-table" empty-text="请关联订单">
            <el-table-column prop="orderNo" label="订单号" min-width="130" />
            <el-table-column prop="orderTime" label="订单时间" min-width="150" />
            <el-table-column prop="filler" label="填单员" min-width="100" />
            <el-table-column prop="productInfo" label="产品信息" min-width="220" show-overflow-tooltip />
            <el-table-column prop="receivableAmount" label="应收金额" min-width="110">
              <template #default="{ row }">{{ formatCell({ key: 'receivableAmount', label: '应收金额' }, row) }}</template>
            </el-table-column>
            <el-table-column prop="receivedAmount" label="已收金额" min-width="110">
              <template #default="{ row }">{{ formatCell({ key: 'receivedAmount', label: '已收金额' }, row) }}</template>
            </el-table-column>
            <el-table-column prop="arrearsAmount" label="剩余尾款" min-width="110">
              <template #default="{ row }">{{ formatCell({ key: 'arrearsAmount', label: '剩余尾款' }, row) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="订单状态" min-width="100">
              <template #default="{ row }">
                <span class="plain-status" :class="plainStatusClass(row.status)">{{ row.status || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="currentAmount" label="本次收款" min-width="130" class-name="receipt-input-cell">
              <template #default="{ row }">
                <el-input-number v-model="row.currentAmount" :min="0" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column prop="currentDiscount" label="本次折让" min-width="130" class-name="receipt-input-cell">
              <template #default="{ row }">
                <el-input-number v-model="row.currentDiscount" :min="0" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="80">
              <template #default="{ row }">
                <el-button type="primary" link @click="removeReceiptOrder(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>

      <div v-else-if="isDeliveryNotesModule" v-loading="state.detailLoading || deliveryOptionsLoading" class="delivery-form-stack">
        <section class="delivery-form-section">
          <h3>订单信息</h3>
          <el-button type="primary" @click="openDeliveryOrderPicker">添加</el-button>
          <el-table :data="formState.deliveryOrders || []" class="delivery-form-table" empty-text="请添加订单">
            <el-table-column prop="orderNo" label="订单号" min-width="130" />
            <el-table-column prop="customer" label="单位名称" min-width="190" show-overflow-tooltip />
            <el-table-column prop="orderTime" label="订单时间" min-width="150" />
            <el-table-column prop="filler" label="填单员" min-width="100" />
            <el-table-column prop="productInfo" label="产品信息" min-width="250" show-overflow-tooltip />
            <el-table-column prop="amount" label="订单金额" min-width="110">
              <template #default="{ row }">{{ formatCell({ key: 'amount', label: '订单金额' }, row) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="订单状态" min-width="100">
              <template #default="{ row }">
                <span class="plain-status" :class="plainStatusClass(row.status)">{{ row.status || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="80">
              <template #default="{ row }">
                <el-button type="primary" link @click="removeDeliveryOrder(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <section class="delivery-form-section">
          <h3>司机信息</h3>
          <el-button v-if="!(formState.driverRows || []).length" type="primary" @click="openDeliveryDriverPicker">新增</el-button>
          <el-table :data="formState.driverRows || []" class="delivery-form-table" empty-text="请选择司机">
            <el-table-column prop="name" label="用户姓名" min-width="160" />
            <el-table-column prop="phone" label="联系方式" min-width="170" />
            <el-table-column prop="department" label="所在部门" min-width="170" />
            <el-table-column prop="roleText" label="用户角色" min-width="160" />
            <el-table-column label="操作" min-width="110">
              <template #default>
                <el-button type="primary" link @click="openDeliveryDriverPicker">更换司机</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>

      <div v-else class="form-grid">
        <div
          v-for="field in displayFormFields"
          :key="field.key"
          class="form-item"
          :class="{
            'form-item--full': field.type === 'textarea' || (isCustomerModule && field.key === 'address'),
            'form-item--material-wide': isMaterialDetailsModule && ['name', 'remark'].includes(field.key),
            'form-item--manual-narrow': isManualRecordsModule && ['name', 'quantity', 'imageRemark'].includes(field.key),
            'form-item--manual-remark': isManualRecordsModule && field.key === 'remark',
            'form-item--wide': isStaffModule && field.key === 'menuIdList',
            'form-item--staff-remark': isStaffModule && field.type === 'textarea',
            'form-item--permissions': isStaffModule && field.key === 'menuIdList'
          }"
        >
          <p>
            <span v-if="isRequiredField(field)" class="required-star">*</span>
            <span>{{ field.label }}</span>
          </p>
          <el-select
            v-if="field.type === 'select'"
            v-model="formState[field.key]"
            :filterable="field.key === 'sales' || (isMaterialDetailsModule && field.key === 'name')"
            :placeholder="formPlaceholder(field)"
            @change="(value) => handleFormSelectChange(field, value)"
          >
            <el-option
              v-for="option in formOptions(field)"
              :key="`${field.key}-${option.value}`"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-input-number
            v-else-if="field.type === 'number' && !isQuantityNumberField(field)"
            v-model="formState[field.key]"
            :min="0"
            controls-position="right"
          />
          <el-input
            v-else-if="isQuantityNumberField(field)"
            v-model.number="formState[field.key]"
            type="number"
            :min="0"
            :placeholder="formPlaceholder(field)"
          />
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="formState[field.key]"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="formPlaceholder(field)"
          />
          <el-radio-group
            v-else-if="field.type === 'radio'"
            v-model="formState[field.key]"
            @change="(value) => handleFormSelectChange(field, value)"
          >
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
            :placeholder="formPlaceholder(field)"
          />
          <el-upload
            v-else-if="field.type === 'file'"
            class="plain-upload"
            action="#"
            accept="image/*"
            :auto-upload="false"
            :limit="1"
            :file-list="uploadFileList(field)"
            :on-change="(file) => handleFileFieldChange(field, file)"
            :on-remove="() => handleFileFieldRemove(field)"
          >
            <el-button :icon="Plus">上传图片</el-button>
          </el-upload>
          <el-input v-else v-model="formState[field.key]" :placeholder="formPlaceholder(field)" />
        </div>
      </div>

      <section v-if="linkedOrderSectionVisible" class="material-order-section">
        <h3>订单信息</h3>
        <el-table
          v-if="materialDetailSelectedOrderRows.length"
          :data="materialDetailSelectedOrderRows"
          class="material-order-table"
        >
          <el-table-column prop="orderNo" label="订单号" min-width="130" />
          <el-table-column prop="customer" label="单位名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="orderTime" label="订单时间" min-width="150" />
          <el-table-column prop="filler" label="填单员" min-width="100" />
          <el-table-column prop="productInfo" label="产品信息" min-width="220" show-overflow-tooltip />
          <el-table-column prop="amount" label="订单金额" min-width="110">
            <template #default="{ row }">{{ formatCell({ key: 'amount', label: '订单金额' }, row) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="订单状态" min-width="100">
            <template #default="{ row }">
              <span class="plain-status" :class="plainStatusClass(row.status)">{{ row.status || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="80">
            <template #default>
              <el-button type="primary" link @click="openMaterialOrderPicker">更换</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="material-order-empty">
          <span>请选择关联订单</span>
          <el-button type="primary" @click="openMaterialOrderPicker">选择订单</el-button>
        </div>
      </section>
      <template #footer>
        <strong v-if="isReceiptsModule" class="receipt-dialog-total">
          收款合计：<span>{{ receiptAmountTotalText }}</span> 折让合计：<span>{{ receiptDiscountTotalText }}</span>
        </strong>
        <strong v-if="isReimbursementsModule" class="receipt-dialog-total">
          报销合计：<span>{{ reimbursementAmountText }}</span> 折让合计：<span>{{ reimbursementDiscountText }}</span>
        </strong>
        <el-button :disabled="state.saving" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="state.saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="materialOrderPickerVisible"
      title="选择订单"
      width="1120px"
      class="special-dialog material-order-picker-dialog"
      :close-on-click-modal="false"
    >
      <div class="delivery-picker-search">
        <label>
          <span>订单号</span>
          <el-input v-model="materialOrderFilters.orderNo" placeholder="请输入" />
        </label>
        <label>
          <span>产品名称</span>
          <el-input v-model="materialOrderFilters.productInfo" placeholder="请输入" />
        </label>
        <div class="delivery-picker-actions">
          <el-button type="primary" :icon="Search" @click="loadMaterialOrderOptions">查询</el-button>
          <el-button :icon="Refresh" @click="clearMaterialOrderFilters">重置</el-button>
        </div>
      </div>
      <el-table
        v-loading="materialOrderOptionsLoading"
        :data="materialOrderOptions"
        class="delivery-picker-table"
        empty-text="暂无可选择订单"
      >
        <el-table-column width="52">
          <template #default="{ row }">
            <el-radio v-model="materialSelectedOrderId" :label="materialOrderRowId(row)">&nbsp;</el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="130" />
        <el-table-column prop="customer" label="单位名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="orderTime" label="订单时间" min-width="150" />
        <el-table-column prop="filler" label="填单员" min-width="100" />
        <el-table-column prop="productInfo" label="产品信息" min-width="260" show-overflow-tooltip />
        <el-table-column prop="amount" label="订单金额" min-width="120">
          <template #default="{ row }">{{ formatCell({ key: 'amount', label: '订单金额' }, row) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" min-width="100">
          <template #default="{ row }">
            <span class="plain-status" :class="plainStatusClass(row.status)">{{ row.status || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="materialOrderPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMaterialOrder">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="receiptOrderPickerVisible"
      title="关联订单"
      width="1280px"
      class="special-dialog receipt-order-dialog"
      :close-on-click-modal="false"
    >
      <div class="receipt-order-search">
        <label>
          <span>订单号</span>
          <el-input v-model="receiptOrderFilters.orderNo" placeholder="请输入" />
        </label>
        <label>
          <span>产品名称</span>
          <el-input v-model="receiptOrderFilters.productInfo" placeholder="请输入" />
        </label>
        <div class="receipt-order-actions">
          <el-button type="primary" :icon="Search" @click="loadReceiptOrderOptions">查询</el-button>
          <el-button :icon="Refresh" @click="clearReceiptOrderFilters">重置</el-button>
        </div>
      </div>
      <el-table v-loading="receiptOptionsLoading" :data="receiptOrderOptions" class="receipt-order-table" empty-text="暂无可关联订单">
        <el-table-column width="48">
          <template #header>
            <el-checkbox
              :model-value="receiptOrderOptions.length > 0 && receiptOrderOptions.every(receiptOrderIsSelected)"
              :indeterminate="receiptOrderOptions.some(receiptOrderIsSelected) && !receiptOrderOptions.every(receiptOrderIsSelected)"
              @change="(checked) => {
                receiptSelectedOrderIds = checked ? receiptOrderOptions.map(receiptOrderRowId) : []
                if (checked) receiptOrderOptions.forEach((row) => {
                  row.currentAmount = row.currentAmount || row.arrearsAmount || 0
                  row.currentDiscount = row.currentDiscount || 0
                })
              }"
            />
          </template>
          <template #default="{ row }">
            <el-checkbox
              :model-value="receiptOrderIsSelected(row)"
              @change="(checked) => toggleReceiptOrder(row, checked)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="130" />
        <el-table-column prop="orderTime" label="订单时间" min-width="150" />
        <el-table-column prop="filler" label="填单员" min-width="100" />
        <el-table-column prop="productInfo" label="产品信息" min-width="260" show-overflow-tooltip />
        <el-table-column prop="receivableAmount" label="应收金额" min-width="110">
          <template #default="{ row }">{{ formatCell({ key: 'receivableAmount', label: '应收金额' }, row) }}</template>
        </el-table-column>
        <el-table-column prop="receivedAmount" label="已收金额" min-width="110">
          <template #default="{ row }">{{ formatCell({ key: 'receivedAmount', label: '已收金额' }, row) }}</template>
        </el-table-column>
        <el-table-column prop="arrearsAmount" label="剩余尾款" min-width="110">
          <template #default="{ row }">{{ formatCell({ key: 'arrearsAmount', label: '剩余尾款' }, row) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" min-width="100">
          <template #default="{ row }">
            <span class="plain-status" :class="plainStatusClass(row.status)">{{ row.status || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="currentAmount" label="本次收款" min-width="130" class-name="receipt-order-edit-cell">
          <template #default="{ row }">
            <el-input-number
              v-if="receiptOrderIsSelected(row)"
              v-model="row.currentAmount"
              :min="0"
              controls-position="right"
              placeholder="请输入"
            />
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="currentDiscount" label="本次折让" min-width="130" class-name="receipt-order-edit-cell">
          <template #default="{ row }">
            <el-input-number
              v-if="receiptOrderIsSelected(row)"
              v-model="row.currentDiscount"
              :min="0"
              controls-position="right"
              placeholder="请输入"
            />
            <span v-else>--</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="receiptOrderPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReceiptOrders">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deliveryOrderPickerVisible"
      title="选择订单"
      width="1120px"
      class="special-dialog delivery-picker-dialog"
      :close-on-click-modal="false"
    >
      <div class="delivery-picker-search">
        <label>
          <span>订单号</span>
          <el-input v-model="deliveryOrderFilters.orderNo" placeholder="请输入" />
        </label>
        <label>
          <span>产品名称</span>
          <el-input v-model="deliveryOrderFilters.productInfo" placeholder="请输入" />
        </label>
        <div class="delivery-picker-actions">
          <el-button type="primary" :icon="Search">查询</el-button>
          <el-button :icon="Refresh" @click="clearDeliveryOrderFilters">重置</el-button>
        </div>
      </div>
      <el-table
        v-loading="deliveryOptionsLoading"
        :data="filteredDeliveryOrderOptions"
        class="delivery-picker-table"
        empty-text="暂无可配送订单"
      >
        <el-table-column width="48">
          <template #header>
            <el-checkbox
              :model-value="filteredDeliveryOrderOptions.length > 0 && filteredDeliveryOrderOptions.every((row) => deliverySelectedOrderIds.includes(deliveryOrderRowId(row)))"
              :indeterminate="filteredDeliveryOrderOptions.some((row) => deliverySelectedOrderIds.includes(deliveryOrderRowId(row))) && !filteredDeliveryOrderOptions.every((row) => deliverySelectedOrderIds.includes(deliveryOrderRowId(row)))"
              @change="(checked) => {
                const ids = filteredDeliveryOrderOptions.map(deliveryOrderRowId)
                deliverySelectedOrderIds = checked
                  ? Array.from(new Set([...deliverySelectedOrderIds, ...ids]))
                  : deliverySelectedOrderIds.filter((id) => !ids.includes(id))
              }"
            />
          </template>
          <template #default="{ row }">
            <el-checkbox
              :model-value="deliverySelectedOrderIds.includes(deliveryOrderRowId(row))"
              @change="(checked) => {
                const id = deliveryOrderRowId(row)
                deliverySelectedOrderIds = checked
                  ? Array.from(new Set([...deliverySelectedOrderIds, id]))
                  : deliverySelectedOrderIds.filter((item) => item !== id)
              }"
            />
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="130" />
        <el-table-column prop="customer" label="单位名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="orderTime" label="订单时间" min-width="150" />
        <el-table-column prop="filler" label="填单员" min-width="100" />
        <el-table-column prop="productInfo" label="产品信息" min-width="260" show-overflow-tooltip />
        <el-table-column prop="amount" label="订单金额" min-width="110">
          <template #default="{ row }">{{ formatCell({ key: 'amount', label: '订单金额' }, row) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" min-width="100">
          <template #default="{ row }">
            <span class="plain-status" :class="plainStatusClass(row.status)">{{ row.status || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="deliveryOrderPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDeliveryOrders">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deliveryDriverPickerVisible"
      title="选择司机"
      width="1120px"
      class="special-dialog delivery-picker-dialog"
      :close-on-click-modal="false"
    >
      <div class="delivery-picker-search delivery-picker-search--driver">
        <label>
          <span>人员姓名</span>
          <el-input v-model="deliveryDriverFilters.name" placeholder="请输入" />
        </label>
        <label>
          <span>联系方式</span>
          <el-input v-model="deliveryDriverFilters.phone" placeholder="请输入" />
        </label>
        <div class="delivery-picker-actions">
          <el-button type="primary" :icon="Search">查询</el-button>
          <el-button :icon="Refresh" @click="clearDeliveryDriverFilters">重置</el-button>
        </div>
      </div>
      <el-table
        v-loading="deliveryOptionsLoading"
        :data="filteredDeliveryDriverOptions"
        class="delivery-picker-table"
        empty-text="暂无司机"
      >
        <el-table-column width="48">
          <template #default="{ row }">
            <el-radio v-model="deliverySelectedDriverId" :label="deliveryDriverRowId(row)">&nbsp;</el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="用户姓名" min-width="180" />
        <el-table-column prop="phone" label="联系方式" min-width="180" />
        <el-table-column prop="department" label="所在部门" min-width="180" />
        <el-table-column prop="roleText" label="用户角色" min-width="180" />
      </el-table>
      <template #footer>
        <el-button @click="deliveryDriverPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDeliveryDriver">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      :title="detailDialogTitle"
      width="1280px"
      :class="detailDialogClass"
      :close-on-click-modal="false"
      v-loading="state.detailLoading"
    >
      <template v-if="currentRow && isProductCraftDetailModule">
        <div class="product-craft-detail">
          <div
            class="product-craft-status"
            :class="{
              'product-craft-status--done': currentRow.status === '已生产',
              'product-craft-status--pending': currentRow.status !== '已生产'
            }"
          >
            {{ currentRow.status || '待生产' }}
          </div>

          <section class="product-craft-detail-section">
            <h3>工艺信息</h3>
            <el-table :data="currentRow.craftRows || []" class="product-craft-detail-table">
              <el-table-column prop="craftName" label="工艺名称" min-width="140" />
              <el-table-column prop="specification" label="规格" min-width="90" />
              <el-table-column prop="openCount" label="开数" min-width="90" />
              <el-table-column prop="basePrice" label="起价" min-width="90" />
              <el-table-column prop="finishedCount" label="成品数量" min-width="110" />
              <el-table-column prop="unit" label="单位" min-width="90" />
              <el-table-column prop="unitPrice" label="单价" min-width="110">
                <template #default="{ row }">{{ formatCell({ key: 'unitPrice', label: '单价' }, row) }}</template>
              </el-table-column>
              <el-table-column prop="amount" label="客户金额" min-width="120">
                <template #default="{ row }">{{ formatCell({ key: 'amount', label: '客户金额' }, row) }}</template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="120" />
            </el-table>
          </section>

          <section class="product-craft-detail-section">
            <h3>产品信息</h3>
            <el-table :data="currentRow.productRows || []" class="product-craft-detail-table">
              <el-table-column prop="productName" label="产品名称" min-width="420" show-overflow-tooltip />
              <el-table-column prop="finishedSpec" label="成品规格" min-width="130" />
              <el-table-column prop="orderQuantity" label="订货数量" min-width="120" />
              <el-table-column prop="unit" label="单位" min-width="100" />
              <el-table-column prop="amount" label="金额" min-width="120">
                <template #default="{ row }">{{ formatCell({ key: 'amount', label: '金额' }, row) }}</template>
              </el-table-column>
            </el-table>
          </section>

          <section class="product-craft-detail-section product-craft-order-section">
            <h3>订单信息</h3>
            <div class="product-craft-order-grid">
              <div><span>订单号：</span><strong>{{ currentRow.orderNo || '-' }}</strong></div>
              <div v-if="props.moduleKey === 'productCraftsOutsource'"><span>转单单位：</span><strong>{{ currentRow.transferUnit || '-' }}</strong></div>
              <div><span>单位名称：</span><strong>{{ currentRow.customer || '-' }}</strong></div>
              <div><span>联系人：</span><strong>{{ currentRow.contact || '-' }}</strong></div>
              <div><span>联系方式：</span><strong>{{ currentRow.phone || '-' }}</strong></div>
              <div><span>送货地址：</span><strong>{{ currentRow.deliveryAddress || '-' }}</strong></div>
              <div></div>
              <div><span>交货日期：</span><strong>{{ currentRow.deliveryDate || '-' }}</strong></div>
              <div><span>交货方式：</span><strong>{{ currentRow.deliveryType || '-' }}</strong></div>
              <div><span>印刷要求：</span><strong>{{ currentRow.printRequirement || '-' }}</strong></div>
              <div></div>
              <div><span>备注：</span><strong>{{ currentRow.remark || '-' }}</strong></div>
            </div>
          </section>
        </div>
      </template>

      <template v-else-if="currentRow && isOutsourceModule">
        <div class="outsource-detail">
          <div class="outsource-detail-status" :class="plainStatusClass(currentRow.status)">
            {{ currentRow.status || '-' }}
          </div>

          <section class="outsource-detail-section">
            <h3>订单信息</h3>
            <div class="outsource-order-grid">
              <div><span>订单号：</span><strong>{{ currentRow.orderNo || '-' }}</strong></div>
              <div><span>单位名称：</span><strong>{{ currentRow.customer || '-' }}</strong></div>
              <div><span>联系人：</span><strong>{{ currentRow.contact || '-' }}</strong></div>
              <div><span>联系方式：</span><strong>{{ currentRow.phone || '-' }}</strong></div>
              <div><span>送货地址：</span><strong>{{ currentRow.deliveryAddress || '-' }}</strong></div>
              <div></div>
              <div><span>交货日期：</span><strong>{{ currentRow.deliveryDate || '-' }}</strong></div>
              <div><span>交货方式：</span><strong>{{ currentRow.deliveryType || '-' }}</strong></div>
              <div><span>印刷要求：</span><strong>{{ currentRow.printRequirement || '-' }}</strong></div>
              <div></div>
              <div><span>备注：</span><strong>{{ currentRow.remark || '-' }}</strong></div>
            </div>
          </section>

          <section class="outsource-detail-section">
            <h3>产品信息</h3>
            <el-table :data="currentRow.productRows || []" class="outsource-detail-table" empty-text="暂无产品信息">
              <el-table-column prop="productName" label="产品名称" min-width="420" show-overflow-tooltip />
              <el-table-column prop="finishedSpec" label="成品规格" min-width="130" />
              <el-table-column prop="orderQuantity" label="订货数量" min-width="120" />
              <el-table-column prop="unit" label="单位" min-width="100" />
              <el-table-column prop="amount" label="金额" min-width="120">
                <template #default="{ row }">{{ formatCell({ key: 'amount', label: '金额' }, row) }}</template>
              </el-table-column>
            </el-table>
          </section>

          <section class="outsource-detail-section">
            <h3>工艺信息</h3>
            <el-table :data="currentRow.craftRows || []" class="outsource-detail-table" empty-text="暂无工艺信息">
              <el-table-column prop="productName" label="产品名称" min-width="160" show-overflow-tooltip />
              <el-table-column prop="craftName" label="工艺名称" min-width="120" />
              <el-table-column prop="specification" label="规格" min-width="90" />
              <el-table-column prop="openCount" label="开数" min-width="90" />
              <el-table-column prop="basePrice" label="起价" min-width="90" />
              <el-table-column prop="finishedCount" label="成品数量" min-width="110" />
              <el-table-column prop="unit" label="单位" min-width="90" />
              <el-table-column prop="unitPrice" label="单价" min-width="110">
                <template #default="{ row }">{{ formatCell({ key: 'unitPrice', label: '单价' }, row) }}</template>
              </el-table-column>
              <el-table-column prop="amount" label="客户金额" min-width="120">
                <template #default="{ row }">{{ formatCell({ key: 'amount', label: '客户金额' }, row) }}</template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="110" />
              <el-table-column v-if="outsourceShowsCraftMeta" prop="status" label="工艺状态" min-width="110">
                <template #default="{ row }">
                  <span class="plain-status" :class="plainStatusClass(row.status)">{{ row.status || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column v-if="outsourceShowsCraftMeta" prop="operator" label="操作员" min-width="110" />
              <el-table-column v-if="outsourceShowsCraftMeta" label="操作" min-width="100">
                <template #default="{ row }">
                  <el-button
                    v-for="action in outsourceCraftActions(row)"
                    :key="action"
                    type="primary"
                    link
                    @click="handleOutsourceCraftAction(action, row)"
                  >
                    {{ action }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <section v-if="outsourceShowsConsumables" class="outsource-detail-section">
            <h3>耗材记录</h3>
            <el-table :data="currentRow.consumableRows || []" class="outsource-detail-table" empty-text="暂无耗材记录">
              <el-table-column prop="consumableName" label="耗材名称" min-width="150" />
              <el-table-column prop="typeText" label="明细类型" min-width="120" />
              <el-table-column prop="quantity" label="数量" min-width="90" />
              <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
              <el-table-column prop="operator" label="操作员" min-width="110" />
              <el-table-column prop="operationTime" label="操作时间" min-width="180" />
              <el-table-column label="操作" min-width="90">
                <template #default="{ row }">
                  <el-button type="primary" link @click="openLinkedModuleDetail('materialDetails', row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <section v-if="outsourceShowsHandRecords" class="outsource-detail-section">
            <h3>手工记录</h3>
            <el-table :data="currentRow.handRows || []" class="outsource-detail-table" empty-text="暂无手工记录">
              <el-table-column prop="name" label="手工名称" min-width="150" />
              <el-table-column prop="quantity" label="数量" min-width="90" />
              <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
              <el-table-column prop="operator" label="操作员" min-width="110" />
              <el-table-column prop="operationTime" label="操作时间" min-width="180" />
              <el-table-column label="操作" min-width="90">
                <template #default="{ row }">
                  <el-button type="primary" link @click="openLinkedModuleDetail('manualRecords', row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <section class="outsource-detail-section">
            <h3>订单记录</h3>
            <div class="outsource-timeline">
              <article v-for="(item, index) in currentRow.timeline || []" :key="`${item.date}-${index}`">
                <span>{{ item.date }}</span>
                <strong>{{ item.title }}</strong>
                <p>{{ item.desc }}</p>
              </article>
            </div>
          </section>
        </div>
      </template>

      <template v-else-if="currentRow && isManualRecordsModule">
        <div class="material-detail-view">
          <section class="material-detail-card">
            <h3>手工信息</h3>
            <div class="material-detail-info-grid">
              <div class="material-detail-field">
                <span>手工名称：</span>
                <strong>{{ currentRow.name || '-' }}</strong>
              </div>
              <div></div>
              <div class="material-detail-field">
                <span>数量：</span>
                <strong>{{ currentRow.quantity || 0 }}</strong>
              </div>
              <div></div>
              <div class="material-detail-field material-detail-field--images">
                <span>图片备注：</span>
                <div class="material-detail-images">
                  <template v-if="materialDetailImages(currentRow).length">
                    <div v-for="(image, index) in materialDetailImages(currentRow)" :key="`${image}-${index}`" class="material-detail-image">
                      <img v-if="/^(https?:|data:|blob:)/.test(String(image))" :src="image" alt="图片备注" />
                      <el-icon v-else><Picture /></el-icon>
                    </div>
                  </template>
                  <span v-else class="material-detail-empty">-</span>
                </div>
              </div>
              <div></div>
              <div class="material-detail-field">
                <span>备注：</span>
                <strong>{{ currentRow.remark || '-' }}</strong>
              </div>
              <div></div>
              <div class="material-detail-field">
                <span>操作员：</span>
                <strong>{{ currentRow.operator || '-' }}</strong>
              </div>
              <div class="material-detail-field">
                <span>操作时间：</span>
                <strong>{{ currentRow.updatedAt || currentRow.createTime || '-' }}</strong>
              </div>
            </div>
          </section>

          <section class="material-detail-card">
            <h3>订单信息</h3>
            <el-table :data="materialDetailOrderRows" class="material-detail-order-table" empty-text="暂无订单信息">
              <el-table-column prop="orderNo" label="订单号" min-width="130" />
              <el-table-column prop="customer" label="单位名称" min-width="210" show-overflow-tooltip />
              <el-table-column prop="orderTime" label="订单时间" min-width="160" />
              <el-table-column prop="filler" label="填单员" min-width="110" />
              <el-table-column prop="productInfo" label="产品信息" min-width="320" show-overflow-tooltip />
              <el-table-column prop="amount" label="订单金额" min-width="130">
                <template #default="{ row }">{{ formatCell({ key: 'amount', label: '订单金额' }, row) }}</template>
              </el-table-column>
              <el-table-column prop="status" label="订单状态" min-width="110">
                <template #default="{ row }">
                  <span class="plain-status" :class="plainStatusClass(row.status)">{{ row.status || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="90">
                <template #default="{ row }">
                  <el-button type="primary" link @click="handleDetailTableAction(row, '订单详情')">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </div>
      </template>

      <template v-else-if="currentRow && isMaterialDetailsModule">
        <div class="material-detail-view">
          <section class="material-detail-card">
            <h3>耗材信息</h3>
            <div class="material-detail-info-grid">
              <div class="material-detail-field">
                <span>耗材名称：</span>
                <strong>{{ currentRow.name || '-' }}</strong>
              </div>
              <div></div>
              <div class="material-detail-field">
                <span>耗材单位：</span>
                <strong>{{ currentRow.unit || '-' }}</strong>
              </div>
              <div class="material-detail-field">
                <span>耗材价值：</span>
                <strong>{{ formatCell({ key: 'price', label: '耗材价值' }, currentRow) }}</strong>
              </div>
              <div class="material-detail-field">
                <span>明细类型：</span>
                <strong>{{ currentRow.type || currentRow.status || '-' }}</strong>
              </div>
              <div></div>
              <div class="material-detail-field">
                <span>数量：</span>
                <strong>{{ currentRow.quantity || 0 }}</strong>
              </div>
              <div></div>
              <div class="material-detail-field material-detail-field--images">
                <span>图片备注：</span>
                <div class="material-detail-images">
                  <template v-if="materialDetailImages(currentRow).length">
                    <div v-for="(image, index) in materialDetailImages(currentRow)" :key="`${image}-${index}`" class="material-detail-image">
                      <img v-if="/^(https?:|data:|blob:)/.test(String(image))" :src="image" alt="图片备注" />
                      <el-icon v-else><Picture /></el-icon>
                    </div>
                  </template>
                  <span v-else class="material-detail-empty">-</span>
                </div>
              </div>
              <div></div>
              <div class="material-detail-field">
                <span>备注：</span>
                <strong>{{ currentRow.remark || currentRow.detailNote || '-' }}</strong>
              </div>
              <div></div>
              <div class="material-detail-field">
                <span>操作员：</span>
                <strong>{{ currentRow.operator || '-' }}</strong>
              </div>
              <div class="material-detail-field">
                <span>操作时间：</span>
                <strong>{{ currentRow.updatedAt || currentRow.createTime || '-' }}</strong>
              </div>
            </div>
          </section>

          <section v-if="currentRow.type === '订单消耗' || currentRow.status === '订单消耗'" class="material-detail-card">
            <h3>订单信息</h3>
            <el-table :data="materialDetailOrderRows" class="material-detail-order-table" empty-text="暂无订单信息">
              <el-table-column prop="orderNo" label="订单号" min-width="130" />
              <el-table-column prop="customer" label="单位名称" min-width="210" show-overflow-tooltip />
              <el-table-column prop="orderTime" label="订单时间" min-width="160" />
              <el-table-column prop="filler" label="填单员" min-width="110" />
              <el-table-column prop="productInfo" label="产品信息" min-width="320" show-overflow-tooltip />
              <el-table-column prop="amount" label="订单金额" min-width="130">
                <template #default="{ row }">{{ formatCell({ key: 'amount', label: '订单金额' }, row) }}</template>
              </el-table-column>
              <el-table-column prop="status" label="订单状态" min-width="110">
                <template #default="{ row }">
                  <span class="plain-status" :class="plainStatusClass(row.status)">{{ row.status || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="90">
                <template #default="{ row }">
                  <el-button type="primary" link @click="handleDetailTableAction(row, '订单详情')">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </div>
      </template>

      <template v-else-if="currentRow && isCustomerModule">
        <div class="customer-detail-stack">
          <section class="customer-info-panel">
            <h3>客户信息</h3>
            <div class="customer-info-grid">
              <div v-for="field in profile.sections[0].fields" :key="field.key" class="customer-info-item">
                <p>{{ field.label }}:</p>
                <strong>{{ formatCell(field, currentRow) }}</strong>
              </div>
            </div>
          </section>

          <section class="customer-record-panel">
            <div class="customer-record-tabs">
              <button
                v-for="section in customerDetailTabs"
                :key="section.dataKey"
                type="button"
                :class="{ active: activeCustomerDetailTab === section.dataKey }"
                @click="activeCustomerDetailTab = section.dataKey"
              >
                {{ section.title }}
              </button>
            </div>

            <el-table
              v-if="activeCustomerDetailSection"
              :data="currentRow[activeCustomerDetailSection.dataKey] || []"
              class="customer-record-table"
              empty-text="暂无数据"
            >
              <el-table-column
                v-for="column in activeCustomerDetailSection.columns"
                :key="column.key"
                :prop="column.key"
                :label="column.label"
                min-width="150"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <el-tag v-if="column.tag" :type="tagType(row[column.key])">{{ row[column.key] }}</el-tag>
                  <span v-else>{{ formatCell(column, row) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </div>
      </template>

      <template v-else-if="currentRow">
        <div class="section-stack">
          <div
            v-if="isDeliveryNotesModule"
            class="delivery-detail-status"
            :class="plainStatusClass(currentRow.status)"
          >
            {{ currentRow.status || '-' }}
          </div>

          <section v-if="detailHighlights.length" class="detail-highlights" :class="themeClass">
            <article v-for="item in detailHighlights" :key="item.title" class="detail-highlight">
              <p>{{ item.title }}</p>
              <strong>{{ item.value }}</strong>
              <span>{{ item.helper }}</span>
            </article>
          </section>

          <section v-for="section in visibleDetailSections" :key="section.title" class="detail-section">
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
                  <el-button
                    v-if="column.action"
                    type="primary"
                    link
                    @click="handleDetailTableAction(row, column.action)"
                  >
                    详情
                  </el-button>
                  <el-tag v-else-if="column.tag" :type="tagType(row[column.key])">{{ row[column.key] }}</el-tag>
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
        <strong v-if="isOutsourceModule" class="outsource-detail-total">
          订单合计：{{ formatCell({ key: 'amount', label: '订单金额' }, currentRow || {}) }}
        </strong>
        <strong v-if="isReceiptsModule" class="receipt-dialog-total">
          收款合计：<span>{{ currentReceiptAmountText }}</span> 折让合计：<span>{{ currentReceiptDiscountText }}</span>
        </strong>
        <strong v-if="isReimbursementsModule" class="receipt-dialog-total">
          报销合计：<span>{{ currentReimbursementAmountText }}</span> 折让合计：<span>{{ currentReimbursementDiscountText }}</span>
        </strong>
        <el-button @click="detailVisible = false">返回</el-button>
        <template v-if="isOutsourceModule">
          <el-button
            v-for="action in outsourceFooterActions"
            :key="action"
            :type="action === '驳回' ? 'danger' : 'primary'"
            @click="handleOutsourceFooterAction(action)"
          >
            {{ action }}
          </el-button>
        </template>
        <el-button v-if="productCraftCanOutsource" type="primary" @click="openOutsourceTransferDialog(currentRow)">
          转外协
        </el-button>
        <template v-if="isReceiptsModule">
          <el-button type="primary" @click="openEdit(currentRow); detailVisible = false">编辑</el-button>
          <el-button type="primary" @click="printRow(currentRow)">打印</el-button>
        </template>
        <template v-if="isReimbursementsModule">
          <el-button type="primary" @click="openEdit(currentRow); detailVisible = false">编辑</el-button>
          <el-button type="primary" @click="printRow(currentRow)">打印</el-button>
        </template>
        <el-button
          v-if="!isProductCraftsModule && !isOutsourceModule && !isReceiptsModule && !isReimbursementsModule && (!isDeliveryNotesModule || currentRow?.status === '待配送')"
          type="primary"
          @click="openEdit(currentRow); detailVisible = false"
        >
          编辑
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="rowDetailVisible"
      :title="rowDetailTitle"
      width="760px"
      class="special-dialog outsource-row-detail-dialog"
      :close-on-click-modal="false"
    >
      <div class="outsource-row-detail-grid">
        <div v-for="item in rowDetailItems" :key="item.label" class="outsource-row-detail-item">
          <span>{{ item.label }}：</span>
          <strong>{{ item.value || '-' }}</strong>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="rowDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="outsourceTransferVisible"
      title="选择外协单位"
      width="760px"
      class="special-dialog outsource-transfer-dialog"
      :close-on-click-modal="false"
    >
      <div class="outsource-transfer-search">
        <el-input
          v-model="outsourceTransferKeyword"
          placeholder="请输入外协单位名称"
          clearable
          @keyup.enter="loadOutsourceTransferOptions"
        />
        <el-button type="primary" :icon="Search" :loading="outsourceTransferLoading" @click="loadOutsourceTransferOptions">
          查询
        </el-button>
      </div>
      <el-radio-group v-model="outsourceTransferTenantId" class="outsource-transfer-list">
        <label v-for="item in outsourceTransferOptions" :key="item.value" class="outsource-transfer-item">
          <el-radio :value="item.value">
            <strong>{{ item.label }}</strong>
            <span v-if="item.contact">联系人：{{ item.contact }}</span>
          </el-radio>
        </label>
      </el-radio-group>
      <el-empty v-if="!outsourceTransferLoading && !outsourceTransferOptions.length" description="暂无外协单位" />
      <template #footer>
        <el-button :disabled="outsourceTransferSaving" @click="outsourceTransferVisible = false">取消</el-button>
        <el-button type="primary" :loading="outsourceTransferSaving" @click="confirmOutsourceTransfer">确定转外协</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="resetPasswordVisible"
      title="重置密码"
      width="720px"
      class="special-dialog reset-password-dialog"
      :close-on-click-modal="false"
    >
      <div class="reset-password-form">
        <label>
          <span>*新密码</span>
          <el-input v-model="resetPasswordForm.password" placeholder="输入" show-password />
        </label>
      </div>
      <template #footer>
        <el-button :disabled="state.resetPasswordSaving" @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" :loading="state.resetPasswordSaving" @click="confirmResetPassword">确定</el-button>
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

.duration-purchase-shell {
  min-height: calc(100vh - 178px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 72px;
}

.duration-purchase-card {
  width: min(1180px, calc(100vw - 340px));
  min-height: 520px;
  border-radius: 10px;
  border: 1px solid #d8d8d8;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.duration-purchase-head {
  display: flex;
  align-items: center;
  min-height: 96px;
  padding: 0 44px;
}

.duration-purchase-head h2 {
  margin: 0;
  color: #111111;
  font-size: 28px;
  font-weight: 800;
}

.duration-purchase-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 214px;
  gap: 24px;
  padding: 0 44px 52px;
}

.duration-plan-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 18px;
}

.duration-plan-card {
  min-height: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 50px 18px 28px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  background: #ffffff;
  color: #222222;
  cursor: pointer;
}

.duration-plan-card.active {
  border: 2px solid #1f66ff;
  background: #eaf1ff;
}

.duration-plan-card__mark {
  width: 38px;
  height: 50px;
  margin-bottom: 28px;
  border-radius: 50% 50% 52% 52%;
  background: #555555;
  transform: rotate(18deg);
}

.duration-plan-card strong {
  color: #111111;
  font-size: 25px;
  font-weight: 800;
}

.duration-plan-card.active strong {
  color: #1f66ff;
}

.duration-plan-card em {
  margin-top: 24px;
  color: #8e8e8e;
  font-size: 18px;
  font-style: normal;
}

.duration-plan-card b {
  margin-top: 42px;
  color: #2a2a2a;
  font-size: 36px;
  font-weight: 800;
}

.duration-plan-card del,
.duration-payment-panel del {
  margin-top: 18px;
  color: #c9c9c9;
  font-size: 18px;
  font-weight: 700;
}

.duration-payment-panel {
  min-height: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-left: 1px solid #cfcfcf;
  padding-left: 24px;
}

.duration-payment-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.duration-payment-tabs button {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: #5a5a5a;
  color: #ffffff;
  font-size: 22px;
  font-weight: 800;
  cursor: pointer;
}

.duration-payment-tabs button.active {
  background: #1f66ff;
}

.duration-payment-panel > span {
  color: #c8c8c8;
  font-size: 18px;
}

.duration-qr {
  width: 162px;
  height: 162px;
  display: grid;
  place-items: center;
  margin-top: 24px;
  border-radius: 12px;
  background: #303030;
  color: #ffffff;
  font-size: 22px;
  font-weight: 800;
}

.duration-payment-panel > strong {
  margin-top: 28px;
  color: #2a2a2a;
  font-size: 34px;
  font-weight: 800;
}

.duration-agreement {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 42px;
  color: #8b8b8b;
  font-size: 18px;
}

.duration-agreement input {
  width: 18px;
  height: 18px;
  accent-color: #1f66ff;
}

.module-grid {
  display: grid;
  gap: 22px;
}

.module-grid--tree {
  grid-template-columns: minmax(300px, 392px) minmax(0, 1fr);
  align-items: start;
}

.module-main {
  min-width: 0;
  display: grid;
  gap: 22px;
}

.module-main > * {
  min-width: 0;
}

.tree-card {
  min-height: 720px;
}

.tree-card :deep(.page-block__body) {
  padding: 38px 28px;
}

.tree-search {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 22px;
  padding: 0 0 30px;
  border-bottom: 1px solid #a8a8a8;
}

.tree-search strong {
  color: #111111;
  font-size: 24px;
  font-weight: 800;
}

.tree-search :deep(.el-input) {
  --el-input-height: 56px;
  font-size: 22px;
}

.tree-search :deep(.el-input__wrapper) {
  border-radius: 6px;
  background: #f5f6f8;
  box-shadow: none;
}

.tree-list {
  display: grid;
  gap: 4px;
  padding-top: 44px;
}

.tree-node {
  display: grid;
  gap: 0;
}

.tree-node__label,
.tree-node__child {
  width: 100%;
  min-height: 68px;
  border: 0;
  background: transparent;
  color: #4b4b4b;
  text-align: left;
  font-size: 22px;
  cursor: pointer;
}

.tree-node__label {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 0 24px;
  color: #1f66ff;
}

.tree-node__label span {
  font-size: 22px;
}

.tree-node__label em {
  margin-left: auto;
  color: #1f66ff;
  font-style: normal;
  font-size: 30px;
  line-height: 1;
}

.tree-node__child {
  padding: 0 24px 0 112px;
}

.tree-node__label.active,
.tree-node__child.active {
  background: #e9eef7;
  color: #1f66ff;
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

.search-card :deep(.el-input),
.search-card :deep(.el-select),
.search-card :deep(.el-date-editor.el-input) {
  --el-input-height: 56px;
  width: 100%;
  font-size: 18px;
}

.search-card :deep(.el-input__wrapper),
.search-card :deep(.el-select__wrapper) {
  min-height: 56px;
  border-radius: 6px;
  background: #f5f6f8;
  box-shadow: none;
}

.search-card :deep(.el-input__inner),
.search-card :deep(.el-select__placeholder),
.search-card :deep(.el-select__selected-item) {
  color: #9b9b9b;
  font-size: 18px;
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

.module-grid--tree .search-card :deep(.page-block__body) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 36px;
  padding: 36px 42px;
}

.module-grid--tree .search-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 0;
}

.module-grid--tree .search-toolbar {
  margin-bottom: 0;
}

.module-grid--tree .table-card :deep(.page-block__body) {
  min-height: 564px;
  padding: 36px 42px 42px;
}

.module-grid--tree .special-table :deep(.el-table__header th) {
  height: 68px;
  background: #f1f2f4 !important;
  color: #111111;
  font-size: 20px;
}

.module-grid--tree .special-table :deep(.el-table__body td) {
  height: 68px;
  color: #111111;
  font-size: 19px;
}

@media (max-width: 1320px) {
  .module-grid--tree {
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 18px;
  }

  .module-grid--tree .search-card :deep(.page-block__body) {
    grid-template-columns: 1fr;
    gap: 22px;
    padding: 30px 34px;
  }

  .module-grid--tree .search-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }

  .tree-card :deep(.page-block__body) {
    padding: 32px 24px;
  }

  .tree-search {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .tree-node__child {
    padding-left: 72px;
  }
}

.list-toolbar {
  justify-content: flex-start;
}

.special-stack--staff .module-grid--tree {
  gap: 22px;
}

.special-stack--staff .module-grid--tree .search-card :deep(.page-block__body) {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 24px;
}

.special-stack--staff .module-grid--tree .search-grid {
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 22px;
}

.special-stack--staff .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
}

.special-stack--staff .search-toolbar :deep(.el-button) {
  min-width: 108px;
}

.special-stack--staff .list-toolbar {
  margin-bottom: 28px;
}

.special-stack--staff .list-toolbar :deep(.el-button) {
  min-width: 118px;
}

.special-stack--staff .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f0f0;
  --el-table-border-color: #e1e1e1;
  min-width: 1180px;
  font-size: 20px;
}

.special-stack--staff .special-table :deep(.el-table__header th) {
  height: 70px;
  background: #f0f0f0 !important;
  color: #0e0e0e;
  font-size: 21px;
  font-weight: 800;
}

.special-stack--staff .special-table :deep(.el-table__body td) {
  height: 76px;
  color: #242424;
  font-size: 20px;
}

.special-stack--staff .special-table :deep(.el-table__empty-block) {
  min-height: 168px;
}

.special-stack--staff .special-table :deep(.el-table__empty-text) {
  color: #9a9a9a;
  font-size: 18px;
}

.special-stack--staff .special-table :deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.72);
}

.special-stack--staff .special-table :deep(.el-button.is-link) {
  padding: 0 4px;
  color: #1f66ff;
  font-size: 18px;
}

.special-stack--staff .special-table :deep(.el-switch) {
  --el-switch-on-color: #05c46b;
  --el-switch-off-color: #d7d7d7;
}

.special-stack--staff .pagination-wrap {
  justify-content: flex-end;
}

.special-stack--organization .module-grid--tree {
  grid-template-columns: minmax(320px, 392px) minmax(0, 1fr);
  gap: 22px;
}

.special-stack--organization .tree-card {
  min-height: 710px;
}

.special-stack--organization .tree-search {
  padding-bottom: 30px;
}

.special-stack--organization .tree-node__label.active,
.special-stack--organization .tree-node__child.active {
  border-right: 4px solid #1f66ff;
  background: #e8eefc;
  color: #1f66ff;
}

.special-stack--organization .module-grid--tree .search-card :deep(.page-block__body) {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 42px;
  padding: 36px 42px;
}

.special-stack--organization .module-grid--tree .search-grid {
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 42px;
}

.special-stack--organization .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
}

.special-stack--organization .search-toolbar :deep(.el-button) {
  min-width: 132px;
  height: 56px;
  border-radius: 6px;
  font-size: 20px;
}

.special-stack--organization .list-toolbar {
  margin-bottom: 28px;
}

.special-stack--organization .list-toolbar :deep(.el-button) {
  min-width: 138px;
  height: 58px;
  border-radius: 6px;
  font-size: 22px;
}

.special-stack--organization .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f0f0;
  --el-table-border-color: #d9d9d9;
  min-width: 900px;
  font-size: 20px;
}

.special-stack--organization .special-table :deep(.el-table__header th) {
  height: 72px;
  background: #f0f0f0 !important;
  color: #090909;
  font-size: 22px;
  font-weight: 800;
}

.special-stack--organization .special-table :deep(.el-table__body td) {
  height: 72px;
  color: #242424;
  font-size: 21px;
}

.special-stack--organization .special-table :deep(.el-switch) {
  --el-switch-on-color: #05c46b;
  --el-switch-off-color: #d9d9d9;
}

.special-stack--organization .special-table :deep(.el-button.is-link) {
  color: #1f66ff;
  font-size: 20px;
}

.special-stack--organization .pagination-wrap {
  justify-content: flex-end;
}

.special-stack--organization .hero-grid,
.special-stack--organization .workflow-strip,
.special-stack--organization .overview-panels,
.special-stack--organization .result-bar,
.special-stack--organization .filter-tags {
  display: none !important;
}

.special-stack--organization .module-main {
  gap: 12px;
}

.special-stack--organization .table-card :deep(.page-block__body) {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 360px);
  padding: 34px 24px 28px;
}

.special-stack--organization .special-table {
  flex: 1;
}

.special-stack--roles .search-card :deep(.page-block__body) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 42px;
  padding: 36px 42px;
}

.special-stack--roles .hero-grid,
.special-stack--roles .workflow-strip,
.special-stack--roles .overview-panels,
.special-stack--roles .result-bar,
.special-stack--roles .filter-tags {
  display: none !important;
}

.special-stack--roles .module-main {
  gap: 10px;
}

.special-stack--roles .search-grid {
  grid-template-columns: minmax(220px, 1fr);
  margin-bottom: 0;
}

.special-stack--roles .search-toolbar {
  margin-bottom: 0;
}

.special-stack--roles .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
}

.special-stack--roles .search-toolbar :deep(.el-button) {
  min-width: 132px;
  height: 56px;
  border-radius: 6px;
  font-size: 20px;
}

.special-stack--roles .table-card :deep(.page-block__body) {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 355px);
  padding: 36px 24px 42px;
}

.special-stack--roles .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f0f0;
  --el-table-border-color: #d9d9d9;
  font-size: 20px;
}

.special-stack--roles .special-table :deep(.el-table__header th) {
  height: 72px;
  background: #f0f0f0 !important;
  color: #090909;
  font-size: 22px;
  font-weight: 800;
}

.special-stack--roles .special-table :deep(.cell) {
  padding: 0 18px;
}

.special-stack--roles .special-table :deep(.el-table__body td) {
  height: 72px;
  color: #242424;
  font-size: 21px;
}

.special-stack--roles .special-table :deep(.el-table__empty-block) {
  min-height: 330px;
}

.special-stack--roles .special-table :deep(.el-table__empty-text) {
  color: #a5a5a5;
  font-size: 18px;
}

.special-stack--roles .pagination-wrap {
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 36px;
}

.special-stack--billingPerformance .search-card :deep(.page-block__body),
.special-stack--deliveryPerformance .search-card :deep(.page-block__body) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 42px;
  padding: 36px 42px;
}

.special-stack--billingPerformance .search-grid,
.special-stack--deliveryPerformance .search-grid {
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  margin-bottom: 0;
}

.special-stack--billingPerformance .search-toolbar,
.special-stack--deliveryPerformance .search-toolbar {
  margin-bottom: 0;
}

.special-stack--billingPerformance .search-toolbar .toolbar__right,
.special-stack--deliveryPerformance .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
}

.special-stack--billingPerformance .search-toolbar :deep(.el-button),
.special-stack--deliveryPerformance .search-toolbar :deep(.el-button) {
  min-width: 132px;
  height: 56px;
  border-radius: 6px;
  font-size: 20px;
}

.special-stack--billingPerformance .table-card :deep(.page-block__body),
.special-stack--deliveryPerformance .table-card :deep(.page-block__body) {
  position: relative;
  min-height: 610px;
  padding: 36px 42px 42px;
}

.special-stack--billingPerformance .list-toolbar,
.special-stack--deliveryPerformance .list-toolbar {
  margin-bottom: 24px;
}

.special-stack--billingPerformance .list-toolbar :deep(.el-button),
.special-stack--deliveryPerformance .list-toolbar :deep(.el-button) {
  min-width: 116px;
  height: 56px;
  border: 0;
  border-radius: 6px;
  background: #f5f6f8;
  color: #7d8794;
  font-size: 20px;
}

.special-stack--billingPerformance .summary-band,
.special-stack--deliveryPerformance .summary-band {
  position: absolute;
  top: 44px;
  right: 42px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent !important;
  color: #202124;
  font-size: 20px;
  font-weight: 800;
  text-align: right;
}

.special-stack--billingPerformance .summary-band::first-letter,
.special-stack--deliveryPerformance .summary-band::first-letter {
  color: inherit;
}

.special-stack--billingPerformance .special-table :deep(.el-table),
.special-stack--deliveryPerformance .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f0f0;
  --el-table-border-color: #d9d9d9;
  font-size: 20px;
}

.special-stack--billingPerformance .special-table :deep(.el-table__header th),
.special-stack--deliveryPerformance .special-table :deep(.el-table__header th) {
  height: 72px;
  background: #f0f0f0 !important;
  color: #090909;
  font-size: 22px;
  font-weight: 800;
}

.special-stack--billingPerformance .special-table :deep(.el-table__header .cell),
.special-stack--deliveryPerformance .special-table :deep(.el-table__header .cell) {
  white-space: normal;
  line-height: 1.25;
}

.special-stack--billingPerformance .special-table :deep(.el-table__body td),
.special-stack--deliveryPerformance .special-table :deep(.el-table__body td) {
  height: 72px;
  color: #242424;
  font-size: 21px;
}

.special-stack--billingPerformance .special-table :deep(.el-table__header th:nth-child(3)),
.special-stack--billingPerformance .special-table :deep(.el-table__body td:nth-child(3)) {
  background: #d6e4ff !important;
  text-align: center;
}

.special-stack--billingPerformance .special-table :deep(.el-table__header th:nth-child(4)),
.special-stack--billingPerformance .special-table :deep(.el-table__body td:nth-child(4)) {
  background: #ffe9c7 !important;
  text-align: center;
}

.special-stack--deliveryPerformance .special-table :deep(.el-table__header th:nth-child(4)),
.special-stack--deliveryPerformance .special-table :deep(.el-table__body td:nth-child(4)) {
  background: #d6e4ff !important;
  text-align: center;
}

.special-stack--billingPerformance .pagination-wrap,
.special-stack--deliveryPerformance .pagination-wrap {
  justify-content: flex-end;
}

.special-stack--receipts .search-card :deep(.page-block__body) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 42px;
  padding: 36px 42px;
}

.special-stack--receipts .search-grid {
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 28px 42px;
  margin-bottom: 0;
}

.special-stack--receipts .search-toolbar {
  margin-bottom: 0;
}

.special-stack--receipts .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
}

.special-stack--receipts .search-toolbar :deep(.el-button) {
  min-width: 132px;
  height: 56px;
  border-radius: 6px;
  font-size: 20px;
}

.special-stack--receipts .table-card :deep(.page-block__body) {
  position: relative;
  min-height: 650px;
  padding: 36px 42px 42px;
}

.special-stack--receipts .list-toolbar {
  margin-bottom: 28px;
}

.special-stack--receipts .list-toolbar :deep(.el-button) {
  min-width: 138px;
  height: 58px;
  border-radius: 6px;
  font-size: 22px;
}

.special-stack--receipts .summary-band {
  position: absolute;
  top: 48px;
  right: 42px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent !important;
  color: #202124;
  font-size: 20px;
  font-weight: 800;
  text-align: right;
}

.special-stack--receipts .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f0f0;
  --el-table-border-color: #d9d9d9;
  min-width: 1220px;
  font-size: 20px;
}

.special-stack--receipts .special-table :deep(.el-table__header th) {
  height: 72px;
  background: #f0f0f0 !important;
  color: #090909;
  font-size: 21px;
  font-weight: 800;
}

.special-stack--receipts .special-table :deep(.el-table__body td) {
  height: 72px;
  color: #242424;
  font-size: 20px;
}

.special-stack--receipts .special-table :deep(.el-button.is-link) {
  color: #1f66ff;
  font-size: 18px;
}

.special-stack--receipts .pagination-wrap {
  justify-content: flex-end;
}

.receipt-form-dialog :deep(.el-dialog__body),
.receipt-detail-dialog :deep(.el-dialog__body) {
  background: #f5f5f5;
  padding: 24px 28px;
  max-height: 72vh;
  overflow: auto;
}

.receipt-form-stack {
  display: grid;
  gap: 14px;
}

.receipt-form-section {
  padding: 26px;
  background: #fff;
}

.receipt-form-section h3 {
  margin: 0 0 20px;
  font-size: 20px;
  color: #111;
}

.receipt-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 72px;
}

.receipt-form-item {
  display: grid;
  gap: 8px;
  color: #34415a;
  font-size: 15px;
  font-weight: 700;
}

.receipt-form-item--full {
  grid-column: 1 / -1;
}

.receipt-form-item p {
  margin: 0;
}

.receipt-form-item :deep(.el-input__wrapper),
.receipt-form-item :deep(.el-select__wrapper),
.receipt-form-item :deep(.el-textarea__inner) {
  min-height: 44px;
  border: 0;
  box-shadow: none;
  background: #f3f4f6;
  border-radius: 0;
}

.receipt-file-input {
  width: fit-content;
}

.receipt-form-table,
.receipt-detail-dialog :deep(.el-table) {
  margin-top: 16px;
}

.receipt-form-table :deep(.el-table__header th),
.receipt-detail-dialog :deep(.el-table__header th) {
  height: 52px;
  background: #f0f1f3;
  color: #111;
  font-weight: 700;
}

.receipt-input-cell {
  background: #e8edff;
}

.receipt-input-cell :deep(.el-input-number) {
  width: 112px;
}

.receipt-dialog-total {
  margin-right: auto;
  color: #222;
  font-size: 18px;
}

.receipt-dialog-total span {
  color: #ff8500;
  margin-right: 18px;
}

:deep(.receipt-order-dialog .el-dialog__body) {
  padding: 0 16px 0;
}

:deep(.receipt-order-dialog .el-dialog__footer) {
  padding: 20px 16px 24px;
}

.receipt-order-search {
  display: grid;
  grid-template-columns: 240px 240px 1fr;
  align-items: end;
  gap: 40px;
  padding: 22px 0 18px;
  border-top: 1px solid #eceef2;
}

.receipt-order-search label {
  display: grid;
  gap: 8px;
  color: #8a8f99;
  font-size: 14px;
  font-weight: 600;
}

.receipt-order-search :deep(.el-input__wrapper) {
  min-height: 44px;
  border: 0;
  box-shadow: none;
  background: #f5f6f8;
  border-radius: 0;
}

.receipt-order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.receipt-order-actions :deep(.el-button) {
  min-width: 92px;
  height: 42px;
  border-radius: 4px;
  font-size: 15px;
}

.receipt-order-table {
  min-height: 430px;
}

.receipt-order-table :deep(.el-table__header th) {
  height: 54px;
  background: #f0f1f3 !important;
  color: #111;
  font-size: 15px;
  font-weight: 800;
}

.receipt-order-table :deep(.el-table__body td) {
  height: 56px;
  color: #111;
  font-size: 14px;
}

.receipt-order-edit-cell {
  background: #e8edff;
}

.receipt-order-edit-cell :deep(.el-input-number) {
  width: 108px;
}

.receipt-order-edit-cell :deep(.el-input__wrapper) {
  border: 0;
  box-shadow: none;
  background: #f8f9fc;
  border-radius: 4px;
}

.reimbursement-form-dialog :deep(.el-dialog__body),
.reimbursement-detail-dialog :deep(.el-dialog__body) {
  background: #f5f5f5;
  padding: 24px 28px;
  max-height: 72vh;
  overflow: auto;
}

.reimbursement-form-stack {
  display: grid;
  gap: 14px;
}

.reimbursement-form-section {
  min-height: 560px;
  padding: 26px;
  background: #fff;
}

.reimbursement-form-section h3 {
  margin: 0 0 28px;
  font-size: 22px;
  color: #111;
}

.reimbursement-form-grid {
  display: grid;
  grid-template-columns: 360px 360px;
  gap: 20px 170px;
}

.reimbursement-form-item {
  position: relative;
  display: grid;
  gap: 8px;
  color: #34415a;
  font-size: 18px;
  font-weight: 800;
}

.reimbursement-form-item--full {
  grid-column: 1 / -1;
  max-width: 910px;
}

.reimbursement-form-item p {
  margin: 0;
}

.reimbursement-form-item :deep(.el-input),
.reimbursement-form-item :deep(.el-select),
.reimbursement-form-item :deep(.el-date-editor),
.reimbursement-form-item :deep(.el-input-number) {
  width: 100%;
}

.reimbursement-form-item :deep(.el-input__wrapper),
.reimbursement-form-item :deep(.el-select__wrapper),
.reimbursement-form-item :deep(.el-textarea__inner) {
  min-height: 44px;
  border: 0;
  box-shadow: none;
  background: #f3f4f6;
  border-radius: 0;
  font-size: 16px;
}

.reimbursement-form-item :deep(.el-input-number .el-input__wrapper) {
  padding-right: 34px;
}

.reimbursement-input-suffix {
  position: absolute;
  right: 12px;
  bottom: 12px;
  color: #34415a;
  font-size: 16px;
  font-weight: 500;
  pointer-events: none;
}

.reimbursement-file-input {
  width: fit-content;
  font-size: 15px;
}

.special-stack--manualRecords .search-card :deep(.page-block__body) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 42px;
  padding: 36px 42px;
}

.special-stack--manualRecords .search-grid {
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 42px;
  margin-bottom: 0;
}

.special-stack--manualRecords .search-toolbar {
  margin-bottom: 0;
}

.special-stack--manualRecords .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
}

.special-stack--manualRecords .search-toolbar :deep(.el-button) {
  min-width: 132px;
  height: 56px;
  border-radius: 6px;
  font-size: 20px;
}

.special-stack--manualRecords .table-card :deep(.page-block__body) {
  min-height: 650px;
  padding: 36px 42px 42px;
}

.special-stack--manualRecords .list-toolbar {
  margin-bottom: 28px;
}

.special-stack--manualRecords .list-toolbar :deep(.el-button) {
  min-width: 138px;
  height: 58px;
  border-radius: 6px;
  font-size: 22px;
}

.special-stack--manualRecords .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f0f0;
  --el-table-border-color: #d9d9d9;
  min-width: 1020px;
  font-size: 20px;
}

.special-stack--manualRecords .special-table :deep(.el-table__header th) {
  height: 72px;
  background: #f0f0f0 !important;
  color: #090909;
  font-size: 22px;
  font-weight: 800;
}

.special-stack--manualRecords .special-table :deep(.el-table__body td) {
  height: 72px;
  color: #242424;
  font-size: 21px;
}

.special-stack--manualRecords .special-table :deep(.el-button.is-link) {
  color: #1f66ff;
  font-size: 18px;
}

.special-stack--manualRecords .pagination-wrap {
  justify-content: flex-end;
}

.special-stack--accounts .search-card :deep(.page-block__body),
.special-stack--reimbursements .search-card :deep(.page-block__body),
.special-stack--deliveryNotes .search-card :deep(.page-block__body),
.special-stack--materials .search-card :deep(.page-block__body),
.special-stack--materialStock .search-card :deep(.page-block__body),
.special-stack--materialDetails .search-card :deep(.page-block__body),
.special-stack--fundDetails .search-card :deep(.page-block__body) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 42px;
  padding: 56px 42px 66px;
}

.special-stack--accounts .search-grid,
.special-stack--reimbursements .search-grid,
.special-stack--deliveryNotes .search-grid,
.special-stack--materials .search-grid,
.special-stack--materialStock .search-grid,
.special-stack--materialDetails .search-grid,
.special-stack--fundDetails .search-grid {
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 42px;
  margin-bottom: 0;
}

.special-stack--accounts .search-toolbar,
.special-stack--reimbursements .search-toolbar,
.special-stack--deliveryNotes .search-toolbar,
.special-stack--materials .search-toolbar,
.special-stack--materialStock .search-toolbar,
.special-stack--materialDetails .search-toolbar,
.special-stack--fundDetails .search-toolbar {
  margin-bottom: 0;
}

.special-stack--accounts .search-toolbar .toolbar__right,
.special-stack--reimbursements .search-toolbar .toolbar__right,
.special-stack--deliveryNotes .search-toolbar .toolbar__right,
.special-stack--materials .search-toolbar .toolbar__right,
.special-stack--materialStock .search-toolbar .toolbar__right,
.special-stack--materialDetails .search-toolbar .toolbar__right,
.special-stack--fundDetails .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
}

.special-stack--accounts .search-card :deep(.el-input__wrapper),
.special-stack--accounts .search-card :deep(.el-select__wrapper),
.special-stack--reimbursements .search-card :deep(.el-input__wrapper),
.special-stack--reimbursements .search-card :deep(.el-select__wrapper),
.special-stack--deliveryNotes .search-card :deep(.el-input__wrapper),
.special-stack--deliveryNotes .search-card :deep(.el-select__wrapper),
.special-stack--materials .search-card :deep(.el-input__wrapper),
.special-stack--materials .search-card :deep(.el-select__wrapper),
.special-stack--materialStock .search-card :deep(.el-input__wrapper),
.special-stack--materialStock .search-card :deep(.el-select__wrapper),
.special-stack--materialDetails .search-card :deep(.el-input__wrapper),
.special-stack--materialDetails .search-card :deep(.el-select__wrapper),
.special-stack--fundDetails .search-card :deep(.el-input__wrapper),
.special-stack--fundDetails .search-card :deep(.el-select__wrapper) {
  min-height: 56px;
  border-radius: 6px;
  background: #f5f6f8;
  box-shadow: none;
}

.special-stack--accounts .search-card :deep(.el-input__inner),
.special-stack--accounts .search-card :deep(.el-select__placeholder),
.special-stack--reimbursements .search-card :deep(.el-input__inner),
.special-stack--reimbursements .search-card :deep(.el-select__placeholder),
.special-stack--deliveryNotes .search-card :deep(.el-input__inner),
.special-stack--deliveryNotes .search-card :deep(.el-select__placeholder),
.special-stack--materials .search-card :deep(.el-input__inner),
.special-stack--materials .search-card :deep(.el-select__placeholder),
.special-stack--materialStock .search-card :deep(.el-input__inner),
.special-stack--materialStock .search-card :deep(.el-select__placeholder),
.special-stack--materialDetails .search-card :deep(.el-input__inner),
.special-stack--materialDetails .search-card :deep(.el-select__placeholder),
.special-stack--fundDetails .search-card :deep(.el-input__inner),
.special-stack--fundDetails .search-card :deep(.el-select__placeholder) {
  color: #b9b9b9;
  font-size: 20px;
}

.special-stack--accounts .search-toolbar :deep(.el-button),
.special-stack--reimbursements .search-toolbar :deep(.el-button),
.special-stack--deliveryNotes .search-toolbar :deep(.el-button),
.special-stack--materials .search-toolbar :deep(.el-button),
.special-stack--materialStock .search-toolbar :deep(.el-button),
.special-stack--materialDetails .search-toolbar :deep(.el-button),
.special-stack--fundDetails .search-toolbar :deep(.el-button) {
  min-width: 132px;
  height: 56px;
  border-radius: 6px;
  font-size: 20px;
}

.special-stack--accounts .search-card :deep(.page-block__body) {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  min-height: 252px;
  padding: 40px 42px 38px;
}

.special-stack--accounts .search-grid {
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 42px;
  padding-right: 0;
}

.special-stack--accounts .search-toolbar {
  position: absolute;
  right: 42px;
  bottom: 38px;
  margin: 0;
}

.special-stack--accounts .search-toolbar .toolbar__right {
  display: flex;
  flex-wrap: nowrap;
  gap: 18px;
}

.special-stack--accounts .table-card :deep(.page-block__body),
.special-stack--reimbursements .table-card :deep(.page-block__body),
.special-stack--deliveryNotes .table-card :deep(.page-block__body),
.special-stack--materials .table-card :deep(.page-block__body),
.special-stack--materialStock .table-card :deep(.page-block__body),
.special-stack--materialDetails .table-card :deep(.page-block__body),
.special-stack--fundDetails .table-card :deep(.page-block__body) {
  position: relative;
  min-height: 650px;
  padding: 42px 42px;
}

.special-stack--accounts .list-toolbar,
.special-stack--reimbursements .list-toolbar,
.special-stack--deliveryNotes .list-toolbar,
.special-stack--materials .list-toolbar,
.special-stack--materialStock .list-toolbar,
.special-stack--materialDetails .list-toolbar,
.special-stack--fundDetails .list-toolbar {
  margin-bottom: 40px;
}

.special-stack--accounts .list-toolbar :deep(.el-button),
.special-stack--reimbursements .list-toolbar :deep(.el-button),
.special-stack--deliveryNotes .list-toolbar :deep(.el-button),
.special-stack--materials .list-toolbar :deep(.el-button),
.special-stack--materialStock .list-toolbar :deep(.el-button),
.special-stack--materialDetails .list-toolbar :deep(.el-button),
.special-stack--fundDetails .list-toolbar :deep(.el-button) {
  min-width: 138px;
  height: 58px;
  border-radius: 6px;
  font-size: 22px;
}

.special-stack--accounts .summary-band,
.special-stack--reimbursements .summary-band,
.special-stack--deliveryNotes .summary-band,
.special-stack--materials .summary-band,
.special-stack--materialStock .summary-band,
.special-stack--materialDetails .summary-band,
.special-stack--fundDetails .summary-band {
  position: static !important;
  top: auto !important;
  right: auto !important;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin: 0 0 20px !important;
  padding: 0;
  border: 0;
  background: transparent !important;
  color: #202124;
  font-size: 20px;
  font-weight: 800;
  text-align: right;
}

.special-stack--accounts .summary-band + .special-table,
.special-stack--reimbursements .summary-band + .special-table,
.special-stack--deliveryNotes .summary-band + .special-table,
.special-stack--materials .summary-band + .special-table,
.special-stack--materialStock .summary-band + .special-table,
.special-stack--materialDetails .summary-band + .special-table,
.special-stack--fundDetails .summary-band + .special-table {
  margin-top: 12px;
}

.summary-band__highlight {
  color: #ff3365;
}

.special-stack--accounts .special-table :deep(.el-table),
.special-stack--reimbursements .special-table :deep(.el-table),
.special-stack--deliveryNotes .special-table :deep(.el-table),
.special-stack--materials .special-table :deep(.el-table),
.special-stack--materialStock .special-table :deep(.el-table),
.special-stack--materialDetails .special-table :deep(.el-table),
.special-stack--fundDetails .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f0f0;
  --el-table-border-color: #d9d9d9;
  min-width: 100%;
  font-size: 20px;
}

.special-stack--accounts .special-table :deep(.el-table__header th),
.special-stack--reimbursements .special-table :deep(.el-table__header th),
.special-stack--deliveryNotes .special-table :deep(.el-table__header th),
.special-stack--materials .special-table :deep(.el-table__header th),
.special-stack--materialStock .special-table :deep(.el-table__header th),
.special-stack--materialDetails .special-table :deep(.el-table__header th),
.special-stack--fundDetails .special-table :deep(.el-table__header th) {
  height: 72px;
  background: #f0f0f0 !important;
  color: #090909;
  font-size: 21px;
  font-weight: 800;
}

.special-stack--accounts .special-table :deep(.el-table__header .cell),
.special-stack--reimbursements .special-table :deep(.el-table__header .cell),
.special-stack--deliveryNotes .special-table :deep(.el-table__header .cell),
.special-stack--materials .special-table :deep(.el-table__header .cell),
.special-stack--materialStock .special-table :deep(.el-table__header .cell),
.special-stack--materialDetails .special-table :deep(.el-table__header .cell),
.special-stack--fundDetails .special-table :deep(.el-table__header .cell) {
  white-space: nowrap;
}

.special-stack--accounts .special-table :deep(.el-table__body td),
.special-stack--reimbursements .special-table :deep(.el-table__body td),
.special-stack--deliveryNotes .special-table :deep(.el-table__body td),
.special-stack--materials .special-table :deep(.el-table__body td),
.special-stack--materialStock .special-table :deep(.el-table__body td),
.special-stack--materialDetails .special-table :deep(.el-table__body td),
.special-stack--fundDetails .special-table :deep(.el-table__body td) {
  height: 72px;
  color: #242424;
  font-size: 20px;
}

.special-stack--accounts .special-table :deep(.el-button.is-link),
.special-stack--reimbursements .special-table :deep(.el-button.is-link),
.special-stack--deliveryNotes .special-table :deep(.el-button.is-link),
.special-stack--materials .special-table :deep(.el-button.is-link),
.special-stack--materialStock .special-table :deep(.el-button.is-link),
.special-stack--materialDetails .special-table :deep(.el-button.is-link),
.special-stack--fundDetails .special-table :deep(.el-button.is-link) {
  color: #1f66ff;
  font-size: 18px;
}

.plain-status {
  display: inline-block;
  min-width: 3em;
  font-weight: 500;
  white-space: nowrap;
}

.plain-status--orange {
  color: #ff9b18;
}

.plain-status--blue {
  color: #1f66ff;
}

.plain-status--green {
  color: #22c55e;
}

.plain-status--red {
  color: #ff3365;
}

.plain-status--muted {
  color: #9b9b9b;
}

.design-money {
  font-weight: 800;
  color: #0c0c0c;
  white-space: nowrap;
}

.design-long-text {
  display: inline-block;
  max-width: 100%;
  color: #333333;
}

.special-stack--accounts .pagination-wrap,
.special-stack--reimbursements .pagination-wrap,
.special-stack--deliveryNotes .pagination-wrap,
.special-stack--materials .pagination-wrap,
.special-stack--materialStock .pagination-wrap,
.special-stack--materialDetails .pagination-wrap,
.special-stack--fundDetails .pagination-wrap {
  justify-content: flex-end;
}

.special-stack--receivable .search-card :deep(.page-block__body) {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
  min-height: 240px;
  padding: 30px 20px 28px;
}

.receivable-tabs {
  display: inline-flex;
  width: 254px;
  height: 42px;
  overflow: hidden;
  border: 1px solid #1f66ff;
  border-radius: 4px;
}

.receivable-tabs button {
  flex: 1;
  border: 0;
  background: #fff;
  color: #1f66ff;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
}

.receivable-tabs button.active {
  background: #1f66ff;
  color: #fff;
}

.special-stack--receivable .search-grid {
  grid-template-columns: repeat(4, 268px);
  justify-content: space-between;
  gap: 18px 28px;
  margin-top: 18px;
  margin-bottom: 0;
}

.special-stack--receivableUnits .search-grid {
  grid-template-columns: repeat(3, 268px);
  justify-content: start;
  gap: 18px 112px;
}

.special-stack--receivable .search-card :deep(.el-input__wrapper),
.special-stack--receivable .search-card :deep(.el-select__wrapper) {
  min-height: 40px;
  border-radius: 4px;
  background: #f5f6f8;
  box-shadow: none;
}

.special-stack--receivable .search-card :deep(.el-input__inner),
.special-stack--receivable .search-card :deep(.el-select__placeholder) {
  color: #b9b9b9;
  font-size: 16px;
}

.special-stack--receivable .search-toolbar {
  position: absolute;
  right: 96px;
  bottom: 20px;
}

.special-stack--receivable .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
}

.special-stack--receivable .search-toolbar :deep(.el-button) {
  min-width: 102px;
  height: 42px;
  border-radius: 4px;
  font-size: 16px;
}

.special-stack--receivable .table-card :deep(.page-block__body) {
  position: relative;
  min-height: 650px;
  padding: 30px 20px 28px;
}

.special-stack--receivable .list-toolbar {
  margin-bottom: 18px;
}

.special-stack--receivable .list-toolbar :deep(.el-button) {
  min-width: 100px;
  height: 40px;
  border-radius: 4px;
  font-size: 16px;
}

.special-stack--receivable .summary-band {
  position: static;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin: 0 0 14px;
  padding: 0;
  border: 0;
  background: transparent !important;
  color: #202124;
  font-size: 16px;
  font-weight: 800;
  text-align: right;
}

.special-stack--receivable .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f0f0;
  --el-table-border-color: #d9d9d9;
  min-width: 980px;
  font-size: 16px;
}

.special-stack--receivable .special-table :deep(.el-table__header th) {
  height: 60px;
  background: #f0f0f0 !important;
  color: #090909;
  font-size: 16px;
  font-weight: 800;
}

.special-stack--receivable .special-table :deep(.el-table__body td) {
  height: 60px;
  color: #242424;
  font-size: 16px;
}

.special-stack--receivable .special-table :deep(.cell) {
  line-height: 1.35;
}

.special-stack--receivable .special-table :deep(.el-button.is-link) {
  color: #1f66ff;
  font-size: 18px;
}

.special-stack--receivable .pagination-wrap {
  justify-content: flex-end;
}

.special-stack--productCrafts .search-card :deep(.page-block__body) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 38px;
  min-height: 186px;
  padding: 26px 20px 30px;
}

.special-stack--productCrafts .search-grid {
  grid-template-columns: repeat(4, minmax(170px, 1fr));
  gap: 22px 72px;
  margin-bottom: 0;
}

.special-stack--productCrafts .search-item span {
  color: #8d8d8d;
  font-size: 16px;
  font-weight: 500;
}

.special-stack--productCrafts .search-card :deep(.el-input__wrapper),
.special-stack--productCrafts .search-card :deep(.el-select__wrapper) {
  min-height: 42px;
  border-radius: 4px;
  background: #f5f6f8;
  box-shadow: none;
}

.special-stack--productCrafts .search-card :deep(.el-input__inner),
.special-stack--productCrafts .search-card :deep(.el-select__placeholder) {
  color: #b8b8b8;
  font-size: 18px;
}

.special-stack--productCrafts .search-toolbar {
  align-self: end;
  justify-content: flex-end;
  min-width: 260px;
  margin: 0 74px 0 0;
}

.special-stack--productCrafts .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
}

.special-stack--productCrafts .search-toolbar :deep(.el-button) {
  min-width: 104px;
  height: 42px;
  border-radius: 4px;
  font-size: 18px;
}

.special-stack--productCrafts .table-card :deep(.page-block__body) {
  position: relative;
  min-height: 646px;
  padding: 30px 20px 32px;
}

.special-stack--productCrafts .list-toolbar {
  margin-bottom: 22px;
}

.special-stack--productCrafts .list-toolbar :deep(.el-button) {
  min-width: 102px;
  height: 42px;
  border: 0;
  border-radius: 4px;
  background: #f5f6f8;
  color: #222;
  font-size: 17px;
}

.special-stack--productCrafts .summary-band {
  position: absolute;
  top: 44px;
  right: 20px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent !important;
  color: #222;
  font-size: 17px;
  font-weight: 800;
}

.special-stack--productCrafts .summary-band__highlight {
  color: #ff3355;
}

.special-stack--productCrafts .filter-tags {
  margin-top: -8px;
}

.special-stack--productCrafts .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f1f3;
  --el-table-border-color: #d9d9d9;
  min-width: 1260px;
  font-size: 18px;
}

.special-stack--productCrafts .special-table :deep(.el-table__header th) {
  height: 64px;
  background: #f0f1f3 !important;
  color: #111;
  font-size: 18px;
  font-weight: 800;
}

.special-stack--productCrafts .special-table :deep(.el-table__body td) {
  height: 62px;
  color: #111;
  font-size: 18px;
}

.special-stack--productCrafts .special-table :deep(.cell) {
  line-height: 1.45;
}

.special-stack--productCrafts .special-table :deep(.el-button.is-link) {
  color: #1f66ff;
  font-size: 18px;
}

.special-stack--productCrafts .pagination-wrap {
  justify-content: flex-end;
  margin-top: 170px;
}

.product-craft-detail {
  display: grid;
  gap: 10px;
  padding: 0;
  background: #f5f5f5;
}

.product-craft-status {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  border-radius: 4px;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
}

.product-craft-status--pending {
  background: #ff2f5f;
}

.product-craft-status--done {
  background: #20c653;
}

.product-craft-detail-section {
  padding: 34px 20px 36px;
  border-radius: 4px;
  background: #fff;
}

.product-craft-detail-section h3 {
  margin: 0 0 26px;
  color: #111;
  font-size: 23px;
  font-weight: 800;
}

.product-craft-detail-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f1f3;
  --el-table-border-color: #d9d9d9;
  font-size: 18px;
}

.product-craft-detail-table :deep(.el-table__header th) {
  height: 64px;
  background: #f0f1f3 !important;
  color: #111;
  font-size: 18px;
  font-weight: 800;
}

.product-craft-detail-table :deep(.el-table__body td) {
  height: 62px;
  color: #111;
  font-size: 18px;
}

.product-craft-detail-table :deep(.cell) {
  line-height: 1.45;
}

.product-craft-order-section {
  padding-bottom: 30px;
}

.product-craft-order-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr);
  gap: 20px 74px;
  max-width: 1120px;
}

.product-craft-order-grid div {
  display: flex;
  align-items: flex-start;
  min-height: 20px;
  color: #111;
  font-size: 17px;
}

.product-craft-order-grid span {
  min-width: 96px;
  color: #909090;
  font-weight: 800;
}

.product-craft-order-grid strong {
  color: #111;
  font-weight: 500;
}

.special-stack--outsourceIncoming .search-card :deep(.page-block__body),
.special-stack--outsourceOutgoing .search-card :deep(.page-block__body) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 42px;
  padding: 28px 42px 36px;
}

.outsource-tabs {
  grid-column: 1 / -1;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  overflow: hidden;
  border: 2px solid #1f66ff;
  border-radius: 6px;
}

.outsource-tabs button {
  min-width: 144px;
  height: 48px;
  border: 0;
  background: #ffffff;
  color: #1f66ff;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
}

.outsource-tabs button.active {
  background: #1f66ff;
  color: #ffffff;
}

.special-stack--outsourceIncoming .search-grid,
.special-stack--outsourceOutgoing .search-grid {
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 28px 42px;
  margin-bottom: 0;
}

.special-stack--outsourceIncoming .search-toolbar,
.special-stack--outsourceOutgoing .search-toolbar {
  justify-content: flex-end;
  margin-bottom: 0;
  width: 100%;
}

.special-stack--outsourceIncoming .search-toolbar .toolbar__right,
.special-stack--outsourceOutgoing .search-toolbar .toolbar__right {
  flex-wrap: nowrap;
  margin-left: auto;
}

.special-stack--outsourceIncoming .search-toolbar :deep(.el-button),
.special-stack--outsourceOutgoing .search-toolbar :deep(.el-button) {
  min-width: 132px;
  height: 56px;
  border-radius: 6px;
  font-size: 20px;
}

.special-stack--outsourceIncoming .search-card :deep(.el-input__wrapper),
.special-stack--outsourceIncoming .search-card :deep(.el-select__wrapper),
.special-stack--outsourceOutgoing .search-card :deep(.el-input__wrapper),
.special-stack--outsourceOutgoing .search-card :deep(.el-select__wrapper) {
  min-height: 56px;
  border-radius: 6px;
  background: #f5f6f8;
  box-shadow: none;
}

.special-stack--outsourceIncoming .search-card :deep(.el-input__inner),
.special-stack--outsourceIncoming .search-card :deep(.el-select__placeholder),
.special-stack--outsourceOutgoing .search-card :deep(.el-input__inner),
.special-stack--outsourceOutgoing .search-card :deep(.el-select__placeholder) {
  color: #b9b9b9;
  font-size: 20px;
}

.special-stack--outsourceIncoming .table-card :deep(.page-block__body),
.special-stack--outsourceOutgoing .table-card :deep(.page-block__body) {
  min-height: 650px;
  padding: 36px 42px 42px;
}

.special-stack--outsourceIncoming .result-bar,
.special-stack--outsourceOutgoing .result-bar {
  display: none;
}

.special-stack--outsourceIncoming .special-table :deep(.el-table),
.special-stack--outsourceOutgoing .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f0f0;
  --el-table-border-color: #d9d9d9;
  min-width: 1240px;
  font-size: 20px;
}

.special-stack--outsourceIncoming .special-table :deep(.el-table__header th),
.special-stack--outsourceOutgoing .special-table :deep(.el-table__header th) {
  height: 72px;
  background: #f0f0f0 !important;
  color: #090909;
  font-size: 21px;
  font-weight: 800;
}

.special-stack--outsourceIncoming .special-table :deep(.el-table__header .cell),
.special-stack--outsourceOutgoing .special-table :deep(.el-table__header .cell) {
  white-space: nowrap;
}

.special-stack--outsourceIncoming .special-table :deep(.el-table__body td),
.special-stack--outsourceOutgoing .special-table :deep(.el-table__body td) {
  height: 72px;
  color: #242424;
  font-size: 20px;
}

.special-stack--outsourceIncoming .special-table :deep(.el-table__empty-block),
.special-stack--outsourceOutgoing .special-table :deep(.el-table__empty-block) {
  min-height: 520px;
}

.special-stack--outsourceIncoming .special-table :deep(.el-table__empty-text),
.special-stack--outsourceOutgoing .special-table :deep(.el-table__empty-text) {
  color: #a5a5a5;
  font-size: 18px;
}

.special-stack--outsourceIncoming .special-table :deep(.el-button.is-link),
.special-stack--outsourceOutgoing .special-table :deep(.el-button.is-link) {
  color: #1f66ff;
  font-size: 18px;
}

.outsource-status {
  display: inline-block;
  min-width: 3em;
  font-weight: 500;
  white-space: nowrap;
}

.outsource-status--orange {
  color: #ff9b18;
}

.outsource-status--blue {
  color: #1f66ff;
}

.outsource-status--muted {
  color: #9b9b9b;
}

.outsource-money {
  font-weight: 800;
  color: #0c0c0c;
  white-space: nowrap;
}

.outsource-product {
  display: inline-block;
  max-width: 100%;
  color: #333333;
}

.outsource-detail {
  display: grid;
  gap: 10px;
  padding: 0;
  background: #f5f5f5;
}

.outsource-detail-status,
.delivery-detail-status {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  border-radius: 4px;
  color: #fff !important;
  font-size: 18px;
  font-weight: 800;
}

.outsource-detail-status.plain-status--red,
.delivery-detail-status.plain-status--red {
  background: #ff2f5f;
}

.outsource-detail-status.plain-status--orange,
.delivery-detail-status.plain-status--orange {
  background: #ff9700;
}

.outsource-detail-status.plain-status--blue,
.delivery-detail-status.plain-status--blue {
  background: #0f82ff;
}

.outsource-detail-status.plain-status--green,
.delivery-detail-status.plain-status--green {
  background: #22c55e;
}

.outsource-detail-status.plain-status--muted,
.delivery-detail-status.plain-status--muted {
  background: #c7c7c7;
  color: #111 !important;
}

.outsource-detail-section {
  padding: 34px 20px 36px;
  border-radius: 4px;
  background: #fff;
}

.outsource-detail-section h3 {
  margin: 0 0 26px;
  color: #111;
  font-size: 23px;
  font-weight: 800;
}

.outsource-order-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr);
  gap: 20px 74px;
  max-width: 1120px;
}

.outsource-order-grid div {
  display: flex;
  align-items: flex-start;
  min-height: 20px;
  color: #111;
  font-size: 17px;
}

.outsource-order-grid span {
  min-width: 96px;
  color: #909090;
  font-weight: 800;
}

.outsource-order-grid strong {
  color: #111;
  font-weight: 500;
}

.outsource-detail-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f1f3;
  --el-table-border-color: #d9d9d9;
  font-size: 18px;
}

.outsource-detail-table :deep(.el-table__header th) {
  height: 64px;
  background: #f0f1f3 !important;
  color: #111;
  font-size: 18px;
  font-weight: 800;
}

.outsource-detail-table :deep(.el-table__body td) {
  height: 62px;
  color: #111;
  font-size: 18px;
}

.outsource-detail-table :deep(.el-table__empty-block) {
  min-height: 96px;
}

.outsource-detail-table :deep(.el-table__empty-text) {
  color: #8a8f99;
  font-size: 16px;
}

.outsource-detail-table :deep(.el-button.is-link) {
  padding: 0;
  font-size: 18px;
  font-weight: 600;
}

.outsource-row-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 28px;
  padding: 12px 8px 8px;
}

.outsource-row-detail-item {
  display: flex;
  min-height: 36px;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.5;
  font-size: 17px;
}

.outsource-row-detail-item span {
  flex: 0 0 96px;
  color: #8a8f99;
  font-weight: 700;
}

.outsource-row-detail-item strong {
  min-width: 0;
  color: #111;
  font-weight: 500;
  word-break: break-all;
}

.outsource-transfer-search {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 16px;
  margin-bottom: 18px;
}

.outsource-transfer-list {
  display: grid;
  gap: 12px;
  width: 100%;
}

.outsource-transfer-item {
  display: block;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
  cursor: pointer;
}

.outsource-transfer-item :deep(.el-radio) {
  width: 100%;
  height: auto;
  align-items: flex-start;
}

.outsource-transfer-item :deep(.el-radio__label) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 16px;
  color: #111827;
}

.outsource-transfer-item span {
  font-size: 14px;
  color: #6b7280;
}

.outsource-timeline {
  display: grid;
  gap: 28px;
  padding-left: 26px;
  border-left: 2px solid #e0e4ec;
}

.outsource-timeline article {
  position: relative;
  width: min(430px, 100%);
  padding: 20px 22px;
  border: 1px solid #dce2ec;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(19, 38, 75, 0.05);
}

.outsource-timeline article::before {
  content: '';
  position: absolute;
  left: -35px;
  top: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d8dce5;
}

.outsource-timeline span {
  position: absolute;
  left: 0;
  top: -32px;
  color: #8a8f99;
  font-size: 16px;
}

.outsource-timeline strong {
  display: block;
  margin-bottom: 14px;
  font-size: 17px;
}

.outsource-timeline p {
  margin: 0;
  color: #8a8f99;
  font-size: 15px;
}

.outsource-detail-total {
  margin-right: auto;
  color: #111;
  font-size: 22px;
}

.outsource-detail-total::first-letter {
  color: #111;
}

.special-stack--outsourceIncoming .pagination-wrap,
.special-stack--outsourceOutgoing .pagination-wrap {
  justify-content: flex-end;
}

@media (max-width: 1320px) {
  .special-stack--staff .module-grid--tree {
    grid-template-columns: 272px minmax(0, 1fr);
    gap: 18px;
  }

  .special-stack--staff .tree-card :deep(.page-block__body) {
    padding: 30px 24px;
  }

  .special-stack--staff .tree-search {
    gap: 16px;
    padding-bottom: 26px;
  }

  .special-stack--staff .tree-search strong {
    font-size: 22px;
  }

  .special-stack--staff .tree-search :deep(.el-input) {
    --el-input-height: 56px;
    font-size: 20px;
  }

  .special-stack--staff .tree-list {
    padding-top: 34px;
  }

  .special-stack--staff .tree-node__label,
  .special-stack--staff .tree-node__child {
    min-height: 66px;
    font-size: 22px;
  }

  .special-stack--staff .tree-node__label {
    padding: 0 22px;
  }

  .special-stack--staff .tree-node__child {
    padding-left: 76px;
  }

  .special-stack--staff .module-grid--tree .search-card :deep(.page-block__body) {
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 30px 30px;
  }

  .special-stack--staff .module-grid--tree .search-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .special-stack--staff .search-item span {
    font-size: 16px;
  }

  .special-stack--staff .search-card :deep(.el-input),
  .special-stack--staff .search-card :deep(.el-select) {
    --el-input-height: 54px;
    font-size: 16px;
  }

  .special-stack--staff .search-toolbar .toolbar__right {
    justify-content: flex-start;
  }

  .special-stack--staff .special-table :deep(.el-table__header th) {
    font-size: 18px;
  }

  .special-stack--staff .special-table :deep(.el-table__body td) {
    font-size: 17px;
  }

  .special-stack--staff .pagination-wrap {
    justify-content: center;
  }

  .special-stack--staff .module-grid--tree .table-card :deep(.page-block__body) {
    padding: 32px 30px 40px;
  }

  .special-stack--organization .module-grid--tree {
    grid-template-columns: 230px minmax(0, 1fr);
    gap: 16px;
  }

  .special-stack--organization .tree-card :deep(.page-block__body) {
    padding: 30px 24px;
  }

  .special-stack--organization .tree-search {
    grid-template-columns: 1fr;
    gap: 16px;
    padding-bottom: 26px;
  }

  .special-stack--organization .tree-search strong {
    font-size: 22px;
  }

  .special-stack--organization .tree-search :deep(.el-input) {
    --el-input-height: 56px;
    font-size: 20px;
  }

  .special-stack--organization .tree-list {
    padding-top: 34px;
  }

  .special-stack--organization .tree-node__label,
  .special-stack--organization .tree-node__child {
    min-height: 66px;
    font-size: 22px;
  }

  .special-stack--organization .tree-node__label {
    padding: 0 22px;
  }

  .special-stack--organization .tree-node__child {
    padding-left: 64px;
  }

  .special-stack--organization .module-grid--tree .search-card :deep(.page-block__body) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 30px 30px;
  }

  .special-stack--organization .module-grid--tree .search-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .special-stack--organization .search-item span {
    font-size: 18px;
  }

  .special-stack--organization .search-card :deep(.el-input),
  .special-stack--organization .search-card :deep(.el-select) {
    --el-input-height: 56px;
    font-size: 18px;
  }

  .special-stack--organization .search-toolbar .toolbar__right {
    justify-content: flex-start;
  }

  .special-stack--organization .search-toolbar :deep(.el-button) {
    min-width: 118px;
  }

  .special-stack--organization .table-card :deep(.page-block__body) {
    padding: 30px 24px 34px;
  }

  .special-stack--organization .list-toolbar {
    margin-bottom: 24px;
  }

  .special-stack--organization .list-toolbar :deep(.el-button) {
    min-width: 136px;
    height: 58px;
  }

  .special-stack--organization .special-table :deep(.el-table) {
    min-width: 100%;
  }

  .special-stack--organization .special-table :deep(.el-table__header th) {
    font-size: 14px;
  }

  .special-stack--organization .special-table :deep(.el-table__body td) {
    font-size: 14px;
  }

  .special-stack--organization .special-table :deep(.cell) {
    padding: 0 4px;
    white-space: nowrap;
  }

  .special-stack--organization .special-table :deep(.el-table__empty-text) {
    white-space: nowrap;
  }

  .special-stack--organization .pagination-wrap {
    justify-content: center;
  }

  .special-stack--roles .search-card :deep(.page-block__body) {
    grid-template-columns: minmax(210px, 1fr) auto;
    gap: 16px;
    padding: 30px 24px;
  }

  .special-stack--roles .module-main {
    gap: 12px;
  }

  .special-stack--roles .search-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .special-stack--roles .search-card :deep(.el-input),
  .special-stack--roles .search-card :deep(.el-select) {
    --el-input-height: 48px;
    font-size: 16px;
  }

  .special-stack--roles .search-toolbar .toolbar__right {
    justify-content: flex-start;
  }

  .special-stack--roles .search-toolbar :deep(.el-button) {
    min-width: 104px;
    height: 48px;
    font-size: 18px;
  }

  .special-stack--roles .table-card :deep(.page-block__body) {
    padding: 30px 24px 34px;
  }

  .special-stack--roles .special-table :deep(.el-table__header th) {
    font-size: 20px;
  }

  .special-stack--roles .special-table :deep(.el-table__body td) {
    font-size: 19px;
  }

  .special-stack--roles .special-table :deep(.el-table__empty-block) {
    min-height: 290px;
  }

  .special-stack--roles .special-table :deep(.el-table__empty-text) {
    font-size: 16px;
  }

  .special-stack--roles .pagination-wrap {
    justify-content: flex-end;
  }

  .special-stack--billingPerformance .search-card :deep(.page-block__body),
  .special-stack--deliveryPerformance .search-card :deep(.page-block__body) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 14px;
    padding: 30px 24px;
  }

  .special-stack--billingPerformance .search-grid,
  .special-stack--deliveryPerformance .search-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .special-stack--billingPerformance .search-card :deep(.el-input),
  .special-stack--billingPerformance .search-card :deep(.el-select),
  .special-stack--deliveryPerformance .search-card :deep(.el-input),
  .special-stack--deliveryPerformance .search-card :deep(.el-select) {
    --el-input-height: 48px;
    font-size: 15px;
  }

  .special-stack--billingPerformance .search-toolbar .toolbar__right,
  .special-stack--deliveryPerformance .search-toolbar .toolbar__right {
    justify-content: flex-end;
  }

  .special-stack--billingPerformance .search-toolbar :deep(.el-button),
  .special-stack--deliveryPerformance .search-toolbar :deep(.el-button) {
    min-width: 88px;
    height: 48px;
    font-size: 16px;
  }

  .special-stack--billingPerformance .table-card :deep(.page-block__body),
  .special-stack--deliveryPerformance .table-card :deep(.page-block__body) {
    padding: 30px 24px 34px;
  }

  .special-stack--billingPerformance .summary-band,
  .special-stack--deliveryPerformance .summary-band {
    top: 44px;
    right: 24px;
    font-size: 18px;
  }

  .special-stack--billingPerformance .special-table :deep(.el-table__header th),
  .special-stack--deliveryPerformance .special-table :deep(.el-table__header th) {
    font-size: 20px;
  }

  .special-stack--billingPerformance .special-table :deep(.el-table__body td),
  .special-stack--deliveryPerformance .special-table :deep(.el-table__body td) {
    font-size: 19px;
  }

  .special-stack--billingPerformance .pagination-wrap,
  .special-stack--deliveryPerformance .pagination-wrap {
    justify-content: flex-end;
  }

  .special-stack--receipts .search-card :deep(.page-block__body) {
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 30px 24px;
  }

  .special-stack--receipts .search-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .special-stack--receipts .search-card :deep(.el-input),
  .special-stack--receipts .search-card :deep(.el-select) {
    --el-input-height: 50px;
    font-size: 16px;
  }

  .special-stack--receipts .search-toolbar .toolbar__right {
    justify-content: flex-end;
  }

  .special-stack--receipts .search-toolbar :deep(.el-button) {
    min-width: 108px;
    height: 50px;
    font-size: 18px;
  }

  .special-stack--receipts .table-card :deep(.page-block__body) {
    padding: 30px 24px 34px;
  }

  .special-stack--receipts .summary-band {
    top: 44px;
    right: 24px;
    font-size: 18px;
  }

  .special-stack--receipts .special-table :deep(.el-table__header th) {
    font-size: 18px;
  }

  .special-stack--receipts .special-table :deep(.el-table__body td) {
    font-size: 17px;
  }

  .special-stack--receipts .pagination-wrap {
    justify-content: flex-end;
  }

  .special-stack--manualRecords .search-card :deep(.page-block__body) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 14px;
    padding: 30px 24px;
  }

  .special-stack--manualRecords .search-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .special-stack--manualRecords .search-card :deep(.el-input),
  .special-stack--manualRecords .search-card :deep(.el-select) {
    --el-input-height: 48px;
    font-size: 15px;
  }

  .special-stack--manualRecords .search-toolbar .toolbar__right {
    justify-content: flex-end;
  }

  .special-stack--manualRecords .search-toolbar :deep(.el-button) {
    min-width: 88px;
    height: 48px;
    font-size: 16px;
  }

  .special-stack--manualRecords .table-card :deep(.page-block__body) {
    padding: 30px 24px 34px;
  }

  .special-stack--manualRecords .special-table :deep(.el-table__header th) {
    font-size: 18px;
  }

  .special-stack--manualRecords .special-table :deep(.el-table__body td) {
    font-size: 17px;
  }

  .special-stack--manualRecords .pagination-wrap {
    justify-content: flex-end;
  }

  .special-stack--accounts .search-card :deep(.page-block__body),
  .special-stack--reimbursements .search-card :deep(.page-block__body),
  .special-stack--deliveryNotes .search-card :deep(.page-block__body),
  .special-stack--materials .search-card :deep(.page-block__body),
  .special-stack--materialStock .search-card :deep(.page-block__body),
  .special-stack--materialDetails .search-card :deep(.page-block__body),
  .special-stack--fundDetails .search-card :deep(.page-block__body) {
    position: relative;
    grid-template-columns: 1fr;
    align-items: start;
    gap: 18px;
    min-height: 252px;
    padding: 40px 42px 38px;
  }

  .special-stack--accounts .search-grid,
  .special-stack--reimbursements .search-grid,
  .special-stack--deliveryNotes .search-grid,
  .special-stack--materials .search-grid,
  .special-stack--materialStock .search-grid,
  .special-stack--materialDetails .search-grid,
  .special-stack--fundDetails .search-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px 20px;
  }

  .special-stack--reimbursements .search-grid .search-item:nth-child(5),
  .special-stack--deliveryNotes .search-grid .search-item:nth-child(6),
  .special-stack--fundDetails .search-grid .search-item:nth-child(6) {
    grid-column: span 2;
    max-width: 300px;
  }

  .special-stack--accounts .search-card :deep(.el-input),
  .special-stack--accounts .search-card :deep(.el-select),
  .special-stack--reimbursements .search-card :deep(.el-input),
  .special-stack--reimbursements .search-card :deep(.el-select),
  .special-stack--deliveryNotes .search-card :deep(.el-input),
  .special-stack--deliveryNotes .search-card :deep(.el-select),
  .special-stack--materials .search-card :deep(.el-input),
  .special-stack--materials .search-card :deep(.el-select),
  .special-stack--materialStock .search-card :deep(.el-input),
  .special-stack--materialStock .search-card :deep(.el-select),
  .special-stack--materialDetails .search-card :deep(.el-input),
  .special-stack--materialDetails .search-card :deep(.el-select),
  .special-stack--fundDetails .search-card :deep(.el-input),
  .special-stack--fundDetails .search-card :deep(.el-select) {
    --el-input-height: 50px;
    font-size: 16px;
  }

  .special-stack--accounts .search-card :deep(.el-input__wrapper),
  .special-stack--accounts .search-card :deep(.el-select__wrapper),
  .special-stack--reimbursements .search-card :deep(.el-input__wrapper),
  .special-stack--reimbursements .search-card :deep(.el-select__wrapper),
  .special-stack--deliveryNotes .search-card :deep(.el-input__wrapper),
  .special-stack--deliveryNotes .search-card :deep(.el-select__wrapper),
  .special-stack--materials .search-card :deep(.el-input__wrapper),
  .special-stack--materials .search-card :deep(.el-select__wrapper),
  .special-stack--materialStock .search-card :deep(.el-input__wrapper),
  .special-stack--materialStock .search-card :deep(.el-select__wrapper),
  .special-stack--materialDetails .search-card :deep(.el-input__wrapper),
  .special-stack--materialDetails .search-card :deep(.el-select__wrapper),
  .special-stack--fundDetails .search-card :deep(.el-input__wrapper),
  .special-stack--fundDetails .search-card :deep(.el-select__wrapper) {
    min-height: 50px;
  }

  .special-stack--accounts .search-card :deep(.el-input__inner),
  .special-stack--accounts .search-card :deep(.el-select__placeholder),
  .special-stack--reimbursements .search-card :deep(.el-input__inner),
  .special-stack--reimbursements .search-card :deep(.el-select__placeholder),
  .special-stack--deliveryNotes .search-card :deep(.el-input__inner),
  .special-stack--deliveryNotes .search-card :deep(.el-select__placeholder),
  .special-stack--materials .search-card :deep(.el-input__inner),
  .special-stack--materials .search-card :deep(.el-select__placeholder),
  .special-stack--materialStock .search-card :deep(.el-input__inner),
  .special-stack--materialStock .search-card :deep(.el-select__placeholder),
  .special-stack--materialDetails .search-card :deep(.el-input__inner),
  .special-stack--materialDetails .search-card :deep(.el-select__placeholder),
  .special-stack--fundDetails .search-card :deep(.el-input__inner),
  .special-stack--fundDetails .search-card :deep(.el-select__placeholder) {
    font-size: 16px;
  }

  .special-stack--materials .search-toolbar,
  .special-stack--materialStock .search-toolbar,
  .special-stack--materialDetails .search-toolbar {
    grid-column: 1 / -1;
    position: absolute;
    top: 75px;
    right: 42px;
    width: auto;
    justify-content: flex-end;
    pointer-events: none;
  }

  .special-stack--accounts .search-toolbar,
  .special-stack--reimbursements .search-toolbar,
  .special-stack--deliveryNotes .search-toolbar,
  .special-stack--fundDetails .search-toolbar {
    grid-column: 1 / -1;
    position: absolute;
    right: 42px;
    bottom: 38px;
    width: 100%;
    justify-content: flex-end;
    pointer-events: none;
  }

  .special-stack--accounts .search-toolbar .toolbar__right,
  .special-stack--reimbursements .search-toolbar .toolbar__right,
  .special-stack--deliveryNotes .search-toolbar .toolbar__right,
  .special-stack--materials .search-toolbar .toolbar__right,
  .special-stack--materialStock .search-toolbar .toolbar__right,
  .special-stack--materialDetails .search-toolbar .toolbar__right,
  .special-stack--fundDetails .search-toolbar .toolbar__right {
    justify-content: flex-end;
    margin-left: auto;
    pointer-events: auto;
  }

  .special-stack--accounts .search-toolbar :deep(.el-button),
  .special-stack--reimbursements .search-toolbar :deep(.el-button),
  .special-stack--deliveryNotes .search-toolbar :deep(.el-button),
  .special-stack--materials .search-toolbar :deep(.el-button),
  .special-stack--materialStock .search-toolbar :deep(.el-button),
  .special-stack--materialDetails .search-toolbar :deep(.el-button),
  .special-stack--fundDetails .search-toolbar :deep(.el-button) {
    min-width: 110px;
    height: 50px;
    font-size: 18px;
  }

  .special-stack--accounts .table-card :deep(.page-block__body),
  .special-stack--reimbursements .table-card :deep(.page-block__body),
  .special-stack--deliveryNotes .table-card :deep(.page-block__body),
  .special-stack--materials .table-card :deep(.page-block__body),
  .special-stack--materialStock .table-card :deep(.page-block__body),
  .special-stack--materialDetails .table-card :deep(.page-block__body),
  .special-stack--fundDetails .table-card :deep(.page-block__body) {
    padding: 58px 42px 42px;
  }

  .special-stack--accounts .special-table :deep(.el-table__header th),
  .special-stack--reimbursements .special-table :deep(.el-table__header th),
  .special-stack--deliveryNotes .special-table :deep(.el-table__header th),
  .special-stack--materials .special-table :deep(.el-table__header th),
  .special-stack--materialStock .special-table :deep(.el-table__header th),
  .special-stack--materialDetails .special-table :deep(.el-table__header th),
  .special-stack--fundDetails .special-table :deep(.el-table__header th) {
    font-size: 16px;
  }

  .special-stack--accounts .special-table :deep(.el-table__body td),
  .special-stack--reimbursements .special-table :deep(.el-table__body td),
  .special-stack--deliveryNotes .special-table :deep(.el-table__body td),
  .special-stack--materials .special-table :deep(.el-table__body td),
  .special-stack--materialStock .special-table :deep(.el-table__body td),
  .special-stack--materialDetails .special-table :deep(.el-table__body td),
  .special-stack--fundDetails .special-table :deep(.el-table__body td) {
    font-size: 15px;
  }

  .special-stack--accounts .special-table :deep(.cell),
  .special-stack--reimbursements .special-table :deep(.cell),
  .special-stack--deliveryNotes .special-table :deep(.cell),
  .special-stack--materials .special-table :deep(.cell),
  .special-stack--materialStock .special-table :deep(.cell),
  .special-stack--materialDetails .special-table :deep(.cell),
  .special-stack--fundDetails .special-table :deep(.cell) {
    padding: 0 4px;
    white-space: nowrap;
  }

  .special-stack--receivable .search-card :deep(.page-block__body) {
    min-height: 240px;
    padding: 30px 20px 28px;
  }

  .receivable-tabs {
    width: 254px;
    height: 42px;
  }

  .receivable-tabs button {
    font-size: 18px;
  }

  .special-stack--receivable .search-grid {
    grid-template-columns: repeat(4, minmax(160px, 268px));
    justify-content: space-between;
    gap: 18px 20px;
    margin-top: 18px;
  }

  .special-stack--receivableUnits .search-grid {
    grid-template-columns: repeat(3, minmax(160px, 268px));
    justify-content: start;
    gap: 18px 48px;
    max-width: none;
  }

  .special-stack--receivable .search-card :deep(.el-input),
  .special-stack--receivable .search-card :deep(.el-select) {
    --el-input-height: 40px;
    font-size: 16px;
  }

  .special-stack--receivable .search-card :deep(.el-input__wrapper),
  .special-stack--receivable .search-card :deep(.el-select__wrapper) {
    min-height: 40px;
  }

  .special-stack--receivable .search-card :deep(.el-input__inner),
  .special-stack--receivable .search-card :deep(.el-select__placeholder) {
    font-size: 16px;
  }

  .special-stack--receivable .search-toolbar {
    right: 72px;
    bottom: 20px;
  }

  .special-stack--receivable .search-toolbar :deep(.el-button) {
    min-width: 102px;
    height: 42px;
    font-size: 16px;
  }

  .special-stack--receivable .table-card :deep(.page-block__body) {
    padding: 30px 20px 28px;
  }

  .special-stack--receivable .special-table :deep(.el-table__header th) {
    font-size: 16px;
  }

  .special-stack--receivable .special-table :deep(.el-table__body td) {
    font-size: 15px;
  }

  .special-stack--receivable .special-table :deep(.cell) {
    padding: 0 4px;
    white-space: nowrap;
  }

  .special-stack--outsourceIncoming .search-card :deep(.page-block__body),
  .special-stack--outsourceOutgoing .search-card :deep(.page-block__body) {
    position: relative;
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 40px 42px 38px;
  }

  .outsource-tabs button {
    min-width: 128px;
    height: 44px;
    font-size: 18px;
  }

  .special-stack--outsourceIncoming .search-grid,
  .special-stack--outsourceOutgoing .search-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px 20px;
  }

  .special-stack--outsourceIncoming .search-grid .search-item:nth-child(6),
  .special-stack--outsourceOutgoing .search-grid .search-item:nth-child(6) {
    grid-column: span 2;
    max-width: 300px;
  }

  .special-stack--outsourceIncoming .search-card :deep(.el-input),
  .special-stack--outsourceIncoming .search-card :deep(.el-select),
  .special-stack--outsourceOutgoing .search-card :deep(.el-input),
  .special-stack--outsourceOutgoing .search-card :deep(.el-select) {
    --el-input-height: 50px;
    font-size: 16px;
  }

  .special-stack--outsourceIncoming .search-card :deep(.el-input__wrapper),
  .special-stack--outsourceIncoming .search-card :deep(.el-select__wrapper),
  .special-stack--outsourceOutgoing .search-card :deep(.el-input__wrapper),
  .special-stack--outsourceOutgoing .search-card :deep(.el-select__wrapper) {
    min-height: 50px;
  }

  .special-stack--outsourceIncoming .search-card :deep(.el-input__inner),
  .special-stack--outsourceIncoming .search-card :deep(.el-select__placeholder),
  .special-stack--outsourceOutgoing .search-card :deep(.el-input__inner),
  .special-stack--outsourceOutgoing .search-card :deep(.el-select__placeholder) {
    font-size: 16px;
  }

  .special-stack--outsourceIncoming .search-toolbar .toolbar__right,
  .special-stack--outsourceOutgoing .search-toolbar .toolbar__right {
    justify-content: flex-end;
    margin-left: auto;
  }

  .special-stack--outsourceIncoming .search-toolbar,
  .special-stack--outsourceOutgoing .search-toolbar {
    grid-column: 1 / -1;
    position: absolute;
    right: 42px;
    bottom: 38px;
    width: 100%;
    justify-content: flex-end;
    pointer-events: none;
  }

  .special-stack--outsourceIncoming .search-toolbar .toolbar__right,
  .special-stack--outsourceOutgoing .search-toolbar .toolbar__right {
    pointer-events: auto;
  }

  .special-stack--outsourceIncoming .search-toolbar :deep(.el-button),
  .special-stack--outsourceOutgoing .search-toolbar :deep(.el-button) {
    min-width: 110px;
    height: 50px;
    font-size: 18px;
  }

  .special-stack--outsourceIncoming .table-card :deep(.page-block__body),
  .special-stack--outsourceOutgoing .table-card :deep(.page-block__body) {
    padding: 58px 42px 42px;
  }

  .special-stack--outsourceIncoming .special-table :deep(.el-table),
  .special-stack--outsourceOutgoing .special-table :deep(.el-table) {
    min-width: 100%;
  }

  .special-stack--outsourceIncoming .special-table :deep(.el-table__header th),
  .special-stack--outsourceOutgoing .special-table :deep(.el-table__header th) {
    font-size: 16px;
  }

  .special-stack--outsourceIncoming .special-table :deep(.el-table__body td),
  .special-stack--outsourceOutgoing .special-table :deep(.el-table__body td) {
    font-size: 15px;
  }

  .special-stack--outsourceIncoming .special-table :deep(.cell),
  .special-stack--outsourceOutgoing .special-table :deep(.cell) {
    padding: 0 2px;
    white-space: nowrap;
  }

  .special-stack--outsourceIncoming .special-table :deep(.el-table__empty-block),
  .special-stack--outsourceOutgoing .special-table :deep(.el-table__empty-block) {
    min-height: 430px;
  }

  .special-stack--outsourceIncoming .pagination-wrap,
  .special-stack--outsourceOutgoing .pagination-wrap {
    justify-content: flex-end;
  }
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

:deep(.customer-form-dialog.el-dialog),
:deep(.customer-detail-dialog.el-dialog),
:deep(.staff-form-dialog.el-dialog),
:deep(.organization-form-dialog.el-dialog) {
  width: min(1280px, calc(100vw - 88px)) !important;
}

:deep(.reset-password-dialog.el-dialog) {
  width: min(960px, calc(100vw - 88px)) !important;
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
  display: inline-flex;
  align-items: center;
  margin: 0;
  color: #40516b;
  font-size: 19px;
  font-weight: 700;
}

.form-item p .required-star,
.organization-form-dialog .form-item p .required-star,
.staff-form-dialog .form-item p .required-star,
.customer-form-dialog .form-item p .required-star {
  color: #ff3b30;
  margin-right: 2px;
}

.form-item--full {
  grid-column: 1 / -1;
}

.form-item--wide {
  grid-column: span 2;
}

.form-item--material-wide {
  grid-column: 1 / -1;
  max-width: 860px;
}

.form-item--manual-narrow {
  grid-column: 1 / 2;
  max-width: 420px;
}

.form-item--manual-remark {
  grid-column: 1 / -1;
  max-width: 860px;
}

.manual-record-form-dialog .material-order-section {
  width: 100%;
  margin-top: 22px;
  padding-top: 28px;
  border-top: 12px solid #f5f5f5;
}

.plain-upload {
  min-height: 42px;
}

.plain-upload :deep(.el-upload) {
  justify-content: flex-start;
}

.plain-upload :deep(.el-button) {
  min-width: 112px;
  height: 42px;
  border-radius: 4px;
  font-size: 15px;
}

.plain-upload :deep(.el-upload-list) {
  margin-top: 8px;
}

.material-order-section {
  display: grid;
  gap: 16px;
  width: min(100%, 860px);
  margin: 10px 0 0;
  padding: 24px 0 0;
  border-radius: 4px;
  background: transparent;
}

.material-order-section h3 {
  margin: 0;
  color: #111111;
  font-size: 20px;
  font-weight: 800;
}

.material-order-table :deep(.el-table__header th) {
  height: 50px;
  background: #f0f1f3 !important;
  color: #111111;
  font-size: 15px;
  font-weight: 800;
}

.material-order-table :deep(.el-table__body td) {
  height: 54px;
  color: #111111;
  font-size: 14px;
}

.material-order-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 18px;
  border: 1px solid #eef0f4;
  border-radius: 4px;
  background: #f7f8fa;
  color: #8a93a3;
  font-size: 16px;
}

.material-order-empty :deep(.el-button) {
  min-width: 104px;
  height: 40px;
}

.account-form-dialog :deep(.el-dialog__body) {
  padding: 30px 24px;
  background: #ffffff;
  min-height: 650px;
}

.account-form-dialog .form-grid {
  grid-template-columns: 360px;
  gap: 22px;
}

.account-form-dialog .form-item--full {
  grid-column: 1;
  width: 910px;
  max-width: calc(100vw - 180px);
}

.account-form-dialog .form-item p {
  color: #34415a;
  font-size: 18px;
  font-weight: 800;
}

.account-form-dialog .form-item :deep(.el-input__wrapper),
.account-form-dialog .form-item :deep(.el-textarea__inner) {
  min-height: 44px;
  border: 0;
  border-radius: 0;
  background: #f3f4f6;
  box-shadow: none;
}

.account-form-dialog .form-item :deep(.el-textarea__inner) {
  min-height: 80px !important;
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

.material-detail-view {
  display: grid;
  gap: 12px;
  padding: 0 0 20px;
}

.material-detail-card {
  padding: 32px 24px 34px;
  border-radius: 4px;
  background: #ffffff;
}

.material-detail-card h3 {
  margin: 0 0 26px;
  color: #111111;
  font-size: 20px;
  font-weight: 800;
}

.material-detail-info-grid {
  display: grid;
  grid-template-columns: minmax(360px, 420px) minmax(360px, 1fr);
  gap: 18px 120px;
  align-items: start;
}

.material-detail-field {
  min-height: 24px;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  align-items: start;
  color: #111111;
  font-size: 18px;
}

.material-detail-field span {
  color: #9a9a9a;
  font-weight: 800;
}

.material-detail-field strong {
  color: #111111;
  font-weight: 600;
  word-break: break-word;
}

.material-detail-field--images {
  grid-column: 1 / -1;
}

.material-detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.material-detail-image {
  width: 102px;
  height: 102px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  background: #e2e2e2;
  color: #88a0ad;
  overflow: hidden;
}

.material-detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-detail-empty {
  color: #111111 !important;
  font-weight: 600 !important;
}

.material-detail-order-table :deep(.el-table__header th) {
  height: 58px;
  background: #f0f1f3 !important;
  color: #111111;
  font-size: 17px;
  font-weight: 800;
}

.material-detail-order-table :deep(.el-table__body td) {
  height: 64px;
  color: #111111;
  font-size: 16px;
}

.material-detail-order-table :deep(.el-button.is-link) {
  font-size: 16px;
  font-weight: 700;
}

:deep(.delivery-form-dialog .el-dialog__body) {
  padding: 22px 34px 0;
  background: #f5f5f5;
}

.delivery-form-stack {
  display: grid;
  gap: 18px;
  min-height: 560px;
}

.delivery-form-section {
  padding: 28px 16px 34px;
  border-radius: 4px;
  background: #fff;
}

.delivery-form-section h3 {
  margin: 0 0 18px;
  color: #111;
  font-size: 18px;
  font-weight: 800;
}

.delivery-form-section > .el-button {
  width: 84px;
  height: 42px;
  margin-bottom: 18px;
  border-radius: 4px;
  font-size: 16px;
}

.delivery-form-table :deep(.el-table__header th),
.delivery-picker-table :deep(.el-table__header th) {
  height: 50px;
  background: #f0f1f3 !important;
  color: #111;
  font-size: 15px;
  font-weight: 800;
}

.delivery-form-table :deep(.el-table__body td),
.delivery-picker-table :deep(.el-table__body td) {
  height: 54px;
  color: #111;
  font-size: 14px;
}

:deep(.delivery-picker-dialog .el-dialog__body) {
  padding: 0 18px 0;
}

.delivery-picker-search {
  display: grid;
  grid-template-columns: 210px 210px 1fr;
  align-items: end;
  gap: 26px;
  padding: 18px 0 16px;
}

.delivery-picker-search label {
  display: grid;
  gap: 8px;
  color: #8a8f99;
  font-size: 14px;
  font-weight: 600;
}

.delivery-picker-search :deep(.el-input__wrapper) {
  min-height: 44px;
  border: 0;
  box-shadow: none;
  background: #f5f6f8;
}

.delivery-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
}

.delivery-picker-actions :deep(.el-button) {
  min-width: 86px;
  height: 42px;
  border-radius: 4px;
  font-size: 15px;
}

.delivery-picker-table {
  min-height: 360px;
}

:deep(.product-craft-detail-dialog.el-dialog) {
  width: min(1280px, calc(100vw - 88px)) !important;
}

:deep(.product-craft-detail-dialog .el-dialog__body) {
  padding: 10px 22px 0;
  background: #f5f5f5;
}

:deep(.product-craft-detail-dialog .el-dialog__footer) {
  display: flex;
  justify-content: flex-end;
  padding: 20px 42px 24px;
  background: #ffffff;
}

:deep(.product-craft-detail-dialog .el-dialog__footer .el-button) {
  min-width: 100px;
  height: 42px;
  border: 0;
  border-radius: 4px;
  background: #f5f6f8;
  color: #222;
  font-size: 17px;
}

:deep(.outsource-detail-dialog.el-dialog) {
  width: min(1280px, calc(100vw - 88px)) !important;
}

:deep(.outsource-detail-dialog .el-dialog__body) {
  padding: 10px 22px 0;
  background: #f5f5f5;
}

:deep(.outsource-detail-dialog .el-dialog__footer) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 20px 42px 24px;
  background: #ffffff;
}

:deep(.outsource-detail-dialog .el-dialog__footer .el-button) {
  min-width: 100px;
  height: 42px;
  border-radius: 4px;
  font-size: 17px;
}

:deep(.customer-form-dialog .el-dialog__body),
:deep(.customer-detail-dialog .el-dialog__body),
:deep(.staff-form-dialog .el-dialog__body),
:deep(.organization-form-dialog .el-dialog__body) {
  background: #f7f7f7;
}

:deep(.customer-form-dialog .el-dialog__footer),
:deep(.customer-detail-dialog .el-dialog__footer),
:deep(.staff-form-dialog .el-dialog__footer),
:deep(.organization-form-dialog .el-dialog__footer) {
  background: #ffffff;
}

.customer-form-dialog .form-grid {
  padding: 34px 38px 42px;
  border-radius: 8px;
  background: #ffffff;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px 64px;
}

.customer-form-dialog .form-item p {
  color: #4b5870;
  font-size: 22px;
  line-height: 1.2;
}

.customer-form-dialog .form-item--full {
  grid-column: 1 / -1;
}

:deep(.customer-form-dialog .el-input),
:deep(.customer-form-dialog .el-select),
:deep(.customer-form-dialog .el-date-editor.el-input) {
  --el-input-height: 66px;
  font-size: 22px;
}

:deep(.customer-form-dialog .el-input__wrapper),
:deep(.customer-form-dialog .el-select__wrapper) {
  min-height: 66px;
  border-radius: 0;
  background: #f5f6f8;
}

:deep(.customer-form-dialog .el-input__inner::placeholder),
:deep(.customer-form-dialog .el-textarea__inner::placeholder),
:deep(.customer-form-dialog .el-select__placeholder) {
  color: #b9b9b9;
}

:deep(.customer-form-dialog .el-textarea__inner) {
  min-height: 132px !important;
  border-radius: 0;
}

.customer-detail-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.customer-info-panel,
.customer-record-panel {
  padding: 34px 38px;
  border-radius: 8px;
  background: #ffffff;
}

.customer-info-panel h3 {
  margin: 0 0 32px;
  color: #111111;
  font-size: 30px;
  font-weight: 800;
}

.customer-info-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 28px 80px;
}

.customer-info-item {
  display: flex;
  align-items: baseline;
  gap: 22px;
  min-width: 0;
}

.customer-info-item p {
  flex: 0 0 116px;
  margin: 0;
  color: #9a9a9a;
  font-size: 22px;
  font-weight: 700;
  text-align: right;
}

.customer-info-item strong {
  min-width: 0;
  color: #111111;
  font-size: 22px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.customer-record-tabs {
  display: inline-flex;
  overflow: hidden;
  margin-bottom: 26px;
  border: 1px solid #1f66ff;
  border-radius: 6px;
}

.customer-record-tabs button {
  min-width: 150px;
  height: 56px;
  border: 0;
  border-right: 1px solid #1f66ff;
  background: #ffffff;
  color: #1f66ff;
  font-size: 22px;
  cursor: pointer;
}

.customer-record-tabs button:last-child {
  border-right: 0;
}

.customer-record-tabs button.active {
  background: #1f66ff;
  color: #ffffff;
}

.customer-record-table :deep(.el-table__header th) {
  height: 68px;
  background: #f1f2f4 !important;
  color: #111111;
  font-size: 20px;
}

.customer-record-table :deep(.el-table__body td) {
  height: 68px;
  color: #111111;
  font-size: 19px;
}

.organization-form-dialog .form-grid {
  min-height: 430px;
  padding: 34px 38px 42px;
  border-radius: 8px;
  background: #ffffff;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  gap: 34px 60px;
}

.organization-form-dialog .form-item p {
  color: #4b5870;
  font-size: 24px;
  line-height: 1.2;
}

.organization-form-dialog .form-item--full {
  grid-column: 1 / -1;
}

:deep(.organization-form-dialog .el-input),
:deep(.organization-form-dialog .el-select),
:deep(.organization-form-dialog .el-date-editor.el-input) {
  --el-input-height: 66px;
  font-size: 22px;
}

:deep(.organization-form-dialog .el-input__wrapper),
:deep(.organization-form-dialog .el-select__wrapper) {
  min-height: 66px;
  border-radius: 0;
  background: #f5f6f8;
}

:deep(.organization-form-dialog .el-input__inner::placeholder),
:deep(.organization-form-dialog .el-select__placeholder),
:deep(.organization-form-dialog .el-textarea__inner::placeholder) {
  color: #b9b9b9;
}

:deep(.organization-form-dialog .el-textarea__inner) {
  min-height: 132px !important;
  border-radius: 0;
  background: #f5f6f8;
  font-size: 22px;
}

.staff-form-dialog .form-grid {
  padding: 24px 38px 28px;
  border-radius: 8px;
  background: #ffffff;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 42px;
}

.staff-form-dialog .form-item p {
  color: #4b5870;
  font-size: 20px;
  line-height: 1.2;
}

.staff-form-dialog .form-item--full {
  grid-column: 1 / -1;
}

.staff-form-dialog .form-item--wide {
  grid-column: 1 / -1;
}

.staff-form-dialog .form-item--permissions {
  gap: 14px;
}

.staff-form-dialog .form-item--staff-remark {
  margin-top: -2px;
}

.staff-form-dialog .form-item--permissions :deep(.el-checkbox-group) {
  align-content: flex-start;
  align-items: flex-start;
  max-height: 54px;
  min-height: 54px;
  overflow: auto;
  padding: 7px 18px;
  border-radius: 0;
  background: #f5f6f8;
}

.staff-form-dialog .form-item--permissions :deep(.el-checkbox) {
  height: 32px;
  margin-right: 20px;
}

.staff-form-dialog .form-item--permissions :deep(.el-checkbox__label) {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.staff-form-dialog .el-input),
:deep(.staff-form-dialog .el-select),
:deep(.staff-form-dialog .el-date-editor.el-input),
:deep(.reset-password-dialog .el-input) {
  --el-input-height: 58px;
  font-size: 20px;
}

:deep(.staff-form-dialog .el-input__wrapper),
:deep(.staff-form-dialog .el-select__wrapper),
:deep(.reset-password-dialog .el-input__wrapper) {
  min-height: 58px;
  border-radius: 0;
  background: #f5f6f8;
}

:deep(.staff-form-dialog .el-textarea__inner) {
  min-height: 58px !important;
  font-size: 20px;
}

:deep(.staff-form-dialog.el-dialog) {
  max-height: calc(100vh - 72px);
}

:deep(.staff-form-dialog .el-dialog__body) {
  max-height: calc(100vh - 234px);
  padding-bottom: 18px;
}

:deep(.staff-form-dialog .el-dialog__footer) {
  position: relative;
  z-index: 1;
  padding-top: 18px;
  box-shadow: 0 -10px 24px rgba(255, 255, 255, 0.86);
}

:deep(.staff-form-dialog .el-input__inner::placeholder),
:deep(.staff-form-dialog .el-select__placeholder),
:deep(.reset-password-dialog .el-input__inner::placeholder) {
  color: #b9b9b9;
}

:deep(.staff-form-dialog .el-radio-group),
:deep(.staff-form-dialog .el-checkbox-group) {
  min-height: 58px;
  align-items: center;
  gap: 28px;
  font-size: 20px;
}

:deep(.staff-form-dialog .el-radio__label),
:deep(.staff-form-dialog .el-checkbox__label) {
  color: #333333;
  font-size: 20px;
}

:deep(.staff-form-dialog .el-checkbox__inner),
:deep(.staff-form-dialog .el-radio__inner) {
  width: 24px;
  height: 24px;
}

.reset-password-form {
  display: grid;
  gap: 28px;
  min-height: 330px;
  padding: 50px 0 72px;
}

.reset-password-form label {
  display: grid;
  gap: 20px;
}

.reset-password-form span {
  color: #4b5870;
  font-size: 22px;
  font-weight: 700;
}

:deep(.reset-password-dialog .el-dialog__header) {
  padding: 44px 48px 30px;
  border-bottom: 0;
}

:deep(.reset-password-dialog .el-dialog__title) {
  font-size: 32px;
  font-weight: 800;
}

:deep(.reset-password-dialog .el-dialog__body) {
  padding: 0 48px;
  background: #ffffff;
}

:deep(.reset-password-dialog .el-dialog__footer) {
  padding: 0 48px 48px;
  border-top: 0;
}

:deep(.reset-password-dialog .el-dialog__footer .el-button) {
  min-width: 166px;
  height: 58px;
  font-size: 22px;
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

.special-stack .search-card :deep(.page-block__body),
.special-stack .module-grid--tree .search-card :deep(.page-block__body) {
  display: grid !important;
  grid-template-columns: 1fr !important;
  align-items: start !important;
  gap: 18px !important;
  min-height: 0 !important;
  padding: 24px 28px 22px !important;
}

.special-stack .search-grid,
.special-stack .module-grid--tree .search-grid {
  width: 100% !important;
  display: grid !important;
  grid-template-columns: repeat(4, minmax(160px, 1fr)) !important;
  gap: 18px 28px !important;
  margin: 0 !important;
  padding: 0 !important;
}

.special-stack .search-toolbar {
  position: static !important;
  inset: auto !important;
  width: 100% !important;
  margin: 0 !important;
  justify-content: flex-end !important;
  pointer-events: auto !important;
}

.special-stack .search-toolbar .toolbar__right {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  width: 100% !important;
  margin-left: 0 !important;
  pointer-events: auto !important;
}

.special-stack .search-toolbar :deep(.el-button) {
  min-width: 104px !important;
  height: 42px !important;
  padding: 0 20px !important;
  border-radius: 6px !important;
  font-size: 16px !important;
}

.special-stack .search-item {
  gap: 8px !important;
}

.special-stack .search-item span {
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #8b8f99 !important;
}

.special-stack .search-card :deep(.el-input),
.special-stack .search-card :deep(.el-select),
.special-stack .search-card :deep(.el-date-editor.el-input) {
  --el-input-height: 42px !important;
  font-size: 15px !important;
}

.special-stack .search-card :deep(.el-input__wrapper),
.special-stack .search-card :deep(.el-select__wrapper) {
  min-height: 42px !important;
  border-radius: 6px !important;
  background: #f6f7f9 !important;
  box-shadow: none !important;
}

.special-stack .search-card :deep(.el-input__inner),
.special-stack .search-card :deep(.el-select__placeholder),
.special-stack .search-card :deep(.el-select__selected-item) {
  font-size: 15px !important;
}

.special-stack .table-card :deep(.page-block__body) {
  padding: 24px 28px 28px !important;
}

.special-stack .list-toolbar {
  margin-bottom: 18px !important;
}

.special-stack .list-toolbar :deep(.el-button) {
  min-width: 96px !important;
  height: 42px !important;
  border-radius: 6px !important;
  font-size: 16px !important;
}

.special-stack .special-table :deep(.el-table__header th) {
  height: 52px !important;
  font-size: 16px !important;
}

.special-stack .special-table :deep(.el-table__body td) {
  height: 56px !important;
  font-size: 15px !important;
}

.special-stack .special-table :deep(.cell) {
  line-height: 22px !important;
}

.special-stack .special-table :deep(.el-button.is-link) {
  font-size: 15px !important;
}

.special-stack .summary-band {
  font-size: 16px !important;
}

.special-stack .pagination-wrap {
  margin-top: 18px !important;
}

.special-stack--craftStats .search-card :deep(.page-block__body) {
  grid-template-columns: minmax(0, 1fr) auto !important;
  align-items: end !important;
  gap: 42px !important;
  min-height: 152px !important;
  padding: 34px 14px 36px !important;
}

.special-stack--craftStats .search-grid {
  grid-template-columns: repeat(3, minmax(240px, 1fr)) !important;
  gap: 72px !important;
}

.special-stack--craftStats .search-item span {
  font-size: 18px !important;
  color: #9a9a9a !important;
}

.special-stack--craftStats .search-card :deep(.el-input) {
  --el-input-height: 50px !important;
  font-size: 18px !important;
}

.special-stack--craftStats .search-card :deep(.el-input__wrapper) {
  min-height: 50px !important;
  border-radius: 6px !important;
  background: #f6f7f9 !important;
}

.special-stack--craftStats .search-card :deep(.el-input__inner) {
  color: #b4b4b4 !important;
  font-size: 18px !important;
}

.special-stack--craftStats .search-toolbar {
  width: auto !important;
}

.special-stack--craftStats .search-toolbar .toolbar__right {
  width: auto !important;
  flex-wrap: nowrap;
  gap: 24px !important;
}

.special-stack--craftStats .search-toolbar :deep(.el-button) {
  min-width: 124px !important;
  height: 50px !important;
  font-size: 18px !important;
}

.special-stack--craftStats .table-card :deep(.page-block__body) {
  position: relative;
  min-height: 896px;
  padding: 32px 14px 34px !important;
}

.special-stack--craftStats .result-bar,
.special-stack--craftStats .filter-tags {
  display: none;
}

.special-stack--craftStats .list-toolbar {
  margin-bottom: 26px !important;
}

.special-stack--craftStats .list-toolbar :deep(.el-button) {
  min-width: 128px !important;
  height: 50px !important;
  border: 0;
  border-radius: 6px !important;
  background: #f6f7f9;
  color: #111111;
  font-size: 18px !important;
}

.special-stack--craftStats .summary-band {
  position: absolute;
  top: 42px;
  right: 26px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent !important;
  color: #202124;
  font-size: 20px !important;
  font-weight: 800;
}

.special-stack--craftStats .summary-band__highlight {
  padding: 0 6px;
  color: #ff3365;
}

.special-stack--craftStats .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f1f3;
  --el-table-border-color: #dedede;
  min-width: 100%;
  font-size: 20px;
}

.special-stack--craftStats .special-table :deep(.el-table__header th) {
  height: 74px !important;
  background: #f0f1f3 !important;
  color: #111111;
  font-size: 20px !important;
  font-weight: 800;
}

.special-stack--craftStats .special-table :deep(.el-table__body td) {
  height: 74px !important;
  color: #111111;
  font-size: 19px !important;
}

.special-stack--craftStats .pagination-wrap {
  justify-content: flex-end;
  margin-top: 456px !important;
}

.special-stack--deliveryPerformance .search-card :deep(.page-block__body) {
  grid-template-columns: minmax(0, 1fr) auto !important;
  align-items: end !important;
  gap: 42px !important;
  min-height: 150px !important;
  padding: 34px 24px 34px !important;
}

.special-stack--deliveryPerformance .search-grid {
  grid-template-columns: repeat(3, minmax(240px, 1fr)) !important;
  gap: 86px !important;
}

.special-stack--deliveryPerformance .search-item span {
  font-size: 18px !important;
  color: #9a9a9a !important;
}

.special-stack--deliveryPerformance .search-card :deep(.el-input) {
  --el-input-height: 50px !important;
  font-size: 18px !important;
}

.special-stack--deliveryPerformance .search-card :deep(.el-input__wrapper) {
  min-height: 50px !important;
  border-radius: 6px !important;
  background: #f6f7f9 !important;
}

.special-stack--deliveryPerformance .search-card :deep(.el-input__inner) {
  color: #b4b4b4 !important;
  font-size: 18px !important;
}

.special-stack--deliveryPerformance .search-toolbar {
  width: auto !important;
}

.special-stack--deliveryPerformance .search-toolbar .toolbar__right {
  width: auto !important;
  flex-wrap: nowrap;
  gap: 24px !important;
}

.special-stack--deliveryPerformance .search-toolbar :deep(.el-button) {
  min-width: 124px !important;
  height: 50px !important;
  font-size: 18px !important;
}

.special-stack--deliveryPerformance .table-card :deep(.page-block__body) {
  position: relative;
  min-height: 896px;
  padding: 36px 24px 34px !important;
}

.special-stack--deliveryPerformance .result-bar,
.special-stack--deliveryPerformance .filter-tags {
  display: none;
}

.special-stack--deliveryPerformance .list-toolbar {
  margin-bottom: 24px !important;
}

.special-stack--deliveryPerformance .list-toolbar :deep(.el-button) {
  min-width: 120px !important;
  height: 50px !important;
  border: 0;
  border-radius: 6px !important;
  background: #f6f7f9;
  color: #111111;
  font-size: 18px !important;
}

.special-stack--deliveryPerformance .summary-band {
  position: absolute;
  top: 46px;
  right: 30px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent !important;
  color: #202124;
  font-size: 20px !important;
  font-weight: 800;
}

.special-stack--deliveryPerformance .summary-band__highlight {
  padding: 0 8px;
  color: #ff3365;
}

.special-stack--deliveryPerformance .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f1f3;
  --el-table-border-color: #dedede;
  min-width: 100%;
  font-size: 20px;
}

.special-stack--deliveryPerformance .special-table :deep(.el-table__header th) {
  height: 72px !important;
  background: #f0f1f3 !important;
  color: #111111;
  font-size: 20px !important;
  font-weight: 800;
}

.special-stack--deliveryPerformance .special-table :deep(.el-table__body td) {
  height: 72px !important;
  color: #111111;
  font-size: 19px !important;
}

.special-stack--deliveryPerformance .special-table :deep(.performance-blue-column) {
  background: #d5e1ff !important;
  text-align: center;
}

.special-stack--deliveryPerformance .pagination-wrap {
  justify-content: flex-end;
  margin-top: 512px !important;
}

.special-stack--craftPerformance .search-card :deep(.page-block__body) {
  gap: 18px !important;
  min-height: 248px !important;
  padding: 34px 24px 38px !important;
}

.special-stack--craftPerformance .search-grid {
  grid-template-columns: repeat(4, minmax(180px, 1fr)) !important;
  gap: 22px 64px !important;
}

.special-stack--craftPerformance .search-item:nth-child(5) {
  grid-column: 1 / 2;
}

.special-stack--craftPerformance .search-item span {
  font-size: 18px !important;
  color: #9a9a9a !important;
}

.special-stack--craftPerformance .search-card :deep(.el-input),
.special-stack--craftPerformance .search-card :deep(.el-select) {
  --el-input-height: 48px !important;
  font-size: 18px !important;
}

.special-stack--craftPerformance .search-card :deep(.el-input__wrapper),
.special-stack--craftPerformance .search-card :deep(.el-select__wrapper) {
  min-height: 48px !important;
  border-radius: 6px !important;
  background: #f6f7f9 !important;
}

.special-stack--craftPerformance .search-card :deep(.el-input__inner),
.special-stack--craftPerformance .search-card :deep(.el-select__placeholder),
.special-stack--craftPerformance .search-card :deep(.el-select__selected-item) {
  color: #b4b4b4 !important;
  font-size: 18px !important;
}

.special-stack--craftPerformance .search-toolbar {
  margin-top: -78px !important;
}

.special-stack--craftPerformance .search-toolbar .toolbar__right {
  padding-right: 84px;
  gap: 24px !important;
}

.special-stack--craftPerformance .search-toolbar :deep(.el-button) {
  min-width: 124px !important;
  height: 48px !important;
  font-size: 18px !important;
}

.special-stack--craftPerformance .table-card :deep(.page-block__body) {
  min-height: 884px;
  padding: 40px 24px 34px !important;
}

.special-stack--craftPerformance .result-bar,
.special-stack--craftPerformance .filter-tags {
  display: none;
}

.craft-performance-options {
  display: grid;
  gap: 22px;
  margin-bottom: 24px;
}

.craft-performance-option-row {
  display: flex;
  align-items: center;
  gap: 22px;
  min-height: 34px;
  color: #111111;
  font-size: 20px;
}

.craft-performance-option-row strong {
  flex: 0 0 108px;
  font-size: 20px;
  font-weight: 800;
}

.craft-performance-option-row :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 26px;
  align-items: center;
}

.craft-performance-option-row :deep(.el-checkbox) {
  height: 32px;
  margin-right: 0;
}

.craft-performance-option-row :deep(.el-checkbox__label) {
  color: #222222;
  font-size: 18px;
  font-weight: 500;
}

.craft-performance-export {
  width: 120px;
  height: 50px;
  margin-top: 2px;
  border: 0;
  border-radius: 6px;
  background: #f6f7f9;
  color: #111111;
  font-size: 18px;
}

.special-stack--craftPerformance .special-table :deep(.el-table) {
  --el-table-header-bg-color: #f0f1f3;
  --el-table-border-color: #dedede;
  min-width: 100%;
  font-size: 20px;
}

.special-stack--craftPerformance .special-table :deep(.el-table__header th) {
  height: 72px !important;
  background: #f0f1f3 !important;
  color: #111111;
  font-size: 19px !important;
  font-weight: 800;
}

.special-stack--craftPerformance .special-table :deep(.el-table__body td) {
  height: 74px !important;
  color: #111111;
  font-size: 19px !important;
}

.special-stack--craftPerformance .special-table :deep(.cell) {
  line-height: 24px !important;
}

.special-stack--craftPerformance .special-table :deep(.craft-performance-total-column) {
  background: #d5e1ff !important;
  text-align: center;
  font-weight: 800;
}

.special-stack--craftPerformance .pagination-wrap {
  justify-content: flex-end;
  margin-top: 246px !important;
}

.special-stack--staff .hero-grid,
.special-stack--staff .workflow-strip,
.special-stack--staff .overview-panels,
.special-stack--staff .result-bar,
.special-stack--staff .filter-tags {
  display: none !important;
}

.special-stack--staff .module-grid--tree {
  grid-template-columns: 380px minmax(0, 1fr) !important;
  gap: 12px !important;
}

.special-stack--staff .tree-card {
  min-height: calc(100vh - 210px);
}

.special-stack--staff .tree-card :deep(.page-block__body) {
  padding: 36px 24px 28px !important;
}

.special-stack--staff .tree-search {
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding-bottom: 26px;
  border-bottom: 1px solid #d8d8d8;
}

.special-stack--staff .tree-search strong {
  color: #4b5870;
  font-size: 18px;
  font-weight: 800;
}

.special-stack--staff .tree-search :deep(.el-input) {
  --el-input-height: 44px;
  font-size: 18px;
}

.special-stack--staff .tree-search :deep(.el-input__wrapper) {
  border-radius: 4px;
  background: #f5f6f8;
  box-shadow: none;
}

.special-stack--staff .tree-list {
  padding-top: 36px;
}

.special-stack--staff .tree-node__label,
.special-stack--staff .tree-node__child {
  min-height: 62px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #2d3648;
  font-size: 20px;
  font-weight: 700;
}

.special-stack--staff .tree-node__label.active,
.special-stack--staff .tree-node__child.active {
  background: #e6edff;
  color: #1f66ff;
  box-shadow: inset -4px 0 0 #1f66ff;
}

.special-stack--staff .module-grid--tree .search-card :deep(.page-block__body) {
  display: grid !important;
  grid-template-columns: 1fr !important;
  align-items: start !important;
  gap: 24px !important;
  padding: 34px 28px !important;
}

.special-stack--staff .module-grid--tree .search-grid {
  grid-template-columns: repeat(3, minmax(190px, 1fr)) !important;
  gap: 22px !important;
}

.special-stack--staff .search-item span {
  color: #8d8d8d;
  font-size: 18px;
  font-weight: 700;
}

.special-stack--staff .search-card :deep(.el-input),
.special-stack--staff .search-card :deep(.el-select) {
  --el-input-height: 48px;
  font-size: 18px;
}

.special-stack--staff .search-card :deep(.el-input__wrapper),
.special-stack--staff .search-card :deep(.el-select__wrapper) {
  border-radius: 4px;
  background: #f5f6f8;
  box-shadow: none;
}

.special-stack--staff .search-toolbar {
  width: 100% !important;
}

.special-stack--staff .search-toolbar .toolbar__right {
  width: 100% !important;
  justify-content: flex-end !important;
  flex-wrap: nowrap !important;
}

.special-stack--staff .search-toolbar :deep(.el-button) {
  min-width: 108px !important;
  height: 48px !important;
  font-size: 18px !important;
}

.special-stack--staff .module-grid--tree .table-card :deep(.page-block__body) {
  min-height: calc(100vh - 360px);
  padding: 36px 24px 28px !important;
}

.special-stack--staff .list-toolbar {
  margin-bottom: 24px !important;
}

.special-stack--staff .list-toolbar :deep(.el-button) {
  min-width: 112px;
  height: 46px;
  font-size: 18px;
}

.special-stack--staff .special-table :deep(.el-table) {
  min-width: 100%;
  font-size: 20px;
}

.special-stack--staff .special-table :deep(.el-table__header th) {
  height: 72px !important;
  background: #f0f1f3 !important;
  color: #111111;
  font-size: 20px !important;
  font-weight: 800;
}

.special-stack--staff .special-table :deep(.el-table__body td) {
  height: 74px !important;
  color: #111111;
  font-size: 20px !important;
}

.special-stack--staff .special-table :deep(.el-button.is-link) {
  color: #005cff;
  font-size: 18px;
}

.special-stack--staff .pagination-wrap {
  justify-content: flex-end !important;
  margin-top: 420px !important;
}

.staff-full-form {
  min-height: calc(100vh - 178px);
  padding: 22px 0 96px;
}

.staff-full-form__card {
  min-height: calc(100vh - 270px);
}

.staff-full-form__card :deep(.page-block__body) {
  padding: 34px 24px 120px;
}

.staff-full-form h2 {
  margin: 0 0 42px;
  color: #111111;
  font-size: 24px;
  font-weight: 800;
}

.staff-full-form__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px 220px;
  max-width: 1660px;
}

.staff-form-field {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.staff-form-field p {
  margin: 0;
  color: #4b5870;
  font-size: 20px;
  font-weight: 800;
}

.staff-form-field--plain {
  align-content: start;
}

.staff-form-field--roles,
.staff-form-field--remark {
  grid-column: 1 / -1;
}

.staff-form-field--roles {
  margin-top: 4px;
}

.staff-form-field--remark {
  max-width: 1080px;
}

.staff-form-field--empty {
  visibility: hidden;
}

.staff-full-form :deep(.el-input),
.staff-full-form :deep(.el-select),
.staff-full-form :deep(.el-date-editor.el-input) {
  --el-input-height: 48px;
  width: 100%;
  font-size: 20px;
}

.staff-full-form :deep(.el-input__wrapper),
.staff-full-form :deep(.el-select__wrapper) {
  border-radius: 0;
  background: #f5f6f8;
  box-shadow: none;
}

.staff-full-form :deep(.el-input__inner::placeholder),
.staff-full-form :deep(.el-select__placeholder),
.staff-full-form :deep(.el-textarea__inner::placeholder) {
  color: #b6b6b6;
}

.staff-full-form :deep(.el-radio-group),
.staff-full-form :deep(.el-checkbox-group) {
  min-height: 48px;
  align-items: center;
  gap: 26px;
}

.staff-full-form :deep(.el-radio__label),
.staff-full-form :deep(.el-checkbox__label) {
  color: #111111;
  font-size: 20px;
}

.staff-full-form :deep(.el-checkbox__inner),
.staff-full-form :deep(.el-radio__inner) {
  width: 20px;
  height: 20px;
}

.staff-full-form :deep(.el-textarea__inner) {
  min-height: 96px !important;
  border-radius: 0;
  background: #f5f6f8;
  box-shadow: none;
  font-size: 20px;
}

.staff-full-form__footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 280px;
  z-index: 20;
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  padding: 24px 72px;
  border-top: 1px solid #efefef;
  background: #ffffff;
  box-shadow: 0 -10px 24px rgba(0, 0, 0, 0.06);
}

.staff-full-form__footer :deep(.el-button) {
  min-width: 118px;
  height: 48px;
  font-size: 18px;
}

.organization-full-form {
  min-height: calc(100vh - 178px);
  padding: 22px 0 96px;
}

.organization-full-form__card {
  min-height: calc(100vh - 270px);
}

.organization-full-form__card :deep(.page-block__body) {
  padding: 34px 24px 120px;
}

.organization-full-form h2 {
  margin: 0 0 42px;
  color: #111111;
  font-size: 24px;
  font-weight: 800;
}

.organization-full-form__grid {
  display: grid;
  gap: 22px;
  max-width: 1080px;
}

.organization-form-field {
  display: grid;
  gap: 10px;
  width: 420px;
  min-width: 0;
}

.organization-form-field p {
  margin: 0;
  color: #4b5870;
  font-size: 20px;
  font-weight: 800;
}

.organization-form-field--remark {
  width: 100%;
}

.organization-full-form :deep(.el-input) {
  --el-input-height: 48px;
  width: 100%;
  font-size: 20px;
}

.organization-full-form :deep(.el-input__wrapper) {
  border-radius: 0;
  background: #f5f6f8;
  box-shadow: none;
}

.organization-full-form :deep(.el-input__inner::placeholder),
.organization-full-form :deep(.el-textarea__inner::placeholder) {
  color: #b6b6b6;
}

.organization-full-form :deep(.el-textarea__inner) {
  min-height: 96px !important;
  border-radius: 0;
  background: #f5f6f8;
  box-shadow: none;
  font-size: 20px;
}

.organization-full-form__footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 280px;
  z-index: 20;
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  padding: 24px 72px;
  border-top: 1px solid #efefef;
  background: #ffffff;
  box-shadow: 0 -10px 24px rgba(0, 0, 0, 0.06);
}

.organization-full-form__footer :deep(.el-button) {
  min-width: 118px;
  height: 48px;
  font-size: 18px;
}

:deep(.reset-password-dialog.el-dialog) {
  border-radius: 4px;
}

:deep(.reset-password-dialog .el-dialog__header) {
  padding: 32px 32px 24px !important;
}

:deep(.reset-password-dialog .el-dialog__title) {
  font-size: 24px !important;
}

:deep(.reset-password-dialog .el-dialog__body) {
  padding: 0 32px !important;
}

.reset-password-form {
  min-height: 210px;
  padding: 20px 0 70px !important;
}

.reset-password-form span {
  color: #4b5870;
  font-size: 20px !important;
}

:deep(.reset-password-dialog .el-dialog__footer) {
  padding: 0 32px 32px !important;
}

:deep(.reset-password-dialog .el-dialog__footer .el-button) {
  min-width: 120px !important;
  height: 48px !important;
  font-size: 18px !important;
}

@media (max-width: 860px) {
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
