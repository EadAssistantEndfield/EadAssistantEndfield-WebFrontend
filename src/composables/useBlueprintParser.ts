import { computed, ref } from 'vue'
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
      { "node_id": 1, "template_id": "power_station_1", "transform": { "position": { "x": 1, "y": 0, "z": 1 } }, "components": [] },
      { "node_id": 2, "template_id": "grid_belt_01", "transform": { "position": { "x": 2, "y": 0, "z": 1 } }, "components": [] },
      { "node_id": 3, "template_id": "furnance_1", "product_icon": "item_carbon_enr", "transform": { "position": { "x": 3, "y": 0, "z": 1 }, "has_interactive_param": true }, "components": [{ "payload_type": "formula_man" }] }
    ]
  }
}`

type Translate = (key: string) => string

export function useBlueprintParser(t: Translate) {
  const rawText = ref(defaultJson)
  const sourceName = ref('demo.json')
  const summary = ref<BlueprintSummary | null>(null)
  const errorKey = ref<string | null>(null)
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
