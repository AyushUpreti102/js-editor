<template>
  <Teleport to="body">
    <Transition name="palette-fade">
      <div v-if="isOpen" class="palette-backdrop" @mousedown.self="handleClose">
        <div ref="paletteRef" class="quick-file-search" role="dialog" aria-modal="true" aria-label="Quick Open">
          <!-- Search Header Input -->
          <div class="search-input-box">
            <IconSearch :size="16" class="search-input-icon" />
            <input
              ref="inputRef"
              v-model="searchQuery"
              class="palette-input"
              type="text"
              placeholder="Search files by name (e.g. script.js, style.css)..."
              spellcheck="false"
              autocomplete="off"
              @keydown.down.prevent="navigateDown"
              @keydown.up.prevent="navigateUp"
              @keydown.enter.prevent="selectCurrent"
              @keydown.esc.prevent="handleClose"
            />
            <button
              v-if="searchQuery"
              class="clear-input-btn"
              title="Clear search"
              aria-label="Clear search"
              @click="clearInput"
            >
              <IconClear :size="14" />
            </button>
            <kbd class="esc-badge" @click="handleClose">esc</kbd>
          </div>

          <!-- File Results List -->
          <div ref="listRef" class="results-list" role="listbox">
            <template v-if="filteredFiles.length > 0">
              <div
                v-for="(item, index) in filteredFiles"
                :id="`file-result-${item.id}`"
                :key="item.id"
                class="result-item"
                :class="{ selected: index === selectedIndex, active: item.isActive }"
                role="option"
                :aria-selected="index === selectedIndex"
                @mouseenter="selectedIndex = index"
                @click="handleSelect(item)"
              >
                <!-- File Extension / Language Badge -->
                <span :class="['file-type-badge', `file-${item.ext}`]">
                  {{ item.ext.toUpperCase() || 'TXT' }}
                </span>

                <!-- File Info: Name and Parent Folder -->
                <div class="file-details">
                  <span class="file-name" v-html="highlightText(item.name, searchQuery)"></span>
                  <span v-if="item.dirPath" class="file-dir" v-html="highlightText(item.dirPath, searchQuery)"></span>
                </div>

                <!-- Status Tags -->
                <div class="item-tags">
                  <span v-if="item.isActive" class="status-tag active-tag">Active</span>
                  <span v-else-if="item.isOpenTab" class="status-tag open-tag">Open</span>
                </div>
              </div>
            </template>

            <!-- Empty Search State -->
            <div v-else class="empty-state">
              <span class="empty-icon">📂</span>
              <span class="empty-title">No matching files found</span>
              <span class="empty-subtitle">Try searching with a different filename or extension</span>
            </div>
          </div>

          <!-- Footer Bar -->
          <div class="palette-footer">
            <div class="footer-stats">
              {{ filteredFiles.length }} {{ filteredFiles.length === 1 ? 'file' : 'files' }}
            </div>
            <div class="footer-hints">
              <span class="hint-item"><kbd class="key-hint">↑</kbd><kbd class="key-hint">↓</kbd> Navigate</span>
              <span class="hint-item"><kbd class="key-hint">↵</kbd> Open</span>
              <span class="hint-item"><kbd class="key-hint">esc</kbd> Close</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Search as IconSearch, X as IconClear } from '@lucide/vue'
import { useFilesStore } from '@/stores/filesStore'
import { getFileExt } from '@/utils/fileUtils'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  activeFileId: {
    type: String,
    default: '',
  },
  openTabs: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'select-file'])

const fileStore = useFilesStore()

const inputRef = ref(null)
const listRef = ref(null)
const paletteRef = ref(null)
const searchQuery = ref('')
const selectedIndex = ref(0)

// Helper to escape HTML characters before formatting highlights
const escapeHtml = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Highlights matching query terms in text
 */
const highlightText = (text, query) => {
  if (!text) return ''
  const safeText = escapeHtml(text)
  const trimmed = query.trim()
  if (!trimmed) return safeText

  const escapedQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return safeText.replace(regex, '<mark class="highlight-match">$1</mark>')
}

// Flat list of file items from store
const allFiles = computed(() => {
  const openIds = new Set(props.openTabs.map((t) => t.id))
  return (fileStore.filesMap || [])
    .filter((item) => item.type === 'file')
    .map((file) => {
      const fullPath = fileStore.getFilePath ? fileStore.getFilePath(file.id) : file.name
      const ext = getFileExt(file.name)
      const lastSlash = fullPath.lastIndexOf('/')
      const dirPath = lastSlash !== -1 ? fullPath.substring(0, lastSlash) : ''

      return {
        id: file.id,
        name: file.name,
        ext,
        fullPath,
        dirPath,
        isActive: props.activeFileId === file.id,
        isOpenTab: openIds.has(file.id),
      }
    })
})

/**
 * Filtered & sorted results based on query
 */
