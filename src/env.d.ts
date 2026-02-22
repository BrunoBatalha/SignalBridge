/// <reference types="vite/client" />

interface SerialPortInfo {
  friendlyName: string
  path: string
}

interface ComBridgeApi {
  listPorts: () => Promise<SerialPortInfo[]>
  sendCommand: (command: string) => Promise<{ ok: boolean }>
  onData: (handleData: (data: string) => void) => void
  connect: (path: string) => void
}

interface Window {
  comBridge?: ComBridgeApi
}
