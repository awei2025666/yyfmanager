<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <el-card class="page-block" shadow="never">
    <template v-if="title || subtitle || $slots.extra" #header>
      <header class="page-block__head">
      <div>
        <p v-if="subtitle" class="page-block__subtitle">{{ subtitle }}</p>
        <h3 v-if="title" class="page-block__title">{{ title }}</h3>
      </div>
      <div class="page-block__extra">
        <slot name="extra" />
      </div>
      </header>
    </template>
    <div class="page-block__body">
      <slot />
    </div>
  </el-card>
</template>

<style scoped>
.page-block {
  border-radius: 4px;
}

.page-block :deep(.el-card__header) {
  padding: 16px 20px;
}

.page-block :deep(.el-card__body) {
  padding: 0;
}

.page-block__body {
  padding: 20px;
}

.page-block__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.page-block__subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-extra-small);
}

.page-block__title {
  margin: 0;
  font-size: var(--el-font-size-medium);
  line-height: 1.3;
  color: var(--el-text-color-primary);
}
</style>
