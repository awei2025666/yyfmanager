<script setup>
import PerformanceListPage from './PerformanceListPage.vue'
import { billingPerformanceConfig } from './performanceConfigs'
</script>

<template>
  <PerformanceListPage :config="billingPerformanceConfig" />
</template>
