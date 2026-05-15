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
  border: 1px solid rgba(220, 228, 242, 0.92);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 50px rgba(40, 56, 85, 0.08);
  backdrop-filter: blur(14px);
}

.page-block__head {
  padding: 22px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.page-block__subtitle {
  margin: 0;
  color: #6c7992;
  font-size: 12px;
}

.page-block__title {
  margin: 6px 0 0;
  font-size: 22px;
  color: #1c2940;
}

.page-block__body {
  padding: 22px 24px 24px;
}
</style>
