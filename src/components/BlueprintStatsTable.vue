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
  display: grid;
}
</style>
