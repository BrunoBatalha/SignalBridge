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
  const buffer = ref<LogEntry[]>([])
  const highlightTerms = ref<HighlightTerm[]>([])
  const showOnlyHighlighted = ref(false)

  const bufferedCount = computed(() => buffer.value.length)

  function appendLog(text: string, level?: LogEntry['level'], source?: string) {
    const entry: LogEntry = {
      id: nextId++,
      text,
      timestamp: Date.now(),
      level: level ?? classifyLevel(text),
      source,
    }

    if (isFrozen.value) {
      buffer.value.push(entry)
      return
    }

    const arr = logs.value.slice()
    arr.unshift(entry)
    if (arr.length > MAX_LOGS) arr.length = MAX_LOGS
    logs.value = arr
    triggerRef(logs)
  }

  function releaseFrozen() {
    if (buffer.value.length === 0) return
    const arr = [...buffer.value.reverse(), ...logs.value]
    if (arr.length > MAX_LOGS) arr.length = MAX_LOGS
    buffer.value = []
    logs.value = arr
    triggerRef(logs)
  }

  function setFrozen(val: boolean) {
    isFrozen.value = val
    if (!val) releaseFrozen()
  }

  function clearLogs() {
    logs.value = []
    buffer.value = []
    triggerRef(logs)
  }

  const filteredLogs = computed(() => {
    if (!showOnlyHighlighted.value || highlightTerms.value.length === 0) {
      return logs.value
    }
    return logs.value.filter((entry) =>
      highlightTerms.value.some(({ term }) => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        return new RegExp(escaped, 'i').test(entry.text)
      }),
    )
  })

  const errorIndices = computed(() => {
    const indices: number[] = []
    const list = filteredLogs.value
    for (let i = 0; i < list.length; i++) {
      if (list[i].level === 'error') indices.push(i)
    }
    return indices
  })

  const warnIndices = computed(() => {
    const indices: number[] = []
    const list = filteredLogs.value
    for (let i = 0; i < list.length; i++) {
      if (list[i].level === 'warn') indices.push(i)
    }
    return indices
  })

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
    bufferedCount,
    highlightTerms,
    showOnlyHighlighted,
    errorIndices,
    warnIndices,
    appendLog,
    clearLogs,
    setFrozen,
    addHighlightTerm,
    removeHighlightTerm,
  }
}
