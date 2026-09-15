<template>
  <footer class="status-bar" aria-label="Status Bar">
    <!-- Status Bar Left -->
    <div class="status-left">
      <!-- Errors & Warnings (Click to toggle console panel) -->
      <div
        class="status-item errors"
        :title="`${errorsCount} Error${errorsCount === 1 ? '' : 's'}, ${warningsCount} Warning${warningsCount === 1 ? '' : 's'} (Click to toggle Console)`"
        @click="$emit('toggle-console')"
      >
        <span class="error-badge" :class="{ 'has-errors': errorsCount > 0 }">
          ✕ {{ errorsCount }}
        </span>
        <span class="warning-badge" :class="{ 'has-warnings': warningsCount > 0 }">
          ⚠ {{ warningsCount }}
        </span>
      </div>
    </div>

    <!-- Status Bar Right -->
    <div class="status-right">
      <!-- Cursor Line and Column (Click to jump to line) -->
      <div
        class="status-item cursor-pos"
        title="Go to Line/Column (Click to jump)"
        @click="handleGoToLine"
      >
        <span>Ln {{ cursorPosition.lineNumber }}, Col {{ cursorPosition.column }}</span>
        <span v-if="selectionLength > 0" class="selection-count">
          ({{ selectionLength }} selected)
        </span>
      </div>

      <!-- Indentation Settings (Click to toggle Spaces / Tab size) -->
      <div
        class="status-item indent-config"
        title="Select Indentation (Click to toggle Spaces: 2 / Spaces: 4 / Tab Size: 4)"
        @click="handleToggleIndentation"
      >
        {{ indentation }}
      </div>

      <!-- File Encoding -->
      <div class="status-item" title="File Encoding: UTF-8">UTF-8</div>

      <!-- End of Line Sequence (Click to toggle LF / CRLF) -->
      <div
        class="status-item eol-config"
        title="Select End of Line Sequence (Click to toggle LF / CRLF)"
        @click="handleToggleEol"
      >
        {{ eol }}
      </div>

      <!-- Language Mode (Click to switch syntax language) -->
      <div
        ref="langTriggerRef"
        class="status-item language-badge"
        :class="{ active: isLangMenuOpen }"
        title="Select Language Mode"
        @click.stop="toggleLangMenu"
      >
        {{ currentLanguage }}
      </div>

      <!-- Live Preview Trigger -->
      <button
        class="status-item live-pill"
        :class="{ active: isPreviewOpen }"
        type="button"
        :title="isPreviewOpen ? 'Close Live Preview' : 'Open Live Preview (F5)'"
        @click="$emit('open-preview')"
      >
        <span class="live-dot" :class="{ running: isPreviewOpen }"></span>
        <IconPlay :size="11" class="preview-icon" />
        <span>{{ isPreviewOpen ? 'Previewing' : 'Live Preview' }}</span>
      </button>
    </div>

    <!-- Floating Language Mode Selector Menu -->
    <Teleport to="body">
      <div
        v-if="isLangMenuOpen"
        ref="langMenuRef"
        class="language-picker-popup"
        :style="{ top: `${menuPos.top}px`, right: `${menuPos.right}px` }"
        @click.stop
      >
        <div class="picker-header">Select Language Mode</div>
        <div class="picker-list">
          <button
            v-for="lang in availableLanguages"
            :key="lang.id"
            class="picker-item"
            :class="{ selected: lang.label.toLowerCase() === currentLanguage.toLowerCase() }"
            @click="selectLanguage(lang)"
          >
            <span class="lang-label">{{ lang.label }}</span>
            <span class="lang-ext">{{ lang.ext }}</span>
          </button>
        </div>
      </div>
    </Teleport>
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { useEditorStore } from '@/stores/editorStore'
import { IconPlay } from '@/components/icons'

