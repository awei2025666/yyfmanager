export const crudModuleConfigs = {
  customers: {
    title: '合作客户',
    subtitle: '客户档案与往来管理',
    createText: '添加',
    secondaryActionText: '导出',
    dialogWidth: '920px',
    searchFields: [
      { key: 'name', label: '单位名称', type: 'input' },
      { key: 'sales', label: '业务员', type: 'select', options: [] },
      { key: 'customerType', label: '客户类型', type: 'select', options: ['月结客户', '现结客户', '供应商', '货运站代收'] },
      { key: 'contact', label: '联系人', type: 'input' },
      { key: 'phone', label: '联系方式', type: 'input' },
      { key: 'createdAt', label: '创建时间', type: 'input' }
    ],
    formFields: [
      { key: 'name', label: '单位名称', type: 'input' },
      { key: 'fullName', label: '单位全称', type: 'input' },
      { key: 'contact', label: '联系人', type: 'input' },
      { key: 'phone', label: '联系方式', type: 'input' },
      { key: 'address', label: '单位地址', type: 'input' },
      { key: 'customerType', label: '客户类型', type: 'select', options: ['月结客户', '现结客户', '供应商', '货运站代收'] },
      { key: 'sales', label: '业务员', type: 'select', options: [] },
      { key: 'createdAt', label: '创建时间', type: 'input' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'name', label: '单位名称' },
      { key: 'contact', label: '联系人' },
      { key: 'phone', label: '联系方式' },
      { key: 'address', label: '单位地址' },
      { key: 'customerType', label: '客户类型' },
      { key: 'sales', label: '业务员' },
      { key: 'createdAt', label: '创建时间' }
    ],
    detailFields: [
      { key: 'name', label: '单位名称' },
      { key: 'fullName', label: '单位全称' },
      { key: 'contact', label: '联系人' },
      { key: 'sales', label: '业务员' },
      { key: 'address', label: '单位地址' },
      { key: 'remark', label: '备注' },
      { key: 'customerType', label: '客户类型' },
      { key: 'payAccount', label: '收款账户' },
      { key: 'phone', label: '联系方式' },
      { key: 'operationTime', label: '操作时间' },
      { key: 'operator', label: '操作员' }
    ],
    detailTabs: [
      {
        key: 'orderRecords',
        label: '订单记录',
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'orderTime', label: '订单时间' },
          { key: 'filler', label: '填单员' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '订单金额' },
          { key: 'status', label: '订单状态', tag: true }
        ]
      },
      {
        key: 'craftRecords',
        label: '工艺记录',
        columns: [
          { key: 'craftName', label: '工艺名称' },
          { key: 'productName', label: '产品名称' },
          { key: 'quantity', label: '数量' },
          { key: 'status', label: '工艺状态', tag: true }
        ]
      },
      {
        key: 'receiptRecords',
        label: '收款记录',
        columns: [
          { key: 'receiptNo', label: '收款单号' },
          { key: 'receiptTime', label: '收款时间' },
          { key: 'account', label: '收款账户' },
          { key: 'amount', label: '收款金额' },
          { key: 'operator', label: '操作人' }
        ]
      }
    ]
  },
  staff: {
    title: '人员管理',
    subtitle: '员工账号与岗位配置',
    createText: '添加',
    dialogWidth: '1080px',
    treeKey: 'department',
    treeTitle: '部门名称',
    treeData: [
      {
        label: '全部',
        value: '全部',
        children: []
      }
    ],
    searchFields: [
      { key: 'name', label: '人员姓名', type: 'input', placeholder: '请输入' },
      { key: 'phone', label: '联系方式', type: 'input', placeholder: '请输入' },
      {
        key: 'status',
        label: '用户状态',
        type: 'select',
        placeholder: '请选择',
        options: [
          { label: '启用', value: '启用' },
          { label: '禁用', value: '禁用' }
        ]
      }
    ],
    formFields: [
      { key: 'name', label: '姓名', type: 'input' },
      { key: 'gender', label: '性别', type: 'radio', options: ['男', '女'], defaultValue: '男' },
      { key: 'age', label: '年龄', type: 'number' },
      { key: 'phone', label: '联系方式（账号）', type: 'input' },
      { key: 'loginPassword', label: '登录密码', type: 'input' },
      { key: 'position', label: '职位', type: 'input' },
      { key: 'title', label: '职称', type: 'input' },
      { key: 'hireDate', label: '入职日期', type: 'date' },
      { key: 'department', label: '所属部门', type: 'select', options: [] },
      { key: 'jobNo', label: '工号', type: 'input' },
      {
        key: 'menuIdList',
        label: '角色',
        type: 'checkbox',
        options: ['业务员', '业务员（自动审批）', '生产员', '耗材记录员', '物流调度员', '物流司机']
      },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'userId', label: '用户id' },
      { key: 'name', label: '用户姓名' },
      { key: 'phone', label: '联系方式（账号）' },
      { key: 'department', label: '所在部门' },
      { key: 'roleText', label: '用户角色' },
      { key: 'status', label: '状态', switch: true }
    ],
    rowActions: ['重置密码', '编辑', '删除'],
    resetPasswordFields: [
      { key: 'password', label: '新密码', type: 'input' },
      { key: 'confirmPassword', label: '确认密码', type: 'input' }
    ]
  },
  organization: {
    title: '组织架构',
    subtitle: '部门层级与成员编排',
    createText: '添加',
    treeKey: 'name',
    treeTitle: '部门名称',
    treeData: [
      {
        label: '全部',
        value: '全部',
        children: []
      }
    ],
    searchFields: [
      { key: 'name', label: '部门名称', type: 'input' },
      { key: 'statusText', label: '状态', type: 'select', options: ['启用', '禁用'] }
    ],
    formFields: [
      { key: 'name', label: '部门名称', type: 'input' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'name', label: '部门名称' },
      { key: 'remark', label: '备注' },
      { key: 'status', label: '状态', switch: true }
    ],
    rowActions: ['编辑', '删除']
  },
  roles: {
    title: '角色管理',
    subtitle: '权限角色与菜单授权',
    createText: '添加',
    dialogWidth: '860px',
    searchFields: [
      { key: 'name', label: '角色名称', type: 'input' }
    ],
    formFields: [
      { key: 'name', label: '角色名称', type: 'input' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'name', label: '角色名称' },
      { key: 'remark', label: '备注' }
    ]
  },
  durationPurchases: {
    title: '购买时长',
    subtitle: '订阅时长与购买记录',
    createText: '购买',
    searchFields: [
      { key: 'tenantName', label: '单位名称', type: 'input' },
      { key: 'planName', label: '购买套餐', type: 'input' },
      { key: 'sales', label: '业务员', type: 'input' }
    ],
    formFields: [
      { key: 'tenantName', label: '单位名称', type: 'input' },
      { key: 'planName', label: '购买套餐', type: 'input' },
      { key: 'durationLabel', label: '有效时长', type: 'input' },
      { key: 'amount', label: '支付金额', type: 'number' },
      { key: 'originPrice', label: '原价', type: 'number' },
      { key: 'sales', label: '业务员', type: 'input' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'tenantName', label: '单位名称' },
      { key: 'planName', label: '购买套餐' },
      { key: 'durationLabel', label: '有效时长' },
      { key: 'amount', label: '支付金额' },
      { key: 'originPrice', label: '原价' },
      { key: 'sales', label: '业务员' },
      { key: 'updatedAt', label: '购买时间' }
    ]
  },
  materials: {
    title: '耗材信息',
    subtitle: '耗材档案与规格配置',
    createText: '添加',
    searchFields: [
      { key: 'name', label: '耗材名称', type: 'input' },
      { key: 'status', label: '状态', type: 'select', options: ['启用', '禁用'] }
    ],
    formFields: [
      { key: 'name', label: '耗材名称', type: 'input' },
      { key: 'unit', label: '单位', type: 'input' },
      { key: 'price', label: '耗材价值', type: 'number' },
      { key: 'remark', label: '备注', type: 'input' }
    ],
    columns: [
      { key: 'name', label: '耗材名称' },
      { key: 'unit', label: '单位' },
      { key: 'price', label: '耗材价值' },
      { key: 'remark', label: '备注' },
      { key: 'status', label: '状态', switch: true }
    ],
    rowActions: ['编辑', '删除']
  },
  materialStock: {
    title: '耗材库存',
    subtitle: '仓库库存与预警',
    createText: '',
    searchFields: [
      { key: 'name', label: '耗材名称', type: 'input' },
      { key: 'status', label: '状态', type: 'select', options: ['充足', '预警'] }
    ],
    formFields: [
      { key: 'name', label: '耗材名称', type: 'input' },
      { key: 'unit', label: '单位', type: 'input' },
      { key: 'price', label: '耗材价值', type: 'number' },
      { key: 'inbound', label: '入库数量', type: 'number' },
      { key: 'outbound', label: '出库数量', type: 'number' },
      { key: 'stock', label: '当前库存', type: 'number' },
      { key: 'cost', label: '耗材成本', type: 'number' },
      { key: 'status', label: '状态', type: 'select', options: ['充足', '预警'] }
    ],
    columns: [
      { key: 'name', label: '耗材名称' },
      { key: 'unit', label: '单位' },
      { key: 'price', label: '耗材价值' },
      { key: 'inbound', label: '入库数量' },
      { key: 'outbound', label: '出库数量' },
      { key: 'stock', label: '当前库存' },
      { key: 'cost', label: '耗材成本' }
    ],
    rowActions: ['明细']
  },
  materialDetails: {
    title: '耗材明细',
    subtitle: '出入库与订单消耗明细',
    createText: '添加',
    searchFields: [
      { key: 'name', label: '耗材名称', type: 'input' },
      { key: 'status', label: '状态', type: 'select', options: ['系统入库', '手工出库', '订单消耗'] },
      { key: 'orderNo', label: '关联订单', type: 'input' }
    ],
    formFields: [
      { key: 'name', label: '耗材名称', type: 'select', options: [] },
      { key: 'unit', label: '耗材单位', type: 'input' },
      { key: 'price', label: '耗材价值', type: 'number' },
      { key: 'type', label: '明细类型', type: 'radio', options: ['系统入库', '手工出库', '订单消耗'], defaultValue: '系统入库' },
      { key: 'quantity', label: '数量', type: 'number' },
      { key: 'imageRemark', label: '图片备注', type: 'file' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'name', label: '耗材名称' },
      { key: 'type', label: '明细类型', tag: true },
      { key: 'quantity', label: '数量', type: 'number' },
      { key: 'remark', label: '备注' },
      { key: 'orderNo', label: '关联订单' },
      { key: 'operator', label: '操作员' },
      { key: 'updatedAt', label: '操作时间' }
    ],
    rowActions: ['详情', '编辑', '删除']
  },
  craftStats: {
    title: '工艺统计',
    subtitle: '工艺产出汇总',
    createText: '导出',
    summaryText: '生产合计：10,034    待生产合计：120    已生产合计：9,810',
    searchFields: [
      { key: 'craftId', label: '工艺id', type: 'input', placeholder: '请输入' },
      { key: 'name', label: '工艺名称', type: 'input', placeholder: '请输入' },
      { key: 'time', label: '起始时间', type: 'input', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    formFields: [
      { key: 'craftId', label: '工艺id', type: 'input' },
      { key: 'name', label: '工艺名称', type: 'input' },
      { key: 'unit', label: '单位', type: 'input' },
      { key: 'count', label: '累计生产数', type: 'number' },
      { key: 'pending', label: '待生产数', type: 'number' },
      { key: 'completed', label: '已生产数', type: 'number' }
    ],
    columns: [
      { key: 'craftId', label: '工艺id' },
      { key: 'name', label: '工艺名称' },
      { key: 'unit', label: '单位' },
      { key: 'count', label: '累计生产数' },
      { key: 'pending', label: '待生产数' },
      { key: 'completed', label: '已生产数' }
    ],
    rowActions: []
  },
  craftPerformance: {
    title: '工艺绩效',
    subtitle: '个人与班组绩效统计',
    createText: '导出',
    searchFields: [
      { key: 'time', label: '时间', type: 'input', placeholder: 'xx-xx-xx至xx-xx-xx' },
      { key: 'customer', label: '客户名称', type: 'input', placeholder: '请输入' },
      { key: 'productName', label: '产品名称', type: 'input', placeholder: '请输入' },
      { key: 'department', label: '所在部门', type: 'select', placeholder: '请选择', options: ['生产部', '后道部', '外协部'] },
      { key: 'role', label: '用户角色', type: 'select', placeholder: '请选择', options: ['业务员', '生产员', '后道员'] }
    ],
    formFields: [
      { key: 'name', label: '人员姓名', type: 'input' },
      { key: 'customer', label: '客户名称', type: 'input' },
      { key: 'productName', label: '产品名称', type: 'input' },
      { key: 'bigMachine', label: '大机器', type: 'number' },
      { key: 'smallMachine', label: '小机器', type: 'number' },
      { key: 'film', label: '光膜', type: 'number' },
      { key: 'lamination', label: '哑膜', type: 'number' },
      { key: 'singleColor', label: '彩印-单面', type: 'number' },
      { key: 'plate', label: '彩印-扣版', type: 'number' },
      { key: 'bronzing', label: '烫金模切', type: 'number' },
      { key: 'total', label: '完成数合计', type: 'number' }
    ],
    columns: [
      { key: 'name', label: '人员姓名' },
      { key: 'customer', label: '客户名称' },
      { key: 'productName', label: '产品名称' },
      { key: 'bigMachine', label: '大机器' },
      { key: 'smallMachine', label: '小机器' },
      { key: 'film', label: '光膜' },
      { key: 'lamination', label: '哑膜' },
      { key: 'singleColor', label: '彩印-单面' },
      { key: 'plate', label: '彩印-扣版' },
      { key: 'bronzing', label: '烫金模切' },
      { key: 'total', label: '完成数合计' }
    ],
    rowActions: []
  },
  billingPerformance: {
    title: '开单绩效',
    subtitle: '业务员开单统计',
    createText: '导出',
    summaryText: '已完成订单数合计：914    已完成订单金额 合计：5,299',
    searchFields: [
      { key: 'time', label: '时间', type: 'input', placeholder: 'xx-xx-xx至xx-xx-xx' },
      { key: 'name', label: '人员姓名', type: 'input', placeholder: '请输入' },
      { key: 'phone', label: '联系方式', type: 'input', placeholder: '请输入' }
    ],
    formFields: [
      { key: 'name', label: '人员姓名', type: 'input' },
      { key: 'phone', label: '联系方式（账号）', type: 'input' },
      { key: 'completedOrders', label: '已完成订单数', type: 'number' },
      { key: 'amount', label: '已完成订单金额', type: 'number' }
    ],
    columns: [
      { key: 'name', label: '人员姓名' },
      { key: 'phone', label: '联系方式（账号）' },
      { key: 'completedOrders', label: '已完成订单数' },
      { key: 'amount', label: '已完成订单金额' }
    ],
    rowActions: []
  },
  deliveryPerformance: {
    title: '配送绩效',
    subtitle: '司机与配送完成统计',
    createText: '导出',
    summaryText: '待配送订单合计：914    已配送订单合计：5,299',
    searchFields: [
      { key: 'time', label: '时间', type: 'input', placeholder: 'xx-xx-xx至xx-xx-xx' },
      { key: 'name', label: '人员姓名', type: 'input', placeholder: '请输入' },
      { key: 'phone', label: '联系方式', type: 'input', placeholder: '请输入' }
    ],
    formFields: [
      { key: 'name', label: '人员姓名', type: 'input' },
      { key: 'phone', label: '联系方式（账号）', type: 'input' },
      { key: 'pendingOrders', label: '待配送订单', type: 'number' },
      { key: 'completedOrders', label: '已配送订单', type: 'number' }
    ],
    columns: [
      { key: 'name', label: '人员姓名' },
      { key: 'phone', label: '联系方式（账号）' },
      { key: 'pendingOrders', label: '待配送订单' },
      { key: 'completedOrders', label: '已配送订单' }
    ],
    rowActions: []
  },
  accounts: {
    title: '账户管理',
    subtitle: '公司账户与收支载体',
    createText: '添加',
    searchFields: [
      { key: 'name', label: '账户名称', type: 'input' },
      { key: 'accountNo', label: '卡号', type: 'input' },
      { key: 'bank', label: '开户行', type: 'input' },
      { key: 'status', label: '状态', type: 'select', options: ['启用', '禁用'] }
    ],
    formFields: [
      { key: 'name', label: '账户名称', type: 'input' },
      { key: 'accountNo', label: '卡号', type: 'input' },
      { key: 'bank', label: '开户行', type: 'input' },
      { key: 'type', label: '账户类型', type: 'select', options: ['微信', '支付宝', '公账'] },
      { key: 'balance', label: '账户金额', type: 'number' },
      { key: 'status', label: '状态', type: 'select', options: ['启用', '禁用'] },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'name', label: '账户名称' },
      { key: 'accountNo', label: '卡号' },
      { key: 'bank', label: '开户行' },
      { key: 'balance', label: '账户金额' },
      { key: 'status', label: '状态', switch: true }
    ],
    rowActions: ['编辑', '详情', '删除']
  },
  fundDetails: {
    title: '资金明细',
    subtitle: '收支流水与账户追踪',
    createText: '添加',
    secondaryActionText: '导出',
    summaryText: '收入合计：¥329,344.00    支出合计：¥129,344.00',
    searchFields: [
      { key: 'account', label: '账户名称', type: 'input' },
      { key: 'accountType', label: '账户类型', type: 'select', options: ['微信', '支付宝', '公账'] },
      { key: 'accountNo', label: '卡号', type: 'input' },
      { key: 'bank', label: '开户行', type: 'input' },
      { key: 'status', label: '状态', type: 'select', options: ['收入', '支出'] },
      { key: 'time', label: '起始时间', type: 'input' }
    ],
    formFields: [
      { key: 'time', label: '时间', type: 'input' },
      { key: 'bizNo', label: '单号', type: 'input' },
      { key: 'type', label: '类型', type: 'select', options: ['收入', '支出'] },
      { key: 'remark', label: '摘要', type: 'textarea' },
      { key: 'account', label: '账户名称', type: 'input' },
      { key: 'accountType', label: '账户类型', type: 'select', options: ['微信', '支付宝', '公账'] },
      { key: 'accountNo', label: '卡号', type: 'input' },
      { key: 'bank', label: '开户行', type: 'input' },
      { key: 'income', label: '收入金额', type: 'number' },
      { key: 'expense', label: '支出金额', type: 'number' },
      { key: 'balance', label: '余额', type: 'number' }
    ],
    columns: [
      { key: 'time', label: '时间' },
      { key: 'bizNo', label: '单号' },
      { key: 'type', label: '类型', tag: true },
      { key: 'remark', label: '摘要' },
      { key: 'account', label: '账户名称' },
      { key: 'income', label: '收入金额' },
      { key: 'expense', label: '支出金额' },
      { key: 'balance', label: '余额' }
    ],
    rowActions: ['详情', '删除']
  },
  receivableOrders: {
    title: '应收账款-订单明细',
    subtitle: '订单维度应收款追踪',
    createText: '添加',
    summaryText: '账单金额：¥329,344.00    已收金额：¥129,344.00    剩余尾款：¥200,000.00',
    searchFields: [
      { key: 'orderNo', label: '订单号', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'filler', label: '填单员', type: 'input' },
      { key: 'orderTime', label: '时间', type: 'input' }
    ],
    formFields: [
      { key: 'orderNo', label: '订单号', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'orderTime', label: '订单时间', type: 'input' },
      { key: 'filler', label: '填单员', type: 'input' },
      { key: 'productInfo', label: '产品信息', type: 'input' },
      { key: 'amount', label: '账单金额', type: 'number' },
      { key: 'received', label: '已收金额', type: 'number' },
      { key: 'unpaid', label: '剩余尾款', type: 'number' },
      { key: 'status', label: '订单状态', type: 'select', options: ['待生产', '生产中', '待配送', '配送中', '已完成'] },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'orderTime', label: '订单时间' },
      { key: 'filler', label: '填单员' },
      { key: 'productInfo', label: '产品信息' },
      { key: 'amount', label: '账单金额' },
      { key: 'received', label: '已收金额' },
      { key: 'unpaid', label: '剩余尾款' },
      { key: 'status', label: '订单状态', tag: true }
    ],
    rowActions: []
  },
  receivableUnits: {
    title: '应收账款-单位明细',
    subtitle: '单位维度欠款汇总',
    createText: '添加',
    summaryText: '账单金额：¥329,344.00    已收金额：¥129,344.00    剩余尾款：¥200,000.00',
    searchFields: [
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'contact', label: '联系人', type: 'input' },
      { key: 'sales', label: '业务员', type: 'input' }
    ],
    formFields: [
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'contact', label: '联系人', type: 'input' },
      { key: 'phone', label: '联系方式', type: 'input' },
      { key: 'sales', label: '业务员', type: 'input' },
      { key: 'amount', label: '账单金额', type: 'number' },
      { key: 'received', label: '已收金额', type: 'number' },
      { key: 'unpaid', label: '剩余尾款', type: 'number' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'customer', label: '单位名称' },
      { key: 'amount', label: '账单金额' },
      { key: 'received', label: '已收金额' },
      { key: 'unpaid', label: '剩余尾款' },
      { key: 'contact', label: '联系人' },
      { key: 'phone', label: '联系方式' },
      { key: 'sales', label: '业务员' },
    ],
    rowActions: ['详情']
  },
  manualRecords: {
    title: '手工记录',
    subtitle: '异常工时与手工补录',
    createText: '添加',
    secondaryActionText: '导出',
    searchFields: [
      { key: 'name', label: '手工名称', type: 'input' },
      { key: 'orderNo', label: '关联订单', type: 'input' },
      { key: 'operator', label: '操作员', type: 'input' }
    ],
    formFields: [
      { key: 'name', label: '手工名称', type: 'input' },
      { key: 'orderId', label: '关联订单ID', type: 'input' },
      { key: 'quantity', label: '数量', type: 'number' },
      { key: 'imageRemark', label: '图片备注', type: 'file' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'name', label: '手工名称' },
      { key: 'quantity', label: '数量' },
      { key: 'remark', label: '备注' },
      { key: 'orderNo', label: '关联订单' },
      { key: 'operator', label: '操作员' },
      { key: 'updatedAt', label: '操作时间' }
    ],
    rowActions: ['详情', '编辑', '删除']
  },
  reimbursements: {
    title: '报销列表',
    subtitle: '报销申请与审批记录',
    createText: '添加',
    secondaryActionText: '导出',
    summaryText: '报销合计：¥29,344.00    折让合计：¥144.00',
    detailDialogWidth: '1280px',
    detailFooterActions: ['编辑', '打印'],
    detailSummaryText: '报销合计：¥1,200.00    折让合计：¥10.00',
    searchFields: [
      { key: 'name', label: '报销单号', type: 'input', placeholder: '边输边搜' },
      { key: 'applicant', label: '报销人', type: 'input', placeholder: '边输边搜' },
      { key: 'account', label: '报销账户', type: 'select', placeholder: '请选择', options: ['微信', '支付宝', '公账'] },
      { key: 'status', label: '报销状态', type: 'select', placeholder: '请选择', options: ['待审批', '已通过', '已驳回'] },
      { key: 'updatedAt', label: '起始时间', type: 'input', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    formFields: [
      { key: 'name', label: '报销单号', type: 'input' },
      { key: 'applicant', label: '报销人', type: 'picker', picker: 'applicant', placeholder: '请选择报销人' },
      { key: 'account', label: '报销账户', type: 'picker', picker: 'account', placeholder: '请选择报销账户' },
      { key: 'updatedAt', label: '报销时间', type: 'input' },
      { key: 'status', label: '状态', type: 'select', options: ['待审批', '已通过', '已驳回'] },
      { key: 'amount', label: '金额', type: 'number' },
      { key: 'discount', label: '折让', type: 'number' },
      { key: 'remark', label: '摘要', type: 'textarea' }
    ],
    columns: [
      { key: 'name', label: '报销单号' },
      { key: 'applicant', label: '报销人' },
      { key: 'updatedAt', label: '报销时间' },
      { key: 'account', label: '报销账户' },
      { key: 'amount', label: '金额' },
      { key: 'discount', label: '折让' },
      { key: 'remark', label: '摘要' },
      { key: 'status', label: '报销状态', tag: true }
    ],
    detailSections: [
      {
        title: '报销信息',
        fields: [
          { key: 'name', label: '报销单号' },
          { key: 'updatedAt', label: '报销时间' },
          { key: 'amount', label: '报销金额' },
          { key: 'remark', label: '摘要' },
          { key: 'account', label: '报销账户' },
          { key: 'discount', label: '折让金额' },
          { key: 'applicant', label: '操作员' },
          { key: 'updatedAt2', label: '操作时间' }
        ]
      }
    ],
    pickers: {
      applicant: {
        title: '选择报销人',
        dataKey: 'applicantRow',
        source: 'staff',
        displayKey: 'name',
        multiple: false,
        searchable: [
          { key: 'name', label: '人员姓名', placeholder: '请输入' },
          { key: 'phone', label: '联系方式', placeholder: '请输入' }
        ],
        columns: [
          { key: 'name', label: '用户姓名' },
          { key: 'phone', label: '联系方式' },
          { key: 'department', label: '所在部门' },
          { key: 'roleText', label: '用户角色' }
        ]
      },
      account: {
        title: '选择账户',
        dataKey: 'accountRow',
        source: 'accounts',
        displayKey: 'name',
        multiple: false,
        searchable: [
          { key: 'name', label: '账户名称', placeholder: '请输入' },
          { key: 'accountNo', label: '卡号', placeholder: '请输入' }
        ],
        columns: [
          { key: 'name', label: '账户名称' },
          { key: 'type', label: '账户类型' },
          { key: 'accountNo', label: '卡号' },
          { key: 'bank', label: '开户行' }
        ]
      }
    },
    rowActions: ['打印', '编辑', '详情', '删除']
  },
  receipts: {
    title: '收款信息',
    subtitle: '收款登记与回款追踪',
    createText: '添加',
    secondaryActionText: '导出',
    summaryText: '收款合计：¥29,344.00    折让合计：¥144.00',
    detailDialogWidth: '1280px',
    detailFooterActions: ['编辑', '打印'],
    detailSummaryText: '收款合计：¥1,200.00    折让合计：¥10.00',
    searchFields: [
      { key: 'receiptNo', label: '收款单号', type: 'input', placeholder: '边输边搜' },
      { key: 'customer', label: '单位名称', type: 'input', placeholder: '边输边搜' },
      { key: 'collector', label: '收款人', type: 'input', placeholder: '边输边搜' },
      { key: 'account', label: '收款账户', type: 'select', placeholder: '请选择', options: ['微信', '支付宝', '公账'] },
      { key: 'updatedAt', label: '起始时间', type: 'input', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    formFields: [
      { key: 'receiptNo', label: '收款单号', type: 'input' },
      { key: 'orderInfo', label: '订单信息', type: 'picker', picker: 'receiptOrder', placeholder: '请选择订单' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'updatedAt', label: '收款时间', type: 'input' },
      { key: 'collector', label: '收款人', type: 'picker', picker: 'collector', placeholder: '请选择收款人' },
      { key: 'account', label: '收款账户', type: 'picker', picker: 'account', placeholder: '请选择收款账户' },
      { key: 'amount', label: '收款金额', type: 'number' },
      { key: 'discount', label: '折让', type: 'number' },
      { key: 'remark', label: '摘要', type: 'textarea' }
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
    detailSections: [
      {
        title: '收款信息',
        fields: [
          { key: 'receiptNo', label: '收款单号' },
          { key: 'updatedAt', label: '收款时间' },
          { key: 'amount', label: '收款金额' },
          { key: 'remark', label: '摘要' },
          { key: 'customer', label: '单位名称' },
          { key: 'account', label: '收款账户' },
          { key: 'discount', label: '折让金额' },
          { key: 'operator', label: '操作员' },
          { key: 'operationTime', label: '操作时间' }
        ]
      },
      {
        title: '收款明细',
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
    pickers: {
      collector: {
        title: '选择收款人',
        dataKey: 'collectorRow',
        source: 'staff',
        displayKey: 'name',
        multiple: false,
        searchable: [
          { key: 'name', label: '人员姓名', placeholder: '请输入' },
          { key: 'phone', label: '联系方式', placeholder: '请输入' }
        ],
        columns: [
          { key: 'name', label: '用户姓名' },
          { key: 'phone', label: '联系方式' },
          { key: 'department', label: '所在部门' },
          { key: 'roleText', label: '用户角色' }
        ]
      },
      account: {
        title: '选择账户',
        dataKey: 'accountRow',
        source: 'accounts',
        displayKey: 'name',
        multiple: false,
        searchable: [
          { key: 'name', label: '账户名称', placeholder: '请输入' },
          { key: 'accountNo', label: '卡号', placeholder: '请输入' }
        ],
        columns: [
          { key: 'name', label: '账户名称' },
          { key: 'type', label: '账户类型' },
          { key: 'accountNo', label: '卡号' },
          { key: 'bank', label: '开户行' }
        ]
      },
      receiptOrder: {
        title: '选择订单',
        source: 'receivableOrders',
        dataKey: 'receiptOrders',
        multiple: true,
        searchable: [
          { key: 'orderNo', label: '订单号', placeholder: '请输入' },
          { key: 'customer', label: '单位名称', placeholder: '请输入' }
        ],
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'orderTime', label: '订单时间' },
          { key: 'filler', label: '填单员' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '账单金额' },
          { key: 'received', label: '已收金额' },
          { key: 'unpaid', label: '剩余尾款' },
          { key: 'status', label: '订单状态', tag: true }
        ]
      }
    },
    rowActions: ['打印', '编辑', '详情', '删除']
  },
  productCrafts: {
    title: '产品工艺',
    subtitle: '产品生产工艺跟进',
    createText: '导出',
    summaryText: '待生产：29    已生产：2459    客户金额：¥29,344.00',
    detailDialogWidth: '1280px',
    detailStatusKey: 'status',
    searchFields: [
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'productName', label: '产品名称', type: 'input' },
      { key: 'craftName', label: '工艺名称', type: 'input' },
      { key: 'orderNo', label: '所属订单号', type: 'input' },
      { key: 'orderTime', label: '起始时间', type: 'input' }
    ],
    formFields: [
      { key: 'orderNo', label: '所属订单号', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'orderTime', label: '订单时间', type: 'input' },
      { key: 'productInfo', label: '产品信息', type: 'input' },
      { key: 'quantity', label: '产品数量', type: 'number' },
      { key: 'craftName', label: '工艺名称', type: 'input' },
      { key: 'remark', label: '备注', type: 'input' },
      { key: 'unitPrice', label: '产品单价', type: 'number' },
      { key: 'amount', label: '客户金额', type: 'number' },
      { key: 'status', label: '工艺状态', type: 'select', options: ['待生产', '已生产'] },
      { key: 'operator', label: '操作员', type: 'input' },
      { key: 'detailNote', label: '补充说明', type: 'textarea' }
    ],
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'orderTime', label: '订单时间' },
      { key: 'productInfo', label: '产品信息' },
      { key: 'quantity', label: '产品数量' },
      { key: 'craftName', label: '工艺名称' },
      { key: 'remark', label: '备注' },
      { key: 'unitPrice', label: '产品单价' },
      { key: 'amount', label: '客户金额' },
      { key: 'status', label: '工艺状态', tag: true },
      { key: 'operator', label: '操作员' }
    ],
    detailSections: [
      {
        title: '工艺信息',
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
        fields: [
          { key: 'operator', label: '操作员' },
          { key: 'productionTime', label: '操作时间' },
          { key: 'productionRemark', label: '备注' },
          { key: 'imageNote', label: '图片备注' }
        ]
      }
    ],
    rowActions: ['详情']
  },
  productCraftsOutsource: {
    title: '产品工艺-外协',
    subtitle: '外协工艺跟进',
    createText: '导出',
    summaryText: '待生产：29    已生产：2459    客户金额：¥29,344.00',
    detailDialogWidth: '1280px',
    detailStatusKey: 'status',
    searchFields: [
      { key: 'transferUnit', label: '转单单位', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'productName', label: '产品名称', type: 'input' },
      { key: 'craftName', label: '工艺名称', type: 'input' },
      { key: 'orderNo', label: '所属订单号', type: 'input' },
      { key: 'orderTime', label: '起始时间', type: 'input' }
    ],
    formFields: [
      { key: 'orderNo', label: '所属订单号', type: 'input' },
      { key: 'transferUnit', label: '转单单位', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'orderTime', label: '订单时间', type: 'input' },
      { key: 'productInfo', label: '产品信息', type: 'input' },
      { key: 'quantity', label: '产品数量', type: 'number' },
      { key: 'craftName', label: '工艺名称', type: 'input' },
      { key: 'remark', label: '备注', type: 'input' },
      { key: 'unitPrice', label: '产品单价', type: 'number' },
      { key: 'amount', label: '客户金额', type: 'number' },
      { key: 'status', label: '工艺状态', type: 'select', options: ['待生产', '已生产'] },
      { key: 'operator', label: '操作员', type: 'input' }
    ],
    columns: [
      { key: 'orderNo', label: '所属订单号' },
      { key: 'transferUnit', label: '转单单位' },
      { key: 'customer', label: '单位名称' },
      { key: 'orderTime', label: '订单时间' },
      { key: 'productInfo', label: '产品信息' },
      { key: 'quantity', label: '产品数量' },
      { key: 'craftName', label: '工艺名称' },
      { key: 'remark', label: '备注' },
      { key: 'unitPrice', label: '产品单价' },
      { key: 'amount', label: '客户金额' },
      { key: 'status', label: '工艺状态', tag: true },
      { key: 'operator', label: '操作员' }
    ],
    detailSections: [
      {
        title: '外协工艺信息',
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
        fields: [
          { key: 'orderNo', label: '订单号' },
          { key: 'transferUnit', label: '转单单位' },
          { key: 'customer', label: '单位名称' },
          { key: 'contact', label: '联系人' },
          { key: 'phone', label: '联系方式' },
          { key: 'deliveryAddress', label: '送货地址' },
          { key: 'deliveryDate', label: '交货日期' },
          { key: 'deliveryType', label: '交货方式' },
          { key: 'remark', label: '备注' }
        ]
      },
      {
        title: '生产记录',
        fields: [
          { key: 'operator', label: '操作员' },
          { key: 'productionTime', label: '操作时间' },
          { key: 'productionRemark', label: '备注' },
          { key: 'imageNote', label: '图片备注' }
        ]
      }
    ],
    rowActions: ['详情']
  },
  outsourceIncoming: {
    title: '外协订单-转入的',
    subtitle: '外协转入订单管理',
    createText: '添加',
    detailDialogWidth: '1280px',
    detailStatusKey: 'status',
    searchFields: [
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'supplier', label: '接单单位', type: 'input' },
      { key: 'sales', label: '业务员', type: 'input' },
      { key: 'orderNo', label: '订单号', type: 'input' },
      { key: 'status', label: '订单状态', type: 'select', options: ['待生产', '生产中', '待配送', '配送中', '已完成'] },
      { key: 'updatedAt', label: '订单时间', type: 'input' }
    ],
    formFields: [
      { key: 'orderNo', label: '订单号', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'updatedAt', label: '订单时间', type: 'input' },
      { key: 'supplier', label: '转单单位', type: 'input' },
      { key: 'craft', label: '产品信息', type: 'input' },
      { key: 'amount', label: '订单金额', type: 'number' },
      { key: 'status', label: '订单状态', type: 'select', options: ['待生产', '生产中', '待配送', '配送中', '已完成'] },
      { key: 'sales', label: '业务员', type: 'input' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'updatedAt', label: '订单时间' },
      { key: 'sales', label: '业务员' },
      { key: 'supplier', label: '接单单位' },
      { key: 'craft', label: '产品信息' },
      { key: 'amount', label: '订单金额' },
      { key: 'status', label: '订单状态', tag: true }
    ],
    detailSections: [
      {
        title: '订单信息',
        dataKey: 'orderRows',
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'orderTime', label: '订单时间' },
          { key: 'sales', label: '业务员' },
          { key: 'supplier', label: '接单单位' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '订单金额' },
          { key: 'status', label: '订单状态', tag: true }
        ]
      },
      {
        title: '单位信息',
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
        timelineKey: 'flowTimeline'
      }
    ],
    rowActions: ['详情', '打印']
  },
  outsourceOutgoing: {
    title: '外协订单-转出的',
    subtitle: '外协转出订单管理',
    createText: '添加',
    detailDialogWidth: '1280px',
    detailStatusKey: 'status',
    searchFields: [
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'supplier', label: '接单单位', type: 'input' },
      { key: 'sales', label: '业务员', type: 'input' },
      { key: 'orderNo', label: '订单号', type: 'input' },
      { key: 'status', label: '订单状态', type: 'select', options: ['待生产', '生产中', '待配送', '配送中', '已完成'] },
      { key: 'updatedAt', label: '订单时间', type: 'input' }
    ],
    formFields: [
      { key: 'orderNo', label: '订单号', type: 'input' },
      { key: 'customer', label: '单位名称', type: 'input' },
      { key: 'updatedAt', label: '订单时间', type: 'input' },
      { key: 'supplier', label: '接单单位', type: 'input' },
      { key: 'craft', label: '产品信息', type: 'input' },
      { key: 'amount', label: '订单金额', type: 'number' },
      { key: 'status', label: '订单状态', type: 'select', options: ['待生产', '生产中', '待配送', '配送中', '已完成'] },
      { key: 'sales', label: '业务员', type: 'input' },
      { key: 'remark', label: '备注', type: 'textarea' }
    ],
    columns: [
      { key: 'orderNo', label: '订单号' },
      { key: 'customer', label: '单位名称' },
      { key: 'updatedAt', label: '订单时间' },
      { key: 'sales', label: '业务员' },
      { key: 'supplier', label: '接单单位' },
      { key: 'craft', label: '产品信息' },
      { key: 'amount', label: '订单金额' },
      { key: 'status', label: '订单状态', tag: true }
    ],
    detailSections: [
      {
        title: '订单信息',
        dataKey: 'orderRows',
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'orderTime', label: '订单时间' },
          { key: 'sales', label: '业务员' },
          { key: 'supplier', label: '接单单位' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '订单金额' },
          { key: 'status', label: '订单状态', tag: true }
        ]
      },
      {
        title: '单位信息',
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
        timelineKey: 'flowTimeline'
      }
    ],
    rowActions: ['详情']
  },
  deliveryNotes: {
    title: '配送单',
    subtitle: '配送任务与司机安排',
    createText: '添加',
    footerHint: '',
    detailDialogWidth: '1280px',
    detailStatusKey: 'status',
    searchFields: [
      { key: 'deliveryNo', label: '配送单号', type: 'input', placeholder: '请输入' },
      { key: 'filler', label: '填单员', type: 'input', placeholder: '请输入' },
      { key: 'orderInfo', label: '订单信息', type: 'input', placeholder: '请输入' },
      { key: 'driver', label: '配送员', type: 'input', placeholder: '请输入' },
      { key: 'status', label: '配送状态', type: 'select', placeholder: '请选择', options: ['待配送', '配送中', '已完成'] },
      { key: 'createdAt', label: '创建时间', type: 'input', placeholder: 'xx-xx-xx至xx-xx-xx' }
    ],
    formFields: [
      { key: 'deliveryNo', label: '配送单号', type: 'input' },
      { key: 'filler', label: '填单员', type: 'input' },
      { key: 'orderInfo', label: '订单信息', type: 'picker', picker: 'deliveryOrder', placeholder: '请选择订单' },
      { key: 'driver', label: '配送员', type: 'picker', picker: 'driver', placeholder: '请选择司机' },
      { key: 'progress', label: '配送进度', type: 'input' },
      { key: 'status', label: '配送状态', type: 'select', options: ['待配送', '配送中', '已完成'] },
      { key: 'createdAt', label: '创建时间', type: 'input' },
      { key: 'remark', label: '备注', type: 'textarea' }
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
    detailSections: [
      {
        title: '订单信息',
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
        timelineKey: 'deliveryTimeline'
      }
    ],
    pickers: {
      driver: {
        title: '选择司机',
        dataKey: 'driverRows',
        multiple: false,
        searchable: [
          { key: 'name', label: '人员姓名', placeholder: '请输入' },
          { key: 'phone', label: '联系方式', placeholder: '请输入' }
        ],
        columns: [
          { key: 'name', label: '用户姓名' },
          { key: 'phone', label: '联系方式' },
          { key: 'department', label: '所在部门' },
          { key: 'roleText', label: '用户角色' }
        ]
      },
      deliveryOrder: {
        title: '选择订单',
        dataKey: 'deliveryOrders',
        multiple: true,
        searchable: [
          { key: 'orderNo', label: '订单号', placeholder: '请输入' },
          { key: 'customer', label: '单位名称', placeholder: '请输入' }
        ],
        columns: [
          { key: 'orderNo', label: '订单号' },
          { key: 'customer', label: '单位名称' },
          { key: 'orderTime', label: '订单时间' },
          { key: 'filler', label: '填单员' },
          { key: 'productInfo', label: '产品信息' },
          { key: 'amount', label: '订单金额' },
          { key: 'status', label: '订单状态', tag: true }
        ]
      }
    },
    rowActions: ['详情', '编辑', '删除']
  }
}

