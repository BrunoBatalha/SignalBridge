<script setup lang="ts">
import { ref, inject, computed, onMounted, onUnmounted, type Ref } from 'vue'
import { Send, Copy, Terminal } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGlowFeedback } from '@/composables/useGlowFeedback'

const commandHistory = inject<Ref<string[]>>('commandHistory')!
const allSuggestions = inject<Ref<string[]>>('allSuggestions')!
const addToHistory = inject<(cmd: string) => void>('addToHistory')!
const sendCommand = inject<(cmd: string) => void>('sendCommand')!

const command = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const showSuggestions = ref(false)
const selectedSuggestionIdx = ref(-1)
const copiedIdx = ref<number | null>(null)

const { isGlowing: sendGlow, trigger: triggerSendGlow } = useGlowFeedback(400)

const filtered = computed(() => {
  if (!command.value.trim()) return []
  const q = command.value.toLowerCase()
  return allSuggestions.value.filter((s) => s.toLowerCase().includes(q)).slice(0, 10)
})

function send(cmd?: string) {
  const c = (cmd ?? command.value).trim()
  if (!c) return
  sendCommand(c)
  addToHistory(c)
  command.value = ''
  showSuggestions.value = false
  triggerSendGlow()
}

function resend(cmd: string) {
  sendCommand(cmd)
  triggerSendGlow()
}

async function copy(cmd: string, idx: number) {
  try {
    await navigator.clipboard.writeText(cmd)
    copiedIdx.value = idx
    setTimeout(() => {
      if (copiedIdx.value === idx) copiedIdx.value = null
    }, 1500)
  } catch {}
}

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' && filtered.value.length > 0) {
    e.preventDefault()
    showSuggestions.value = true
    selectedSuggestionIdx.value = Math.min(
      selectedSuggestionIdx.value + 1,
      filtered.value.length - 1,
    )
  } else if (e.key === 'ArrowUp' && showSuggestions.value) {
    e.preventDefault()
    selectedSuggestionIdx.value = Math.max(selectedSuggestionIdx.value - 1, 0)
  } else if (e.key === 'Enter') {
    if (showSuggestions.value && selectedSuggestionIdx.value >= 0) {
      command.value = filtered.value[selectedSuggestionIdx.value]
      showSuggestions.value = false
      selectedSuggestionIdx.value = -1
    } else {
      send()
    }
  } else if (e.key === 'Escape') {
    showSuggestions.value = false
  }
}

function onInput() {
  showSuggestions.value = command.value.trim().length > 0 && filtered.value.length > 0
  selectedSuggestionIdx.value = -1
}

function selectSuggestion(s: string) {
  command.value = s
  showSuggestions.value = false
  inputEl.value?.focus()
}

// Ctrl+K global focus
function handleGlobalKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    inputEl.value?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', handleGlobalKey))
onUnmounted(() => window.removeEventListener('keydown', handleGlobalKey))
</script>

<template>
  <div class="h-full flex flex-col bg-card">
    <!-- Input row -->
    <div data-tour="command-bar" class="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-950 shrink-0 relative">
      <Terminal class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span class="text-xs text-muted-foreground select-none">$</span>
      <Input
        ref="inputEl"
        v-model="command"
        placeholder="Enter command... (Ctrl+K)"
        class="flex-1 h-7 text-xs font-mono bg-transparent border-0 shadow-none focus-visible:ring-0 px-0"
        @keydown="onInputKeydown"
        @input="onInput"
      />
      <Button
        size="xs"
        variant="industrial"
        class="h-7 px-2"
        :class="{ 'shadow-glow-primary': sendGlow }"
        :disabled="!command.trim()"
        @click="send()"
      >
        <Send class="h-3 w-3" />
      </Button>

      <!-- Autocomplete dropdown -->
      <div
        v-if="showSuggestions && filtered.length > 0"
        class="absolute left-0 right-0 bottom-full mb-1 mx-3 bg-popover border border-zinc-800 rounded-sm shadow-lg z-50 max-h-40 overflow-auto"
      >
        <button
          v-for="(s, i) in filtered"
          :key="s"
          class="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-accent transition-colors"
          :class="{ 'bg-accent': i === selectedSuggestionIdx }"
          @mousedown.prevent="selectSuggestion(s)"
        >
          {{ s }}
        </button>
      </div>
    </div>

    <!-- Command history -->
    <div data-tour="command-history" class="flex-1 overflow-auto">
      <div
        v-for="(cmd, idx) in commandHistory"
        :key="`${idx}-${cmd}`"
        class="flex items-center gap-2 px-3 py-1 text-xs font-mono hover:bg-white/[0.02] group"
      >
        <span class="text-muted-foreground shrink-0 select-none">$</span>
        <span class="flex-1 truncate text-foreground">{{ cmd }}</span>
        <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="xs" variant="ghost" class="h-6 w-6 p-0" @click="copy(cmd, idx)">
            <Copy class="h-3 w-3" />
          </Button>
          <Button size="xs" variant="ghost" class="h-6 w-6 p-0" @click="resend(cmd)">
            <Send class="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p
        v-if="commandHistory.length === 0"
        class="text-xs text-muted-foreground text-center py-6"
      >
        No commands sent yet.
      </p>
    </div>
  </div>
</template>
