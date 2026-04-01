<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import { colorForTemplate } from '@/utils/blueprint'
import type { BlueprintSummary } from '@/types'

const props = defineProps<{
  summary: BlueprintSummary | null
  errorMessage: string
  sourceName: string
}>()

const { t, buildingLabel, itemLabel, payloadLabel } = useBlueprintI18n()
const copyState = ref('')
let copyTimer: number | undefined

async function copyShareCode() {
  if (!props.summary?.shareCode || typeof navigator === 'undefined' || !navigator.clipboard) {
    return
  }
  await navigator.clipboard.writeText(props.summary.shareCode)
  copyState.value = t('copied')
  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copyState.value = ''
  }, 1800)
}

const overviewStats = computed(() => {
  if (!props.summary) {
    return []
  }

  return [
    { label: t('overviewSourceArea'), value: props.summary.sourceType || '-' },
    { label: t('overviewPowerRequirement'), value: '25W' },
    { label: t('overviewSize'), value: `${props.summary.width}×${props.summary.height}` },
  ]
})

const facilityCards = computed(() => {
  if (!props.summary) {
    return []
  }

  return props.summary.templateCounts.slice(0, 8).map((item, index) => {
    return {
      key: item.name,
      label: buildingLabel(item.name),
      count: `×${item.count}`,
      imageUrl: props.summary?.templatePreviewUrls[item.name] ?? '',
      color: colorForTemplate(item.name),
      delay: 250 + index * 50,
    }
  })
})

const itemStreams = computed(() => {
  if (!props.summary) {
    return []
  }

  return props.summary.productCounts.slice(0, 6).map((item) => ({
    key: item.name,
    label: itemLabel(item.name),
    raw: item.name,
    count: item.count,
  }))
})

const payloadStreams = computed(() => {
  if (!props.summary) {
    return []
  }

  return props.summary.payloadCounts.slice(0, 4).map((item) => ({
    key: item.name,
    label: payloadLabel(item.name),
    raw: item.name,
    count: item.count,
  }))
})
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-content scrollbar-thin">
      <!-- 蓝图概览 -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">{{ t('overview') }}</h2>
          <span class="section-flag">//OVERVIEW</span>
        </div>

        <div
          class="share-card animate-slide-in-up opacity-0"
          style="animation-delay: 50ms; animation-fill-mode: forwards"
        >
          <div class="share-card-content">
            <div class="share-card-info">
              <span class="share-label">{{ t('shareCode') }}</span>
              <span class="share-value">{{ summary?.shareCode || 'EF0170IU6a20i5576O2Ai' }}</span>
            </div>
            <button class="share-btn" @click="copyShareCode">
              <span class="share-btn-icon">&#9998;</span>
            </button>
          </div>
        </div>

        <div class="metrics-grid">
          <article
            v-for="(stat, index) in overviewStats"
            :key="stat.label"
            class="metric-card animate-slide-in-up opacity-0"
            :style="{ animationDelay: `${100 + index * 50}ms`, animationFillMode: 'forwards' }"
          >
            <span class="metric-label">{{ stat.label }}</span>
            <strong class="metric-value">{{ stat.value }}</strong>
          </article>
        </div>
      </section>

      <!-- 需求设备 -->
      <section class="section" v-if="summary">
        <div class="section-header">
          <h2 class="section-title">{{ t('sectionFacilities') }}</h2>
          <span class="section-flag">//FACILITIES</span>
        </div>

        <div class="facility-grid">
          <article
            v-for="item in facilityCards"
            :key="item.key"
            class="facility-card animate-slide-in-up opacity-0"
            :style="{ animationDelay: `${item.delay}ms`, animationFillMode: 'forwards' }"
          >
            <div class="facility-icon" :style="{ '--facility-color': item.color }">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.label" />
              <span v-else>{{ item.label.slice(0, 1) }}</span>
            </div>
            <div class="facility-copy">
              <strong>{{ item.label }}</strong>
              <span class="facility-count">{{ item.count }}</span>
            </div>
          </article>
        </div>
      </section>

      <!-- 输入/产出 -->
      <section class="section" v-if="summary">
        <div class="section-header">
          <h2 class="section-title">{{ t('sectionInputOutput') }}</h2>
          <span class="section-flag">//IO_Stream</span>
        </div>

        <div class="stream-block">
          <span class="stream-label">//{{ t('inputLabel') }}</span>
          <div class="facility-grid">
            <article v-for="item in itemStreams" :key="item.key" class="facility-card animate-slide-in-up opacity-0">
              <div class="facility-icon">
                <span>{{ item.label.slice(0, 1) }}</span>
              </div>
              <div class="facility-copy">
                <strong>{{ item.label }}</strong>
                <span class="facility-count">×{{ item.count }}</span>
              </div>
            </article>
          </div>
        </div>

        <div class="stream-block">
          <span class="stream-label">//{{ t('outputLabel') }}</span>
          <div class="facility-grid">
            <article
              v-for="item in payloadStreams"
              :key="item.key"
              class="facility-card facility-card--dim animate-slide-in-up opacity-0"
            >
              <div class="facility-icon">
                <span>{{ item.label.slice(0, 1) }}</span>
              </div>
              <div class="facility-copy">
                <strong>{{ item.label }}</strong>
                <span class="facility-count">×{{ item.count }}</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <p v-if="!summary && !errorMessage" class="empty-copy">{{ t('overviewEmpty') }}</p>

      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
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

