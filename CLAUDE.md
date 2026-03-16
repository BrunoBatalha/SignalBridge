# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SignalBridge** is a serial port monitor:

- **`desktop/`** — Electron + Vue 3 app (real serial port access via IPC bridge)

Both apps mirror the same feature set; the desktop app has actual hardware access while the web app is a UI prototype.

## Commands

### Desktop (Electron + Vue)

```bash
cd desktop
pnpm install        # Install dependencies
pnpm dev            # Dev mode with hot reload (electron-vite)
pnpm build          # Production build
pnpm preview        # Preview production build
```

## Architecture

### Desktop IPC Bridge

The serial port communication flows through a strict IPC boundary:

```
Vue renderer (src/) ←→ preload.ts (contextBridge) ←→ electron/main.ts (SerialPort node module)
```

- `electron/preload.ts` exposes `window.comBridge` with typed methods (`listPorts`, `connect`, `onData`, `send`)
- `src/services/SerialPortManager.ts` wraps `window.comBridge` in a class implementing `ISerialPortManager`
- `electron/main.ts` handles IPC channels: `com:list`, `com:connect`, `com:onData`, `com:send`

### UI Components (shadcn)

Both apps use **shadcn** components. Always use shadcn for any new UI component — never build raw HTML controls.

**Desktop** uses `shadcn-vue` (New York style, zinc base color):

- Components live in `src/components/ui/`
- Add new components: `npx shadcn-vue@latest add <component>`
- Config: `desktop/components.json`

Both use Tailwind CSS with CSS variables for theming. The `@/` alias resolves to `src/` in desktop and the project root in web.

### Path Aliases

- Desktop: `@/` → `src/`

### Fluxo

Sempre que possível deixar atividade em background, deve ser feito.
