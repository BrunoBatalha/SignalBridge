interface SerialPortInfo {
    path: string
    friendlyName: string
}

interface ISerialPortManager {
    listPorts: () => Promise<SerialPortInfo[]>
    onData: (handleData: (data: string) => void) => void
    connect: (path: string) => void
    send: (command: string) => void
}

class SerialPortElectron implements ISerialPortManager {
    listPorts(): Promise<SerialPortInfo[]> {
        return window.comBridge!.listPorts()
    }
    onData(handleData: (data: string) => void): void {
        window.comBridge!.onData(handleData)
    }
    connect(path:string) {
        window.comBridge!.connect(path)
    }
    send(command: string) {
        window.comBridge!.send(command)
    }
}

function createSerialPortFactory(): ISerialPortManager {
    if (!window.comBridge) {
        throw new Error('SerialPort API não disponível.')
    }
    return new SerialPortElectron()
}

export const serialPortManager = createSerialPortFactory()