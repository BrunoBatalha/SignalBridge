/// <reference types="vite/client" />

interface SerialPortInfo {
  friendlyName: string
  path: string
}

interface ComBridgeApi {
  listPorts: () => Promise<SerialPortInfo[]>
  sendCommand: (command: string) => Promise<{ ok: boolean }>
  onData: (handleData: (data: string) => void) => void
  connect: (path: string, baudRate: number) => void
  disconnect: () => void
  send: (command: string) => void
}

interface Window {
  comBridge?: ComBridgeApi
}

// Web Serial API type declarations
declare class SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null
  readonly writable: WritableStream<Uint8Array> | null
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
  getInfo(): SerialPortInfoWeb
}

interface SerialOptions {
  baudRate: number
  dataBits?: number
  stopBits?: number
  parity?: 'none' | 'even' | 'odd'
  bufferSize?: number
  flowControl?: 'none' | 'hardware'
}

interface SerialPortInfoWeb {
  usbVendorId?: number
  usbProductId?: number
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[]
}

interface SerialPortFilter {
  usbVendorId?: number
  usbProductId?: number
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
}

interface Navigator {
  readonly serial: Serial
}
