<script setup>
import PerformanceListPage from './PerformanceListPage.vue'
import { craftPerformanceConfig } from './performanceConfigs'
</script>

<template>
  <PerformanceListPage :config="craftPerformanceConfig" />
</template>
