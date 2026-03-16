<script setup lang="ts">
import { ref, inject, type Ref } from 'vue'
import { Star, Send, Copy, Trash2, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useGlowFeedback } from '@/composables/useGlowFeedback'

const favorites = inject<Ref<string[]>>('favorites')!
const addFavorite = inject<(cmd: string) => void>('addFavorite')!
const removeFavorite = inject<(cmd: string) => void>('removeFavorite')!
const sendCommand = inject<(cmd: string) => void>('sendCommand')!

const favoriteInput = ref('')
const copiedIdx = ref<number | null>(null)
const { isGlowing: sendGlow, trigger: triggerSendGlow } = useGlowFeedback(400)
const glowIdx = ref<number | null>(null)

function doAdd() {
  const cmd = favoriteInput.value.trim()
  if (cmd) {
    addFavorite(cmd)
    favoriteInput.value = ''
  }
}

function doSend(cmd: string, idx: number) {
  sendCommand(cmd)
  glowIdx.value = idx
  triggerSendGlow()
  setTimeout(() => {
    if (glowIdx.value === idx) glowIdx.value = null
  }, 400)
}

async function doCopy(cmd: string, idx: number) {
  try {
    await navigator.clipboard.writeText(cmd)
    copiedIdx.value = idx
    setTimeout(() => {
      if (copiedIdx.value === idx) copiedIdx.value = null
    }, 1500)
  } catch {}
}
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <div class="h-full flex flex-col bg-card border-l border-zinc-800">
      <!-- Header -->
      <div class="flex items-center gap-2 px-3 h-9 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <Star class="h-3.5 w-3.5 text-muted-foreground" />
        <span class="text-xs font-medium text-foreground">Favorites</span>
        <Badge variant="secondary" class="text-[10px] h-4 px-1.5 tabular-nums">
          {{ favorites.length }}
        </Badge>
      </div>

      <!-- Add input -->
      <div class="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800 shrink-0">
        <Input
          v-model="favoriteInput"
          placeholder="Add command..."
          class="flex-1 h-7 text-xs font-mono"
          @keyup.enter="doAdd"
        />
        <Button size="xs" variant="ghost" class="h-7 w-7 p-0" @click="doAdd" :disabled="!favoriteInput.trim()">
          <Plus class="h-3.5 w-3.5" />
        </Button>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-auto">
        <div
          v-for="(cmd, idx) in favorites"
          :key="cmd"
          class="flex items-center gap-2 px-3 py-1.5 text-xs font-mono hover:bg-white/[0.02] group"
          :class="{ 'shadow-glow-primary': glowIdx === idx }"
        >
          <Tooltip>
            <TooltipTrigger as-child>
              <span class="flex-1 truncate text-foreground cursor-default">{{ cmd }}</span>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p class="font-mono text-xs">{{ cmd }}</p>
            </TooltipContent>
          </Tooltip>

          <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button size="xs" variant="ghost" class="h-6 w-6 p-0" @click="doSend(cmd, idx)">
              <Send class="h-3 w-3" />
            </Button>
            <Button size="xs" variant="ghost" class="h-6 w-6 p-0" @click="doCopy(cmd, idx)">
              <Copy class="h-3 w-3" />
            </Button>
            <Button
              size="xs"
              variant="ghost"
              class="h-6 w-6 p-0 text-destructive hover:text-destructive"
              @click="removeFavorite(cmd)"
            >
              <Trash2 class="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p
          v-if="favorites.length === 0"
          class="text-xs text-muted-foreground text-center py-6"
        >
          No favorites saved.
        </p>
      </div>
    </div>
  </TooltipProvider>
</template>
