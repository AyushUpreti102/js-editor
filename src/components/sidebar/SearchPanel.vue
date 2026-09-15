<template>
  <aside class="search-panel" aria-label="Search Panel">
    <!-- Search Section Header -->
    <div class="search-header">
      <span class="search-title">SEARCH</span>
      <div class="search-actions">
        <!-- Toggle Replace Bar -->
        <button
          class="icon-btn"
          :class="{ active: isReplaceOpen }"
          title="Toggle Replace"
          aria-label="Toggle Replace"
          @click="isReplaceOpen = !isReplaceOpen"
        >
          <IconReplace :size="14" />
        </button>

        <!-- Refresh Search -->
        <button
          class="icon-btn"
          title="Refresh Search"
          aria-label="Refresh Search"
          @click="performSearch"
        >
          <IconRefresh :size="14" />
        </button>

        <!-- Clear Search -->
        <button
          v-if="searchQuery || searchResults.length > 0"
          class="icon-btn"
          title="Clear Search"
          aria-label="Clear Search"
          @click="clearSearch"
        >
          <IconClear :size="14" />
        </button>

        <!-- Collapse / Expand All Result Groups -->
        <button
          v-if="searchResults.length > 0"
          class="icon-btn"
          :title="allCollapsed ? 'Expand All' : 'Collapse All'"
          :aria-label="allCollapsed ? 'Expand All' : 'Collapse All'"
          @click="toggleCollapseAll"
        >
          <IconCollapseAll v-if="!allCollapsed" :size="15" />
          <IconExpandAll v-else :size="15" />
        </button>
      </div>
    </div>

    <!-- Search & Replace Controls -->
    <div class="search-controls">
      <!-- Search Input Group -->
      <div class="input-row">
        <div class="input-wrapper">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            class="search-input"
            type="text"
            placeholder="Search"
            spellcheck="false"
            @input="handleSearchInput"
            @keydown.enter="handleEnterKey"
          />

          <!-- Query Options (Case, Whole Word, Regex) -->
          <div class="option-toggles">
            <button
              class="option-toggle-btn"
              :class="{ active: isMatchCase }"
              title="Match Case (Alt+C)"
              @click="toggleMatchCase"
            >
              <IconCaseSensitive :size="15" />
            </button>
            <button
              class="option-toggle-btn"
              :class="{ active: isMatchWholeWord }"
              title="Match Whole Word (Alt+W)"
              @click="toggleMatchWholeWord"
            >
              <IconWholeWord :size="14" />
            </button>
            <button
              class="option-toggle-btn"
              :class="{ active: isUseRegex }"
              title="Use Regular Expression (Alt+R)"
              @click="toggleUseRegex"
            >
              <IconRegex :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Replace Input Group -->
      <div v-show="isReplaceOpen" class="input-row replace-row">
        <div class="input-wrapper">
          <input
            v-model="replaceText"
            class="search-input"
            type="text"
            placeholder="Replace"
            spellcheck="false"
            @keydown.enter="replaceAllMatches"
          />
          <div class="replace-actions">
            <button
              class="option-toggle-btn replace-all-btn"
              :disabled="totalMatchesCount === 0"
              title="Replace All (Cmd+Alt+Enter)"
              @click="replaceAllMatches"
            >
              <IconReplaceAll :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Regex Error Message -->
      <div v-if="regexError" class="search-error-msg">
        ⚠ {{ regexError }}
      </div>
    </div>

    <!-- Search Results Summary -->
    <div v-if="hasSearched" class="search-summary">
      <span v-if="totalMatchesCount > 0" class="summary-text">
        {{ totalMatchesCount }} result{{ totalMatchesCount === 1 ? '' : 's' }} in
        {{ searchResults.length }} file{{ searchResults.length === 1 ? '' : 's' }}
      </span>
      <span v-else-if="!searchQuery" class="summary-text empty">
        Type to search across workspace files
      </span>
      <span v-else class="summary-text empty">
        No results found for "{{ searchQuery }}"
      </span>
    </div>

    <!-- Search Results Tree View -->
    <div class="results-container">
      <div v-for="fileGroup in searchResults" :key="fileGroup.fileId" class="file-group">
        <!-- File Header -->
        <div
          class="file-group-header"
          @click="toggleFileGroup(fileGroup.fileId)"
        >
          <span class="chevron" :class="{ open: !collapsedGroups[fileGroup.fileId] }">▸</span>
          <span :class="['file-badge', `file-${getFileExt(fileGroup.fileName)}`]">
            {{ getFileExt(fileGroup.fileName).toUpperCase() || 'TXT' }}
          </span>
          <span class="file-name" :title="fileGroup.fullPath">{{ fileGroup.fileName }}</span>
          <span v-if="fileGroup.dirPath" class="dir-path">{{ fileGroup.dirPath }}</span>
          <span class="matches-badge">{{ fileGroup.matches.length }}</span>

          <!-- Replace all in this file button -->
          <button
            v-if="isReplaceOpen"
            class="group-action-btn"
            title="Replace All in File"
            @click.stop="replaceAllInFile(fileGroup)"
          >
            <IconReplaceAll :size="12" />
          </button>
        </div>

        <!-- Matches list inside file -->
        <div v-show="!collapsedGroups[fileGroup.fileId]" class="matches-list">
          <div
            v-for="(match, idx) in fileGroup.matches"
            :key="idx"
            class="match-item"
            :title="`Line ${match.lineNumber}: ${match.lineContent}`"
            @click="handleSelectMatch(fileGroup, match)"
          >
            <span class="line-number">{{ match.lineNumber }}:</span>
            <span class="snippet">
              <span class="snippet-prefix">{{ match.prefix }}</span>
              <mark class="snippet-match">{{ match.matchedText }}</mark>
              <span class="snippet-suffix">{{ match.suffix }}</span>
            </span>

            <!-- Single match replace button -->
            <button
              v-if="isReplaceOpen"
              class="match-replace-btn"
              title="Replace Match"
              @click.stop="replaceSingleMatch(fileGroup, match)"
            >
              <IconReplace :size="11" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import {
  RefreshCw as IconRefresh,
  FoldVertical as IconCollapseAll,
  UnfoldVertical as IconExpandAll,
  CaseSensitive as IconCaseSensitive,
  WholeWord as IconWholeWord,
  Regex as IconRegex,
  Replace as IconReplace,
  ReplaceAll as IconReplaceAll,
  X as IconClear,
} from '@lucide/vue'
import { useFilesStore } from '@/stores/filesStore'
import { useEditorStore } from '@/stores/editorStore'
import { getFileExt } from '@/utils/fileUtils'

