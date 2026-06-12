import { computed, onBeforeUnmount, onMounted, ref, toValue, type MaybeRefOrGetter } from 'vue'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 5

export function useBlueprintLayoutViewport(svgWidthSource: MaybeRefOrGetter<number>, svgHeightSource: MaybeRefOrGetter<number>) {
  const scrollerRef = ref<HTMLElement | null>(null)
  const scrollerWidth = ref(0)
  const scrollerHeight = ref(0)
  const userZoom = ref(1)
  const isPanning = ref(false)
  const panStart = ref({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  let scrollerResizeObserver: ResizeObserver | null = null

  function updateScrollerSize() {
    const element = scrollerRef.value
    if (!element) {
      return
    }

    scrollerWidth.value = Math.max(0, element.clientWidth)
    scrollerHeight.value = Math.max(0, element.clientHeight)
  }

  function onWheel(e: WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) {
      return
    }

    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    userZoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((userZoom.value + delta) * 100) / 100))
  }

  function resetZoom() {
    userZoom.value = 1
    const element = scrollerRef.value
    if (element) {
      element.scrollLeft = 0
      element.scrollTop = 0
    }
  }

  function onPanStart(e: MouseEvent) {
    if (e.button !== 0 || userZoom.value <= 1 || !scrollerRef.value) {
      return
    }

    isPanning.value = true
    panStart.value = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollerRef.value.scrollLeft,
      scrollTop: scrollerRef.value.scrollTop,
    }
  }

  function onPanMove(e: MouseEvent) {
    if (!isPanning.value || !scrollerRef.value) {
      return
    }

    scrollerRef.value.scrollLeft = panStart.value.scrollLeft - (e.clientX - panStart.value.x)
    scrollerRef.value.scrollTop = panStart.value.scrollTop - (e.clientY - panStart.value.y)
  }

  function onPanEnd() {
    isPanning.value = false
  }

  const svgScale = computed(() => {
    const svgWidth = toValue(svgWidthSource)
    const svgHeight = toValue(svgHeightSource)
    if (!svgWidth || !svgHeight) {
      return 1
    }

    const widthScale = scrollerWidth.value > 0 ? scrollerWidth.value / svgWidth : 1
    const heightScale = scrollerHeight.value > 0 ? scrollerHeight.value / svgHeight : 1

    return Math.min(widthScale, heightScale) * userZoom.value
  })

  const zoomPercent = computed(() => Math.round(userZoom.value * 100))
  const renderedSvgWidth = computed(() => Math.max(0, Math.round(toValue(svgWidthSource) * svgScale.value)))
  const renderedSvgHeight = computed(() => Math.max(0, Math.round(toValue(svgHeightSource) * svgScale.value)))

  onMounted(() => {
    updateScrollerSize()

    if (typeof ResizeObserver === 'undefined' || !scrollerRef.value) {
      return
    }

    scrollerResizeObserver = new ResizeObserver(() => {
      updateScrollerSize()
    })

    scrollerResizeObserver.observe(scrollerRef.value)
  })

  onBeforeUnmount(() => {
    scrollerResizeObserver?.disconnect()
  })

  return {
    scrollerRef,
    userZoom,
    isPanning,
    zoomPercent,
    renderedSvgWidth,
    renderedSvgHeight,
    resetZoom,
    onWheel,
    onPanStart,
    onPanMove,
    onPanEnd,
  }
}
