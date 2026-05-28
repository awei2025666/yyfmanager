<script setup>
import FinanceRecordsPage from './FinanceRecordsPage.vue'
import { reimbursementConfig } from './financeRecordConfigs'
</script>

<template>
  <FinanceRecordsPage :config="reimbursementConfig" />
</template>
