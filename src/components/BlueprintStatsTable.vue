<script setup lang="ts">
import { computed } from 'vue'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import type { CountEntry } from '@/types'
import type { UiMessageKey } from '@/i18n/messages'

const props = defineProps<{
  titleKey: UiMessageKey
  labelKey: UiMessageKey
  entries: CountEntry[]
  kind: 'item' | 'payload'
}>()

const { t, itemLabel, payloadLabel } = useBlueprintI18n()

const translateEntry = computed(() =>
  props.kind === 'item' ? (name: string) => itemLabel(name) : (name: string) => payloadLabel(name),
)
</script>

<template>
  <section class="panel-card">
    <div class="panel-header">
      <p class="panel-flag">//Stats</p>
      <h2>{{ t(titleKey) }}</h2>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ t(labelKey) }}</th>
            <th>{{ t('countColumn') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in entries" :key="item.name">
            <td>
              <strong>{{ translateEntry(item.name) }}</strong>
              <p class="table-subtext">{{ item.name }}</p>
            </td>
            <td>{{ item.count }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.panel-card {
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 16px;
}

.panel-header {
  display: grid;
  gap: 4px;
  margin-bottom: 14px;
}

.panel-header h2,
.panel-flag {
  margin: 0;
}

.panel-flag {
  color: #c4a35a;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.panel-header h2 {
  color: #ffffff;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  max-height: 420px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 420px;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #3a3a3a;
  vertical-align: top;
  text-align: left;
}

th {
  position: sticky;
  top: 0;
  background: #2a2a2a;
  color: #c4a35a;
}

.table-subtext {
  margin-top: 4px;
  color: #a0a0a0;
  font-size: 12px;
  word-break: break-all;
}
</style>
