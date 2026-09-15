<template>
  <aside class="file-explorer">
    <!-- Explorer Section Header -->
    <div class="explorer-header">
      <span class="explorer-title">EXPLORER</span>
      <div class="explorer-actions">
        <!-- New File -->
        <button
          class="icon-btn"
          title="New File"
          aria-label="New File"
          @click="startCreateItem('file')"
        >
          <IconNewFile :size="15" />
        </button>

        <!-- New Folder -->
        <button
          class="icon-btn"
          title="New Folder"
          aria-label="New Folder"
          @click="startCreateItem('folder')"
        >
          <IconNewFolder :size="15" />
        </button>

        <!-- Collapse / Expand All Folders -->
        <button
          class="icon-btn"
          :title="allCollapsed ? 'Expand All Folders' : 'Collapse All Folders'"
          :aria-label="allCollapsed ? 'Expand All Folders' : 'Collapse All Folders'"
          @click="toggleCollapseAll"
        >
          <IconCollapseAll v-if="!allCollapsed" :size="15" />
          <IconExpandAll v-else :size="15" />
        </button>

        <!-- Refresh Explorer -->
        <button
          class="icon-btn"
          title="Refresh Explorer"
          aria-label="Refresh Explorer"
          @click="refreshTree"
        >
          <IconRefresh :size="14" />
        </button>
      </div>
    </div>

    <!-- Workspace Project Root Banner -->
    <div
      class="workspace-banner"
      title="Toggle Workspace Root"
      @click="toggleRoot"
      @contextmenu.prevent="openContextMenu($event, null)"
    >
      <span class="chevron" :class="{ open: isRootOpen }">▸</span>
      <span class="workspace-name">JS-WORKSPACE</span>
    </div>

    <!-- Virtual File Tree -->
    <div
      v-show="isRootOpen"
      class="tree-container"
      @contextmenu.prevent="openContextMenu($event, null)"
    >
      <!-- Inline creation input for root level -->
      <div v-if="creatingItem && creatingItem.parentId === null" class="tree-item inline-create">
        <span class="item-icon">{{ creatingItem.type === 'folder' ? '📁' : '📄' }}</span>
        <div class="inline-input-wrapper">
          <input
            ref="createInputRef"
            v-model="newItemName"
            class="inline-input"
            :class="{ 'has-error': Boolean(nameConflictError) }"
            :placeholder="creatingItem.type === 'folder' ? 'folder-name' : 'filename.ext'"
            @keydown.enter="confirmCreate"
            @keydown.esc="cancelCreate"
            @blur="handleBlur"
          />
          <div v-if="nameConflictError" class="input-error-tooltip">
            <span class="tooltip-arrow"></span>
            <span class="tooltip-icon">⚠</span>
            <span class="tooltip-msg">{{ nameConflictError }}</span>
          </div>
        </div>
      </div>

      <!-- Tree Nodes -->
      <template v-for="item in fileTree" :key="item.id">
        <div
          class="tree-item"
          :class="{
            active: selectedFileId === item.id,
            folder: item.type === 'folder',
            'is-renaming': renamingItemId === item.id,
          }"
          :style="{ paddingLeft: `${(item.level || 0) * 14 + 12}px` }"
          @click="handleItemClick(item)"
          @contextmenu.prevent.stop="openContextMenu($event, item)"
        >
          <!-- Chevron for Folders -->
          <span
            v-if="item.type === 'folder'"
            class="chevron folder-chevron"
            :class="{ open: item.isOpen }"
          >
            ▸
          </span>
          <span v-else class="chevron-placeholder"></span>

          <!-- Node Type Icon / File Badge -->
          <span class="item-icon">
            <template v-if="item.type === 'folder'">
              <span v-if="item.isOpen" class="icon-folder open">📂</span>
              <span v-else class="icon-folder">📁</span>
            </template>
            <template v-else>
              <span :class="['file-badge', `file-${getFileExt(item.name)}`]">
                {{ getFileExt(item.name).toUpperCase() || 'TXT' }}
              </span>
            </template>
          </span>

          <!-- Node Label or Inline Rename Input -->
          <div v-if="renamingItemId === item.id" class="inline-input-wrapper" @click.stop>
            <input
              ref="renameInputRef"
              v-model="renameValue"
              class="inline-input"
              :class="{ 'has-error': Boolean(renameConflictError) }"
              @keydown.enter="confirmRename"
              @keydown.esc="cancelRename"
              @blur="handleRenameBlur"
            />
            <div v-if="renameConflictError" class="input-error-tooltip">
              <span class="tooltip-arrow"></span>
              <span class="tooltip-icon">⚠</span>
              <span class="tooltip-msg">{{ renameConflictError }}</span>
            </div>
          </div>
          <span v-else class="item-label">{{ item.name }}</span>
        </div>

        <!-- Inline create input inside folder -->
        <div
          v-if="creatingItem && creatingItem.parentId === item.id && item.isOpen"
          class="tree-item inline-create"
          :style="{ paddingLeft: `${((item.level || 0) + 1) * 14 + 12}px` }"
        >
          <span class="chevron-placeholder"></span>
          <span class="item-icon">{{ creatingItem.type === 'folder' ? '📁' : '📄' }}</span>
          <div class="inline-input-wrapper">
            <input
              ref="createInputRef"
              v-model="newItemName"
              class="inline-input"
              :class="{ 'has-error': Boolean(nameConflictError) }"
              :placeholder="creatingItem.type === 'folder' ? 'folder-name' : 'filename.ext'"
              @keydown.enter="confirmCreate"
              @keydown.esc="cancelCreate"
              @blur="handleBlur"
            />
            <div v-if="nameConflictError" class="input-error-tooltip">
              <span class="tooltip-arrow"></span>
              <span class="tooltip-icon">⚠</span>
              <span class="tooltip-msg">{{ nameConflictError }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Context Menu for Files & Folders -->
    <Teleport to="body">
      <div
        v-if="contextMenu.isOpen"
        ref="contextMenuRef"
        class="explorer-context-menu"
        :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
        @click.stop
      >
        <button class="menu-action-item" @click="handleMenuNewFile">
          <span class="menu-label">New File</span>
        </button>

        <button class="menu-action-item" @click="handleMenuNewFolder">
          <span class="menu-label">New Folder</span>
        </button>

        <div class="menu-divider"></div>

        <template v-if="contextMenu.targetItem">
          <button class="menu-action-item" @click="handleMenuRename">
            <span class="menu-label">Rename</span>
            <span class="menu-shortcut">Enter</span>
          </button>

          <button class="menu-action-item danger" @click="handleMenuDelete">
            <span class="menu-label">Delete</span>
            <span class="menu-shortcut">Del</span>
          </button>

          <div class="menu-divider"></div>

          <button class="menu-action-item" @click="handleMenuCopyPath">
            <span class="menu-label">Copy Path</span>
            <span class="menu-shortcut">⇧⌥C</span>
          </button>
        </template>
      </div>
    </Teleport>
  </aside>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { useStorage, onKeyStroke, onClickOutside, useClipboard } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useFilesStore } from '@/stores/filesStore'
