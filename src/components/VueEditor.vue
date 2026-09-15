<template>
  <div class="app-window">
    <!-- Top Titlebar / Header -->
    <AppHeader
      :active-file-name="activeFile ? activeFile.name : 'Editor'"
      :is-sidebar-open="isSidebarOpen"
      :is-console-open="isConsoleOpen"
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      @toggle-console="isConsoleOpen = !isConsoleOpen"
      @open-file-search="isFileSearchOpen = true"
      @save-workspace="handleSaveWorkspace"
      @open-search="handleOpenSearch"
      @open-replace="handleOpenReplace"
      @toggle-search="handleToggleSearch"
      @run="runProject"
    />

    <!-- Main Workspace Body -->
    <div class="app-body">
      <!-- Left 1: Activity Bar -->
      <ActivityBar
        :active-view="activeSidebarView"
        :is-sidebar-open="isSidebarOpen"
        @select-view="handleSelectSidebarView"
      />

      <!-- Left 2: Collapsible Sidebar (Explorer or Search) -->
      <FileExplorer
        v-show="isSidebarOpen && activeSidebarView === 'explorer'"
        :selected-file-id="activeTabId"
        @select-file="handleSelectFile"
        @rename-file="handleRenameFile"
        @delete-file="handleDeleteFile"
      />

      <SearchPanel
        v-show="isSidebarOpen && activeSidebarView === 'search'"
        ref="searchPanelRef"
        @select-match="handleSelectSearchMatch"
      />

      <!-- Center & Right: Editor Workspace Area -->
      <main class="editor-workspace">
        <!-- Tab Bar & Breadcrumbs -->
        <EditorTabs
          :open-tabs="openTabs"
          :active-tab-id="activeTabId"
          @select-tab="handleSelectTab"
          @close-tab="handleCloseTab"
        />

        <!-- Monaco Code Editor Mount -->
        <MonacoEditor :active-file="activeFile" :active-tab-id="activeTabId" />

        <!-- Collapsible Bottom Console Panel -->
        <ConsolePanel v-if="isConsoleOpen" @close="isConsoleOpen = false" />
      </main>
    </div>

    <!-- Bottom Status Bar -->
    <StatusBar
      :current-language="activeLanguageLabel"
      :is-preview-open="isPreviewOpen"
      @toggle-console="isConsoleOpen = !isConsoleOpen"
      @open-preview="handleTogglePreview"
      @change-language="handleChangeLanguage"
    />

    <!-- Live Preview Dialog -->
    <PreviewDialog
      ref="previewDialogRef"
      @update:open="(val) => (isPreviewOpen = val)"
    />

    <!-- Quick File Search / Command Palette Modal (Cmd+P) -->
    <QuickFileSearch
      :is-open="isFileSearchOpen"
      :active-file-id="activeTabId"
      :open-tabs="openTabs"
      @close="isFileSearchOpen = false"
      @select-file="handleSelectFile"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useStorage, onKeyStroke } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useFilesStore } from '@/stores/filesStore'
import { useEditorStore } from '@/stores/editorStore'
import { useConsoleStore } from '@/stores/consoleStore'
import { getLanguageFromName } from '@/utils/fileUtils'
import { buildRunnerHtml } from '@/utils/runnerHtml'
import { exportWorkspaceZip } from '@/utils/workspaceExport'

import AppHeader from './header/AppHeader.vue'
import QuickFileSearch from './header/QuickFileSearch.vue'
import ActivityBar from './sidebar/ActivityBar.vue'
import FileExplorer from './sidebar/FileExplorer.vue'
import SearchPanel from './sidebar/SearchPanel.vue'
import EditorTabs from './editor/EditorTabs.vue'
import MonacoEditor from './editor/MonacoEditor.vue'
import ConsolePanel from './console/ConsolePanel.vue'
import StatusBar from './statusbar/StatusBar.vue'
import PreviewDialog from './preview/PreviewDialog.vue'

const fileStore = useFilesStore()
const editorStore = useEditorStore()
const consoleStore = useConsoleStore()
const { fileContentMap } = storeToRefs(fileStore)

const previewDialogRef = ref(null)
const searchPanelRef = ref(null)
const isFileSearchOpen = ref(false)
const isPreviewOpen = ref(false)

// Persistent layout states via @vueuse/core useStorage
const isSidebarOpen = useStorage('editor_sidebar_open', true)
const isConsoleOpen = useStorage('editor_console_open', false)
const activeSidebarView = useStorage('editor_active_sidebar_view', 'explorer')
const openTabs = useStorage('editor_open_tabs', [{ id: 'index-html', name: 'index.html' }])
const activeTabId = useStorage('editor_active_tab_id', 'index-html')

/**
 * Executes a JavaScript file inside an isolated sandbox iframe
 * and routes all console logs/errors directly to the IDE console drawer.
 */