export const crudRoutes = [
  { path: 'customers', name: 'customers', key: 'customers', title: '合作客户' },
  { path: 'staff', name: 'staff', key: 'staff', title: '人员管理' },
  { path: 'organization', name: 'organization', key: 'organization', title: '组织架构' },
  { path: 'roles', name: 'roles', key: 'roles', title: '角色管理' },
  { path: 'duration-purchases', name: 'durationPurchases', key: 'durationPurchases', title: '购买时长' },
  { path: 'materials', name: 'materials', key: 'materials', title: '耗材信息' },
  { path: 'material-stock', name: 'materialStock', key: 'materialStock', title: '耗材库存' },
  { path: 'material-details', name: 'materialDetails', key: 'materialDetails', title: '耗材明细' },
  { path: 'craft-stats', name: 'craftStats', key: 'craftStats', title: '工艺统计' },
  { path: 'craft-performance', name: 'craftPerformance', key: 'craftPerformance', title: '工艺绩效' },
  { path: 'billing-performance', name: 'billingPerformance', key: 'billingPerformance', title: '开单绩效' },
  { path: 'delivery-performance', name: 'deliveryPerformance', key: 'deliveryPerformance', title: '配送绩效' },
  { path: 'accounts', name: 'accounts', key: 'accounts', title: '账户列表' },
  { path: 'fund-details', name: 'fundDetails', key: 'fundDetails', title: '资金明细' },
  { path: 'receivable-orders', name: 'receivableOrders', key: 'receivableOrders', title: '应收账款-订单明细' },
  { path: 'receivable-units', name: 'receivableUnits', key: 'receivableUnits', title: '应收账款-单位明细' },
  { path: 'manual-records', name: 'manualRecords', key: 'manualRecords', title: '手工记录' },
  { path: 'reimbursements', name: 'reimbursements', key: 'reimbursements', title: '报销列表' },
  { path: 'receipts', name: 'receipts', key: 'receipts', title: '收款信息' },
  { path: 'product-crafts', name: 'productCrafts', key: 'productCrafts', title: '产品工艺' },
  { path: 'product-crafts-outsource', name: 'productCraftsOutsource', key: 'productCraftsOutsource', title: '产品工艺-外协' },
  { path: 'outsource-incoming', name: 'outsourceIncoming', key: 'outsourceIncoming', title: '外协订单-转入的' },
  { path: 'outsource-outgoing', name: 'outsourceOutgoing', key: 'outsourceOutgoing', title: '外协订单-转出的' },
  { path: 'delivery-notes', name: 'deliveryNotes', key: 'deliveryNotes', title: '配送单' }
]
