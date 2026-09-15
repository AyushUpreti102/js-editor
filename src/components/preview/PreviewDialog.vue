<template>
  <div class="preview-system">
    <Teleport to="body">
      <!-- Minimized Dock Bar (Bottom Right) -->
      <div v-if="isOpen && isMinimized" class="minimized-dock" @click="restoreDialog">
        <div class="dock-left">
          <span class="status-dot"></span>
          <span class="dock-title">Preview: localhost:5173</span>
        </div>
        <div class="dock-actions" @click.stop>
          <button class="dock-btn" title="Restore Preview" @click="restoreDialog">
            <IconRestore :size="14" />
          </button>
          <button class="dock-btn close" title="Close Preview" @click="closeDialog">✕</button>
        </div>
      </div>

      <!-- Floating Preview Dialog -->
      <Transition name="preview-dialog">
        <div
          v-if="isOpen && !isMinimized"
          class="preview-dialog"
          :class="{ 'is-maximized': isMaximized }"
        >
          <!-- Dialog Header / Browser Chrome -->
          <div class="dialog-header">
            <!-- Window Controls (Traffic Lights) -->
            <div class="window-controls">
              <button class="window-dot dot-close" title="Close" @click="closeDialog"></button>
              <button
                class="window-dot dot-minimize"
                title="Minimize"
                @click="minimizeDialog"
              ></button>
              <button
                class="window-dot dot-maximize"
                title="Maximize / Restore"
                @click="toggleMaximize"
              ></button>
            </div>

            <!-- Mock URL Address Bar with click-to-copy via @vueuse/core -->
            <div
              class="address-bar"
              :title="copied ? 'Copied to clipboard!' : 'Click to copy URL'"
              @click="copyUrl"
            >
              <button class="browser-btn" title="Reload Preview" @click.stop="reloadPreview">
                <IconRefresh :size="12" />
              </button>
              <span class="url-protocol">http://</span>
              <span class="url-text">localhost:5173</span>
              <span class="url-badge" :class="{ copied }">{{
                copied ? 'COPIED!' : 'PREVIEW'
              }}</span>
            </div>

            <!-- Header Right Actions -->
            <div class="header-right">
              <!-- Minimize Button -->
              <button class="header-action-btn" title="Minimize" @click="minimizeDialog">
                <IconMinimize :size="14" />
              </button>

              <!-- Maximize Button -->
              <button class="header-action-btn" title="Maximize" @click="toggleMaximize">
                <IconMaximize v-if="!isMaximized" :size="13" />
                <IconRestore v-else :size="13" />
              </button>

              <!-- Close Button -->
              <button class="header-action-btn close-btn" title="Close" @click="closeDialog">
                ✕
              </button>
            </div>
          </div>

          <!-- Dialog Body / Preview Frame -->
          <div class="dialog-body">
            <iframe
              :key="previewKey"
              class="preview-iframe"
              :srcdoc="activeSrcDoc"
              sandbox="allow-scripts allow-modals"
              title="Application Live Preview"
            ></iframe>
          </div>

          <!-- Dialog Footer / Info Bar -->
          <div class="dialog-footer">
            <span class="footer-status">● Preview running</span>
            <span class="footer-resolution">{{
              isMaximized ? 'Full Viewport' : '720 × 520 px'
            }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onKeyStroke, useClipboard } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useFilesStore } from '@/stores/filesStore'
import { buildExecutableHtml } from '@/utils/fileUtils'
import { IconRestore, IconRefresh, IconMinimize, IconMaximize } from '@/components/icons'

const emit = defineEmits(['update:open', 'open', 'close'])

const filesStore = useFilesStore()
const { fileContentMap, filesMap } = storeToRefs(filesStore)

const isOpen = ref(false)
const isMinimized = ref(false)
const isMaximized = ref(false)
const previewKey = ref(0)

// URL clipboard copying via @vueuse/core
const { copy, copied } = useClipboard()

const copyUrl = () => {
  copy('http://localhost:5173')
}

// Escape key minimizes or closes preview dialog via @vueuse/core
onKeyStroke('Escape', (e) => {
  if (isOpen.value && !isMinimized.value) {
    e.preventDefault()
    minimizeDialog()
  }
})

