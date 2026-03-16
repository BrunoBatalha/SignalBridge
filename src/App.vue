<script setup lang="ts">
import { onMounted, provide, computed } from 'vue'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import ControlPanel from '@/components/ControlPanel.vue'
import LogTerminal from '@/components/LogTerminal.vue'
import CommandBar from '@/components/CommandBar.vue'
import FavoriteSidebar from '@/components/FavoriteSidebar.vue'
import { useSerialConnection } from '@/composables/useSerialConnection'
import { useLogStore } from '@/composables/useLogStore'
import { useCommandStore } from '@/composables/useCommandStore'
import { useTutorialTour } from '@/composables/useTutorialTour'

// --- Composables ---
const serial = useSerialConnection()
const logStore = useLogStore()
const cmdStore = useCommandStore()
const tour = useTutorialTour()

// --- Wire serial data into log store ---
function sendCommand(cmd: string) {
  serial.send(cmd)
  logStore.appendLog(`TX > ${cmd}`, 'tx')
}

// --- Provide to children ---
provide('ports', serial.ports)
provide('selectedPath', serial.selectedPath)
provide('selectedBaudRate', serial.selectedBaudRate)
provide('connectedPath', serial.connectedPath)
provide('connectionStatus', serial.connectionStatus)
provide('refreshPorts', serial.refreshPorts)
provide('connect', () => {
  serial.connect()
  serial.onData((data) => {
    logStore.appendLog(data)
  })
})
provide('disconnect', () => {
  serial.disconnect()
  logStore.appendLog('Disconnected.', 'system')
})

provide('filteredLogs', logStore.filteredLogs)
provide('filteredFrozenSnapshot', logStore.filteredFrozenSnapshot)
provide('isFrozen', logStore.isFrozen)
provide('highlightTerms', logStore.highlightTerms)
provide('showOnlyHighlighted', logStore.showOnlyHighlighted)
provide('errorIndices', logStore.errorIndices)
provide('warnIndices', logStore.warnIndices)
provide('frozenErrorIndices', logStore.frozenErrorIndices)
provide('frozenWarnIndices', logStore.frozenWarnIndices)
provide('setFrozen', logStore.setFrozen)
provide('clearLogs', logStore.clearLogs)
provide('addHighlightTerm', logStore.addHighlightTerm)
provide('removeHighlightTerm', logStore.removeHighlightTerm)
provide('logCount', computed(() => logStore.filteredLogs.value.length))

provide('commandHistory', cmdStore.commandHistory)
provide('favorites', cmdStore.favorites)
provide('allSuggestions', cmdStore.allSuggestions)
provide('addToHistory', cmdStore.addToHistory)
provide('addFavorite', cmdStore.addFavorite)
provide('removeFavorite', cmdStore.removeFavorite)
provide('sendCommand', sendCommand)
provide('startTour', tour.startTour)

onMounted(() => {
  logStore.appendLog('SignalBridge initialized.', 'system')
  void serial.refreshPorts()

  if (tour.shouldShowTour()) {
    setTimeout(() => tour.startTour(), 600)
  }
})
</script>

<template>
  <main class="h-screen bg-background flex flex-col overflow-hidden">
    <ControlPanel />
    <ResizablePanelGroup direction="horizontal" class="flex-1">
      <ResizablePanel :default-size="75" :min-size="50">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel :default-size="80" :min-size="30">
            <LogTerminal />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel :default-size="20" :min-size="10">
            <CommandBar />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel :default-size="25" :min-size="15" collapsible>
        <FavoriteSidebar />
      </ResizablePanel>
    </ResizablePanelGroup>
  </main>
</template>
