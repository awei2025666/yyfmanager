<script setup>
import PerformanceListPage from './PerformanceListPage.vue'
import { receivableOrdersConfig } from './receivableConfigs'
</script>

<template>
  <PerformanceListPage :config="receivableOrdersConfig" />
</template>
