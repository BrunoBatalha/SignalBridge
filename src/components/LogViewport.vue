<script setup lang="ts">
import { ref, computed, watch, nextTick, type Ref } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { Badge } from '@/components/ui/badge'
import LogLine from './LogLine.vue'
import { useLogMinimap } from '@/composables/useLogMinimap'
import type { LogEntry } from '@/types/log'

const props = defineProps<{
  logs: LogEntry[]
  errorIndices: number[]
  warnIndices: number[]
  autoScroll: boolean
  label?: string
}>()

const scrollEl = ref<HTMLElement | null>(null)
const minimapCanvas = ref<HTMLCanvasElement | null>(null)

const logsRef = computed(() => props.logs)
const errorRef = computed(() => props.errorIndices)
const warnRef = computed(() => props.warnIndices)

const virtualizer = useVirtualizer(
  computed(() => ({
    count: props.logs.length,
    getScrollElement: () => scrollEl.value,
    estimateSize: () => 20,
    overscan: 30,
  })),
)

const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

const viewportStart = computed(() => {
  const items = virtualItems.value
  return items.length > 0 ? items[0].index : 0
})
const viewportEnd = computed(() => {
  const items = virtualItems.value
  return items.length > 0 ? items[items.length - 1].index : 0
})

function scrollToIndex(idx: number) {
  virtualizer.value.scrollToIndex(idx, { align: 'start' })
}

const { handleClick: minimapClick } = useLogMinimap(minimapCanvas, {
  filteredLogs: logsRef,
  errorIndices: errorRef,
  warnIndices: warnRef,
  scrollToIndex,
  viewportStart,
  viewportEnd,
})

// Auto-scroll to top on new data when enabled
watch(
  () => props.logs.length,
  () => {
    if (props.autoScroll) {
      nextTick(() => virtualizer.value.scrollToIndex(0))
    }
  },
)
</script>

<template>
  <div class="h-full flex overflow-hidden relative">
    <div ref="scrollEl" class="flex-1 overflow-auto font-mono text-xs scrollbar-stable">
      <div :style="{ height: `${totalSize}px`, width: '100%', position: 'relative' }">
        <div
          v-for="vItem in virtualItems"
          :key="vItem.key"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${vItem.size}px`,
            transform: `translateY(${vItem.start}px)`,
          }"
        >
          <LogLine :entry="props.logs[vItem.index]" />
        </div>
      </div>
    </div>
    <canvas
      ref="minimapCanvas"
      class="w-3 cursor-pointer shrink-0 border-l border-zinc-800"
      @click="minimapClick"
    />
    <Badge
      v-if="label"
      variant="outline"
      class="absolute top-2 right-6 text-[10px] uppercase tracking-wider opacity-60 pointer-events-none"
    >
      {{ label }}
    </Badge>
  </div>
</template>