const filteredFiles = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    // When no query: active file first, then open tabs, then alphabetical
    return [...allFiles.value].sort((a, b) => {
      if (a.isActive) return -1
      if (b.isActive) return 1
      if (a.isOpenTab && !b.isOpenTab) return -1
      if (!a.isOpenTab && b.isOpenTab) return 1
      return a.name.localeCompare(b.name)
    })
  }

  const matches = []
  for (const file of allFiles.value) {
    const nameLower = file.name.toLowerCase()
    const pathLower = file.fullPath.toLowerCase()

    let score = 0
    if (nameLower === query) {
      score = 100
    } else if (nameLower.startsWith(query)) {
      score = 80
    } else if (nameLower.includes(query)) {
      score = 60
    } else if (pathLower.includes(query)) {
      score = 40
    } else {
      // Subsequence fuzzy match
      let pos = 0
      let fuzzyMatch = true
      for (let i = 0; i < query.length; i++) {
        pos = nameLower.indexOf(query[i], pos)
        if (pos === -1) {
          fuzzyMatch = false
          break
        }
        pos++
      }
      if (fuzzyMatch) {
        score = 25
      }
    }

    if (score > 0) {
      if (file.isActive) score += 5
      else if (file.isOpenTab) score += 2
      matches.push({ ...file, score })
    }
  }

  return matches.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
})

// Navigation controls
const navigateDown = () => {
  if (filteredFiles.value.length === 0) return
  selectedIndex.value = (selectedIndex.value + 1) % filteredFiles.value.length
  scrollToSelected()
}

const navigateUp = () => {
  if (filteredFiles.value.length === 0) return
  selectedIndex.value =
    (selectedIndex.value - 1 + filteredFiles.value.length) % filteredFiles.value.length
  scrollToSelected()
}

const scrollToSelected = () => {
  nextTick(() => {
    if (!listRef.value) return
    const activeEl = listRef.value.querySelector('.result-item.selected')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  })
}

const selectCurrent = () => {
  if (filteredFiles.value.length > 0 && filteredFiles.value[selectedIndex.value]) {
    handleSelect(filteredFiles.value[selectedIndex.value])
  }
}

const handleSelect = (item) => {
  emit('select-file', { id: item.id, name: item.name })
  handleClose()
}

const handleClose = () => {
  emit('close')
}

const clearInput = () => {
  searchQuery.value = ''
  selectedIndex.value = 0
  inputRef.value?.focus()
}

// Watchers
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      searchQuery.value = ''
      selectedIndex.value = 0
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  },
)

watch(searchQuery, () => {
  selectedIndex.value = 0
  if (listRef.value) {
    listRef.value.scrollTop = 0
  }
})
</script>

<style scoped>
.palette-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 50px;
}

.quick-file-search {
  width: 580px;
  max-width: calc(100vw - 32px);
  background: var(--bg-secondary);
  border: 1px solid #454545;
  border-radius: 8px;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--font-sans);
  color: var(--text-primary);
}

.search-input-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.search-input-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.palette-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-bright);
}

.palette-input::placeholder {
  color: #666666;
}

.clear-input-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: color 0.15s;
}

.clear-input-btn:hover {
  color: var(--text-bright);
}

.esc-badge {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 10px;
  color: #888;
  font-family: var(--font-mono);
  cursor: pointer;
}

.results-list {
  max-height: 380px;
  overflow-y: auto;
  padding: 6px 0;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
  position: relative;
}

.result-item:hover {
  background: var(--bg-hover);
}

.result-item.selected {
  background: var(--bg-selected);
}

.result-item.selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  background: var(--accent-blue);
  border-radius: 0 2px 2px 0;
}

.file-type-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 3px;
  line-height: 1;
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.file-vue {
  background: rgba(65, 184, 131, 0.2);
  color: #41b883;
}

.file-js,
.file-mjs {
  background: rgba(247, 223, 30, 0.2);
  color: #f7df1e;
}

.file-ts {
  background: rgba(49, 120, 198, 0.2);
  color: #3178c6;
}

.file-css,
.file-scss,
.file-less {
  background: rgba(38, 77, 228, 0.2);
  color: #61afef;
}

.file-html,
.file-htm {
  background: rgba(227, 76, 38, 0.2);
  color: #e34c26;
}

.file-json {
  background: rgba(203, 192, 45, 0.2);
  color: #dcdcaa;
}

.file-md,
.file-markdown {
  background: rgba(100, 160, 255, 0.2);
  color: #4fc1ff;
}

.file-details {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-bright);
}

:deep(.highlight-match) {
  background: rgba(0, 122, 204, 0.35);
  color: #60cdff;
  border-radius: 2px;
  padding: 0 1px;
}

.file-dir {
  font-size: 11px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.status-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.active-tag {
  background: rgba(0, 122, 204, 0.25);
  color: #60cdff;
  border: 1px solid rgba(0, 122, 204, 0.4);
}

.open-tag {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-icon {
  font-size: 28px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.empty-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.empty-subtitle {
  font-size: 11px;
}

.palette-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
  font-size: 11px;
  color: var(--text-secondary);
}

.footer-hints {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.key-hint {
  background: #222222;
  border: 1px solid #444;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 9px;
  color: #bbb;
  font-family: var(--font-mono);
}

/* Modal Transition */
.palette-fade-enter-active,
.palette-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.palette-fade-enter-from,
.palette-fade-leave-to {
  opacity: 0;
}

.palette-fade-enter-from .quick-file-search,
.palette-fade-leave-to .quick-file-search {
  transform: translateY(-8px) scale(0.98);
}
</style>
