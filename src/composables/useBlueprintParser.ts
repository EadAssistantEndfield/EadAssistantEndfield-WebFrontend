import { computed, ref } from 'vue'
import type { UiMessageKey } from '@/i18n/messages'
import { summarizeBlueprint } from '@/utils/blueprint'
import type { BlueprintSummary } from '@/types'

const defaultJson = `{
  "share_code": "demo",
  "blueprint_data": {
    "name": "示例蓝图",
    "desc": "可直接粘贴真实 JSON 替换",
    "bp_size": { "x_len": 6, "z_len": 6 },
    "review_status_name": "Demo",
    "bp_param": { "source_type_name": "Local" },
    "nodes": [
      { "node_id": 1, "template_id": "power_station_1", "transform": { "position": { "x": 1, "y": 0, "z": 1 }, "has_interactive_param": true, "interactive_param": { "position": { "x": 1, "y": 0, "z": 1 }, "rotation": { "x": 0, "y": 0, "z": 0 }, "properties": {}, "property_count": 0 }, "snap_hint": { "mode": "grid_aligned_with_interactive_pose", "uses_grid_transform": true, "uses_interactive_param": true } }, "components": [] },
      { "node_id": 2, "template_id": "grid_belt_01", "transform": { "position": { "x": 2, "y": 0, "z": 1 }, "has_interactive_param": true, "interactive_param": { "position": { "x": 2, "y": 0, "z": 1 }, "rotation": { "x": 0, "y": 0, "z": 0 }, "properties": {}, "property_count": 0 }, "snap_hint": { "mode": "conveyor_path", "uses_grid_transform": false, "uses_interactive_param": false } }, "components": [] },
      { "node_id": 3, "template_id": "furnance_1", "product_icon": "item_carbon_enr", "transform": { "position": { "x": 3, "y": 0, "z": 1 }, "has_interactive_param": true, "interactive_param": { "position": { "x": 3, "y": 0, "z": 1 }, "rotation": { "x": 0, "y": 180, "z": 0 }, "properties": {}, "property_count": 0 }, "snap_hint": { "mode": "grid_aligned_with_interactive_pose", "uses_grid_transform": true, "uses_interactive_param": true } }, "components": [{ "payload_type": "formula_man" }] }
    ]
  }
}`

type Translate = (key: UiMessageKey) => string

export function useBlueprintParser(t: Translate) {
  const rawText = ref(defaultJson)
  const sourceName = ref('demo.json')
  const summary = ref<BlueprintSummary | null>(null)
  const errorKey = ref<UiMessageKey | null>(null)
  const errorFallback = ref('')

  const errorMessage = computed(() => {
    if (errorKey.value) {
      return t(errorKey.value)
    }

    return errorFallback.value
  })

  function localizeError(error: unknown) {
    if (!(error instanceof Error)) {
      errorKey.value = 'parseError'
      errorFallback.value = ''
      return
    }

    if (error.message === 'MISSING_BLUEPRINT_DATA') {
      errorKey.value = 'missingBlueprintData'
      errorFallback.value = ''
      return
    }

    errorKey.value = null
    errorFallback.value = error.message || t('parseError')
  }

  function rebuildSummary() {
    try {
      summary.value = summarizeBlueprint(rawText.value, sourceName.value)
      errorKey.value = null
      errorFallback.value = ''
    } catch (error) {
      summary.value = null
      localizeError(error)
    }
  }

  async function loadFile(file: File) {
    sourceName.value = file.name
    rawText.value = await file.text()
    rebuildSummary()
  }

  rebuildSummary()

  return {
    rawText,
    sourceName,
    summary,
    errorMessage,
    rebuildSummary,
    loadFile,
  }
}
