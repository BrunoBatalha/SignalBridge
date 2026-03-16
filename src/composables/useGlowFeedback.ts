import { ref } from 'vue'

export function useGlowFeedback(duration = 500) {
  const isGlowing = ref(false)

  function trigger() {
    isGlowing.value = true
    setTimeout(() => {
      isGlowing.value = false
    }, duration)
  }

  return { isGlowing, trigger }
}
