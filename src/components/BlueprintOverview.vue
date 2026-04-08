<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import { colorForTemplate } from '@/utils/blueprint'
import type { BlueprintSummary } from '@/types'
import type { QueryStage } from '@/composables/useBlueprintParser'

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

watch(() => props.summary?.shareCode, (code) => {
  if (code && code !== '-') {
    queryInput.value = code
  }
})

function submitQuery() {
  const code = queryInput.value.trim()
  if (!code || props.queryLoading) {
    return
  }
  emit('queryShareCode', code)
}

const queryStageText = computed(() => {
  switch (props.queryStage) {
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
  return props.queryStage === 'waiting_scan' || props.queryStage === 'querying'
})

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
              <input
                v-model="queryInput"
                class="share-value share-value--input"
                :placeholder="summary?.shareCode && summary.shareCode !== '-' ? summary.shareCode : t('queryPlaceholder')"
                :disabled="queryLoading"
                @keydown.enter="submitQuery"
              />
            </div>
            <button
              type="button"
              class="share-btn"
              :disabled="queryLoading || !queryInput.trim()"
              @click="submitQuery"
            >
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

    <!-- QR Code overlay -->
    <div v-if="showQrOverlay" class="qr-overlay">
      <div class="qr-card">
        <p class="qr-status">{{ queryStageText }}</p>
        <div v-if="qrcodeUrl" class="qr-image-wrapper">
          <img :src="qrcodeUrl" alt="QR Code" class="qr-image" />
        </div>
        <div v-else class="qr-placeholder">
          <span class="qr-spinner"></span>
        </div>
        <button type="button" class="qr-cancel-btn" @click="emit('cancelQuery')">
          {{ t('queryCancel') }}
        </button>
      </div>
    </div>
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
  color: var(--text-secondary);
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
  background: var(--gold);
}

.share-btn-icon {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.share-btn:hover .share-btn-icon {
  color: #1a1a1a;
}

.share-value--placeholder {
  opacity: 0.4;
}

.share-value--input {
  background: transparent;
  border: none;
  outline: none;
  cursor: text;
  width: 100%;
  caret-color: #f7d048;
}

.share-value--input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.share-value--input:disabled {
  opacity: 0.5;
}

.share-query {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.share-query-input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: #f7d048;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease;
}

.share-query-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.share-query-input:focus {
  border-color: var(--gold);
}

.share-query-input:disabled {
  opacity: 0.5;
}

.share-query-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--gold);
  border-radius: 6px;
  background: rgba(196, 163, 90, 0.15);
  color: var(--gold);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.share-query-btn:hover:not(:disabled) {
  background: rgba(196, 163, 90, 0.3);
}

.share-query-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  color: var(--text-secondary);
  font-size: 12px;
}

.metric-value {
  color: var(--text-primary);
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
  color: var(--gold);
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
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
}

.facility-count {
  color: var(--gold);
  font-size: 12px;
}

.stream-block {
  margin-bottom: 12px;
}

.stream-label {
  color: var(--text-secondary);
  font-size: 12px;
  display: block;
  margin-bottom: 8px;
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

.qr-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.qr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  max-width: 280px;
  width: 90%;
}

.qr-status {
  color: #f7d048;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  margin: 0;
  line-height: 1.4;
}

.qr-image-wrapper {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
}

.qr-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #f7d048;
  border-radius: 50%;
  animation: qr-spin 0.8s linear infinite;
}

@keyframes qr-spin {
  to {
    transform: rotate(360deg);
  }
}

.qr-cancel-btn {
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qr-cancel-btn:hover {
  border-color: var(--gold);
  color: var(--gold);
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

  .share-query {
    flex-wrap: wrap;
  }

  .share-query-input {
    font-size: 12px;
  }

  .share-query-btn {
    font-size: 12px;
    padding: 0 10px;
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
