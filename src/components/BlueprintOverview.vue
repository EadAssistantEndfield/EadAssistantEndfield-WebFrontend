<script setup lang="ts">
import { computed } from 'vue'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import { colorForTemplate, shortTemplateName } from '@/utils/blueprint'
import type { BlueprintSummary } from '@/types'

const props = defineProps<{
  summary: BlueprintSummary | null
  errorMessage: string
}>()

const { t, buildingLabel } = useBlueprintI18n()

const resolvedDescription = computed(() => props.summary?.description || t('defaultDescription'))

const statCards = computed(() => {
  if (!props.summary) {
    return []
  }

  return [
    { label: t('shareCode'), value: props.summary.shareCode },
    { label: t('reviewStatus'), value: props.summary.reviewStatus },
    { label: t('sourceType'), value: props.summary.sourceType },
    { label: t('size'), value: `${props.summary.width} × ${props.summary.height}` },
    { label: t('nodeCount'), value: String(props.summary.nodeCount) },
    { label: t('componentCount'), value: String(props.summary.componentCount) },
  ]
})
</script>

<template>
  <section class="panel-card overview-card">
    <div class="panel-header">
      <h2>{{ t('overview') }}</h2>
      <p v-if="summary">{{ resolvedDescription }}</p>
      <p v-else>{{ t('overviewEmpty') }}</p>
    </div>

    <div v-if="errorMessage" class="error-banner">
      {{ errorMessage }}
    </div>

    <template v-else-if="summary">
      <div class="stats-grid">
        <article v-for="item in statCards" :key="item.label" class="stat-card">
          <span class="stat-label">{{ item.label }}</span>
          <strong class="stat-value">{{ item.value }}</strong>
        </article>
      </div>

      <div class="panel-block">
        <h3>{{ t('buildingStats') }}</h3>
        <div class="compact-list">
          <div v-for="item in summary.templateCounts" :key="item.name" class="compact-item">
            <div class="compact-left">
              <span class="color-chip" :style="{ backgroundColor: colorForTemplate(item.name) }"></span>
              <div>
                <strong>{{ buildingLabel(item.name) }}</strong>
                <p>{{ item.name }}</p>
              </div>
            </div>
            <strong>{{ item.count }}</strong>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.overview-card {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.36);
  padding: 20px 22px;
}

.panel-header {
  display: grid;
  gap: 4px;
  margin-bottom: 14px;
}

.panel-header p,
.compact-item p {
  color: #9fb0c8;
}

.error-banner {
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  background: rgba(127, 29, 29, 0.2);
  color: #fecaca;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.46);
  padding: 14px;
  display: grid;
  gap: 8px;
}

.stat-label {
  color: #9fb0c8;
  font-size: 12px;
}

.stat-value {
  font-size: 16px;
  word-break: break-word;
}

.panel-block {
  margin-top: 18px;
  display: grid;
  gap: 12px;
}

.compact-list {
  display: grid;
  gap: 10px;
  max-height: 430px;
  overflow: auto;
}

.compact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.4);
}

.compact-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-chip {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex: 0 0 auto;
}

@media (max-width: 1180px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
