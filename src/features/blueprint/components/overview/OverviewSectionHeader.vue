<script setup lang="ts">
defineProps<{
  title: string
  flag: string
}>()
</script>

<template>
  <div class="section-header">
    <h2 class="section-title">{{ title }}</h2>
    <span class="section-flag">{{ flag }}</span>
  </div>
</template>

<style scoped>
.section-header {
  margin-bottom: 16px;
}

.section-title {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 500;
  line-height: 28.13px;
  letter-spacing: 0;
  text-align: left;
  margin: 0 0 4px 0;
}

.section-flag {
  color: rgba(247, 208, 72, 1);
  font-size: 14px;
  font-weight: 500;
  line-height: 16.41px;
  letter-spacing: 0;
  text-align: left;
}

@media (max-width: 720px) {
  .section-title {
    font-size: 20px;
    line-height: 24px;
  }

  .section-flag {
    font-size: 12px;
    line-height: 14px;
  }
}
</style>
