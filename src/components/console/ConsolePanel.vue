<template>
  <div
    class="bottom-console-wrapper"
    :class="{ 'is-resizing': isResizing }"
    :style="{ height: `${consoleHeight}px` }"
  >
    <!-- Resizer Drag Handle -->
    <div
      class="console-resizer"
      title="Drag to resize console (Double-click to reset)"
      @mousedown="startConsoleResize"
      @dblclick="resetConsoleHeight"
    ></div>

    <!-- Header / Tab Bar -->
    <div class="console-tab-header">
      <div class="header-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'console' }"
          @click="activeTab = 'console'"
        >
          CONSOLE
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'terminal' }"
          @click="activeTab = 'terminal'"
        >
          TERMINAL
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'output' }"
          @click="activeTab = 'output'"
        >
          OUTPUT
        </button>
      </div>

      <div class="header-actions">
        <button class="action-btn" title="Clear Console" @click="handleClear">Clear</button>
        <button class="action-btn close-btn" title="Close Panel (Cmd+J)" @click="$emit('close')">
          ✕
        </button>
      </div>
    </div>

    <!-- Content Body -->
    <div class="console-content">
      <EditorConsole v-if="activeTab === 'console'" />
      <div v-else-if="activeTab === 'terminal'" class="placeholder-tab">
        <p class="tab-note">> Terminal session ready (client-side mock)</p>
      </div>
      <div v-else-if="activeTab === 'output'" class="placeholder-tab">
        <p class="tab-note">> Build Output: No compilation tasks running</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStorage, useEventListener } from '@vueuse/core'
import { useConsoleStore } from '@/stores/consoleStore'
import EditorConsole from '../EditorConsole.vue'

defineEmits(['close'])

const consoleStore = useConsoleStore()
const activeTab = ref('console')

// Persistent console height via @vueuse/core useStorage
const consoleHeight = useStorage('editor_console_height', 200)
const isResizing = ref(false)

const startConsoleResize = (e) => {
  e.preventDefault()
  isResizing.value = true
  const startY = e.clientY
  const startHeight = consoleHeight.value

  const stopMove = useEventListener(window, 'mousemove', (moveEvent) => {
    const deltaY = startY - moveEvent.clientY
    const newHeight = Math.min(Math.max(startHeight + deltaY, 70), window.innerHeight * 0.75)
    consoleHeight.value = Math.round(newHeight)
  })

  const stopUp = useEventListener(window, 'mouseup', () => {
    isResizing.value = false
    stopMove()
    stopUp()
  })
}

const resetConsoleHeight = () => {
  consoleHeight.value = 200
}

const handleClear = () => {
  consoleStore.clearLogs()
}

/*
 * NEXT PHASE:
 * 1. Terminal interactive REPL: Integrate xterm.js or web-based shell emulator.
 * 2. Log filter toolbar (Filter by Info, Warn, Error, and Text search query).
 * 3. Preserve logs on page refresh toggle.
 */
</script>

<style scoped>
.bottom-console-wrapper {
  position: relative;
  border-top: 1px solid var(--border-color);
  background: #181818;
  display: flex;
  flex-direction: column;
  min-height: 70px;
  flex-shrink: 0;
}

.bottom-console-wrapper.is-resizing {
  user-select: none;
}

.console-resizer {
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  z-index: 25;
  background: transparent;
  transition: background 0.15s ease;
}

.console-resizer:hover,
.bottom-console-wrapper.is-resizing .console-resizer {
  background: var(--accent-blue);
  height: 4px;
  top: -2px;
}

.console-tab-header {
  height: 30px;
  background: #252526;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 11px;
}

.header-tabs {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 2px;
  border-bottom: 2px solid transparent;
  transition: color 0.15s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--text-bright);
  border-bottom-color: var(--accent-blue);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  transition:
    color 0.15s,
    background 0.15s;
}

.action-btn:hover {
  color: white;
  background: var(--bg-selected);
}

.close-btn:hover {
  background: #ef4444;
}

.console-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.placeholder-tab {
  padding: 14px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
}

.tab-note {
  color: #858585;
}
</style>
