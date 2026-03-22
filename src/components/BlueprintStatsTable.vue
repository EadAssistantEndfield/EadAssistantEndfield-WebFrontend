<script setup lang="ts">
import { computed } from 'vue'
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'
import type { CountEntry } from '@/types'

const props = defineProps<{
  titleKey: string
  labelKey: string
  entries: CountEntry[]
  kind: 'item' | 'payload'
}>()

const { t, itemLabel, payloadLabel } = useBlueprintI18n()

const translateEntry = computed(() =>
  props.kind === 'item'
    ? (name: string) => itemLabel(name)
    : (name: string) => payloadLabel(name),
)
</script>

<template>
  <section class="panel-card">
    <div class="panel-header">
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

.table-wrap {
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
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
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  vertical-align: top;
  text-align: left;
}

th {
  position: sticky;
  top: 0;
  background: rgba(15, 23, 42, 0.96);
  color: #93c5fd;
}

.table-subtext {
  margin-top: 4px;
  color: #8fa3c0;
  font-size: 12px;
  word-break: break-all;
}
</style>
