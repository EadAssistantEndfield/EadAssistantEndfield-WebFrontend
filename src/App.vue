<script setup lang="ts">
import BlueprintHeader from '@/components/BlueprintHeader.vue'
import BlueprintJsonEditor from '@/components/BlueprintJsonEditor.vue'
import BlueprintLayout from '@/components/BlueprintLayout.vue'
import BlueprintNodeTable from '@/components/BlueprintNodeTable.vue'
import BlueprintOverview from '@/components/BlueprintOverview.vue'
import BlueprintStatsTable from '@/components/BlueprintStatsTable.vue'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import { useBlueprintParser } from '@/composables/useBlueprintParser'

const { t } = useBlueprintI18n()
const { rawText, sourceName, summary, errorMessage, rebuildSummary, loadFile } = useBlueprintParser(t)
</script>

<template>
  <main class="page-shell">
    <BlueprintHeader :source-name="sourceName" @rebuild="rebuildSummary" @file-selected="loadFile" />

    <section class="workspace-grid">
      <BlueprintJsonEditor v-model="rawText" />
      <BlueprintOverview :summary="summary" :error-message="errorMessage" />
    </section>

    <BlueprintLayout v-if="summary && !errorMessage" :summary="summary" />

    <section v-if="summary && !errorMessage" class="detail-grid">
      <BlueprintStatsTable :entries="summary.productCounts" kind="item" label-key="itemColumn" title-key="itemStats" />
      <BlueprintStatsTable :entries="summary.payloadCounts" kind="payload" label-key="payloadColumn" title-key="payloadStats" />
    </section>

    <BlueprintNodeTable v-if="summary && !errorMessage" :summary="summary" />
  </main>
</template>

<style scoped>
.page-shell {
  width: min(1600px, calc(100% - 32px));
  margin: 24px auto 40px;
  display: grid;
  gap: 18px;
}

.workspace-grid,
.detail-grid {
  display: grid;
  gap: 18px;
}

.workspace-grid {
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.8fr);
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 1180px) {
  .workspace-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
