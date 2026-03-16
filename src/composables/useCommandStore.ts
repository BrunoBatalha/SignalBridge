import { ref, computed } from 'vue'

const STORAGE_KEY_HISTORY = 'signalbridge_cmd_history'
const STORAGE_KEY_FAVORITES = 'signalbridge_favorites'
const MAX_HISTORY = 500

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function useCommandStore() {
  const commandHistory = ref<string[]>(loadJson(STORAGE_KEY_HISTORY, []))
  const favorites = ref<string[]>(loadJson(STORAGE_KEY_FAVORITES, []))

  function persist() {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(commandHistory.value))
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites.value))
  }

  function addToHistory(cmd: string) {
    if (!cmd.trim()) return
    commandHistory.value.unshift(cmd)
    if (commandHistory.value.length > MAX_HISTORY) commandHistory.value.length = MAX_HISTORY
    persist()
  }

  function addFavorite(cmd: string) {
    const trimmed = cmd.trim()
    if (!trimmed || favorites.value.includes(trimmed)) return
    favorites.value.push(trimmed)
    persist()
  }

  function removeFavorite(cmd: string) {
    favorites.value = favorites.value.filter((f) => f !== cmd)
    persist()
  }

  const allSuggestions = computed(() => {
    const set = new Set<string>([...favorites.value, ...commandHistory.value])
    return Array.from(set)
  })

  return {
    commandHistory,
    favorites,
    allSuggestions,
    addToHistory,
    addFavorite,
    removeFavorite,
  }
}
