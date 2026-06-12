<script setup lang="ts">
import FacilityGrid from '@/features/blueprint/components/overview/FacilityGrid.vue'
import type { FacilityGridItem } from '@/features/blueprint/components/overview/overviewTypes'

defineProps<{
  label: string
  items: FacilityGridItem[]
}>()
</script>

<template>
  <div class="stream-block">
    <span class="stream-label">//{{ label }}</span>
    <FacilityGrid :items="items" />
  </div>
</template>

<style scoped>
.stream-block {
  margin-bottom: 12px;
}

.stream-label {
  color: var(--text-secondary);
  font-size: 12px;
  display: block;
  margin-bottom: 8px;
}

@media (max-width: 720px) {
  .stream-label {
    font-size: 11px;
  }
}
</style>