import { getFileExt } from '@/utils/fileUtils'
import {
  IconNewFile,
  IconNewFolder,
  IconCollapseAll,
  IconExpandAll,
  IconRefresh,
} from '@/components/icons'

const props = defineProps({
  selectedFileId: {
    type: String,
    default: 'index-html',
  },
})

const emit = defineEmits(['select-file', 'rename-file', 'delete-file'])

const filesStore = useFilesStore()
const { filesMap } = storeToRefs(filesStore)
const { copy } = useClipboard()

// Persistent root folder expansion
const isRootOpen = useStorage('explorer_root_open', true)
const createInputRef = ref(null)
const newItemName = ref('')
const creatingItem = ref(null) // { type: 'file'|'folder', parentId: string|null }

// Context Menu State
const contextMenuRef = ref(null)
const contextMenu = ref({
  isOpen: false,
  x: 0,
  y: 0,
  targetItem: null,
})

const openContextMenu = (e, item = null) => {
  e.preventDefault()
  e.stopPropagation()
  const menuWidth = 190
  const menuHeight = item ? 170 : 80
  const x =
    e.clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 8 : e.clientX
  const y =
    e.clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 8 : e.clientY

  contextMenu.value = {
    isOpen: true,
    x,
    y,
    targetItem: item,
  }
}

const closeContextMenu = () => {
  contextMenu.value.isOpen = false
  contextMenu.value.targetItem = null
}

const handleMenuNewFile = () => {
  const item = contextMenu.value.targetItem
  closeContextMenu()
  startCreateFromItem('file', item)
}

const handleMenuNewFolder = () => {
  const item = contextMenu.value.targetItem
  closeContextMenu()
  startCreateFromItem('folder', item)
}

onClickOutside(contextMenuRef, () => {
  if (contextMenu.value.isOpen) closeContextMenu()
})

// Inline Rename State
const renamingItemId = ref(null)
const renameValue = ref('')
const renameInputRef = ref(null)

