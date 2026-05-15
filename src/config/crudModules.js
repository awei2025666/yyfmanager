export const crudModuleConfigs = {
  customers: {
    title: '合作客户',
    subtitle: '客户档案与往来管理',
    createText: '添加',
    secondaryActionText: '导出',
    dialogWidth: '920px',
    searchFields: [
      { key: 'name', label: '单位名称', type: 'input' },
      { key: 'sales', label: '业务员', type: 'input' },
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
      { key: 'sales', label: '业务员', type: 'input' },
      { key: 'payAccount', label: '收款账户', type: 'select', options: ['微信', '支付宝', '建设银行基本户'] },
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
        children: [
          { label: '业务部', value: '业务部' },
          { label: '生产部', value: '生产部' },
          { label: '运输部', value: '运输部' },
          { label: '管理部', value: '管理部' }
        ]
      }
    ],
    searchFields: [
      { key: 'name', label: '人员姓名', type: 'input' },
      { key: 'phone', label: '联系方式', type: 'input' },
      {
        key: 'status',
        label: '用户状态',
        type: 'select',
        options: [
          { label: '启用', value: '启用' },
          { label: '禁用', value: '禁用' }
        ]
      }
    ],
    formFields: [
      { key: 'name', label: '姓名', type: 'input' },
      { key: 'gender', label: '性别', type: 'radio', options: ['男', '女'] },
      { key: 'age', label: '年龄', type: 'number' },
      { key: 'phone', label: '联系方式（账号）', type: 'input' },
      { key: 'loginPassword', label: '登录密码', type: 'input' },
      { key: 'position', label: '职位', type: 'input' },
      { key: 'title', label: '职称', type: 'input' },
      { key: 'jobNo', label: '工号', type: 'input' },
      { key: 'hireDate', label: '入职日期', type: 'date' },
      { key: 'department', label: '所属部门', type: 'select', options: ['业务部', '生产部', '运输部', '管理部'] },
      {
        key: 'role',
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
    treeKey: 'group',
    treeTitle: '部门名称',
    treeData: [
      {
        label: '全部',
        value: '全部',
        children: [
          { label: '业务部', value: '业务部' },
          { label: '生产部', value: '生产部' },
          { label: '运输部', value: '运输部' },
          { label: '管理部', value: '管理部' }
        ]
      }
    ],
    searchFields: [
      { key: 'name', label: '部门名称', type: 'input' },
      { key: 'statusText', label: '状态', type: 'select', options: ['启用', '禁用'] }
    ],
    formFields: [
      { key: 'name', label: '部门名称', type: 'input' },
      { key: 'remark', label: '备注', type: 'textarea' },
      { key: 'status', label: '状态', type: 'select', options: ['启用', '禁用'] }
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
      { key: 'remark', label: '备注', type: 'input' },
      { key: 'status', label: '状态', type: 'select', options: ['启用', '禁用'] },
      { key: 'detailNote', label: '补充说明', type: 'textarea' }
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
    createText: '添加',
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
    rowActions: ['详情']
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
      { key: 'name', label: '耗材名称', type: 'input' },
      { key: 'type', label: '明细类型', type: 'select', options: ['系统入库', '手工出库', '订单消耗'] },
      { key: 'quantity', label: '数量', type: 'number' },
      { key: 'remark', label: '备注', type: 'input' },
      { key: 'orderNo', label: '关联订单', type: 'input' },
      { key: 'operator', label: '操作员', type: 'input' },
      { key: 'updatedAt', label: '操作时间', type: 'input' },
      { key: 'status', label: '状态', type: 'select', options: ['系统入库', '手工出库', '订单消耗'] },
      { key: 'detailNote', label: '补充说明', type: 'textarea' }
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
      { key: 'craftId', label: '工艺id', type: 'input' },
      { key: 'name', label: '工艺名称', type: 'input' },
      { key: 'time', label: '起始时间', type: 'input' }
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
      { key: 'time', label: '时间', type: 'input' },
      { key: 'customer', label: '客户名称', type: 'input' },
      { key: 'productName', label: '产品名称', type: 'input' },
      { key: 'department', label: '所在部门', type: 'select', options: ['生产部', '后道部', '外协部'] },
      { key: 'role', label: '用户角色', type: 'select', options: ['业务员', '生产员', '后道员'] }
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
      { key: 'time', label: '时间', type: 'input' },
      { key: 'name', label: '人员姓名', type: 'input' },
      { key: 'phone', label: '联系方式', type: 'input' }
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
      { key: 'time', label: '时间', type: 'input' },
      { key: 'name', label: '人员姓名', type: 'input' },
      { key: 'phone', label: '联系方式', type: 'input' }
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
    title: '账户列表',
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
    rowActions: ['详情']
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
      { key: 'quantity', label: '数量', type: 'number' },
      { key: 'remark', label: '备注', type: 'input' },
      { key: 'orderNo', label: '关联订单', type: 'input' },
      { key: 'operator', label: '操作员', type: 'input' },
      { key: 'updatedAt', label: '操作时间', type: 'input' }
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
    footerHint: '待配送量：459    已配送量：2155',
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

const timestamp = ['2026-04-20 09:12', '2026-04-20 10:24', '2026-04-19 16:03', '2026-04-18 18:45']

export const crudModuleSeeds = {
  customers: [
    {
      id: 1,
      name: '成都龙泉驿古月良品广告',
      fullName: '成都龙泉驿古月良品广告有限公司',
      contact: '丽丽',
      phone: '15575124085',
      address: '四川省成都市龙泉驿区万源路317号',
      customerType: '现结客户',
      sales: '李耀华',
      payAccount: '微信',
      operator: '丽丽',
      operationTime: '2026-04-01 12:00:09',
      createdAt: '2026-03-30 12:03:01',
      remark: '无',
      orderRecords: [
        { orderNo: '20260329001', orderTime: '2024-12-13 04:15', filler: '杨静云', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥12,394.00', status: '已驳回' },
        { orderNo: '20260329002', orderTime: '2024-12-13 04:15', filler: '杨静云', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥12,394.00', status: '待审批' },
        { orderNo: '20260329003', orderTime: '2024-12-13 04:15', filler: '傅彭薄', productInfo: '国学经典智慧封面', amount: '¥590.00', status: '待生产' }
      ],
      craftRecords: [
        { craftName: '四色印刷', productName: '西藏自治区全民科学素质工作材料汇编', quantity: '2000张', status: '待生产' },
        { craftName: '双面印刷', productName: '国学经典智慧封面', quantity: '1000张', status: '已生产' }
      ],
      receiptRecords: [
        { receiptNo: 'SK20260401001', receiptTime: '2026-04-01 12:00:09', account: '微信', amount: '¥2,000.00', operator: '丽丽' }
      ],
      updatedAt: timestamp[0]
    },
    {
      id: 2,
      name: '成都舞美租兑广告',
      fullName: '成都舞美租兑广告有限公司',
      contact: '赵雨',
      phone: '19113212388',
      address: '四川省成都市武侯区百吉街23号附1号',
      customerType: '现结客户',
      sales: '傅彭薄',
      payAccount: '支付宝',
      operator: '赵雨',
      operationTime: '2026-04-02 09:44:12',
      createdAt: '2026-03-30 09:44:12',
      remark: '即时结算',
      orderRecords: [],
      craftRecords: [],
      receiptRecords: [],
      updatedAt: timestamp[1]
    },
    {
      id: 3,
      name: '成都中永印务',
      fullName: '成都中永印务有限公司',
      contact: '李天泽',
      phone: '19333312231',
      address: '成都市彭州市天府东路369号',
      customerType: '供应商',
      sales: '纪广',
      payAccount: '建设银行基本户',
      operator: '纪广',
      operationTime: '2026-03-29 14:24:41',
      createdAt: '2026-03-29 14:24:41',
      remark: '',
      orderRecords: [],
      craftRecords: [],
      receiptRecords: [],
      updatedAt: timestamp[2]
    }
  ],
  staff: [
    { id: 1, userId: 6886, name: '龙慧', gender: '男', age: 29, phone: '19876782134', loginPassword: '123456', position: '业务经理', title: '主管', jobNo: 'YG6886', hireDate: '2024-06-01', department: '生产部', role: ['业务员'], roleText: '业务员', status: true, remark: '', updatedAt: timestamp[0] },
    { id: 2, userId: 6898, name: '王泽', gender: '男', age: 31, phone: '19578012123', loginPassword: '123456', position: '车间主任', title: '班组长', jobNo: 'YG6898', hireDate: '2024-05-10', department: '生产部', role: ['生产员'], roleText: '生产员', status: true, remark: '', updatedAt: timestamp[1] },
    { id: 3, userId: 8165, name: '胡允', gender: '男', age: 35, phone: '19113212388', loginPassword: '123456', position: '调度主管', title: '主管', jobNo: 'YG8165', hireDate: '2024-03-18', department: '管理部', role: ['物流调度员', '物流司机'], roleText: '物流调度员、物流司机', status: false, remark: '', updatedAt: timestamp[2] }
  ],
  organization: [
    { id: 1, group: '管理部', name: '运营部', remark: '无', status: true, statusText: '启用', updatedAt: timestamp[0] },
    { id: 2, group: '管理部', name: '维修部', remark: '无', status: true, statusText: '启用', updatedAt: timestamp[1] },
    { id: 3, group: '管理部', name: '管理部', remark: '无', status: false, statusText: '禁用', updatedAt: timestamp[2] }
  ],
  roles: [
    { id: 1, name: '业务员', remark: '负责订单开单', updatedAt: timestamp[0] },
    { id: 2, name: '业务员（带自动审批）', remark: '负责订单开单，可选择自动审批模式', updatedAt: timestamp[1] },
    { id: 3, name: '耗材记录员', remark: '负责记录订单中所消耗的耗材', updatedAt: timestamp[2] },
    { id: 4, name: '生产员', remark: '负责完成生产工艺', updatedAt: timestamp[3] },
    { id: 5, name: '物流调度员', remark: '负责分配配送订单', updatedAt: timestamp[0] },
    { id: 6, name: '物流司机', remark: '负责配送与运输货物', updatedAt: timestamp[1] },
    { id: 7, name: '总经理', remark: '拥有小程序所有权限', updatedAt: timestamp[2] }
  ],
  durationPurchases: [
    { id: 1, tenantName: '成都龙泉驿古月良品广告', planName: '月卡', durationLabel: '有效时长30天', amount: '¥100.00', originPrice: '¥100.00', sales: '杨静云', remark: '', updatedAt: timestamp[0] },
    { id: 2, tenantName: '成都舞美租兑广告', planName: '季卡', durationLabel: '有效时长120天', amount: '¥300.00', originPrice: '¥300.00', sales: '傅彭薄', remark: '', updatedAt: timestamp[1] },
    { id: 3, tenantName: '成都中永印务', planName: '年卡', durationLabel: '有效时长365天', amount: '¥700.00', originPrice: '¥700.00', sales: '纪广', remark: '', updatedAt: timestamp[2] }
  ],
  materials: [
    { id: 1, name: '纸箱', unit: '个', price: '¥10.00', status: true, remark: '--', detailNote: '', updatedAt: timestamp[0] },
    { id: 2, name: '胶水', unit: '个', price: '¥4.00', status: true, remark: '日用品', detailNote: '', updatedAt: timestamp[1] },
    { id: 3, name: '胶带', unit: '个', price: '¥2.00', status: false, remark: '日用品', detailNote: '', updatedAt: timestamp[2] }
  ],
  materialStock: [
    { id: 1, name: '纸箱', unit: '个', price: '¥10.00', inbound: 1000, outbound: 200, stock: 800, cost: '¥1,119.00', status: '充足', updatedAt: timestamp[0] },
    { id: 2, name: '胶水', unit: '个', price: '¥4.00', inbound: 1000, outbound: 200, stock: 800, cost: '¥1,119.00', status: '充足', updatedAt: timestamp[1] },
    { id: 3, name: '胶带', unit: '个', price: '¥2.00', inbound: 1000, outbound: 200, stock: 800, cost: '¥1,119.00', status: '预警', updatedAt: timestamp[2] }
  ],
  materialDetails: [
    { id: 1, name: '纸箱', type: '系统入库', status: '系统入库', orderNo: '--', quantity: 38, operator: '王漫', remark: '--', detailNote: '', updatedAt: '2026-04-01 12:00:00' },
    { id: 2, name: '胶水', type: '手工出库', status: '手工出库', orderNo: '--', quantity: 52, operator: '张三', remark: '办公使用', detailNote: '', updatedAt: '2026-04-01 12:00:00' },
    { id: 3, name: '胶带', type: '订单消耗', status: '订单消耗', orderNo: '1471724995', quantity: 48, operator: '张三', remark: '订单生产消耗', detailNote: '', updatedAt: '2026-04-01 12:00:00' }
  ],
  craftStats: [
    { id: 1, craftId: 6886, name: '双面光膜', unit: '千', count: 5570, pending: 41, completed: 939, time: '2026-04-01 至 2026-04-20', updatedAt: timestamp[0] },
    { id: 2, craftId: 6898, name: '四色印刷', unit: '千印', count: 9737, pending: 72, completed: 515, time: '2026-04-01 至 2026-04-20', updatedAt: timestamp[1] },
    { id: 3, craftId: 8165, name: '双面哑膜', unit: '千印', count: 3121, pending: 40, completed: 865, time: '2026-04-01 至 2026-04-20', updatedAt: timestamp[2] }
  ],
  craftPerformance: [
    { id: 1, time: '2026-04-01 至 2026-04-20', customer: '成都印刷公司', productName: '青溪建文街兵...', department: '生产部', role: '生产员', name: '胡允', bigMachine: 0, smallMachine: 0, film: 0, lamination: 0, singleColor: 26, plate: 0, bronzing: 35, total: 811, updatedAt: timestamp[0] },
    { id: 2, time: '2026-04-01 至 2026-04-20', customer: '成都印刷公司', productName: '青溪建文街兵...', department: '生产部', role: '生产员', name: '潘夏彤', bigMachine: 0, smallMachine: 0, film: 0, lamination: 0, singleColor: 37, plate: 0, bronzing: 0, total: 783, updatedAt: timestamp[1] },
    { id: 3, time: '2026-04-01 至 2026-04-20', customer: '成都印刷公司', productName: '青溪建文街兵...', department: '后道部', role: '生产员', name: '刘大大', bigMachine: 72, smallMachine: 72, film: 72, lamination: 4, singleColor: 0, plate: 0, bronzing: 57, total: 314, updatedAt: timestamp[2] }
  ],
  billingPerformance: [
    { id: 1, time: '2026-04-01 至 2026-04-20', name: '龙慧', phone: '19876782134', completedOrders: 811, amount: '¥1,000.00', updatedAt: timestamp[0] },
    { id: 2, time: '2026-04-01 至 2026-04-20', name: '王泽', phone: '19578012123', completedOrders: 783, amount: '¥1,000.00', updatedAt: timestamp[1] },
    { id: 3, time: '2026-04-01 至 2026-04-20', name: '胡允', phone: '19113212388', completedOrders: 314, amount: '¥1,000.00', updatedAt: timestamp[2] }
  ],
  deliveryPerformance: [
    { id: 1, time: '2026-04-01 至 2026-04-20', name: '龙慧', phone: '19876782134', pendingOrders: 41, completedOrders: 811, updatedAt: timestamp[0] },
    { id: 2, time: '2026-04-01 至 2026-04-20', name: '王泽', phone: '19578012123', pendingOrders: 72, completedOrders: 783, updatedAt: timestamp[1] },
    { id: 3, time: '2026-04-01 至 2026-04-20', name: '胡允', phone: '19113212388', pendingOrders: 40, completedOrders: 314, updatedAt: timestamp[2] }
  ],
  accounts: [
    { id: 1, name: '微信收款', bank: '微信', type: '微信', accountNo: 'wx-2291', balance: 129833, status: true, remark: '', updatedAt: timestamp[0] },
    { id: 2, name: '支付宝对公', bank: '支付宝', type: '支付宝', accountNo: '2088 **** 5522', balance: 48220, status: true, remark: '', updatedAt: timestamp[1] },
    { id: 3, name: '建设银行基本户', bank: '建设银行', type: '公账', accountNo: '6227 **** 1123', balance: 92500, status: false, remark: '', updatedAt: timestamp[2] }
  ],
  fundDetails: [
    { id: 1, time: '2026-04-20 10:22', bizNo: 'SK2026042001', type: '收入', remark: '订单回款', account: '建设银行基本户', accountType: '公账', accountNo: '6227 **** 1123', bank: '建设银行', status: '收入', income: '¥8,600.00', expense: '¥0.00', balance: '¥92,500.00', updatedAt: timestamp[0] },
    { id: 2, time: '2026-04-20 14:08', bizNo: 'BX2026042003', type: '支出', remark: '员工报销', account: '支付宝对公', accountType: '支付宝', accountNo: '2088 **** 5522', bank: '支付宝', status: '支出', income: '¥0.00', expense: '¥2,300.00', balance: '¥48,220.00', updatedAt: timestamp[1] }
  ],
  receivableOrders: [
    { id: 1, orderNo: '20260329001', customer: '成都龙泉驿古月良品广告', orderTime: '2024-12-13 04:15', filler: '杨静云', productInfo: '国学经典智慧封面', amount: '¥12,394.00', received: '¥2,000.00', unpaid: '¥10,394.00', status: '待配送', remark: '', updatedAt: timestamp[0] },
    { id: 2, orderNo: '20260329003', customer: '成都舞美租兑广告', orderTime: '2025-01-15 08:08', filler: '傅彭薄', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥590.00', received: '¥100.00', unpaid: '¥490.00', status: '生产中', remark: '', updatedAt: timestamp[1] }
  ],
  receivableUnits: [
    { id: 1, customer: '成都龙泉驿古月良品广告', amount: '¥22,800.00', received: '¥9,800.00', unpaid: '¥13,000.00', contact: '杨静云', phone: '13800001234', sales: '王漫', remark: '', updatedAt: timestamp[0] },
    { id: 2, customer: '成都舞美租兑广告', amount: '¥13,600.00', received: '¥4,600.00', unpaid: '¥9,000.00', contact: '傅彭薄', phone: '13900002222', sales: '胡允', remark: '', updatedAt: timestamp[1] }
  ],
  manualRecords: [
    { id: 1, name: '纸箱', quantity: 11, remark: '--', orderNo: '--', operator: '王漫', updatedAt: '2026-04-01 12:00:00' },
    { id: 2, name: '胶水', quantity: 74, remark: '日用品', orderNo: '--', operator: '张三', updatedAt: '2026-04-01 12:00:00' },
    { id: 3, name: '胶带', quantity: 3, remark: '日用品', orderNo: '1471724995', operator: '张三', updatedAt: '2026-04-01 12:00:00' }
  ],
  reimbursements: [
    { id: 1, name: '20260329001', applicant: '胡允', updatedAt: '2024-12-13 04:15', account: '微信', status: '待审批', amount: '¥1,000.00', discount: '¥30.00', remark: '顺丰纸箱采购', updatedAt2: timestamp[0] },
    { id: 2, name: '20260329002', applicant: '李书易', updatedAt: '2024-12-13 04:15', account: '公账', status: '已通过', amount: '¥100.00', discount: '¥30.00', remark: '办公耗材采购', updatedAt2: timestamp[1] },
    { id: 3, name: '20260329003', applicant: '龙慧', updatedAt: '2024-12-13 04:15', account: '微信', status: '待审批', amount: '¥100.00', discount: '¥30.00', remark: '外出交通费', updatedAt2: timestamp[2] }
  ],
  receipts: [
    { id: 1, receiptNo: '20260329001', customer: '成都龙泉驿古月良品广告', updatedAt: '2026-04-01 12:00:09', collector: '胡允', operator: '丽丽', operationTime: '2026-04-01 12:00:09', account: '微信', amount: '¥1,200.00', discount: '¥10.00', remark: '款项已收齐', receiptOrders: [{ orderNo: '20260329001', orderTime: '2024-12-13 04:15', filler: '杨静云', productInfo: '西藏自治区全民科学素质工作材料汇编', receivableAmount: '¥12,394.00', receivedAmount: '¥1,000.00', arrearsAmount: '¥1,000.00', status: '待生产', currentAmount: '¥1,000.00', currentDiscount: '¥10.00' }, { orderNo: '20260329002', orderTime: '2024-12-13 04:15', filler: '傅彭薄', productInfo: '国学经典智慧封面', receivableAmount: '¥590.00', receivedAmount: '¥100.00', arrearsAmount: '¥100.00', status: '生产中', currentAmount: '¥1,000.00', currentDiscount: '¥10.00' }] },
    { id: 2, receiptNo: '20260329002', customer: '成都舞美租兑广告', updatedAt: '2024-12-13 04:15', collector: '李书易', operator: '李书易', operationTime: timestamp[1], account: '支付宝', amount: '¥100.00', discount: '¥30.00', remark: '首付款', receiptOrders: [] },
    { id: 3, receiptNo: '20260329003', customer: '成都舞美租兑广告', updatedAt: '2024-12-13 04:15', collector: '龙慧', operator: '龙慧', operationTime: timestamp[2], account: '公账', amount: '¥100.00', discount: '¥30.00', remark: '阶段收款', receiptOrders: [] },
    { id: 4, receiptNo: '20260329004', customer: '成都中永印务', updatedAt: '2025-01-15 08:08', collector: '傅彭薄', operator: '傅彭薄', operationTime: timestamp[3], account: '微信', amount: '¥200.00', discount: '¥30.00', remark: '尾款收齐', receiptOrders: [] }
  ],
  productCrafts: [
    { id: 1, orderNo: '20260329001', customer: '成都龙泉驿古月良品广告', contact: '丽丽', phone: '1556246752', deliveryAddress: '四川省成都市龙泉驿区万源路317号', deliveryDate: '2026-04-01 12:00:00', deliveryType: '自提', printRequirement: '无', orderTime: '2024-12-13 04:15', productName: '西藏自治区全民科学素质工作材料汇编', productInfo: '西藏自治区全民科学素质工作材料汇编', quantity: 83, craftName: '双面光膜', specification: 'xxx', openCount: '2000', basePrice: '张', finishedCount: '20', unit: '千印', remark: '加急', unitPrice: '¥200.00', amount: '¥1,000.00', status: '待生产', operator: '--', productionTime: '-', productionRemark: '-', imageNote: '-', craftRows: [{ craftName: '四色印刷', specification: 'xxx', openCount: '2000', basePrice: '张', finishedCount: '20', unit: '千印', unitPrice: '¥200.00', amount: '¥1,000.00', remark: '加急' }], productRows: [{ productName: '【颜色鲜艳】经汇-沃柑370*260、自带大度128克铜板345张', finishedSpec: '--', orderQuantity: '2000', unit: '张', amount: '¥200.00' }], updatedAt: timestamp[0] },
    { id: 2, orderNo: '20260329001', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', deliveryAddress: '成都市武侯区百吉街23号附1号', deliveryDate: '2026-04-01 12:00:00', deliveryType: '配送', printRequirement: '加急出货', orderTime: '2024-12-13 04:15', productName: '国学经典智慧封面', productInfo: '国学经典智慧封面', quantity: 10, craftName: '四色印刷', specification: 'xxx', openCount: '1000', basePrice: '张', finishedCount: '10', unit: '千印', remark: '加急', unitPrice: '¥120.00', amount: '¥100.00', status: '待生产', operator: '--', productionTime: '-', productionRemark: '-', imageNote: '-', craftRows: [{ craftName: '四色印刷', specification: 'xxx', openCount: '1000', basePrice: '张', finishedCount: '10', unit: '千印', unitPrice: '¥120.00', amount: '¥100.00', remark: '加急' }], productRows: [{ productName: '国学经典智慧封面', finishedSpec: '--', orderQuantity: '1000', unit: '张', amount: '¥120.00' }], updatedAt: timestamp[1] },
    { id: 3, orderNo: '20260329001', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', deliveryAddress: '成都市武侯区百吉街23号附1号', deliveryDate: '2026-04-01 12:00:00', deliveryType: '配送', printRequirement: '无', orderTime: '2024-12-13 04:15', productName: '青溪建文街兵立王-集杯卡-双面300克', productInfo: '青溪建文街兵立王-集杯卡-双面300克', quantity: 9, craftName: '双面哑膜', specification: 'xxx', openCount: '2000', basePrice: '张', finishedCount: '20', unit: '千印', remark: '加急', unitPrice: '¥200.00', amount: '¥100.00', status: '已生产', operator: '丽丽', productionTime: '2026-04-02 12:00:00', productionRemark: '已完成，并放置xxx地方', imageNote: '生产现场图已上传', craftRows: [{ craftName: '四色印刷', specification: 'xxx', openCount: '2000', basePrice: '张', finishedCount: '20', unit: '千印', unitPrice: '¥200.00', amount: '¥1,000.00', remark: '加急' }], productRows: [{ productName: '【颜色鲜艳】经汇-沃柑370*260、自带大度128克铜板345张', finishedSpec: '--', orderQuantity: '2000', unit: '张', amount: '¥200.00' }], updatedAt: timestamp[2] },
    { id: 4, orderNo: '20260329001', customer: '成都中永印务', contact: '李天泽', phone: '19333312231', deliveryAddress: '成都市彭州市天府东路369号', deliveryDate: '2026-04-01 12:00:00', deliveryType: '自提', printRequirement: '无', orderTime: '2025-01-15 08:08', productName: '西藏自治区全民科学素质工作材料汇编', productInfo: '西藏自治区全民科学素质工作材料汇编', quantity: 18, craftName: '单色印刷', specification: 'xxx', openCount: '800', basePrice: '张', finishedCount: '18', unit: '千印', remark: '无', unitPrice: '¥60.00', amount: '¥200.00', status: '已生产', operator: '胡小小', productionTime: '2026-04-03 09:20:00', productionRemark: '已完成入库', imageNote: '完工图已上传', craftRows: [{ craftName: '单色印刷', specification: 'xxx', openCount: '800', basePrice: '张', finishedCount: '18', unit: '千印', unitPrice: '¥60.00', amount: '¥200.00', remark: '无' }], productRows: [{ productName: '西藏自治区全民科学素质工作材料汇编', finishedSpec: '--', orderQuantity: '800', unit: '张', amount: '¥60.00' }], updatedAt: timestamp[3] }
  ],
  productCraftsOutsource: [
    { id: 1, orderNo: '20260329001', transferUnit: '宜宾市恒博包装有限公司', customer: '成都龙泉驿古月良品广告', contact: '丽丽', phone: '1556246752', deliveryAddress: '四川省成都市龙泉驿区万源路317号', deliveryDate: '2026-04-01 12:00:00', deliveryType: '物流配送', orderTime: '2024-12-13 04:15', productName: '西藏自治区全民科学素质工作材料汇编', productInfo: '西藏自治区全民科学素质工作材料汇编', quantity: 83, craftName: '双面光膜', specification: 'xxx', openCount: '2000', basePrice: '张', finishedCount: '20', unit: '千印', remark: '加急', unitPrice: '¥200.00', amount: '¥1,000.00', status: '待生产', operator: '--', productionTime: '-', productionRemark: '-', imageNote: '-', craftRows: [{ craftName: '四色印刷', specification: 'xxx', openCount: '2000', basePrice: '张', finishedCount: '20', unit: '千印', unitPrice: '¥200.00', amount: '¥1,000.00', remark: '加急' }], productRows: [{ productName: '【颜色鲜艳】经汇-沃柑370*260、自带大度128克铜板345张', finishedSpec: '--', orderQuantity: '2000', unit: '张', amount: '¥200.00' }], updatedAt: timestamp[0] },
    { id: 2, orderNo: '20260329001', transferUnit: '成都锦锐印务', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', deliveryAddress: '成都市武侯区百吉街23号附1号', deliveryDate: '2026-04-01 12:00:00', deliveryType: '物流配送', orderTime: '2024-12-13 04:15', productName: '国学经典智慧封面', productInfo: '国学经典智慧封面', quantity: 10, craftName: '四色印刷', specification: 'xxx', openCount: '1000', basePrice: '张', finishedCount: '10', unit: '千印', remark: '加急', unitPrice: '¥120.00', amount: '¥100.00', status: '待生产', operator: '--', productionTime: '-', productionRemark: '-', imageNote: '-', craftRows: [{ craftName: '四色印刷', specification: 'xxx', openCount: '1000', basePrice: '张', finishedCount: '10', unit: '千印', unitPrice: '¥120.00', amount: '¥100.00', remark: '加急' }], productRows: [{ productName: '国学经典智慧封面', finishedSpec: '--', orderQuantity: '1000', unit: '张', amount: '¥120.00' }], updatedAt: timestamp[1] },
    { id: 3, orderNo: '20260329001', transferUnit: '成都锦锐印务', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', deliveryAddress: '成都市武侯区百吉街23号附1号', deliveryDate: '2026-04-01 12:00:00', deliveryType: '物流配送', orderTime: '2024-12-13 04:15', productName: '青溪建文街兵立王-集杯卡-双面300克', productInfo: '青溪建文街兵立王-集杯卡-双面300克', quantity: 9, craftName: '双面哑膜', specification: 'xxx', openCount: '2000', basePrice: '张', finishedCount: '20', unit: '千印', remark: '加急', unitPrice: '¥200.00', amount: '¥100.00', status: '已生产', operator: '丽丽', productionTime: '2026-04-02 12:00:00', productionRemark: '已完成，并放置xxx地方', imageNote: '外协生产图已上传', craftRows: [{ craftName: '双面哑膜', specification: 'xxx', openCount: '2000', basePrice: '张', finishedCount: '20', unit: '千印', unitPrice: '¥200.00', amount: '¥100.00', remark: '加急' }], productRows: [{ productName: '青溪建文街兵立王-集杯卡-双面300克', finishedSpec: '--', orderQuantity: '2000', unit: '张', amount: '¥200.00' }], updatedAt: timestamp[2] },
    { id: 4, orderNo: '20260329001', transferUnit: '宜宾市恒博包装有限公司', customer: '成都中永印务', contact: '李天泽', phone: '19333312231', deliveryAddress: '成都市彭州市天府东路369号', deliveryDate: '2026-04-01 12:00:00', deliveryType: '自提', orderTime: '2025-01-15 08:08', productName: '西藏自治区全民科学素质工作材料汇编', productInfo: '西藏自治区全民科学素质工作材料汇编', quantity: 18, craftName: '单色印刷', specification: 'xxx', openCount: '800', basePrice: '张', finishedCount: '18', unit: '千印', remark: '无', unitPrice: '¥60.00', amount: '¥200.00', status: '已生产', operator: '胡小小', productionTime: '2026-04-03 09:20:00', productionRemark: '已完成入库', imageNote: '完工图已上传', craftRows: [{ craftName: '单色印刷', specification: 'xxx', openCount: '800', basePrice: '张', finishedCount: '18', unit: '千印', unitPrice: '¥60.00', amount: '¥200.00', remark: '无' }], productRows: [{ productName: '西藏自治区全民科学素质工作材料汇编', finishedSpec: '--', orderQuantity: '800', unit: '张', amount: '¥60.00' }], updatedAt: timestamp[3] }
  ],
  outsourceIncoming: [
    { id: 1, orderNo: '20260329001', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', address: '成都市武侯区百吉街23号附1号', updatedAt: '2024-12-13 04:15', supplier: '成都锦锐印务', craft: '国学经典智慧封面', productInfo: '国学经典智慧封面', amount: '¥590.00', status: '待生产', sales: '胡允', remark: '', orderRows: [{ orderNo: '20260329001', customer: '成都舞美租兑广告', orderTime: '2024-12-13 04:15', sales: '胡允', supplier: '成都锦锐印务', productInfo: '国学经典智慧封面', amount: '¥590.00', status: '待生产' }], flowTimeline: [{ date: '2026-03-30', title: '接收外协转入单', description: '胡允 提交于 2026-03-30 08:30' }, { date: '2026-03-30', title: '待生产排单', description: '系统已生成生产任务' }] },
    { id: 2, orderNo: '20260329002', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', address: '成都市武侯区百吉街23号附1号', updatedAt: '2024-12-13 04:15', supplier: '成都锦锐印务', craft: '青溪建文街兵立王-集杯卡-双面300克', productInfo: '青溪建文街兵立王-集杯卡-双面300克', amount: '¥590.00', status: '生产中', sales: '傅彭薄', remark: '', orderRows: [{ orderNo: '20260329002', customer: '成都舞美租兑广告', orderTime: '2024-12-13 04:15', sales: '傅彭薄', supplier: '成都锦锐印务', productInfo: '青溪建文街兵立王-集杯卡-双面300克', amount: '¥590.00', status: '生产中' }], flowTimeline: [{ date: '2026-03-30', title: '接收外协转入单', description: '傅彭薄 提交于 2026-03-30 08:30' }, { date: '2026-03-31', title: '开始生产', description: '外协单位已开始生产' }] },
    { id: 3, orderNo: '20260329003', customer: '成都中永印务', contact: '李天泽', phone: '19333312231', address: '成都市彭州市天府东路369号', updatedAt: '2025-01-15 08:08', supplier: '宜宾市恒博包装有限公司', craft: '西藏自治区全民科学素质工作材料汇编', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥900.00', status: '待配送', sales: '王漫', remark: '', orderRows: [{ orderNo: '20260329003', customer: '成都中永印务', orderTime: '2025-01-15 08:08', sales: '王漫', supplier: '宜宾市恒博包装有限公司', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥900.00', status: '待配送' }], flowTimeline: [{ date: '2026-04-01', title: '外协生产完成', description: '已转入待配送环节' }] },
    { id: 4, orderNo: '20260329004', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', address: '成都市武侯区百吉街23号附1号', updatedAt: '2024-12-13 04:15', supplier: '成都锦锐印务', craft: '国学经典智慧封面', productInfo: '国学经典智慧封面', amount: '¥590.00', status: '配送中', sales: '杨静云', remark: '', orderRows: [{ orderNo: '20260329004', customer: '成都舞美租兑广告', orderTime: '2024-12-13 04:15', sales: '杨静云', supplier: '成都锦锐印务', productInfo: '国学经典智慧封面', amount: '¥590.00', status: '配送中' }], flowTimeline: [{ date: '2026-04-01', title: '已发车配送', description: '物流司机已接单配送' }] },
    { id: 5, orderNo: '20260329005', customer: '宜宾市恒博包装有限公司', contact: '周乐心', phone: '18588881234', address: '宜宾市叙州区南岸街道88号', updatedAt: '2024-11-16 09:07', supplier: '宜宾市恒博包装有限公司', craft: '青溪建文街兵立王-集杯卡-双面300克', productInfo: '青溪建文街兵立王-集杯卡-双面300克', amount: '¥1,100.00', status: '已完成', sales: '周乐心', remark: '', orderRows: [{ orderNo: '20260329005', customer: '宜宾市恒博包装有限公司', orderTime: '2024-11-16 09:07', sales: '周乐心', supplier: '宜宾市恒博包装有限公司', productInfo: '青溪建文街兵立王-集杯卡-双面300克', amount: '¥1,100.00', status: '已完成' }], flowTimeline: [{ date: '2026-04-02', title: '订单已完成', description: '外协转入订单已全部完成' }] }
  ],
  outsourceOutgoing: [
    { id: 1, orderNo: '20260329001', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', address: '成都市武侯区百吉街23号附1号', updatedAt: '2024-12-13 04:15', supplier: '成都锦锐印务', craft: '国学经典智慧封面', amount: '¥590.00', status: '待生产', sales: '周乐心', remark: '', productInfo: '国学经典智慧封面', orderRows: [{ orderNo: '20260329001', customer: '成都舞美租兑广告', orderTime: '2024-12-13 04:15', sales: '周乐心', supplier: '成都锦锐印务', productInfo: '国学经典智慧封面', amount: '¥590.00', status: '待生产' }], flowTimeline: [{ date: '2026-03-30', title: '创建外协转出单', description: '周乐心 提交于 2026-03-30 08:30' }, { date: '2026-03-30', title: '等待外协接单', description: '已通知外协单位确认' }] },
    { id: 2, orderNo: '20260329002', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', address: '成都市武侯区百吉街23号附1号', updatedAt: '2024-12-13 04:15', supplier: '成都锦锐印务', craft: '青溪建文街兵立王-集杯卡-双面300克', amount: '¥590.00', status: '生产中', sales: '潘夏彤', remark: '', productInfo: '青溪建文街兵立王-集杯卡-双面300克', orderRows: [{ orderNo: '20260329002', customer: '成都舞美租兑广告', orderTime: '2024-12-13 04:15', sales: '潘夏彤', supplier: '成都锦锐印务', productInfo: '青溪建文街兵立王-集杯卡-双面300克', amount: '¥590.00', status: '生产中' }], flowTimeline: [{ date: '2026-03-30', title: '外协已接单', description: '成都锦锐印务已确认接单' }, { date: '2026-03-31', title: '外协生产中', description: '当前正在进行生产' }] },
    { id: 3, orderNo: '20260329003', customer: '成都中永印务', contact: '李天泽', phone: '19333312231', address: '成都市彭州市天府东路369号', updatedAt: '2025-01-15 08:08', supplier: '宜宾市恒博包装有限公司', craft: '西藏自治区全民科学素质工作材料汇编', amount: '¥900.00', status: '待配送', sales: '赵丽', remark: '', productInfo: '西藏自治区全民科学素质工作材料汇编', orderRows: [{ orderNo: '20260329003', customer: '成都中永印务', orderTime: '2025-01-15 08:08', sales: '赵丽', supplier: '宜宾市恒博包装有限公司', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥900.00', status: '待配送' }], flowTimeline: [{ date: '2026-04-01', title: '外协生产完成', description: '已回传待配送状态' }] },
    { id: 4, orderNo: '20260329004', customer: '成都舞美租兑广告', contact: '赵雨', phone: '19113212388', address: '成都市武侯区百吉街23号附1号', updatedAt: '2024-12-13 04:15', supplier: '成都锦锐印务', craft: '国学经典智慧封面', amount: '¥590.00', status: '配送中', sales: '孙忆枫', remark: '', productInfo: '国学经典智慧封面', orderRows: [{ orderNo: '20260329004', customer: '成都舞美租兑广告', orderTime: '2024-12-13 04:15', sales: '孙忆枫', supplier: '成都锦锐印务', productInfo: '国学经典智慧封面', amount: '¥590.00', status: '配送中' }], flowTimeline: [{ date: '2026-04-01', title: '已发车配送', description: '司机已接单配送' }] },
    { id: 5, orderNo: '20260329005', customer: '宜宾市恒博包装有限公司', contact: '周乐心', phone: '18588881234', address: '宜宾市叙州区南岸街道88号', updatedAt: '2024-11-16 09:07', supplier: '宜宾市恒博包装有限公司', craft: '青溪建文街兵立王-集杯卡-双面300克', amount: '¥1,100.00', status: '已完成', sales: '胡小小', remark: '', productInfo: '青溪建文街兵立王-集杯卡-双面300克', orderRows: [{ orderNo: '20260329005', customer: '宜宾市恒博包装有限公司', orderTime: '2024-11-16 09:07', sales: '胡小小', supplier: '宜宾市恒博包装有限公司', productInfo: '青溪建文街兵立王-集杯卡-双面300克', amount: '¥1,100.00', status: '已完成' }], flowTimeline: [{ date: '2026-04-02', title: '订单已完成', description: '外协转出订单已全部完成' }] }
  ],
  deliveryNotes: [
    { id: 1, deliveryNo: '20260329001', createdAt: '2024-12-13 04:15', filler: '杨静云', orderInfo: '西藏自治区全民科学素质工作材料汇编', driver: '王漫', progress: '1/4', status: '配送中', remark: '', deliveryOrders: [{ orderNo: '20260329001', customer: '成都龙泉驿古月良品广告', orderTime: '2024-12-13 04:15', filler: '杨静云', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥12,394.00', orderStatus: '配送中', status: '待配送' }, { orderNo: '20260329002', customer: '成都龙泉驿古月良品广告', orderTime: '2024-12-13 04:15', filler: '杨静云', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥12,394.00', orderStatus: '已完成', status: '已配送' }], driverRows: [{ name: '庞慧', phone: '19533319000', department: '物流部', roleText: '配送员' }], deliveryTimeline: [{ date: '2026-03-30', title: '创建配送单', description: '王小虎 提交于 2026-03-30 08:30' }, { date: '2026-03-30', title: '已完成第一笔订单配送', description: '王小虎 提交于 2026-03-30 09:52' }], updatedAt: timestamp[0] },
    { id: 2, deliveryNo: '20260329002', createdAt: '2024-12-13 04:15', filler: '杨静云', orderInfo: '西藏自治区全民科学素质工作材料汇编', driver: '段问薇', progress: '0/3', status: '待配送', remark: '', deliveryOrders: [{ orderNo: '20260329001', customer: '成都龙泉驿古月良品广告', orderTime: '2024-12-13 04:15', filler: '杨静云', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥12,394.00', orderStatus: '配送中', status: '待配送' }, { orderNo: '20260329002', customer: '成都龙泉驿古月良品广告', orderTime: '2024-12-13 04:15', filler: '杨静云', productInfo: '西藏自治区全民科学素质工作材料汇编', amount: '¥12,394.00', orderStatus: '已完成', status: '已配送' }], driverRows: [{ name: '庞慧', phone: '19533319000', department: '物流部', roleText: '配送员' }], deliveryTimeline: [{ date: '2026-03-30', title: '创建配送单', description: '王小虎 提交于 2026-03-30 08:30' }, { date: '2026-03-30', title: '已完成第一笔订单配送', description: '王小虎 提交于 2026-03-30 09:52' }], updatedAt: timestamp[1] },
    { id: 3, deliveryNo: '20260329003', createdAt: '2024-12-13 04:15', filler: '傅彭薄', orderInfo: '国学经典智慧封面', driver: '傅彭薄', progress: '0/1', status: '待配送', remark: '', deliveryOrders: [{ orderNo: '20260329003', customer: '成都舞美租兑广告', orderTime: '2024-12-13 04:15', filler: '傅彭薄', productInfo: '国学经典智慧封面', amount: '¥590.00', orderStatus: '已完成', status: '待配送' }], driverRows: [{ name: '傅彭薄', phone: '19113212388', department: '物流部', roleText: '配送员' }], deliveryTimeline: [{ date: '2026-03-30', title: '创建配送单', description: '杨静云 提交于 2026-03-30 08:30' }], updatedAt: timestamp[2] },
    { id: 4, deliveryNo: '20260329004', createdAt: '2024-12-13 04:15', filler: '傅彭薄', orderInfo: '青溪建文街兵立王-集杯卡-双面300克', driver: '王天天', progress: '5/5', status: '已完成', remark: '', deliveryOrders: [{ orderNo: '20260329004', customer: '成都舞美租兑广告', orderTime: '2024-12-13 04:15', filler: '傅彭薄', productInfo: '青溪建文街兵立王-集杯卡-双面300克', amount: '¥590.00', orderStatus: '已完成', status: '已配送' }], driverRows: [{ name: '王天天', phone: '18588881234', department: '物流部', roleText: '配送员' }], deliveryTimeline: [{ date: '2026-03-30', title: '创建配送单', description: '杨静云 提交于 2026-03-30 08:30' }, { date: '2026-03-30', title: '已完成全部订单配送', description: '王小虎 提交于 2026-03-30 09:52' }], updatedAt: timestamp[3] }
  ]
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