const executeJsFile = (file) => {
  if (!file) return
  const code = file.content || ''
  const fileName = file.name || 'script.js'

  consoleStore.addLog({
    method: 'info',
    args: [`[Running ${fileName}]`],
    timestamp: new Date().toLocaleTimeString(),
  })

  // Create isolated sandboxed iframe runner
  const runner = document.createElement('iframe')
  runner.setAttribute('style', 'display:none;position:absolute;width:0;height:0;border:0;')
  runner.setAttribute('sandbox', 'allow-scripts')
  runner.srcdoc = buildRunnerHtml(code, fileStore.fileContentMap, fileStore.filesMap)
  document.body.appendChild(runner)

  setTimeout(() => {
    if (runner.parentNode) {
      runner.parentNode.removeChild(runner)
    }
  }, 2000)
}

/**
 * Synchronizes active editor model into store before running.
 * If HTML file -> opens in live preview.
 * If JS file -> opens in bottom console drawer and executes.
 */
const runProject = (targetType) => {
  if (activeTabId.value && editorStore.editor) {
    const currentVal = editorStore.getValue()
    if (fileStore.fileContentMap[activeTabId.value]) {
      fileStore.fileContentMap[activeTabId.value].content = currentVal
    }
  }

  const lang = getLanguageFromName(activeFile.value?.name)
  const isJs =
    targetType === 'js' ||
    (targetType !== 'html' && (lang === 'javascript' || lang === 'typescript'))

  if (isJs) {
    isConsoleOpen.value = true
    executeJsFile(activeFile.value)
  } else {
    previewDialogRef?.value?.open()
  }
}

// Toggle Preview from StatusBar
const handleTogglePreview = () => {
  if (activeTabId.value && editorStore.editor) {
    const currentVal = editorStore.getValue()
    if (fileStore.fileContentMap[activeTabId.value]) {
      fileStore.fileContentMap[activeTabId.value].content = currentVal
    }
  }

  if (previewDialogRef.value) {
    previewDialogRef.value.toggle()
  }
}

// Global Keyboard Shortcuts via @vueuse/core onKeyStroke
// F5: Run project (Preview for HTML, Console for JS)
onKeyStroke('F5', (e) => {
  e.preventDefault()
  runProject()
})

// Cmd+S / Ctrl+S: Save & Export Workspace to user local
onKeyStroke(['s', 'S'], (e) => {
  if (e.metaKey || e.ctrlKey) {
    e.preventDefault()
    handleSaveWorkspace()
  }
})

// Cmd+B / Ctrl+B: Toggle primary sidebar
onKeyStroke(['b', 'B'], (e) => {
  if (e.metaKey || e.ctrlKey) {
    e.preventDefault()
    isSidebarOpen.value = !isSidebarOpen.value
  }
})

// Cmd+J / Ctrl+J: Toggle bottom console drawer
onKeyStroke(['j', 'J'], (e) => {
  if (e.metaKey || e.ctrlKey) {
    e.preventDefault()
    isConsoleOpen.value = !isConsoleOpen.value
  }
})

// Cmd+P / Ctrl+P: Open Quick File Search / Command Palette
onKeyStroke(['p', 'P'], (e) => {
  if (e.metaKey || e.ctrlKey) {
    e.preventDefault()
    isFileSearchOpen.value = !isFileSearchOpen.value
  }
})

// Cmd+Shift+F / Ctrl+Shift+F: Toggle / Focus Search panel
onKeyStroke(['f', 'F'], (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
    e.preventDefault()
    activeSidebarView.value = 'search'
    isSidebarOpen.value = true
    nextTick(() => {
      searchPanelRef.value?.focus()
    })
  }
})

// Cmd+Shift+E / Ctrl+Shift+E: Toggle / Focus File Explorer
onKeyStroke(['e', 'E'], (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
    e.preventDefault()
    activeSidebarView.value = 'explorer'
    isSidebarOpen.value = true
  }
})

// Workspace Save & Export
const handleSaveWorkspace = async () => {
  if (activeTabId.value && editorStore.editor) {
    const currentVal = editorStore.getValue()
    if (fileStore.fileContentMap[activeTabId.value]) {
      fileStore.fileContentMap[activeTabId.value].content = currentVal
    }
  }

  try {
    await exportWorkspaceZip(fileStore.filesMap, fileStore.fileContentMap)
    consoleStore.addLog({
      method: 'info',
      args: ['[Workspace Exported] js-editor-workspace.zip downloaded successfully.'],
      timestamp: new Date().toLocaleTimeString(),
    })
  } catch (err) {
    consoleStore.addLog({
      method: 'error',
      args: [`[Workspace Export Failed] ${err.message}`],
      timestamp: new Date().toLocaleTimeString(),
    })
  }
}

// Menu Search Actions
const handleOpenSearch = () => {
  activeSidebarView.value = 'search'
  isSidebarOpen.value = true
  nextTick(() => {
    searchPanelRef.value?.focus()
  })
}