const renameConflictError = computed(() => {
  if (!renamingItemId.value || !renameValue.value.trim()) return ''
  const currentItem = filesMap.value.find((f) => f.id === renamingItemId.value)
  if (!currentItem) return ''
  const trimmed = renameValue.value.trim().toLowerCase()
  if (trimmed === currentItem.name.toLowerCase()) return ''
  const exists = filesMap.value.some((file) => {
    return (
      file.id !== currentItem.id &&
      file.parentId === currentItem.parentId &&
      file.name.toLowerCase() === trimmed
    )
  })
  if (exists) {
    return `'${renameValue.value.trim()}' already exists. Please choose a different name.`
  }
  return ''
})

const handleMenuRename = () => {
  const item = contextMenu.value.targetItem
  closeContextMenu()
  if (!item) return
  renamingItemId.value = item.id
  renameValue.value = item.name
  nextTick(() => {
    if (renameInputRef.value) {
      const el = Array.isArray(renameInputRef.value)
        ? renameInputRef.value[0]
        : renameInputRef.value
      el?.focus()
      const dotIndex = item.name.lastIndexOf('.')
      if (dotIndex > 0) {
        el?.setSelectionRange(0, dotIndex)
      } else {
        el?.select()
      }
    }
  })
}

const confirmRename = () => {
  if (!renamingItemId.value || !renameValue.value.trim() || renameConflictError.value) {
    cancelRename()
    return
  }
  const newName = renameValue.value.trim()
  const targetId = renamingItemId.value
  filesStore.renameFile(targetId, newName)
  emit('rename-file', { oldId: targetId, newId: newName, newName })
  cancelRename()
}

const handleRenameBlur = () => {
  if (renameConflictError.value) {
    cancelRename()
  } else {
    confirmRename()
  }
}

const cancelRename = () => {
  renamingItemId.value = null
  renameValue.value = ''
}

const handleMenuDelete = () => {
  const item = contextMenu.value.targetItem
  closeContextMenu()
  if (!item) return
  filesStore.deleteFile(item.id)
  emit('delete-file', item)
}

const handleMenuCopyPath = () => {
  if (contextMenu.value.targetItem) {
    const fullPath =
      filesStore.getFilePath(contextMenu.value.targetItem.id) || contextMenu.value.targetItem.name
    copy(fullPath)
  }
  closeContextMenu()
}

// Global hotkey: Escape cancels context menu, renaming, or creation via @vueuse/core
onKeyStroke('Escape', (e) => {
  if (contextMenu.value.isOpen) {
    e.preventDefault()
    closeContextMenu()
    return
  }
  if (renamingItemId.value) {
    e.preventDefault()
    cancelRename()
    return
  }
  if (creatingItem.value) {
    e.preventDefault()
    cancelCreate()
  }
})

