<script setup lang="ts">
import type { FacilityGridItem } from '@/features/blueprint/components/overview/overviewTypes'

defineProps<{
  items: FacilityGridItem[]
}>()

const emit = defineEmits<{
  imageError: [key: string]
}>()
</script>

<template>
  <div class="facility-grid">
    <article
      v-for="item in items"
      :key="item.key"
      :data-key="item.key"
      class="facility-card animate-slide-in-up opacity-0"
      :class="{ 'facility-card--dim': item.dim }"
      :style="{ animationDelay: `${item.delay ?? 0}ms`, animationFillMode: 'forwards' }"
    >
      <div class="facility-icon" :style="{ '--facility-color': item.color }">
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          :alt="item.label"
          loading="lazy"
          decoding="async"
          @error="emit('imageError', item.key)"
        />
        <span v-else>{{ item.label.slice(0, 1) }}</span>
      </div>
      <div class="facility-copy">
        <strong>{{ item.label }}</strong>
        <span class="facility-count">{{ item.count }}</span>
      </div>
    </article>
  </div>
</template>

<style scoped>
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

@media (max-width: 720px) {
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

  .facility-count {
    font-size: 11px;
  }
}

@media (max-width: 520px) {
  .facility-grid {
    grid-template-columns: 1fr;
  }
}
</style>
