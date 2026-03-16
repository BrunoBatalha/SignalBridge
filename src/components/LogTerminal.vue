<script setup lang="ts">
import { ref, inject, computed, watch, nextTick, type Ref } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { Pause, Play, Filter, Highlighter, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import LogLine from './LogLine.vue'
import { useLogMinimap } from '@/composables/useLogMinimap'
import type { LogEntry, HighlightTerm } from '@/types/log'

const filteredLogs = inject<Ref<LogEntry[]>>('filteredLogs')!
const isFrozen = inject<Ref<boolean>>('isFrozen')!
const bufferedCount = inject<Ref<number>>('bufferedCount')!
const highlightTerms = inject<Ref<HighlightTerm[]>>('highlightTerms')!
const showOnlyHighlighted = inject<Ref<boolean>>('showOnlyHighlighted')!
const errorIndices = inject<Ref<number[]>>('errorIndices')!
const warnIndices = inject<Ref<number[]>>('warnIndices')!
const setFrozen = inject<(val: boolean) => void>('setFrozen')!
const clearLogs = inject<() => void>('clearLogs')!
const addHighlightTerm = inject<(term: string) => void>('addHighlightTerm')!
const removeHighlightTerm = inject<(term: string) => void>('removeHighlightTerm')!

const scrollEl = ref<HTMLElement | null>(null)
const minimapCanvas = ref<HTMLCanvasElement | null>(null)
const highlightModalOpen = ref(false)
const highlightInput = ref('')

const virtualizer = useVirtualizer(
  computed(() => ({
    count: filteredLogs.value.length,
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
  filteredLogs,
  errorIndices,
  warnIndices,
  scrollToIndex,
  viewportStart,
  viewportEnd,
})

// Auto-scroll to top on new data (unless frozen)
watch(
  () => filteredLogs.value.length,
  () => {
    if (!isFrozen.value) {
      nextTick(() => virtualizer.value.scrollToIndex(0))
    }
  },
)

function doAddHighlight() {
  const term = highlightInput.value.trim()
  if (term) {
    addHighlightTerm(term)
    highlightInput.value = ''
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-card">
    <!-- Toolbar -->
    <div
      class="flex items-center gap-2 px-3 h-9 border-b border-zinc-800 bg-zinc-950 shrink-0"
    >
      <Button
        size="xs"
        :variant="isFrozen ? 'default' : 'ghost'"
        class="h-7 gap-1 text-xs"
        @click="setFrozen(!isFrozen)"
      >
        <Pause v-if="!isFrozen" class="h-3 w-3" />
        <Play v-else class="h-3 w-3" />
        {{ isFrozen ? 'Resume' : 'Freeze' }}
      </Button>

      <Badge v-if="isFrozen && bufferedCount > 0" variant="secondary" class="text-xs tabular-nums">
        +{{ bufferedCount }} buffered
      </Badge>

      <div class="w-px h-4 bg-zinc-800" />

      <Button
        size="xs"
        variant="ghost"
        class="h-7 gap-1 text-xs"
        :class="{ 'text-primary': showOnlyHighlighted }"
        @click="showOnlyHighlighted = !showOnlyHighlighted"
      >
        <Filter class="h-3 w-3" />
        Filter
      </Button>

      <Button
        size="xs"
        variant="ghost"
        class="h-7 gap-1 text-xs"
        @click="highlightModalOpen = true"
      >
        <Highlighter class="h-3 w-3" />
        Highlight
      </Button>

      <div class="flex-1" />

      <Button
        size="xs"
        variant="ghost"
        class="h-7 gap-1 text-xs text-muted-foreground"
        @click="clearLogs"
      >
        <Trash2 class="h-3 w-3" />
        Clear
      </Button>
    </div>

    <!-- Log viewport + minimap -->
    <div class="flex-1 flex overflow-hidden">
      <div ref="scrollEl" class="flex-1 overflow-auto font-mono text-xs">
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
            <LogLine :entry="filteredLogs[vItem.index]" />
          </div>
        </div>
      </div>
      <canvas
        ref="minimapCanvas"
        class="w-3 cursor-pointer shrink-0 border-l border-zinc-800"
        @click="minimapClick"
      />
    </div>

    <!-- Highlight Dialog -->
    <Dialog v-model:open="highlightModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Highlight Terms</DialogTitle>
          <DialogDescription>Add terms to highlight in the log output.</DialogDescription>
        </DialogHeader>
        <div class="flex gap-2">
          <Input
            v-model="highlightInput"
            placeholder="Enter a term..."
            @keyup.enter="doAddHighlight"
          />
          <Button size="sm" @click="doAddHighlight" :disabled="!highlightInput.trim()">
            Add
          </Button>
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
          <div
            v-for="item in highlightTerms"
            :key="item.term"
            class="flex items-center gap-1 px-2 py-1 rounded-sm text-xs text-black"
            :style="{ backgroundColor: item.color }"
          >
            <span>{{ item.term }}</span>
            <button @click="removeHighlightTerm(item.term)" class="ml-1 hover:opacity-70 font-bold">
              &times;
            </button>
          </div>
          <p
            v-if="highlightTerms.length === 0"
            class="text-sm text-muted-foreground w-full text-center py-2"
          >
            No highlight terms set.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
