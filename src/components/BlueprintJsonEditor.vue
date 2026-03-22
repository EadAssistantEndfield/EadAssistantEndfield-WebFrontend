<script setup lang="ts">
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'

const model = defineModel<string>({ required: true })
const { t } = useBlueprintI18n()
</script>

<template>
  <section class="panel-card editor-card">
    <div class="panel-header">
      <h2>{{ t('jsonInput') }}</h2>
      <p>{{ t('jsonInputHint') }}</p>
    </div>

    <textarea v-model="model" class="json-editor" spellcheck="false"></textarea>
  </section>
</template>

<style scoped>
.editor-card {
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

.panel-header p {
  color: #9fb0c8;
}

.json-editor {
  width: 100%;
  min-height: 580px;
  resize: vertical;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  background: rgba(2, 6, 23, 0.8);
  color: #e2e8f0;
  padding: 16px;
  font-family: "Cascadia Code", Consolas, monospace;
  line-height: 1.65;
}
</style>
