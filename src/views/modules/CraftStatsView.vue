<script setup>
import PerformanceListPage from './PerformanceListPage.vue'
import { craftStatsConfig } from './performanceConfigs'
</script>

<template>
  <PerformanceListPage :config="craftStatsConfig" />
</template>
