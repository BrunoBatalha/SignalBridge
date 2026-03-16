<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { Copy, Send, Trash2 } from 'lucide-vue-next'
import { serialPortManager } from './services/SerialPortManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ports = ref<SerialPortInfo[]>([])
const selectedPathPort = ref('')
const connectedPort = ref('')
const command = ref('')
const logs = ref<string[]>(['SignalBridge iniciado.'])
const commandHistory = ref<string[]>([])
const sendingCommandIndex = ref<number | null>(null)
const copiedIndex = ref<number | null>(null)

const favorites = ref<string[]>(
  JSON.parse(localStorage.getItem('signalbridge_favorites') ?? '[]')
)
const favoriteInput = ref('')
const copiedFavoriteIndex = ref<number | null>(null)
const sendingFavoriteIndex = ref<number | null>(null)

watch(favorites, (val) => {
  localStorage.setItem('signalbridge_favorites', JSON.stringify(val))
}, { deep: true })

function saveFavorite() {
  const cmd = favoriteInput.value.trim()
  if (cmd && !favorites.value.includes(cmd)) {
    favorites.value.push(cmd)
    favoriteInput.value = ''
  }
}

function removeFavorite(cmd: string) {
  favorites.value = favorites.value.filter(f => f !== cmd)
}

async function copyFavorite(cmd: string, index: number) {
  try {
    await navigator.clipboard.writeText(cmd)
    copiedFavoriteIndex.value = index
    setTimeout(() => {
      if (copiedFavoriteIndex.value === index) {
        copiedFavoriteIndex.value = null
      }
    }, 2000)
  } catch (err) {
    console.error('Falha ao copiar favorito:', err)
  }
}

function sendFavorite(cmd: string, index: number) {
  sendingFavoriteIndex.value = index
  serialPortManager.send(cmd)
  setTimeout(() => {
    if (sendingFavoriteIndex.value === index) {
      sendingFavoriteIndex.value = null
    }
  }, 600)
}
const isScrollFrozen = ref(false)
const bufferedLogs = ref<string[]>([])

const isHighlightModalOpen = ref(false)
const highlightTermInput = ref('')
const highlightedTerms = ref<{ term: string, color: string }[]>([])
const showOnlyHighlighted = ref(false)

const filteredLogs = computed(() => {
  if (!showOnlyHighlighted.value || highlightedTerms.value.length === 0) {
    return logs.value
  }
  
  return logs.value.filter(log => {
    return highlightedTerms.value.some(({ term }) => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escapedTerm, 'i')
      return regex.test(log)
    })
  })
})

function clearLogs() {
  logs.value = []
  bufferedLogs.value = []
}

function addHighlightTerm() {
  const term = highlightTermInput.value.trim()
  if (term && !highlightedTerms.value.some(t => t.term === term)) {
    const hue = Math.floor(Math.random() * 360)
    const color = `hsl(${hue}, 70%, 80%)`
    highlightedTerms.value.push({ term, color })
    highlightTermInput.value = ''
  }
}

function removeHighlightTerm(term: string) {
  highlightedTerms.value = highlightedTerms.value.filter(t => t.term !== term)
}

