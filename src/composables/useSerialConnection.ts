import { ref, type Ref } from 'vue'
import { serialPortManager } from '@/services/SerialPortManager'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export function useSerialConnection() {
  const ports = ref<SerialPortInfo[]>([])
  const selectedPath = ref('')
  const selectedBaudRate = ref(115200)
  const connectedPath = ref('')
  const connectionStatus: Ref<ConnectionStatus> = ref('disconnected')

  async function refreshPorts() {
    ports.value = await serialPortManager.listPorts()
    if (!ports.value.some((p) => p.path === selectedPath.value)) {
      selectedPath.value = ports.value[0]?.path ?? ''
    }
    return ports.value
  }

  function connect() {
    if (connectedPath.value === selectedPath.value) return
    connectionStatus.value = 'connecting'
    serialPortManager.connect(selectedPath.value, selectedBaudRate.value)
    connectedPath.value = selectedPath.value
    connectionStatus.value = 'connected'
  }

  function disconnect() {
    serialPortManager.disconnect()
    connectedPath.value = ''
    connectionStatus.value = 'disconnected'
  }

  function send(cmd: string) {
    serialPortManager.send(cmd)
  }

  function onData(callback: (data: string) => void) {
    serialPortManager.onData(callback)
  }

  return {
    ports,
    selectedPath,
    selectedBaudRate,
    connectedPath,
    connectionStatus,
    refreshPorts,
    connect,
    disconnect,
    send,
    onData,
  }
}
