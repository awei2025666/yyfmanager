<script setup>
import PerformanceListPage from './PerformanceListPage.vue'
import { receivableUnitsConfig } from './receivableConfigs'
</script>

<template>
  <PerformanceListPage :config="receivableUnitsConfig" />
</template>
