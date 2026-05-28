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
  <section class="page-block">
    <header v-if="title || subtitle" class="page-block__head">
      <div>
        <p v-if="subtitle" class="page-block__subtitle">{{ subtitle }}</p>
        <h3 v-if="title" class="page-block__title">{{ title }}</h3>
      </div>
      <div class="page-block__extra">
        <slot name="extra" />
      </div>
    </header>
    <div class="page-block__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.page-block {
  border: 1px solid var(--el-border-color-light, #ebeef5);
  border-radius: 4px;
  background: var(--el-bg-color, #ffffff);
  box-shadow: none;
}

.page-block__head {
  padding: 16px 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.page-block__subtitle {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.page-block__title {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
  color: #303133;
}

.page-block__body {
  padding: 16px;
}
</style>
