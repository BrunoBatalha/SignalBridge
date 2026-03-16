export interface LogEntry {
  id: number
  text: string
  timestamp: number
  level: 'rx' | 'tx' | 'error' | 'warn' | 'info' | 'system'
  source?: string
}

export interface HighlightTerm {
  term: string
  color: string
}