// Computed tree hierarchy based on folder expansion state with VS Code sorting:
// Folders appear above files, and items within each category are sorted ascending (A-Z)
const fileTree = computed(() => {
  const sortNodes = (a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    return (a.name || '').localeCompare(b.name || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  }

  const result = []
  const visited = new Set()

  const traverse = (parentId, level) => {
    const children = filesMap.value.filter((item) => {
      if (!parentId) {
        return !item.parentId
      }
      return item.parentId === parentId
    })

    children.sort(sortNodes)

    for (const item of children) {
      if (visited.has(item.id)) continue
      visited.add(item.id)

      result.push({
        ...item,
        level,
      })

      if (item.type === 'folder' && item.isOpen) {
        traverse(item.id, level + 1)
      }
    }
  }

  traverse(null, 0)
  return result
})

const allCollapsed = computed(() => {
  return filesMap.value.filter((i) => i.type === 'folder').every((f) => !f.isOpen)
})

const toggleRoot = () => {
  isRootOpen.value = !isRootOpen.value
}

const toggleCollapseAll = () => {
  const shouldOpen = allCollapsed.value
  filesMap.value.forEach((item) => {
    if (item.type === 'folder') {
      item.isOpen = shouldOpen
    }
  })
}

const refreshTree = () => {
  // Triggers reactivity check / reset
  filesMap.value = [...filesMap.value]
}

const handleItemClick = (item) => {
  if (item.type === 'folder') {
    item.isOpen = !item.isOpen
  } else {
    emit('select-file', item)
  }
}

const startCreateFromItem = (type, targetItem) => {
  let targetParentId = null
  if (targetItem) {
    if (targetItem.type === 'folder') {
      targetParentId = targetItem.id
      targetItem.isOpen = true
    } else {
      targetParentId = targetItem.parentId
    }
  }

  if (!isRootOpen.value) {
    isRootOpen.value = true
  }

  creatingItem.value = { type, parentId: targetParentId }
  newItemName.value = ''
  nextTick(() => {
    if (createInputRef.value) {
      const el = Array.isArray(createInputRef.value)
        ? createInputRef.value[0]
        : createInputRef.value
      el?.focus()
    }
  })
}

const startCreateItem = (type) => {
  const selectedItem = filesMap.value.find((i) => i.id === props.selectedFileId)
  startCreateFromItem(type, selectedItem)
}

const nameConflictError = computed(() => {
  if (!creatingItem.value || !newItemName.value.trim()) return ''
  const trimmed = newItemName.value.trim().toLowerCase()
  const exists = filesMap.value.some((file) => {
    return file.parentId === creatingItem.value.parentId && file.name.toLowerCase() === trimmed
  })
  if (exists) {
    return `'${newItemName.value.trim()}' already exists. Please choose a different name.`
  }
  return ''
})

const confirmCreate = () => {
  if (!newItemName.value.trim() || !creatingItem.value) {
    cancelCreate()
    return
  }

  if (nameConflictError.value) {
    return
  }

  const newItem = {
    id: newItemName.value.trim(),
    name: newItemName.value.trim(),
    type: creatingItem.value.type,
    parentId: creatingItem.value.parentId,
    isOpen: true,
  }

  filesStore.addFile(newItem)

  if (newItem.type === 'file') {
    emit('select-file', newItem)
  }

  cancelCreate()
}

const handleBlur = () => {
  if (nameConflictError.value) {
    cancelCreate()
  } else {
    confirmCreate()
  }
}

const cancelCreate = () => {
  creatingItem.value = null
  newItemName.value = ''
}

/*
 * NEXT PHASE:
 * 1. Drag-and-drop file reordering & moving between directories.
 * 2. File upload via drag-and-drop from OS desktop.
 * 3. Multi-selection (Cmd/Ctrl + click, Shift + click).
 * 4. Duplicate file action in context menu.
 */
</script>

<style scoped>
.file-explorer {
  width: 250px;
  min-width: 200px;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  user-select: none;
  font-size: 13px;
}

.explorer-header {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  letter-spacing: 0.5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
}

.explorer-actions {
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

.workspace-banner {
  height: 26px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
}

.workspace-banner:hover {
  background: rgba(255, 255, 255, 0.05);
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

.chevron-placeholder {
  width: 11px;
  display: inline-block;
}

.workspace-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 4px;
}

.tree-item {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-primary);
  transition: background 0.1s ease;
  padding-right: 8px;
}

.tree-item:hover {
  background: var(--bg-hover);
}

.tree-item.active {
  background: var(--bg-selected);
  color: var(--text-bright);
}

.item-icon {
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
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

.item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inline-create {
  background: var(--bg-selected);
  position: relative;
  overflow: visible;
  height: auto;
  min-height: 26px;
  padding-top: 2px;
  padding-bottom: 2px;
}

.inline-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.inline-input {
  width: 100%;
  background: #121212;
  border: 1px solid var(--accent-blue);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  outline: none;
  font-family: inherit;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.inline-input.has-error {
  border-color: #f14c4c;
  background-color: #3b1c1c;
}

.input-error-tooltip {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  z-index: 1000;
  background: #5a1d1d;
  border: 1px solid #be1100;
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  line-height: 1.35;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  gap: 6px;
  pointer-events: none;
  max-width: 220px;
  word-break: break-word;
  animation: tooltipFadeIn 0.15s ease;
}

.tooltip-arrow {
  position: absolute;
  top: -5px;
  left: 10px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid #be1100;
}

.tooltip-icon {
  color: #f87171;
  font-size: 11px;
  line-height: 1.2;
  flex-shrink: 0;
}

.tooltip-msg {
  flex: 1;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Context Menu */
.explorer-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 190px;
  background: #252526;
  border: 1px solid #454545;
  border-radius: 5px;
  padding: 4px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  user-select: none;
  font-family: var(--font-sans);
  font-size: 12px;
}

.menu-action-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.1s,
    color 0.1s;
}

.menu-action-item:hover {
  background: var(--accent-blue);
  color: #ffffff;
}

.menu-action-item.danger:hover {
  background: #c72e2e;
  color: #ffffff;
}

.menu-label {
  flex: 1;
}

.menu-shortcut {
  font-size: 10px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-left: 12px;
}

.menu-action-item:hover .menu-shortcut {
  color: rgba(255, 255, 255, 0.85);
}

.menu-divider {
  height: 1px;
  background: #3e3e42;
  margin: 4px 0;
}
</style>
