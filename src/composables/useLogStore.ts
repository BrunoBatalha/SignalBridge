import { ref, computed, shallowRef, triggerRef } from 'vue'
import type { LogEntry, HighlightTerm } from '@/types/log'

const MAX_LOGS = 100_000
let nextId = 0

function classifyLevel(text: string): LogEntry['level'] {
  if (/\b(ERROR|FAIL|FATAL)\b/i.test(text)) return 'error'
  if (/\bWARN(ING)?\b/i.test(text)) return 'warn'
  if (/\bINFO\b/i.test(text)) return 'info'
  return 'rx'
}

export function useLogStore() {
  const logs = shallowRef<LogEntry[]>([])
  const isFrozen = ref(false)
  const frozenSnapshot = shallowRef<LogEntry[]>([])
  const highlightTerms = ref<HighlightTerm[]>([])
  const showOnlyHighlighted = ref(false)

  function appendLog(text: string, level?: LogEntry['level'], source?: string) {
    const entry: LogEntry = {
      id: nextId++,
      text,
      timestamp: Date.now(),
      level: level ?? classifyLevel(text),
      source,
    }

    const arr = logs.value.slice()
    arr.unshift(entry)
    if (arr.length > MAX_LOGS) arr.length = MAX_LOGS
    logs.value = arr
    triggerRef(logs)
  }

  function setFrozen(val: boolean) {
    isFrozen.value = val
    if (val) {
      frozenSnapshot.value = logs.value.slice()
      triggerRef(frozenSnapshot)
    } else {
      frozenSnapshot.value = []
      triggerRef(frozenSnapshot)
    }
  }

  function clearLogs() {
    logs.value = []
    frozenSnapshot.value = []
    isFrozen.value = false
    triggerRef(logs)
    triggerRef(frozenSnapshot)
  }

  function applyHighlightFilter(list: LogEntry[]): LogEntry[] {
    if (!showOnlyHighlighted.value || highlightTerms.value.length === 0) {
      return list
    }
    return list.filter((entry) =>
      highlightTerms.value.some(({ term }) => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        return new RegExp(escaped, 'i').test(entry.text)
      }),
    )
  }

  const filteredLogs = computed(() => applyHighlightFilter(logs.value))

  const filteredFrozenSnapshot = computed(() => applyHighlightFilter(frozenSnapshot.value))

  function computeIndices(list: LogEntry[], level: string): number[] {
    const indices: number[] = []
    for (let i = 0; i < list.length; i++) {
      if (list[i].level === level) indices.push(i)
    }
    return indices
  }

  const errorIndices = computed(() => computeIndices(filteredLogs.value, 'error'))
  const warnIndices = computed(() => computeIndices(filteredLogs.value, 'warn'))
  const frozenErrorIndices = computed(() => computeIndices(filteredFrozenSnapshot.value, 'error'))
  const frozenWarnIndices = computed(() => computeIndices(filteredFrozenSnapshot.value, 'warn'))

  function addHighlightTerm(term: string) {
    if (!term || highlightTerms.value.some((t) => t.term === term)) return
    const hue = Math.floor(Math.random() * 360)
    highlightTerms.value.push({ term, color: `hsl(${hue}, 70%, 80%)` })
  }

  function removeHighlightTerm(term: string) {
    highlightTerms.value = highlightTerms.value.filter((t) => t.term !== term)
  }

  return {
    logs,
    filteredLogs,
    isFrozen,
    frozenSnapshot,
    filteredFrozenSnapshot,
    highlightTerms,
    showOnlyHighlighted,
    errorIndices,
    warnIndices,
    frozenErrorIndices,
    frozenWarnIndices,
    appendLog,
    clearLogs,
    setFrozen,
    addHighlightTerm,
    removeHighlightTerm,
  }
}
