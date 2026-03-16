<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'
import { Plug, Unplug, RefreshCw, HelpCircle } from 'lucide-vue-next'
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
const selectedBaudRate = inject<Ref<number>>('selectedBaudRate')!
const connectionStatus = inject<Ref<ConnectionStatus>>('connectionStatus')!
const logCount = inject<Ref<number>>('logCount')!
const refreshPorts = inject<() => Promise<SerialPortInfo[]>>('refreshPorts')!
const connect = inject<() => void>('connect')!
const disconnect = inject<() => void>('disconnect')!

const startTour = inject<() => void>('startTour')!

const isConnected = computed(() => connectionStatus.value === 'connected')

const baudRates = ['300', '1200', '2400', '4800', '9600', '19200', '38400', '57600', '115200', '230400', '460800', '921600']
const baudRateModel = computed({
  get: () => String(selectedBaudRate.value),
  set: (v: string) => { selectedBaudRate.value = Number(v) },
})
</script>

<template>
  <header
    class="h-12 flex items-center gap-3 px-4 bg-zinc-950 border-b border-zinc-800 shadow-inner-panel shrink-0"
  >
    <span data-tour="app-title" class="text-sm font-semibold tracking-tight text-foreground select-none">SignalBridge</span>

    <div class="w-px h-5 bg-zinc-800" />

    <Select v-model="selectedPath" :disabled="isConnected">
      <SelectTrigger data-tour="port-select" class="w-48 h-8 text-xs" :class="{ 'opacity-50 cursor-not-allowed': isConnected }">
        <SelectValue placeholder="Select port" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="port in ports" :key="port.path" :value="port.path">
          {{ port.friendlyName || port.path }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Button
      data-tour="refresh-ports"
      size="xs"
      variant="ghost"
      class="h-8 w-8 p-0"
      :disabled="isConnected"
      @click="refreshPorts"
    >
      <RefreshCw class="h-3.5 w-3.5" />
    </Button>

    <Button
      v-if="!isConnected"
      data-tour="connect-btn"
      size="xs"
      variant="industrial"
      class="h-8 px-3"
      :class="{
        'animate-glow-pulse': connectionStatus === 'connecting',
      }"
      :disabled="!selectedPath"
      @click="connect"
    >
      <Plug class="h-3.5 w-3.5" />
      <span>Connect</span>
    </Button>

    <Button
      v-else
      data-tour="connect-btn"
      size="xs"
      variant="destructive"
      class="h-8 px-3"
      @click="disconnect"
    >
      <Unplug class="h-3.5 w-3.5" />
      <span>Disconnect</span>
    </Button>

    <Badge
      data-tour="connection-status"
      :variant="connectionStatus === 'connected' ? 'default' : 'secondary'"
      class="text-xs gap-1.5"
    >
      <span
        class="h-1.5 w-1.5 rounded-full"
        :class="connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-zinc-500'"
      />
      {{ connectionStatus === 'connected' ? selectedPath : 'Disconnected' }}
    </Badge>

    <Select v-model="baudRateModel" :disabled="isConnected">
      <SelectTrigger data-tour="baud-rate" class="w-32 h-8 text-xs" :class="{ 'opacity-50 cursor-not-allowed': isConnected }">
        <SelectValue placeholder="Baud rate" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="rate in baudRates" :key="rate" :value="rate">
          {{ rate }} baud
        </SelectItem>
      </SelectContent>
    </Select>

    <div class="flex-1" />

    <span data-tour="log-count" class="text-xs text-muted-foreground tabular-nums">{{ logCount }} lines</span>

    <Button
      size="xs"
      variant="ghost"
      class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
      @click="startTour"
    >
      <HelpCircle class="h-3.5 w-3.5" />
    </Button>
  </header>
</template>
