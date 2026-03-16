import { ref, watch, onUnmounted, type Ref } from 'vue'

interface MinimapOptions {
  filteredLogs: Ref<{ level: string }[]>
  errorIndices: Ref<number[]>
  warnIndices: Ref<number[]>
  scrollToIndex: (index: number) => void
  viewportStart: Ref<number>
  viewportEnd: Ref<number>
}

export function useLogMinimap(canvas: Ref<HTMLCanvasElement | null>, options: MinimapOptions) {
  const { filteredLogs, errorIndices, warnIndices, scrollToIndex, viewportStart, viewportEnd } =
    options
  let animFrame = 0

  function paint() {
    const el = canvas.value
    if (!el) return

    const ctx = el.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = el.getBoundingClientRect()
    el.width = rect.width * dpr
    el.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const total = filteredLogs.value.length

    // Background
    ctx.fillStyle = 'hsl(240 6% 6%)'
    ctx.fillRect(0, 0, w, h)

    if (total === 0) return

    // Error markers
    ctx.fillStyle = 'hsl(0 84% 60%)'
    for (const idx of errorIndices.value) {
      const y = (idx / total) * h
      ctx.fillRect(0, y, w, Math.max(1, h / total))
    }

    // Warn markers
    ctx.fillStyle = 'hsl(38 92% 50%)'
    for (const idx of warnIndices.value) {
      const y = (idx / total) * h
      ctx.fillRect(0, y, w, Math.max(1, h / total))
    }

    // Viewport indicator
    const vpStart = (viewportStart.value / total) * h
    const vpEnd = (viewportEnd.value / total) * h
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.fillRect(0, vpStart, w, Math.max(vpEnd - vpStart, 4))
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, vpStart + 0.5, w - 1, Math.max(vpEnd - vpStart, 4) - 1)
  }

  function loop() {
    paint()
    animFrame = requestAnimationFrame(loop)
  }

  watch(canvas, (el) => {
    if (el) {
      loop()
    } else {
      cancelAnimationFrame(animFrame)
    }
  })

  onUnmounted(() => cancelAnimationFrame(animFrame))

  function handleClick(e: MouseEvent) {
    const el = canvas.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const y = e.clientY - rect.top
    const ratio = y / rect.height
    const idx = Math.floor(ratio * filteredLogs.value.length)
    scrollToIndex(Math.max(0, Math.min(idx, filteredLogs.value.length - 1)))
  }

  return { handleClick }
}
