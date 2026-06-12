<script setup lang="ts">
defineProps<{
  stats: Array<{ label: string; value: string }>
}>()
</script>

<template>
  <div class="metrics-grid">
    <article
      v-for="(stat, index) in stats"
      :key="stat.label"
      class="metric-card animate-slide-in-up opacity-0"
      :style="{ animationDelay: `${100 + index * 50}ms`, animationFillMode: 'forwards' }"
    >
      <span class="metric-label">{{ stat.label }}</span>
      <strong class="metric-value">{{ stat.value }}</strong>
    </article>
  </div>
</template>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
  gap: 8px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.055);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-label {
  color: var(--text-secondary);
  font-size: 12px;
}

.metric-value {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 720px) {
  .metric-card {
    padding: 10px;
  }

  .metric-value {
    font-size: 13px;
  }

  .metric-label {
    font-size: 11px;
  }
}

@media (max-width: 520px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
