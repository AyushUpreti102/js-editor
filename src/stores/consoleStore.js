import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useEventListener } from '@vueuse/core'

/**
 * Store managing browser / preview execution console logs.
 * Listens for cross-frame messages emitted by the preview iframe sandbox.
 */
export const useConsoleStore = defineStore('consoleStore', () => {
  const logs = ref([
    {
      method: 'info',
      args: ['JS Editor console ready...'],
      timestamp: new Date().toLocaleTimeString(),
    },
  ])

  /**
   * Appends a log entry to the console list
   * @param {Object} entry
   * @param {'log'|'info'|'warn'|'error'} entry.method
   * @param {Array<string>} entry.args
   * @param {string} [entry.timestamp]
   */
  const addLog = (entry) => {
    logs.value.push({
      method: entry.method || 'log',
      args: Array.isArray(entry.args) ? entry.args : [String(entry.args)],
      timestamp: entry.timestamp || new Date().toLocaleTimeString(),
    })
  }

  /**
   * Clears all log messages
   */
  const clearLogs = () => {
    logs.value = []
  }

  // Automatically listen to messages posted from the preview iframe interceptor
  if (typeof window !== 'undefined') {
    useEventListener(window, 'message', (event) => {
      const data = event.data
      if (data && data.type === 'IFRAME_CONSOLE') {
        addLog({
          method: data.method || 'log',
          args: data.arguments || [],
        })
      }
    })
  }

  /*
   * NEXT PHASE:
   * 1. Add interactive REPL command evaluation by posting messages back to the iframe.
   * 2. Support filtering by log level ('all' | 'errors' | 'warnings' | 'logs').
   * 3. Add console search / regex filter.
   * 4. Support structured object tree inspection (expandable JSON/object viewer).
   */

  return {
    logs,
    addLog,
    clearLogs,
  }
})
