<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBlueprintI18n } from '@/features/blueprint/composables/useBlueprintI18n'
import type { QueryStage } from '@/features/blueprint/composables/useBlueprintParser'
import FacilityGrid from '@/features/blueprint/components/overview/FacilityGrid.vue'
import OverviewMetricGrid from '@/features/blueprint/components/overview/OverviewMetricGrid.vue'
import OverviewSectionHeader from '@/features/blueprint/components/overview/OverviewSectionHeader.vue'
import OverviewStreamSection from '@/features/blueprint/components/overview/OverviewStreamSection.vue'
import QrOverlay from '@/features/blueprint/components/overview/QrOverlay.vue'
import ShareCodePanel from '@/features/blueprint/components/overview/ShareCodePanel.vue'
import type { FacilityGridItem } from '@/features/blueprint/components/overview/overviewTypes'
import { colorForTemplate } from '@/features/blueprint/domain/blueprint'
import type { BlueprintSummary } from '@/features/blueprint/types'

const props = defineProps<{
  summary: BlueprintSummary | null
  errorMessage: string
  sourceName: string
  queryLoading: boolean
  queryStage: QueryStage
  qrcodeUrl: string
}>()

const emit = defineEmits<{
  queryShareCode: [code: string]
  cancelQuery: []
}>()

const { t, buildingLabel, itemLabel, payloadLabel } = useBlueprintI18n()
const queryInput = ref('')
const failedImages = ref(new Set<string>())

watch(
  () => props.summary?.shareCode,
  (code) => {
    if (code && code !== '-') {
      queryInput.value = code
    }
  },
)

function onFacilityImageError(key: string) {
  failedImages.value.add(key)
}

function submitQuery() {
  const code = queryInput.value.trim()
  if (!code || props.queryLoading) {
    return
  }
  emit('queryShareCode', code)
}

const sharePlaceholder = computed(() => {
  return props.summary?.shareCode && props.summary.shareCode !== '-' ? props.summary.shareCode : t('queryPlaceholder')
})

const queryStageText = computed(() => {
  switch (props.queryStage) {
    case 'checking_cache':
      return t('queryCheckingCache')
    case 'creating_session':
      return t('queryCreatingSession')
    case 'waiting_scan':
      return t('queryWaitingScan')
    case 'querying':
      return t('queryScanned')
    default:
      return ''
  }
})

const showQrOverlay = computed(() => {
  return props.queryStage === 'checking_cache' || props.queryStage === 'waiting_scan' || props.queryStage === 'querying'
})

const overviewStats = computed(() => {
  if (!props.summary) {
    return []
  }

  return [
    { label: t('overviewSourceArea'), value: props.summary.sourceType || '-' },
    { label: t('overviewSize'), value: `${props.summary.width}×${props.summary.height}` },
  ]
})

const facilityCards = computed<FacilityGridItem[]>(() => {
  if (!props.summary) {
    return []
  }

  return props.summary.templateCounts.map((item, index) => ({
    key: item.name,
    label: buildingLabel(item.name),
    count: `×${item.count}`,
    imageUrl: failedImages.value.has(item.name) ? '' : (props.summary?.templatePreviewUrls[item.name] ?? ''),
    color: colorForTemplate(item.name),
    delay: 250 + index * 50,
  }))
})

const itemStreams = computed<FacilityGridItem[]>(() => {
  if (!props.summary) {
    return []
  }

  return props.summary.productCounts.map((item) => ({
    key: item.name,
    label: itemLabel(item.name),
    count: `×${item.count}`,
  }))
})

const payloadStreams = computed<FacilityGridItem[]>(() => {
  if (!props.summary) {
    return []
  }

  return props.summary.payloadCounts.map((item) => ({
    key: item.name,
    label: payloadLabel(item.name),
    count: `×${item.count}`,
    dim: true,
  }))
})
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-content scrollbar-thin">
      <section class="section">
        <OverviewSectionHeader :title="t('overview')" flag="//OVERVIEW" />
        <ShareCodePanel
          v-model="queryInput"
          :label="t('shareCode')"
          :placeholder="sharePlaceholder"
          :query-loading="queryLoading"
          @submit="submitQuery"
        />
        <OverviewMetricGrid :stats="overviewStats" />
      </section>

      <section v-if="summary" class="section">
        <OverviewSectionHeader :title="t('sectionFacilities')" flag="//FACILITIES" />
        <FacilityGrid :items="facilityCards" @image-error="onFacilityImageError" />
      </section>

      <section v-if="summary" class="section">
        <OverviewSectionHeader :title="t('sectionInputOutput')" flag="//IO_Stream" />
        <OverviewStreamSection :label="t('inputLabel')" :items="itemStreams" />
        <OverviewStreamSection :label="t('outputLabel')" :items="payloadStreams" />
      </section>

      <p v-if="!summary && !errorMessage" class="empty-copy">{{ t('overviewEmpty') }}</p>

      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>
    </div>

    <QrOverlay
      v-if="showQrOverlay"
      :status="queryStageText"
      :qrcode-url="qrcodeUrl"
      :cancel-label="t('queryCancel')"
      @cancel="emit('cancelQuery')"
    />
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  background: rgba(0, 0, 0, 0.42);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  height: 100%;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.section {
  margin-bottom: 20px;
}

.empty-copy {
  color: var(--text-secondary);
  font-size: 12px;
  margin: 0;
}

.error-banner {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(218, 97, 83, 0.34);
  background: rgba(85, 25, 21, 0.34);
  color: #f5c0b8;
  font-size: 14px;
}

@media (max-width: 1100px) {
  .sidebar {
    border-right: 0;
  }

  .sidebar-content {
    padding: 14px;
  }

  .section {
    margin-bottom: 16px;
  }
}

@media (max-width: 720px) {
  .sidebar-content {
    padding: 12px;
  }
}
</style>