.section-header {
  margin-bottom: 16px;
}

.section-title {
  color: #ffffff;
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

.share-card {
  background: rgba(255, 255, 255, 0.055);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 12px;
  margin-bottom: 12px;
}

.share-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.share-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.share-label {
  color: #a0a0a0;
  font-size: 12px;
}

.share-value {
  color: #f7d048;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  font-family: 'HarmonyOS Sans SC', 'HarmonyOS Sans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-btn {
  width: 32px;
  height: 32px;
  background: rgba(247, 208, 72, 0.22);
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-btn:hover {
  background: #c4a35a;
}

.share-btn-icon {
  font-size: 14px;
  color: #a0a0a0;
  transition: color 0.2s ease;
}

.share-btn:hover .share-btn-icon {
  color: #1a1a1a;
}

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
  color: #a0a0a0;
  font-size: 12px;
}

.metric-value {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}

.facility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.facility-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 105, 0, 0.15);
  border: 1px solid rgba(255, 105, 0, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.facility-card:hover {
  border-color: rgba(255, 105, 0, 0.45);
  transform: translateY(-2px);
}

.facility-card--dim {
  background: rgba(255, 105, 0, 0.1);
  border-color: rgba(255, 105, 0, 0.2);
}

.facility-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--facility-color, #c4a35a) 36%, rgba(255, 255, 255, 0.08));
  background: color-mix(in srgb, var(--facility-color, #c4a35a) 14%, rgba(255, 255, 255, 0.04));
  overflow: hidden;
}

.facility-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.facility-icon span {
  color: #c4a35a;
  font-weight: 700;
  font-size: 14px;
}

.facility-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.facility-copy strong {
  color: #ffffff;
  font-size: 13px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
}

.facility-count {
  color: #c4a35a;
  font-size: 12px;
}

.stream-block {
  margin-bottom: 12px;
}

.stream-label {
  color: #a0a0a0;
  font-size: 12px;
  display: block;
  margin-bottom: 8px;
}

.empty-copy {
  color: #a0a0a0;
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

  .share-card {
    padding: 10px;
  }

  .share-card-content {
    align-items: flex-start;
  }

  .share-value {
    font-size: 16px;
    line-height: 22px;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .facility-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .facility-card {
    gap: 10px;
    padding: 8px;
  }

  .facility-icon {
    width: 36px;
    height: 36px;
  }

  .facility-copy strong {
    font-size: 12px;
  }

  .facility-count,
  .stream-label,
  .metric-label {
    font-size: 11px;
  }

  .section-title {
    font-size: 20px;
    line-height: 24px;
  }

  .section-flag {
    font-size: 12px;
    line-height: 14px;
  }

  .metric-card {
    padding: 10px;
  }

  .metric-value {
    font-size: 13px;
  }
}

@media (max-width: 520px) {
  .metrics-grid,
  .facility-grid {
    grid-template-columns: 1fr;
  }
}
</style>
