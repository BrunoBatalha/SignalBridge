<script setup lang="ts">
import { computed } from 'vue'
import { SplitterResizeHandle, type SplitterResizeHandleProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<SplitterResizeHandleProps & { class?: string; withHandle?: boolean }>(),
  { withHandle: false },
)

const delegatedProps = computed(() => {
  const { class: _, withHandle: __, ...delegated } = props
  return delegated
})
</script>

<template>
  <SplitterResizeHandle
    v-bind="delegatedProps"
    :class="
      cn(
        'relative flex w-px items-center justify-center bg-zinc-800 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:after:translate-x-0 [&[data-orientation=vertical]>div]:rotate-90 hover:bg-zinc-700 transition-colors',
        props.class,
      )
    "
  >
    <template v-if="withHandle">
      <div
        class="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-zinc-800 border-zinc-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 6 16"
          fill="currentColor"
          class="h-2.5 w-2.5 text-zinc-500"
        >
          <circle cx="1" cy="4" r="0.8" />
          <circle cx="5" cy="4" r="0.8" />
          <circle cx="1" cy="8" r="0.8" />
          <circle cx="5" cy="8" r="0.8" />
          <circle cx="1" cy="12" r="0.8" />
          <circle cx="5" cy="12" r="0.8" />
        </svg>
      </div>
    </template>
  </SplitterResizeHandle>
</template>
