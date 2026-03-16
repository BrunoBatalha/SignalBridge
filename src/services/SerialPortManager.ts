interface SerialPortInfo {
  path: string;
  friendlyName: string;
}

interface ISerialPortManager {
  listPorts: () => Promise<SerialPortInfo[]>;
  onData: (handleData: (data: string) => void) => void;
  connect: (path: string) => void;
  send: (command: string) => void;
}

class SerialPortElectron implements ISerialPortManager {
  listPorts(): Promise<SerialPortInfo[]> {
    return window.comBridge!.listPorts();
  }
  onData(handleData: (data: string) => void): void {
    window.comBridge!.onData(handleData);
  }
  connect(path: string) {
    window.comBridge!.connect(path);
  }
  send(command: string) {
    window.comBridge!.send(command);
  }
}

class SerialPortWeb implements ISerialPortManager {
  private ports = new Map<string, SerialPort>();
  private activePort: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private dataHandler: ((data: string) => void) | null = null;
  private portCounter = 0;

  async listPorts(): Promise<SerialPortInfo[]> {
    const known = await navigator.serial.getPorts();
    const result: SerialPortInfo[] = [];

    for (const port of known) {
      const id = this.getOrAssignId(port);
      const info = port.getInfo();
      result.push({
        path: id,
        friendlyName: info.usbVendorId
          ? `USB Serial (${info.usbVendorId}:${info.usbProductId})`
          : `Porta serial (${id})`,
      });
    }

    try {
      const newPort = await navigator.serial.requestPort();
      if (!this.findId(newPort)) {
        const id = this.getOrAssignId(newPort);
        const info = newPort.getInfo();
        console.log("Porta selecionada:", id, info);
        result.push({
          path: id,
          friendlyName: info.usbVendorId
            ? `USB Serial (${info.usbVendorId}:${info.usbProductId})`
            : `Porta serial (${id})`,
        });
      }
    } catch {
      // User cancelled the port picker — return only known ports
    }

    return result;
  }

  onData(handleData: (data: string) => void): void {
    this.dataHandler = handleData;
  }

  connect(path: string): void {
    const port = this.ports.get(path);
    if (!port) return;

    port.open({ baudRate: 115200 }).then(() => {
      this.activePort = port;
      this.writer = port.writable!.getWriter();
      this.startReadLoop(port);
    });
  }

  send(command: string): void {
    if (!this.writer) return;
    const encoder = new TextEncoder();
    this.writer.write(encoder.encode(command));
  }

  private async startReadLoop(port: SerialPort): Promise<void> {
    const decoder = new TextDecoder("latin1");
    this.reader = port.readable!.getReader();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        console.log("value:", value);
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx).replace(/\r/g, "");
          buffer = buffer.slice(idx + 1);
          if (line.trim() && this.dataHandler) {
            this.dataHandler(line);
          }
        }
      }
    } catch {
      // Port disconnected or read error
    }
  }

  private getOrAssignId(port: SerialPort): string {
    const existing = this.findId(port);
    if (existing) return existing;
    const id = `web-serial-${this.portCounter++}`;
    this.ports.set(id, port);
    return id;
  }

  private findId(port: SerialPort): string | undefined {
    for (const [id, p] of this.ports) {
      if (p === port) return id;
    }
    return undefined;
  }
}

class SerialPortMock implements ISerialPortManager {
  listPorts(): Promise<SerialPortInfo[]> {
    return Promise.resolve([]);
  }
  onData(_handleData: (data: string) => void): void {}
  connect(_path: string): void {}
  send(_command: string): void {}
}

function createSerialPortFactory(): ISerialPortManager {
  if (window.comBridge) {
    return new SerialPortElectron();
  }
  if ("serial" in navigator) {
    return new SerialPortWeb();
  }
  return new SerialPortMock();
}

export const serialPortManager = createSerialPortFactory();
