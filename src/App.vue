<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { serialPortManager } from './services/SerialPortManager'

const ports = ref<SerialPortInfo[]>([])
const selectedPathPort = ref('')
const command = ref('')
const logs = ref<string[]>(['SignalBridge iniciado.'])

async function refreshPorts() {
  if (!window.comBridge) {
    logs.value.unshift('Bridge Electron indisponível (modo web).')
    return
  }

  ports.value = await serialPortManager.listPorts()

  if (!ports.value.some((port) => port.path === selectedPathPort.value)) {
    selectedPathPort.value = ports.value[0]?.path ?? ''
  }

  logs.value.unshift(`Portas detectadas: ${ports.value.length}`)
}

async function send() {
  if (!command.value.trim()) return

  if (!window.comBridge) {
    logs.value.unshift(`TX${selectedPathPort.value ? ` (${selectedPathPort.value})` : ''} > ${command.value}`)
    command.value = ''
    return
  }

  await window.comBridge.sendCommand(command.value)
  command.value = ''
}

async function connect(){
  console.log('Conectando na porta', selectedPathPort.value)
  serialPortManager.connect(selectedPathPort.value)

  serialPortManager.onData((data) => {
    logs.value.unshift(`RX${selectedPathPort.value ? ` (${selectedPathPort.value})` : ''} > ${data}`)
  })
}

let unsubscribe: (() => void) | undefined

onMounted(() => {
    void refreshPorts()
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto max-w-5xl p-6 md:p-10">
      <header class="mb-6">
        <h1 class="text-3xl font-bold">SignalBridge</h1>
        <p class="mt-2 text-slate-300">Monitor COM, logs em tempo real e envio de comandos.</p>
      </header>

      <section class="grid gap-6 md:grid-cols-2">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Portas COM</h2>
            <button class="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-900" @click="refreshPorts">
              Atualizar
            </button>
          </div>

          <label class="mb-2 block text-sm text-slate-300" for="port-select">Selecione a porta</label>
          <div class="flex">
          <div class="relative flex-1">
            <select
              id="port-select"
              v-model="selectedPathPort"
              class="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-10 text-sm text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            >
              <option disabled value="">Escolha uma porta</option>
              <option v-for="port in ports" :key="port.path" :value="port.path">
                {{ port.friendlyName || port.path }}
              </option>
            </select>
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">▾</span>
          </div>
          <button class="ml-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950" @click="connect">
            Conectar
          </button>
          </div>

          <p v-if="selectedPathPort" class="mt-2 text-xs text-emerald-300">Porta selecionada: {{ selectedPathPort }}</p>
          <p v-else class="mt-2 text-xs text-slate-400">Nenhuma porta carregada.</p>
        </div>

        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 class="mb-4 text-lg font-semibold">Enviar Comando</h2>
          <div class="flex gap-2">
            <input
              v-model="command"
              class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
              placeholder="Ex.: AT+STATUS"
              @keyup.enter="send"
            />
            <button class="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950" @click="send">
              Enviar
            </button>
          </div>
        </div>
      </section>

      <section class="mt-6 rounded-xl border border-slate-800 bg-black/40 p-4">
        <h2 class="mb-3 text-lg font-semibold">Logs</h2>
        <div class="max-h-72 space-y-2 overflow-auto text-sm text-emerald-300">
          <p v-for="(log, index) in logs" :key="`${index}-${log}`" class="font-mono">{{ log }}</p>
        </div>
      </section>
    </div>
  </main>
</template>