const handleOpenReplace = () => {
  activeSidebarView.value = 'search'
  isSidebarOpen.value = true
  nextTick(() => {
    searchPanelRef.value?.openReplace()
    searchPanelRef.value?.focus()
  })
}

const handleToggleSearch = () => {
  if (activeSidebarView.value === 'search') {
    isSidebarOpen.value = !isSidebarOpen.value
    if (isSidebarOpen.value) {
      nextTick(() => {
        searchPanelRef.value?.focus()
      })
    }
  } else {
    activeSidebarView.value = 'search'
    isSidebarOpen.value = true
    nextTick(() => {
      searchPanelRef.value?.focus()
    })
  }
}

// Sidebar View Switching
const handleSelectSidebarView = (view) => {
  if (activeSidebarView.value === view) {
    isSidebarOpen.value = !isSidebarOpen.value
  } else {
    activeSidebarView.value = view
    isSidebarOpen.value = true
    if (view === 'search') {
      nextTick(() => {
        searchPanelRef.value?.focus()
      })
    }
  }
}

// Navigates to a match clicked in Search Panel
const handleSelectSearchMatch = ({ fileId, fileName, lineNumber, column, matchLength }) => {
  const fileItem = fileStore.fileContentMap[fileId] || { id: fileId, name: fileName }
  handleSelectFile(fileItem)
  editorStore.jumpToPosition(fileId, lineNumber, column, matchLength)
}

// Currently selected active file object
const activeFile = computed(() => {
  return fileContentMap.value[activeTabId.value] || null
})

// Display label for active document language in status bar
const activeLanguageLabel = computed(() => {
  if (!activeFile.value) return 'Plain Text'
  const lang = activeFile.value.language || 'text'
  if (lang === 'html') return 'HTML'
  if (lang === 'javascript') return 'JavaScript'
  if (lang === 'typescript') return 'TypeScript'
  if (lang === 'css') return 'CSS'
  if (lang === 'json') return 'JSON'
  if (lang === 'markdown') return 'Markdown'
  return lang.toUpperCase()
})

// File & Tab Operations
const handleSelectFile = (item) => {
  const fullPath = fileStore.getFilePath ? fileStore.getFilePath(item.id) : item.name
  if (!fileContentMap.value[item.id]) {
    const newContent = `// ${item.name}\n`
    fileStore.addFileContent(item.id, {
      id: item.id,
      name: item.name,
      path: fullPath,
      language: getLanguageFromName(item.name),
      content: newContent,
    })
    editorStore.createOrUpdateModel(item.id, fullPath || item.name, newContent, (fileId, content) => {
      if (fileContentMap.value[fileId]) {
        fileContentMap.value[fileId].content = content
      }
    })
  } else if (!fileContentMap.value[item.id].path && fullPath) {
    fileContentMap.value[item.id].path = fullPath
  }

  if (!openTabs.value.find((t) => t.id === item.id)) {
    openTabs.value.push({ id: item.id, name: item.name })
  }

  activeTabId.value = item.id
  editorStore.setActiveModel(item.id)
}

const handleSelectTab = (tabId) => {
  activeTabId.value = tabId
  editorStore.setActiveModel(tabId)
}

const handleCloseTab = (tabId) => {
  openTabs.value = openTabs.value.filter((t) => t.id !== tabId)
  if (activeTabId.value === tabId) {
    const nextTabId = openTabs.value[openTabs.value.length - 1]?.id || null
    activeTabId.value = nextTabId
    if (nextTabId) {
      editorStore.setActiveModel(nextTabId)
    }
  }
}

const handleRenameFile = ({ oldId, newId, newName }) => {
  const tab = openTabs.value.find((t) => t.id === oldId)
  if (tab) {
    tab.id = newId
    tab.name = newName
  }
  editorStore.renameModel(oldId, newId, newName, (fileId, content) => {
    if (fileContentMap.value[fileId]) {
      fileContentMap.value[fileId].content = content
    }
  })
  if (activeTabId.value === oldId) {
    activeTabId.value = newId
    editorStore.setActiveModel(newId)
  }
}

const handleDeleteFile = (item) => {
  if (item?.id) {
    editorStore.removeModel(item.id)
  }
  const remainingIds = new Set(fileStore.filesMap.map((f) => f.id))
  openTabs.value = openTabs.value.filter((t) => remainingIds.has(t.id))
  if (!remainingIds.has(activeTabId.value)) {
    const nextTabId = openTabs.value[openTabs.value.length - 1]?.id || null
    activeTabId.value = nextTabId
    if (nextTabId) {
      editorStore.setActiveModel(nextTabId)
    }
  }
}

const handleChangeLanguage = (newLang) => {
  if (activeFile.value) {
    activeFile.value.language = newLang.toLowerCase()
  }
}

watch(activeTabId, (newId) => {
  if (newId) {
    editorStore.setActiveModel(newId)
  }
})
</script>

<style scoped>
.app-window {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
  position: relative;
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.editor-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  min-width: 0;
  position: relative;
}
</style>
