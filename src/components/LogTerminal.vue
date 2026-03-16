<script setup lang="ts">
import { ref, inject, computed, type Ref } from 'vue'
import { Pause, Play, Filter, Highlighter, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import LogViewport from './LogViewport.vue'
import type { LogEntry, HighlightTerm } from '@/types/log'

const filteredLogs = inject<Ref<LogEntry[]>>('filteredLogs')!
const filteredFrozenSnapshot = inject<Ref<LogEntry[]>>('filteredFrozenSnapshot')!
const isFrozen = inject<Ref<boolean>>('isFrozen')!
const highlightTerms = inject<Ref<HighlightTerm[]>>('highlightTerms')!
const showOnlyHighlighted = inject<Ref<boolean>>('showOnlyHighlighted')!
const errorIndices = inject<Ref<number[]>>('errorIndices')!
const warnIndices = inject<Ref<number[]>>('warnIndices')!
const frozenErrorIndices = inject<Ref<number[]>>('frozenErrorIndices')!
const frozenWarnIndices = inject<Ref<number[]>>('frozenWarnIndices')!
const setFrozen = inject<(val: boolean) => void>('setFrozen')!
const clearLogs = inject<() => void>('clearLogs')!
const addHighlightTerm = inject<(term: string) => void>('addHighlightTerm')!
const removeHighlightTerm = inject<(term: string) => void>('removeHighlightTerm')!

const highlightModalOpen = ref(false)
const highlightInput = ref('')

const newLogsSinceFreeze = computed(() => {
  if (!isFrozen.value) return 0
  return Math.max(0, filteredLogs.value.length - filteredFrozenSnapshot.value.length)
})

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

      <Badge v-if="isFrozen && newLogsSinceFreeze > 0" variant="secondary" class="text-xs tabular-nums">
        +{{ newLogsSinceFreeze }} new
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

    <!-- Log viewport(s) -->
    <div class="flex-1 overflow-hidden">
      <!-- Split view when frozen -->
      <ResizablePanelGroup v-if="isFrozen" direction="horizontal" class="h-full">
        <ResizablePanel :default-size="50" :min-size="20">
          <LogViewport
            :logs="filteredFrozenSnapshot"
            :error-indices="frozenErrorIndices"
            :warn-indices="frozenWarnIndices"
            :auto-scroll="false"
            label="Frozen"
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel :default-size="50" :min-size="20">
          <LogViewport
            :logs="filteredLogs"
            :error-indices="errorIndices"
            :warn-indices="warnIndices"
            :auto-scroll="true"
            label="Live"
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <!-- Single view when not frozen -->
      <LogViewport
        v-else
        :logs="filteredLogs"
        :error-indices="errorIndices"
        :warn-indices="warnIndices"
        :auto-scroll="true"
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
