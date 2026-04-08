<script setup lang="ts">
import { useBlueprintI18n } from '@/composables/useBlueprintI18n'

const model = defineModel<string>({ required: true })
const { t } = useBlueprintI18n()
</script>

<template>
  <section class="editor-card">
    <div class="panel-header">
      <div>
        <p class="panel-flag">//JSON View</p>
        <h2>{{ t('jsonInput') }}</h2>
      </div>
      <p>{{ t('jsonInputHint') }}</p>
    </div>

    <textarea v-model="model" class="json-editor" spellcheck="false"></textarea>
  </section>
</template>

<style scoped>
.editor-card {
  display: grid;
  gap: 14px;
  min-height: 680px;
  padding: 16px;
  background: var(--page-background);
  border-bottom: 1px solid var(--border-subtle);
}

.json-editor {
  width: 100%;
  min-height: 600px;
  resize: vertical;
  border: 1px solid var(--bg-hover);
  border-radius: 8px;
  background: var(--page-background);
  color: var(--text-primary);
  padding: 18px 20px;
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
}

.json-editor:focus {
  outline: 1px solid rgba(196, 163, 90, 0.6);
  outline-offset: 0;
}

@media (max-width: 720px) {
  .editor-card {
    min-height: 0;
    padding: 12px;
    gap: 12px;
  }

  .json-editor {
    min-height: 320px;
    padding: 14px 16px;
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
