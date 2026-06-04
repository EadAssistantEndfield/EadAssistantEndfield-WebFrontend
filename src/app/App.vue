<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BlueprintHeader from '@/features/blueprint/components/BlueprintHeader.vue'
import BlueprintJsonEditor from '@/features/blueprint/components/BlueprintJsonEditor.vue'
import BlueprintLayout from '@/features/blueprint/components/BlueprintLayout.vue'
import BlueprintNodeTable from '@/features/blueprint/components/BlueprintNodeTable.vue'
import BlueprintOverview from '@/features/blueprint/components/BlueprintOverview.vue'
import { useBlueprintI18n } from '@/features/blueprint/composables/useBlueprintI18n'
import { useBlueprintParser } from '@/features/blueprint/composables/useBlueprintParser'

type BlueprintWorkbenchView = 'json' | 'layout'

const { t } = useBlueprintI18n()
const { rawText, sourceName, summary, errorMessage, rebuildSummary, loadFile, queryLoading, queryStage, qrcodeUrl, loadFromShareCode, cancelQuery } = useBlueprintParser(t)
const hasRenderableSummary = computed(() => Boolean(summary.value && !errorMessage.value))
const workbenchView = ref<BlueprintWorkbenchView>(hasRenderableSummary.value ? 'layout' : 'json')
const nodeTableExpanded = ref(false)

watch(hasRenderableSummary, (available) => {
  if (!available) {
    workbenchView.value = 'json'
    nodeTableExpanded.value = false
    return
  }

  workbenchView.value = 'layout'
})
</script>

<template>
  <main class="app-shell">
    <BlueprintHeader
      :source-name="sourceName"
      :share-code="summary?.shareCode ?? ''"
      :current-view="workbenchView"
      :can-view-layout="hasRenderableSummary"
      @rebuild="rebuildSummary"
      @file-selected="loadFile"
      @view-change="workbenchView = $event"
    />

    <div class="workspace-shell">
      <BlueprintOverview
        class="workspace-sidebar"
        :summary="summary"
        :error-message="errorMessage"
        :source-name="sourceName"
        :query-loading="queryLoading"
        :query-stage="queryStage"
        :qrcode-url="qrcodeUrl"
        @query-share-code="loadFromShareCode"
        @cancel-query="cancelQuery"
      />

      <section class="workspace-main">
        <div class="workspace-stage">
          <BlueprintLayout v-if="workbenchView === 'layout' && summary && !errorMessage" :summary="summary" />
          <div v-else class="editor-stack">
            <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>
            <BlueprintJsonEditor v-model="rawText" />
          </div>
        </div>

        <section v-if="summary && !errorMessage" class="node-section">
          <button
            type="button"
            class="node-toggle"
            :aria-expanded="nodeTableExpanded"
            @click="nodeTableExpanded = !nodeTableExpanded"
          >
            <span>{{ t('nodeList') }}</span>
            <span class="node-toggle__meta">{{ nodeTableExpanded ? t('nodeToggleCollapse') : t('nodeToggleExpand') }}</span>
          </button>

          <div v-if="nodeTableExpanded" class="node-panel">
            <BlueprintNodeTable :summary="summary" />
          </div>
        </section>
      </section>
    </div>
  </main>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 14% 12%, rgba(255, 255, 255, 0.024), transparent 18%),
    radial-gradient(circle at 82% 8%, rgba(255, 255, 255, 0.02), transparent 16%),
    radial-gradient(circle at 68% 62%, rgba(255, 255, 255, 0.014), transparent 24%),
    linear-gradient(180deg, #040404 0%, #090909 48%, #050505 100%);
  overflow: hidden;
  isolation: isolate;
}

.app-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.42;
  background:
    radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.018) 0 11%, transparent 11.5%),
    radial-gradient(circle at 88% 16%, rgba(255, 255, 255, 0.016) 0 13%, transparent 13.5%),
    radial-gradient(circle at 78% 72%, rgba(255, 255, 255, 0.012) 0 17%, transparent 17.5%);
}

.app-shell > * {
  position: relative;
  z-index: 1;
}

.workspace-shell {
  display: grid;
  grid-template-columns: clamp(320px, 28vw, 400px) minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.workspace-sidebar {
  min-height: 0;
  overflow: hidden;
}

.workspace-main {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
  background: rgba(8, 8, 8, 0.42);
}

.workspace-stage {
  min-height: 0;
  overflow: auto;
}

.editor-stack {
  display: grid;
  gap: 0;
  min-height: 100%;
}

.error-banner {
  margin: 16px 16px 0;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(218, 97, 83, 0.34);
  background: rgba(85, 25, 21, 0.34);
  color: #f5c0b8;
  font-size: 14px;
}

.node-section {
  display: grid;
  gap: 12px;
  padding: 0 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.4));
}

.node-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--bg-hover);
  border-radius: 12px;
  background: var(--bg-panel);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.node-toggle:hover {
  border-color: var(--gold);
  background: #313131;
}

.node-toggle__meta {
  color: var(--gold);
  font-size: 13px;
}

.node-panel {
  display: grid;
}

@media (max-width: 1360px) {
  .workspace-shell {
    grid-template-columns: 400px minmax(0, 1fr);
  }
}

@media (max-width: 1100px) {
  .workspace-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: auto;
  }

  .workspace-sidebar {
    max-height: min(46vh, 420px);
    border-bottom: 1px solid var(--bg-hover);
  }

  .workspace-main {
    border-left: 0;
    overflow: visible;
  }

  .workspace-stage {
    overflow: visible;
  }
}

@media (max-width: 720px) {
  .node-section {
    padding: 0 12px 12px;
    gap: 10px;
  }

  .node-toggle {
    padding: 12px 14px;
    font-size: 14px;
    border-radius: 10px;
  }

  .node-toggle__meta {
    font-size: 12px;
  }
}
</style>