const emit = defineEmits(['select-match', 'replace-done'])

const filesStore = useFilesStore()
const editorStore = useEditorStore()

const searchInputRef = ref(null)
const searchQuery = ref('')
const replaceText = ref('')
const hasSearched = ref(false)
const regexError = ref('')

// Search mode options
const isReplaceOpen = useStorage('search_replace_open', false)
const isMatchCase = useStorage('search_match_case', false)
const isMatchWholeWord = useStorage('search_match_whole_word', false)
const isUseRegex = useStorage('search_use_regex', false)

// Collapsed state map for file groups
const collapsedGroups = ref({})

// Search Results Data
const searchResults = ref([])

const totalMatchesCount = computed(() => {
  return searchResults.value.reduce((acc, f) => acc + f.matches.length, 0)
})

const allCollapsed = computed(() => {
  if (searchResults.value.length === 0) return false
  return searchResults.value.every((f) => Boolean(collapsedGroups.value[f.fileId]))
})

const toggleCollapseAll = () => {
  const shouldOpen = allCollapsed.value
  searchResults.value.forEach((f) => {
    collapsedGroups.value[f.fileId] = !shouldOpen
  })
}

const toggleFileGroup = (fileId) => {
  collapsedGroups.value[fileId] = !collapsedGroups.value[fileId]
}

const toggleMatchCase = () => {
  isMatchCase.value = !isMatchCase.value
  performSearch()
}

const toggleMatchWholeWord = () => {
  isMatchWholeWord.value = !isMatchWholeWord.value
  performSearch()
}

const toggleUseRegex = () => {
  isUseRegex.value = !isUseRegex.value
  performSearch()
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  regexError.value = ''
  searchInputRef.value?.focus()
}

const handleSearchInput = () => {
  performSearch()
}

const handleEnterKey = () => {
  if (searchResults.value.length > 0 && searchResults.value[0].matches.length > 0) {
    const firstGroup = searchResults.value[0]
    const firstMatch = firstGroup.matches[0]
    handleSelectMatch(firstGroup, firstMatch)
  }
}

/**
 * Executes search across all files in filesStore.fileContentMap
 */
