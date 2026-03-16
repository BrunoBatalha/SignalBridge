<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { Plug, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ConnectionStatus } from '@/composables/useSerialConnection'

const ports = inject<Ref<SerialPortInfo[]>>('ports')!
const selectedPath = inject<Ref<string>>('selectedPath')!
const connectionStatus = inject<Ref<ConnectionStatus>>('connectionStatus')!
const logCount = inject<Ref<number>>('logCount')!
const refreshPorts = inject<() => Promise<SerialPortInfo[]>>('refreshPorts')!
const connect = inject<() => void>('connect')!
</script>

<template>
  <header
    class="h-12 flex items-center gap-3 px-4 bg-zinc-950 border-b border-zinc-800 shadow-inner-panel shrink-0"
  >
    <span class="text-sm font-semibold tracking-tight text-foreground select-none">SignalBridge</span>

    <div class="w-px h-5 bg-zinc-800" />

    <Select v-model="selectedPath">
      <SelectTrigger class="w-48 h-8 text-xs">
        <SelectValue placeholder="Select port" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="port in ports" :key="port.path" :value="port.path">
          {{ port.friendlyName || port.path }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Button
      size="xs"
      variant="ghost"
      class="h-8 w-8 p-0"
      @click="refreshPorts"
    >
      <RefreshCw class="h-3.5 w-3.5" />
    </Button>

    <Button
      size="xs"
      variant="industrial"
      class="h-8 px-3"
      :class="{
        'animate-glow-pulse': connectionStatus === 'connecting',
        'shadow-glow-success border-emerald-700': connectionStatus === 'connected',
      }"
      :disabled="!selectedPath || connectionStatus === 'connected'"
      @click="connect"
    >
      <Plug class="h-3.5 w-3.5" />
      <span>{{ connectionStatus === 'connected' ? 'Connected' : 'Connect' }}</span>
    </Button>

    <Badge
      :variant="connectionStatus === 'connected' ? 'default' : 'secondary'"
      class="text-xs gap-1.5"
    >
      <span
        class="h-1.5 w-1.5 rounded-full"
        :class="connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-zinc-500'"
      />
      {{ connectionStatus === 'connected' ? selectedPath : 'Disconnected' }}
    </Badge>

    <span class="text-xs text-muted-foreground">115200 baud</span>

    <div class="flex-1" />

    <span class="text-xs text-muted-foreground tabular-nums">{{ logCount }} lines</span>
  </header>
</template>
