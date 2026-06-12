<script setup lang="ts">
const queryInput = defineModel<string>({ required: true })

defineProps<{
  label: string
  placeholder: string
  queryLoading: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <div class="share-card animate-slide-in-up opacity-0" style="animation-delay: 50ms; animation-fill-mode: forwards">
    <div class="share-card-content">
      <div class="share-card-info">
        <span class="share-label">{{ label }}</span>
        <input
          v-model="queryInput"
          class="share-value share-value--input"
          :placeholder="placeholder"
          :disabled="queryLoading"
          @keydown.enter="emit('submit')"
        />
      </div>
      <button
        type="button"
        class="share-btn"
        :disabled="queryLoading || !queryInput.trim()"
        @click="emit('submit')"
      >
        <span class="share-btn-icon">&#9998;</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
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

.share-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.share-btn-icon {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.share-btn:hover .share-btn-icon {
  color: #1a1a1a;
}

@media (max-width: 720px) {
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
}
</style>