// Compute executable HTML from virtual files using buildExecutableHtml
const activeSrcDoc = computed(() => {
  // Use previewKey as dependency to force fresh preview computation on demand
  const _ = previewKey.value
  void _
  const map = fileContentMap.value || {}

  // Locate index.html or primary HTML file
  const htmlFile =
    map['index-html'] ||
    map['index.html'] ||
    Object.values(map).find((f) => f.name === 'index.html') ||
    Object.values(map).find((f) => f.name?.endsWith('.html'))

  const rawHtml = htmlFile?.content || ''
  return buildExecutableHtml(rawHtml, map, filesMap.value)
})

const minimizeDialog = () => {
  isMinimized.value = true
}

const restoreDialog = () => {
  isMinimized.value = false
}

const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value
}

const closeDialog = () => {
  isOpen.value = false
  isMinimized.value = false
  isMaximized.value = false
  emit('update:open', false)
  emit('close')
}

const reloadPreview = () => {
  previewKey.value++
}

const open = () => {
  isOpen.value = true
  isMinimized.value = false
  previewKey.value++
  emit('update:open', true)
  emit('open')
}

const toggle = () => {
  if (isOpen.value && !isMinimized.value) {
    closeDialog()
  } else {
    open()
  }
}

defineExpose({
  isOpen,
  isMinimized,
  open,
  close: closeDialog,
  toggle,
  minimize: minimizeDialog,
  restore: restoreDialog,
  reload: reloadPreview,
})
</script>

<style scoped>
/* Minimized Dock Bar */
.minimized-dock {
  position: fixed;
  bottom: 40px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 8px 14px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition:
    transform 0.2s,
    background 0.2s;
  min-width: 250px;
}

.minimized-dock:hover {
  background: #2d2d2d;
  transform: translateY(-2px);
}

.dock-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.dock-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dock-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dock-btn:hover {
  background: var(--bg-selected);
  color: white;
}

.dock-btn.close:hover {
  background: #ef4444;
  color: white;
}

/* Floating Preview Dialog */
.preview-dialog {
  position: fixed;
  bottom: 50px;
  right: 28px;
  width: 720px;
  height: 520px;
  max-width: calc(100vw - 56px);
  max-height: calc(100vh - 100px);
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 12px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.preview-dialog.is-maximized {
  bottom: 24px;
  right: 24px;
  left: 24px;
  top: 24px;
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
  border-radius: 8px;
}

/* Dialog Header */
.dialog-header {
  height: 42px;
  background: #252526;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  user-select: none;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 70px;
}

.window-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}

.window-dot:hover {
  opacity: 0.8;
}

.dot-close {
  background: #ff5f56;
}

.dot-minimize {
  background: #ffbd2e;
}

.dot-maximize {
  background: #27c93f;
}

.address-bar {
  flex: 1;
  max-width: 380px;
  height: 26px;
  background: #181818;
  border: 1px solid #383838;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  font-size: 11px;
  color: #aaa;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.address-bar:hover {
  border-color: #555555;
}

.url-badge.copied {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.browser-btn {
  background: transparent;
  border: none;
  color: #777;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.browser-btn:hover {
  color: white;
}

.url-protocol {
  color: #555;
}

.url-text {
  color: #eee;
  flex: 1;
}

.url-badge {
  font-size: 9px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 70px;
  justify-content: flex-end;
}

.header-action-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition:
    background 0.15s,
    color 0.15s;
}

.header-action-btn:hover {
  background: var(--bg-selected);
  color: var(--text-bright);
}

.header-action-btn.close-btn:hover {
  background: #ef4444;
  color: white;
}

/* Dialog Body */
.dialog-body {
  flex: 1;
  background: #ffffff;
  position: relative;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* Dialog Footer */
.dialog-footer {
  height: 22px;
  background: #1e1e1e;
  border-top: 1px solid #2d2d2d;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 10px;
  color: var(--text-secondary);
}

.footer-status {
  color: #22c55e;
}

/* Dialog Transition */
.preview-dialog-enter-active,
.preview-dialog-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.preview-dialog-enter-from,
.preview-dialog-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}
</style>
