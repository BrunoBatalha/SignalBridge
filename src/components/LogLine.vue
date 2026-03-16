<script setup lang="ts">
import { inject, type Ref } from 'vue'
import type { LogEntry, HighlightTerm } from '@/types/log'

const props = defineProps<{ entry: LogEntry }>()

const highlightTerms = inject<Ref<HighlightTerm[]>>('highlightTerms')!

const levelColorClass: Record<LogEntry['level'], string> = {
  rx: 'text-log-rx',
  tx: 'text-log-tx',
  error: 'text-log-error',
  warn: 'text-log-warn',
  info: 'text-log-info',
  system: 'text-muted-foreground',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return (
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0') +
    ':' +
    String(d.getSeconds()).padStart(2, '0') +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  )
}

function renderSegments(text: string, terms: HighlightTerm[]): { text: string; bg?: string }[] {
  if (terms.length === 0) return [{ text }]

  const pattern = terms
    .map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)

  return parts
    .filter((p) => p !== '')
    .map((part) => {
      const match = terms.find((t) => t.term.toLowerCase() === part.toLowerCase())
      return match ? { text: part, bg: match.color } : { text: part }
    })
}
</script>

<template>
  <div class="flex items-baseline gap-2 px-3 py-px leading-5 hover:bg-white/[0.02]">
    <span class="text-zinc-600 shrink-0 select-none tabular-nums">{{
      formatTime(props.entry.timestamp)
    }}</span>
    <span :class="levelColorClass[props.entry.level]">
      <template v-for="(seg, i) in renderSegments(props.entry.text, highlightTerms)" :key="i">
        <span
          v-if="seg.bg"
          class="rounded-sm px-0.5"
          :style="{ backgroundColor: seg.bg, color: '#000' }"
          >{{ seg.text }}</span
        >
        <template v-else>{{ seg.text }}</template>
      </template>
    </span>
  </div>
</template>