defineProps({
  currentLanguage: {
    type: String,
    default: 'HTML',
  },
  isPreviewOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-console', 'open-preview', 'change-language'])

const editorStore = useEditorStore()
const {
  cursorPosition,
  selectionLength,
  indentation,
  eol,
  errorsCount,
  warningsCount,
} = storeToRefs(editorStore)

// Language Selector Menu State
const isLangMenuOpen = ref(false)
const langTriggerRef = ref(null)
const langMenuRef = ref(null)
const menuPos = ref({ top: 0, right: 0 })

const availableLanguages = [
  { id: 'html', label: 'HTML', ext: '.html' },
  { id: 'css', label: 'CSS', ext: '.css' },
  { id: 'javascript', label: 'JavaScript', ext: '.js' },
  { id: 'typescript', label: 'TypeScript', ext: '.ts' },
  { id: 'json', label: 'JSON', ext: '.json' },
  { id: 'markdown', label: 'Markdown', ext: '.md' },
]

const toggleLangMenu = () => {
  if (isLangMenuOpen.value) {
    isLangMenuOpen.value = false
    return
  }
  if (langTriggerRef.value) {
    const rect = langTriggerRef.value.getBoundingClientRect()
    menuPos.value = {
      top: rect.top - 210,
      right: window.innerWidth - rect.right,
    }
    isLangMenuOpen.value = true
  }
}

const selectLanguage = (lang) => {
  editorStore.changeLanguage(lang.id)
  emit('change-language', lang.label)
  isLangMenuOpen.value = false
}

onClickOutside(langMenuRef, () => {
  isLangMenuOpen.value = false
})

onKeyStroke('Escape', () => {
  if (isLangMenuOpen.value) {
    isLangMenuOpen.value = false
  }
})

// Action Handlers
const handleGoToLine = () => {
  editorStore.promptGoToLine()
}

const handleToggleIndentation = () => {
  editorStore.toggleIndentation()
}

const handleToggleEol = () => {
  editorStore.toggleEol()
}
</script>

<style scoped>
.status-bar {
  height: 22px;
  background: var(--bg-statusbar);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  font-size: 11px;
  user-select: none;
  font-family: var(--font-sans);
  flex-shrink: 0;
  z-index: 10;
  position: relative;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  height: 100%;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  height: 100%;
  cursor: pointer;
  transition: background 0.15s;
}

.status-item:hover {
  background: rgba(255, 255, 255, 0.15);
}

.status-item.active {
  background: rgba(255, 255, 255, 0.2);
}

.errors {
  gap: 8px;
}

.error-badge.has-errors {
  color: #f87171;
  font-weight: 600;
}

.warning-badge.has-warnings {
  color: #fbbf24;
  font-weight: 600;
}

.selection-count {
  opacity: 0.8;
  font-size: 10px;
}

.language-badge {
  font-weight: 500;
}

.live-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  margin-left: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 11px;
  font-family: inherit;
  padding: 0 8px;
  transition: all 0.15s ease;
}

.live-pill:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-bright);
}

.live-pill.active {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(74, 222, 128, 0.5);
  color: #4ade80;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: #64748b;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.live-dot.running {
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
  animation: pulseDot 2s infinite;
}

.preview-icon {
  color: inherit;
}

@keyframes pulseDot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Floating Language Mode Picker Menu */
.language-picker-popup {
  position: fixed;
  z-index: 10000;
  background: #1e1e1e;
  border: 1px solid #333333;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  width: 170px;
  overflow: hidden;
  font-size: 12px;
  color: #cccccc;
  animation: popupFade 0.12s ease-out;
}

@keyframes popupFade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.picker-header {
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888888;
  border-bottom: 1px solid #2a2a2a;
  background: #181818;
}

.picker-list {
  padding: 4px 0;
}

.picker-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 12px;
  background: transparent;
  border: none;
  color: #dddddd;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  transition: background 0.1s ease;
}

.picker-item:hover {
  background: #094771;
  color: #ffffff;
}

.picker-item.selected {
  color: #38bdf8;
  font-weight: 600;
}

.picker-item.selected::after {
  content: '✓';
  font-size: 11px;
}

.lang-ext {
  font-size: 10px;
  color: #777777;
  font-family: var(--font-mono);
}

.picker-item:hover .lang-ext {
  color: #cbd5e1;
}
</style>