const performSearch = () => {
  regexError.value = ''
  const query = searchQuery.value

  if (!query) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  hasSearched.value = true

  // Construct search RegExp
  let regex = null
  try {
    let pattern = query
    if (!isUseRegex.value) {
      pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    if (isMatchWholeWord.value) {
      pattern = `\\b${pattern}\\b`
    }
    const flags = isMatchCase.value ? 'g' : 'gi'
    regex = new RegExp(pattern, flags)
  } catch (err) {
    regexError.value = err.message || 'Invalid regular expression'
    searchResults.value = []
    return
  }

  const results = []
  const contentMap = filesStore.fileContentMap || {}

  // Iterate over files in filesMap (or fileContentMap)
  Object.keys(contentMap).forEach((fileId) => {
    const fileItem = contentMap[fileId]
    const content = typeof fileItem === 'string' ? fileItem : (fileItem?.content ?? '')
    const fileName = fileItem?.name || fileId
    const fullPath = filesStore.getFilePath ? filesStore.getFilePath(fileId) : fileName

    let dirPath = ''
    const lastSlash = fullPath.lastIndexOf('/')
    if (lastSlash > 0) {
      dirPath = fullPath.substring(0, lastSlash)
    }

    const lines = content.split('\n')
    const matches = []

    lines.forEach((lineText, lineIdx) => {
      // Reset lastIndex for global regex
      regex.lastIndex = 0
      let match

      while ((match = regex.exec(lineText)) !== null) {
        const startCol = match.index + 1
        const matchedText = match[0]
        if (!matchedText) {
          regex.lastIndex++
          continue
        }

        const prefixStart = Math.max(0, match.index - 25)
        const prefix = (prefixStart > 0 ? '...' : '') + lineText.substring(prefixStart, match.index)
        const suffixEnd = Math.min(lineText.length, match.index + matchedText.length + 35)
        const suffix =
          lineText.substring(match.index + matchedText.length, suffixEnd) +
          (suffixEnd < lineText.length ? '...' : '')

        matches.push({
          lineNumber: lineIdx + 1,
          column: startCol,
          matchLength: matchedText.length,
          lineContent: lineText.trim(),
          matchedText,
          prefix: prefix.trimStart(),
          suffix,
        })

        if (!regex.global) break
      }
    })

    if (matches.length > 0) {
      results.push({
        fileId,
        fileName,
        fullPath,
        dirPath,
        matches,
      })
    }
  })

  // Sort results: files with matches sorted alphabetically
  results.sort((a, b) => a.fullPath.localeCompare(b.fullPath))
  searchResults.value = results
}

/**
 * Handles clicking a match in the search results
 */
const handleSelectMatch = (fileGroup, match) => {
  emit('select-match', {
    fileId: fileGroup.fileId,
    fileName: fileGroup.fileName,
    lineNumber: match.lineNumber,
    column: match.column,
    matchLength: match.matchLength,
  })
}

/**
 * Replaces a single match in the virtual workspace
 */
const replaceSingleMatch = (fileGroup, match) => {
  const fileId = fileGroup.fileId
  const fileItem = filesStore.fileContentMap[fileId]
  if (!fileItem) return

  const currentContent = typeof fileItem === 'string' ? fileItem : (fileItem.content ?? '')
  const lines = currentContent.split('\n')
  const targetLineIdx = match.lineNumber - 1

  if (lines[targetLineIdx] !== undefined) {
    const line = lines[targetLineIdx]
    const before = line.substring(0, match.column - 1)
    const after = line.substring(match.column - 1 + match.matchLength)
    lines[targetLineIdx] = before + replaceText.value + after

    const updatedContent = lines.join('\n')
    if (typeof fileItem === 'string') {
      filesStore.fileContentMap[fileId] = updatedContent
    } else {
      fileItem.content = updatedContent
    }

    // Update Monaco model if loaded
    const model = editorStore.modelsMap[fileId]
    if (model) {
      model.setValue(updatedContent)
    }

    performSearch()
  }
}

/**
 * Replaces all occurrences in a single file
 */
const replaceAllInFile = (fileGroup) => {
  const fileId = fileGroup.fileId
  const fileItem = filesStore.fileContentMap[fileId]
  if (!fileItem || !searchQuery.value) return

  let pattern = searchQuery.value
  if (!isUseRegex.value) {
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  if (isMatchWholeWord.value) {
    pattern = `\\b${pattern}\\b`
  }
  const flags = isMatchCase.value ? 'g' : 'gi'
  const regex = new RegExp(pattern, flags)

  const currentContent = typeof fileItem === 'string' ? fileItem : (fileItem.content ?? '')
  const updatedContent = currentContent.replace(regex, replaceText.value)

  if (typeof fileItem === 'string') {
    filesStore.fileContentMap[fileId] = updatedContent
  } else {
    fileItem.content = updatedContent
  }

  const model = editorStore.modelsMap[fileId]
  if (model) {
    model.setValue(updatedContent)
  }

  performSearch()
}

/**
 * Replaces all matches across all files in the workspace
 */
const replaceAllMatches = () => {
  if (totalMatchesCount.value === 0 || !searchQuery.value) return

  let pattern = searchQuery.value
  if (!isUseRegex.value) {
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  if (isMatchWholeWord.value) {
    pattern = `\\b${pattern}\\b`
  }
  const flags = isMatchCase.value ? 'g' : 'gi'
  const regex = new RegExp(pattern, flags)

  searchResults.value.forEach((fileGroup) => {
    const fileId = fileGroup.fileId
    const fileItem = filesStore.fileContentMap[fileId]
    if (!fileItem) return

    const currentContent = typeof fileItem === 'string' ? fileItem : (fileItem.content ?? '')
    const updatedContent = currentContent.replace(regex, replaceText.value)

    if (typeof fileItem === 'string') {
      filesStore.fileContentMap[fileId] = updatedContent
    } else {
      fileItem.content = updatedContent
    }

    const model = editorStore.modelsMap[fileId]
    if (model) {
      model.setValue(updatedContent)
    }
  })

  performSearch()
  emit('replace-done')
}

// Method called when sidebar is switched to search
const focus = () => {
  nextTick(() => {
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  })
}

const openReplace = () => {
  isReplaceOpen.value = true
}

defineExpose({
  focus,
  performSearch,
  openReplace,
})
</script>

<style scoped>
.search-panel {
  width: 250px;
  min-width: 200px;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  user-select: none;
  font-size: 13px;
  overflow: hidden;
}

.search-header {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  letter-spacing: 0.5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 3px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}

.icon-btn:hover {
  background: var(--bg-selected);
  color: var(--text-bright);
}

.icon-btn.active {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.search-controls {
  padding: 6px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.input-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  background: #121212;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  transition: border-color 0.15s ease;
}

.input-wrapper:focus-within {
  border-color: var(--accent-blue, #007acc);
}

.search-input {
  width: 100%;
  height: 26px;
  background: transparent;
  border: none;
  outline: none;
  color: #f1f5f9;
  font-size: 12px;
  padding: 0 74px 0 8px;
  font-family: inherit;
}

.replace-row .search-input {
  padding-right: 32px;
}

.option-toggles {
  position: absolute;
  right: 2px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.option-toggle-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  color: #888888;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.12s;
  padding: 0;
}

.option-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.option-toggle-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.4);
  color: #38bdf8;
}

.replace-actions {
  position: absolute;
  right: 4px;
}

.replace-all-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.search-error-msg {
  font-size: 11px;
  color: #f87171;
  padding: 2px 4px;
}

.search-summary {
  padding: 4px 12px;
  font-size: 11px;
  color: var(--text-secondary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}

.summary-text.empty {
  font-style: italic;
  opacity: 0.7;
}

.results-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 4px;
}

.file-group {
  margin-bottom: 2px;
}

.file-group-header {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 12px;
  transition: background 0.1s ease;
  position: relative;
}

.file-group-header:hover {
  background: var(--bg-hover);
}

.chevron {
  display: inline-block;
  font-size: 11px;
  transition: transform 0.15s ease;
  color: var(--text-secondary);
}

.chevron.open {
  transform: rotate(90deg);
}

.file-badge {
  font-size: 8px;
  font-weight: 700;
  padding: 1px 3px;
  border-radius: 2px;
  line-height: 1;
  font-family: var(--font-mono);
}

.file-vue {
  background: rgba(65, 184, 131, 0.2);
  color: #41b883;
}
.file-js {
  background: rgba(247, 223, 30, 0.2);
  color: #f7df1e;
}
.file-css {
  background: rgba(38, 77, 228, 0.2);
  color: #61afef;
}
.file-html {
  background: rgba(227, 76, 38, 0.2);
  color: #e34c26;
}
.file-json {
  background: rgba(203, 192, 45, 0.2);
  color: #dcdcaa;
}
.file-md {
  background: rgba(100, 160, 255, 0.2);
  color: #4fc1ff;
}

.file-name {
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dir-path {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.7;
}

.matches-badge {
  margin-left: auto;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 6px;
  border-radius: 9999px;
  color: var(--text-secondary);
}

.group-action-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.matches-list {
  display: flex;
  flex-direction: column;
}

.match-item {
  height: 22px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 28px;
  cursor: pointer;
  font-size: 11px;
  font-family: var(--font-mono);
  color: #cbd5e1;
  transition: background 0.1s ease;
  position: relative;
}

.match-item:hover {
  background: var(--bg-hover);
}

.line-number {
  color: var(--text-secondary);
  font-size: 10px;
  min-width: 20px;
  text-align: right;
  flex-shrink: 0;
}

.snippet {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.snippet-match {
  background: rgba(245, 158, 11, 0.35);
  color: #ffffff;
  border-radius: 2px;
  padding: 0 1px;
}

.match-replace-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
}

.match-item:hover .match-replace-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.match-replace-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}
</style>
