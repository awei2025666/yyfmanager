<script setup>
import FinanceRecordsPage from './FinanceRecordsPage.vue'
import { receiptConfig } from './financeRecordConfigs'
</script>

<template>
  <FinanceRecordsPage :config="receiptConfig" />
</template>