function formatLog(log: string) {
  if (highlightedTerms.value.length === 0) return log

  let formattedLog = log
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  highlightedTerms.value.forEach(({ term, color }) => {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedTerm})`, 'gi')
    formattedLog = formattedLog.replace(regex, `<span style="background-color: ${color}; color: #000; padding: 0 2px; border-radius: 2px;">$1</span>`)
  })

  return formattedLog
}

function addLog(message: string) {
  if (isScrollFrozen.value) {
    bufferedLogs.value.unshift(message)
  } else {
    logs.value.unshift(message)
  }
}

watch(isScrollFrozen, (frozen) => {
  if (!frozen && bufferedLogs.value.length > 0) {
    logs.value.unshift(...bufferedLogs.value)
    bufferedLogs.value = []
  }
})

async function refreshPorts() {
  ports.value = await serialPortManager.listPorts()

  if (!ports.value.some((port) => port.path === selectedPathPort.value)) {
    selectedPathPort.value = ports.value[0]?.path ?? ''
  }

  addLog(`Port as detectadas: ${ports.value.length}`)
}

async function send() {
  commandHistory.value.unshift(command.value)
  serialPortManager.send(command.value)
  command.value = ''
}

function resendCommand(cmd: string) {
  const index = commandHistory.value.indexOf(cmd)
  sendingCommandIndex.value = index
  serialPortManager.send(cmd)
}

async function copyCommand(cmd: string, index: number) {
  try {
    await navigator.clipboard.writeText(cmd)
    copiedIndex.value = index
    setTimeout(() => {
      if (copiedIndex.value === index) {
        copiedIndex.value = null
      }
    }, 2000)
  } catch (err) {
    console.error('Falha ao copiar comando:', err)
  }
}

function connect(){
  if (connectedPort.value === selectedPathPort.value) return

  serialPortManager.connect(selectedPathPort.value)
  connectedPort.value = selectedPathPort.value

  serialPortManager.onData((data) => {
    addLog(`${selectedPathPort.value ? ` (${selectedPathPort.value})` : ''} > ${data}`)
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

<style scoped>
button {
  transition: all 300ms ease-in-out;
}

@keyframes fill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.animate-fill {
  animation: fill 500ms ease-in-out forwards;
}
</style>

<template>
  <main class="min-h-screen bg-background p-6 md:p-10">
    <div class="mx-auto max-w-5xl space-y-6">
      <header class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">SignalBridge</h1>
        <p class="text-muted-foreground">Monitor COM, logs em tempo real e envio de comandos.</p>
      </header>

      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Portas COM</CardTitle>
            <Button variant="outline" size="sm" @click="refreshPorts">
              Atualizar
            </Button>
          </div>
          <CardDescription>Selecione a porta serial para conectar</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="port-select">Porta</Label>
            <div class="flex gap-2">
              <Select v-model="selectedPathPort">
                <SelectTrigger id="port-select" class="flex-1">
                  <SelectValue placeholder="Escolha uma porta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="port in ports" :key="port.path" :value="port.path">
                    {{ port.friendlyName || port.path }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button @click="connect" :disabled="selectedPathPort === connectedPort">
                Conectar
              </Button>
            </div>
          </div>

          <p v-if="selectedPathPort" class="text-sm text-muted-foreground">
            Porta selecionada: <span class="font-medium text-foreground">{{ selectedPathPort }}</span>
          </p>
          <p v-else class="text-sm text-muted-foreground">
            Nenhuma porta carregada.
          </p>
        </CardContent>
      </Card>

      <div class="grid gap-6 grid-cols-2">
        <div class="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <div class="space-y-1.5">
                  <CardTitle>Logs</CardTitle>
                  <CardDescription>Mensagens recebidas em tempo real</CardDescription>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                      <input type="checkbox" id="show-highlighted" v-model="showOnlyHighlighted" class="h-4 w-4 rounded border-primary text-primary focus:ring-primary" />
                      <Label for="show-highlighted" class="cursor-pointer">Apenas destacados</Label>
                    </div>
                    <div class="flex items-center gap-2">
                      <input type="checkbox" id="freeze-scroll" v-model="isScrollFrozen" class="h-4 w-4 rounded border-primary text-primary focus:ring-primary" />
                      <Label for="freeze-scroll" class="cursor-pointer">Congelar Scroll</Label>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <Button variant="outline" size="sm" @click="isHighlightModalOpen = true">
                      Destacar termos
                    </Button>
                    <Button variant="outline" size="sm" @click="clearLogs" :disabled="logs.length === 0 && bufferedLogs.length === 0">
                      <Trash2 class="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div class="max-h-72 space-y-1 overflow-auto rounded-md border bg-muted/50 p-4 font-mono text-sm">
                <p v-for="(log, index) in filteredLogs" :key="`${index}-${log}`" class="text-foreground" v-html="formatLog(log)">
                </p>
              </div>
              <p v-if="bufferedLogs.length > 0" class="text-xs text-muted-foreground mt-2 text-center">
                {{ bufferedLogs.length }} novas mensagens (descongele para ver)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enviar Comando</CardTitle>
              <CardDescription>Digite um comando para enviar à porta serial</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex gap-2">
                <Input
                  v-model="command"
                  placeholder="Ex.: AT+STATUS"
                  @keyup.enter="send"
                />
                <Button @click="send" :disabled="!command.trim()">
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comandos</CardTitle>
              <CardDescription>Comandos enviados nesta sessão</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="max-h-48 space-y-2 overflow-auto rounded-md border bg-muted/50 p-4 font-mono text-sm">
                <div
                  v-for="(cmd, index) in commandHistory"
                  :key="`${index}-${cmd}`"
                  class="rounded bg-background p-2 text-foreground hover:bg-muted transition-colors flex items-center justify-between gap-2 relative overflow-hidden"
                >
                  <div
                    v-if="sendingCommandIndex === index"
                    class="absolute inset-0 bg-primary/20 origin-left animate-fill rounded"
                  />
                  <span class="relative z-10 truncate">{{ cmd }}</span>
                  <div class="flex items-center gap-1 relative z-20">
                    <div class="relative group flex items-center justify-center">
                      <Button size="icon" variant="ghost" @click="copyCommand(cmd, index)" class="h-8 w-8">
                        <Copy class="h-4 w-4" />
                      </Button>
                      <div class="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-md border z-50">
                        {{ copiedIndex === index ? 'Copiado!' : 'Copiar comando' }}
                      </div>
                    </div>
                    <div class="relative group flex items-center justify-center">
                      <Button size="icon" variant="ghost" @click="resendCommand(cmd)" class="h-8 w-8">
                        <Send class="h-4 w-4" />
                      </Button>
                      <div class="absolute right-full mr-2 top-1/2 -translate-x-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-md border z-50">
                        Reenviar comando
                      </div>
                    </div>
                  </div>
                </div>
                <p v-if="commandHistory.length === 0" class="text-muted-foreground text-center py-8">
                  Nenhum comando enviado.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Favoritos</CardTitle>
              <CardDescription>Comandos salvos para reuso</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="flex gap-2">
                <Input
                  v-model="favoriteInput"
                  placeholder="Ex.: AT+STATUS"
                  @keyup.enter="saveFavorite"
                />
                <Button @click="saveFavorite" :disabled="!favoriteInput.trim()">
                  Salvar
                </Button>
              </div>
              <div class="max-h-48 space-y-2 overflow-auto rounded-md border bg-muted/50 p-4 font-mono text-sm">
                <div
                  v-for="(cmd, index) in favorites"
                  :key="`fav-${index}-${cmd}`"
                  class="rounded bg-background p-2 text-foreground hover:bg-muted transition-colors flex items-center justify-between gap-2 relative overflow-hidden"
                >
                  <div
                    v-if="sendingFavoriteIndex === index"
                    class="absolute inset-0 bg-primary/20 origin-left animate-fill rounded"
                  />
                  <span class="relative z-10 truncate">{{ cmd }}</span>
                  <div class="flex items-center gap-1 relative z-20">
                    <div class="relative group flex items-center justify-center">
                      <Button size="icon" variant="ghost" @click="copyFavorite(cmd, index)" class="h-8 w-8">
                        <Copy class="h-4 w-4" />
                      </Button>
                      <div class="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-md border z-50">
                        {{ copiedFavoriteIndex === index ? 'Copiado!' : 'Copiar comando' }}
                      </div>
                    </div>
                    <div class="relative group flex items-center justify-center">
                      <Button size="icon" variant="ghost" @click="sendFavorite(cmd, index)" class="h-8 w-8">
                        <Send class="h-4 w-4" />
                      </Button>
                      <div class="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-md border z-50">
                        Enviar favorito
                      </div>
                    </div>
                    <div class="relative group flex items-center justify-center">
                      <Button size="icon" variant="ghost" @click="removeFavorite(cmd)" class="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 class="h-4 w-4" />
                      </Button>
                      <div class="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-md border z-50">
                        Remover favorito
                      </div>
                    </div>
                  </div>
                </div>
                <p v-if="favorites.length === 0" class="text-muted-foreground text-center py-8">
                  Nenhum favorito salvo.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Highlight Modal -->
    <div v-if="isHighlightModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card class="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Destacar Termos</CardTitle>
          <CardDescription>Adicione termos para destacar nos logs com cores diferentes.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex gap-2">
            <Input
              v-model="highlightTermInput"
              placeholder="Digite um termo..."
              @keyup.enter="addHighlightTerm"
            />
            <Button @click="addHighlightTerm" :disabled="!highlightTermInput.trim()">
              Adicionar
            </Button>
          </div>
          
          <div class="flex flex-wrap gap-2 mt-4">
            <div
              v-for="item in highlightedTerms"
              :key="item.term"
              class="flex items-center gap-1 px-2 py-1 rounded text-sm text-black"
              :style="{ backgroundColor: item.color }"
            >
              <span>{{ item.term }}</span>
              <button @click="removeHighlightTerm(item.term)" class="ml-1 hover:opacity-70 font-bold">
                &times;
              </button>
            </div>
            <p v-if="highlightedTerms.length === 0" class="text-sm text-muted-foreground w-full text-center py-2">
              Nenhum termo destacado.
            </p>
          </div>
        </CardContent>
        <div class="flex justify-end p-6 pt-0">
          <Button variant="outline" @click="isHighlightModalOpen = false">
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  </main>
</template>
