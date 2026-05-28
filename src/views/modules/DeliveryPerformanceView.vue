<script setup>
import PerformanceListPage from './PerformanceListPage.vue'
import { deliveryPerformanceConfig } from './performanceConfigs'
</script>

<template>
  <PerformanceListPage :config="deliveryPerformanceConfig" />
</template>
